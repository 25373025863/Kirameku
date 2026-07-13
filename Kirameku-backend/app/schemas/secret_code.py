from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

SecretCodeTargetType = Literal["internal", "external", "download"]


class SecretCodeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    target_type: SecretCodeTargetType = "internal"
    target_url: str = Field(min_length=1, max_length=2000)
    is_active: bool = True
    expires_at: datetime | None = None
    max_uses: int = Field(default=0, ge=0)


class SecretCodeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    code: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    target_type: SecretCodeTargetType | None = None
    target_url: str | None = Field(default=None, min_length=1, max_length=2000)
    is_active: bool | None = None
    expires_at: datetime | None = None
    max_uses: int | None = Field(default=None, ge=0)


class SecretCodeOut(BaseModel):
    id: int
    name: str
    code: str
    description: str
    target_type: SecretCodeTargetType
    target_url: str
    is_active: bool
    expires_at: datetime | None
    max_uses: int
    use_count: int
    last_used_at: datetime | None
    created_at: datetime
    updated_at: datetime


class SecretCodeResolveRequest(BaseModel):
    code: str = Field(min_length=1, max_length=100)


class SecretCodeResolveOut(BaseModel):
    matched: bool
    reason: Literal["", "invalid", "expired", "exhausted"] = ""
    name: str = ""
    description: str = ""
    target_type: SecretCodeTargetType | None = None
    target_url: str = ""
