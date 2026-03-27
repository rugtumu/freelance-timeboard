use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, path::PathBuf, sync::Arc};
use time::{Duration, OffsetDateTime};
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    db_path: Arc<PathBuf>,
    session_ttl_days: i64,
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

#[derive(Deserialize)]
struct LogoutRequest {
    token: Option<String>,
}

#[derive(Deserialize)]
struct ChangesQuery {
    since: Option<String>,
}

#[derive(Serialize, Deserialize, Default)]
struct ChangesPayload {
    work_logs: Vec<serde_json::Value>,
    expenses: Vec<serde_json::Value>,
    investments: Vec<serde_json::Value>,
    settings: serde_json::Value,
    clock_lead: Vec<serde_json::Value>,
}

#[derive(Serialize, Deserialize)]
struct PushRequest {
    client_time: String,
    changes: ChangesPayload,
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
    let session_ttl_days: i64 = std::env::var("FTB_SESSION_DAYS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(180);

    if let Err(e) = init_db(&db_path, &username, &password) {
        eprintln!("DB init failed: {e}");
        std::process::exit(1);
    }

    let state = AppState {
        db_path: Arc::new(db_path),
        session_ttl_days,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/auth/login", post(login))
        .route("/auth/logout", post(logout))
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

fn init_db(path: &PathBuf, default_user: &str, default_pass: &str) -> Result<(), String> {
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
        CREATE TABLE IF NOT EXISTS investments (
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
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          revoked_at TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
        ",
    )
    .map_err(|e| format!("schema init failed: {e}"))?;

    bootstrap_default_user(&conn, default_user, default_pass)?;
    Ok(())
}

fn bootstrap_default_user(conn: &Connection, username: &str, password: &str) -> Result<(), String> {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .map_err(|e| format!("users count failed: {e}"))?;
    if count > 0 {
        return Ok(());
    }

    let now = now_iso();
    let hash = hash_password(password)?;
    conn.execute(
        "INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![Uuid::new_v4().to_string(), username, hash, now, now],
    )
    .map_err(|e| format!("default user insert failed: {e}"))?;

    println!("[auth] default user bootstrapped: {username}");
    Ok(())
}

fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|p| p.to_string())
        .map_err(|e| format!("hash failed: {e}"))
}

fn verify_password(password: &str, password_hash: &str) -> bool {
    let parsed = match PasswordHash::new(password_hash) {
        Ok(v) => v,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

fn parse_iso_datetime(s: &str) -> Option<OffsetDateTime> {
    OffsetDateTime::parse(s, &time::format_description::well_known::Rfc3339).ok()
}

async fn health() -> impl IntoResponse {
    let resp = HealthResponse {
        ok: true,
        version: "0.1.0".to_string(),
    };
    Json(resp)
}

async fn login(State(state): State<AppState>, Json(payload): Json<LoginRequest>) -> impl IntoResponse {
    let conn = match Connection::open(state.db_path.as_ref()) {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": e.to_string()})),
            )
        }
    };

    let user_row: Result<(String, String), _> = conn.query_row(
        "SELECT id, password_hash FROM users WHERE username = ?1",
        params![payload.username],
        |row| Ok((row.get(0)?, row.get(1)?)),
    );

    let (user_id, password_hash) = match user_row {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({"error": "invalid_credentials"})),
            )
        }
    };

    if !verify_password(&payload.password, &password_hash) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({"error": "invalid_credentials"})),
        );
    }

    let token = Uuid::new_v4().to_string();
    let created_at_dt = OffsetDateTime::now_utc();
    let expires_at_dt = created_at_dt + Duration::days(state.session_ttl_days);
    let created_at = format_rfc3339(created_at_dt);
    let expires_at = format_rfc3339(expires_at_dt);

    if let Err(e) = conn.execute(
        "INSERT INTO sessions (token, user_id, created_at, expires_at, revoked_at) VALUES (?1, ?2, ?3, ?4, NULL)",
        params![token, user_id, created_at, expires_at],
    ) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("session_create_failed: {e}")})),
        );
    }

    (
        StatusCode::OK,
        Json(serde_json::json!({
            "token": token,
            "expires_at": expires_at
        })),
    )
}

async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<LogoutRequest>,
) -> impl IntoResponse {
    let token = payload
        .token
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .or_else(|| extract_bearer_token(&headers));

    let Some(token) = token else {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "missing_token"})),
        );
    };

    let conn = match Connection::open(state.db_path.as_ref()) {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": e.to_string()})),
            )
        }
    };

    let revoked_at = now_iso();
    let rows = conn
        .execute(
            "UPDATE sessions SET revoked_at = ?2 WHERE token = ?1 AND revoked_at IS NULL",
            params![token, revoked_at],
        )
        .unwrap_or(0);

    if rows == 0 {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "session_not_found"})),
        );
    }

    (StatusCode::OK, Json(serde_json::json!({"ok": true})))
}

async fn changes(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<ChangesQuery>,
) -> impl IntoResponse {
    if !is_authorized(&state, &headers) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({"error": "unauthorized"})),
        );
    }

    let since = query.since.unwrap_or_default();
    let conn = match Connection::open(state.db_path.as_ref()) {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": e.to_string()})),
            )
        }
    };

    let work_logs = fetch_changes(&conn, "work_logs", &since).unwrap_or_default();
    let expenses = fetch_changes(&conn, "expenses", &since).unwrap_or_default();
    let investments = fetch_changes(&conn, "investments", &since).unwrap_or_default();
    let clock_lead = fetch_changes(&conn, "clock_lead", &since).unwrap_or_default();
    let settings = fetch_settings(&conn, &since).unwrap_or_else(|_| serde_json::json!({}));

    (
        StatusCode::OK,
        Json(serde_json::json!({
            "server_time": now_iso(),
            "changes": {
                "work_logs": work_logs,
                "expenses": expenses,
                "investments": investments,
                "settings": settings,
                "clock_lead": clock_lead
            }
        })),
    )
}

async fn push(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<PushRequest>,
) -> impl IntoResponse {
    if !is_authorized(&state, &headers) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({"error": "unauthorized"})),
        );
    }

    let mut conn = match Connection::open(state.db_path.as_ref()) {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": e.to_string()})),
            )
        }
    };

    if let Err(e) = apply_changes(&mut conn, payload.changes) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": e})),
        );
    }

    (
        StatusCode::OK,
        Json(serde_json::json!({
            "ok": true,
            "server_time": now_iso()
        })),
    )
}

fn extract_bearer_token(headers: &HeaderMap) -> Option<String> {
    let auth = headers.get("authorization")?.to_str().ok()?;
    let token = auth.strip_prefix("Bearer ")?.trim();
    if token.is_empty() {
        return None;
    }
    Some(token.to_string())
}

fn is_authorized(state: &AppState, headers: &HeaderMap) -> bool {
    let Some(token) = extract_bearer_token(headers) else {
        return false;
    };

    let conn = match Connection::open(state.db_path.as_ref()) {
        Ok(c) => c,
        Err(_) => return false,
    };

    let row: Result<(String, Option<String>), _> = conn.query_row(
        "SELECT expires_at, revoked_at FROM sessions WHERE token = ?1",
        params![token],
        |r| Ok((r.get(0)?, r.get(1)?)),
    );

    let Ok((expires_at_raw, revoked_at)) = row else {
        return false;
    };
    if revoked_at.is_some() {
        return false;
    }

    let Some(expires_at) = parse_iso_datetime(&expires_at_raw) else {
        return false;
    };
    expires_at > OffsetDateTime::now_utc()
}

fn format_rfc3339(dt: OffsetDateTime) -> String {
    dt.format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| dt.unix_timestamp().to_string())
}

fn now_iso() -> String {
    format_rfc3339(OffsetDateTime::now_utc())
}

fn apply_changes(conn: &mut Connection, changes: ChangesPayload) -> Result<(), String> {
    upsert_table(conn, "work_logs", changes.work_logs)?;
    upsert_table(conn, "expenses", changes.expenses)?;
    upsert_table(conn, "investments", changes.investments)?;
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
    drop(stmt);
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
        if updated_at.as_str() > since {
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
