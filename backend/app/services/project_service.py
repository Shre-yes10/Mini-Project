from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from werkzeug.datastructures import FileStorage

from app.models.project import Project, ProjectLogFile, ProjectLogRepository, ProjectRepository
from app.parsers.log_parser import parse_log_text
import threading
from flask import current_app
from app.rag.ingest import ingest_project_logs



MAX_LOG_FILE_BYTES = 15 * 1024 * 1024


class InvalidProjectPayloadError(Exception):
    pass


class InvalidLogFileError(Exception):
    pass


class ProjectNotFoundError(Exception):
    pass


@dataclass
class ProjectListItem:
    project_id: str
    name: str
    created_at: str
    log_file_count: int = 0


def list_projects(user_id: str) -> list[ProjectListItem]:
    repo = ProjectRepository()
    log_repo = ProjectLogRepository()
    projects = repo.list_for_user(user_id)
    return [
        ProjectListItem(
            project_id=p.id,
            name=p.name,
            created_at=p.created_at.isoformat(),
            log_file_count=log_repo.count_files_for_project(
                user_id=user_id, project_id=p.id
            ),
        )
        for p in projects
    ]


def create_project_with_logs(
    *, user_id: str, name: str, files: list[FileStorage]
) -> str:
    clean_name = name.strip()
    if not clean_name:
        raise InvalidProjectPayloadError
    if not files:
        raise InvalidProjectPayloadError

    project_repo = ProjectRepository()
    log_repo = ProjectLogRepository()

    project = project_repo.create(user_id=user_id, name=clean_name)

    for file in files:
        _ensure_valid_log_file(file)
        text = _read_text_with_limit(file, MAX_LOG_FILE_BYTES)
        entries = parse_log_text(text)
        log_repo.add_file_logs(
            user_id=user_id,
            project_id=project.id,
            filename=file.filename or "unknown.log",
            entries=entries,
        )

    ingest_project_logs(user_id, project.id)

    return project.id


def get_project_logs(*, user_id: str, project_id: str) -> dict[str, Any]:
    project_repo = ProjectRepository()
    project = project_repo.find_for_user(user_id, project_id)
    if project is None:
        raise ProjectNotFoundError

    log_repo = ProjectLogRepository()
    files = log_repo.list_files_for_project(user_id=user_id, project_id=project_id)
    return {
        "project_id": project.id,
        "files": [_serialize_project_log_file(f) for f in files],
    }


def _serialize_project_log_file(file: ProjectLogFile) -> dict[str, Any]:
    return {
        "filename": file.filename,
        "created_at": file.created_at.isoformat(),
        "logs": file.entries,
    }


def _ensure_valid_log_file(file: FileStorage) -> None:
    filename = file.filename or ""
    if not filename.lower().endswith(".log"):
        raise InvalidLogFileError
    if file.content_length is not None and file.content_length > MAX_LOG_FILE_BYTES:
        raise InvalidLogFileError


def _read_text_with_limit(file: FileStorage, limit: int) -> str:
    data = file.stream.read(limit + 1)
    if data is None:
        raise InvalidLogFileError
    if len(data) > limit:
        raise InvalidLogFileError
    if isinstance(data, str):
        return data
    return data.decode("utf-8", errors="replace")

