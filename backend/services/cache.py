"""Lightweight thread-safe TTL caches for expensive operations.

metadata cache -> long-lived (search results, video metadata)
stream cache   -> short-lived (YouTube stream URLs expire after ~6 hours)
"""

import threading
import time
from collections import OrderedDict


class TTLCache:
    def __init__(self, ttl: float = 300.0, maxsize: int = 512):
        self.ttl = ttl
        self.maxsize = maxsize
        self._data: OrderedDict = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str):
        with self._lock:
            item = self._data.get(key)
            if item is None:
                return None
            expires, value = item
            if time.monotonic() > expires:
                self._data.pop(key, None)
                return None
            self._data.move_to_end(key)
            return value

    def set(self, key: str, value, ttl: float | None = None):
        with self._lock:
            self._data[key] = (time.monotonic() + (ttl if ttl is not None else self.ttl), value)
            self._data.move_to_end(key)
            while len(self._data) > self.maxsize:
                self._data.popitem(last=False)

    def clear(self):
        with self._lock:
            self._data.clear()


# Search/metadata is fairly stable — cache for 10 minutes.
metadata_cache = TTLCache(ttl=600.0, maxsize=512)

# Stream URLs are temporary — cache for 4 hours (they expire ~6h).
stream_cache = TTLCache(ttl=14400.0, maxsize=512)
