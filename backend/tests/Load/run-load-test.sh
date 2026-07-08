#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="${1:-${LOAD_TEST_BASE_URL:-http://localhost}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▶ Test de charge k6 → ${TARGET_URL}"

if command -v k6 >/dev/null 2>&1; then
  cd "$SCRIPT_DIR"
  exec k6 run -e LOAD_TEST_BASE_URL="$TARGET_URL" api-smoke-load.js
elif command -v docker >/dev/null 2>&1; then
  exec docker run --rm \
    -v "$SCRIPT_DIR":/scripts:ro \
    -w /scripts \
    -e LOAD_TEST_BASE_URL="$TARGET_URL" \
    grafana/k6:latest run api-smoke-load.js
else
  echo "✗ Ni k6 ni Docker ne sont installés." >&2
  echo "  Installer k6 : https://k6.io/docs/get-started/installation/" >&2
  exit 1
fi
