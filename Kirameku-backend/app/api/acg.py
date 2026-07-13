import json
import os
from datetime import datetime
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.deps import get_current_user, get_session
from app.models import AcgItem
from app.schemas import (
    AcgImportRequest,
    AcgItemCreate,
    AcgItemOut,
    AcgItemUpdate,
    BangumiSearchItem,
)

router = APIRouter(prefix="/api/acg", tags=["ACG"])

BANGUMI_API_DOMAINS = list(
    dict.fromkeys(
        [
            os.getenv("BANGUMI_API_URL", "https://api.bgmapi.com").rstrip("/"),
            "https://api.bgm.tv",
        ]
    )
)
BANGUMI_IMAGE_URL = os.getenv(
    "BANGUMI_IMAGE_URL", "https://api.bgmapi.com"
).rstrip("/")
BANGUMI_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Kirameku/1.0 (personal ACG collection)",
}
VALID_STATUSES = {"watched", "watching", "plan", "on_hold", "dropped"}


def _parse_tags(value: str) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
        return [str(item) for item in parsed] if isinstance(parsed, list) else []
    except (TypeError, ValueError):
        return []


def _to_out(item: AcgItem) -> AcgItemOut:
    return AcgItemOut(
        id=item.id,
        bangumi_id=item.bangumi_id,
        name=item.name,
        name_cn=item.name_cn,
        cover_url=item.cover_url,
        summary=item.summary,
        air_date=item.air_date,
        year=item.year,
        total_episodes=item.total_episodes,
        bangumi_score=item.bangumi_score,
        bangumi_rank=item.bangumi_rank,
        tags=_parse_tags(item.tags),
        source_url=item.source_url,
        status=item.status,
        progress=item.progress,
        personal_score=item.personal_score,
        review=item.review,
        watched_at=item.watched_at,
        favorite=item.favorite,
        is_public=item.is_public,
        sort=item.sort,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _validate_status(status: str) -> str:
    normalized = (status or "").strip().lower()
    if normalized not in VALID_STATUSES:
        raise HTTPException(400, "Invalid ACG status")
    return normalized


def _bangumi_item(raw: dict) -> BangumiSearchItem:
    bangumi_id = int(raw.get("id") or 0)
    images = raw.get("images") or {}
    rating = raw.get("rating") or {}
    air_date = str(raw.get("date") or raw.get("air_date") or "")
    year = int(air_date[:4]) if len(air_date) >= 4 and air_date[:4].isdigit() else 0
    tags = [
        str(tag.get("name"))
        for tag in (raw.get("tags") or [])
        if isinstance(tag, dict) and tag.get("name")
    ][:12]
    raw_cover_url = str(
        images.get("large") or images.get("common") or images.get("medium") or ""
    )
    parsed_cover = urlparse(raw_cover_url)
    cover_url = (
        f"{BANGUMI_IMAGE_URL}{parsed_cover.path}"
        if parsed_cover.hostname == "lain.bgm.tv"
        else raw_cover_url
    )
    return BangumiSearchItem(
        bangumi_id=bangumi_id,
        name=str(raw.get("name") or raw.get("name_cn") or f"Bangumi #{bangumi_id}"),
        name_cn=str(raw.get("name_cn") or ""),
        cover_url=cover_url,
        summary=str(raw.get("summary") or ""),
        air_date=air_date,
        year=year,
        total_episodes=int(raw.get("total_episodes") or raw.get("eps") or 0),
        score=float(rating.get("score") or 0),
        rank=int(rating.get("rank") or 0),
        tags=tags,
        source_url=f"https://bgm.tv/subject/{bangumi_id}",
    )


async def _request_bangumi(
    method: str,
    path: str,
    *,
    json_data: dict | None = None,
) -> httpx.Response:
    last_error: Exception | None = None
    for domain in BANGUMI_API_DOMAINS:
        try:
            async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
                response = await client.request(
                    method,
                    f"{domain}{path}",
                    headers=BANGUMI_HEADERS,
                    json=json_data,
                )
            if response.status_code < 500:
                return response
        except httpx.HTTPError as error:
            last_error = error
    raise HTTPException(502, "Bangumi service is temporarily unavailable") from last_error


async def _fetch_bangumi_subject(bangumi_id: int) -> BangumiSearchItem:
    response = await _request_bangumi("GET", f"/v0/subjects/{bangumi_id}")
    if response.status_code == 404:
        raise HTTPException(404, "Bangumi item not found")
    try:
        response.raise_for_status()
        return _bangumi_item(response.json())
    except (httpx.HTTPError, ValueError, TypeError) as error:
        raise HTTPException(502, "Failed to fetch Bangumi metadata") from error


@router.get("", response_model=list[AcgItemOut])
def list_public_acg(
    q: str = "",
    status: str = "",
    year: int | None = None,
    favorite: bool | None = None,
    session: Session = Depends(get_session),
):
    statement = select(AcgItem).where(AcgItem.is_public == True)  # noqa: E712
    if status:
        statement = statement.where(AcgItem.status == _validate_status(status))
    if year:
        statement = statement.where(AcgItem.year == year)
    if favorite is not None:
        statement = statement.where(AcgItem.favorite == favorite)
    items = session.exec(statement).all()
    if q.strip():
        keyword = q.strip().lower()
        items = [
            item
            for item in items
            if keyword in item.name.lower()
            or keyword in item.name_cn.lower()
            or keyword in item.review.lower()
            or any(keyword in tag.lower() for tag in _parse_tags(item.tags))
        ]
    items.sort(
        key=lambda item: (
            item.sort,
            not item.favorite,
            -(item.year or 0),
            -(item.id or 0),
        )
    )
    return [_to_out(item) for item in items]


@router.get("/admin", response_model=list[AcgItemOut])
def list_admin_acg(
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    items = session.exec(select(AcgItem)).all()
    items.sort(key=lambda item: (item.sort, -(item.id or 0)))
    return [_to_out(item) for item in items]


@router.get("/search", response_model=list[BangumiSearchItem])
async def search_bangumi(
    q: str = Query(min_length=1, max_length=100),
    _: dict = Depends(get_current_user),
):
    payload = {
        "keyword": q.strip(),
        "sort": "match",
        "filter": {"type": [2], "nsfw": False},
    }
    try:
        response = await _request_bangumi(
            "POST",
            "/v0/search/subjects?limit=20&offset=0",
            json_data=payload,
        )
        response.raise_for_status()
        data = response.json().get("data") or []
        return [_bangumi_item(item) for item in data if isinstance(item, dict)]
    except (httpx.HTTPError, ValueError, TypeError) as error:
        raise HTTPException(502, "Failed to search Bangumi") from error


@router.post("/import/{bangumi_id}", response_model=AcgItemOut)
async def import_bangumi_item(
    bangumi_id: int,
    personal: AcgImportRequest,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    existing = session.exec(
        select(AcgItem).where(AcgItem.bangumi_id == bangumi_id)
    ).first()
    if existing:
        raise HTTPException(409, "This Bangumi item is already in the collection")
    metadata = await _fetch_bangumi_subject(bangumi_id)
    values = metadata.model_dump()
    item = AcgItem(
        bangumi_id=values["bangumi_id"],
        name=values["name"],
        name_cn=values["name_cn"],
        cover_url=values["cover_url"],
        summary=values["summary"],
        air_date=values["air_date"],
        year=values["year"],
        total_episodes=values["total_episodes"],
        bangumi_score=values["score"],
        bangumi_rank=values["rank"],
        tags=json.dumps(values["tags"], ensure_ascii=False),
        source_url=values["source_url"],
        status=_validate_status(personal.status),
        progress=personal.progress,
        personal_score=personal.personal_score,
        review=personal.review,
        watched_at=personal.watched_at,
        favorite=personal.favorite,
        is_public=personal.is_public,
        sort=personal.sort,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item)


@router.post("", response_model=AcgItemOut)
def create_acg_item(
    data: AcgItemCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    if session.exec(select(AcgItem).where(AcgItem.bangumi_id == data.bangumi_id)).first():
        raise HTTPException(409, "This Bangumi item is already in the collection")
    values = data.model_dump()
    values["status"] = _validate_status(data.status)
    values["tags"] = json.dumps(data.tags, ensure_ascii=False)
    item = AcgItem(**values)
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item)


@router.put("/{item_id}", response_model=AcgItemOut)
def update_acg_item(
    item_id: int,
    data: AcgItemUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    item = session.get(AcgItem, item_id)
    if not item:
        raise HTTPException(404, "ACG item not found")
    updates = data.model_dump(exclude_unset=True, exclude_none=True)
    if "status" in updates:
        updates["status"] = _validate_status(str(updates["status"]))
    for key, value in updates.items():
        setattr(item, key, value)
    item.updated_at = datetime.now()
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item)


@router.post("/{item_id}/refresh", response_model=AcgItemOut)
async def refresh_acg_item(
    item_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    item = session.get(AcgItem, item_id)
    if not item:
        raise HTTPException(404, "ACG item not found")
    metadata = await _fetch_bangumi_subject(item.bangumi_id)
    item.name = metadata.name
    item.name_cn = metadata.name_cn
    item.cover_url = metadata.cover_url
    item.summary = metadata.summary
    item.air_date = metadata.air_date
    item.year = metadata.year
    item.total_episodes = metadata.total_episodes
    item.bangumi_score = metadata.score
    item.bangumi_rank = metadata.rank
    item.tags = json.dumps(metadata.tags, ensure_ascii=False)
    item.source_url = metadata.source_url
    item.updated_at = datetime.now()
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item)


@router.delete("/{item_id}")
def delete_acg_item(
    item_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    item = session.get(AcgItem, item_id)
    if not item:
        raise HTTPException(404, "ACG item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}
