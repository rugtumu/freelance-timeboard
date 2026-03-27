#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;


#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    webbrowser::open(&url)
        .map(|_| ())
        .map_err(|e| format!("failed to open url: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            db::init_db(app.handle())?;
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::db_get_logs,
            db::db_upsert_log,
            db::db_delete_log,
            db::db_replace_logs,
            db::db_get_expenses,
            db::db_upsert_expense,
            db::db_delete_expense,
            db::db_replace_expenses,
            db::bybit_fetch_investments,
            db::secure_store_exchange_key,
            db::secure_delete_exchange_key,
            db::secure_exchange_status,
            db::db_get_investments,
            db::db_upsert_investment,
            db::db_delete_investment,
            db::db_replace_investments,
            db::db_get_settings,
            db::db_set_settings,
            db::save_text_file,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
use tauri::Manager;
