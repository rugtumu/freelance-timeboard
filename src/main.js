import "./style.css";
import { invoke } from "@tauri-apps/api/core";

const STORAGE_KEYS = {
  logs: "work_tracker_logs_v1",
  expenses: "work_tracker_expenses_v1",
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
  expenses: [],
  settings: { ...DEFAULT_SETTINGS },
  editingId: null,
  editingExpenseId: null,
  activeTab: "dashboard",
  budgetView: {
    range: "90d",
    granularity: "daily",
    currency: "TRY"
  }
};

const I18N = {
  tr: {
    appOpenError: "Uygulama açılamadı",
    heading: "Günlük takip, performans analizi, tek panel",
    dashboard: "Panel",
    analysis: "Analiz",
    exportCsv: "CSV Dışa Aktar",
    importCsv: "CSV İçe Aktar",
    toLightTheme: "Açık Tema",
    toDarkTheme: "Koyu Tema",
    themeToggleAria: "Temayı değiştir",
    langToggleAria: "Dili değiştir",
    records: "Kayıtlar",
    income: "Gelir",
    expense: "Gider",
    budget: "Bütçe",
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
    english: "English",
    expenseEntry: "Gider Girişi",
    amount: "Tutar",
    currency: "Para Birimi",
    category: "Kategori",
    addExpense: "Gider Ekle",
    updateExpense: "Gider Güncelle",
    noExpenses: "Henüz gider yok.",
    invalidExpense: "Geçerli tarih, tutar ve para birimi gir.",
    totalExpense: "Toplam Gider",
    netBalance: "Net Bakiye",
    expenseBreakdown: "Gider Dağılımı",
    noExpenseData: "Henüz gider verisi yok.",
    exportSuccess: "Dosya kaydedildi: {path}",
    exportFailed: "CSV dışa aktarım başarısız oldu.",
    budgetTrend: "Gelir - Gider - Net Trend",
    cumulativeNet: "Kümülatif Net Bakiye",
    budgetRange: "Aralık",
    granularity: "Detay",
    daily: "Günlük",
    weekly: "Haftalık",
    range30d: "30 gün",
    range90d: "90 gün",
    rangeYtd: "Yıl başından bugüne",
    rangeAll: "Tümü",
    uncategorized: "Diğer",
    incomeLegend: "Gelir",
    expenseLegend: "Gider",
    netLegend: "Net"
  },
  en: {
    appOpenError: "Application failed to start",
    heading: "Daily tracking, performance analytics, single panel",
    dashboard: "Dashboard",
    analysis: "Analysis",
    exportCsv: "Export CSV",
    importCsv: "Import CSV",
    toLightTheme: "Light Theme",
    toDarkTheme: "Dark Theme",
    themeToggleAria: "Toggle theme",
    langToggleAria: "Toggle language",
    records: "Records",
    income: "Income",
    expense: "Expense",
    budget: "Budget",
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
    english: "English",
    expenseEntry: "Expense Entry",
    amount: "Amount",
    currency: "Currency",
    category: "Category",
    addExpense: "Add Expense",
    updateExpense: "Update Expense",
    noExpenses: "No expenses yet.",
    invalidExpense: "Enter valid date, amount and currency.",
    totalExpense: "Total Expense",
    netBalance: "Net Balance",
    expenseBreakdown: "Expense Breakdown",
    noExpenseData: "No expense data yet.",
    exportSuccess: "File saved: {path}",
    exportFailed: "CSV export failed.",
    budgetTrend: "Income - Expense - Net Trend",
    cumulativeNet: "Cumulative Net Balance",
    budgetRange: "Range",
    granularity: "Granularity",
    daily: "Daily",
    weekly: "Weekly",
    range30d: "30 days",
    range90d: "90 days",
    rangeYtd: "Year to date",
    rangeAll: "All",
    uncategorized: "Other",
    incomeLegend: "Income",
    expenseLegend: "Expense",
    netLegend: "Net"
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
  state.expenses = loaded.expenses;
  state.settings = { ...DEFAULT_SETTINGS, ...loaded.settings };
  applyTheme();
  renderApp();
}

const dataStore = {
  async load() {
    if (isTauriRuntime()) {
      try {
        const [logs, expenses, rawSettings] = await Promise.all([
          invoke("db_get_logs"),
          invoke("db_get_expenses"),
          invoke("db_get_settings")
        ]);

        let hydratedExpenses = Array.isArray(expenses) ? expenses.map(mapDbExpenseToUi) : [];
        const localExpenses = loadExpensesFromLocal();
        if (!hydratedExpenses.length && localExpenses.length) {
          for (const expense of localExpenses) {
            await invoke("db_upsert_expense", { expense: mapUiExpenseToDb(expense) });
          }
          hydratedExpenses = [...localExpenses];
        }

        return {
          logs: Array.isArray(logs) ? logs.map(mapDbLogToUi) : [],
          expenses: hydratedExpenses,
          settings: mapRawSettings(rawSettings)
        };
      } catch (error) {
        console.error("SQLite load failed, fallback localStorage:", error);
      }
    }

    return {
      logs: loadLogsFromLocal(),
      expenses: loadExpensesFromLocal(),
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
  },

  async upsertExpense(expense) {
    if (isTauriRuntime()) {
      await invoke("db_upsert_expense", { expense: mapUiExpenseToDb(expense) });
      return;
    }

    const expenses = loadExpensesFromLocal();
    const idx = expenses.findIndex((x) => x.id === expense.id);
    if (idx >= 0) expenses[idx] = expense;
    else expenses.push(expense);
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
  },

  async deleteExpense(id) {
    if (isTauriRuntime()) {
      await invoke("db_delete_expense", { id });
      return;
    }

    const expenses = loadExpensesFromLocal().filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
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

function loadExpensesFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.expenses);
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

function mapDbExpenseToUi(expense) {
  return {
    id: String(expense.id),
    date: String(expense.date),
    amount: Number(expense.amount) || 0,
    currency: String(expense.currency || "USD").toUpperCase() === "TRY" ? "TRY" : "USD",
    category: String(expense.category || ""),
    note: String(expense.note || "")
  };
}

function mapUiExpenseToDb(expense) {
  return {
    id: String(expense.id),
    date: String(expense.date),
    amount: Number(expense.amount) || 0,
    currency: String(expense.currency || "USD").toUpperCase() === "TRY" ? "TRY" : "USD",
    category: String(expense.category || ""),
    note: String(expense.note || "")
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
  const budget = deriveBudget(rowsDesc, state.expenses, state.settings, state.budgetView);

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
        <button class="tab ${state.activeTab === "income" ? "active" : ""}" data-tab="income">${t("income")}</button>
        <button class="tab ${state.activeTab === "expense" ? "active" : ""}" data-tab="expense">${t("expense")}</button>
        <button class="tab ${state.activeTab === "budget" ? "active" : ""}" data-tab="budget">${t("budget")}</button>
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

      <div class="panel ${state.activeTab === "income" ? "" : "hidden"}" data-panel="income">
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
        <h2>${t("income")}</h2>
        <div class="records-actions">
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

      <div class="panel ${state.activeTab === "expense" ? "" : "hidden"}" data-panel="expense">
      <main class="layout">
        <section class="card">
          <h2>${state.editingExpenseId ? t("updateExpense") : t("expenseEntry")}</h2>
          <form id="expense-form" class="form-grid">
            <label>
              ${t("date")}
              <input id="expense-date" name="date" type="date" required />
            </label>
            <label>
              ${t("amount")}
              <input id="expense-amount" name="amount" type="number" min="0" step="0.01" required />
            </label>
            <label>
              ${t("currency")}
              <select id="expense-currency" name="currency">
                <option value="USD">USD</option>
                <option value="TRY">TRY</option>
              </select>
            </label>
            <label>
              ${t("category")}
              <input id="expense-category" name="category" type="text" maxlength="48" placeholder="Kira, Market, Ulaşım..." />
            </label>
            <label class="full">
              ${t("note")}
              <input id="expense-note" name="note" type="text" maxlength="180" placeholder="${t("notePlaceholder")}" />
            </label>
            <div class="form-actions full">
              <button type="submit" class="btn primary">${state.editingExpenseId ? t("updateExpense") : t("addExpense")}</button>
              <button type="button" id="cancel-expense-edit" class="btn ghost ${state.editingExpenseId ? "" : "hidden"}">${t("cancel")}</button>
            </div>
          </form>
        </section>
      </main>

      <section class="card records-table-card">
        <h2>${t("expense")}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${t("date")}</th>
                <th>${t("category")}</th>
                <th>${t("amount")}</th>
                <th>USD</th>
                <th>TRY</th>
                <th>${t("note")}</th>
                <th>${t("action")}</th>
              </tr>
            </thead>
            <tbody>
              ${state.expenses.length ? [...state.expenses].sort((a, b) => b.date.localeCompare(a.date)).map(renderExpenseRow).join("") : `<tr><td colspan="7" class="empty">${t("noExpenses")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
      </div>

      <div class="panel ${state.activeTab === "budget" ? "" : "hidden"}" data-panel="budget">
      <section class="card budget-controls-card">
        <div class="budget-controls">
          <label>
            ${t("budgetRange")}
            <select id="budget-range">
              <option value="30d" ${state.budgetView.range === "30d" ? "selected" : ""}>${t("range30d")}</option>
              <option value="90d" ${state.budgetView.range === "90d" ? "selected" : ""}>${t("range90d")}</option>
              <option value="ytd" ${state.budgetView.range === "ytd" ? "selected" : ""}>${t("rangeYtd")}</option>
              <option value="all" ${state.budgetView.range === "all" ? "selected" : ""}>${t("rangeAll")}</option>
            </select>
          </label>
          <label>
            ${t("granularity")}
            <select id="budget-granularity">
              <option value="daily" ${state.budgetView.granularity === "daily" ? "selected" : ""}>${t("daily")}</option>
              <option value="weekly" ${state.budgetView.granularity === "weekly" ? "selected" : ""}>${t("weekly")}</option>
              <option value="monthly" ${state.budgetView.granularity === "monthly" ? "selected" : ""}>${t("monthly")}</option>
            </select>
          </label>
          <label>
            ${t("currency")}
            <select id="budget-currency">
              <option value="TRY" ${state.budgetView.currency === "TRY" ? "selected" : ""}>TRY</option>
              <option value="USD" ${state.budgetView.currency === "USD" ? "selected" : ""}>USD</option>
            </select>
          </label>
        </div>
      </section>

      <section class="kpi-grid budget-grid">
        <article class="card">
          <h3>${t("cumulativeIncome")}</h3>
          <p>${fmtMoney(budget.incomeUsd)}</p>
          <small class="muted">${fmtTry(budget.incomeTry)}</small>
        </article>
        <article class="card">
          <h3>${t("totalExpense")}</h3>
          <p>${fmtMoney(budget.expenseUsd)}</p>
          <small class="muted">${fmtTry(budget.expenseTry)}</small>
        </article>
        <article class="card">
          <h3>${t("netBalance")}</h3>
          <p>${fmtMoney(budget.netUsd)}</p>
          <small class="muted">${fmtTry(budget.netTry)}</small>
        </article>
      </section>

      <section class="viz-grid budget-viz-grid">
        <article class="card full-viz">
          <h3>${t("budgetTrend")}</h3>
          ${budgetTrendChartSvg(budget.series, state.budgetView.currency)}
        </article>
        <article class="card">
          <h3>${t("cumulativeNet")}</h3>
          ${budgetCumulativeChartSvg(budget.series, state.budgetView.currency)}
        </article>
        <article class="card">
          <h3>${t("expenseBreakdown")}</h3>
          ${budgetDonutSvg(budget.categories, state.budgetView.currency)}
        </article>
      </section>

      <section class="card records-table-card">
        <h2>${t("expenseBreakdown")}</h2>
        ${budget.categories.length ? `<div class="budget-list">${budget.categories.map((c) => `<div class="budget-item"><b>${escapeHtml(c.category)}</b><span>${fmtCurrency(c, state.budgetView.currency)} (${fmtCurrency(c, state.budgetView.currency === "TRY" ? "USD" : "TRY")})</span></div>`).join("")}</div>` : `<p class="muted">${t("noExpenseData")}</p>`}
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
  const expenseForm = document.getElementById("expense-form");
  const cancelExpenseEditBtn = document.getElementById("cancel-expense-edit");
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

  rateMode?.addEventListener("change", () => {
    customWrap.classList.toggle("hidden", rateMode.value !== "custom");
  });

  themeToggle?.addEventListener("click", async () => {
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

  langToggle?.addEventListener("click", async () => {
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

  entryForm?.addEventListener("submit", async (e) => {
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

  settingsForm?.addEventListener("submit", async (e) => {
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
  document.getElementById("export-csv")?.addEventListener("click", async () => {
    const csv = buildExportCsv(rowsDesc);
    const filename = `work-logs-${todayIso()}.csv`;
    await saveTextFile(filename, `\uFEFF${csv}`);
  });

  expenseForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(expenseForm);
    const date = String(form.get("date") || "").trim();
    const amount = Number(form.get("amount"));
    const currency = String(form.get("currency") || "USD").toUpperCase();
    const category = String(form.get("category") || "").trim() || "Diğer";
    const note = String(form.get("note") || "").trim();

    if (!date || !Number.isFinite(amount) || amount < 0 || !["USD", "TRY"].includes(currency)) {
      alert(t("invalidExpense"));
      return;
    }

    const payload = {
      id: state.editingExpenseId || uid(),
      date,
      amount: round(amount, 2),
      currency,
      category,
      note
    };

    state.expenses = state.expenses.filter((x) => x.id !== payload.id);
    state.expenses.push(payload);
    await dataStore.upsertExpense(payload);
    state.editingExpenseId = null;
    renderApp();
  });

  cancelExpenseEditBtn?.addEventListener("click", () => {
    state.editingExpenseId = null;
    renderApp();
  });

  document.querySelectorAll("[data-expense-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const row = state.expenses.find((r) => r.id === id);
      if (!row) return;

      state.editingExpenseId = row.id;
      renderApp();

      document.getElementById("expense-date").value = row.date;
      document.getElementById("expense-amount").value = String(row.amount);
      document.getElementById("expense-currency").value = row.currency;
      document.getElementById("expense-category").value = row.category || "";
      document.getElementById("expense-note").value = row.note || "";
    });
  });

  document.querySelectorAll("[data-expense-action='delete']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm(t("deleteConfirm"))) return;

      state.expenses = state.expenses.filter((x) => x.id !== id);
      if (state.editingExpenseId === id) state.editingExpenseId = null;
      await dataStore.deleteExpense(id);
      renderApp();
    });
  });
}

function initializeForm() {
  const dateInput = document.getElementById("entry-date");
  if (dateInput && !dateInput.value) dateInput.value = todayIso();
  const expenseDateInput = document.getElementById("expense-date");
  if (expenseDateInput && !expenseDateInput.value) expenseDateInput.value = todayIso();
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

function deriveBudget(rowsDesc, expenses, settings) {
  const incomeUsd = rowsDesc.reduce((sum, r) => sum + (Number(r.dailyUsd) || 0), 0);
  const incomeTry = rowsDesc.reduce((sum, r) => sum + (Number(r.dailyTry) || 0), 0);
  const usdTry = Number(settings.usdTry) || 1;

  const normalizedExpenses = (expenses || []).map((x) => {
    const amount = Number(x.amount) || 0;
    const currency = String(x.currency || "USD").toUpperCase() === "TRY" ? "TRY" : "USD";
    const usdAmount = currency === "USD" ? amount : amount / usdTry;
    const tryAmount = currency === "TRY" ? amount : amount * usdTry;
    return {
      ...x,
      usdAmount: round(usdAmount, 2),
      tryAmount: round(tryAmount, 2),
      category: String(x.category || "Diğer")
    };
  });

  const expenseUsd = normalizedExpenses.reduce((sum, x) => sum + x.usdAmount, 0);
  const expenseTry = normalizedExpenses.reduce((sum, x) => sum + x.tryAmount, 0);

  const categoryMap = new Map();
  for (const item of normalizedExpenses) {
    const prev = categoryMap.get(item.category) || { category: item.category, usdAmount: 0, tryAmount: 0 };
    prev.usdAmount += item.usdAmount;
    prev.tryAmount += item.tryAmount;
    categoryMap.set(item.category, prev);
  }

  const categories = Array.from(categoryMap.values())
    .map((c) => ({ ...c, usdAmount: round(c.usdAmount, 2), tryAmount: round(c.tryAmount, 2) }))
    .sort((a, b) => b.tryAmount - a.tryAmount);

  return {
    incomeUsd: round(incomeUsd, 2),
    incomeTry: round(incomeTry, 2),
    expenseUsd: round(expenseUsd, 2),
    expenseTry: round(expenseTry, 2),
    netUsd: round(incomeUsd - expenseUsd, 2),
    netTry: round(incomeTry - expenseTry, 2),
    categories
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
      <td>
        <div class="row-actions">
          <button class="btn tiny icon-btn" data-action="edit" data-id="${row.id}" title="${t("edit")}" aria-label="${t("edit")}">
            ${editIcon()}
          </button>
          <button class="btn tiny danger icon-btn" data-action="delete" data-id="${row.id}" title="${t("delete")}" aria-label="${t("delete")}">
            ${trashIcon()}
          </button>
        </div>
      </td>
    </tr>
  `;
}

function editIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 6V4h8v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 6l-1 14H6L5 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function renderExpenseRow(expense) {
  const usdTry = Number(state.settings.usdTry) || 1;
  const amount = Number(expense.amount) || 0;
  const currency = String(expense.currency || "USD").toUpperCase() === "TRY" ? "TRY" : "USD";
  const usdAmount = currency === "USD" ? amount : amount / usdTry;
  const tryAmount = currency === "TRY" ? amount : amount * usdTry;

  return `
    <tr>
      <td>${expense.date || ""}</td>
      <td>${escapeHtml(expense.category || "Diğer")}</td>
      <td>${currency} ${round(amount, 2).toFixed(2)}</td>
      <td>${fmtMoney(usdAmount)}</td>
      <td>${fmtTry(tryAmount)}</td>
      <td class="muted">${escapeHtml(expense.note || "")}</td>
      <td>
        <div class="row-actions">
          <button class="btn tiny icon-btn" data-expense-action="edit" data-id="${expense.id}" title="${t("edit")}" aria-label="${t("edit")}">
            ${editIcon()}
          </button>
          <button class="btn tiny danger icon-btn" data-expense-action="delete" data-id="${expense.id}" title="${t("delete")}" aria-label="${t("delete")}">
            ${trashIcon()}
          </button>
        </div>
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

async function saveTextFile(filename, content) {
  if (isTauriRuntime()) {
    try {
      const path = await invoke("save_text_file", { filename, content });
      alert(t("exportSuccess", { path }));
      return;
    } catch (error) {
      console.error("Tauri file save failed, fallback browser download:", error);
      alert(t("exportFailed"));
    }
  }

  downloadFile(content, filename, "text/csv;charset=utf-8;");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
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
