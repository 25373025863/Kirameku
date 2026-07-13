import uuid
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image

from app.config import UPLOAD_DIR, UPLOAD_URL_PREFIX
from app.deps import get_current_user

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
}
MAX_SIZE = 10 * 1024 * 1024


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File size cannot exceed 10MB")

    orientation = "landscape"
    try:
        img = Image.open(BytesIO(content))
        width, height = img.size
        orientation = "landscape" if width >= height else "portrait"
    except Exception:
        pass

    ext = ALLOWED_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = UPLOAD_DIR / "images"
    upload_dir.mkdir(parents=True, exist_ok=True)

    target = upload_dir / filename
    target.write_bytes(content)

    relative_path = Path("images") / filename
    url = f"{UPLOAD_URL_PREFIX}/{relative_path.as_posix()}"
    return {"url": url, "orientation": orientation}
