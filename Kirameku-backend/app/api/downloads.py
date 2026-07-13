import re
import uuid
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from sqlmodel import Session, select

from app.config import MAX_DOWNLOAD_FILE_SIZE, UPLOAD_DIR
from app.deps import get_current_user, get_session
from app.models import DownloadFile
from app.schemas import DownloadFileCreate, DownloadFileOut, DownloadFileUpdate

router = APIRouter(prefix="/api/downloads", tags=["downloads"])

ALLOWED_SOURCE_TYPES = {"local", "cloudreve", "onedrive", "link"}
MUSIC_CATEGORIES = {"music", "音乐", "音樂"}
AUDIO_EXTENSIONS = {".mp3", ".flac", ".m4a", ".aac", ".ogg", ".oga", ".wav"}
DOWNLOAD_STORAGE_DIR = "downloads"
MUSIC_STORAGE_DIR = "music"
MUSIC_CATEGORIES = {"music", "\u97f3\u4e50", "\u97f3\u6a02"}


def _to_out(item: DownloadFile) -> DownloadFileOut:
    return DownloadFileOut(
        id=item.id,
        title=item.title,
        description=item.description,
        category=item.category,
        source_type=item.source_type,
        original_filename=item.original_filename,
        external_url=item.external_url,
        file_size=item.file_size,
        mime_type=item.mime_type,
        is_public=item.is_public,
        download_count=item.download_count,
        sort=item.sort,
        download_url=f"/api/downloads/{item.id}/download",
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _safe_extension(filename: str) -> str:
    suffix = Path(filename or "").suffix.lower()
    return suffix if re.fullmatch(r"\.[a-z0-9]{1,12}", suffix) else ".bin"


def _get_file(session: Session, file_id: int) -> DownloadFile:
    item = session.get(DownloadFile, file_id)
    if not item:
        raise HTTPException(404, "File not found")
    return item


def _is_http_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _is_music_file(item: DownloadFile) -> bool:
    category = (item.category or "").strip().lower()
    if category in MUSIC_CATEGORIES:
        return True
    if (item.storage_path or "").replace("\\", "/").startswith(f"{MUSIC_STORAGE_DIR}/"):
        return True
    if (item.mime_type or "").lower().startswith("audio/"):
        return True
    return Path(item.original_filename or item.storage_path or item.external_url).suffix.lower() in AUDIO_EXTENSIONS


def _is_music_upload(category: str, filename: str, mime_type: str) -> bool:
    if (category or "").strip().lower() in MUSIC_CATEGORIES:
        return True
    if (mime_type or "").lower().startswith("audio/"):
        return True
    return Path(filename or "").suffix.lower() in AUDIO_EXTENSIONS


@router.get("", response_model=list[DownloadFileOut])
def list_public_downloads(
    category: str | None = None,
    q: str | None = None,
    session: Session = Depends(get_session),
):
    stmt = select(DownloadFile).where(DownloadFile.is_public == True)  # noqa: E712
    if category:
        stmt = stmt.where(DownloadFile.category == category)
    items = session.exec(stmt).all()
    if not category:
        items = [item for item in items if not _is_music_file(item)]
    if q:
        keyword = q.strip().lower()
        items = [
            item
            for item in items
            if keyword in item.title.lower()
            or keyword in item.description.lower()
            or keyword in item.original_filename.lower()
        ]
    items.sort(key=lambda item: (item.sort, -item.created_at.timestamp()))
    return [_to_out(item) for item in items]


@router.get("/music", response_model=list[DownloadFileOut])
def list_music_downloads(session: Session = Depends(get_session)):
    items = session.exec(
        select(DownloadFile).where(DownloadFile.is_public == True)  # noqa: E712
    ).all()
    items = [item for item in items if _is_music_file(item)]
    items.sort(key=lambda item: (item.sort, -item.created_at.timestamp()))
    return [_to_out(item) for item in items]


@router.get("/admin", response_model=list[DownloadFileOut])
def list_admin_downloads(
    kind: str = "all",
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    items = session.exec(select(DownloadFile)).all()
    if kind == "files":
        items = [item for item in items if not _is_music_file(item)]
    elif kind == "music":
        items = [item for item in items if _is_music_file(item)]
    items.sort(key=lambda item: (item.sort, -item.created_at.timestamp()))
    return [_to_out(item) for item in items]


@router.post("", response_model=DownloadFileOut)
def create_external_download(
    data: DownloadFileCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    source_type = data.source_type.lower()
    if source_type not in ALLOWED_SOURCE_TYPES or source_type == "local":
        raise HTTPException(400, "source_type must be cloudreve, onedrive, or link")
    if not data.external_url:
        raise HTTPException(400, "external_url is required")
    if not _is_http_url(data.external_url):
        raise HTTPException(400, "external_url must be an http or https URL")

    item = DownloadFile(
        title=data.title,
        description=data.description,
        category=data.category,
        source_type=source_type,
        external_url=data.external_url,
        original_filename=data.original_filename,
        file_size=data.file_size,
        mime_type=data.mime_type,
        is_public=data.is_public,
        sort=data.sort,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item)


@router.post("/upload", response_model=DownloadFileOut)
async def upload_download_file(
    file: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
    category: str = Form(""),
    is_public: bool = Form(True),
    sort: int = Form(0),
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    original_filename = file.filename or "download.bin"
    ext = _safe_extension(original_filename)
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    storage_kind = (
        MUSIC_STORAGE_DIR
        if _is_music_upload(category, original_filename, file.content_type or "")
        else DOWNLOAD_STORAGE_DIR
    )
    storage_dir = UPLOAD_DIR / storage_kind
    storage_dir.mkdir(parents=True, exist_ok=True)
    target = storage_dir / stored_filename

    total = 0
    try:
        with target.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_DOWNLOAD_FILE_SIZE:
                    out.close()
                    target.unlink(missing_ok=True)
                    raise HTTPException(400, "File size exceeds the configured limit")
                out.write(chunk)
    finally:
        await file.close()

    item = DownloadFile(
        title=title.strip() or Path(original_filename).stem or original_filename,
        description=description,
        category=category,
        source_type="local",
        original_filename=original_filename,
        stored_filename=stored_filename,
        storage_path=f"{storage_kind}/{stored_filename}",
        file_size=total,
        mime_type=file.content_type or "",
        is_public=is_public,
        sort=sort,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item)


@router.put("/{file_id}", response_model=DownloadFileOut)
def update_download_file(
    file_id: int,
    data: DownloadFileUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    item = _get_file(session, file_id)
    updates = data.model_dump(exclude_unset=True)
    if "source_type" in updates:
        source_type = str(updates["source_type"]).lower()
        if source_type not in ALLOWED_SOURCE_TYPES:
            raise HTTPException(400, "Invalid source_type")
        updates["source_type"] = source_type
    if "external_url" in updates and updates["external_url"]:
        if not _is_http_url(str(updates["external_url"])):
            raise HTTPException(400, "external_url must be an http or https URL")
    for key, value in updates.items():
        setattr(item, key, value)
    item.updated_at = datetime.now()
    session.add(item)
    session.commit()
    session.refresh(item)
    return _to_out(item)


@router.delete("/{file_id}")
def delete_download_file(
    file_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_user),
):
    item = _get_file(session, file_id)
    if item.source_type == "local" and item.storage_path:
        target = UPLOAD_DIR / item.storage_path
        if target.exists() and target.is_file():
            target.unlink()
    session.delete(item)
    session.commit()
    return {"ok": True}


@router.get("/{file_id}/stream")
def stream_file(file_id: int, session: Session = Depends(get_session)):
    item = _get_file(session, file_id)
    if not item.is_public:
        raise HTTPException(404, "File not found")

    if item.source_type != "local":
        if not item.external_url:
            raise HTTPException(404, "Stream link not configured")
        return RedirectResponse(item.external_url, status_code=302)

    target = UPLOAD_DIR / item.storage_path
    if not target.exists() or not target.is_file():
        raise HTTPException(404, "Stored file not found")
    return FileResponse(
        path=str(target),
        media_type=item.mime_type or "application/octet-stream",
        headers={"Content-Disposition": "inline"},
    )


@router.get("/{file_id}/download")
def download_file(file_id: int, session: Session = Depends(get_session)):
    item = _get_file(session, file_id)
    if not item.is_public:
        raise HTTPException(404, "File not found")

    item.download_count += 1
    session.add(item)
    session.commit()

    if item.source_type != "local":
        if not item.external_url:
            raise HTTPException(404, "Download link not configured")
        return RedirectResponse(item.external_url, status_code=302)

    target = UPLOAD_DIR / item.storage_path
    if not target.exists() or not target.is_file():
        raise HTTPException(404, "Stored file not found")
    return FileResponse(
        path=str(target),
        filename=item.original_filename or target.name,
        media_type=item.mime_type or "application/octet-stream",
    )
