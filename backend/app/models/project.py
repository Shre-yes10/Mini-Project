from dataclasses import dataclass
from datetime import datetime, timezone
import uuid
from typing import Any, Optional

from app.database import get_db


@dataclass
class Project:
    id: str
    user_id: str
    name: str
    created_at: datetime


class ProjectRepository:
    def __init__(self) -> None:
        self._collection = get_db()["projects"]
        self._ensure_indexes()

    def _ensure_indexes(self) -> None:
        self._collection.create_index([("user_id", 1), ("created_at", -1)])

    def create(self, user_id: str, name: str) -> Project:
        now = datetime.now(timezone.utc)
        project_id = str(uuid.uuid4())
        self._collection.insert_one(
            {"_id": project_id, "user_id": user_id, "name": name, "created_at": now}
        )
        doc = self._collection.find_one({"_id": project_id})
        if doc is None:
            raise ProjectCreationError
        return self._to_project(doc)

    def list_for_user(self, user_id: str) -> list[Project]:
        cursor = self._collection.find({"user_id": user_id}).sort("created_at", -1)
        return [self._to_project(doc) for doc in cursor]

    def find_for_user(self, user_id: str, project_id: str) -> Optional[Project]:
        doc = self._collection.find_one({"_id": project_id, "user_id": user_id})
        if doc is None:
            return None
        return self._to_project(doc)

    def _to_project(self, doc: dict[str, Any]) -> Project:
        return Project(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            name=doc["name"],
            created_at=doc["created_at"],
        )


@dataclass
class ProjectLogFile:
    id: str
    project_id: str
    user_id: str
    filename: str
    created_at: datetime
    entries: list[dict[str, Any]]


class ProjectLogRepository:
    def __init__(self) -> None:
        self._collection = get_db()["project_logs"]
        self._ensure_indexes()

    def _ensure_indexes(self) -> None:
        self._collection.create_index([("user_id", 1), ("project_id", 1)])
        self._collection.create_index([("project_id", 1), ("created_at", -1)])
        # Unique per file per project — re-uploading same filename replaces existing
        self._collection.create_index(
            [("user_id", 1), ("project_id", 1), ("filename", 1)],
            unique=True,
        )

    def add_file_logs(
        self,
        *,
        user_id: str,
        project_id: str,
        filename: str,
        entries: list[dict[str, Any]],
    ) -> ProjectLogFile:
        now = datetime.now(timezone.utc)
        # Upsert: replace existing doc for same user+project+filename, or insert new
        self._collection.replace_one(
            {"user_id": user_id, "project_id": project_id, "filename": filename},
            {
                "user_id": user_id,
                "project_id": project_id,
                "filename": filename,
                "created_at": now,
                "entries": entries,
            },
            upsert=True,
        )
        doc = self._collection.find_one(
            {"user_id": user_id, "project_id": project_id, "filename": filename}
        )
        if doc is None:
            raise ProjectLogCreationError
        return self._to_project_log(doc)

    def count_files_for_project(self, *, user_id: str, project_id: str) -> int:
        return self._collection.count_documents(
            {"user_id": user_id, "project_id": project_id}
        )

    def list_files_for_project(
        self, *, user_id: str, project_id: str
    ) -> list[ProjectLogFile]:
        cursor = (
            self._collection.find({"user_id": user_id, "project_id": project_id})
            .sort("created_at", -1)
        )
        return [self._to_project_log(doc) for doc in cursor]

    def _to_project_log(self, doc: dict[str, Any]) -> ProjectLogFile:
        return ProjectLogFile(
            id=str(doc["_id"]),
            project_id=str(doc["project_id"]),
            user_id=doc["user_id"],
            filename=doc["filename"],
            created_at=doc["created_at"],
            entries=list(doc.get("entries") or []),
        )


class ProjectCreationError(Exception):
    pass


class ProjectLogCreationError(Exception):
    pass

