from datetime import datetime

from pydantic import BaseModel, Field


class AcgPersonalFields(BaseModel):
    status: str = "watched"
    progress: int = Field(default=0, ge=0)
    personal_score: float = Field(default=0, ge=0, le=10)
    review: str = ""
    watched_at: str = ""
    favorite: bool = False
    is_public: bool = True
    sort: int = 0


class AcgItemCreate(AcgPersonalFields):
    bangumi_id: int
    name: str
    name_cn: str = ""
    cover_url: str = ""
    summary: str = ""
    air_date: str = ""
    year: int = 0
    total_episodes: int = 0
    bangumi_score: float = 0
    bangumi_rank: int = 0
    tags: list[str] = Field(default_factory=list)
    source_url: str = ""


class AcgItemUpdate(BaseModel):
    status: str | None = None
    progress: int | None = Field(default=None, ge=0)
    personal_score: float | None = Field(default=None, ge=0, le=10)
    review: str | None = None
    watched_at: str | None = None
    favorite: bool | None = None
    is_public: bool | None = None
    sort: int | None = None


class AcgImportRequest(AcgPersonalFields):
    pass


class AcgItemOut(AcgItemCreate):
    id: int
    created_at: datetime
    updated_at: datetime | None = None


class BangumiSearchItem(BaseModel):
    bangumi_id: int
    name: str
    name_cn: str = ""
    cover_url: str = ""
    summary: str = ""
    air_date: str = ""
    year: int = 0
    total_episodes: int = 0
    score: float = 0
    rank: int = 0
    tags: list[str] = Field(default_factory=list)
    source_url: str = ""
