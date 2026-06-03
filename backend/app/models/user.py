from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.database import get_db


@dataclass
class User:
    id: str
    username: str
    created_at: datetime


class UserRepository:
    def __init__(self) -> None:
        self._collection = get_db()["users"]
        self._ensure_indexes()

    def _ensure_indexes(self) -> None:
        self._collection.create_index("username", unique=True)

    def find_by_username(self, username: str) -> Optional[User]:
        doc = self._collection.find_one({"username": username})
        if doc is None:
            return None
        return self._to_user(doc)

    def find_by_id(self, user_id: str) -> Optional[User]:
        doc = self._collection.find_one({"_id": ObjectId(user_id)})
        if doc is None:
            return None
        return self._to_user(doc)

    def create_user(self, username: str, password_hash: str) -> User:
        now = datetime.now(timezone.utc)
        try:
            result = self._collection.insert_one(
                {
                    "username": username,
                    "password_hash": password_hash,
                    "created_at": now,
                }
            )
        except DuplicateKeyError as error:
            raise UsernameAlreadyExistsError from error
        doc = self._collection.find_one({"_id": result.inserted_id})
        if doc is None:
            raise UserCreationError
        return self._to_user(doc)

    def get_password_hash(self, username: str) -> Optional[str]:
        doc: Optional[dict[str, Any]] = self._collection.find_one(
            {"username": username}, {"password_hash": 1}
        )
        if doc is None:
            return None
        value = doc.get("password_hash")
        if not isinstance(value, str):
            return None
        return value

    def _to_user(self, doc: dict[str, Any]) -> User:
        return User(
            id=str(doc["_id"]),
            username=doc["username"],
            created_at=doc["created_at"],
        )


class UsernameAlreadyExistsError(Exception):
    pass


class UserCreationError(Exception):
    pass

