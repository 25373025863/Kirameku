import json
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote, urlparse

import httpx
from sqlmodel import Session, select
from fastapi import HTTPException

from app.config import GITHUB_TOKEN, GITEE_ACCESS_TOKEN
from app.models import Project
from app.schemas import ProjectCreate, ProjectUpdate


def _request_json(url: str, headers: dict[str, str] | None = None) -> dict:
    try:
        response = httpx.get(
            url,
            headers=headers,
            timeout=15,
            follow_redirects=True,
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="无法连接项目托管平台") from exc

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="没有找到该项目")
    if response.status_code == 403:
        raise HTTPException(status_code=502, detail="项目平台请求受限，请稍后重试")
    if response.is_error:
        raise HTTPException(
            status_code=502,
            detail=f"读取项目信息失败（{response.status_code}）",
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="项目平台返回了无效数据") from exc
    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail="项目平台返回了无效数据")
    return data


def _optional_json(url: str, headers: dict[str, str]) -> dict:
    try:
        return _request_json(url, headers)
    except HTTPException:
        return {}


def _repository_parts(source_url: str) -> tuple[str, str, str]:
    normalized = source_url.strip()
    if not normalized:
        raise HTTPException(status_code=422, detail="请输入项目地址")
    if "://" not in normalized:
        normalized = f"https://{normalized}"

    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(status_code=422, detail="项目地址格式不正确")

    host = parsed.netloc.lower().split(":", 1)[0]
    if host.startswith("www."):
        host = host[4:]
    if host not in {"github.com", "gitee.com"}:
        raise HTTPException(status_code=422, detail="目前支持 GitHub 和 Gitee 项目")

    segments = [segment for segment in parsed.path.split("/") if segment]
    if len(segments) < 2:
        raise HTTPException(status_code=422, detail="请输入完整的项目仓库地址")
    owner = segments[0]
    repo = segments[1].removesuffix(".git")
    if not owner or not repo:
        raise HTTPException(status_code=422, detail="请输入完整的项目仓库地址")
    return host, owner, repo


def _project_slug(owner: str, repo: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", f"{owner}-{repo}".lower()).strip("-")
    return slug[:100] or "favorite-project"


def _tech_stack(repository: dict, languages: dict) -> list[str]:
    language_names = [
        name
        for name, _ in sorted(
            languages.items(),
            key=lambda item: item[1] if isinstance(item[1], int) else 0,
            reverse=True,
        )
    ]
    primary_language = repository.get("language") or repository.get(
        "programming_language"
    )
    topics = repository.get("topics") or []
    candidates = [primary_language, *language_names, *topics]

    result: list[str] = []
    for value in candidates:
        if not isinstance(value, str) or not value.strip():
            continue
        normalized = value.strip()
        if normalized.lower() in {item.lower() for item in result}:
            continue
        result.append(normalized)
        if len(result) == 8:
            break
    return result


def fetch_project_metadata(source_url: str) -> dict:
    host, owner, repo = _repository_parts(source_url)
    encoded_owner = quote(owner, safe="")
    encoded_repo = quote(repo, safe="")

    if host == "github.com":
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "Kirameku-Project-Importer",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
        api_base = f"https://api.github.com/repos/{encoded_owner}/{encoded_repo}"
        with ThreadPoolExecutor(max_workers=2) as executor:
            repository_future = executor.submit(_request_json, api_base, headers)
            languages_future = executor.submit(
                _optional_json, f"{api_base}/languages", headers
            )
            repository = repository_future.result()
            languages = languages_future.result()
        canonical_url = repository.get("html_url") or (
            f"https://github.com/{owner}/{repo}"
        )
        cover_image = (
            f"https://opengraph.githubassets.com/1/{encoded_owner}/{encoded_repo}"
        )
        link_github = canonical_url
        link_gitee = ""
    else:
        headers = {"User-Agent": "Kirameku-Project-Importer"}
        token_query = f"?access_token={quote(GITEE_ACCESS_TOKEN)}" if GITEE_ACCESS_TOKEN else ""
        api_base = f"https://gitee.com/api/v5/repos/{encoded_owner}/{encoded_repo}"
        with ThreadPoolExecutor(max_workers=2) as executor:
            repository_future = executor.submit(
                _request_json, f"{api_base}{token_query}", headers
            )
            languages_future = executor.submit(
                _optional_json, f"{api_base}/languages{token_query}", headers
            )
            repository = repository_future.result()
            languages = languages_future.result()
        canonical_url = repository.get("html_url") or f"https://gitee.com/{owner}/{repo}"
        cover_image = ""
        link_github = ""
        link_gitee = canonical_url

    description = (repository.get("description") or "").strip()
    homepage = (repository.get("homepage") or "").strip()
    return {
        "name": repository.get("name") or repo,
        "slug": _project_slug(owner, repo),
        "description": description,
        "long_description": description,
        "cover_image": cover_image,
        "tech_stack": _tech_stack(repository, languages),
        "link_github": link_github,
        "link_gitee": link_gitee,
        "link_live": homepage,
        "link_docs": "",
    }


def _to_dict(p: Project) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "description": p.description,
        "long_description": p.long_description,
        "cover_image": p.cover_image,
        "tech_stack": json.loads(p.tech_stack) if p.tech_stack else [],
        "link_github": p.link_github,
        "link_gitee": p.link_gitee,
        "link_live": p.link_live,
        "link_docs": p.link_docs,
        "project_type": p.project_type,
        "status": p.status,
        "status_label": p.status_label,
        "is_featured": p.is_featured,
        "sort": p.sort,
        "created_at": p.created_at,
    }


def get_projects(session: Session, project_type: str | None = None) -> list[dict]:
    query = select(Project)
    if project_type:
        query = query.where(Project.project_type == project_type)
    rows = list(session.exec(query.order_by(Project.sort)).all())
    return [_to_dict(p) for p in rows]


def get_project_by_slug(session: Session, slug: str) -> dict:
    p = session.exec(select(Project).where(Project.slug == slug)).first()
    if not p:
        raise HTTPException(status_code=404, detail="项目不存在")
    return _to_dict(p)


def create_project(session: Session, data: ProjectCreate) -> dict:
    d = data.model_dump()
    d["tech_stack"] = json.dumps(d["tech_stack"], ensure_ascii=False)
    p = Project(**d)
    session.add(p)
    session.commit()
    session.refresh(p)
    return _to_dict(p)


def update_project(session: Session, project_id: int, data: ProjectUpdate) -> dict:
    p = session.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="项目不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == "tech_stack" and v is not None:
            v = json.dumps(v, ensure_ascii=False)
        setattr(p, k, v)
    session.add(p)
    session.commit()
    session.refresh(p)
    return _to_dict(p)


def delete_project(session: Session, project_id: int):
    p = session.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="项目不存在")
    session.delete(p)
    session.commit()
