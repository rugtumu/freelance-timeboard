use axum::{
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    net::SocketAddr,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use time::OffsetDateTime;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    db_path: PathBuf,
    tokens: Arc<Mutex<HashSet<String>>>,
    username: String,
    password: String,
}

#[derive(Serialize)]
struct HealthResponse {
    ok: bool,
    version: String,
}

#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Serialize)]
struct LoginResponse {
    token: String,
}

#[derive(Deserialize)]
struct ChangesQuery {
    since: Option<String>,
}

#[derive(Serialize)]
struct ChangesResponse {
    server_time: String,
    changes: ChangesPayload,
}

#[derive(Serialize, Deserialize, Default)]
struct ChangesPayload {
    work_logs: Vec<serde_json::Value>,
    expenses: Vec<serde_json::Value>,
    settings: serde_json::Value,
    clock_lead: Vec<serde_json::Value>,
}

#[derive(Serialize, Deserialize)]
struct PushRequest {
    client_time: String,
    changes: ChangesPayload,
}

#[derive(Serialize)]
struct PushResponse {
    ok: bool,
    server_time: String,
}

#[tokio::main]
async fn main() {
    let db_path = std::env::var("FTB_DB_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("./data/sync.db"));
    let username = std::env::var("FTB_USER").unwrap_or_else(|_| "umut".to_string());
    let password = std::env::var("FTB_PASS").unwrap_or_else(|_| "changeme".to_string());
    let port: u16 = std::env::var("FTB_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(8080);

    if let Err(e) = init_db(&db_path) {
        eprintln!("DB init failed: {e}");
        std::process::exit(1);
    }

    let state = AppState {
        db_path,
        tokens: Arc::new(Mutex::new(HashSet::new())),
        username,
        password,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/auth/login", post(login))
        .route("/sync/changes", get(changes))
        .route("/sync/push", post(push))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("ftb-pi-sync listening on http://{}", addr);
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

fn init_db(path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("mkdir failed: {e}"))?;
    }
    let conn = Connection::open(path).map_err(|e| format!("db open failed: {e}"))?;
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS work_logs (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          client_id TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          client_id TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          client_id TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clock_lead (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          client_id TEXT NOT NULL
        );
        ",
    )
    .map_err(|e| format!("schema init failed: {e}"))?;
    Ok(())
}

async fn health() -> impl IntoResponse {
    let resp = HealthResponse {
        ok: true,
        version: "0.1.0".to_string(),
    };
    Json(resp)
}

async fn login(State(state): State<AppState>, Json(payload): Json<LoginRequest>) -> impl IntoResponse {
    if payload.username != state.username || payload.password != state.password {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "invalid_credentials"})));
    }

    let token = Uuid::new_v4().to_string();
    if let Ok(mut tokens) = state.tokens.lock() {
        tokens.insert(token.clone());
    }
    (StatusCode::OK, Json(LoginResponse { token }))
}

async fn changes(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<ChangesQuery>,
) -> impl IntoResponse {
    if !is_authorized(&state, &headers) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "unauthorized"})));
    }

    let since = query.since.unwrap_or_default();
    let conn = match Connection::open(&state.db_path) {
        Ok(c) => c,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()})));
        }
    };

    let work_logs = fetch_changes(&conn, "work_logs", &since).unwrap_or_default();
    let expenses = fetch_changes(&conn, "expenses", &since).unwrap_or_default();
    let clock_lead = fetch_changes(&conn, "clock_lead", &since).unwrap_or_default();
    let settings = fetch_settings(&conn, &since).unwrap_or_else(|_| serde_json::json!({}));

    let resp = ChangesResponse {
        server_time: now_iso(),
        changes: ChangesPayload {
            work_logs,
            expenses,
            settings,
            clock_lead,
        },
    };
    (StatusCode::OK, Json(resp))
}

async fn push(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(_payload): Json<PushRequest>,
) -> impl IntoResponse {
    if !is_authorized(&state, &headers) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "unauthorized"})));
    }

    let mut conn = match Connection::open(&state.db_path) {
        Ok(c) => c,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()})));
        }
    };

    if let Err(e) = apply_changes(&mut conn, _payload.changes) {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": e})));
    }

    let resp = PushResponse {
        ok: true,
        server_time: now_iso(),
    };
    (StatusCode::OK, Json(resp))
}

fn is_authorized(state: &AppState, headers: &HeaderMap) -> bool {
    let Some(auth) = headers.get("authorization") else { return false };
    let Ok(auth) = auth.to_str() else { return false };
    let token = auth.strip_prefix("Bearer ").unwrap_or("");
    if token.is_empty() {
        return false;
    }
    state.tokens.lock().map(|t| t.contains(token)).unwrap_or(false)
}

fn now_iso() -> String {
    let now = OffsetDateTime::now_utc();
    now.format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| now.unix_timestamp().to_string())
}

fn apply_changes(conn: &mut Connection, changes: ChangesPayload) -> Result<(), String> {
    upsert_table(conn, "work_logs", changes.work_logs)?;
    upsert_table(conn, "expenses", changes.expenses)?;
    upsert_table(conn, "clock_lead", changes.clock_lead)?;
    upsert_settings(conn, changes.settings)?;
    Ok(())
}

fn upsert_table(conn: &mut Connection, table: &str, items: Vec<serde_json::Value>) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let mut stmt = tx
        .prepare(&format!(
            "INSERT INTO {table} (id, payload, updated_at, deleted_at, client_id)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(id) DO UPDATE SET
               payload = excluded.payload,
               updated_at = excluded.updated_at,
               deleted_at = excluded.deleted_at,
               client_id = excluded.client_id
             WHERE excluded.updated_at > {table}.updated_at",
            table = table
        ))
        .map_err(|e| e.to_string())?;

    for item in items {
        let id = get_field(&item, "id")?;
        let updated_at = get_field(&item, "updated_at")?;
        let deleted_at = get_optional_field(&item, "deleted_at");
        let client_id = get_field(&item, "client_id")?;
        let payload = serde_json::to_string(&item).map_err(|e| e.to_string())?;
        stmt.execute(params![id, payload, updated_at, deleted_at, client_id])
            .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

fn upsert_settings(conn: &mut Connection, settings: serde_json::Value) -> Result<(), String> {
    if settings.is_null() || settings == serde_json::json!({}) {
        return Ok(());
    }
    let id = "settings";
    let updated_at = get_field(&settings, "updated_at")?;
    let deleted_at = get_optional_field(&settings, "deleted_at");
    let client_id = get_field(&settings, "client_id")?;
    let payload = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (id, payload, updated_at, deleted_at, client_id)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET
           payload = excluded.payload,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at,
           client_id = excluded.client_id
         WHERE excluded.updated_at > settings.updated_at",
        params![id, payload, updated_at, deleted_at, client_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn fetch_changes(conn: &Connection, table: &str, since: &str) -> Result<Vec<serde_json::Value>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT payload FROM {table} WHERE updated_at > ?1 ORDER BY updated_at ASC",
            table = table
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![since], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for row in rows {
        let text = row.map_err(|e| e.to_string())?;
        let val: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
        out.push(val);
    }
    Ok(out)
}

fn fetch_settings(conn: &Connection, since: &str) -> Result<serde_json::Value, String> {
    let mut stmt = conn
        .prepare("SELECT payload, updated_at FROM settings WHERE id = 'settings'")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let payload: String = row.get(0).map_err(|e| e.to_string())?;
        let updated_at: String = row.get(1).map_err(|e| e.to_string())?;
        if updated_at > since {
            let val: serde_json::Value = serde_json::from_str(&payload).map_err(|e| e.to_string())?;
            return Ok(val);
        }
    }
    Ok(serde_json::json!({}))
}

fn get_field(item: &serde_json::Value, key: &str) -> Result<String, String> {
    item.get(key)
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| format!("missing field: {key}"))
}

fn get_optional_field(item: &serde_json::Value, key: &str) -> Option<String> {
    item.get(key).and_then(|v| v.as_str()).map(|s| s.to_string())
}
