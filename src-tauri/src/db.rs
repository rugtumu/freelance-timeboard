use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkLog {
    pub id: String,
    pub date: String,
    pub hours: f64,
    pub rate_usd: f64,
    pub usd_try: f64,
    pub note: String,
    pub cycle_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expense {
    pub id: String,
    pub date: String,
    pub amount: f64,
    pub currency: String,
    pub category: String,
    pub note: String,
}

fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir error: {e}"))?;

    fs::create_dir_all(&dir).map_err(|e| format!("create app data dir error: {e}"))?;
    Ok(dir.join("work-tracker.db"))
}

fn open_conn(app: &tauri::AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    let conn = Connection::open(path).map_err(|e| format!("db open error: {e}"))?;
    Ok(conn)
}

pub fn init_db(app: &tauri::AppHandle) -> Result<(), String> {
    let conn = open_conn(app)?;
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS logs (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL UNIQUE,
          hours REAL NOT NULL,
          rate_usd REAL NOT NULL,
          usd_try REAL NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          cycle_id TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          category TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT ''
        );
        ",
    )
    .map_err(|e| format!("init schema error: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn db_get_logs(app: tauri::AppHandle) -> Result<Vec<WorkLog>, String> {
    let conn = open_conn(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, date, hours, rate_usd, usd_try, note, cycle_id
             FROM logs
             ORDER BY date ASC",
        )
        .map_err(|e| format!("prepare select logs error: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(WorkLog {
                id: row.get(0)?,
                date: row.get(1)?,
                hours: row.get(2)?,
                rate_usd: row.get(3)?,
                usd_try: row.get(4)?,
                note: row.get(5)?,
                cycle_id: row.get(6)?,
            })
        })
        .map_err(|e| format!("query logs error: {e}"))?;

    let mut logs = Vec::new();
    for row in rows {
        logs.push(row.map_err(|e| format!("row map logs error: {e}"))?);
    }

    Ok(logs)
}

#[tauri::command]
pub fn db_upsert_log(app: tauri::AppHandle, log: WorkLog) -> Result<(), String> {
    let conn = open_conn(&app)?;
    conn.execute(
        "
        INSERT INTO logs (id, date, hours, rate_usd, usd_try, note, cycle_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        ON CONFLICT(date) DO UPDATE SET
          id = excluded.id,
          hours = excluded.hours,
          rate_usd = excluded.rate_usd,
          usd_try = excluded.usd_try,
          note = excluded.note,
          cycle_id = excluded.cycle_id
        ",
        params![
            log.id,
            log.date,
            log.hours,
            log.rate_usd,
            log.usd_try,
            log.note,
            log.cycle_id
        ],
    )
    .map_err(|e| format!("upsert log error: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn db_delete_log(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let conn = open_conn(&app)?;
    conn.execute("DELETE FROM logs WHERE id = ?1", params![id])
        .map_err(|e| format!("delete log error: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn db_replace_logs(app: tauri::AppHandle, logs: Vec<WorkLog>) -> Result<(), String> {
    let mut conn = open_conn(&app)?;
    let tx = conn
        .transaction()
        .map_err(|e| format!("transaction start error: {e}"))?;

    tx.execute("DELETE FROM logs", [])
        .map_err(|e| format!("replace logs clear error: {e}"))?;

    {
        let mut stmt = tx
            .prepare(
                "
            INSERT INTO logs (id, date, hours, rate_usd, usd_try, note, cycle_id)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            )
            .map_err(|e| format!("replace logs prepare error: {e}"))?;

        for log in logs {
            stmt.execute(params![
                log.id,
                log.date,
                log.hours,
                log.rate_usd,
                log.usd_try,
                log.note,
                log.cycle_id
            ])
            .map_err(|e| format!("replace logs insert error: {e}"))?;
        }
    }

    tx.commit()
        .map_err(|e| format!("replace logs commit error: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn db_get_settings(app: tauri::AppHandle) -> Result<HashMap<String, String>, String> {
    let conn = open_conn(&app)?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings")
        .map_err(|e| format!("prepare select settings error: {e}"))?;

    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| format!("query settings error: {e}"))?;

    let mut map = HashMap::new();
    for row in rows {
        let (k, v) = row.map_err(|e| format!("row map settings error: {e}"))?;
        map.insert(k, v);
    }

    Ok(map)
}

#[tauri::command]
pub fn db_set_settings(
    app: tauri::AppHandle,
    settings: HashMap<String, String>,
) -> Result<(), String> {
    let mut conn = open_conn(&app)?;
    let tx = conn
        .transaction()
        .map_err(|e| format!("settings transaction start error: {e}"))?;

    tx.execute("DELETE FROM settings", [])
        .map_err(|e| format!("settings clear error: {e}"))?;

    {
        let mut stmt = tx
            .prepare("INSERT INTO settings (key, value) VALUES (?1, ?2)")
            .map_err(|e| format!("settings prepare insert error: {e}"))?;
        for (k, v) in settings {
            stmt.execute(params![k, v])
                .map_err(|e| format!("settings insert error: {e}"))?;
        }
    }

    tx.commit()
        .map_err(|e| format!("settings commit error: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn db_get_expenses(app: tauri::AppHandle) -> Result<Vec<Expense>, String> {
    let conn = open_conn(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, date, amount, currency, category, note
             FROM expenses
             ORDER BY date ASC",
        )
        .map_err(|e| format!("prepare select expenses error: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Expense {
                id: row.get(0)?,
                date: row.get(1)?,
                amount: row.get(2)?,
                currency: row.get(3)?,
                category: row.get(4)?,
                note: row.get(5)?,
            })
        })
        .map_err(|e| format!("query expenses error: {e}"))?;

    let mut expenses = Vec::new();
    for row in rows {
        expenses.push(row.map_err(|e| format!("row map expenses error: {e}"))?);
    }

    Ok(expenses)
}

#[tauri::command]
pub fn db_upsert_expense(app: tauri::AppHandle, expense: Expense) -> Result<(), String> {
    let conn = open_conn(&app)?;
    conn.execute(
        "
        INSERT INTO expenses (id, date, amount, currency, category, note)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        ON CONFLICT(id) DO UPDATE SET
          date = excluded.date,
          amount = excluded.amount,
          currency = excluded.currency,
          category = excluded.category,
          note = excluded.note
        ",
        params![
            expense.id,
            expense.date,
            expense.amount,
            expense.currency,
            expense.category,
            expense.note
        ],
    )
    .map_err(|e| format!("upsert expense error: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn db_delete_expense(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let conn = open_conn(&app)?;
    conn.execute("DELETE FROM expenses WHERE id = ?1", params![id])
        .map_err(|e| format!("delete expense error: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn save_text_file(app: tauri::AppHandle, filename: String, content: String) -> Result<String, String> {
    let safe_name = filename
        .chars()
        .map(|c| if matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') { '_' } else { c })
        .collect::<String>();

    let dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().desktop_dir())
        .or_else(|_| app.path().app_data_dir())
        .map_err(|e| format!("resolve output dir error: {e}"))?;

    fs::create_dir_all(&dir).map_err(|e| format!("create output dir error: {e}"))?;

    let path = dir.join(safe_name);
    fs::write(&path, content).map_err(|e| format!("write file error: {e}"))?;

    Ok(path.to_string_lossy().to_string())
}
