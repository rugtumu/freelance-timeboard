# FTB Pi Sync (Server)

Minimal Raspberry Pi server for local network sync.

## Env
- `FTB_DB_PATH` (default: `./data/sync.db`)
- `FTB_USER` (default: `umut`)
- `FTB_PASS` (default: `changeme`)
- `FTB_PORT` (default: `8080`)

## Run (dev)
```bash
cargo run
```

## Test
```bash
FTB_PORT=9090 cargo run

curl http://localhost:9090/health
```
