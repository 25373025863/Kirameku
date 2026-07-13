from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.deps import get_current_user, get_session
from app.models import SecretCode
from app.schemas import (
    SecretCodeCreate,
    SecretCodeOut,
    SecretCodeResolveOut,
    SecretCodeResolveRequest,
    SecretCodeUpdate,
)

router = APIRouter(prefix="/api/secret-codes", tags=["暗号"])

TARGET_TYPES = {"internal", "external", "download"}


def _now_for(value: datetime | None = None) -> datetime:
    if value and value.tzinfo:
        return datetime.now(value.tzinfo)
    return datetime.now()


def _clean_code(code: str) -> str:
    value = code.strip()
    if not value:
        raise HTTPException(status_code=422, detail="暗号不能为空")
    return value


def _validate_target(target_type: str, target_url: str) -> str:
    url = target_url.strip()
    if target_type not in TARGET_TYPES:
        raise HTTPException(status_code=422, detail="不支持的目标类型")
    if not url:
        raise HTTPException(status_code=422, detail="目标地址不能为空")

    if target_type == "internal":
        if not url.startswith("/") or url.startswith("//"):
            raise HTTPException(status_code=422, detail="站内页面地址必须以 / 开头")
        return url

    if target_type == "download" and url.startswith("/") and not url.startswith("//"):
        return url

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=422, detail="请输入有效的 http 或 https 地址")
    return url


def _get_item(session: Session, code_id: int) -> SecretCode:
    item = session.get(SecretCode, code_id)
    if not item:
        raise HTTPException(status_code=404, detail="暗号不存在")
    return item


def _ensure_unique_code(
    session: Session,
    code: str,
    exclude_id: int | None = None,
) -> None:
    existing = session.exec(select(SecretCode).where(SecretCode.code == code)).first()
    if existing and existing.id != exclude_id:
        raise HTTPException(status_code=409, detail="该暗号已存在")


@router.post("/resolve", response_model=SecretCodeResolveOut)
def resolve_secret_code(
    data: SecretCodeResolveRequest,
    session: Session = Depends(get_session),
):
    code = _clean_code(data.code)
    item = session.exec(select(SecretCode).where(SecretCode.code == code)).first()
    if not item or not item.is_active:
        return SecretCodeResolveOut(matched=False, reason="invalid")

    now = _now_for(item.expires_at)
    if item.expires_at and item.expires_at <= now:
        return SecretCodeResolveOut(matched=False, reason="expired")
    if item.max_uses > 0 and item.use_count >= item.max_uses:
        return SecretCodeResolveOut(matched=False, reason="exhausted")

    item.use_count += 1
    item.last_used_at = now
    item.updated_at = now
    session.add(item)
    session.commit()

    return SecretCodeResolveOut(
        matched=True,
        name=item.name,
        description=item.description,
        target_type=item.target_type,
        target_url=item.target_url,
    )


@router.get("/admin", response_model=list[SecretCodeOut])
def list_secret_codes(
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    return session.exec(select(SecretCode).order_by(SecretCode.created_at.desc())).all()


@router.post("", response_model=SecretCodeOut)
def create_secret_code(
    data: SecretCodeCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    code = _clean_code(data.code)
    _ensure_unique_code(session, code)
    item = SecretCode(
        **data.model_dump(exclude={"code", "target_url"}),
        code=code,
        target_url=_validate_target(data.target_type, data.target_url),
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.put("/{code_id}", response_model=SecretCodeOut)
def update_secret_code(
    code_id: int,
    data: SecretCodeUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    item = _get_item(session, code_id)
    updates = data.model_dump(exclude_unset=True)

    if "code" in updates:
        updates["code"] = _clean_code(updates["code"])
        _ensure_unique_code(session, updates["code"], code_id)

    target_type = updates.get("target_type", item.target_type)
    target_url = updates.get("target_url", item.target_url)
    if "target_type" in updates or "target_url" in updates:
        updates["target_url"] = _validate_target(target_type, target_url)

    for key, value in updates.items():
        setattr(item, key, value)
    item.updated_at = datetime.now()
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.post("/{code_id}/reset-uses", response_model=SecretCodeOut)
def reset_secret_code_uses(
    code_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    item = _get_item(session, code_id)
    item.use_count = 0
    item.last_used_at = None
    item.updated_at = datetime.now()
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/{code_id}")
def delete_secret_code(
    code_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    item = _get_item(session, code_id)
    session.delete(item)
    session.commit()
    return {"ok": True}
