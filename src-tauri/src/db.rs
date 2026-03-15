use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use serde_json::Value;
use keyring::Entry;
use aes_gcm::{Aes256Gcm, aead::KeyInit};
use aes_gcm::aead::Aead;
use rand::rngs::OsRng;
use rand::RngCore;
use pbkdf2::pbkdf2_hmac;
use base64::Engine as _;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Investment {
    pub id: String,
    pub symbol: String,
    pub name: String,
    pub asset_type: String,
    pub amount: f64,
    pub avg_cost: f64,
    pub price: f64,
    pub currency: String,
    pub sector: String,
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

fn keyring_entry(exchange: &str) -> Result<Entry, String> {
    Entry::new("freelance-timeboard", exchange).map_err(|e| format!("keyring entry error: {e}"))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ExchangeKey {
    api_key: String,
    api_secret: String,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
struct VaultBlob {
    salt: String,
    nonce: String,
    ciphertext: String,
}

fn vault_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir error: {e}"))?;
    let vault = dir.join("keyvault");
    fs::create_dir_all(&vault).map_err(|e| format!("create vault dir error: {e}"))?;
    Ok(vault)
}

fn vault_path(app: &tauri::AppHandle, exchange: &str) -> Result<PathBuf, String> {
    Ok(vault_dir(app)?.join(format!("{exchange}.json")))
}

fn derive_key(password: &str, salt: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, 100_000, &mut key);
    key
}

fn vault_write(app: &tauri::AppHandle, exchange: &str, password: &str, key: &ExchangeKey) -> Result<(), String> {
    let mut salt = [0u8; 16];
    let mut nonce = [0u8; 12];
    OsRng.fill_bytes(&mut salt);
    OsRng.fill_bytes(&mut nonce);
    let derived = derive_key(password, &salt);
    let cipher = Aes256Gcm::new_from_slice(&derived).map_err(|e| format!("cipher init error: {e}"))?;
    let plaintext = serde_json::to_vec(key).map_err(|e| format!("vault serialize error: {e}"))?;
    let ciphertext = cipher
        .encrypt(nonce.as_ref().into(), plaintext.as_ref())
        .map_err(|e| format!("vault encrypt error: {e}"))?;

    let blob = VaultBlob {
        salt: base64::engine::general_purpose::STANDARD.encode(salt),
        nonce: base64::engine::general_purpose::STANDARD.encode(nonce),
        ciphertext: base64::engine::general_purpose::STANDARD.encode(ciphertext),
    };

    let path = vault_path(app, exchange)?;
    let data = serde_json::to_vec(&blob).map_err(|e| format!("vault encode error: {e}"))?;
    fs::write(path, data).map_err(|e| format!("vault write error: {e}"))?;
    Ok(())
}

fn vault_read(app: &tauri::AppHandle, exchange: &str, password: &str) -> Result<ExchangeKey, String> {
    let path = vault_path(app, exchange)?;
    let data = fs::read(path).map_err(|e| format!("vault read error: {e}"))?;
    let blob: VaultBlob = serde_json::from_slice(&data).map_err(|e| format!("vault decode error: {e}"))?;
    let salt = base64::engine::general_purpose::STANDARD
        .decode(blob.salt)
        .map_err(|e| format!("vault salt decode error: {e}"))?;
    let nonce = base64::engine::general_purpose::STANDARD
        .decode(blob.nonce)
        .map_err(|e| format!("vault nonce decode error: {e}"))?;
    let ciphertext = base64::engine::general_purpose::STANDARD
        .decode(blob.ciphertext)
        .map_err(|e| format!("vault ciphertext decode error: {e}"))?;

    let derived = derive_key(password, &salt);
    let cipher = Aes256Gcm::new_from_slice(&derived).map_err(|e| format!("cipher init error: {e}"))?;
    let plaintext = cipher
        .decrypt(nonce.as_slice().into(), ciphertext.as_ref())
        .map_err(|e| format!("vault decrypt error: {e}"))?;
    serde_json::from_slice(&plaintext).map_err(|e| format!("vault parse error: {e}"))
}

fn vault_exists(app: &tauri::AppHandle, exchange: &str) -> bool {
    vault_path(app, exchange).map(|p| p.exists()).unwrap_or(false)
}

#[tauri::command]
pub fn secure_store_exchange_key(exchange: String, api_key: String, api_secret: String, vault_password: Option<String>, app: tauri::AppHandle) -> Result<(), String> {
    let entry = keyring_entry(&exchange)?;
    let key = ExchangeKey { api_key, api_secret };
    let payload = serde_json::to_string(&key)
        .map_err(|e| format!("key serialize error: {e}"))?;
    let keyring_res = entry.set_password(&payload);
    if let Some(pass) = vault_password.as_deref() {
        vault_write(&app, &exchange, pass, &key)?;
    }
    match keyring_res {
        Ok(_) => Ok(()),
        Err(err) => {
            if vault_password.is_some() {
                Ok(())
            } else {
                Err(format!("keyring set error: {err}"))
            }
        }
    }
}

#[tauri::command]
pub fn secure_delete_exchange_key(exchange: String, app: tauri::AppHandle) -> Result<(), String> {
    let entry = keyring_entry(&exchange)?;
    let _ = entry.delete_credential();
    if let Ok(path) = vault_path(&app, &exchange) {
        let _ = fs::remove_file(path);
    }
    Ok(())
}

#[tauri::command]
pub fn secure_exchange_status(exchanges: Vec<String>, vault_password: Option<String>, app: tauri::AppHandle) -> Result<HashMap<String, bool>, String> {
    let mut out = HashMap::new();
    for ex in exchanges {
        let entry = keyring_entry(&ex)?;
        let ok = entry.get_password().map(|_| true).unwrap_or(false);
        if ok {
            out.insert(ex, true);
            continue;
        }
        let exists = if let Some(pass) = vault_password.as_deref() {
            vault_read(&app, &ex, pass).is_ok()
        } else {
            vault_exists(&app, &ex)
        };
        out.insert(ex, exists);
    }
    Ok(out)
}


fn get_exchange_key_with_fallback(app: &tauri::AppHandle, exchange: &str, vault_password: Option<String>) -> Result<ExchangeKey, String> {
    let entry = keyring_entry(exchange)?;
    if let Ok(raw) = entry.get_password() {
        return serde_json::from_str(&raw).map_err(|e| format!("key parse error: {e}"));
    }
    if let Some(pass) = vault_password {
        return vault_read(app, exchange, &pass);
    }
    Err("missing bybit credentials".into())
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

        CREATE TABLE IF NOT EXISTS investments (
          id TEXT PRIMARY KEY,
          symbol TEXT NOT NULL,
          name TEXT NOT NULL,
          asset_type TEXT NOT NULL,
          amount REAL NOT NULL,
          avg_cost REAL NOT NULL,
          price REAL NOT NULL,
          currency TEXT NOT NULL,
          sector TEXT NOT NULL,
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
pub async fn bybit_fetch_investments(app: tauri::AppHandle, vault_password: Option<String>) -> Result<Vec<Investment>, String> {
    let creds = get_exchange_key_with_fallback(&app, "bybit", vault_password)?;
    if creds.api_key.is_empty() || creds.api_secret.is_empty() {
        return Err("missing bybit credentials".into());
    }

    let recv_window = "5000";
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("time error: {e}"))?
        .as_millis()
        .to_string();
    let query = "accountType=UNIFIED";
    let payload = format!("{timestamp}{}{recv_window}{query}", creds.api_key);

    let mut mac = <Hmac<Sha256> as Mac>::new_from_slice(creds.api_secret.as_bytes())
        .map_err(|e| format!("hmac init error: {e}"))?;
    mac.update(payload.as_bytes());
    let sign = hex::encode(mac.finalize().into_bytes());

    let client = reqwest::Client::new();
    let url = format!("https://api.bybit.com/v5/account/wallet-balance?{query}");
    let res = client
        .get(url)
        .header("X-BAPI-API-KEY", creds.api_key.clone())
        .header("X-BAPI-SIGN", sign)
        .header("X-BAPI-SIGN-TYPE", "2")
        .header("X-BAPI-TIMESTAMP", timestamp)
        .header("X-BAPI-RECV-WINDOW", recv_window)
        .send()
        .await
        .map_err(|e| format!("bybit request error: {e}"))?;

    let json: Value = res.json().await.map_err(|e| format!("bybit json error: {e}"))?;
    if let Some(code) = json["retCode"].as_i64() {
        if code != 0 {
            let msg = json["retMsg"].as_str().unwrap_or("unknown error");
            return Err(format!("bybit api error {code}: {msg}"));
        }
    }
    let coins = json["result"]["list"][0]["coin"]
        .as_array()
        .ok_or_else(|| "bybit response missing coins".to_string())?;

    let mut investments = Vec::new();
    for coin in coins {
        let symbol = coin["coin"].as_str().unwrap_or("").to_string();
        let balance = coin["walletBalance"].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
        if symbol.is_empty() || balance <= 0.0 {
            continue;
        }

        let is_cash = matches!(symbol.as_str(), "USDT" | "USDC" | "USD");
    let price = if is_cash {
        1.0
    } else {
        fetch_bybit_spot_price(&client, &symbol).await.unwrap_or(0.0)
    };
    let avg_cost = if is_cash {
        1.0
    } else {
        fetch_bybit_avg_cost(&client, &creds, &symbol).await.unwrap_or(0.0)
    };
        let price = if price <= 0.0 { 0.0 } else { price };

        investments.push(Investment {
            id: format!("bybit-{symbol}"),
            symbol: symbol.clone(),
            name: symbol.clone(),
            asset_type: if is_cash { "Cash".into() } else { "Crypto".into() },
            amount: balance,
            avg_cost,
            price,
            currency: "USD".into(),
            sector: if is_cash { "Cash".into() } else { "Crypto".into() },
            note: "Bybit".into(),
        });
    }

    Ok(investments)
}

async fn fetch_bybit_spot_price(client: &reqwest::Client, symbol: &str) -> Result<f64, String> {
    let market = format!("{}USDT", symbol);
    let url = format!(
        "https://api.bybit.com/v5/market/tickers?category=spot&symbol={market}"
    );
    let res = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("bybit ticker error: {e}"))?;
    let json: Value = res.json().await.map_err(|e| format!("bybit ticker json error: {e}"))?;
    let price_str = json["result"]["list"][0]["lastPrice"].as_str().unwrap_or("0");
    let price = price_str.parse::<f64>().unwrap_or(0.0);
    Ok(price)
}

async fn fetch_bybit_avg_cost(client: &reqwest::Client, creds: &ExchangeKey, symbol: &str) -> Result<f64, String> {
    let market = format!("{}USDT", symbol);
    let recv_window = "5000";
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("time error: {e}"))?
        .as_millis()
        .to_string();
    let query = format!("category=spot&symbol={market}&limit=50");
    let payload = format!("{timestamp}{}{recv_window}{query}", creds.api_key);

    let mut mac = <Hmac<Sha256> as Mac>::new_from_slice(creds.api_secret.as_bytes())
        .map_err(|e| format!("hmac init error: {e}"))?;
    mac.update(payload.as_bytes());
    let sign = hex::encode(mac.finalize().into_bytes());

    let url = format!("https://api.bybit.com/v5/execution/list?{query}");
    let res = client
        .get(url)
        .header("X-BAPI-API-KEY", creds.api_key.clone())
        .header("X-BAPI-SIGN", sign)
        .header("X-BAPI-SIGN-TYPE", "2")
        .header("X-BAPI-TIMESTAMP", timestamp)
        .header("X-BAPI-RECV-WINDOW", recv_window)
        .send()
        .await
        .map_err(|e| format!("bybit execution error: {e}"))?;

    let json: Value = res.json().await.map_err(|e| format!("bybit execution json error: {e}"))?;
    if let Some(code) = json["retCode"].as_i64() {
        if code != 0 {
            let msg = json["retMsg"].as_str().unwrap_or("unknown error");
            return Err(format!("bybit execution error {code}: {msg}"));
        }
    }

    let empty: Vec<Value> = Vec::new();
    let list = json["result"]["list"].as_array().unwrap_or(&empty);
    let mut qty_sum = 0.0;
    let mut cost_sum = 0.0;
    for item in list {
        let side = item["side"].as_str().unwrap_or("");
        if side != "Buy" {
            continue;
        }
        let qty = item["execQty"].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
        let price = item["execPrice"].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
        if qty <= 0.0 || price <= 0.0 {
            continue;
        }
        qty_sum += qty;
        cost_sum += qty * price;
    }

    if qty_sum <= 0.0 {
        return Err("no buy executions".into());
    }
    Ok(cost_sum / qty_sum)
}

#[tauri::command]
pub fn db_get_investments(app: tauri::AppHandle) -> Result<Vec<Investment>, String> {
    let conn = open_conn(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, symbol, name, asset_type, amount, avg_cost, price, currency, sector, note
             FROM investments
             ORDER BY symbol ASC",
        )
        .map_err(|e| format!("prepare select investments error: {e}"))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Investment {
                id: row.get(0)?,
                symbol: row.get(1)?,
                name: row.get(2)?,
                asset_type: row.get(3)?,
                amount: row.get(4)?,
                avg_cost: row.get(5)?,
                price: row.get(6)?,
                currency: row.get(7)?,
                sector: row.get(8)?,
                note: row.get(9)?,
            })
        })
        .map_err(|e| format!("query investments error: {e}"))?;

    let mut investments = Vec::new();
    for row in rows {
        investments.push(row.map_err(|e| format!("row map investments error: {e}"))?);
    }

    Ok(investments)
}

#[tauri::command]
pub fn db_upsert_investment(app: tauri::AppHandle, investment: Investment) -> Result<(), String> {
    let conn = open_conn(&app)?;
    conn.execute(
        "
        INSERT INTO investments (id, symbol, name, asset_type, amount, avg_cost, price, currency, sector, note)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ON CONFLICT(id) DO UPDATE SET
          symbol = excluded.symbol,
          name = excluded.name,
          asset_type = excluded.asset_type,
          amount = excluded.amount,
          avg_cost = excluded.avg_cost,
          price = excluded.price,
          currency = excluded.currency,
          sector = excluded.sector,
          note = excluded.note
        ",
        params![
            investment.id,
            investment.symbol,
            investment.name,
            investment.asset_type,
            investment.amount,
            investment.avg_cost,
            investment.price,
            investment.currency,
            investment.sector,
            investment.note
        ],
    )
    .map_err(|e| format!("upsert investment error: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn db_delete_investment(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let conn = open_conn(&app)?;
    conn.execute("DELETE FROM investments WHERE id = ?1", params![id])
        .map_err(|e| format!("delete investment error: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn db_replace_investments(app: tauri::AppHandle, investments: Vec<Investment>) -> Result<(), String> {
    let mut conn = open_conn(&app)?;
    let tx = conn
        .transaction()
        .map_err(|e| format!("investments transaction start error: {e}"))?;

    tx.execute("DELETE FROM investments", [])
        .map_err(|e| format!("replace investments clear error: {e}"))?;

    {
        let mut stmt = tx
            .prepare(
                "
            INSERT INTO investments (id, symbol, name, asset_type, amount, avg_cost, price, currency, sector, note)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            ",
            )
            .map_err(|e| format!("replace investments prepare error: {e}"))?;

        for investment in investments {
            stmt.execute(params![
                investment.id,
                investment.symbol,
                investment.name,
                investment.asset_type,
                investment.amount,
                investment.avg_cost,
                investment.price,
                investment.currency,
                investment.sector,
                investment.note
            ])
            .map_err(|e| format!("replace investments insert error: {e}"))?;
        }
    }

    tx.commit()
        .map_err(|e| format!("replace investments commit error: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn save_text_file(app: tauri::AppHandle, filename: String, content: String) -> Result<String, String> {
    let safe_name = filename
        .chars()
        .map(|c| if matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') { '_' } else { c })
        .collect::<String>();

    #[cfg(not(mobile))]
    let dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().desktop_dir())
        .or_else(|_| app.path().app_data_dir())
        .map_err(|e| format!("resolve output dir error: {e}"))?;

    #[cfg(mobile)]
    let dir = app
        .path()
        .download_dir()
        .or_else(|_| app.path().app_data_dir())
        .map_err(|e| format!("resolve output dir error: {e}"))?;

    fs::create_dir_all(&dir).map_err(|e| format!("create output dir error: {e}"))?;

    let path = dir.join(safe_name);
    fs::write(&path, content).map_err(|e| format!("write file error: {e}"))?;

    Ok(path.to_string_lossy().to_string())
}
