"""Pydantic response models. Internal yt-dlp objects are never exposed."""

from pydantic import BaseModel, Field


class Track(BaseModel):
    id: str
    title: str
    artist: str
    thumbnail: str
    duration: str
    url: str
    source: str = "youtube"


class SearchResponse(BaseModel):
    query: str
    results: list[Track] = Field(default_factory=list)


class StreamInfo(BaseModel):
    url: str
    ext: str = "m4a"
    expires_in: int = 14400


class HealthResponse(BaseModel):
    status: str
    youtube_configured: bool
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    detail: str
