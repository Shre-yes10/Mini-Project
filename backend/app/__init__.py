from flask import Flask
from flask_cors import CORS

from .config import load_config
from .database import init_db
from .routes.auth_routes import auth_bp
from .routes.project_routes import project_bp


def create_app() -> Flask:
    app = Flask(__name__)
    config = load_config()
    app.config.update(
        MONGODB_URI=config.mongodb_uri,
        MONGODB_DB=config.mongodb_db,
        JWT_SECRET=config.jwt_secret,
        JWT_ALGORITHM=config.jwt_algorithm,
        JWT_ACCESS_TOKEN_EXPIRES_DAYS=config.jwt_access_token_expires_days,
    )
    init_db(app)

    # Allow cross-origin requests from the frontend dev server.
    # In production, set CORS_ORIGINS env var to your actual domain(s).
    import os
    origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    CORS(
        app,
        resources={r"/api/*": {"origins": origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(project_bp, url_prefix="/api/project")
    return app

