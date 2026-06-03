import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass
class Config:
    mongodb_uri: str
    mongodb_db: str
    jwt_secret: str
    jwt_algorithm: str
    jwt_access_token_expires_days: int
    hf_token: str | None
    hf_embedding_model: str
    hf_chat_model: str


def load_config() -> Config:
    load_dotenv()
    mongodb_uri = os.environ["MONGODB_URI"]
    mongodb_db = os.environ["MONGODB_DB"]
    jwt_secret = os.environ["JWT_SECRET"]
    jwt_algorithm = "HS256"
    jwt_access_token_expires_days = 14
    hf_token = os.environ.get("HF_TOKEN")
    hf_embedding_model = os.environ.get("HF_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    hf_chat_model = os.environ.get("HF_CHAT_MODEL", "google/gemma-3-27b-it:featherless-ai")
    return Config(
        mongodb_uri=mongodb_uri,
        mongodb_db=mongodb_db,
        jwt_secret=jwt_secret,
        jwt_algorithm=jwt_algorithm,
        jwt_access_token_expires_days=jwt_access_token_expires_days,
        hf_token=hf_token,
        hf_embedding_model=hf_embedding_model,
        hf_chat_model=hf_chat_model,
    )

