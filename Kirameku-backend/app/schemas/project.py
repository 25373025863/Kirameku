from datetime import datetime
from typing import Literal
from pydantic import BaseModel

ProjectType = Literal["own", "favorite"]


class ProjectCreate(BaseModel):
    name: str
    slug: str
    description: str = ""
    long_description: str = ""
    cover_image: str = ""
    tech_stack: list[str] = []
    link_github: str = ""
    link_gitee: str = ""
    link_live: str = ""
    link_docs: str = ""
    project_type: ProjectType = "own"
    status: str = "developing"
    status_label: str = ""
    is_featured: bool = False
    sort: int = 0


class ProjectUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    long_description: str | None = None
    cover_image: str | None = None
    tech_stack: list[str] | None = None
    link_github: str | None = None
    link_gitee: str | None = None
    link_live: str | None = None
    link_docs: str | None = None
    project_type: ProjectType | None = None
    status: str | None = None
    status_label: str | None = None
    is_featured: bool | None = None
    sort: int | None = None


class ProjectMetadataRequest(BaseModel):
    source_url: str


class ProjectMetadataOut(BaseModel):
    name: str
    slug: str
    description: str
    long_description: str
    cover_image: str
    tech_stack: list[str]
    link_github: str
    link_gitee: str
    link_live: str
    link_docs: str


class ProjectOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    long_description: str
    cover_image: str
    tech_stack: list[str] = []
    link_github: str
    link_gitee: str
    link_live: str
    link_docs: str
    project_type: ProjectType
    status: str
    status_label: str
    is_featured: bool
    sort: int
    created_at: datetime
