import "./style.css";
import { invoke } from "@tauri-apps/api/core";

const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

const STORAGE_KEYS = {
  logs: "work_tracker_logs_v1",
  expenses: "work_tracker_expenses_v1",
  settings: "work_tracker_settings_v1",
  investments: "work_tracker_investments_v1"
};

const TAB_ORDER = ["dashboard", "analysis", "clockLead", "data", "investment", "budget"];
const DEFAULT_VISIBLE_TABS = TAB_ORDER.reduce((acc, key) => {
  acc[key] = true;
  return acc;
}, {});

const DEFAULT_SETTINGS = {
  standardRateUsd: 25,
  specialRateUsd: 28.28125,
  usdTry: 43.88183,
  clockInHours: 0,
  leadTimeHours: 0,
  cycleResetRule: "monthly",
  weeklyTargetHours: 35,
  monthlyTargetHours: 140,
  theme: "dark",
  language: "tr",
  syncServerUrl: "",
  syncUsername: "",
  syncClientId: "",
  syncToken: "",
  syncTokenExpiresAt: "",
  syncLastSyncAt: "",
  exchangeKeys: [],
  visibleTabs: { ...DEFAULT_VISIBLE_TABS }
};

const state = {
  logs: [],
  expenses: [],
  investments: [],
  settings: { ...DEFAULT_SETTINGS },
  exchangeKeyStatus: {},
  vaultPassword: "",
  editingId: null,
  editingExpenseId: null,
  editingInvestmentId: null,
  activeTab: "dashboard",
  dataTab: "income",
  budgetView: {
    range: "90d",
    granularity: "daily",
    currency: "TRY"
  },
  investmentView: {
    filterType: "All",
    sortKey: "value",
    sortDir: "desc",
    query: ""
  },
  auth: {
    authenticated: false,
    password: "",
    busy: false,
    message: ""
  }
};

let dateDismissHandlerBound = false;

const I18N = {
  tr: {
    appOpenError: "Uygulama açılamadı",
    heading: "Günlük takip, performans analizi",
    dashboard: "Panel",
    analysis: "Analiz",
    data: "Veri",
    settingsTab: "Ayarlar",
    investment: "Yatırım",
    clockLead: "Clock/Lead",
    exportCsv: "CSV Dışa Aktar",
    importCsv: "CSV İçe Aktar",
    exportDataCsv: "Gelir+Gider CSV Dışa Aktar",
    importDataCsv: "Gelir+Gider CSV İçe Aktar",
    toLightTheme: "Açık Tema",
    toDarkTheme: "Koyu Tema",
    themeToggleAria: "Temayı değiştir",
    langToggleAria: "Dili değiştir",
    records: "Kayıtlar",
    income: "Gelir",
    expense: "Gider",
    budget: "Bütçe",
    investmentTitle: "Yatırım",
    investmentComingSoon: "Yatırım ekranı burada olacak.",
    totalValue: "Toplam Değer",
    investments: "Yatırımlar",
    cash: "Nakit",
    profitLoss: "Kar/Zarar",
    cashOut: "Nakit Çıkışı",
    best: "En İyi",
    beta: "Beta",
    sharpe: "Sharpe Oranı",
    sortino: "Sortino Oranı",
    volatility: "Volatilite",
    maxDrawdown: "Maks. Düşüş",
    performanceHistory: "Performans Geçmişi",
    allocation: "Dağılım",
    holdings: "Varlıklar",
    importHoldings: "İçe Aktar",
    addAsset: "Varlık Ekle",
    addAssetTitle: "Varlık Ekle",
    holdingsFilter: "Filtre",
    holdingsSort: "Sıralama",
    holdingsSearch: "Ara",
    sortValue: "Değer",
    sortPnl: "Kar/Zarar",
    sortWeight: "Ağırlık",
    sortName: "İsim",
    sortSymbol: "Sembol",
    sortAsc: "Artan",
    sortDesc: "Azalan",
    vaultPasswordNote: "Uygulamayı kapatıp açınca Vault parolasını tekrar girmen gerekir.",
    vaultPasswordPrompt: "Vault parolasını gir",
    costMissing: "Maliyet yok",
    symbol: "Sembol",
    assetType: "Tip",
    avgCost: "Ort. Maliyet",
    price: "Fiyat",
    sector: "Sektör",
    buyPrice: "Alış Fiyatı",
    currentPrice: "Güncel Fiyat",
    fetchPrice: "Fiyatı Çek",
    priceFetchFailed: "Güncel fiyat alınamadı.",
    priceFetchUnsupported: "Bu varlık türü için otomatik fiyat henüz desteklenmiyor.",
    bybitApiKey: "Bybit API Key",
    bybitApiSecret: "Bybit API Secret",
    bybitSync: "Senkronize Et",
    bybitSyncFailed: "Bybit senkronizasyonu başarısız oldu.",
    bybitMissingCreds: "Bybit API bilgileri eksik.",
    exchangeKeySaveFailed: "API anahtarı kaydedilemedi.",
    exchangeKeySaveFailedWithReason: "API anahtarı kaydedilemedi: {reason}",
    vaultPasswordRequired: "Keyring çalışmadığı için Vault parolası gerekli.",
    syncServer: "Sync Sunucusu",
    syncServerUrl: "Sunucu URL",
    syncUsername: "Kullanıcı Adı",
    syncPassword: "Şifre",
    signIn: "Giriş Yap",
    signOut: "Çıkış Yap",
    syncNow: "Şimdi Senkronize Et",
    syncPull: "Sunucudan Çek",
    syncPush: "Sunucuya Gönder",
    authRequired: "Devam etmek için giriş yapman gerekiyor.",
    authLoginTitle: "Pi Sync Girişi",
    authLoginSubtitle: "Verilerine erişmek için sunucuya giriş yap.",
    syncConnected: "Bağlı",
    syncDisconnected: "Bağlı değil",
    syncLoginFailed: "Giriş başarısız.",
    syncMissingConfig: "Sunucu URL ve kullanıcı adı gerekli.",
    syncUnauthorized: "Oturum süresi doldu. Lütfen tekrar giriş yap.",
    syncDone: "Senkronizasyon tamamlandı.",
    syncFailed: "Senkronizasyon başarısız oldu.",
    syncAutoPullFailed: "Giriş başarılı, ilk veri çekme başarısız oldu.",
    settingsGeneral: "Genel Ayarlar",
    tabVisibility: "Sekme Görünürlüğü",
    keySaved: "Kaydedildi",
    keyMissing: "Eksik",
    exchangeKeys: "Borsa API Anahtarları",
    exchange: "Borsa",
    apiKey: "API Key",
    apiSecret: "API Secret",
    addExchangeKey: "Borsa Ekle",
    remove: "Kaldır",
    clockLeadTitle: "Clock-in ve Lead Time",
    clockInTime: "Clock-in Time (saat)",
    leadTime: "Lead Time (saat)",
    clockLeadStatusTitle: "Risk Durumu",
    clockLeadRatio: "Clock/Lead Oranı",
    clockLeadNoData: "Clock-in ve Lead Time girildiğinde risk hesaplanır.",
    clockLeadRuleHint: "Eşikler: <1.10 Güvenli, 1.10-1.15 Riskli, 1.15-1.20 Tehlikeli, ≥1.20 Çok Riskli",
    riskSafe: "Güvenli Bölge",
    riskWarning: "Riskli Bölge",
    riskDanger: "Tehlikeli Bölge",
    riskCritical: "Çok Riskli Bölge",
    leadRangeHeader: "Lead Time'a Göre Clock-in Saat Aralıkları",
    riskSafeHours: "Güvenli (< 1.10x)",
    riskWarningHours: "Riskli (1.10x - 1.15x)",
    riskDangerHours: "Tehlikeli (1.15x - 1.20x)",
    riskCriticalHours: "Çok Riskli (>= 1.20x)",
    totalHours: "Toplam Saat",
    cumulativeIncome: "Kümülatif Gelir",
    cumulativeIncomeTry: "Kümülatif Gelir (TL)",
    monthHours: "Bu Ay Saat",
    weekHours: "Bu Hafta Saat",
    weekIncome: "Bu Hafta Gelir",
    monthIncome: "Bu Ay Gelir",
    previousMonth: "Önceki ay",
    previousWeek: "Önceki hafta",
    weeklyTarget: "Haftalık Hedef",
    monthlyTarget: "Aylık Hedef",
    weeklyHoursLast8: "Haftalık Saat (Bu Hafta)",
    monthlyHoursLast6: "Aylık Saat (Son 6 Ay)",
    dailyRolling: "Günlük Saat ve 10g Ortalama",
    heatmap20: "Gün Bazlı Heatmap (Son 20 Hafta)",
    weekdayProductivity: "Hafta Günü Verim Bar Grafiği",
    avgHours: "Ort. Saat",
    cycleHistogram: "Cycles Histogram ($)",
    editRecord: "Kaydı Düzenle",
    dailyEntry: "Günlük Veri Girişi",
    date: "Tarih",
    hours: "Saat",
    rateType: "Ücret Tipi",
    note: "Not",
    name: "İsim",
    value: "Değer",
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
    invalidClockLead: "Clock-in ve Lead Time 0'dan büyük olmalı.",
    deleteConfirm: "Kayıt silinsin mi?",
    csvInvalid: "CSV parse edilemedi ya da geçerli satır bulunamadı.",
    dataCsvInvalid: "Gelir/Gider CSV'si parse edilemedi ya da geçerli satır bulunamadı.",
    parsedCount: "{count} kayıt parse edildi.",
    warningCount: "Uyarı: {count} satır atlandı veya düzeltildi.",
    replaceConfirm: "Mevcut kayıtlar bununla değiştirilsin mi?",
    dataParsedSummary: "Gelir: {income}, Gider: {expense}.",
    dataReplaceConfirm: "Bu işlem mevcut Gelir ve Gider verilerini tamamen değiştirecek. Devam edilsin mi?",
    investmentReplaceConfirm: "Bu işlem mevcut yatırım verilerini tamamen değiştirecek. Devam edilsin mi?",
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
    rollingAvgLabel: "10g Ortalama",
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
    rowInvalidAmount: "Satır {row}: tutar geçersiz ({value}).",
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
    targetVarianceChart: "Hedef Sapma Grafiği (Saat)",
    cashflowWaterfall: "Aylık Cashflow Waterfall",
    startNet: "Başlangıç Net",
    endNet: "Bitiş Net",
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
    heading: "Daily tracking, performance analytics",
    dashboard: "Dashboard",
    analysis: "Analysis",
    data: "Data",
    settingsTab: "Settings",
    investment: "Investment",
    clockLead: "Clock/Lead",
    exportCsv: "Export CSV",
    importCsv: "Import CSV",
    exportDataCsv: "Export Income+Expense CSV",
    importDataCsv: "Import Income+Expense CSV",
    toLightTheme: "Light Theme",
    toDarkTheme: "Dark Theme",
    themeToggleAria: "Toggle theme",
    langToggleAria: "Toggle language",
    records: "Records",
    income: "Income",
    expense: "Expense",
    budget: "Budget",
    investmentTitle: "Investment",
    investmentComingSoon: "Investment dashboard will live here.",
    totalValue: "Total Value",
    investments: "Investments",
    cash: "Cash",
    profitLoss: "P/L",
    cashOut: "Cash Out",
    best: "Best",
    beta: "Beta",
    sharpe: "Sharpe",
    sortino: "Sortino",
    volatility: "Volatility",
    maxDrawdown: "Max Drawdown",
    performanceHistory: "Performance History",
    allocation: "Allocation",
    holdings: "Holdings",
    importHoldings: "Import",
    addAsset: "Add Asset",
    addAssetTitle: "Add Asset",
    holdingsFilter: "Filter",
    holdingsSort: "Sort",
    holdingsSearch: "Search",
    sortValue: "Value",
    sortPnl: "P/L",
    sortWeight: "Weight",
    sortName: "Name",
    sortSymbol: "Symbol",
    sortAsc: "Ascending",
    sortDesc: "Descending",
    vaultPasswordNote: "You need to re-enter the vault password after restarting the app.",
    vaultPasswordPrompt: "Enter vault password",
    costMissing: "Missing cost",
    symbol: "Symbol",
    assetType: "Type",
    avgCost: "Avg Cost",
    price: "Price",
    sector: "Sector",
    buyPrice: "Buy Price",
    currentPrice: "Current Price",
    fetchPrice: "Fetch Price",
    priceFetchFailed: "Failed to fetch current price.",
    priceFetchUnsupported: "Auto price fetch is not supported for this asset type yet.",
    bybitApiKey: "Bybit API Key",
    bybitApiSecret: "Bybit API Secret",
    bybitSync: "Sync",
    bybitSyncFailed: "Bybit sync failed.",
    bybitMissingCreds: "Bybit API credentials are missing.",
    exchangeKeySaveFailed: "API key could not be saved.",
    exchangeKeySaveFailedWithReason: "API key could not be saved: {reason}",
    vaultPasswordRequired: "Vault password is required because keyring is unavailable.",
    syncServer: "Sync Server",
    syncServerUrl: "Server URL",
    syncUsername: "Username",
    syncPassword: "Password",
    signIn: "Sign In",
    signOut: "Sign Out",
    syncNow: "Sync Now",
    syncPull: "Pull",
    syncPush: "Push",
    authRequired: "Sign in to continue.",
    authLoginTitle: "Pi Sync Login",
    authLoginSubtitle: "Sign in to access your data.",
    syncConnected: "Connected",
    syncDisconnected: "Disconnected",
    syncLoginFailed: "Login failed.",
    syncMissingConfig: "Server URL and username are required.",
    syncUnauthorized: "Session expired. Please sign in again.",
    syncDone: "Sync completed.",
    syncFailed: "Sync failed.",
    syncAutoPullFailed: "Signed in, but initial pull failed.",
    settingsGeneral: "General Settings",
    tabVisibility: "Tab Visibility",
    keySaved: "Saved",
    keyMissing: "Missing",
    exchangeKeys: "Exchange API Keys",
    exchange: "Exchange",
    apiKey: "API Key",
    apiSecret: "API Secret",
    addExchangeKey: "Add Exchange",
    remove: "Remove",
    clockLeadTitle: "Clock-in and Lead Time",
    clockInTime: "Clock-in Time (hours)",
    leadTime: "Lead Time (hours)",
    clockLeadStatusTitle: "Risk Status",
    clockLeadRatio: "Clock/Lead Ratio",
    clockLeadNoData: "Risk appears after entering Clock-in and Lead Time.",
    clockLeadRuleHint: "Thresholds: <1.10 Safe, 1.10-1.15 Warning, 1.15-1.20 Dangerous, ≥1.20 Critical",
    riskSafe: "Safe Zone",
    riskWarning: "Warning Zone",
    riskDanger: "Danger Zone",
    riskCritical: "Critical Zone",
    leadRangeHeader: "Clock-in Hour Ranges by Lead Time",
    riskSafeHours: "Safe (< 1.10x)",
    riskWarningHours: "Warning (1.10x - 1.15x)",
    riskDangerHours: "Danger (1.15x - 1.20x)",
    riskCriticalHours: "Critical (>= 1.20x)",
    totalHours: "Total Hours",
    cumulativeIncome: "Cumulative Income",
    cumulativeIncomeTry: "Cumulative Income (TRY)",
    monthHours: "This Month Hours",
    weekHours: "This Week Hours",
    weekIncome: "This Week Income",
    monthIncome: "This Month Income",
    previousMonth: "Previous month",
    previousWeek: "Previous week",
    weeklyTarget: "Weekly Target",
    monthlyTarget: "Monthly Target",
    weeklyHoursLast8: "Weekly Hours (This Week)",
    monthlyHoursLast6: "Monthly Hours (Last 6 Months)",
    dailyRolling: "Daily Hours and 10d Avg",
    heatmap20: "Day-based Heatmap (Last 20 Weeks)",
    weekdayProductivity: "Weekday Productivity Bars",
    avgHours: "Avg Hours",
    cycleHistogram: "Histogram of Cycles ($)",
    editRecord: "Edit Record",
    dailyEntry: "Daily Entry",
    date: "Date",
    hours: "Hours",
    rateType: "Rate Type",
    note: "Note",
    name: "Name",
    value: "Value",
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
    invalidClockLead: "Clock-in and Lead Time must be greater than 0.",
    deleteConfirm: "Delete this record?",
    csvInvalid: "CSV could not be parsed or no valid rows found.",
    dataCsvInvalid: "Income/Expense CSV could not be parsed or no valid rows found.",
    parsedCount: "{count} records parsed.",
    warningCount: "Warning: {count} rows were skipped or corrected.",
    replaceConfirm: "Replace current records with imported data?",
    dataParsedSummary: "Income: {income}, Expense: {expense}.",
    dataReplaceConfirm: "This will completely replace your Income and Expense data. Continue?",
    investmentReplaceConfirm: "This will completely replace your investment data. Continue?",
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
    rollingAvgLabel: "10d Avg",
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
    rowInvalidAmount: "Row {row}: invalid amount ({value}).",
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
    targetVarianceChart: "Target Variance Chart (Hours)",
    cashflowWaterfall: "Monthly Cashflow Waterfall",
    startNet: "Start Net",
    endNet: "End Net",
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
  state.investments = loaded.investments;
  state.settings = { ...DEFAULT_SETTINGS, ...loaded.settings };
  if (!state.settings.syncClientId) {
    state.settings.syncClientId = uid();
    await dataStore.saveSettings(state.settings);
  }
  state.auth.authenticated = hasValidSyncToken();
  if (!state.auth.authenticated) {
    state.settings.syncToken = "";
    state.settings.syncTokenExpiresAt = "";
  }
  await refreshExchangeKeyStatus();
  applyTheme();
  renderApp();
}

const dataStore = {
  async load() {
    if (isTauriRuntime()) {
      try {
        const [logs, expenses, rawSettings, investments] = await Promise.all([
          invoke("db_get_logs"),
          invoke("db_get_expenses"),
          invoke("db_get_settings"),
          invoke("db_get_investments")
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
          settings: mapRawSettings(rawSettings),
          investments: Array.isArray(investments) ? investments.map(mapDbInvestmentToUi) : []
        };
      } catch (error) {
        console.error("SQLite load failed, fallback localStorage:", error);
      }
    }

    return {
      logs: loadLogsFromLocal(),
      expenses: loadExpensesFromLocal(),
      settings: loadSettingsFromLocal(),
      investments: loadInvestmentsFromLocal()
    };
  },

  async saveSettings(settings) {
    if (isTauriRuntime()) {
      const payload = Object.fromEntries(
        Object.entries(settings).map(([k, v]) => {
          if (v && typeof v === "object") return [k, JSON.stringify(v)];
          return [k, String(v ?? "")];
        })
      );
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

  async upsertInvestment(investment) {
    if (isTauriRuntime()) {
      await invoke("db_upsert_investment", { investment: mapUiInvestmentToDb(investment) });
      return;
    }

    const investments = loadInvestmentsFromLocal();
    const idx = investments.findIndex((x) => x.id === investment.id);
    if (idx >= 0) investments[idx] = investment;
    else investments.push(investment);
    localStorage.setItem(STORAGE_KEYS.investments, JSON.stringify(investments));
  },

  async deleteInvestment(id) {
    if (isTauriRuntime()) {
      await invoke("db_delete_investment", { id });
      return;
    }
    const investments = loadInvestmentsFromLocal().filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEYS.investments, JSON.stringify(investments));
  },

  async replaceInvestments(investments) {
    if (isTauriRuntime()) {
      await invoke("db_replace_investments", { investments: investments.map(mapUiInvestmentToDb) });
      return;
    }
    localStorage.setItem(STORAGE_KEYS.investments, JSON.stringify(investments));
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
    app.innerHTML = `<div class="shell"><section class="card"><h2>${t("appOpenError")}</h2><p class="muted">${escapeHtml(String(error))}</p></section><footer class="app-footer">${appFooterHtml()}</footer></div>`;
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

function loadInvestmentsFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.investments);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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

function mapDbInvestmentToUi(investment) {
  return {
    id: String(investment.id),
    symbol: String(investment.symbol || ""),
    name: String(investment.name || ""),
    assetType: String(investment.asset_type || ""),
    amount: Number(investment.amount) || 0,
    avgCost: Number(investment.avg_cost) || 0,
    price: Number(investment.price) || 0,
    currency: String(investment.currency || "USD").toUpperCase() === "TRY" ? "TRY" : "USD",
    sector: String(investment.sector || ""),
    note: String(investment.note || "")
  };
}

function mapUiInvestmentToDb(investment) {
  return {
    id: String(investment.id),
    symbol: String(investment.symbol || ""),
    name: String(investment.name || ""),
    asset_type: String(investment.assetType || ""),
    amount: Number(investment.amount) || 0,
    avg_cost: Number(investment.avgCost) || 0,
    price: Number(investment.price) || 0,
    currency: String(investment.currency || "USD").toUpperCase() === "TRY" ? "TRY" : "USD",
    sector: String(investment.sector || ""),
    note: String(investment.note || "")
  };
}

function mapRawSettings(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const clockInHours = toNum(src.clockInHours);
  const leadTimeHours = toNum(src.leadTimeHours);
  return {
    standardRateUsd: toNum(src.standardRateUsd),
    specialRateUsd: toNum(src.specialRateUsd),
    usdTry: toNum(src.usdTry),
    clockInHours: Number.isFinite(clockInHours) ? clockInHours : DEFAULT_SETTINGS.clockInHours,
    leadTimeHours: Number.isFinite(leadTimeHours) ? leadTimeHours : DEFAULT_SETTINGS.leadTimeHours,
    cycleResetRule: src.cycleResetRule || DEFAULT_SETTINGS.cycleResetRule,
    weeklyTargetHours: toNum(src.weeklyTargetHours),
    monthlyTargetHours: toNum(src.monthlyTargetHours),
    theme: src.theme || DEFAULT_SETTINGS.theme,
    language: src.language || DEFAULT_SETTINGS.language,
    syncServerUrl: String(src.syncServerUrl || "").trim(),
    syncUsername: String(src.syncUsername || "").trim(),
    syncClientId: String(src.syncClientId || "").trim(),
    syncToken: String(src.syncToken || "").trim(),
    syncTokenExpiresAt: String(src.syncTokenExpiresAt || "").trim(),
    syncLastSyncAt: String(src.syncLastSyncAt || "").trim(),
    exchangeKeys: parseExchangeKeys(src.exchangeKeys),
    visibleTabs: normalizeVisibleTabs(src.visibleTabs)
  };
}

function normalizeVisibleTabs(raw) {
  if (!raw) return { ...DEFAULT_VISIBLE_TABS };
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }
  if (!parsed || typeof parsed !== "object") return { ...DEFAULT_VISIBLE_TABS };
  const out = { ...DEFAULT_VISIBLE_TABS };
  for (const key of Object.keys(out)) {
    if (typeof parsed[key] === "boolean") {
      out[key] = parsed[key];
    }
  }
  return out;
}

function parseExchangeKeys(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return [];
}

function renderApp() {
  const app = document.getElementById("app");
  if (!state.auth.authenticated) {
    app.innerHTML = loginScreenHtml();
    bindEvents([]);
    return;
  }

  const rowsDesc = deriveRows(state.logs, state.settings);
  const dashboard = deriveDashboard(rowsDesc, state.settings, state.expenses);
  const budget = deriveBudget(rowsDesc, state.expenses, state.settings, state.budgetView);
  const clockLead = deriveClockLeadAssessment(state.settings.clockInHours, state.settings.leadTimeHours);
  const visibleTabs = normalizeVisibleTabs(state.settings.visibleTabs);
  const availableTabs = TAB_ORDER.filter((tab) => visibleTabs[tab]);
  if (!availableTabs.length) {
    visibleTabs.dashboard = true;
    availableTabs.push("dashboard");
  }
  if (state.activeTab !== "settings" && !visibleTabs[state.activeTab]) {
    state.activeTab = availableTabs[0];
  }

  app.innerHTML = `
    <div class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Work, Expense, and Investment Tracker</p>
          <h1>${t("heading")}</h1>
        </div>
        <div class="hero-actions">
          <button id="theme-toggle" class="btn ghost icon-btn" title="${state.settings.theme === "dark" ? t("toLightTheme") : t("toDarkTheme")}" aria-label="${t("themeToggleAria")}">
            ${state.settings.theme === "dark" ? themeSunIcon() : themeMoonIcon()}
          </button>
          <button id="lang-toggle" class="btn ghost lang-btn" title="${t("langToggleAria")}" aria-label="${t("langToggleAria")}">
            ${state.settings.language === "tr" ? "EN" : "TR"}
          </button>
          <button id="settings-toggle" class="btn ghost icon-btn" title="${t("settingsTab")}" aria-label="${t("settingsTab")}">
            ${settingsIcon()}
          </button>
        </div>
      </header>

      <nav class="tabs">
        ${availableTabs
          .map(
            (tab) =>
              `<button class="tab ${state.activeTab === tab ? "active" : ""}" data-tab="${tab}">${t(tab)}</button>`
          )
          .join("")}
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
        <article class="card">
          <h3>${t("heatmap20")}</h3>
          ${heatmapHtml(dashboard.heatmap)}
        </article>
        <article class="card">
          <h3>${t("weekdayProductivity")}</h3>
          ${weekdayProductivityHtml(dashboard.weekdayProductivity)}
        </article>
      </section>
      </div>

      <div class="panel ${state.activeTab === "analysis" ? "" : "hidden"}" data-panel="analysis">
      <section class="kpi-grid analysis-kpi-grid">
        <article class="card">
          <h3>${t("weekHours")}</h3>
          <p>${fmtHours(dashboard.weekHours)}</p>
          <small class="muted">${t("previousWeek")}: ${fmtHours(dashboard.prevWeekHours)} (${fmtDelta(dashboard.weekDeltaPct)})</small>
        </article>
        <article class="card">
          <h3>${t("monthHours")}</h3>
          <p>${fmtHours(dashboard.monthHours)}</p>
          <small class="muted">${t("previousMonth")}: ${fmtHours(dashboard.prevMonthHours)} (${fmtDelta(dashboard.monthDeltaPct)})</small>
        </article>
        <article class="card">
          <h3>${t("totalHours")}</h3>
          <p>${fmtHours(dashboard.totalHours)}</p>
        </article>
      </section>

      <section class="kpi-grid analysis-kpi-grid analysis-income-grid">
        <article class="card">
          <h3>${t("weekIncome")}</h3>
          <p>${fmtMoney(dashboard.weekUsd)}</p>
          <small class="muted">${fmtTry(dashboard.weekTry)}</small>
        </article>
        <article class="card">
          <h3>${t("monthIncome")}</h3>
          <p>${fmtMoney(dashboard.monthUsd)}</p>
          <small class="muted">${fmtTry(dashboard.monthTry)}</small>
        </article>
        <article class="card tl-income-card">
          <h3>${t("cumulativeIncome")}</h3>
          <p>${fmtMoney(dashboard.totalUsd)}</p>
          <small class="muted">${fmtTry(dashboard.totalTry)}</small>
          <button
            id="refresh-usd-try-card"
            class="btn ghost icon-btn card-refresh-btn"
            title="${t("refreshRate")}"
            aria-label="${t("refreshRate")}"
          >
            ${refreshIcon()}
          </button>
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

      <!--
      <section class="viz-grid analysis-viz-grid">
        <article class="card">
          <h3>${t("targetVarianceChart")}</h3>
          ${targetVarianceChartSvg(dashboard.targetVarianceSeries)}
        </article>
        <article class="card">
          <h3>${t("cashflowWaterfall")} (${dashboard.waterfall.monthLabel})</h3>
          ${cashflowWaterfallSvg(dashboard.waterfall)}
        </article>
      </section>
      -->
      </div>

      <div class="panel ${state.activeTab === "clockLead" ? "" : "hidden"}" data-panel="clockLead">
      <main class="layout clocklead-layout">
        <section class="card">
          <h2>${t("clockLeadTitle")}</h2>
          <form id="clock-lead-form" class="form-grid">
            <label>
              ${t("clockInTime")}
              <input id="clock-in-hours" type="number" min="0" step="0.01" value="${fmtNumber(state.settings.clockInHours, 2)}" required />
            </label>
            <label>
              ${t("leadTime")}
              <input id="lead-time-hours" type="number" min="0" step="0.01" value="${fmtNumber(state.settings.leadTimeHours, 2)}" required />
            </label>
            <div class="form-actions full">
              <button type="submit" class="btn primary">${t("save")}</button>
            </div>
          </form>
        </section>

        <section class="card">
          <h2>${t("clockLeadStatusTitle")}</h2>
          ${
  clockLead.hasData
    ? `<p class="clocklead-ratio">${t("clockLeadRatio")}: <b>${clockLead.ratioText}</b><span class="risk-badge ${clockLead.className}">${clockLead.label}</span></p>`
    : `<p class="muted">${t("clockLeadNoData")}</p>`
}
          ${
  clockLead.hasLead
    ? `<div class="clocklead-title-spacer" aria-hidden="true"></div>
             <ul class="clocklead-ranges">
               <li class="${clockLead.className === "risk-safe" ? "is-active active-safe" : ""}"><span>${t("riskSafeHours")}</span><b>${fmtHours(state.settings.leadTimeHours)} - ${fmtHours(clockLead.threshold110)}</b></li>
               <li class="${clockLead.className === "risk-warning" ? "is-active active-warning" : ""}"><span>${t("riskWarningHours")}</span><b>${fmtHours(clockLead.threshold110)} - ${fmtHours(clockLead.threshold115)}</b></li>
               <li class="${clockLead.className === "risk-danger" ? "is-active active-danger" : ""}"><span>${t("riskDangerHours")}</span><b>${fmtHours(clockLead.threshold115)} - ${fmtHours(clockLead.threshold120)}</b></li>
               <li class="${clockLead.className === "risk-critical" ? "is-active active-critical" : ""}"><span>${t("riskCriticalHours")}</span><b>${fmtHours(clockLead.threshold120)}+</b></li>
             </ul>`
    : ""
}
        </section>
      </main>
      </div>

      <div class="panel ${state.activeTab === "data" ? "" : "hidden"}" data-panel="data">
      <div class="records-actions data-actions">
        <button id="export-csv-all" class="btn ghost">${t("exportDataCsv")}</button>
        <label class="btn ghost file-btn">
          ${t("importDataCsv")}
          <input id="import-csv-all" type="file" accept=".csv,text/csv" />
        </label>
      </div>
      <nav class="subtabs">
        <button class="subtab ${state.dataTab === "income" ? "active" : ""}" data-subtab="income">${t("income")}</button>
        <button class="subtab ${state.dataTab === "expense" ? "active" : ""}" data-subtab="expense">${t("expense")}</button>
      </nav>

      <div class="${state.dataTab === "income" ? "" : "hidden"}" data-subpanel="income">
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

      <div class="${state.dataTab === "expense" ? "" : "hidden"}" data-subpanel="expense">
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
      </div>

      <div class="panel settings-panel ${state.activeTab === "settings" ? "" : "hidden"}" data-panel="settings">
      <div class="panel-inner">
      <main class="layout">
        <form id="settings-form" class="settings-grid">
          <section class="card settings-card">
            <h2>${t("settingsGeneral")}</h2>
            <div class="form-grid">
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
            </div>
            <div class="form-actions full settings-actions">
              <button type="submit" class="btn primary">${t("save")}</button>
            </div>
          </section>

          <section class="card settings-card">
            <h2>${t("exchangeKeys")}</h2>
            <div class="form-grid">
              <div class="full">
                <div id="exchange-keys">
                  ${(state.settings.exchangeKeys?.length ? state.settings.exchangeKeys : [{ exchange: "bybit" }]).map((row) => `
                    <div class="exchange-key-row">
                      <label>
                        ${t("exchange")}
                        <select data-exchange="exchange">
                          <option value="bybit" ${row.exchange === "bybit" ? "selected" : ""}>Bybit</option>
                          <option value="binance" ${row.exchange === "binance" ? "selected" : ""}>Binance</option>
                          <option value="okx" ${row.exchange === "okx" ? "selected" : ""}>OKX</option>
                          <option value="kucoin" ${row.exchange === "kucoin" ? "selected" : ""}>KuCoin</option>
                        </select>
                      </label>
                      <label>
                        ${t("apiKey")}
                        <input type="password" data-exchange="apiKey" placeholder="••••••" value="" />
                      </label>
                      <label>
                        ${t("apiSecret")}
                        <input type="password" data-exchange="apiSecret" placeholder="••••••" value="" />
                      </label>
                      <button type="button" class="btn ghost" data-exchange-action="remove">${t("remove")}</button>
                      <span class="key-status">${t(state.exchangeKeyStatus?.[row.exchange] ? "keySaved" : "keyMissing")}</span>
                    </div>
                  `).join("")}
                </div>
                <button type="button" id="add-exchange-key" class="btn ghost">${t("addExchangeKey")}</button>
              </div>
              <div class="full">
                <label>
                ${t("vaultPassword")}
                <input id="setting-vault-password" type="password" placeholder="••••••" value="" />
                <span class="muted">${t("vaultPasswordNote")}</span>
              </label>
            </div>
            </div>
            <div class="form-actions full settings-actions">
              <button type="submit" class="btn primary">${t("save")}</button>
            </div>
          </section>

          <section class="card settings-card">
            <h2>${t("syncServer")}</h2>
            <div class="form-grid">
              <label>
                ${t("syncServerUrl")}
                <input id="setting-sync-url" type="text" placeholder="http://192.168.0.200:8080" value="${escapeHtml(state.settings.syncServerUrl || "")}" />
              </label>
              <label>
                ${t("syncUsername")}
                <input id="setting-sync-username" type="text" placeholder="umut" value="${escapeHtml(state.settings.syncUsername || "")}" />
              </label>
              <label>
                ${t("syncPassword")}
                <input id="setting-sync-password" type="password" placeholder="••••••" value="" />
              </label>
              <div class="full holdings-toolbar">
                <button type="button" id="sync-login" class="btn ghost">${t("signIn")}</button>
                <button type="button" id="sync-logout" class="btn ghost">${t("signOut")}</button>
                <button type="button" id="sync-now" class="btn primary">${t("syncNow")}</button>
                <button type="button" id="sync-pull" class="btn ghost">${t("syncPull")}</button>
                <button type="button" id="sync-push" class="btn ghost">${t("syncPush")}</button>
              </div>
              <div class="full">
                <small class="muted">${hasValidSyncToken() ? t("syncConnected") : t("syncDisconnected")} · ${state.settings.syncLastSyncAt ? state.settings.syncLastSyncAt : "-"}</small>
              </div>
            </div>
            <div class="form-actions full settings-actions">
              <button type="submit" class="btn primary">${t("save")}</button>
            </div>
          </section>

          <section class="card settings-card">
            <h2>${t("tabVisibility")}</h2>
            <div class="tab-visibility-list">
              ${TAB_ORDER.map((tab) => `
                <label class="toggle-row">
                  <span>${t(tab)}</span>
                  <input type="checkbox" data-tab-visibility="${tab}" ${visibleTabs[tab] ? "checked" : ""} />
                  <span class="toggle-pill"></span>
                </label>
              `).join("")}
            </div>
            <div class="form-actions full settings-actions">
              <button type="submit" class="btn primary">${t("save")}</button>
            </div>
          </section>

        </form>
      </main>
      </div>
      </div>

      <div class="panel ${state.activeTab === "investment" ? "" : "hidden"}" data-panel="investment">
      <div class="panel-inner">
        <main class="investment-layout">
          ${investmentPanelHtml()}
        </main>
      </div>
      </div>

      <div class="panel ${state.activeTab === "budget" ? "" : "hidden"}" data-panel="budget">
      <div class="panel-inner">
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
            <button
              id="refresh-usd-try-budget"
              class="btn ghost icon-btn card-refresh-btn"
              title="${t("refreshRate")}"
              aria-label="${t("refreshRate")}"
            >
              ${refreshIcon()}
            </button>
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
          <article class="card">
            <h3>${t("cumulativeNet")}</h3>
            ${budgetCumulativeChartSvg(budget.series, state.budgetView.currency)}
          </article>
          <article class="card">
            <h3>${t("expenseBreakdown")}</h3>
            ${budgetDonutSvg(budget.categories, state.budgetView.currency)}
            ${budgetCategoryListHtml(budget)}
          </article>
        </section>
      </div>
      </div>

      <footer class="app-footer">${appFooterHtml()}</footer>
    </div>
  
`;

  bindEvents(rowsDesc);
  initializeForm();
}

function appFooterHtml() {
  return `Developed by <a id="creator-link" href="https://github.com/rugtumu" target="_blank" rel="noopener noreferrer">@rugtumu</a> · v${escapeHtml(APP_VERSION)}`;
}

function loginScreenHtml() {
  return `
    <div class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Work, Expense, and Investment Tracker</p>
          <h1>${t("authLoginTitle")}</h1>
          <p class="muted">${t("authLoginSubtitle")}</p>
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
      <section class="card" style="max-width:560px; margin:0 auto;">
        <form id="login-form" class="form-grid">
          <label class="full">
            ${t("syncServerUrl")}
            <input id="login-server-url" type="text" placeholder="http://192.168.0.200:8080" value="${escapeHtml(state.settings.syncServerUrl || "")}" required />
          </label>
          <label class="full">
            ${t("syncUsername")}
            <input id="login-username" type="text" value="${escapeHtml(state.settings.syncUsername || "")}" required />
          </label>
          <label class="full">
            ${t("syncPassword")}
            <input id="login-password" type="password" placeholder="••••••" required />
          </label>
          <div class="form-actions">
            <button id="login-submit" class="btn primary" type="submit">${t("signIn")}</button>
          </div>
          <small class="muted">${escapeHtml(state.auth.message || t("authRequired"))}</small>
        </form>
      </section>
      <footer class="app-footer">${appFooterHtml()}</footer>
    </div>
  `;
}

function deriveClockLeadAssessment(clockInHours, leadTimeHours) {
  const clock = Number(clockInHours);
  const lead = Number(leadTimeHours);
  const hasLead = Number.isFinite(lead) && lead > 0;
  const threshold110 = hasLead ? round(lead * 1.1, 2) : 0;
  const threshold115 = hasLead ? round(lead * 1.15, 2) : 0;
  const threshold120 = hasLead ? round(lead * 1.2, 2) : 0;

  if (!Number.isFinite(clock) || !hasLead || clock <= 0) {
    return {
      hasData: false,
      hasLead,
      threshold110,
      threshold115,
      threshold120,
      ratioText: "-",
      label: "",
      className: ""
    };
  }

  const ratio = clock / lead;
  if (ratio < 1.1) {
    return { hasData: true, hasLead, threshold110, threshold115, threshold120, ratioText: `${fmtNumber(ratio, 2)}x`, label: t("riskSafe"), className: "risk-safe" };
  }
  if (ratio < 1.15) {
    return { hasData: true, hasLead, threshold110, threshold115, threshold120, ratioText: `${fmtNumber(ratio, 2)}x`, label: t("riskWarning"), className: "risk-warning" };
  }
  if (ratio < 1.2) {
    return { hasData: true, hasLead, threshold110, threshold115, threshold120, ratioText: `${fmtNumber(ratio, 2)}x`, label: t("riskDanger"), className: "risk-danger" };
  }
  return { hasData: true, hasLead, threshold110, threshold115, threshold120, ratioText: `${fmtNumber(ratio, 2)}x`, label: t("riskCritical"), className: "risk-critical" };
}

function bindEvents(rowsDesc) {
  const loginForm = document.getElementById("login-form");
  const loginServerUrl = document.getElementById("login-server-url");
  const loginUsername = document.getElementById("login-username");
  const loginPassword = document.getElementById("login-password");
  const loginSubmit = document.getElementById("login-submit");
  const entryForm = document.getElementById("entry-form");
  const settingsForm = document.getElementById("settings-form");
  const rateMode = document.getElementById("entry-rate-mode");
  const customWrap = document.getElementById("custom-rate-wrap");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const importCsvInput = document.getElementById("import-csv");
  const importCsvAllInput = document.getElementById("import-csv-all");
  const expenseForm = document.getElementById("expense-form");
  const cancelExpenseEditBtn = document.getElementById("cancel-expense-edit");
  const themeToggle = document.getElementById("theme-toggle");
  const langToggle = document.getElementById("lang-toggle");
  const settingsToggle = document.getElementById("settings-toggle");
  const refreshUsdTryBtn = document.getElementById("refresh-usd-try");
  const refreshUsdTryCardBtn = document.getElementById("refresh-usd-try-card");
  const refreshUsdTryBudgetBtn = document.getElementById("refresh-usd-try-budget");
  const clockLeadForm = document.getElementById("clock-lead-form");
  const budgetRange = document.getElementById("budget-range");
  const budgetGranularity = document.getElementById("budget-granularity");
  const budgetCurrency = document.getElementById("budget-currency");
  const creatorLink = document.getElementById("creator-link");
  const assetModal = document.getElementById("asset-modal");
  const assetForm = document.getElementById("asset-form");
  const openAssetModalBtn = document.getElementById("open-asset-modal");
  const importInvestmentsInput = document.getElementById("import-investments");
  const assetPriceFetchBtn = document.getElementById("asset-price-fetch");
  const bybitSyncBtn = document.getElementById("sync-bybit");
  const syncLoginBtn = document.getElementById("sync-login");
  const syncLogoutBtn = document.getElementById("sync-logout");
  const syncNowBtn = document.getElementById("sync-now");
  const syncPullBtn = document.getElementById("sync-pull");
  const syncPushBtn = document.getElementById("sync-push");
  const addExchangeKeyBtn = document.getElementById("add-exchange-key");
  const exchangeKeysContainer = document.getElementById("exchange-keys");
  const assetTypeSelect = document.getElementById("asset-type");
  const assetNameInput = document.getElementById("asset-name");
  const assetSectorInput = document.getElementById("asset-sector");
  const assetCurrencySelect = document.getElementById("asset-currency");

  if (loginForm) {
    const doLoginSubmit = async (e) => {
      e.preventDefault();
      const serverUrl = String(loginServerUrl?.value || "").trim();
      const username = String(loginUsername?.value || "").trim();
      const password = String(loginPassword?.value || "");
      if (!serverUrl || !username || !password) {
        state.auth.message = t("syncMissingConfig");
        renderApp();
        return;
      }
      state.auth.busy = true;
      state.auth.message = "";
      if (loginSubmit) loginSubmit.disabled = true;
      try {
        const loginResult = await loginToSyncServer(serverUrl, username, password);
        state.auth.password = password;
        state.auth.authenticated = true;
        state.settings.syncServerUrl = normalizeServerUrl(serverUrl);
        state.settings.syncUsername = username;
        state.settings.syncToken = loginResult.token;
        state.settings.syncTokenExpiresAt = loginResult.expiresAt;
        await dataStore.saveSettings(state.settings);
        try {
          await runSyncPull();
        } catch (error) {
          const msg = String(error?.message || "").trim();
          console.warn("initial sync pull failed after login:", error);
          alert(msg ? `${t("syncAutoPullFailed")}\n${msg}` : t("syncAutoPullFailed"));
        }
        renderApp();
      } catch (error) {
        const reason = String(error?.message || "").trim();
        state.auth.message = reason ? `${t("syncLoginFailed")} ${reason}` : t("syncLoginFailed");
        state.auth.authenticated = false;
        state.settings.syncToken = "";
        state.settings.syncTokenExpiresAt = "";
        await dataStore.saveSettings(state.settings);
        renderApp();
      } finally {
        state.auth.busy = false;
        if (loginSubmit) loginSubmit.disabled = false;
      }
    };

    loginForm.addEventListener("submit", doLoginSubmit);

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
    return;
  }

  document.querySelectorAll(".tab[data-tab]").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      state.activeTab = tabBtn.getAttribute("data-tab") || "dashboard";
      renderApp();
    });
  });

  document.querySelectorAll(".subtab[data-subtab]").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      state.dataTab = tabBtn.getAttribute("data-subtab") || "income";
      renderApp();
    });
  });

  budgetRange?.addEventListener("change", () => {
    state.budgetView.range = budgetRange.value;
    renderApp();
  });

  budgetGranularity?.addEventListener("change", () => {
    state.budgetView.granularity = budgetGranularity.value;
    renderApp();
  });

  budgetCurrency?.addEventListener("change", () => {
    state.budgetView.currency = budgetCurrency.value === "USD" ? "USD" : "TRY";
    renderApp();
  });

  settingsToggle?.addEventListener("click", () => {
    state.activeTab = "settings";
    renderApp();
  });

  openAssetModalBtn?.addEventListener("click", () => {
    state.editingInvestmentId = null;
    openAssetModal();
  });

  assetModal?.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeAssetModal());
  });

  assetForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(assetForm);
    const symbol = String(form.get("symbol") || "").trim().toUpperCase();
    const assetType = String(form.get("assetType") || "Stock");
    const name = String(form.get("name") || "").trim();
    const sector = String(form.get("sector") || "").trim();
    const currency = String(form.get("currency") || "USD").toUpperCase() === "TRY" ? "TRY" : "USD";
    const amount = Number(form.get("amount"));
    const avgCost = Number(form.get("avgCost"));
    let price = Number(form.get("price"));

    if (!symbol || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(avgCost) || avgCost <= 0) {
      alert(t("invalidExpense"));
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      try {
        price = await fetchAssetPrice(symbol, assetType);
      } catch (error) {
        if (String(error?.message || "").includes("unsupported")) {
          alert(t("priceFetchUnsupported"));
        } else {
          alert(t("priceFetchFailed"));
        }
        return;
      }
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert(t("invalidExpense"));
      return;
    }

    const payload = {
      id: state.editingInvestmentId || uid(),
      symbol,
      name,
      assetType,
      sector,
      currency,
      amount: round(amount, 6),
      avgCost: Number.isFinite(avgCost) ? round(avgCost, 4) : 0,
      price: Number.isFinite(price) ? round(price, 4) : 0,
      note: ""
    };

    state.investments = state.investments.filter((x) => x.id !== payload.id);
    state.investments.push(payload);
    await dataStore.upsertInvestment(payload);
    closeAssetModal();
    renderApp();
  });

  assetPriceFetchBtn?.addEventListener("click", async () => {
    const symbol = String(document.getElementById("asset-symbol")?.value || "").trim().toUpperCase();
    const assetType = String(document.getElementById("asset-type")?.value || "Stock");
    if (!symbol) return;
    try {
      const price = await fetchAssetPrice(symbol, assetType);
      const priceInput = document.getElementById("asset-price");
      if (priceInput) priceInput.value = String(round(price, 4));
    } catch (error) {
      if (String(error?.message || "").includes("unsupported")) {
        alert(t("priceFetchUnsupported"));
      } else {
        alert(t("priceFetchFailed"));
      }
    }
  });

  const symbolInput = document.getElementById("asset-symbol");
  const markManual = (el, eventName = "input") => {
    if (!el) return;
    el.dataset.manual = "";
    el?.addEventListener(eventName, () => {
      el.dataset.manual = "1";
    });
  };
  markManual(assetTypeSelect, "change");
  markManual(assetCurrencySelect, "change");
  markManual(assetNameInput);
  markManual(assetSectorInput);

  symbolInput?.addEventListener("blur", () => {
    const symbol = String(symbolInput.value || "").trim().toUpperCase();
    if (!symbol) return;
    const info = lookupAssetInfo(symbol);
    if (!info) return;

    if (assetTypeSelect && !assetTypeSelect.dataset.manual) assetTypeSelect.value = info.assetType;
    if (assetNameInput && !assetNameInput.dataset.manual && !assetNameInput.value) assetNameInput.value = info.name;
    if (assetSectorInput && !assetSectorInput.dataset.manual && !assetSectorInput.value) assetSectorInput.value = info.sector || "";
    if (assetCurrencySelect && !assetCurrencySelect.dataset.manual) assetCurrencySelect.value = info.currency;
  });

  document.querySelectorAll("[data-investment-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const row = state.investments.find((x) => x.id === id);
      if (!row) return;
      state.editingInvestmentId = row.id;
      openAssetModal(row);
    });
  });

  document.querySelectorAll("[data-investment-action='delete']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm(t("deleteConfirm"))) return;
      state.investments = state.investments.filter((x) => x.id !== id);
      await dataStore.deleteInvestment(id);
      renderApp();
    });
  });

  document.querySelectorAll("[data-holdings-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const label = String(btn.getAttribute("data-holdings-filter") || "All");
      state.investmentView.filterType = label;
      renderApp();
    });
  });

  document.querySelectorAll("[data-holdings-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = String(th.getAttribute("data-holdings-sort") || "value");
      if (state.investmentView.sortKey === key) {
        state.investmentView.sortDir = state.investmentView.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.investmentView.sortKey = key;
        state.investmentView.sortDir = "desc";
      }
      renderApp();
    });
  });

  const holdingsSearch = document.getElementById("holdings-search");
  holdingsSearch?.addEventListener("input", () => {
    state.investmentView.query = holdingsSearch.value || "";
    renderApp();
  });

  importInvestmentsInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = parseInvestmentCsv(text);
    if (!result.items.length) {
      alert(t("csvInvalid"));
      return;
    }

    const summary = t("parsedCount", { count: result.items.length });
    const shouldReplace = confirm(`${summary} ${t("investmentReplaceConfirm")}`);
    if (!shouldReplace) return;

    state.investments = result.items;
    state.editingInvestmentId = null;
    await dataStore.replaceInvestments(result.items);
    renderApp();
  });

  bybitSyncBtn?.addEventListener("click", async () => {
    bybitSyncBtn.disabled = true;
    const runSync = async () => {
      const result = await invoke("bybit_fetch_investments", { vaultPassword: state.vaultPassword || null });
      const items = Array.isArray(result) ? result.map(mapDbInvestmentToUi) : [];
      state.investments = items;
      await dataStore.replaceInvestments(items);
      renderApp();
    };

    try {
      await runSync();
    } catch (error) {
      console.error("Bybit sync failed:", error);
      const msg = String(error?.message || "");
      if (msg.includes("missing bybit credentials") && !state.vaultPassword) {
        const entered = prompt(t("vaultPasswordPrompt"));
        if (entered && entered.trim()) {
          state.vaultPassword = entered.trim();
          await refreshExchangeKeyStatus();
          try {
            await runSync();
          } catch (retryError) {
            const retryMsg = String(retryError?.message || "");
            alert(retryMsg ? `${t("bybitSyncFailed")}\n${retryMsg}` : t("bybitSyncFailed"));
          }
        } else {
          alert(t("bybitMissingCreds"));
        }
      } else if (msg.includes("missing bybit credentials")) {
        alert(t("bybitMissingCreds"));
      } else if (msg) {
        alert(`${t("bybitSyncFailed")}\n${msg}`);
      } else {
        alert(t("bybitSyncFailed"));
      }
    } finally {
      bybitSyncBtn.disabled = false;
    }
  });

  syncLoginBtn?.addEventListener("click", async () => {
    const serverUrl = String(document.getElementById("setting-sync-url")?.value || "").trim();
    const username = String(document.getElementById("setting-sync-username")?.value || "").trim();
    const password = String(document.getElementById("setting-sync-password")?.value || "");
    if (!serverUrl || !username || !password) {
      alert(t("syncMissingConfig"));
      return;
    }
    syncLoginBtn.disabled = true;
    try {
      const loginResult = await loginToSyncServer(serverUrl, username, password);
      state.auth.password = password;
      state.auth.authenticated = true;
      state.settings.syncServerUrl = normalizeServerUrl(serverUrl);
      state.settings.syncUsername = username;
      state.settings.syncToken = loginResult.token;
      state.settings.syncTokenExpiresAt = loginResult.expiresAt;
      await dataStore.saveSettings(state.settings);
      try {
        await runSyncPull();
      } catch (error) {
        const msg = String(error?.message || "").trim();
        console.warn("initial sync pull failed after settings login:", error);
        alert(msg ? `${t("syncAutoPullFailed")}\n${msg}` : t("syncAutoPullFailed"));
      }
      renderApp();
    } catch (error) {
      const msg = String(error?.message || "").trim();
      alert(msg ? `${t("syncLoginFailed")}\n${msg}` : t("syncLoginFailed"));
    } finally {
      syncLoginBtn.disabled = false;
    }
  });

  syncLogoutBtn?.addEventListener("click", async () => {
    syncLogoutBtn.disabled = true;
    try {
      await logoutSyncServer();
    } finally {
      state.auth.password = "";
      state.auth.authenticated = false;
      state.settings.syncToken = "";
      state.settings.syncTokenExpiresAt = "";
      await dataStore.saveSettings(state.settings);
      renderApp();
      syncLogoutBtn.disabled = false;
    }
  });

  syncPullBtn?.addEventListener("click", async () => {
    syncPullBtn.disabled = true;
    try {
      await runSyncPull();
      alert(t("syncDone"));
    } catch (error) {
      const msg = String(error?.message || "").trim();
      alert(msg ? `${t("syncFailed")}\n${msg}` : t("syncFailed"));
    } finally {
      syncPullBtn.disabled = false;
      renderApp();
    }
  });

  syncPushBtn?.addEventListener("click", async () => {
    syncPushBtn.disabled = true;
    try {
      await runSyncPush();
      alert(t("syncDone"));
    } catch (error) {
      const msg = String(error?.message || "").trim();
      alert(msg ? `${t("syncFailed")}\n${msg}` : t("syncFailed"));
    } finally {
      syncPushBtn.disabled = false;
      renderApp();
    }
  });

  syncNowBtn?.addEventListener("click", async () => {
    syncNowBtn.disabled = true;
    try {
      await runSyncPull();
      await runSyncPush();
      await runSyncPull();
      alert(t("syncDone"));
    } catch (error) {
      const msg = String(error?.message || "").trim();
      alert(msg ? `${t("syncFailed")}\n${msg}` : t("syncFailed"));
    } finally {
      syncNowBtn.disabled = false;
      renderApp();
    }
  });

  addExchangeKeyBtn?.addEventListener("click", () => {
    if (!exchangeKeysContainer) return;
    const row = document.createElement("div");
    row.className = "exchange-key-row";
    row.innerHTML = `
      <label>
        ${t("exchange")}
        <select data-exchange="exchange">
          <option value="bybit">Bybit</option>
          <option value="binance">Binance</option>
          <option value="okx">OKX</option>
          <option value="kucoin">KuCoin</option>
        </select>
      </label>
      <label>
        ${t("apiKey")}
        <input type="password" data-exchange="apiKey" value="" />
      </label>
      <label>
        ${t("apiSecret")}
        <input type="password" data-exchange="apiSecret" value="" />
      </label>
      <button type="button" class="btn ghost" data-exchange-action="remove">${t("remove")}</button>
      <span class="key-status">${t("keyMissing")}</span>
    `;
    exchangeKeysContainer.appendChild(row);
  });

  exchangeKeysContainer?.addEventListener("click", (e) => {
    const target = e.target;
    if (target?.matches("[data-exchange-action='remove']")) {
      const row = target.closest(".exchange-key-row");
      row?.remove();
    }
  });

  creatorLink?.addEventListener("click", async (e) => {
    e.preventDefault();
    await openExternalUrl("https://github.com/rugtumu");
  });

  if (!dateDismissHandlerBound) {
    document.addEventListener(
      "pointerdown",
      (e) => {
        const active = document.activeElement;
        if (!(active instanceof HTMLInputElement) || active.type !== "date") return;
        if (e.target === active) return;
        active.blur();
      },
      true
    );
    dateDismissHandlerBound = true;
  }

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

  refreshUsdTryBudgetBtn?.addEventListener("click", async () => {
    await handleUsdTryRefresh(refreshUsdTryBudgetBtn);
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
    const syncServerUrl = String(document.getElementById("setting-sync-url")?.value || "").trim();
    const syncUsername = String(document.getElementById("setting-sync-username")?.value || "").trim();
    const syncPassword = String(document.getElementById("setting-sync-password")?.value || "");
    const vaultPasswordInput = document.getElementById("setting-vault-password");
    const vaultPassword = String(vaultPasswordInput?.value || "").trim();
    state.vaultPassword = vaultPassword;
    const exchangeRows = Array.from(document.querySelectorAll(".exchange-key-row"));
    const exchangeKeys = exchangeRows.map((row) => {
      const exchange = String(row.querySelector("[data-exchange='exchange']")?.value || "").trim();
      const apiKey = String(row.querySelector("[data-exchange='apiKey']")?.value || "").trim();
      const apiSecret = String(row.querySelector("[data-exchange='apiSecret']")?.value || "").trim();
      return { exchange, apiKey, apiSecret };
    }).filter((row) => row.exchange);
    const sanitizedKeys = exchangeKeys.map((row) => ({ exchange: row.exchange }));
    const prevExchanges = (state.settings.exchangeKeys || []).map((x) => x.exchange);
    const nextExchanges = sanitizedKeys.map((x) => x.exchange);

    for (const row of exchangeKeys) {
      if (row.apiKey || row.apiSecret) {
        try {
          await invoke("secure_store_exchange_key", {
            exchange: row.exchange,
            apiKey: row.apiKey,
            apiSecret: row.apiSecret,
            vaultPassword: vaultPassword || null
          });
          const verify = await invoke("secure_exchange_status", { exchanges: [row.exchange], vaultPassword: vaultPassword || null });
          if (!verify || !verify[row.exchange]) {
            if (!vaultPassword) {
              throw new Error("key storage verify failed (vault password required)");
            }
            throw new Error("key storage verify failed");
          }
        } catch (error) {
          console.error("exchange key save failed:", error);
          const reason = String(error?.message || error || "").trim();
          if (reason.includes("vault password required")) {
            alert(t("vaultPasswordRequired"));
          } else {
            alert(reason ? t("exchangeKeySaveFailedWithReason", { reason }) : t("exchangeKeySaveFailed"));
          }
          return;
        }
      }
    }

    for (const exchange of prevExchanges) {
      if (!nextExchanges.includes(exchange)) {
        await invoke("secure_delete_exchange_key", { exchange });
      }
    }

    const tabVisibilityInputs = Array.from(document.querySelectorAll("[data-tab-visibility]"));
    const nextVisibleTabs = {};
    for (const input of tabVisibilityInputs) {
      const tab = String(input.getAttribute("data-tab-visibility") || "");
      if (!tab) continue;
      nextVisibleTabs[tab] = Boolean(input.checked);
    }
    if (!Object.values(nextVisibleTabs).some(Boolean)) {
      nextVisibleTabs.dashboard = true;
    }

    const values = [standardRateUsd, specialRateUsd, usdTry, weeklyTargetHours, monthlyTargetHours];
    if (values.some((v) => !Number.isFinite(v) || v < 0)) {
      alert(t("invalidSettings"));
      await refreshExchangeKeyStatus();
      renderApp();
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
      language: language === "en" ? "en" : "tr",
      syncServerUrl: normalizeServerUrl(syncServerUrl),
      syncUsername,
      exchangeKeys: sanitizedKeys,
      visibleTabs: normalizeVisibleTabs(nextVisibleTabs)
    };

    if (syncPassword) {
      state.auth.password = syncPassword;
    }

    await dataStore.saveSettings(state.settings);
    await refreshExchangeKeyStatus();
    renderApp();
  });

  clockLeadForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const clockInHours = Number(document.getElementById("clock-in-hours").value);
    const leadTimeHours = Number(document.getElementById("lead-time-hours").value);
    if (!Number.isFinite(clockInHours) || !Number.isFinite(leadTimeHours) || clockInHours <= 0 || leadTimeHours <= 0) {
      alert(t("invalidClockLead"));
      return;
    }

    state.settings = {
      ...state.settings,
      clockInHours: round(clockInHours, 2),
      leadTimeHours: round(leadTimeHours, 2)
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

  importCsvAllInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseCombinedCsv(text, state.settings);

    if (!result.logs.length && !result.expenses.length) {
      alert(t("dataCsvInvalid"));
      return;
    }

    const summary = t("dataParsedSummary", { income: result.logs.length, expense: result.expenses.length });
    const shouldReplace = confirm(`${summary} ${t("dataReplaceConfirm")}`);
    if (!shouldReplace) return;

    state.logs = result.logs;
    state.expenses = result.expenses;
    state.editingId = null;
    state.editingExpenseId = null;
    await dataStore.replaceLogs(result.logs);
    await dataStore.replaceExpenses(result.expenses);
    renderApp();

    if (result.warnings.length) {
      alert(`${t("importDoneWarnings")}\n- ${result.warnings.slice(0, 5).join("\n- ")}`);
    }
  });

  document.getElementById("export-csv-all")?.addEventListener("click", async () => {
    const csv = buildCombinedCsv(state.logs, state.expenses);
    const filename = `work-data-${todayIso()}.csv`;
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

function deriveDashboard(rowsDesc, settings, expenses = []) {
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
  const weekUsd = weekMap.get(currentWeekKey)?.income || 0;
  const prevWeekHours = weekMap.get(prevWeekKey)?.hours || 0;

  const currentMonthKey = activeMonth;
  const prevMonthKey = shiftMonth(activeMonth, -1);
  const monthUsd = monthMap.get(currentMonthKey)?.income || 0;
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
  const targetVarianceSeries = [
    { label: t("weeklyTarget"), value: round(weekHours - Number(settings.weeklyTargetHours || 0), 2) },
    { label: t("monthlyTarget"), value: round(monthHours - Number(settings.monthlyTargetHours || 0), 2) }
  ];
  const waterfall = buildMonthlyWaterfall(rowsDesc, expenses, settings, activeMonth);

  return {
    totalHours: round(totalHours, 2),
    totalUsd: round(totalUsd, 2),
    totalTry: round(totalTry, 2),
    monthHours: round(monthHours, 2),
    latest10dAvg: round(latest10dAvg, 2),
    latestDate,
    weekHours: round(weekHours, 2),
    weekUsd: round(weekUsd, 2),
    weekTry: round(weekUsd * (Number(settings.usdTry) || 0), 2),
    prevWeekHours: round(prevWeekHours, 2),
    weekDeltaPct: deltaPct(weekHours, prevWeekHours),
    monthUsd: round(monthUsd, 2),
    monthTry: round(monthUsd * (Number(settings.usdTry) || 0), 2),
    prevMonthHours: round(prevMonthHours, 2),
    monthDeltaPct: deltaPct(monthHours, prevMonthHours),
    weekGoalPct,
    monthGoalPct,
    targetVarianceSeries,
    waterfall,
    weeklySeries,
    monthlySeries,
    rollingSeries,
    heatmap: buildHeatmap(rowsDesc, 20),
    weekdayProductivity: buildWeekdayProductivity(rowsDesc),
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

function buildMonthlyWaterfall(rowsDesc, expenses, settings, activeMonth) {
  const incomeByMonth = new Map();
  for (const row of rowsDesc) {
    const key = row.date.slice(0, 7);
    incomeByMonth.set(key, (incomeByMonth.get(key) || 0) + (Number(row.dailyUsd) || 0));
  }

  const usdTry = Number(settings.usdTry) || 1;
  const expenseByMonth = new Map();
  for (const expense of expenses || []) {
    const key = String(expense.date || "").slice(0, 7);
    if (!key) continue;
    const amount = Number(expense.amount) || 0;
    const currency = String(expense.currency || "USD").toUpperCase() === "TRY" ? "TRY" : "USD";
    const usdAmount = currency === "USD" ? amount : amount / usdTry;
    expenseByMonth.set(key, (expenseByMonth.get(key) || 0) + usdAmount);
  }

  const months = [...new Set([...incomeByMonth.keys(), ...expenseByMonth.keys()])].sort();
  const monthKey = months.includes(activeMonth) ? activeMonth : months[months.length - 1] || activeMonth || todayIso().slice(0, 7);

  let startNet = 0;
  for (const month of months) {
    if (month >= monthKey) break;
    startNet += (incomeByMonth.get(month) || 0) - (expenseByMonth.get(month) || 0);
  }

  const income = incomeByMonth.get(monthKey) || 0;
  const expense = expenseByMonth.get(monthKey) || 0;
  const endNet = startNet + income - expense;

  return {
    month: monthKey,
    monthLabel: formatMonthLabel(monthKey),
    startNet: round(startNet, 2),
    income: round(income, 2),
    expense: round(expense, 2),
    endNet: round(endNet, 2)
  };
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

function buildWeekdayProductivity(rowsDesc) {
  const labels = [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday"), t("sunday")];
  const buckets = labels.map((label, idx) => ({ label, dayIndex: idx + 1, totalHours: 0, count: 0 }));

  for (const row of rowsDesc) {
    const d = toDate(row.date);
    const day = ((d.getDay() + 6) % 7) + 1; // 1=Mon ... 7=Sun
    const bucket = buckets[day - 1];
    bucket.totalHours += Number(row.hours) || 0;
    bucket.count += 1;
  }

  const withAvg = buckets.map((b) => ({
    ...b,
    avgHours: b.count ? round(b.totalHours / b.count, 2) : 0
  }));

  const maxAvg = Math.max(...withAvg.map((x) => x.avgHours), 0.01);
  return withAvg.map((x) => ({
    ...x,
    level: x.avgHours <= 0 ? 0 : x.avgHours < maxAvg * 0.25 ? 1 : x.avgHours < maxAvg * 0.5 ? 2 : x.avgHours < maxAvg * 0.75 ? 3 : 4
  }));
}

function deriveBudget(rowsDesc, expenses, settings, view = { range: "90d", granularity: "daily" }) {
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
      category: String(x.category || t("uncategorized"))
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

  const dailySeries = buildBudgetDailySeries(rowsDesc, normalizedExpenses, view.range);
  const series = aggregateBudgetSeries(dailySeries, view.granularity);

  return {
    incomeUsd: round(incomeUsd, 2),
    incomeTry: round(incomeTry, 2),
    expenseUsd: round(expenseUsd, 2),
    expenseTry: round(expenseTry, 2),
    netUsd: round(incomeUsd - expenseUsd, 2),
    netTry: round(incomeTry - expenseTry, 2),
    categories,
    series
  };
}

function buildBudgetDailySeries(rowsDesc, expenses, range = "90d") {
  const incomeByDate = new Map();
  const expenseByDate = new Map();

  for (const row of rowsDesc) {
    const prev = incomeByDate.get(row.date) || { usd: 0, try: 0 };
    incomeByDate.set(row.date, {
      usd: prev.usd + (Number(row.dailyUsd) || 0),
      try: prev.try + (Number(row.dailyTry) || 0)
    });
  }

  for (const expense of expenses) {
    const key = String(expense.date || "");
    if (!key) continue;
    const prev = expenseByDate.get(key) || { usd: 0, try: 0 };
    expenseByDate.set(key, {
      usd: prev.usd + (Number(expense.usdAmount) || 0),
      try: prev.try + (Number(expense.tryAmount) || 0)
    });
  }

  const allDates = [...incomeByDate.keys(), ...expenseByDate.keys()].sort();
  if (!allDates.length) return [];

  const end = toDate(allDates[allDates.length - 1]);
  let start = toDate(allDates[0]);

  if (range === "30d") start = shiftDateObj(end, -29);
  if (range === "90d") start = shiftDateObj(end, -89);
  if (range === "ytd") start = new Date(end.getFullYear(), 0, 1);

  const points = [];
  let d = new Date(start);
  while (d <= end) {
    const iso = toIsoDate(d);
    const income = incomeByDate.get(iso) || { usd: 0, try: 0 };
    const expense = expenseByDate.get(iso) || { usd: 0, try: 0 };
    points.push({
      key: iso,
      label: iso,
      incomeUsd: round(income.usd, 2),
      incomeTry: round(income.try, 2),
      expenseUsd: round(expense.usd, 2),
      expenseTry: round(expense.try, 2)
    });
    d = shiftDateObj(d, 1);
  }

  return points;
}

function aggregateBudgetSeries(points, granularity = "daily") {
  if (granularity === "daily") {
    return points.map((p) => ({
      ...p,
      netUsd: round(p.incomeUsd - p.expenseUsd, 2),
      netTry: round(p.incomeTry - p.expenseTry, 2)
    }));
  }

  const map = new Map();
  for (const p of points) {
    const key = granularity === "weekly" ? weekKey(p.key) : p.key.slice(0, 7);
    const prev = map.get(key) || { incomeUsd: 0, incomeTry: 0, expenseUsd: 0, expenseTry: 0 };
    map.set(key, {
      incomeUsd: prev.incomeUsd + p.incomeUsd,
      incomeTry: prev.incomeTry + p.incomeTry,
      expenseUsd: prev.expenseUsd + p.expenseUsd,
      expenseTry: prev.expenseTry + p.expenseTry
    });
  }

  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => ({
    key,
    label: granularity === "monthly" ? formatMonthLabel(key) : key,
    incomeUsd: round(v.incomeUsd, 2),
    incomeTry: round(v.incomeTry, 2),
    expenseUsd: round(v.expenseUsd, 2),
    expenseTry: round(v.expenseTry, 2),
    netUsd: round(v.incomeUsd - v.expenseUsd, 2),
    netTry: round(v.incomeTry - v.expenseTry, 2)
  }));
}

function budgetTrendChartSvg(series, currency = "TRY") {
  if (!series.length) return `<div class="empty muted">${t("noData")}</div>`;

  const width = 980;
  const height = 280;
  const pad = { top: 12, right: 14, bottom: 38, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const incomeKey = currency === "USD" ? "incomeUsd" : "incomeTry";
  const expenseKey = currency === "USD" ? "expenseUsd" : "expenseTry";
  const cumulativeIncome = [];
  const cumulativeExpense = [];
  let runningIncome = 0;
  let runningExpense = 0;
  for (const point of series) {
    runningIncome += Number(point[incomeKey]) || 0;
    runningExpense += Number(point[expenseKey]) || 0;
    cumulativeIncome.push(round(runningIncome, 2));
    cumulativeExpense.push(round(runningExpense, 2));
  }

  const values = series.flatMap((_, i) => [cumulativeIncome[i], cumulativeExpense[i]]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const yStep = range / 4;

  const toPoint = (value, i) => {
    const x = pad.left + (i / Math.max(1, series.length - 1)) * innerW;
    const y = pad.top + innerH - ((value - min) / range) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const incomeLine = series.map((_, i) => toPoint(cumulativeIncome[i], i)).join(" ");
  const expenseLine = series.map((_, i) => toPoint(cumulativeExpense[i], i)).join(" ");

  const grid = [...Array(5)]
    .map((_, i) => {
      const v = min + yStep * i;
      const y = pad.top + innerH - (i / 4) * innerH;
      const txt = currency === "USD" ? `$${Math.round(v)}` : `₺${Math.round(v)}`;
      return `<g>
        <line class="axis-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />
        <text class="axis-y" x="${pad.left - 8}" y="${y + 3}" text-anchor="end">${txt}</text>
      </g>`;
    })
    .join("");

  const startLabel = series[0]?.label || "";
  const endLabel = series[series.length - 1]?.label || "";

  return `<svg class="chart budget-line-chart" viewBox="0 0 ${width} ${height}" role="img">
    ${grid}
    <line class="axis-line" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" />
    <polyline class="income" points="${incomeLine}" />
    <polyline class="expense" points="${expenseLine}" />
    <text class="axis-x" x="${pad.left}" y="${height - 10}" text-anchor="start">${escapeHtml(startLabel)}</text>
    <text class="axis-x" x="${width - pad.right}" y="${height - 10}" text-anchor="end">${escapeHtml(endLabel)}</text>
    <g class="chart-legend">
      <line x1="${pad.left + 6}" y1="${pad.top + 8}" x2="${pad.left + 26}" y2="${pad.top + 8}" class="income" />
      <text x="${pad.left + 32}" y="${pad.top + 11}">${t("incomeLegend")}</text>
      <line x1="${pad.left + 140}" y1="${pad.top + 8}" x2="${pad.left + 160}" y2="${pad.top + 8}" class="expense" />
      <text x="${pad.left + 166}" y="${pad.top + 11}">${t("expenseLegend")}</text>
    </g>
  </svg>`;
}

function budgetCumulativeChartSvg(series, currency = "TRY") {
  if (!series.length) return `<div class="empty muted">${t("noData")}</div>`;

  const width = 520;
  const height = 240;
  const pad = { top: 14, right: 10, bottom: 32, left: 54 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const netKey = currency === "USD" ? "netUsd" : "netTry";

  let acc = 0;
  const points = series.map((p) => {
    acc += Number(p[netKey]) || 0;
    return round(acc, 2);
  });

  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const range = max - min || 1;

  const toXY = (value, i) => {
    const x = pad.left + (i / Math.max(1, points.length - 1)) * innerW;
    const y = pad.top + innerH - ((value - min) / range) * innerH;
    return [x, y];
  };

  const line = points.map((v, i) => {
    const [x, y] = toXY(v, i);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const [sx] = toXY(points[0], 0);
  const [ex] = toXY(points[points.length - 1], points.length - 1);
  const zeroY = pad.top + innerH - ((0 - min) / range) * innerH;
  const area = `${sx.toFixed(1)},${zeroY.toFixed(1)} ${line} ${ex.toFixed(1)},${zeroY.toFixed(1)}`;
  const cls = points[points.length - 1] >= 0 ? "positive" : "negative";

  return `<svg class="chart budget-cumulative-chart" viewBox="0 0 ${width} ${height}" role="img">
    <line class="axis-grid" x1="${pad.left}" y1="${zeroY}" x2="${width - pad.right}" y2="${zeroY}" />
    <polygon class="area ${cls}" points="${area}" />
    <polyline class="line ${cls}" points="${line}" />
  </svg>`;
}

function budgetDonutSvg(categories, currency = "TRY") {
  if (!categories.length) return `<div class="empty muted">${t("noData")}</div>`;

  const width = 520;
  const height = 240;
  const cx = 112;
  const cy = 120;
  const r = 72;
  const sw = 24;
  const key = currency === "USD" ? "usdAmount" : "tryAmount";
  const colors = ["#ff9500", "#3aa7ff", "#ff5f57", "#2ec4b6", "#9b5de5", "#7f8c8d"];

  const sorted = [...categories].sort((a, b) => (b[key] || 0) - (a[key] || 0));
  const top = sorted.slice(0, 5);
  const other = sorted.slice(5).reduce((sum, x) => sum + (x[key] || 0), 0);
  if (other > 0) top.push({ category: t("uncategorized"), usdAmount: other, tryAmount: other });
  const total = top.reduce((s, c) => s + (c[key] || 0), 0) || 1;

  let a0 = -Math.PI / 2;
  const segs = top.map((c, i) => {
    const val = c[key] || 0;
    const da = (val / total) * Math.PI * 2;
    const a1 = a0 + da;
    const x1 = cx + Math.cos(a0) * r;
    const y1 = cy + Math.sin(a0) * r;
    const x2 = cx + Math.cos(a1) * r;
    const y2 = cy + Math.sin(a1) * r;
    const large = da > Math.PI ? 1 : 0;
    const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    a0 = a1;
    return { d, color: colors[i % colors.length], category: c.category, value: val };
  });

  return `<svg class="chart budget-donut-chart" viewBox="0 0 ${width} ${height}" role="img">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-alt)" stroke-width="${sw}" />
    ${segs.map((s) => `<path d="${s.d}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-linecap="round" />`).join("")}
    <text class="axis-y" x="${cx}" y="${cy - 2}" text-anchor="middle">${currency}</text>
    <text class="axis-y" x="${cx}" y="${cy + 14}" text-anchor="middle">${Math.round(total).toLocaleString()}</text>
    ${segs.map((s, i) => `<g><rect x="228" y="${30 + i * 28}" width="10" height="10" rx="2" fill="${s.color}" /><text class="axis-x" x="244" y="${39 + i * 28}">${escapeHtml(s.category)} (${Math.round((s.value / total) * 100)}%)</text></g>`).join("")}
  </svg>`;
}

function targetVarianceChartSvg(series) {
  if (!series.length) return `<div class="empty muted">${t("noData")}</div>`;

  const width = 520;
  const height = 240;
  const pad = { top: 14, right: 10, bottom: 38, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxAbs = Math.max(1, ...series.map((s) => Math.abs(s.value)));
  const barW = Math.min(90, innerW / Math.max(1, series.length) - 22);
  const zeroY = pad.top + innerH / 2;

  const bars = series.map((s, i) => {
    const x = pad.left + (i + 0.5) * (innerW / series.length) - barW / 2;
    const h = Math.max(2, Math.abs(s.value / maxAbs) * (innerH / 2));
    const y = s.value >= 0 ? zeroY - h : zeroY;
    const cls = s.value >= 0 ? "pos" : "neg";
    const sign = s.value > 0 ? "+" : "";
    return `<g>
      <rect class="variance-bar ${cls}" x="${x}" y="${y}" width="${barW}" height="${h}" rx="6" />
      <text class="axis-x" x="${x + barW / 2}" y="${height - 12}" text-anchor="middle">${escapeHtml(s.label)}</text>
      <text class="axis-y" x="${x + barW / 2}" y="${y - 6}" text-anchor="middle">${sign}${s.value.toFixed(1)}h</text>
    </g>`;
  }).join("");

  return `<svg class="chart target-variance-chart" viewBox="0 0 ${width} ${height}" role="img">
    <line class="axis-grid" x1="${pad.left}" y1="${zeroY}" x2="${width - pad.right}" y2="${zeroY}" />
    ${bars}
  </svg>`;
}

function cashflowWaterfallSvg(data) {
  if (!data) return `<div class="empty muted">${t("noData")}</div>`;

  const steps = [
    { label: t("startNet"), value: data.startNet, base: 0, cls: "net" },
    { label: t("incomeLegend"), value: data.income, base: data.startNet, cls: "inc" },
    { label: t("expenseLegend"), value: -data.expense, base: data.startNet + data.income, cls: "exp" },
    { label: t("endNet"), value: data.endNet, base: 0, cls: "net" }
  ];

  const width = 520;
  const height = 240;
  const pad = { top: 14, right: 10, bottom: 38, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const vals = steps.flatMap((s) => [s.base, s.base + s.value]);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 1);
  const range = max - min || 1;
  const stepW = innerW / steps.length;
  const barW = Math.min(72, stepW - 18);
  const toY = (v) => pad.top + innerH - ((v - min) / range) * innerH;

  const bars = steps.map((s, i) => {
    const x = pad.left + i * stepW + (stepW - barW) / 2;
    const y1 = s.cls === "net" ? toY(0) : toY(s.base);
    const y2 = s.cls === "net" ? toY(s.value) : toY(s.base + s.value);
    const y = Math.min(y1, y2);
    const h = Math.max(2, Math.abs(y1 - y2));
    const labelValue = s.cls === "exp" ? `-$${Math.abs(s.value).toFixed(0)}` : `$${Math.abs(s.value).toFixed(0)}`;
    return `<g>
      <rect class="waterfall-bar ${s.cls}" x="${x}" y="${y}" width="${barW}" height="${h}" rx="6" />
      <text class="axis-x" x="${x + barW / 2}" y="${height - 12}" text-anchor="middle">${escapeHtml(s.label)}</text>
      <text class="axis-y" x="${x + barW / 2}" y="${y - 6}" text-anchor="middle">${labelValue}</text>
    </g>`;
  }).join("");

  return `<svg class="chart cashflow-waterfall" viewBox="0 0 ${width} ${height}" role="img">
    <line class="axis-grid" x1="${pad.left}" y1="${toY(0)}" x2="${width - pad.right}" y2="${toY(0)}" />
    ${bars}
  </svg>`;
}

function fmtCurrency(entry, currency = "TRY") {
  if (currency === "USD") return fmtMoney(entry.usdAmount);
  return fmtTry(entry.tryAmount);
}

function budgetCategoryListHtml(budget) {
  if (!budget.categories.length) return `<p class="muted">${t("noExpenseData")}</p>`;
  const baseTry = Number(budget.expenseTry) || 0;
  const baseUsd = Number(budget.expenseUsd) || 0;
  const base = baseTry || baseUsd || 0;

  return `<div class="budget-list compact">${budget.categories.map((c) => {
    const amount = baseTry ? c.tryAmount : c.usdAmount;
    const pct = base > 0 ? Math.round((amount / base) * 100) : 0;
    return `<div class="budget-item"><b>${escapeHtml(c.category)} (${pct}%)</b><span>${fmtTry(c.tryAmount)} (${fmtMoney(c.usdAmount)})</span></div>`;
  }).join("")}</div>`;
}

function investmentPanelHtml() {
  const data = deriveInvestment(state.investments, state.settings);
  const view = state.investmentView;
  const filterType = view.filterType || "All";
  const query = (view.query || "").trim().toLowerCase();
  let holdings = [...data.holdings];
  if (filterType !== "All") {
    holdings = holdings.filter((row) => row.assetType === filterType);
  }
  if (query) {
    holdings = holdings.filter((row) => {
      const hay = `${row.symbol} ${row.name} ${row.assetType} ${row.sector}`.toLowerCase();
      return hay.includes(query);
    });
  }
  const sortKey = view.sortKey || "value";
  const sortDir = view.sortDir === "asc" ? 1 : -1;
  const getSortValue = (row) => {
    switch (sortKey) {
      case "pnl":
        return row.pnlUsd;
      case "weight":
        return row.weight;
      case "name":
        return row.name;
      case "symbol":
        return row.symbol;
      default:
        return row.valueUsd;
    }
  };
  holdings.sort((a, b) => {
    const va = getSortValue(a);
    const vb = getSortValue(b);
    if (typeof va === "string" || typeof vb === "string") {
      return String(va).localeCompare(String(vb)) * sortDir;
    }
    return (Number(va) - Number(vb)) * sortDir;
  });
  const sortIndicator = (key) => (sortKey === key ? (view.sortDir === "asc" ? " ▲" : " ▼") : "");
  const allocationTotal = data.allocation.reduce((sum, x) => sum + x.value, 0) || 1;

  return `
    <section class="investment-kpi-grid">
      ${investmentKpiCard(t("totalValue"), `$${fmtNumber(data.overview.totalUsd, 2)}`, `₺${fmtNumber(data.overview.totalTry, 2)}`, "accent-gold", "currency")}
      ${investmentKpiCard(t("investments"), `$${fmtNumber(data.overview.investmentsUsd, 2)}`, `${data.overview.investmentsCount} varlık`, "accent-gold", "briefcase")}
      ${investmentKpiCard(t("cash"), `$${fmtNumber(data.overview.cashUsd, 2)}`, "USD + TRY toplam", "accent-green", "cash")}
      ${investmentKpiCard(t("profitLoss"), `${data.overview.pnlUsd < 0 ? "-" : ""}$${fmtNumber(Math.abs(data.overview.pnlUsd), 2)}`, `${fmtNumber(data.overview.pnlPct, 2)}%`, data.overview.pnlUsd < 0 ? "accent-red" : "accent-green", "trend")}
      ${investmentKpiCard(t("cashOut"), `$${fmtNumber(data.overview.cashOutUsd, 2)}`, `Düzeltilmiş: $${fmtNumber(data.overview.cashOutAdjustedUsd, 2)}`, "accent-purple", "wallet")}
    </section>

    <section class="investment-stat-grid">
      ${data.stats.map((stat) => `
        <article class="card stat-card ${stat.cls || ""}">
          <p class="stat-title">${t(stat.key)}</p>
          <p class="stat-value">${escapeHtml(stat.label)}</p>
          ${stat.value ? `<small class="muted">${escapeHtml(stat.value)}</small>` : ""}
        </article>
      `).join("")}
    </section>

    <section class="investment-main-grid">
      <article class="card investment-performance">
        <div class="card-header">
          <h3>${t("performanceHistory")}</h3>
          <span class="chip">vs S&P 500</span>
        </div>
        ${investmentPerformanceSvg(data.performance)}
      </article>
      <article class="card investment-allocation">
        <div class="card-header">
          <h3>${t("allocation")}</h3>
        </div>
        <div class="allocation-grid">
          ${investmentAllocationDonut(data.allocation, allocationTotal)}
          <div class="allocation-bars">
            ${data.allocation.map((item) => {
              const pct = Math.round((item.value / allocationTotal) * 1000) / 10;
              return `
                <div class="allocation-bar">
                  <div>
                    <b>${escapeHtml(item.label)}</b>
                    <span class="muted">${pct}%</span>
                  </div>
                  <div class="allocation-track">
                    <span style="width:${pct}%; background:${item.color}"></span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </article>
    </section>

    <section class="card investment-holdings">
      <div class="card-header">
        <div>
          <h3>${t("holdings")} (${holdings.length})</h3>
          <small class="muted">Varlıklarınızı yönetin</small>
        </div>
        <div class="holding-cta">
          <button id="sync-bybit" class="btn ghost">${t("bybitSync")}</button>
          <label class="btn ghost file-btn">
            ${t("importHoldings")}
            <input id="import-investments" type="file" accept=".csv,text/csv" />
          </label>
          <button id="open-asset-modal" class="btn primary">${t("addAsset")}</button>
        </div>
      </div>
      <div class="holdings-controls">
        <div class="chips">
          ${["All", "Stock", "ETF", "BIST", "TEFAS", "Crypto", "Bond", "Commodity", "Cash"].map((label) => `
            <button class="chip ${filterType === label ? "active" : ""}" data-holdings-filter="${label}">${label}</button>
          `).join("")}
        </div>
        <div class="holdings-toolbar">
          <label>
            ${t("holdingsSearch")}
            <input id="holdings-search" type="text" value="${escapeHtml(view.query || "")}" placeholder="${t("holdingsSearch")}" />
          </label>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="sortable" data-holdings-sort="symbol">${t("symbol")}${sortIndicator("symbol")}</th>
              <th>${t("assetType")}</th>
              <th>${t("amount")}</th>
              <th>${t("buyPrice")}</th>
              <th>${t("currentPrice")}</th>
              <th class="sortable" data-holdings-sort="value">${t("value") || "Değer"}${sortIndicator("value")}</th>
              <th class="sortable" data-holdings-sort="weight">Ağırlık${sortIndicator("weight")}</th>
              <th class="sortable" data-holdings-sort="pnl">Kar %${sortIndicator("pnl")}</th>
              <th class="sortable" data-holdings-sort="pnl">Kar $${sortIndicator("pnl")}</th>
              <th>${t("action")}</th>
            </tr>
          </thead>
          <tbody>
            ${holdings.length ? holdings.map((row) => `
              <tr>
                <td><b>${escapeHtml(row.symbol)}</b></td>
                <td><span class="pill">${escapeHtml(row.assetType)}</span></td>
                <td>${fmtNumber(row.amount, 6)}</td>
                <td>${row.costMissing ? "-" : fmtMoney(row.avgCost)}${row.costMissing ? ` <span class="warn-pill">${t("costMissing")}</span>` : ""}</td>
                <td>${fmtMoney(row.price)}</td>
                <td><b>${fmtMoney(row.valueUsd)}</b><br/><small class="muted">(${fmtTry(row.valueTry)})</small></td>
                <td>${fmtNumber(row.weight, 1)}%</td>
                <td class="${row.pnlPct < 0 ? "neg" : "pos"}">${fmtNumber(row.pnlPct, 2)}%</td>
                <td class="${row.pnlUsd < 0 ? "neg" : "pos"}">${row.pnlUsd < 0 ? "-" : ""}$${fmtNumber(Math.abs(row.pnlUsd), 2)}</td>
                <td class="row-actions">
                  <button class="btn tiny ghost icon-btn" data-investment-action="edit" data-id="${row.id}" title="Edit">${editIcon()}</button>
                  <button class="btn tiny ghost icon-btn" data-investment-action="delete" data-id="${row.id}" title="Delete">${trashIcon()}</button>
                </td>
              </tr>
            `).join("") : `<tr><td colspan="10" class="empty">${t("noData")}</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>

    ${investmentModalHtml()}
  `;
}

function investmentKpiCard(title, value, sub, accent, icon) {
  return `
    <article class="card kpi-card ${accent}">
      <div class="kpi-head">
        <p>${escapeHtml(title)}</p>
        <span class="kpi-icon">${investmentIcon(icon)}</span>
      </div>
      <div class="kpi-value">${escapeHtml(value)}</div>
      <small class="muted">${escapeHtml(sub)}</small>
    </article>
  `;
}

function investmentIcon(type) {
  const icons = {
    currency: "₺",
    briefcase: "⦿",
    cash: "₿",
    trend: "↘",
    wallet: "▣"
  };
  return icons[type] || "●";
}

function investmentPerformanceSvg(series) {
  if (!series.length) return `<div class="empty muted">${t("noData")}</div>`;
  const width = 720;
  const height = 240;
  const pad = { top: 20, right: 20, bottom: 26, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxV = Math.max(...series.map((s) => s.value), 1);
  const minV = Math.min(...series.map((s) => s.value), 0);
  const range = Math.max(1, maxV - minV);

  const toX = (i) => pad.left + (i / (series.length - 1)) * innerW;
  const toY = (v) => pad.top + innerH - ((v - minV) / range) * innerH;

  const line = series.map((s, i) => `${toX(i)},${toY(s.value)}`).join(" ");
  const area = `${pad.left},${pad.top + innerH} ${line} ${pad.left + innerW},${pad.top + innerH}`;

  const xLabels = series.map((s, i) => `
    <text class="axis-x" x="${toX(i)}" y="${height - 8}" text-anchor="middle">${escapeHtml(s.label)}</text>
  `).join("");

  return `
    <svg class="chart investment-line-chart" viewBox="0 0 ${width} ${height}" role="img">
      <defs>
        <linearGradient id="invLineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffb347" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#ffb347" stop-opacity="0" />
        </linearGradient>
      </defs>
      <polyline class="inv-line" points="${line}" />
      <polygon class="inv-area" points="${area}" />
      ${xLabels}
    </svg>
  `;
}

function investmentAllocationDonut(items, total) {
  const size = 180;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const rings = items.map((item) => {
    const pct = item.value / total;
    const dash = pct * circumference;
    const ring = `
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="${item.color}"
        stroke-width="${stroke}"
        stroke-dasharray="${dash} ${circumference - dash}"
        stroke-dashoffset="${-offset}"
        stroke-linecap="round"
      />
    `;
    offset += dash;
    return ring;
  }).join("");

  return `
    <div class="allocation-donut">
      <svg viewBox="0 0 ${size} ${size}" role="img">
        ${rings}
      </svg>
      <div class="donut-center">
        <small class="muted">TOTAL</small>
        <b>${fmtNumber(total, 2)}</b>
      </div>
    </div>
  `;
}

function investmentModalHtml() {
  return `
    <div id="asset-modal" class="modal hidden" role="dialog" aria-modal="true">
      <div class="modal-overlay" data-modal-close="true"></div>
      <div class="modal-card">
        <div class="modal-header">
          <h3>${t("addAssetTitle")}</h3>
          <button type="button" class="btn ghost icon-btn" data-modal-close="true" aria-label="${t("cancel")}">×</button>
        </div>
        <form id="asset-form" class="form-grid">
          <label>
            ${t("symbol")} *
            <input id="asset-symbol" name="symbol" type="text" placeholder="AAPL, BTC..." required />
          </label>
          <label>
            ${t("assetType")}
            <select id="asset-type" name="assetType">
              <option value="Stock">Stock</option>
              <option value="ETF">ETF</option>
              <option value="BIST">BIST</option>
              <option value="TEFAS">TEFAS</option>
              <option value="Crypto">Crypto</option>
              <option value="Bond">Bond</option>
              <option value="Commodity">Commodity</option>
              <option value="Cash">Cash</option>
            </select>
          </label>
          <label>
            ${t("name")}
            <input id="asset-name" name="name" type="text" placeholder="${t("name")}" />
          </label>
          <label>
            ${t("sector")}
            <input id="asset-sector" name="sector" type="text" placeholder="${t("sector")}" />
          </label>
          <label>
            ${t("currency")}
            <select id="asset-currency" name="currency">
              <option value="USD">USD</option>
              <option value="TRY">TRY</option>
            </select>
          </label>
          <label>
            ${t("amount")} *
            <input id="asset-amount" name="amount" type="number" min="0" step="0.0001" required />
          </label>
          <label>
            ${t("buyPrice")} ($)
            <input id="asset-avg-cost" name="avgCost" type="number" min="0" step="0.01" required />
          </label>
          <label>
            ${t("currentPrice")} ($)
            <input id="asset-price" name="price" type="number" min="0" step="0.01" required readonly />
          </label>
          <div class="full inline-actions">
            <button type="button" id="asset-price-fetch" class="btn ghost">${t("fetchPrice")}</button>
          </div>
          <div class="form-actions full">
            <button type="button" class="btn ghost" data-modal-close="true">${t("cancel")}</button>
            <button type="submit" class="btn primary">${t("addAsset")}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function deriveInvestment(investments, settings) {
  const usdTry = Number(settings.usdTry) || 1;
  const holdings = (investments || []).map((inv) => normalizeInvestment(inv, usdTry));
  const totalValueUsd = holdings.reduce((sum, h) => sum + h.valueUsd, 0);
  const totalCostUsd = holdings.reduce((sum, h) => sum + h.costUsd, 0);
  const cashUsd = holdings.filter((h) => h.isCash).reduce((sum, h) => sum + h.valueUsd, 0);
  const investmentsUsd = totalValueUsd - cashUsd;
  const pnlUsd = totalValueUsd - totalCostUsd;
  const pnlPct = totalCostUsd > 0 ? (pnlUsd / totalCostUsd) * 100 : 0;

  const nonCash = holdings.filter((h) => !h.isCash);
  const best = nonCash.length ? nonCash.reduce((a, b) => (b.pnlPct > a.pnlPct ? b : a), nonCash[0]) : null;

  const perfReturns = buildPerformanceReturns(totalValueUsd);
  const baseReturns = perfReturns.length ? perfReturns : nonCash.map((h) => h.pnlPct / 100).filter((v) => Number.isFinite(v));
  const avgReturn = baseReturns.length ? avg(baseReturns) : 0;
  const volReturn = baseReturns.length ? stddev(baseReturns) : 0;
  const downside = baseReturns.filter((v) => v < 0);
  const downsideVol = downside.length ? stddev(downside) : 0;
  const sharpe = volReturn ? avgReturn / volReturn : 0;
  const sortino = downsideVol ? avgReturn / downsideVol : 0;
  const maxDrawdown = baseReturns.length ? Math.min(...baseReturns) * 100 : 0;

  const stats = [
    { key: "best", label: best ? `${best.symbol} ${fmtNumber(best.pnlPct, 2)}%` : "-", value: "", cls: best && best.pnlPct < 0 ? "neg" : "pos" },
    { key: "beta", label: volReturn ? fmtNumber(1 + volReturn, 2) : "0.00", value: "" },
    { key: "sharpe", label: fmtNumber(sharpe, 2), value: "" },
    { key: "sortino", label: fmtNumber(sortino, 2), value: "", cls: sortino < 0 ? "neg" : "pos" },
    { key: "volatility", label: `${fmtNumber(volReturn * 100, 1)}%`, value: "" },
    { key: "maxDrawdown", label: `${fmtNumber(maxDrawdown, 1)}%`, value: "", cls: maxDrawdown < 0 ? "neg" : "pos" }
  ];

  const allocation = buildInvestmentAllocation(holdings);
  const performance = buildInvestmentPerformance(totalValueUsd);
  const weighted = holdings.map((h) => ({ ...h, weight: totalValueUsd ? (h.valueUsd / totalValueUsd) * 100 : 0 }));

  return {
    overview: {
      totalUsd: round(totalValueUsd, 2),
      totalTry: round(totalValueUsd * usdTry, 2),
      investmentsUsd: round(investmentsUsd, 2),
      investmentsCount: nonCash.length,
      cashUsd: round(cashUsd, 2),
      pnlUsd: round(pnlUsd, 2),
      pnlPct: round(pnlPct, 2),
      cashOutUsd: 0,
      cashOutAdjustedUsd: round(totalValueUsd, 2)
    },
    stats,
    allocation,
    performance,
    holdings: weighted.map((h) => ({
      id: h.id,
      symbol: h.symbol,
      name: h.name || h.symbol,
      assetType: h.assetType,
      amount: h.amount,
      avgCost: h.avgCost,
      price: h.price,
      valueUsd: h.valueUsd,
      valueTry: h.valueTry,
      weight: h.weight,
      pnlPct: h.pnlPct,
      pnlUsd: h.pnlUsd
    }))
  };
}

function normalizeInvestment(inv, usdTry) {
  const amount = Number(inv.amount) || 0;
  const avgCost = Number(inv.avgCost) || 0;
  const price = Number(inv.price) || 0;
  const assetType = String(inv.assetType || "");
  const currency = String(inv.currency || "USD").toUpperCase() === "TRY" ? "TRY" : "USD";
  const isCash = isCashType(assetType);

  const safeAvgCost = avgCost > 0 ? avgCost : price;
  const safePrice = price > 0 ? price : safeAvgCost;
  const cost = safeAvgCost * amount;
  const value = safePrice * amount;
  const costMissing = !isCash && avgCost <= 0;

  const costUsd = currency === "USD" ? cost : cost / usdTry;
  const valueUsd = currency === "USD" ? value : value / usdTry;
  const pnlUsd = valueUsd - costUsd;
  const pnlPct = costUsd > 0 ? (pnlUsd / costUsd) * 100 : 0;

  return {
    ...inv,
    assetType,
    currency,
    isCash,
    costUsd: round(costUsd, 2),
    valueUsd: round(valueUsd, 2),
    valueTry: round(valueUsd * usdTry, 2),
    pnlUsd: round(pnlUsd, 2),
    pnlPct: round(pnlPct, 2),
    costMissing
  };
}

function isCashType(assetType) {
  const tpe = String(assetType || "").toLocaleLowerCase("tr");
  return tpe.includes("cash") || tpe.includes("nakit");
}

function buildInvestmentAllocation(holdings) {
  const colors = ["#32c5ff", "#ffd24a", "#ff6b6b", "#2ec4b6", "#9b5cff", "#ffa500"];
  const map = new Map();
  for (const h of holdings) {
    const label = h.isCash ? "Cash" : h.symbol || h.assetType || "Asset";
    const prev = map.get(label) || { label, value: 0 };
    prev.value += h.valueUsd;
    map.set(label, prev);
  }
  return [...map.values()].map((item, idx) => ({ ...item, color: colors[idx % colors.length] }));
}

function buildInvestmentPerformance(totalValueUsd) {
  if (!Number.isFinite(totalValueUsd) || totalValueUsd <= 0) return [];
  const base = totalValueUsd;
  const points = [
    { label: "23 Oca", value: round(base * 0.92, 2) },
    { label: "30 Oca", value: round(base * 0.94, 2) },
    { label: "6 Şub", value: round(base * 1.1, 2) },
    { label: "20 Şub", value: round(base * 0.98, 2) },
    { label: "27 Şub", value: round(base, 2) },
    { label: "6 Mar", value: round(base, 2) },
    { label: "13 Mar", value: round(base, 2) }
  ];
  return points;
}

function buildPerformanceReturns(totalValueUsd) {
  const series = buildInvestmentPerformance(totalValueUsd);
  if (series.length < 2) return [];
  const returns = [];
  for (let i = 1; i < series.length; i += 1) {
    const prev = series[i - 1].value;
    const next = series[i].value;
    if (!prev) continue;
    returns.push((next - prev) / prev);
  }
  return returns;
}

function openAssetModal(row) {
  const modal = document.getElementById("asset-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  const form = modal.querySelector("#asset-form");
  if (!form) return;

  if (row) {
    form.querySelector("#asset-symbol").value = row.symbol || "";
    form.querySelector("#asset-type").value = row.assetType || "Stock";
    form.querySelector("#asset-name").value = row.name || "";
    form.querySelector("#asset-sector").value = row.sector || "";
    form.querySelector("#asset-currency").value = row.currency || "USD";
    form.querySelector("#asset-amount").value = String(row.amount ?? "");
    form.querySelector("#asset-avg-cost").value = String(row.avgCost ?? "");
    form.querySelector("#asset-price").value = String(row.price ?? "");
    form.querySelectorAll("[data-manual]").forEach((el) => {
      el.dataset.manual = "1";
    });
  } else {
    form.reset();
    form.querySelectorAll("[data-manual]").forEach((el) => {
      el.dataset.manual = "";
    });
  }
}

function closeAssetModal() {
  const modal = document.getElementById("asset-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  const form = modal.querySelector("#asset-form");
  if (form) form.reset();
  state.editingInvestmentId = null;
}

async function fetchAssetPrice(symbol, assetType) {
  const type = String(assetType || "").toLowerCase();
  if (type.includes("crypto")) {
    return fetchCryptoSpotPrice(symbol);
  }
  if (type.includes("cash")) {
    return 1;
  }
  throw new Error("unsupported asset type");
}

async function refreshExchangeKeyStatus() {
  if (!isTauriRuntime()) return;
  const exchanges = (state.settings.exchangeKeys || []).map((x) => x.exchange);
  const list = exchanges.length ? exchanges : ["bybit"];
  if (!list.length) return;
  try {
    const status = await invoke("secure_exchange_status", { exchanges: list, vaultPassword: state.vaultPassword || null });
    state.exchangeKeyStatus = status || {};
  } catch (error) {
    console.error("exchange key status failed:", error);
  }
}

function progressBar(pct) {
  const safe = Math.max(0, Math.min(100, pct));
  const over50 = safe > 50 ? " over-50" : "";
  return `<div class="progress${over50}"><span style="width:${safe.toFixed(1)}%"></span><b>${safe.toFixed(1)}%</b></div>`;
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
      const tip = `${s.label} | ${fmtHours(s.hours)} | ${fmtMoney(s.income)}`;
      return `<g>
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5">
          <title>${escapeHtml(tip)}</title>
        </rect>
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
      const tip = `${s.date} | $${fmtNumber(s.value, 2)}`;

      return `<g>
        ${monthMarker}
        <rect class="cycle-bar" x="${x}" y="${y}" width="${barW}" height="${h}" rx="2">
          <title>${escapeHtml(tip)}</title>
        </rect>
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

function weekdayProductivityHtml(data) {
  if (!data?.length) return `<div class="empty muted">${t("noData")}</div>`;

  const maxAvg = Math.max(...data.map((d) => d.avgHours), 0.01);
  return `<div class="weekday-bars">
    ${data
      .map((d) => {
        const heightPct = Math.max(6, (d.avgHours / maxAvg) * 100);
        return `<div class="wb-col">
          <div class="wb-track">
            <span class="wb-fill l${d.level}" style="height:${heightPct.toFixed(1)}%" title="${escapeHtml(d.label)}: ${d.avgHours.toFixed(2)}h">
              <span class="wb-fill-label">${d.avgHours.toFixed(2)}h</span>
            </span>
          </div>
          <span class="wb-day">${escapeHtml(d.label)}</span>
        </div>`;
      })
      .join("")}
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

async function fetchCryptoSpotPrice(symbol) {
  const pair = `${symbol}-USD`;
  const url = `https://api.coinbase.com/v2/prices/${encodeURIComponent(pair)}/spot`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Price fetch failed");
  const data = await res.json();
  const price = Number(data?.data?.amount);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid price");
  return price;
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

function settingsIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M10.2 3.4l1.6-.9 1.6.9.7 1.8 2 .6 1.7-1 1.3 1.3-1 1.7.6 2 1.8.7.9 1.6-.9 1.6-1.8.7-.6 2 1 1.7-1.3 1.3-1.7-1-2 .6-.7 1.8-1.6.9-1.6-.9-.7-1.8-2-.6-1.7 1-1.3-1.3 1-1.7-.6-2-1.8-.7-.9-1.6.9-1.6 1.8-.7.6-2-1-1.7 1.3-1.3 1.7 1 2-.6z"/>
    <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/>
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

function buildCombinedCsv(logs, expenses) {
  const header = [
    "type",
    "date",
    "hours",
    "rate_usd",
    "usd_try",
    "note",
    "amount",
    "currency",
    "category"
  ];

  const incomeRows = (logs || []).map((row) => ({
    type: "income",
    date: row.date,
    hours: row.hours,
    rateUsd: row.rateUsd,
    usdTry: row.usdTry,
    note: row.note || "",
    amount: "",
    currency: "",
    category: ""
  }));

  const expenseRows = (expenses || []).map((row) => ({
    type: "expense",
    date: row.date,
    hours: "",
    rateUsd: "",
    usdTry: "",
    note: row.note || "",
    amount: row.amount,
    currency: row.currency,
    category: row.category || ""
  }));

  const combined = [...incomeRows, ...expenseRows].sort((a, b) => {
    const dateCmp = String(a.date || "").localeCompare(String(b.date || ""));
    if (dateCmp !== 0) return dateCmp;
    return a.type.localeCompare(b.type);
  });

  const lines = [header.join(",")];
  for (const row of combined) {
    lines.push(
      [
        row.type,
        row.date,
        row.hours,
        row.rateUsd,
        row.usdTry,
        csvCell(row.note),
        row.amount,
        row.currency,
        csvCell(row.category)
      ].join(",")
    );
  }

  return lines.join("\n");
}

function parseCombinedCsv(text, settings) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { logs: [], expenses: [], warnings: [t("csvEmpty")] };

  const headers = rows[0].map((x) => String(x || "").trim());
  const map = buildHeaderMap(headers);

  const hasType = mapHas(map, ["type", "tur", "tip"]);
  const hasDate = mapHas(map, ["date", "tarih"]);
  if (!hasType || !hasDate) {
    return { logs: [], expenses: [], warnings: [t("expectedColumns")] };
  }

  const warnings = [];
  const logs = [];
  const expenses = [];

  const idxType = pickHeaderIndex(map, ["type", "tur", "tip"], "first");
  const idxDate = pickHeaderIndex(map, ["date", "tarih"], "first");
  const idxHours = pickHeaderIndex(map, ["hours", "saat", "gunluk_saat", "gunluk"]);
  const idxRate = pickHeaderIndex(map, ["rate_usd", "rate"]);
  const idxUsdTry = pickHeaderIndex(map, ["usd_try", "usdtry", "usd_tl", "usd_tl_kur"]);
  const idxNote = pickHeaderIndex(map, ["note", "not"]);
  const idxAmount = pickHeaderIndex(map, ["amount", "tutar"]);
  const idxCurrency = pickHeaderIndex(map, ["currency", "para_birimi"]);
  const idxCategory = pickHeaderIndex(map, ["category", "kategori"]);

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row?.length) continue;

    const typeRaw = String(row[idxType] || "").trim().toLocaleLowerCase("tr");
    const type = typeRaw === "gelir" || typeRaw === "income" || typeRaw === "inc"
      ? "income"
      : typeRaw === "gider" || typeRaw === "expense" || typeRaw === "exp"
        ? "expense"
        : "";

    const date = normalizeDate(row[idxDate]);
    if (!type || !date) {
      warnings.push(t("rowInvalidDate", { row: i + 1 }));
      continue;
    }

    if (type === "income") {
      const hours = toNum(idxHours >= 0 ? row[idxHours] : NaN);
      if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
        warnings.push(t("rowInvalidHours", { row: i + 1, value: row[idxHours] }));
        continue;
      }

      const rateUsd = toNum(idxRate >= 0 ? row[idxRate] : settings.standardRateUsd);
      const usdTry = toNum(idxUsdTry >= 0 ? row[idxUsdTry] : settings.usdTry);

      logs.push({
        id: uid(),
        date,
        hours: round(hours, 2),
        rateUsd: round(Number.isFinite(rateUsd) ? rateUsd : settings.standardRateUsd, 5),
        usdTry: round(Number.isFinite(usdTry) ? usdTry : settings.usdTry, 5),
        note: idxNote >= 0 ? String(row[idxNote] || "") : "",
        cycleId: date.slice(0, 7)
      });
    } else if (type === "expense") {
      const amount = toNum(idxAmount >= 0 ? row[idxAmount] : NaN);
      const currency = String(idxCurrency >= 0 ? row[idxCurrency] : "USD").trim().toUpperCase();
      const category = String(idxCategory >= 0 ? row[idxCategory] : "").trim() || "Diğer";

      if (!Number.isFinite(amount) || amount < 0 || !["USD", "TRY"].includes(currency)) {
        warnings.push(t("rowInvalidAmount", { row: i + 1, value: row[idxAmount] }));
        continue;
      }

      expenses.push({
        id: uid(),
        date,
        amount: round(amount, 2),
        currency,
        category,
        note: idxNote >= 0 ? String(row[idxNote] || "") : ""
      });
    }
  }

  const incomeByDate = new Map();
  for (const log of logs) {
    if (incomeByDate.has(log.date)) warnings.push(t("duplicateDateWarn", { date: log.date }));
    incomeByDate.set(log.date, log);
  }

  return {
    logs: [...incomeByDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    expenses: [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    warnings
  };
}

function parseInvestmentCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { items: [], warnings: [t("csvEmpty")] };

  const headers = rows[0].map((x) => String(x || "").trim());
  const map = buildHeaderMap(headers);

  const hasSymbol = mapHas(map, ["symbol", "sembol"]);
  const hasAmount = mapHas(map, ["amount", "adet"]);
  if (!hasSymbol) {
    return { items: [], warnings: [t("expectedColumns")] };
  }

  const idxSymbol = pickHeaderIndex(map, ["symbol", "sembol"], "first");
  const idxName = pickHeaderIndex(map, ["name", "isim"]);
  const idxType = pickHeaderIndex(map, ["type", "tip"]);
  const idxSector = pickHeaderIndex(map, ["sector", "sektor"]);
  const idxCurrency = pickHeaderIndex(map, ["currency", "para_birimi"]);
  const idxAmount = pickHeaderIndex(map, ["amount", "adet"]);
  const idxAvgCost = pickHeaderIndex(map, ["avg_cost", "ort_maliyet", "maliyet"]);
  const idxPrice = pickHeaderIndex(map, ["price", "fiyat"]);

  const warnings = [];
  const items = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row?.length) continue;
    const symbol = String(row[idxSymbol] || "").trim();
    const amount = idxAmount >= 0 ? toNum(row[idxAmount]) : 1;
    if (!symbol || !Number.isFinite(amount) || amount <= 0) {
      warnings.push(t("rowInvalidAmount", { row: i + 1, value: row[idxAmount] }));
      continue;
    }

    const currency = String(idxCurrency >= 0 ? row[idxCurrency] : "USD").toUpperCase() === "TRY" ? "TRY" : "USD";
    items.push({
      id: uid(),
      symbol: symbol.toUpperCase(),
      name: String(idxName >= 0 ? row[idxName] : "").trim(),
      assetType: String(idxType >= 0 ? row[idxType] : "Stock").trim() || "Stock",
      sector: String(idxSector >= 0 ? row[idxSector] : "").trim(),
      currency,
      amount: round(amount, 6),
      avgCost: round(toNum(idxAvgCost >= 0 ? row[idxAvgCost] : 0), 4),
      price: round(toNum(idxPrice >= 0 ? row[idxPrice] : 0), 4),
      note: ""
    });
  }

  return { items, warnings };
}

function lookupAssetInfo(symbol) {
  const map = {
    BTC: { assetType: "Crypto", name: "Bitcoin", sector: "Crypto", currency: "USD" },
    ETH: { assetType: "Crypto", name: "Ethereum", sector: "Crypto", currency: "USD" },
    USDT: { assetType: "Cash", name: "Tether", sector: "Cash", currency: "USD" },
    USDC: { assetType: "Cash", name: "USD Coin", sector: "Cash", currency: "USD" },
    TRY: { assetType: "Cash", name: "Turkish Lira", sector: "Cash", currency: "TRY" },
    USD: { assetType: "Cash", name: "US Dollar", sector: "Cash", currency: "USD" }
  };
  return map[symbol] || null;
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

function normalizeServerUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

function hasValidSyncToken() {
  const token = String(state.settings.syncToken || "").trim();
  const expiry = String(state.settings.syncTokenExpiresAt || "").trim();
  if (!token || !expiry) return false;
  const ts = Date.parse(expiry);
  if (!Number.isFinite(ts)) return false;
  return ts > Date.now();
}

async function loginToSyncServer(serverUrl, username, password) {
  const baseUrl = normalizeServerUrl(serverUrl);
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `${res.status}`);
  }
  const token = String(body?.token || "").trim();
  const expiresAt = String(body?.expires_at || "").trim();
  if (!token || !expiresAt) {
    throw new Error("invalid login response");
  }
  return { token, expiresAt };
}

async function ensureSyncSession() {
  if (hasValidSyncToken()) return;
  if (!state.auth.password) {
    state.auth.authenticated = false;
    state.settings.syncToken = "";
    state.settings.syncTokenExpiresAt = "";
    await dataStore.saveSettings(state.settings);
    throw new Error(t("syncUnauthorized"));
  }
  const result = await loginToSyncServer(
    state.settings.syncServerUrl,
    state.settings.syncUsername,
    state.auth.password
  );
  state.settings.syncToken = result.token;
  state.settings.syncTokenExpiresAt = result.expiresAt;
  state.auth.authenticated = true;
  await dataStore.saveSettings(state.settings);
}

async function syncRequest(path, init = {}, retry = true) {
  await ensureSyncSession();
  const baseUrl = normalizeServerUrl(state.settings.syncServerUrl);
  const headers = {
    ...(init.headers || {}),
    authorization: `Bearer ${state.settings.syncToken}`
  };
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (res.status === 401 && retry) {
    state.settings.syncToken = "";
    state.settings.syncTokenExpiresAt = "";
    await dataStore.saveSettings(state.settings);
    try {
      await ensureSyncSession();
    } catch {
      state.auth.authenticated = false;
      throw new Error(t("syncUnauthorized"));
    }
    return syncRequest(path, init, false);
  }
  return res;
}

function syncMeta(now) {
  return {
    updated_at: now,
    client_id: state.settings.syncClientId || uid(),
    deleted_at: null
  };
}

async function runSyncPush() {
  const now = new Date().toISOString();
  if (!state.settings.syncClientId) {
    state.settings.syncClientId = uid();
  }
  const workLogs = state.logs.map((log) => ({ ...log, ...syncMeta(now) }));
  const expenses = state.expenses.map((expense) => ({ ...expense, ...syncMeta(now) }));
  const clockLead = [{
    id: "clock_lead",
    clock_in_hours: Number(state.settings.clockInHours) || 0,
    lead_time_hours: Number(state.settings.leadTimeHours) || 0,
    ...syncMeta(now)
  }];
  const settingsPayload = {
    standardRateUsd: state.settings.standardRateUsd,
    specialRateUsd: state.settings.specialRateUsd,
    usdTry: state.settings.usdTry,
    cycleResetRule: state.settings.cycleResetRule,
    weeklyTargetHours: state.settings.weeklyTargetHours,
    monthlyTargetHours: state.settings.monthlyTargetHours,
    theme: state.settings.theme,
    language: state.settings.language,
    ...syncMeta(now)
  };

  const response = await syncRequest("/sync/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_time: now,
      changes: {
        work_logs: workLogs,
        expenses,
        settings: settingsPayload,
        clock_lead: clockLead
      }
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || `${response.status}`);
  }
  state.settings.syncLastSyncAt = String(body?.server_time || now);
  await dataStore.saveSettings(state.settings);
}

async function runSyncPull() {
  if (!state.settings.syncClientId) {
    state.settings.syncClientId = uid();
  }
  const since = encodeURIComponent(String(state.settings.syncLastSyncAt || ""));
  const response = await syncRequest(`/sync/changes?since=${since}`, {
    method: "GET"
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || `${response.status}`);
  }
  const changes = body?.changes || {};

  const previousLogs = [...state.logs];
  const previousExpenses = [...state.expenses];
  const logsMap = new Map(previousLogs.map((item) => [item.id, item]));
  for (const item of (changes.work_logs || [])) {
    const id = String(item?.id || "").trim();
    if (!id) continue;
    if (item?.deleted_at) logsMap.delete(id);
    else logsMap.set(id, { ...logsMap.get(id), ...item });
  }

  const expenseMap = new Map(previousExpenses.map((item) => [item.id, item]));
  for (const item of (changes.expenses || [])) {
    const id = String(item?.id || "").trim();
    if (!id) continue;
    if (item?.deleted_at) expenseMap.delete(id);
    else expenseMap.set(id, { ...expenseMap.get(id), ...item });
  }

  const clockItems = Array.isArray(changes.clock_lead) ? changes.clock_lead : [];
  if (clockItems.length) {
    const latest = clockItems[clockItems.length - 1] || {};
    if (Number.isFinite(Number(latest.clock_in_hours))) {
      state.settings.clockInHours = round(Number(latest.clock_in_hours), 2);
    }
    if (Number.isFinite(Number(latest.lead_time_hours))) {
      state.settings.leadTimeHours = round(Number(latest.lead_time_hours), 2);
    }
  }

  state.logs = Array.from(logsMap.values());
  state.expenses = Array.from(expenseMap.values());
  await dataStore.replaceLogs(state.logs);
  const nextExpenseIds = new Set(state.expenses.map((x) => x.id));
  for (const prev of previousExpenses) {
    if (!nextExpenseIds.has(prev.id)) {
      await dataStore.deleteExpense(prev.id);
    }
  }
  for (const expense of state.expenses) {
    await dataStore.upsertExpense(expense);
  }

  state.settings.syncLastSyncAt = String(body?.server_time || new Date().toISOString());
  await dataStore.saveSettings(state.settings);
}

async function logoutSyncServer() {
  try {
    if (state.settings.syncToken) {
      await fetch(`${normalizeServerUrl(state.settings.syncServerUrl)}/auth/logout`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${state.settings.syncToken}`
        },
        body: JSON.stringify({ token: state.settings.syncToken })
      });
    }
  } catch (error) {
    console.warn("sync logout warning:", error);
  }
}

async function openExternalUrl(url) {
  if (isTauriRuntime()) {
    try {
      await invoke("open_external_url", { url });
      return;
    } catch (error) {
      console.error("open_external_url failed:", error);
    }
  }

  window.open(url, "_blank", "noopener,noreferrer");
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
  return `${fmtNumber(value, 2)} h`;
}

function fmtMoney(value) {
  return `$${fmtNumber(value, 2)}`;
}

function fmtTry(value) {
  return `₺${fmtNumber(value, 2)}`;
}

function fmtDelta(pct) {
  if (!Number.isFinite(pct)) return "n/a";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function fmtNumber(value, digits = 2) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(round(n, digits));
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

function stddev(list) {
  if (list.length < 2) return 0;
  const mean = avg(list);
  const variance = avg(list.map((x) => (x - mean) ** 2));
  return Math.sqrt(variance);
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
