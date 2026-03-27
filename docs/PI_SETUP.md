# Raspberry Pi Kurulum ve Test Rehberi

Bu doküman, `freelance-timeboard` projesinin **Pi senkronizasyon sunucusunu** Raspberry Pi üzerinde ayağa kaldırmak ve uygulamadan test etmek için adım adım rehberdir.

## 1) Raspberry Pi'da ön koşullar

```bash
sudo apt update
sudo apt install -y git curl sqlite3 build-essential pkg-config libssl-dev
```

Rust kurulu değilse:

```bash
curl https://sh.rustup.rs -sSf | sh
source "$HOME/.cargo/env"
rustc --version
cargo --version
```

## 2) Repo'yu Pi'ya al

İlk kurulum:

```bash
git clone <REPO_URL> ~/freelance-timeboard
cd ~/freelance-timeboard
```

Mevcut kurulum varsa güncelle:

```bash
cd ~/freelance-timeboard
git pull
```

## 3) Sunucuyu başlat (dev/test)

```bash
cd ~/freelance-timeboard/pi-server
FTB_PORT=8080 \
FTB_DB_PATH=./data/sync.db \
FTB_USER=umut \
FTB_PASS='GUCLU_BIR_SIFRE' \
FTB_SESSION_DAYS=180 \
cargo run
```

Notlar:
- `FTB_USER` ve `FTB_PASS` sadece ilk açılışta (DB'de kullanıcı yoksa) default kullanıcı üretmek için kullanılır.
- Sonradan `FTB_PASS` değiştirsen bile mevcut kullanıcı parolası otomatik değişmez.

## 4) Health ve auth testleri (Pi üstünde)

Ayrı terminalde:

```bash
curl http://127.0.0.1:8080/health
```

Login testi:

```bash
curl -X POST http://127.0.0.1:8080/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"umut","password":"GUCLU_BIR_SIFRE"}'
```

Token ile changes testi:

```bash
TOKEN="<LOGIN_CIKTISINDAKI_TOKEN>"
curl "http://127.0.0.1:8080/sync/changes?since=" \
  -H "authorization: Bearer $TOKEN"
```

## 5) Uygulamadan bağlanma

Desktop/Android uygulamada:
- Server URL: `http://<PI_IP_ADRESI>:8080`
- Username: `umut` (veya senin ayarladığın)
- Password: verdiğin güçlü şifre

Beklenen davranış:
- Login başarılı olunca otomatik ilk `pull` çalışır.
- Sonrasında `Sync Now` ile push/pull akışı yapılır.

## 6) Pi IP adresini öğrenme

Pi üzerinde:

```bash
hostname -I
```

Router'dan rezervasyon verdiysen sabit yerel IP kullan.

## 7) Üretim için öneri: systemd servisi

`/etc/systemd/system/ftb-pi-sync.service` dosyası:

```ini
[Unit]
Description=FTB Pi Sync Server
After=network-online.target
Wants=network-online.target

[Service]
User=pi
WorkingDirectory=/home/pi/freelance-timeboard/pi-server
Environment=FTB_PORT=8080
Environment=FTB_DB_PATH=/home/pi/freelance-timeboard/pi-server/data/sync.db
Environment=FTB_USER=umut
Environment=FTB_PASS=GUCLU_BIR_SIFRE
Environment=FTB_SESSION_DAYS=180
ExecStart=/home/pi/.cargo/bin/cargo run --release
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Aktifleştirme:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ftb-pi-sync
sudo systemctl start ftb-pi-sync
sudo systemctl status ftb-pi-sync
```

Log izleme:

```bash
journalctl -u ftb-pi-sync -f
```

## 8) Güvenlik notları

- LAN içinde HTTP şu an kabul edilen model; internetten doğrudan açma.
- Güçlü parola kullan.
- İstersen router/firewall ile sadece belirli cihaz IP'lerine izin ver.
- Şimdilik tek kullanıcı modeli var.
