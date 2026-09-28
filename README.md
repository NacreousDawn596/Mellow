# ✦ Mellow

**Mellow** is a phone-first, local-only music streaming web app — what Apple
Music and YouTube Music would look like if they had a gothic-purple child that
lived entirely on your device.

It searches and streams real YouTube audio via `yt-dlp`, with a glassmorphism
"elegant night" interface, dynamic artwork-tinted backgrounds, playlists,
offline-friendly local state, and full PWA support.

> Personal, local project. Uses yt-dlp only for content it can legitimately
> access. No DRM bypass, no authentication evasion.

---

## Features

- **Real YouTube search** (YouTube Data API v3) with normalized durations
- **Instant streaming** — resolves a direct audio stream, never downloads the
  whole song just to play it
- **Audio downloads** (native `.m4a` / `.webm`) streamed to your device
- **Dynamic backgrounds** — extracts artwork colors and tints the player
- **Full player** with swipe-to-minimize, scrubbing, and a living background
- **Queue** with add-next / add-to-end / reorder / clear
- **Shuffle** (permuted queue, no immediate repeats) & **Repeat** (off/all/one)
- **Playlists** — create, rename, delete, reorder, play, shuffle
- **Library** — favorites, recently played, downloads, playlists
- **Local-first persistence** — everything survives a reload
- **PWA** — installable, standalone, with honest service-worker caching

---

## Requirements

- **Docker** (recommended), or
- **Python 3.10+** and **Node 18+** for local development
- A **YouTube Data API v3 key** (free, from the Google Cloud Console)

> `ffmpeg` is **not** required — Mellow streams and downloads native audio
> formats directly.

---

## Quick start (Docker)

```bash
docker build -t gothic-music .
docker run --rm -p 17432:17432 \
  -e YOUTUBE_API_KEY="your-api-key" \
  gothic-music
```

Then open **http://localhost:17432** on your phone or desktop browser.

Or with Docker Compose:

```bash
docker compose up --build
```

### Accessing from other devices

The server binds to `0.0.0.0` inside the container and the port is published on
all host interfaces, so any device on your LAN can reach it at:

```
http://<your-computer's-LAN-IP>:17432
```

Find your LAN IP with `hostname -I` (Linux) or `ipconfig getifaddr en0` (macOS).
Keep this in mind: the key only exists server-side, so clients never see it.

### Changing the host port

The container always listens on `APP_PORT` (default `17432`). To map it to any
host port, just change the left side of `-p`:

```bash
docker run --rm -p 8085:17432 -e YOUTUBE_API_KEY="..." gothic-music
```

No application changes needed. The frontend is served by the same process, so
there's nothing else to configure.

---

## Running on Android (Termux) & iOS (iSH)

Mellow runs fully natively on a phone — **no Docker, no root**. The FastAPI
backend serves the compiled React frontend, and you open it in the phone's
browser. You only need Python, Node, and a network connection.

### Get the code onto the phone

Either **git clone** (easiest) or **copy the folder**:

```bash
# Option A — clone (needs git)
git clone <your-repo-url> mellow && cd mellow

# Option B — copy from a computer via USB/cloud, then unpack into a folder
#           and `cd` into it on the phone
```

---

### Termux (Android)

1. Install **Termux from F-Droid** (the Google Play build is deprecated — don't
   use it).
2. Open Termux and update it, then grant storage access (so you can reach files
   you copied over):

   ```bash
   pkg update && pkg upgrade
   pkg install git
   termux-setup-storage        # optional — only if you copied files to /sdcard
   ```

3. Clone (or copy) Mellow, then run the one-shot setup:

   ```bash
   git clone <your-repo-url> mellow && cd mellow
   ./scripts/setup.sh          # installs python + node, pip deps, builds frontend
   ```

4. Start it:

   ```bash
   ./scripts/run.sh
   ```

5. Open **http://localhost:17432** in any Android browser.

---

### iSH (iOS)

1. Install **iSH** from the App Store.
2. Open iSH, update the package list, and install git:

   ```sh
   apk update
   apk add git
   ```

3. Clone (or copy) Mellow, then run the one-shot setup:

   ```sh
   git clone <your-repo-url> mellow && cd mellow
   ./scripts/setup.sh          # installs python3 + node, pip deps, builds frontend
   ```

4. Start it:

   ```sh
   ./scripts/run.sh
   ```

5. Open **http://localhost:17432** in Safari.

> **iSH is slow** — it runs an x86 Linux in software emulation, so the first
> `npm install` + `npm run build` can take several minutes. Two ways to dodge
> that: build the frontend once on a real computer (`npm run build`) and copy
> the resulting `frontend/dist/` folder over (then `run.sh` skips the build), or
> just be patient the first time.

---

### Phone notes & limitations

- **Dependencies**: only Python 3.10+, Node 18+, and network access. No ffmpeg
  (Mellow streams/downloads native audio), and yt-dlp uses `node` as its JS
  runtime when `deno` isn't present.
- **API key**: already embedded (Base64) in `backend/config.py`, or set
  `YOUTUBE_API_KEY` to override.
- **Port**: `APP_PORT` env var (default `17432`). e.g. `APP_PORT=8080 ./scripts/run.sh`.
- **LAN access**: the server binds `0.0.0.0`, so other devices on the same
  Wi-Fi can open `http://<phone-LAN-IP>:17432`.
- **iOS backgrounding**: iSH pauses when you switch away from it, so the server
  only runs while iSH is in the foreground (keep it open, or use split view).
  This is an iOS limitation, not an app bug.
- **Downloads are local**: use the ⤓ action to save songs offline (stored in
  IndexedDB), so your library keeps playing even without a stable connection.

---

## Development mode

### Backend

```bash
cd backend
pip install -r requirements.txt
export YOUTUBE_API_KEY="your-api-key"
uvicorn main:app --host 0.0.0.0 --port 17432
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite runs on `http://localhost:5173` and proxies `/api` to the backend at
`http://localhost:17432`. To point the proxy at a different backend:

```bash
MELLOW_BACKEND=http://localhost:9999 npm run dev
```

---

## Configuration

Environment variables:

| Variable                | Purpose                                      | Default        |
| ----------------------- | -------------------------------------------- | -------------- |
| `YOUTUBE_API_KEY`       | Plain YouTube Data API key (preferred)       | *(none)*       |
| `YOUTUBE_API_KEY_B64`   | Base64-encoded key                           | *(none)*       |
| `APP_PORT`              | Port the app listens on                     | `17432`        |
| `LOG_LEVEL`             | Python log level                             | `info`         |

The backend also ships with an embedded **Base64 placeholder** key in
`backend/config.py` for zero-config development. Replace that string with
`base64.b64encode(b"YOUR_KEY").decode()`, or — better — set an environment
variable.

> **Base64 is not encryption.** It only prevents casually pasting a secret in
> source. The key never reaches the frontend bundle; it exists server-side only.

---

## How it works

```
React player ──► FastAPI ──► yt-dlp ──► resolved media stream ──► <audio>
                       │
                       └──► python-youtube ──► YouTube Data API v3 (search)
```

- `/api/search` → YouTube search, normalized `Track` JSON
- `/api/stream/{id}` → a direct, temporary audio URL (short-lived cache)
- `/api/metadata/{id}` → track metadata (long-lived cache)
- `/api/download/{id}` → streamed audio file download with temp-file cleanup

YouTube stream URLs expire, so the backend caches them briefly and the player
transparently re-resolves if a URL goes stale.

---

## Project structure

```
backend/
  main.py               # FastAPI app + SPA serving
  config.py             # env / Base64 key handling
  models.py             # Pydantic models
  services/
    youtube.py          # search + metadata + duration normalization
    ytdlp.py            # stream resolution + audio download
    cache.py            # in-memory TTL caches
frontend/
  src/
    components/         # nav, players, sheets, rows, cards
    pages/              # Home, Search, Library, Downloads, Playlist
    store/              # player + UI stores
    services/           # api + localStorage abstraction
    hooks/              # usePlayer, useSearch, useDownloads, ...
    utils/              # color extraction, formatting
  public/               # manifest, service worker, icons
Dockerfile
docker-compose.yml
```

---

## Legal note

Mellow is a local personal project. It does not bypass authentication, DRM,
YouTube access controls, paywalls, or platform security. Use `yt-dlp` only for
content you are allowed to access.
