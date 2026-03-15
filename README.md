<div align="center">

# Freelance Timeboard

Günlük çalışma, gelir/gider ve yatırım takibi için Tauri + Vite tabanlı masaüstü uygulaması.

Daily work, income/expense, and investment tracker built with Tauri + Vite.

[English](#english) · [Türkçe](#türkçe)

</div>

---

<a id="english"></a>

# English

![Dashboard (mock data)](src/data/dashboard.png)

![Analysis (mock data)](src/data/analysis.png)

## Features
- `Panel` tab: weekly/monthly hours charts, daily hours + rolling average, heatmap
- `Analysis` tab: KPI cards, target tracking, cycle histogram
- `Clock/Lead` tab: clock-in & lead time inputs, risk band calculation
- `Data` tab: Income/Expense subtabs, quick entry, CSV import/export
- `Investment` tab: holdings list, filter + header-based sorting, performance stats
- `Budget` tab: total income/expense, net balance, category expense distribution
- `Settings` tab:
  - General (USD/hour, USD/TRY, targets, language)
  - Exchange API keys (keyring + encrypted vault fallback)
  - Tab visibility (hide/show without deleting data)
- Dark/Light theme and TR/EN languages (default EN)
- Manual USD/TRY + live rate refresh

## Data & Security
- Desktop (Tauri): income, expense, and settings stored in SQLite.
- Web fallback: localStorage.
- API keys:
  - Primary storage: OS keyring.
  - Fallback: encrypted vault (app data dir).
  - Vault password is **never stored** and must be re-entered after restart.
  - Keys are **not stored in the repo** and appear masked in UI.

## Setup
1. `npm install`
2. Web dev: `npm run dev`
3. Desktop dev: `npm run tauri:dev`

## Build
- Web: `npm run build`
- Desktop: `npm run tauri:build`
- Android APK: `npm run tauri:android:build`

## Android (APK)
1. Android SDK + NDK required:
   - `ANDROID_HOME` and `ANDROID_SDK_ROOT` set.
   - `NDK_HOME` points to correct NDK path (e.g. `~/Android/Sdk/ndk/29.0.13846066`).
2. Android init:
   - `npm run tauri:android:init`
3. Dev (device connected):
   - `adb devices` must show the device.
   - `npm run tauri:android:dev`
4. Build APK:
   - `npm run tauri:android:build`

## Android Cleanup (Memory)
- Stop Gradle/Kotlin daemons:
  - `npm run android:cleanup`

### Android Notes
- Phone and PC should be on the same network (dev server).
- If needed, enable Vite host: `server.host = true`.
- Physical device is often more stable than emulator.

## CSV Import
1. Go to `Data` → `Income` (or `Expense`).
2. Click `Import CSV`.
3. Select your file.
4. Confirm overwrite if prompted.

## CSV Export
- Use `Export CSV` in the `Data` tab.
- In Tauri, file is saved to `Downloads`, fallback to `Desktop`, then app data dir.

## Notes
- Live USD/TRY depends on network; if it fails, manual value is used.
- Keeping `identifier` and `productName` stable preserves user data across updates.

## License
- Licensed under `Freelance Timeboard Non-Commercial License v1.1`.
- Commercial use is not allowed.
- Contact for commercial licensing.
- See [LICENSE](/LICENSE).

---

<a id="türkçe"></a>

# Türkçe

![Dashboard (mock data)](src/data/dashboard.png)

![Analysis (mock data)](src/data/analysis.png)

## Özellikler
- `Panel` sekmesi: haftalık/aylık saat grafikleri, günlük saat + rolling ortalama, heatmap
- `Analiz` sekmesi: KPI kartları, hedef takibi ve cycle histogram
- `Clock/Lead` sekmesi: clock-in ve lead time girişi, risk bandı hesaplama
- `Veri` sekmesi: Gelir/Gider alt sekmeleri, hızlı giriş, CSV içe/dışa aktarma
- `Yatırım` sekmesi: varlık listesi, filtreleme + tablo başlığından sıralama, performans metrikleri
- `Bütçe` sekmesi: toplam gelir/gider, net bakiye ve kategori bazlı gider dağılımı
- `Ayarlar` sekmesi:
  - Genel ayarlar (USD/saat, USD/TRY, hedefler, dil)
  - Borsa API anahtarları (keyring + şifreli vault fallback)
  - Sekme görünürlüğü (veriyi silmeden gizle/göster)
- Koyu/Açık tema ve TR/EN dil desteği (varsayılan EN)
- USD/TRY manuel giriş + canlı kur yenileme

## Veri ve Güvenlik
- Desktop (Tauri): Gelir, gider ve ayarlar SQLite üzerinde tutulur.
- Web fallback: localStorage.
- API anahtarları:
  - Öncelik OS keyring.
  - Keyring yoksa şifreli vault (app data dir) kullanılır.
  - Vault parolası **saklanmaz**, her açılışta tekrar girilir.
  - Repo’ya API anahtarı yazılmaz, ayarlarda maskeli görünür.

## Kurulum
1. `npm install`
2. Web geliştirme: `npm run dev`
3. Desktop geliştirme: `npm run tauri:dev`

## Build
- Web: `npm run build`
- Desktop: `npm run tauri:build`
- Android APK: `npm run tauri:android:build`

## Android (APK)
1. Android SDK + NDK kurulu olmalı:
   - `ANDROID_HOME` ve `ANDROID_SDK_ROOT` ayarlı olmalı.
   - `NDK_HOME` doğru NDK dizinini göstermeli (ör. `~/Android/Sdk/ndk/29.0.13846066`).
2. Android init:
   - `npm run tauri:android:init`
3. Geliştirme (cihaz bağlıyken):
   - `adb devices` ile cihaz görünmeli.
   - `npm run tauri:android:dev`
4. APK build:
   - `npm run tauri:android:build`

## Android Cleanup (Memory)
- Gradle/Kotlin daemonlarını kapatmak için:
  - `npm run android:cleanup`

### Android Notları
- Telefon ve bilgisayar aynı ağda olmalı (dev server için).
- Gerekirse Vite host: `server.host = true`.
- Emülatör açılmazsa fiziksel cihaz daha stabil olabilir.

## CSV İçe Aktarma
1. `Veri` → `Gelir` (veya `Gider`) sekmesine geç.
2. `CSV İçe Aktar` butonuna tıkla.
3. CSV dosyasını seç.
4. Mevcut kayıtları değiştirme onayını ver.

## CSV Dışa Aktarma
- `Veri` sekmesindeki `CSV Dışa Aktar` ile dosya kaydedilir.
- Tauri ortamında dosya önce `Downloads`, bulunamazsa `Desktop`, o da yoksa uygulama veri dizinine yazılır.

## Notlar
- Canlı USD/TRY çekimi ağ erişimine bağlıdır; başarısız olursa manuel değer kullanılabilir.
- Güncelleme yaparken `identifier` ve `productName` sabit tutulursa kullanıcı verileri korunur.

## Lisans
- Bu proje `Freelance Timeboard Non-Commercial License v1.1` ile lisanslanmıştır.
- Ticari kullanım yasaktır.
- Ticari kullanım için ayrı yazılı izin/lisans alınmalıdır.
- Detaylar için [LICENSE](/LICENSE) dosyasına bakın.
