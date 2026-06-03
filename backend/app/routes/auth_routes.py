from http import HTTPStatus
from typing import Any

from flask import Blueprint, Request, g, request

from app.services.auth_service import InvalidCredentialsError, authenticate_user, register_user
from app.utils import error_response, json_response, require_auth


auth_bp = Blueprint("auth", __name__)


def _get_json_body(req: Request) -> dict[str, Any]:
    body = req.get_json(silent=True)
    if not isinstance(body, dict):
        return {}
    return body


@auth_bp.post("/register")
def register() -> Any:
    body = _get_json_body(request)
    username = body.get("username")
    password = body.get("password")
    if not isinstance(username, str) or not isinstance(password, str):
        return error_response("Invalid payload", HTTPStatus.BAD_REQUEST)
    try:
        user, token = register_user(username, password)
    except InvalidCredentialsError:
        return error_response("Invalid username or password", HTTPStatus.BAD_REQUEST)
    data = {
        "user": {
            "id": user.id,
            "username": user.username,
        },
        "access_token": token,
        "token_type": "bearer",
    }
    return json_response(data, HTTPStatus.CREATED)


@auth_bp.post("/login")
def login() -> Any:
    body = _get_json_body(request)
    username = body.get("username")
    password = body.get("password")
    if not isinstance(username, str) or not isinstance(password, str):
        return error_response("Invalid payload", HTTPStatus.BAD_REQUEST)
    try:
        user, token = authenticate_user(username, password)
    except InvalidCredentialsError:
        return error_response("Invalid credentials", HTTPStatus.UNAUTHORIZED)
    data = {
        "user": {
            "id": user.id,
            "username": user.username,
        },
        "access_token": token,
        "token_type": "bearer",
    }
    return json_response(data)


@auth_bp.get("/me")
@require_auth
def me() -> Any:
    current_user = getattr(g, "current_user", None)
    if not isinstance(current_user, dict):
        return error_response("Unauthorized", HTTPStatus.UNAUTHORIZED)
    return json_response({"user": current_user})

