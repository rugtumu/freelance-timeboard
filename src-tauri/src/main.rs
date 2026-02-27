#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            db::init_db(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::db_get_logs,
            db::db_upsert_log,
            db::db_delete_log,
            db::db_replace_logs,
            db::db_get_settings,
            db::db_set_settings,
            db::save_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
