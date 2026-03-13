# Freelance Timeboard

Günlük çalışma, gelir/gider, investment takibi uygulaması.

![Dashboard (mock data)](src/data/dashboard.png)

![Analysis (mock data)](src/data/analysis.png)

## Özellikler
- `Panel` sekmesi: haftalık/aylık saat grafikleri, günlük saat + rolling ortalama, heatmap
- `Analiz` sekmesi: KPI kartları, hedef takibi ve cycle histogram
- `Clock/Lead` sekmesi: clock-in ve lead time girişi, risk bandı hesaplama
- `Gelir` sekmesi: günlük saat/gelir kaydı ekleme, düzenleme, silme
- `Gider` sekmesi: USD/TRY para birimi ile gider girişi, düzenleme, silme
- `Bütçe` sekmesi: toplam gelir, toplam gider, net bakiye ve kategori bazlı gider özeti
- Koyu/Açık tema ve TR/EN dil desteği
- USD/TRY manuel giriş + canlı kur yenileme
- CSV içe aktarma
- CSV dışa aktarma

## Veri Katmanı
- Tauri (desktop):
  - Gelir kayıtları, gider kayıtları ve ayarlar: SQLite
- Web fallback: localStorage

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

### Android Notları
- Telefon ve bilgisayar aynı ağda olmalı (dev server için).
- Gerekirse Vite host: `server.host = true`.
- Emülatör açılmazsa fiziksel cihaz ile deneme daha stabil olur.

## CSV İçe Aktarma
1. `Gelir` sekmesine geç.
2. `CSV İçe Aktar` butonuna tıkla.
3. CSV dosyasını seç.
4. Mevcut kayıtları değiştirme onayını ver.

## CSV Dışa Aktarma
- `Gelir` sekmesindeki `CSV Dışa Aktar` ile dosya kaydedilir.
- Tauri ortamında dosya önce `Downloads`, bulunamazsa `Desktop`, o da yoksa uygulama veri dizinine yazılır.

## Notlar
- Canlı USD/TRY çekimi ağ erişimine bağlıdır; başarısız olursa manuel değer kullanılabilir.
- Güncelleme yaparken `identifier` ve `productName` sabit tutulursa kullanıcı verileri korunur.

## Lisans
- Bu proje `Freelance Timeboard Non-Commercial License v1.0` ile lisanslanmıştır.
- Ticari kullanım yasaktır.
- Ticari kullanım için ayrı yazılı izin/lisans alınmalıdır.
- Detaylar için [LICENSE](/LICENSE) dosyasına bakın.
