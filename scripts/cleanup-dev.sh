#!/usr/bin/env bash
set -euo pipefail

echo "Stopping dev processes..."
pkill -f "tauri|vite|cargo" || true

echo "Stopping Android / Emulator..."
adb kill-server >/dev/null 2>&1 || true
pkill -f "emulator" || true

echo "Stopping Gradle / Java / Kotlin daemons..."
pkill -f "gradle" || true
pkill -f "kotlin" || true
pkill -f "java" || true

echo "Done."
