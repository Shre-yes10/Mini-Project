from http import HTTPStatus
from typing import Any

from flask import Blueprint, g, request

from app.services.project_service import (
    InvalidLogFileError,
    InvalidProjectPayloadError,
    ProjectNotFoundError,
    create_project_with_logs,
    get_project_logs,
    list_projects,
)
from app.utils import error_response, json_response, require_auth
from app.database import get_db
from bson import ObjectId
from app.rag.chat import chat_with_project
from app.services.alert_engine import AlertRuleEngine, ErrorCountRule, KeywordMatchRule
import traceback


project_bp = Blueprint("project", __name__)


@project_bp.get("")
@require_auth
def get_projects() -> Any:
    user = getattr(g, "current_user", None)
    user_id = user.get("id") if isinstance(user, dict) else None
    if not isinstance(user_id, str) or not user_id:
        return error_response("Unauthorized", HTTPStatus.UNAUTHORIZED)
    projects = list_projects(user_id)
    return json_response({"projects": [p.__dict__ for p in projects]})


@project_bp.post("")
@require_auth
def create_project() -> Any:
    user = getattr(g, "current_user", None)
    user_id = user.get("id") if isinstance(user, dict) else None
    if not isinstance(user_id, str) or not user_id:
        return error_response("Unauthorized", HTTPStatus.UNAUTHORIZED)

    name = request.form.get("name", "")
    files = request.files.getlist("files")
    try:
        project_id = create_project_with_logs(user_id=user_id, name=name, files=files)
    except InvalidProjectPayloadError:
        return error_response("Invalid payload", HTTPStatus.BAD_REQUEST)
    except InvalidLogFileError:
        return error_response("Invalid log file", HTTPStatus.BAD_REQUEST)
    return json_response({"project_id": project_id, "embedding_started": True}, HTTPStatus.CREATED)


@project_bp.get("/<project_id>/logs")
@require_auth
def project_logs(project_id: str) -> Any:
    user = getattr(g, "current_user", None)
    user_id = user.get("id") if isinstance(user, dict) else None
    if not isinstance(user_id, str) or not user_id:
        return error_response("Unauthorized", HTTPStatus.UNAUTHORIZED)
    try:
        data = get_project_logs(user_id=user_id, project_id=project_id)
    except ProjectNotFoundError:
        return error_response("Project not found", HTTPStatus.NOT_FOUND)
    return json_response(data)


@project_bp.post("/<project_id>/chat")
@require_auth
def chat_project(project_id: str) -> Any:
    user = getattr(g, "current_user", None)
    user_id = user.get("id") if isinstance(user, dict) else None
    if not isinstance(user_id, str) or not user_id:
        return error_response("Unauthorized", HTTPStatus.UNAUTHORIZED)

    data = request.get_json() or {}
    messages = data.get("messages", [])
    if not isinstance(messages, list):
        return error_response("Invalid messages format", HTTPStatus.BAD_REQUEST)

    try:
        response_text, retrieved_docs = chat_with_project(
            project_id=project_id,
            user_id=user_id,
            messages=messages
        )
        return json_response({"response": response_text, "context": retrieved_docs})
    except ValueError as e:
        return error_response(str(e), HTTPStatus.BAD_REQUEST)
    except ProjectNotFoundError:
        return error_response("Project not found", HTTPStatus.NOT_FOUND)
    except Exception as e:
        traceback.print_exc()
        err_msg = str(e) or repr(e)
        return error_response(err_msg, HTTPStatus.INTERNAL_SERVER_ERROR)

@project_bp.get("/<project_id>/alerts")
@require_auth
def project_alerts(project_id: str) -> Any:
    user = getattr(g, "current_user", None)
    user_id = user.get("id") if isinstance(user, dict) else None
    if not isinstance(user_id, str) or not user_id:
        return error_response("Unauthorized", HTTPStatus.UNAUTHORIZED)
    
    try:
        db = get_db()
        alerts_collection = db["project_alerts"]
        
        # Natively fetch pre-calculated alerts from the dedicated database collection
        cursor = alerts_collection.find({
            "user_id": user_id,
            "project_id": project_id
        })
        
        # Clean up Mongo ObjectIds before JSON serialization
        alerts = []
        for alert in cursor:
            alert.pop("_id", None)
            alert["project_id"] = str(alert["project_id"])
            alerts.append(alert)
        
        return json_response({"alerts": alerts})
        
    except Exception as e:
        traceback.print_exc()
        err_msg = str(e) or repr(e)
        return error_response(err_msg, HTTPStatus.INTERNAL_SERVER_ERROR)

