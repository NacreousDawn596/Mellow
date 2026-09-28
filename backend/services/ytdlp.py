"""yt-dlp streaming resolver + audio downloader.

Uses yt-dlp's Python API directly (never shelling out). Stream resolution
returns a direct media URL (no full download); audio downloads stream a native
m4a/webm file to disk in a temporary directory for immediate hand-off.

All extraction is funneled through a single worker (concurrency 1) with
in-flight deduplication and a global cooldown, so rapid play taps can't hammer
YouTube into throttling the IP.
"""

import asyncio
import logging
import os
import random
import shutil
import tempfile
import time

import yt_dlp

from services.cache import stream_cache

log = logging.getLogger("mellow.ytdlp")

_VIDEO_URL = "https://www.youtube.com/watch?v={id}"

# Jittered backoff (seconds) between consecutive empty-URL failures.
_BACKOFF = (1.5,)
# Global cooldown applied after a throttle-looking failure.
_COOLDOWN_SECONDS = 20.0

# Streaming quality tiers -> yt-dlp format selectors.
QUALITY_FORMATS = {
    "best": "bestaudio/best",
    "balanced": "bestaudio[abr<=128]/bestaudio/best",
    "data_saver": "bestaudio[abr<=64]/bestaudio/best",
}


class YTDLPError(Exception):
    """A typed extraction failure so the frontend can react appropriately."""

    def __init__(self, message: str, code: str = "unavailable"):
        super().__init__(message)
        self.code = code


class YTDLPService:
    def __init__(self):
        # Serialize every extraction through a single worker.
        self._lock = asyncio.Lock()
        # video_id -> in-flight task (dedupe concurrent requests).
        self._inflight: dict[str, asyncio.Task] = {}
        self._cooldown_until = 0.0

    @staticmethod
    def _opts(clients, js: bool = False) -> dict:
        o = {
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "socket_timeout": 20,
            "retries": 3,
            "fragment_retries": 3,
            "extractor_args": {"youtube": {"player_client": clients}},
        }
        if js:
            o["js_runtimes"] = {"deno": {}, "node": {}, "bun": {}}
            o["remote_components"] = ["ejs:github"]
        return o

    @staticmethod
    def _pick_stream_url(info: dict) -> tuple:
        """Return (url, ext) for the best playable audio format, or (None, None)."""
        if info.get("url"):
            return info["url"], info.get("ext")

        formats = info.get("formats") or []

        # Prefer audio-only formats with a direct URL, highest bitrate first.
        best = None
        for f in formats:
            if not f.get("url"):
                continue
            if f.get("acodec") in (None, "none"):
                continue
            score = f.get("abr") or f.get("asr") or 0
            if best is None or score > best["score"]:
                best = {"url": f["url"], "ext": f.get("ext"), "score": score}
        if best:
            return best["url"], best["ext"]

        # Last resort: any format with a direct URL.
        for f in formats:
            if f.get("url"):
                return f["url"], f.get("ext")

        return None, None

    async def resolve_stream(self, video_id: str, quality: str = "best") -> dict:
        """Resolve a direct playable audio URL without downloading the file."""
        cache_key = f"stream:{video_id}:{quality}"
        cached = stream_cache.get(cache_key)
        if cached is not None:
            return cached

        # De-duplicate concurrent requests for the same video+quality.
        pending = self._inflight.get(cache_key)
        if pending is not None and not pending.done():
            return await pending

        task = asyncio.ensure_future(self._resolve(video_id, cache_key, quality))
        self._inflight[cache_key] = task
        try:
            return await task
        finally:
            if self._inflight.get(cache_key) is task:
                self._inflight.pop(cache_key, None)

    async def _resolve(self, video_id: str, cache_key: str, quality: str) -> dict:
        async with self._lock:
            # Another worker may have resolved while we waited for the lock.
            cached = stream_cache.get(cache_key)
            if cached is not None:
                return cached

            # Respect any active global cooldown from a prior throttle.
            wait = self._cooldown_until - time.monotonic()
            if wait > 0:
                await asyncio.sleep(wait)

            try:
                result = await asyncio.to_thread(self._extract, video_id, quality)
            except YTDLPError:
                raise
            except Exception as e:  # noqa: BLE001
                log.exception("Stream resolution failed for %s", video_id)
                raise YTDLPError("Stream resolution failed.", code="network_error") from e

            stream_cache.set(cache_key, result)
            return result

    @classmethod
    def _try_extract(cls, video_id: str, fmt: str, clients, js: bool = False):
        """One extraction attempt. Returns a stream dict or None if no URL."""
        opts = cls._opts(clients, js=js)
        opts.update({"format": fmt, "skip_download": True})
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(_VIDEO_URL.format(id=video_id), download=False)
            if not info:
                raise YTDLPError("No metadata returned for this video.", code="unavailable")
            if info.get("entries"):
                info = next((e for e in info["entries"] if e), info)
            url, ext = cls._pick_stream_url(info)
            if url:
                return {"url": url, "ext": ext or "m4a", "title": info.get("title")}
        return None

    def _extract(self, video_id: str, quality: str = "best") -> dict:
        fmt = QUALITY_FORMATS.get(quality, QUALITY_FORMATS["best"])

        # Fast path: the `android` client returns a direct URL with a single
        # request and no JS-runtime/nsig solving — this is what makes playback
        # start quickly. Retry once on a transient miss.
        for i in range(2):
            result = self._try_extract(video_id, fmt, ["android"])
            if result:
                self._cooldown_until = 0.0
                return result
            if i == 0:
                time.sleep(1.0 + random.uniform(0.0, 0.5))

        # Slow fallback: full client list + JS runtime, only reached when the
        # fast path yields no URL (e.g. YouTube's SABR experiment).
        result = self._try_extract(
            video_id, fmt, ["android", "web_embedded", "web"], js=True
        )
        if result:
            self._cooldown_until = 0.0
            return result

        self._cooldown_until = time.monotonic() + _COOLDOWN_SECONDS
        raise YTDLPError(
            "YouTube throttled the request. Please wait a moment and try again.",
            code="throttled",
        )

    async def download_audio(self, video_id: str) -> tuple[str, str]:
        """Download best-audio (preferring native m4a) into a temp dir.

        Returns ``(filepath, title)``. The caller is responsible for streaming
        the file to the client and cleaning up the temp directory.
        """
        tmpdir = tempfile.mkdtemp(prefix="mellow-dl-")

        def _download() -> tuple[str, str]:
            outtmpl = os.path.join(tmpdir, "%(id)s.%(ext)s")
            opts = self._opts(["android", "web_embedded", "web"], js=True)
            opts.update(
                {
                    "format": "bestaudio[ext=m4a]/bestaudio/best",
                    "outtmpl": outtmpl,
                    "restrictfilenames": True,
                }
            )
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(
                    _VIDEO_URL.format(id=video_id), download=True
                )
                files = [
                    f
                    for f in os.listdir(tmpdir)
                    if not f.endswith((".part", ".ytdl", ".part-Frag0"))
                ]
                if not files:
                    raise YTDLPError("Download produced no output file.", code="unavailable")
                return os.path.join(tmpdir, files[0]), info.get("title", video_id)

        try:
            filepath, title = await asyncio.to_thread(_download)
        except YTDLPError:
            shutil.rmtree(tmpdir, ignore_errors=True)
            raise
        except Exception as e:  # noqa: BLE001
            log.exception("Download failed for %s", video_id)
            shutil.rmtree(tmpdir, ignore_errors=True)
            raise YTDLPError("Download failed.", code="network_error") from e

        return filepath, title
