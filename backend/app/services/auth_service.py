from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from flask import current_app

from app.models.user import User, UserRepository, UsernameAlreadyExistsError


class InvalidCredentialsError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


def normalize_username(raw: str) -> str:
    return raw.strip().lower()


def validate_password(password: str) -> None:
    if len(password) < 8:
        raise InvalidCredentialsError


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    value = bcrypt.hashpw(password.encode("utf-8"), salt)
    return value.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def register_user(username: str, password: str) -> tuple[User, str]:
    repo = UserRepository()
    normalized_username = normalize_username(username)
    validate_password(password)
    password_hash = hash_password(password)
    try:
        user = repo.create_user(normalized_username, password_hash)
    except UsernameAlreadyExistsError as error:
        raise InvalidCredentialsError from error
    token = generate_access_token(user)
    return user, token


def authenticate_user(username: str, password: str) -> tuple[User, str]:
    repo = UserRepository()
    normalized_username = normalize_username(username)
    user = repo.find_by_username(normalized_username)
    if user is None:
        raise InvalidCredentialsError
    password_hash = repo.get_password_hash(normalized_username)
    if password_hash is None or not verify_password(password, password_hash):
        raise InvalidCredentialsError
    token = generate_access_token(user)
    return user, token


def generate_access_token(user: User) -> str:
    secret = current_app.config["JWT_SECRET"]
    algorithm = current_app.config["JWT_ALGORITHM"]
    expires_days = current_app.config["JWT_ACCESS_TOKEN_EXPIRES_DAYS"]
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.id,
        "username": user.username,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=expires_days)).timestamp()),
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def decode_access_token(token: str) -> dict:
    secret = current_app.config["JWT_SECRET"]
    algorithm = current_app.config["JWT_ALGORITHM"]
    try:
        payload = jwt.decode(token, secret, algorithms=[algorithm])
    except jwt.PyJWTError as error:
        raise InvalidTokenError from error
    return payload

