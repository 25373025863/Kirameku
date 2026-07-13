from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class DownloadFile(SQLModel, table=True):
    __tablename__ = "download_file"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    category: str = Field(default="", max_length=80)
    source_type: str = Field(default="local", max_length=30)
    original_filename: str = Field(default="", max_length=255)
    stored_filename: str = Field(default="", max_length=255)
    storage_path: str = Field(default="", max_length=500)
    external_url: str = Field(default="", max_length=1000)
    file_size: int = Field(default=0)
    mime_type: str = Field(default="", max_length=120)
    is_public: bool = Field(default=True)
    download_count: int = Field(default=0)
    sort: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
