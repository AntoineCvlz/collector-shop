#!/usr/bin/env bash
# Lance le test de charge k6 contre l'URL fournie (défaut : http://localhost).
#
#   ./run-load-test.sh                         # → http://localhost
#   ./run-load-test.sh https://mon-domaine.fr  # → cible explicite
#
# Utilise k6 s'il est installé, sinon retombe sur l'image Docker grafana/k6.
# Sort avec le code 99 si un seuil de performance n'est pas respecté.
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
