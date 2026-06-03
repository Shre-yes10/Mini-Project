from typing import Any

from flask import Flask, current_app, g
from pymongo import MongoClient


def get_client() -> MongoClient:
    client = getattr(g, "_mongo_client", None)
    if client is None:
        uri = current_app.config["MONGODB_URI"]
        client = MongoClient(uri)
        g._mongo_client = client
    return client


def get_db() -> Any:
    client = get_client()
    name = current_app.config["MONGODB_DB"]
    return client[name]


def init_db(app: Flask) -> None:
    @app.teardown_appcontext
    def close_db(_: Any) -> None:
        client = getattr(g, "_mongo_client", None)
        if client is not None:
            client.close()

