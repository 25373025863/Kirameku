from datetime import datetime

from pydantic import BaseModel


class DownloadFileCreate(BaseModel):
    title: str
    description: str = ""
    category: str = ""
    source_type: str = "link"
    external_url: str
    original_filename: str = ""
    file_size: int = 0
    mime_type: str = ""
    is_public: bool = True
    sort: int = 0


class DownloadFileUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    source_type: str | None = None
    external_url: str | None = None
    original_filename: str | None = None
    file_size: int | None = None
    mime_type: str | None = None
    is_public: bool | None = None
    sort: int | None = None


class DownloadFileOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    source_type: str
    original_filename: str
    external_url: str
    file_size: int
    mime_type: str
    is_public: bool
    download_count: int
    sort: int
    download_url: str
    created_at: datetime
    updated_at: datetime | None = None
