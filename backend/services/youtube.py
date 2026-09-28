"""YouTube Data API v3 integration via python-youtube.

Provides search and metadata, with ISO-8601 durations normalized to
human-readable strings (e.g. "3:42", "1:02:31").
"""

import logging
import re

from pyyoutube import Api

from models import Track
from services.cache import metadata_cache

log = logging.getLogger("mellow.youtube")

_ISO_RE = re.compile(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$")


class YouTubeNotConfigured(Exception):
    """Raised when no usable API key is present."""


def parse_iso_duration(iso: str) -> str:
    if not iso:
        return "0:00"
    m = _ISO_RE.match(iso)
    if not m:
        # Fall back to zero rather than leaking raw ISO strings to the UI.
        return "0:00"
    hours = int(m.group(1) or 0)
    minutes = int(m.group(2) or 0)
    seconds = int(m.group(3) or 0)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


class YouTubeService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.configured = bool(api_key) and api_key != "NOT_CONFIGURED"
        self._api = Api(api_key=api_key) if self.configured else None

    def search(self, query: str, limit: int = 20) -> list[Track]:
        if not self.configured:
            raise YouTubeNotConfigured("YouTube API key is not configured.")

        cache_key = f"search:{query.lower()}:{limit}"
        cached = metadata_cache.get(cache_key)
        if cached is not None:
            return cached

        resp = self._api.search_by_keywords(
            q=query, search_type="video", count=min(limit, 50), limit=50
        )
        items = [it for it in resp.items if it.id and getattr(it.id, "videoId", None)]
        items = items[:limit]

        ids = [it.id.videoId for it in items]
        durations = self._batch_durations(ids)

        results = []
        for it in items:
            vid = it.id.videoId
            sn = it.snippet
            results.append(
                Track(
                    id=vid,
                    title=sn.title,
                    artist=sn.channelTitle,
                    thumbnail=self._best_thumbnail(sn.thumbnails),
                    duration=durations.get(vid, "0:00"),
                    url=f"https://www.youtube.com/watch?v={vid}",
                )
            )

        metadata_cache.set(cache_key, results)
        return results

    def metadata(self, video_id: str) -> Track | None:
        if not self.configured:
            raise YouTubeNotConfigured("YouTube API key is not configured.")

        cache_key = f"meta:{video_id}"
        cached = metadata_cache.get(cache_key)
        if cached is not None:
            return cached

        resp = self._api.get_video_by_id(
            video_id=video_id, parts="snippet,contentDetails"
        )
        if not resp.items:
            return None

        v = resp.items[0]
        sn = v.snippet
        duration = ""
        if v.contentDetails and v.contentDetails.duration:
            duration = parse_iso_duration(v.contentDetails.duration)

        track = Track(
            id=v.id,
            title=sn.title,
            artist=sn.channelTitle,
            thumbnail=self._best_thumbnail(sn.thumbnails),
            duration=duration,
            url=f"https://www.youtube.com/watch?v={v.id}",
        )
        metadata_cache.set(cache_key, track)
        return track

    def _batch_durations(self, ids: list[str]) -> dict[str, str]:
        if not ids:
            return {}
        try:
            resp = self._api.get_video_by_id(video_id=ids, parts="contentDetails")
            result = {}
            for v in resp.items:
                if v.contentDetails and v.contentDetails.duration:
                    result[v.id] = parse_iso_duration(v.contentDetails.duration)
            return result
        except Exception as e:  # noqa: BLE001
            log.warning("Failed to batch-fetch durations: %s", e)
            return {}

    @staticmethod
    def _best_thumbnail(thumbs) -> str:
        if not thumbs:
            return ""
        for key in ("high", "medium", "default", "standard", "maxres"):
            t = getattr(thumbs, key, None)
            if t and getattr(t, "url", None):
                return t.url
        return ""
