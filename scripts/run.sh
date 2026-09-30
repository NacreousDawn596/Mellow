#!/usr/bin/env sh
# Start Mellow natively (no Docker). Builds the frontend first if needed.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Build the frontend if it hasn't been built yet.
if [ ! -f frontend/dist/index.html ]; then
  echo "==> frontend not built — building now"
  (cd frontend && npm install && npm run build)
fi

PY="$ROOT/.venv/bin/python"
if [ ! -x "$PY" ]; then
  echo "No virtualenv found. Run ./scripts/setup.sh first."; exit 1
fi

APP_PORT="${APP_PORT:-17432}"
echo "==> Mellow → http://localhost:${APP_PORT}  (LAN: $(hostname -I 2>/dev/null | awk '{print $1}'):${APP_PORT})"
cd backend
exec "$PY" -m uvicorn main:app --host 0.0.0.0 --port "$APP_PORT"
