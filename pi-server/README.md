# FTB Pi Sync (Server)

Local-network sync server for Freelance Timeboard.

## What is implemented
- `POST /auth/login` with Argon2 password verification
- `POST /auth/logout` (revokes active session token)
- `GET /sync/changes` (auth required)
- `POST /sync/push` (auth required)
- Session tokens persisted in SQLite (`sessions` table)
- Default user bootstrap on first run (`FTB_USER` + `FTB_PASS`)

## Env
- `FTB_DB_PATH` (default: `./data/sync.db`)
- `FTB_USER` (default: `umut`) — used only on first boot if no user exists
- `FTB_PASS` (default: `changeme`) — used only on first boot if no user exists
- `FTB_PORT` (default: `8080`)
- `FTB_SESSION_DAYS` (default: `180`)

## Run (dev)
```bash
cargo run
```

## Quick test
```bash
FTB_PORT=9090 cargo run

curl http://localhost:9090/health

curl -X POST http://localhost:9090/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"umut","password":"changeme"}'
```

## Security notes
- This is currently designed for LAN + HTTP (as planned).
- Use a strong password in `FTB_PASS` before first boot.
- If DB already has a user, changing env creds does not overwrite existing user.
