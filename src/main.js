import "./style.css";
import { invoke } from "@tauri-apps/api/core";

const STORAGE_KEYS = {
  logs: "work_tracker_logs_v1",
  settings: "work_tracker_settings_v1"
};

const DEFAULT_SETTINGS = {
  standardRateUsd: 25,
  specialRateUsd: 28.28125,
  usdTry: 43.88183,
  cycleResetRule: "monthly",
  weeklyTargetHours: 35,
  monthlyTargetHours: 140,
  theme: "dark",
  language: "tr"
};

const state = {
  logs: [],
  settings: { ...DEFAULT_SETTINGS },
  editingId: null,
  activeTab: "dashboard"
};

const I18N = {
  tr: {
    appOpenError: "Uygulama açılamadı",
    heading: "Günlük takip, performans analizi, tek panel",
    dashboard: "Panel",
    analysis: "Analiz",
    exportJson: "JSON Dışa Aktar",
    exportCsv: "CSV Dışa Aktar",
    importCsv: "CSV İçe Aktar",
    toLightTheme: "Açık Tema",
    toDarkTheme: "Koyu Tema",
    themeToggleAria: "Temayı değiştir",
    langToggleAria: "Dili değiştir",
    records: "Kayıtlar",
    totalHours: "Toplam Saat",
    cumulativeIncome: "Kümülatif Gelir",
    cumulativeIncomeTry: "Kümülatif Gelir (TL)",
    monthHours: "Bu Ay Saat",
    weekHours: "Bu Hafta Saat",
    previousMonth: "Önceki ay",
    previousWeek: "Önceki hafta",
    weeklyTarget: "Haftalık Hedef",
    monthlyTarget: "Aylık Hedef",
    weeklyHoursLast8: "Haftalık Saat (Bu Hafta: Pzt-Paz)",
    monthlyHoursLast6: "Aylık Saat (Son 6 Ay)",
    dailyRolling: "Günlük Saat ve Rolling 10g Ortalama",
    heatmap20: "Gün Bazlı Heatmap (Son 20 Hafta)",
    cycleHistogram: "Cycles Histogram ($)",
    editRecord: "Kaydı Düzenle",
    dailyEntry: "Günlük Veri Girişi",
    date: "Tarih",
    hours: "Saat",
    rateType: "Ücret Tipi",
    note: "Not",
    notePlaceholder: "Opsiyonel not",
    update: "Güncelle",
    save: "Kaydet",
    cancel: "İptal",
    settings: "Ayarlar",
    standardRate: "Standart USD/Saat",
    specialRate: "Özel USD/Saat",
    usdTry: "USD/TRY",
    refreshRate: "Kuru Güncelle",
    rate: "Ücret",
    cycleHours: "Döngü Saat",
    avg10d: "10g Ort",
    cycleReset: "Döngü Sıfırlama",
    monthly: "Aylık",
    manual: "Manuel",
    weeklyTargetHours: "Haftalık Hedef (Saat)",
    monthlyTargetHours: "Aylık Hedef (Saat)",
    saveSettings: "Ayar Kaydet",
    dailyUsd: "Günlük $",
    cumulativeHours: "Kümülatif Saat",
    action: "İşlem",
    noRecords: "Henüz kayıt yok.",
    invalidDateHours: "Geçerli tarih ve 0-24 arası saat gir.",
    invalidRate: "Geçerli bir saatlik ücret gir.",
    duplicateConfirm: "{date} için kayıt var. Üzerine yazılsın mı?",
    invalidSettings: "Ayar değerleri geçerli olmalı.",
    deleteConfirm: "Kayıt silinsin mi?",
    csvInvalid: "CSV parse edilemedi ya da geçerli satır bulunamadı.",
    parsedCount: "{count} kayıt parse edildi.",
    warningCount: "Uyarı: {count} satır atlandı veya düzeltildi.",
    replaceConfirm: "Mevcut kayıtlar bununla değiştirilsin mi?",
    importDoneWarnings: "Import tamamlandı. İlk uyarılar:",
    themeSaveFailed: "Tema kaydedilemedi. Lütfen tekrar dene.",
    rateFetchFailed: "Canlı kur alınamadı. Değeri elle girebilirsin.",
    rateUpdated: "USD/TRY güncellendi.",
    edit: "Düzenle",
    delete: "Sil",
    noData: "Veri yok",
    noEnoughData: "Yeterli veri yok",
    xAxis: "X Ekseni",
    yAxis: "Y Ekseni",
    dailyHoursLabel: "Günlük Saat",
    rollingAvgLabel: "Rolling 10g Ortalama",
    monday: "Pzt",
    tuesday: "Sal",
    wednesday: "Çar",
    thursday: "Per",
    friday: "Cum",
    saturday: "Cts",
    sunday: "Paz",
    monthsShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
    csvEmpty: "Boş CSV.",
    expectedColumns: "Beklenen kolonlar bulunamadı.",
    rowInvalidDate: "Satır {row}: geçersiz tarih.",
    rowInvalidHours: "Satır {row}: saat geçersiz ({value}).",
    duplicateDateWarn: "Aynı tarih tekrar etti ({date}), son satır kullanıldı.",
    language: "Dil",
    turkish: "Türkçe",
    english: "English"
  },
  en: {
    appOpenError: "Application failed to start",
    heading: "Daily tracking, performance analytics, single panel",
    dashboard: "Dashboard",
    analysis: "Analysis",
    exportJson: "Export JSON",
    exportCsv: "Export CSV",
    importCsv: "Import CSV",
    toLightTheme: "Light Theme",
    toDarkTheme: "Dark Theme",
    themeToggleAria: "Toggle theme",
    langToggleAria: "Toggle language",
    records: "Records",
    totalHours: "Total Hours",
    cumulativeIncome: "Cumulative Income",
    cumulativeIncomeTry: "Cumulative Income (TRY)",
    monthHours: "This Month Hours",
    weekHours: "This Week Hours",
    previousMonth: "Previous month",
    previousWeek: "Previous week",
    weeklyTarget: "Weekly Target",
    monthlyTarget: "Monthly Target",
    weeklyHoursLast8: "Weekly Hours (This Week: Mon-Sun)",
    monthlyHoursLast6: "Monthly Hours (Last 6 Months)",
    dailyRolling: "Daily Hours and Rolling 10d Avg",
    heatmap20: "Day-based Heatmap (Last 20 Weeks)",
    cycleHistogram: "Histogram of Cycles ($)",
    editRecord: "Edit Record",
    dailyEntry: "Daily Entry",
    date: "Date",
    hours: "Hours",
    rateType: "Rate Type",
    note: "Note",
    notePlaceholder: "Optional note",
    update: "Update",
    save: "Save",
    cancel: "Cancel",
    settings: "Settings",
    standardRate: "Standard USD/Hour",
    specialRate: "Special USD/Hour",
    usdTry: "USD/TRY",
    refreshRate: "Refresh Rate",
    rate: "Rate",
    cycleHours: "Cycle Hours",
    avg10d: "10d Avg",
    cycleReset: "Cycle Reset",
    monthly: "Monthly",
    manual: "Manual",
    weeklyTargetHours: "Weekly Target (Hours)",
    monthlyTargetHours: "Monthly Target (Hours)",
    saveSettings: "Save Settings",
    dailyUsd: "Daily $",
    cumulativeHours: "Cumulative Hours",
    action: "Action",
    noRecords: "No records yet.",
    invalidDateHours: "Enter a valid date and hours between 0-24.",
    invalidRate: "Enter a valid hourly rate.",
    duplicateConfirm: "A record exists for {date}. Overwrite it?",
    invalidSettings: "Settings values must be valid.",
    deleteConfirm: "Delete this record?",
    csvInvalid: "CSV could not be parsed or no valid rows found.",
    parsedCount: "{count} records parsed.",
    warningCount: "Warning: {count} rows were skipped or corrected.",
    replaceConfirm: "Replace current records with imported data?",
    importDoneWarnings: "Import completed. First warnings:",
    themeSaveFailed: "Theme could not be saved. Please try again.",
    rateFetchFailed: "Could not fetch live rate. You can enter it manually.",
    rateUpdated: "USD/TRY updated.",
    edit: "Edit",
    delete: "Delete",
    noData: "No data",
    noEnoughData: "Not enough data",
    xAxis: "X Axis",
    yAxis: "Y Axis",
    dailyHoursLabel: "Daily Hours",
    rollingAvgLabel: "Rolling 10d Avg",
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    csvEmpty: "Empty CSV.",
    expectedColumns: "Expected columns were not found.",
    rowInvalidDate: "Row {row}: invalid date.",
    rowInvalidHours: "Row {row}: invalid hours ({value}).",
    duplicateDateWarn: "Duplicate date detected ({date}), last row was used.",
    language: "Language",
    turkish: "Türkçe",
    english: "English"
  }
};

function t(key, vars = {}) {
  const lang = state.settings.language === "en" ? "en" : "tr";
  const table = I18N[lang] || I18N.tr;
  let text = table[key] || I18N.tr[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

async function bootstrap() {
  const loaded = await dataStore.load();
  state.logs = loaded.logs;
  state.settings = { ...DEFAULT_SETTINGS, ...loaded.settings };
  applyTheme();
  renderApp();
}

const dataStore = {
  async load() {
    if (isTauriRuntime()) {
      try {
        const [logs, rawSettings] = await Promise.all([
          invoke("db_get_logs"),
          invoke("db_get_settings")
        ]);

        return {
          logs: Array.isArray(logs) ? logs.map(mapDbLogToUi) : [],
          settings: mapRawSettings(rawSettings)
        };
      } catch (error) {
        console.error("SQLite load failed, fallback localStorage:", error);
      }
    }

    return {
      logs: loadLogsFromLocal(),
      settings: loadSettingsFromLocal()
    };
  },

  async saveSettings(settings) {
    if (isTauriRuntime()) {
      const payload = Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, String(v)]));
      await invoke("db_set_settings", { settings: payload });
      return;
    }

    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  },

  async upsertLog(log) {
    if (isTauriRuntime()) {
      await invoke("db_upsert_log", { log: mapUiLogToDb(log) });
      return;
    }

    const logs = loadLogsFromLocal();
    const idx = logs.findIndex((x) => x.id === log.id || x.date === log.date);
    if (idx >= 0) logs[idx] = log;
    else logs.push(log);
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  },

  async deleteLog(id) {
    if (isTauriRuntime()) {
      await invoke("db_delete_log", { id });
      return;
    }

    const logs = loadLogsFromLocal().filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  },

  async replaceLogs(logs) {
    if (isTauriRuntime()) {
      await invoke("db_replace_logs", { logs: logs.map(mapUiLogToDb) });
      return;
    }

    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  }
};

bootstrap().catch((error) => {
  console.error("Bootstrap failed:", error);
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `<div class="shell"><section class="card"><h2>${t("appOpenError")}</h2><p class="muted">${escapeHtml(String(error))}</p></section></div>`;
  }
});

function loadLogsFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.logs);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSettingsFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function mapDbLogToUi(log) {
  return {
    id: String(log.id),
    date: String(log.date),
    hours: Number(log.hours) || 0,
    rateUsd: Number(log.rate_usd) || 0,
    usdTry: Number(log.usd_try) || 1,
    note: String(log.note || ""),
    cycleId: String(log.cycle_id || "")
  };
}

function mapUiLogToDb(log) {
  return {
    id: String(log.id),
    date: String(log.date),
    hours: Number(log.hours) || 0,
    rate_usd: Number(log.rateUsd) || 0,
    usd_try: Number(log.usdTry) || 1,
    note: String(log.note || ""),
    cycle_id: String(log.cycleId || log.date.slice(0, 7))
  };
}

function mapRawSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    standardRateUsd: toNum(src.standardRateUsd),
    specialRateUsd: toNum(src.specialRateUsd),
    usdTry: toNum(src.usdTry),
    cycleResetRule: src.cycleResetRule || DEFAULT_SETTINGS.cycleResetRule,
    weeklyTargetHours: toNum(src.weeklyTargetHours),
    monthlyTargetHours: toNum(src.monthlyTargetHours),
    theme: src.theme || DEFAULT_SETTINGS.theme,
    language: src.language || DEFAULT_SETTINGS.language
  };
}

function renderApp() {
  const rowsDesc = deriveRows(state.logs, state.settings);
  const dashboard = deriveDashboard(rowsDesc, state.settings);

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Freelance Work Tracker</p>
          <h1>${t("heading")}</h1>
        </div>
        <div class="hero-actions">
          <button id="theme-toggle" class="btn ghost icon-btn" title="${state.settings.theme === "dark" ? t("toLightTheme") : t("toDarkTheme")}" aria-label="${t("themeToggleAria")}">
            ${state.settings.theme === "dark" ? themeSunIcon() : themeMoonIcon()}
          </button>
          <button id="lang-toggle" class="btn ghost lang-btn" title="${t("langToggleAria")}" aria-label="${t("langToggleAria")}">
            ${state.settings.language === "tr" ? "EN" : "TR"}
          </button>
        </div>
      </header>

      <nav class="tabs">
        <button class="tab ${state.activeTab === "dashboard" ? "active" : ""}" data-tab="dashboard">${t("dashboard")}</button>
        <button class="tab ${state.activeTab === "analysis" ? "active" : ""}" data-tab="analysis">${t("analysis")}</button>
        <button class="tab ${state.activeTab === "records" ? "active" : ""}" data-tab="records">${t("records")}</button>
      </nav>

      <div class="panel ${state.activeTab === "dashboard" ? "" : "hidden"}" data-panel="dashboard">
      <section class="viz-grid">
        <article class="card">
          <h3>${t("weeklyHoursLast8")}</h3>
          ${barChartSvg(dashboard.weeklySeries)}
        </article>
        <article class="card">
          <h3>${t("monthlyHoursLast6")}</h3>
          ${barChartSvg(dashboard.monthlySeries)}
        </article>
        <article class="card full-viz">
          <h3>${t("dailyRolling")}</h3>
          ${rollingChartSvg(dashboard.rollingSeries)}
        </article>
        <article class="card full-viz">
          <h3>${t("heatmap20")}</h3>
          ${heatmapHtml(dashboard.heatmap)}
        </article>
      </section>
      </div>

      <div class="panel ${state.activeTab === "analysis" ? "" : "hidden"}" data-panel="analysis">
      <section class="kpi-grid">
        <article class="card">
          <h3>${t("totalHours")}</h3>
          <p>${fmtHours(dashboard.totalHours)}</p>
        </article>
        <article class="card">
          <h3>${t("cumulativeIncome")}</h3>
          <p>${fmtMoney(dashboard.totalUsd)}</p>
        </article>
        <article class="card tl-income-card">
          <h3>${t("cumulativeIncomeTry")}</h3>
          <p>${fmtTry(dashboard.totalTry)}</p>
          <button
            id="refresh-usd-try-card"
            class="btn ghost icon-btn card-refresh-btn"
            title="${t("refreshRate")}"
            aria-label="${t("refreshRate")}"
          >
            ${refreshIcon()}
          </button>
        </article>
        <article class="card">
          <h3>${t("monthHours")}</h3>
          <p>${fmtHours(dashboard.monthHours)}</p>
          <small class="muted">${t("previousMonth")}: ${fmtHours(dashboard.prevMonthHours)} (${fmtDelta(dashboard.monthDeltaPct)})</small>
        </article>
        <article class="card">
          <h3>${t("weekHours")}</h3>
          <p>${fmtHours(dashboard.weekHours)}</p>
          <small class="muted">${t("previousWeek")}: ${fmtHours(dashboard.prevWeekHours)} (${fmtDelta(dashboard.weekDeltaPct)})</small>
        </article>
      </section>

      <section class="goal-grid">
        <article class="card goal-card">
          <h3>${t("weeklyTarget")}</h3>
          <p>${fmtHours(dashboard.weekHours)} / ${fmtHours(state.settings.weeklyTargetHours)}</p>
          ${progressBar(dashboard.weekGoalPct)}
        </article>
        <article class="card goal-card">
          <h3>${t("monthlyTarget")}</h3>
          <p>${fmtHours(dashboard.monthHours)} / ${fmtHours(state.settings.monthlyTargetHours)}</p>
          ${progressBar(dashboard.monthGoalPct)}
        </article>
      </section>

      <section class="cycle-hist-section">
        <article class="card">
          <h3>${t("cycleHistogram")}</h3>
          ${cycleHistogramSvg(dashboard.cycleHistogramSeries)}
        </article>
      </section>
      </div>

      <div class="panel ${state.activeTab === "records" ? "" : "hidden"}" data-panel="records">
      <main class="layout">
        <section class="card">
          <h2>${state.editingId ? t("editRecord") : t("dailyEntry")}</h2>
          <form id="entry-form" class="form-grid">
            <label>
              ${t("date")}
              <input id="entry-date" name="date" type="date" required />
            </label>
            <label>
              ${t("hours")}
              <input id="entry-hours" name="hours" type="number" step="0.25" min="0" max="24" required />
            </label>
            <label>
              ${t("rateType")}
              <select id="entry-rate-mode" name="rateMode">
                <option value="standard">Standard</option>
                <option value="special">Special</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label id="custom-rate-wrap" class="hidden">
              Custom USD/Saat
              <input id="entry-custom-rate" name="customRate" type="number" step="0.01" min="0" />
            </label>
            <label class="full">
              ${t("note")}
              <input id="entry-note" name="note" type="text" maxlength="180" placeholder="${t("notePlaceholder")}" />
            </label>
            <div class="form-actions full">
              <button type="submit" class="btn primary">${state.editingId ? t("update") : t("save")}</button>
              <button type="button" id="cancel-edit" class="btn ghost ${state.editingId ? "" : "hidden"}">${t("cancel")}</button>
            </div>
          </form>
        </section>

        <section class="card">
          <h2>${t("settings")}</h2>
          <form id="settings-form" class="form-grid">
            <label>
              ${t("standardRate")}
              <input id="setting-standard" type="number" min="0" step="0.01" value="${state.settings.standardRateUsd}" required />
            </label>
            <label>
              ${t("specialRate")}
              <input id="setting-special" type="number" min="0" step="0.01" value="${state.settings.specialRateUsd}" required />
            </label>
            <label>
              ${t("usdTry")}
              <input id="setting-usd-try" type="number" min="0" step="0.00001" value="${state.settings.usdTry}" required />
            </label>
            <div class="full inline-actions">
              <button type="button" id="refresh-usd-try" class="btn ghost">${t("refreshRate")}</button>
            </div>
            <label>
              ${t("cycleReset")}
              <select id="setting-cycle-rule">
                <option value="monthly" ${state.settings.cycleResetRule === "monthly" ? "selected" : ""}>${t("monthly")}</option>
                <option value="manual" ${state.settings.cycleResetRule === "manual" ? "selected" : ""}>${t("manual")} (cycleId)</option>
              </select>
            </label>
            <label>
              ${t("weeklyTargetHours")}
              <input id="setting-weekly-target" type="number" min="0" step="0.25" value="${state.settings.weeklyTargetHours}" required />
            </label>
            <label>
              ${t("monthlyTargetHours")}
              <input id="setting-monthly-target" type="number" min="0" step="0.25" value="${state.settings.monthlyTargetHours}" required />
            </label>
            <label>
              ${t("language")}
              <select id="setting-language">
                <option value="tr" ${state.settings.language === "tr" ? "selected" : ""}>${t("turkish")}</option>
                <option value="en" ${state.settings.language === "en" ? "selected" : ""}>${t("english")}</option>
              </select>
            </label>
            <div class="form-actions full">
              <button type="submit" class="btn primary">${t("saveSettings")}</button>
            </div>
          </form>
        </section>
      </main>

      <section class="card records-table-card">
        <h2>${t("records")}</h2>
        <div class="records-actions">
          <button id="export-json" class="btn ghost">${t("exportJson")}</button>
          <button id="export-csv" class="btn ghost">${t("exportCsv")}</button>
          <label class="btn ghost file-btn">
            ${t("importCsv")}
            <input id="import-csv" type="file" accept=".csv,text/csv" />
          </label>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${t("date")}</th>
                <th>${t("hours")}</th>
                <th>${t("rate")}</th>
                <th>${t("dailyUsd")}</th>
                <th>${t("cycleHours")}</th>
                <th>${t("cumulativeHours")}</th>
                <th>${t("avg10d")}</th>
                <th>${t("note")}</th>
                <th>${t("action")}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsDesc.length ? rowsDesc.map(renderRow).join("") : `<tr><td colspan="9" class="empty">${t("noRecords")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </div>
  `;

  bindEvents(rowsDesc);
  initializeForm();
}

function bindEvents(rowsDesc) {
  const entryForm = document.getElementById("entry-form");
  const settingsForm = document.getElementById("settings-form");
  const rateMode = document.getElementById("entry-rate-mode");
  const customWrap = document.getElementById("custom-rate-wrap");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const importCsvInput = document.getElementById("import-csv");
  const themeToggle = document.getElementById("theme-toggle");
  const langToggle = document.getElementById("lang-toggle");
  const refreshUsdTryBtn = document.getElementById("refresh-usd-try");
  const refreshUsdTryCardBtn = document.getElementById("refresh-usd-try-card");

  document.querySelectorAll(".tab[data-tab]").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      state.activeTab = tabBtn.getAttribute("data-tab") || "dashboard";
      renderApp();
    });
  });

  rateMode.addEventListener("change", () => {
    customWrap.classList.toggle("hidden", rateMode.value !== "custom");
  });

  themeToggle.addEventListener("click", async () => {
    const previousTheme = state.settings.theme;
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    applyTheme();
    renderApp();

    try {
      await dataStore.saveSettings(state.settings);
    } catch (error) {
      console.error("Tema ayarı kaydedilemedi:", error);
      state.settings.theme = previousTheme;
      applyTheme();
      renderApp();
      alert(t("themeSaveFailed"));
    }
  });

  langToggle.addEventListener("click", async () => {
    const previousLang = state.settings.language;
    state.settings.language = state.settings.language === "tr" ? "en" : "tr";
    renderApp();

    try {
      await dataStore.saveSettings(state.settings);
    } catch (error) {
      console.error("Dil ayarı kaydedilemedi:", error);
      state.settings.language = previousLang;
      renderApp();
    }
  });

  const handleUsdTryRefresh = async (triggerBtn) => {
    if (triggerBtn) triggerBtn.disabled = true;
    try {
      const liveRate = await fetchUsdTryRate();
      state.settings.usdTry = round(liveRate, 5);
      await dataStore.saveSettings(state.settings);
      renderApp();
      alert(t("rateUpdated"));
    } catch (error) {
      console.error("USD/TRY fetch failed:", error);
      alert(t("rateFetchFailed"));
    } finally {
      if (triggerBtn) triggerBtn.disabled = false;
    }
  };

  refreshUsdTryBtn?.addEventListener("click", async () => {
    await handleUsdTryRefresh(refreshUsdTryBtn);
  });

  refreshUsdTryCardBtn?.addEventListener("click", async () => {
    await handleUsdTryRefresh(refreshUsdTryCardBtn);
  });

  entryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(entryForm);

    const date = String(form.get("date") || "").trim();
    const hours = Number(form.get("hours"));
    const rateModeValue = String(form.get("rateMode") || "standard");
    const customRate = Number(form.get("customRate"));
    const note = String(form.get("note") || "").trim();

    if (!date || Number.isNaN(hours) || hours < 0 || hours > 24) {
      alert(t("invalidDateHours"));
      return;
    }

    const rateUsd = resolveRate(rateModeValue, customRate, state.settings);
    if (!Number.isFinite(rateUsd) || rateUsd < 0) {
      alert(t("invalidRate"));
      return;
    }

    const payload = {
      id: state.editingId || uid(),
      date,
      hours: round(hours, 2),
      rateUsd: round(rateUsd, 5),
      usdTry: round(Number(state.settings.usdTry), 5),
      note,
      cycleId: date.slice(0, 7)
    };

    const duplicate = state.logs.find((x) => x.date === date && x.id !== payload.id);
    if (duplicate && !confirm(t("duplicateConfirm", { date }))) return;

    state.logs = state.logs.filter((x) => x.id !== payload.id && x.date !== payload.date);
    state.logs.push(payload);

    await dataStore.upsertLog(payload);

    if (duplicate) {
      await dataStore.deleteLog(duplicate.id);
    }

    state.editingId = null;
    renderApp();
  });

  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const standardRateUsd = Number(document.getElementById("setting-standard").value);
    const specialRateUsd = Number(document.getElementById("setting-special").value);
    const usdTry = Number(document.getElementById("setting-usd-try").value);
    const cycleResetRule = document.getElementById("setting-cycle-rule").value;
    const weeklyTargetHours = Number(document.getElementById("setting-weekly-target").value);
    const monthlyTargetHours = Number(document.getElementById("setting-monthly-target").value);
    const language = document.getElementById("setting-language").value;

    const values = [standardRateUsd, specialRateUsd, usdTry, weeklyTargetHours, monthlyTargetHours];
    if (values.some((v) => !Number.isFinite(v) || v < 0)) {
      alert(t("invalidSettings"));
      return;
    }

    state.settings = {
      ...state.settings,
      standardRateUsd: round(standardRateUsd, 5),
      specialRateUsd: round(specialRateUsd, 5),
      usdTry: round(usdTry, 5),
      cycleResetRule,
      weeklyTargetHours: round(weeklyTargetHours, 2),
      monthlyTargetHours: round(monthlyTargetHours, 2),
      language: language === "en" ? "en" : "tr"
    };

    await dataStore.saveSettings(state.settings);
    renderApp();
  });

  cancelEditBtn?.addEventListener("click", () => {
    state.editingId = null;
    renderApp();
  });

  document.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const row = rowsDesc.find((r) => r.id === id);
      if (!row) return;

      state.editingId = row.id;
      renderApp();

      document.getElementById("entry-date").value = row.date;
      document.getElementById("entry-hours").value = String(row.hours);
      document.getElementById("entry-note").value = row.note || "";

      const standard = state.settings.standardRateUsd;
      const special = state.settings.specialRateUsd;
      const mode = nearlyEqual(row.rateUsd, standard) ? "standard" : nearlyEqual(row.rateUsd, special) ? "special" : "custom";

      document.getElementById("entry-rate-mode").value = mode;
      document.getElementById("custom-rate-wrap").classList.toggle("hidden", mode !== "custom");
      document.getElementById("entry-custom-rate").value = mode === "custom" ? String(row.rateUsd) : "";
      document.getElementById("entry-note").focus();
    });
  });

  document.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm(t("deleteConfirm"))) return;
      state.logs = state.logs.filter((log) => log.id !== id);
      if (state.editingId === id) state.editingId = null;
      await dataStore.deleteLog(id);
      renderApp();
    });
  });

  importCsvInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseImportedCsv(text, state.settings);

    if (!result.logs.length) {
      alert(t("csvInvalid"));
      return;
    }

    const summary = [t("parsedCount", { count: result.logs.length })];
    if (result.warnings.length) {
      summary.push(t("warningCount", { count: result.warnings.length }));
    }

    const shouldReplace = confirm(`${summary.join(" ")} ${t("replaceConfirm")}`);
    if (!shouldReplace) return;

    state.logs = result.logs;
    state.editingId = null;
    await dataStore.replaceLogs(result.logs);
    renderApp();

    if (result.warnings.length) {
      alert(`${t("importDoneWarnings")}\n- ${result.warnings.slice(0, 5).join("\n- ")}`);
    }
  });

  document.getElementById("export-json")?.addEventListener("click", () => {
    downloadFile(JSON.stringify(state.logs, null, 2), `work-logs-${todayIso()}.json`, "application/json");
  });

  document.getElementById("export-csv")?.addEventListener("click", () => {
    const csv = buildExportCsv(rowsDesc);
    downloadFile(csv, `work-logs-${todayIso()}.csv`, "text/csv;charset=utf-8;");
  });
}

function initializeForm() {
  const dateInput = document.getElementById("entry-date");
  if (dateInput && !dateInput.value) dateInput.value = todayIso();
}

function deriveRows(logs, settings) {
  const normalized = logs
    .filter((x) => x && x.date)
    .map((x) => ({
      id: x.id || uid(),
      date: x.date,
      hours: Number(x.hours) || 0,
      rateUsd: Number(x.rateUsd) || Number(settings.standardRateUsd) || 0,
      usdTry: Number(x.usdTry) || Number(settings.usdTry) || 1,
      note: x.note || "",
      cycleId: x.cycleId || x.date.slice(0, 7)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const derivedAsc = [];
  const rollingWindow = [];
  let cumulativeHours = 0;
  let cumulativeUsd = 0;
  let cycleHours = 0;
  let cycleUsd = 0;
  let lastCycleKey = null;

  for (const row of normalized) {
    const cycleKey = settings.cycleResetRule === "manual" ? row.cycleId : row.date.slice(0, 7);
    if (lastCycleKey !== cycleKey) {
      cycleHours = 0;
      cycleUsd = 0;
      lastCycleKey = cycleKey;
    }

    const dailyUsd = round(row.hours * row.rateUsd, 2);
    const dailyTry = round(dailyUsd * row.usdTry, 2);

    cumulativeHours = round(cumulativeHours + row.hours, 2);
    cumulativeUsd = round(cumulativeUsd + dailyUsd, 2);
    cycleHours = round(cycleHours + row.hours, 2);
    cycleUsd = round(cycleUsd + dailyUsd, 2);

    rollingWindow.push(row.hours);
    if (rollingWindow.length > 10) rollingWindow.shift();

    derivedAsc.push({
      ...row,
      cycleKey,
      dailyUsd,
      dailyTry,
      cycleHours,
      cycleUsd,
      cumulativeHours,
      cumulativeUsd,
      cumulativeTry: round(cumulativeUsd * row.usdTry, 2),
      rolling10dAvg: round(avg(rollingWindow), 2)
    });
  }

  return derivedAsc.reverse();
}

function deriveDashboard(rowsDesc, settings) {
  const totalHours = rowsDesc.reduce((s, r) => s + r.hours, 0);
  const totalUsd = rowsDesc[0]?.cumulativeUsd || 0;
  const totalTry = totalUsd * (Number(settings.usdTry) || 0);
  const latest10dAvg = rowsDesc[0]?.rolling10dAvg || 0;
  const latestDate = rowsDesc[0]?.date || "";
  const activeMonth = latestDate ? latestDate.slice(0, 7) : todayIso().slice(0, 7);
  const monthHours = rowsDesc.filter((r) => r.date.startsWith(activeMonth)).reduce((s, r) => s + r.hours, 0);

  const weekMap = aggregateByWeek(rowsDesc);
  const monthMap = aggregateByMonth(rowsDesc);

  const currentWeekKey = weekKey(latestDate || todayIso());
  const prevWeekKey = weekKey(shiftDate(currentWeekKey, -7));
  const weekHours = weekMap.get(currentWeekKey)?.hours || 0;
  const prevWeekHours = weekMap.get(prevWeekKey)?.hours || 0;

  const currentMonthKey = activeMonth;
  const prevMonthKey = shiftMonth(activeMonth, -1);
  const prevMonthHours = monthMap.get(prevMonthKey)?.hours || 0;

  const weeklySeries = buildCurrentWeekSeries(rowsDesc);

  const monthlySeries = Array.from(monthMap.entries())
    .slice(-6)
    .map(([k, v]) => ({ label: formatMonthLabel(k), hours: round(v.hours, 2), income: round(v.income, 2) }));

  const rollingSeries = rowsDesc
    .slice(0, 60)
    .reverse()
    .map((r) => ({ date: r.date, hours: r.hours, avg: r.rolling10dAvg }));

  const weekGoalPct = toPercent(weekHours, settings.weeklyTargetHours);
  const monthGoalPct = toPercent(monthHours, settings.monthlyTargetHours);
  const cycleHistogramSeries = buildCycleHistogramSeries(rowsDesc);

  return {
    totalHours: round(totalHours, 2),
    totalUsd: round(totalUsd, 2),
    totalTry: round(totalTry, 2),
    monthHours: round(monthHours, 2),
    latest10dAvg: round(latest10dAvg, 2),
    latestDate,
    weekHours: round(weekHours, 2),
    prevWeekHours: round(prevWeekHours, 2),
    weekDeltaPct: deltaPct(weekHours, prevWeekHours),
    prevMonthHours: round(prevMonthHours, 2),
    monthDeltaPct: deltaPct(monthHours, prevMonthHours),
    weekGoalPct,
    monthGoalPct,
    weeklySeries,
    monthlySeries,
    rollingSeries,
    heatmap: buildHeatmap(rowsDesc, 20),
    cycleHistogramSeries
  };
}

function aggregateByWeek(rowsDesc) {
  const map = new Map();
  for (const row of [...rowsDesc].reverse()) {
    const k = weekKey(row.date);
    const prev = map.get(k) || { hours: 0, income: 0 };
    map.set(k, {
      hours: prev.hours + row.hours,
      income: prev.income + (row.dailyUsd || 0)
    });
  }
  return map;
}

function buildCurrentWeekSeries(rowsDesc) {
  const source = new Map(rowsDesc.map((r) => [r.date, r]));
  const today = toDate(todayIso());
  const weekStart = weekStartMonday(today);
  const dayLabels = [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday"), t("sunday")];

  const series = [];
  for (let i = 0; i < 7; i += 1) {
    const dateObj = shiftDateObj(weekStart, i);
    const key = toIsoDate(dateObj);
    const row = source.get(key);
    series.push({
      label: dayLabels[i],
      hours: round(row?.hours || 0, 2),
      income: round(row?.dailyUsd || 0, 2)
    });
  }
  return series;
}

function aggregateByMonth(rowsDesc) {
  const map = new Map();
  for (const row of [...rowsDesc].reverse()) {
    const k = row.date.slice(0, 7);
    const prev = map.get(k) || { hours: 0, income: 0 };
    map.set(k, {
      hours: prev.hours + row.hours,
      income: prev.income + (row.dailyUsd || 0)
    });
  }
  return map;
}

function buildCycleHistogramSeries(rowsDesc) {
  if (!rowsDesc.length) return [];

  const source = new Map(rowsDesc.map((r) => [r.date, r]));
  const firstDate = rowsDesc[rowsDesc.length - 1].date;
  const lastDate = rowsDesc[0].date;
  const start = toDate(firstDate);
  const end = toDate(lastDate);

  const out = [];
  let currentMonth = "";
  let cycleUsd = 0;
  let d = new Date(start);

  while (d <= end) {
    const iso = toIsoDate(d);
    const month = iso.slice(0, 7);
    if (month !== currentMonth) {
      currentMonth = month;
      cycleUsd = 0;
    }

    const dailyUsd = source.get(iso)?.dailyUsd || 0;
    cycleUsd += dailyUsd;

    out.push({
      date: iso,
      month,
      value: round(cycleUsd, 2)
    });

    d = shiftDateObj(d, 1);
  }

  return out;
}

function buildHeatmap(rowsDesc, weekCount) {
  const hoursByDate = new Map(rowsDesc.map((r) => [r.date, r.hours]));
  const end = toDate(todayIso());
  const currentWeekStart = weekStartMonday(end);
  const start = shiftDateObj(currentWeekStart, -((weekCount - 1) * 7));

  const weeks = [];
  for (let w = 0; w < weekCount; w += 1) {
    const weekStart = shiftDateObj(start, w * 7);
    const days = [];
    for (let d = 0; d < 7; d += 1) {
      const dateObj = shiftDateObj(weekStart, d);
      const iso = toIsoDate(dateObj);
      const hours = hoursByDate.get(iso) || 0;
      const isFuture = dateObj > end;
      const level = isFuture ? -1 : hours <= 0 ? 0 : hours < 2 ? 1 : hours < 4 ? 2 : hours < 7 ? 3 : 4;
      days.push({ iso, hours, level });
    }
    weeks.push({ weekStart: toIsoDate(weekStart), days });
  }

  return {
    weekdays: [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday"), t("sunday")],
    weeks
  };
}

function progressBar(pct) {
  const safe = Math.max(0, Math.min(100, pct));
  return `<div class="progress"><span style="width:${safe.toFixed(1)}%"></span><b>${safe.toFixed(1)}%</b></div>`;
}

function barChartSvg(series) {
  if (!series.length) return `<div class="empty muted">${t("noData")}</div>`;

  const width = 560;
  const height = 210;
  const pad = { top: 12, right: 44, bottom: 34, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxHours = Math.max(...series.map((s) => s.hours), 1);
  const maxIncome = Math.max(...series.map((s) => s.income), 1);
  const barW = Math.max(10, Math.floor(innerW / series.length) - 8);
  const stepHours = maxHours / 4;
  const stepIncome = maxIncome / 4;

  const grid = [...Array(5)]
    .map((_, i) => {
      const leftValue = (stepHours * i).toFixed(1);
      const rightValue = Math.round(stepIncome * i);
      const y = pad.top + innerH - (i / 4) * innerH;
      return `<g>
        <line class="axis-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />
        <text class="axis-y" x="${pad.left - 6}" y="${y + 3}" text-anchor="end">${leftValue}</text>
        <text class="axis-y" x="${width - pad.right + 6}" y="${y + 3}" text-anchor="start">$${rightValue}</text>
      </g>`;
    })
    .join("");

  const bars = series
    .map((s, i) => {
      const stepX = innerW / series.length;
      const x = pad.left + i * stepX + (stepX - barW) / 2;
      const h = Math.max(2, Math.round((s.hours / maxHours) * innerH));
      const y = pad.top + innerH - h;
      return `<g>
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" />
        <text class="axis-x" x="${x + barW / 2}" y="${height - 8}" text-anchor="middle">${escapeHtml(s.label)}</text>
      </g>`;
    })
    .join("");

  return `<svg class="chart bar-chart" viewBox="0 0 ${width} ${height}" role="img">
    ${grid}
    <line class="axis-line" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" />
    ${bars}
  </svg>`;
}

function rollingChartSvg(points) {
  if (points.length < 2) return `<div class="empty muted">${t("noEnoughData")}</div>`;

  const width = 980;
  const height = 280;
  const pad = { top: 12, right: 16, bottom: 38, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = points.flatMap((p) => [p.hours, p.avg]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const yStep = range / 4;

  const toPoint = (value, i) => {
    const x = pad.left + (i / (points.length - 1)) * innerW;
    const y = pad.top + innerH - ((value - min) / range) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const daily = points.map((p, i) => toPoint(p.hours, i)).join(" ");
  const rolling = points.map((p, i) => toPoint(p.avg, i)).join(" ");
  const startLabel = points[0]?.date || "";
  const endLabel = points[points.length - 1]?.date || "";

  const grid = [...Array(5)]
    .map((_, i) => {
      const v = min + yStep * i;
      const y = pad.top + innerH - (i / 4) * innerH;
      return `<g>
        <line class="axis-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />
        <text class="axis-y" x="${pad.left - 6}" y="${y + 3}" text-anchor="end">${v.toFixed(1)}</text>
      </g>`;
    })
    .join("");

  return `<svg class="chart line-chart" viewBox="0 0 ${width} ${height}" role="img">
    ${grid}
    <line class="axis-line" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" />
    <polyline class="daily" points="${daily}" />
    <polyline class="rolling" points="${rolling}" />
    <text class="axis-x" x="${pad.left}" y="${height - 10}" text-anchor="start">${escapeHtml(startLabel)}</text>
    <text class="axis-x" x="${width - pad.right}" y="${height - 10}" text-anchor="end">${escapeHtml(endLabel)}</text>
    <g class="chart-legend">
      <line x1="${pad.left + 6}" y1="${pad.top + 8}" x2="${pad.left + 30}" y2="${pad.top + 8}" class="daily" />
      <text x="${pad.left + 36}" y="${pad.top + 11}">${t("dailyHoursLabel")}</text>
      <line x1="${pad.left + 190}" y1="${pad.top + 8}" x2="${pad.left + 214}" y2="${pad.top + 8}" class="rolling" />
      <text x="${pad.left + 220}" y="${pad.top + 11}">${t("rollingAvgLabel")}</text>
    </g>
  </svg>`;
}

function cycleHistogramSvg(series) {
  if (!series.length) return `<div class="empty muted">${t("noData")}</div>`;

  const width = 1180;
  const height = 280;
  const pad = { top: 14, right: 18, bottom: 44, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxV = Math.max(...series.map((s) => s.value), 1);
  const stepY = maxV / 4;
  const stepX = innerW / series.length;
  const barW = Math.max(2, Math.min(14, stepX - 1));

  const grid = [...Array(5)]
    .map((_, i) => {
      const y = pad.top + innerH - (i / 4) * innerH;
      return `<g>
        <line class="axis-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />
        <text class="axis-y" x="${pad.left - 8}" y="${y + 3}" text-anchor="end">$${Math.round(stepY * i)}</text>
      </g>`;
    })
    .join("");

  let lastMonth = "";
  const bars = series
    .map((s, i) => {
      const h = Math.max(1, Math.round((s.value / maxV) * innerH));
      const x = pad.left + i * stepX + (stepX - barW) / 2;
      const y = pad.top + innerH - h;
      const day = s.date.slice(8, 10);
      const monthChanged = s.month !== lastMonth;
      if (monthChanged) lastMonth = s.month;

      const monthMarker = monthChanged
        ? `<line class="month-split" x1="${x - 2}" y1="${pad.top}" x2="${x - 2}" y2="${pad.top + innerH}" />
           <text class="axis-x month-label" x="${x + 1}" y="${height - 24}" text-anchor="start">${formatMonthLabel(s.month)}</text>`
        : "";

      const dayLabel = day === "01" || i % 5 === 0
        ? `<text class="axis-x" x="${x + barW / 2}" y="${height - 8}" text-anchor="middle">${Number(day)}</text>`
        : "";

      return `<g>
        ${monthMarker}
        <rect class="cycle-bar" x="${x}" y="${y}" width="${barW}" height="${h}" rx="2" />
        ${dayLabel}
      </g>`;
    })
    .join("");

  return `<svg class="chart cycle-hist-chart" viewBox="0 0 ${width} ${height}" role="img">
    ${grid}
    <line class="axis-line" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" />
    ${bars}
  </svg>`;
}

function heatmapHtml(data) {
  if (!data?.weeks?.length) return `<div class="empty muted">${t("noData")}</div>`;

  return `<div class="heatmap-wrap">
    <div class="heatmap-rows">
      ${data.weekdays.map((d) => `<span class="hm-day">${d}</span>`).join("")}
    </div>
    <div class="heatmap-grid">
      ${data.weeks
        .map(
          (week) =>
            `<div class="hm-week">${week.days
              .map((c) => `<span class="hm-cell l${c.level}" title="${c.iso}: ${c.hours}h"></span>`)
              .join("")}</div>`
        )
        .join("")}
    </div>
  </div>`;
}

function resolveRate(mode, customRate, settings) {
  if (mode === "standard") return Number(settings.standardRateUsd);
  if (mode === "special") return Number(settings.specialRateUsd);
  return Number(customRate);
}

function applyTheme() {
  const nextTheme = state.settings.theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nextTheme);
}

function renderRow(row) {
  return `
    <tr>
      <td>${row.date}</td>
      <td>${fmtHours(row.hours)}</td>
      <td>${fmtMoney(row.rateUsd)}</td>
      <td>${fmtMoney(row.dailyUsd)}</td>
      <td>${fmtHours(row.cycleHours)}</td>
      <td>${fmtHours(row.cumulativeHours)}</td>
      <td>${fmtHours(row.rolling10dAvg)}</td>
      <td class="muted">${escapeHtml(row.note || "")}</td>
      <td class="actions">
        <button class="btn tiny" data-action="edit" data-id="${row.id}">${t("edit")}</button>
        <button class="btn tiny danger" data-action="delete" data-id="${row.id}">${t("delete")}</button>
      </td>
    </tr>
  `;
}

async function fetchUsdTryRate() {
  const endpoints = [
    "https://open.er-api.com/v6/latest/USD",
    "https://api.frankfurter.app/latest?from=USD&to=TRY"
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      const tryRate = Number(data?.rates?.TRY);
      if (Number.isFinite(tryRate) && tryRate > 0) return tryRate;
    } catch {
      // try next endpoint
    }
  }

  throw new Error("No live rate source available");
}

function themeSunIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <line x1="12" y1="2" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.9" y1="4.9" x2="7" y2="7"/>
      <line x1="17" y1="17" x2="19.1" y2="19.1"/>
      <line x1="17" y1="7" x2="19.1" y2="4.9"/>
      <line x1="4.9" y1="19.1" x2="7" y2="17"/>
    </g>
  </svg>`;
}

function themeMoonIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`;
}

function refreshIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M20 5v5h-5M4 19v-5h5M6.8 9A7 7 0 0 1 19.2 10M17.2 15A7 7 0 0 1 4.8 14"/>
  </svg>`;
}

function buildExportCsv(rowsDesc) {
  const header = [
    "date",
    "hours",
    "rate_usd",
    "daily_usd",
    "daily_try",
    "cycle_key",
    "cycle_hours",
    "cycle_usd",
    "cumulative_hours",
    "cumulative_usd",
    "rolling_10d_avg",
    "note"
  ];

  const lines = [header.join(",")];
  for (const row of [...rowsDesc].reverse()) {
    lines.push(
      [
        row.date,
        row.hours,
        row.rateUsd,
        row.dailyUsd,
        row.dailyTry,
        row.cycleKey,
        row.cycleHours,
        row.cycleUsd,
        row.cumulativeHours,
        row.cumulativeUsd,
        row.rolling10dAvg,
        csvCell(row.note)
      ].join(",")
    );
  }

  return lines.join("\n");
}

function parseImportedCsv(text, settings) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { logs: [], warnings: [t("csvEmpty")] };

  const headers = rows[0].map((x) => String(x || "").trim());
  const map = buildHeaderMap(headers);

  const isInternalExport = mapHas(map, ["date"]) && mapHas(map, ["hours"]);
  const isExcelExport = mapHas(map, ["tarih"]) && (mapHas(map, ["gunluk"]) || mapHas(map, ["gunluk_saat"]));

  if (!isInternalExport && !isExcelExport) {
    return { logs: [], warnings: [t("expectedColumns")] };
  }

  const warnings = [];
  const out = [];

  const idxDate = pickHeaderIndex(map, isInternalExport ? ["date"] : ["tarih"]);
  const idxHours = pickHeaderIndex(map, isInternalExport ? ["hours"] : ["gunluk", "gunluk_saat"]);
  const idxDailyUsd = pickHeaderIndex(map, isInternalExport ? ["daily_usd"] : ["gunluk_usd"], "first");
  const idxDailyTry = pickHeaderIndex(map, isInternalExport ? ["daily_try"] : ["gunluk_tl"], "first");
  const idxRate = pickHeaderIndex(map, isInternalExport ? ["rate_usd"] : ["rate_usd"]);
  const idxNote = pickHeaderIndex(map, ["note", "not"]);

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row?.length) continue;

    const date = normalizeDate(row[idxDate]);
    const hours = toNum(row[idxHours]);
    if (!date) {
      warnings.push(t("rowInvalidDate", { row: i + 1 }));
      continue;
    }

    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      warnings.push(t("rowInvalidHours", { row: i + 1, value: row[idxHours] }));
      continue;
    }

    const directRate = toNum(idxRate >= 0 ? row[idxRate] : NaN);
    const dailyUsd = toNum(idxDailyUsd >= 0 ? row[idxDailyUsd] : NaN);
    const dailyTry = toNum(idxDailyTry >= 0 ? row[idxDailyTry] : NaN);

    const rateUsd = Number.isFinite(directRate)
      ? directRate
      : Number.isFinite(dailyUsd) && hours > 0
        ? dailyUsd / hours
        : Number(settings.standardRateUsd);

    const usdTry = Number.isFinite(dailyTry) && Number.isFinite(dailyUsd) && dailyUsd > 0
      ? dailyTry / dailyUsd
      : Number(settings.usdTry);

    out.push({
      id: uid(),
      date,
      hours: round(hours, 2),
      rateUsd: round(rateUsd, 5),
      usdTry: round(usdTry, 5),
      note: idxNote >= 0 ? String(row[idxNote] || "") : "",
      cycleId: date.slice(0, 7)
    });
  }

  const byDate = new Map();
  for (const log of out) {
    if (byDate.has(log.date)) warnings.push(t("duplicateDateWarn", { date: log.date }));
    byDate.set(log.date, log);
  }

  return {
    logs: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    warnings
  };
}

function buildHeaderMap(headers) {
  const map = new Map();
  headers.forEach((h, idx) => {
    const key = normalizeHeader(h);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(idx);
  });
  return map;
}

function pickHeaderIndex(map, aliases, mode = "last") {
  for (const alias of aliases) {
    const arr = map.get(alias);
    if (arr?.length) return mode === "first" ? arr[0] : arr[arr.length - 1];
  }
  return -1;
}

function mapHas(map, aliases) {
  return pickHeaderIndex(map, aliases) >= 0;
}

function normalizeHeader(input) {
  return String(input || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\$/g, "usd")
    .replace(/₺/g, "tl")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some((x) => String(x).trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((x) => String(x).trim() !== "")) rows.push(row);
  }

  return rows;
}

function normalizeDate(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;

  const dmy = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;

  return "";
}

function toNum(value) {
  if (value === null || value === undefined) return NaN;
  const cleaned = String(value)
    .trim()
    .replace(/\$/g, "")
    .replace(/₺/g, "")
    .replace(/,/g, "");
  return Number(cleaned);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtHours(value) {
  return `${round(Number(value) || 0, 2).toFixed(2)} h`;
}

function fmtMoney(value) {
  return `$${round(Number(value) || 0, 2).toFixed(2)}`;
}

function fmtTry(value) {
  return `₺${round(Number(value) || 0, 2).toFixed(2)}`;
}

function fmtDelta(pct) {
  if (!Number.isFinite(pct)) return "n/a";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function csvCell(value) {
  const text = String(value || "");
  if (!text.includes(",") && !text.includes('"') && !text.includes("\n")) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function avg(list) {
  if (!list.length) return 0;
  return list.reduce((sum, x) => sum + x, 0) / list.length;
}

function deltaPct(curr, prev) {
  if (!Number.isFinite(prev) || prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function toPercent(curr, target) {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return (curr / target) * 100;
}

function shortLabel(text) {
  const str = String(text || "");
  return str.length > 7 ? `${str.slice(0, 7)}.` : str;
}

function formatMonthLabel(ym) {
  const m = String(ym || "").match(/^(\d{4})-(\d{2})$/);
  if (!m) return String(ym || "");
  const year = m[1];
  const idx = Number(m[2]) - 1;
  const lang = state.settings.language === "en" ? "en" : "tr";
  const months = I18N[lang]?.monthsShort || I18N.tr.monthsShort;
  const monthName = months[idx] || m[2];
  return `${monthName} ${year}`;
}

function weekKey(dateIso) {
  const date = toDate(dateIso);
  return toIsoDate(weekStartMonday(date));
}

function weekStartMonday(date) {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return shiftDateObj(date, diff);
}

function shiftMonth(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m - 1) + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftDate(iso, days) {
  return toIsoDate(shiftDateObj(toDate(iso), days));
}

function shiftDateObj(date, days) {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function toDate(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function round(value, precision = 2) {
  const m = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * m) / m;
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nearlyEqual(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.00001;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
