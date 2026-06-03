from typing import Any, Callable, TypeVar
from functools import wraps

from flask import Response, jsonify, request, g

from app.services.auth_service import InvalidTokenError, decode_access_token


def json_response(data: dict[str, Any], status: int = 200) -> Response:
    return jsonify(data), status


def error_response(message: str, status: int) -> Response:
    return json_response({"error": message}, status)


F = TypeVar("F", bound=Callable[..., Any])


def require_auth(func: F) -> F:
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        header = request.headers.get("Authorization")
        if not header or not header.startswith("Bearer "):
            return error_response("Missing or invalid Authorization header", 401)
        token = header.removeprefix("Bearer ").strip()
        try:
            payload = decode_access_token(token)
        except InvalidTokenError:
            return error_response("Invalid or expired token", 401)
        g.current_user = {
            "id": payload.get("sub"),
            "username": payload.get("username"),
        }
        return func(*args, **kwargs)

    return wrapper  # type: ignore[return-value]

