"""Mellow — FastAPI application.

Serves the JSON API under ``/api/*`` and the compiled React frontend for every
other route (SPA fallback). Runs entirely locally.
"""

import asyncio
import logging
import os
import re
import shutil

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from models import HealthResponse, SearchResponse, StreamInfo
from services.youtube import YouTubeNotConfigured, YouTubeService
from services.ytdlp import YTDLPError, YTDLPService

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
log = logging.getLogger("mellow")

app = FastAPI(title="Mellow", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local-first app; tighten if ever exposed publicly
    allow_methods=["*"],
    allow_headers=["*"],
)

youtube = YouTubeService(settings.youtube_api_key)
ytdlp = YTDLPService()

_VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
_SAFE_NAME_RE = re.compile(r"[^\w\s-]", re.UNICODE)
_WS_RE = re.compile(r"\s+")


def validate_video_id(video_id: str) -> str:
    if not _VIDEO_ID_RE.match(video_id):
        raise HTTPException(status_code=400, detail="Invalid video ID.")
    return video_id


# ---------------------------------------------------------------- API routes


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", youtube_configured=youtube.configured)


@app.get("/api/search", response_model=SearchResponse)
async def search(q: str = Query(..., min_length=1, max_length=200)):
    try:
        results = youtube.search(q, limit=20)
    except YouTubeNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:  # noqa: BLE001
        log.exception("Search failed for %r", q)
        raise HTTPException(
            status_code=502, detail="YouTube search failed. Check your API key."
        )
    return SearchResponse(query=q, results=results)


@app.get("/api/stream/{video_id}", response_model=StreamInfo)
async def stream(video_id: str, quality: str = Query("best")):
    video_id = validate_video_id(video_id)
    try:
        info = await ytdlp.resolve_stream(video_id, quality=quality)
    except YTDLPError as e:
        raise HTTPException(status_code=502, detail={"message": str(e), "code": e.code})
    return StreamInfo(url=info["url"], ext=info.get("ext", "m4a"))


@app.get("/api/metadata/{video_id}")
async def metadata(video_id: str):
    video_id = validate_video_id(video_id)
    try:
        track = youtube.metadata(video_id)
    except YouTubeNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e))
    if track is None:
        raise HTTPException(status_code=404, detail="Track not found.")
    return track


@app.get("/api/download/{video_id}")
async def download(video_id: str):
    video_id = validate_video_id(video_id)
    try:
        filepath, title = await ytdlp.download_audio(video_id)
    except YTDLPError as e:
        raise HTTPException(status_code=502, detail={"message": str(e), "code": e.code})

    ext = os.path.splitext(filepath)[1].lstrip(".").lower() or "m4a"
    media_type = {
        "m4a": "audio/mp4",
        "mp4": "audio/mp4",
        "aac": "audio/aac",
        "webm": "audio/webm",
        "opus": "audio/opus",
        "mp3": "audio/mpeg",
        "ogg": "audio/ogg",
    }.get(ext, "application/octet-stream")

    safe_title = _WS_RE.sub(" ", _SAFE_NAME_RE.sub("", title or video_id)).strip()
    safe_title = (safe_title or video_id)[:80]
    filename = f"{safe_title}.{ext}"

    tmpdir = os.path.dirname(filepath)

    def iter_file():
        try:
            with open(filepath, "rb") as f:
                while True:
                    chunk = f.read(256 * 1024)
                    if not chunk:
                        break
                    yield chunk
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    # Safety net in case the client disconnects before the generator finishes.
    loop = asyncio.get_running_loop()
    loop.call_later(1800, lambda: shutil.rmtree(tmpdir, ignore_errors=True))

    return StreamingResponse(
        iter_file(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ------------------------------------------------------- static frontend SPA

def _resolve_frontend_dist() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, "frontend", "dist"),  # Docker layout (/app/frontend/dist)
        os.path.join(here, "..", "frontend", "dist"),  # repo layout (backend/../frontend/dist)
    ]
    return next((c for c in candidates if os.path.isdir(c)), candidates[0])


FRONTEND_DIST = os.environ.get("FRONTEND_DIST", _resolve_frontend_dist())

_assets_dir = os.path.join(FRONTEND_DIST, "assets")
if os.path.isdir(_assets_dir):
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def spa(full_path: str):
    if full_path.startswith("api"):
        return JSONResponse({"detail": "Not found"}, status_code=404)

    if os.path.isdir(FRONTEND_DIST):
        dist_root = os.path.abspath(FRONTEND_DIST)
        candidate = os.path.abspath(os.path.join(FRONTEND_DIST, full_path))
        if candidate.startswith(dist_root) and os.path.isfile(candidate):
            return FileResponse(candidate)
        index = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)

    return JSONResponse(
        {
            "detail": "Frontend not built.",
            "hint": "Run `npm run build` in frontend/ or use the Vite dev server.",
        },
        status_code=404,
    )
