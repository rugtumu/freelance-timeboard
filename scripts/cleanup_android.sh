#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRADLEW="$PROJECT_ROOT/src-tauri/gen/android/gradlew"

echo "Stopping Gradle daemons (if any)..."
if [[ -x "$GRADLEW" ]]; then
  "$GRADLEW" --stop || true
else
  echo "gradlew not found yet, skipping."
fi

echo "Stopping lingering Gradle/Kotlin daemons..."
pkill -f gradle || true
pkill -f kotlin-compiler || true

echo "Stopping adb server (optional cleanup)..."
adb kill-server || true

echo "Done."
