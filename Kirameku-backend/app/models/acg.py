from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class AcgItem(SQLModel, table=True):
    __tablename__ = "acg_item"

    id: Optional[int] = Field(default=None, primary_key=True)
    bangumi_id: int = Field(index=True, unique=True)
    name: str = Field(max_length=200)
    name_cn: str = Field(default="", max_length=200)
    cover_url: str = Field(default="", max_length=1000)
    summary: str = Field(default="")
    air_date: str = Field(default="", max_length=20)
    year: int = Field(default=0, index=True)
    total_episodes: int = Field(default=0)
    bangumi_score: float = Field(default=0)
    bangumi_rank: int = Field(default=0)
    tags: str = Field(default="[]")
    source_url: str = Field(default="", max_length=500)

    status: str = Field(default="watched", max_length=20, index=True)
    progress: int = Field(default=0)
    personal_score: float = Field(default=0)
    review: str = Field(default="")
    watched_at: str = Field(default="", max_length=20)
    favorite: bool = Field(default=False)
    is_public: bool = Field(default=True, index=True)
    sort: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
