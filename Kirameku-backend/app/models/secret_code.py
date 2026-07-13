from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class SecretCode(SQLModel, table=True):
    __tablename__ = "secret_code"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    code: str = Field(max_length=100, unique=True, index=True)
    description: str = Field(default="", max_length=500)
    target_type: str = Field(default="internal", max_length=20)
    target_url: str = Field(max_length=2000)
    is_active: bool = Field(default=True)
    expires_at: Optional[datetime] = Field(default=None)
    max_uses: int = Field(default=0)
    use_count: int = Field(default=0)
    last_used_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
