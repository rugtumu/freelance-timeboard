# Freelance Timeboard

Freelance çalışanlar için günlük saat ve gelir takibi uygulaması.

## Özellikler
- Günlük kayıt ekleme, düzenleme, silme
- Saat, ücret tipi ve not ile kayıt tutma
- Haftalık/aylık hedef takibi
- Dashboard karşılaştırmaları (önceki hafta/ay)
- Analiz grafikleri:
  - Haftalık bar chart
  - Aylık bar chart
  - Günlük saat + rolling 10g ortalama line chart
  - Gün bazlı heatmap
- Tema desteği (koyu/açık)
- Dil desteği (TR/EN)
- USD/TRY manuel giriş + canlı kur güncelleme denemesi
- CSV içe aktarma (Excel export formatı dahil)
- CSV/JSON dışa aktarma

## Veri Katmanı
- Desktop (Tauri): SQLite
- Web fallback: localStorage

## Kurulum
1. `npm install`
2. Web geliştirme: `npm run dev`
3. Desktop geliştirme: `npm run tauri:dev`

## Build
- Web: `npm run build`
- Desktop: `npm run tauri:build`

## CSV İçe Aktarma
1. Uygulamada `CSV İçe Aktar` butonuna tıkla.
2. `Work Hours - Sheet1.csv` dosyasını seç.
3. Mevcut kayıtları değiştirme onayını ver.

## Notlar
- Canlı USD/TRY çekimi ağ erişimine bağlıdır; başarısız olursa manuel değer kullanılabilir.
- Public repo için kişisel veri dosyalarını commit etmeyin.
