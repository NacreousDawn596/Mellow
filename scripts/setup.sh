#!/usr/bin/env sh
# Install everything needed to run Mellow natively (no Docker).
# Supports Termux (Android), iSH / Alpine (iOS), and generic apt-based Linux.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------- platform
PLATFORM=""
if [ -n "$PREFIX" ] && [ -x "$PREFIX/bin/pkg" ]; then
  PLATFORM="termux"
elif [ -f /etc/alpine-release ]; then
  PLATFORM="alpine"   # iSH runs Alpine Linux
else
  PLATFORM="apt"
fi
echo "==> platform: $PLATFORM"

PIP_ARGS=""

case "$PLATFORM" in
  termux)
    pkg update -y
    pkg install -y python nodejs
    ;;
  alpine)
    apk update
    apk add --no-cache python3 py3-pip nodejs npm
    PIP_ARGS="--break-system-packages"
    ;;
  apt)
    if command -v sudo >/dev/null 2>&1; then SUDO="sudo"; else SUDO=""; fi
    $SUDO apt-get update
    $SUDO apt-get install -y python3 python3-pip python3-venv nodejs npm
    PIP_ARGS="--break-system-packages"
    ;;
esac

# ---------------------------------------------------------------- python deps
PY=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
[ -z "$PY" ] && { echo "No Python found."; exit 1; }
echo "==> installing Python deps ($PY)"
# Try normally first, then fall back to --break-system-packages (Alpine/Debian
# "externally managed" environments, and some Termux setups).
"$PY" -m pip install $PIP_ARGS -r backend/requirements.txt 2>/dev/null \
  || "$PY" -m pip install --break-system-packages -r backend/requirements.txt

# ---------------------------------------------------------------- frontend
echo "==> building frontend (first build is the slow part)"
cd frontend
npm install
npm run build
cd ..

echo ""
echo "✓ Mellow is ready."
echo "  Start it with:  ./scripts/run.sh"
echo "  Then open:      http://localhost:17432  (or your phone's LAN IP:17432)"
