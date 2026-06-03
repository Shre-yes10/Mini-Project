from typing import Any

from bson import ObjectId

from app.config import load_config
from app.database import get_db
from app.models.project import ProjectLogRepository
from app.services.alert_engine import AlertRuleEngine, ErrorCountRule, KeywordMatchRule
from app.rag.clients import HFAPIEmbeddings


def ingest_project_logs(user_id: str, project_id: str) -> None:
    db = get_db()
    collection = db["project_alert_embeddings"]
    alerts_collection = db["project_alerts"]
    existing = collection.count_documents(
        {"user_id": user_id, "project_id": project_id}, limit=1
    )
    if existing:
        return

    config = load_config()
    if not config.hf_embedding_model:
        return
    embeddings_client = HFAPIEmbeddings(
        model_name=config.hf_embedding_model,
        api_token=config.hf_token,
    )

    log_repo = ProjectLogRepository()
    files = log_repo.list_files_for_project(user_id=user_id, project_id=project_id)

    all_logs: list[dict[str, Any]] = []
    for file in files:
        for entry in file.entries:
            all_logs.append(entry)
            
    rules = [
        ErrorCountRule(time_window_minutes=1, threshold=1),
        KeywordMatchRule(keyword="status=404", time_window_minutes=1, threshold=1),
        KeywordMatchRule(keyword="Exception", time_window_minutes=2, threshold=1),
        KeywordMatchRule(keyword="Failed", time_window_minutes=1, threshold=1)
    ]
    engine = AlertRuleEngine(rules)
    alerts = engine.evaluate(all_logs)
    
    # Save raw alerts to database
    docs_to_save = []
    for alert in alerts:
        doc = alert.copy()
        doc["user_id"] = user_id
        doc["project_id"] = project_id
        doc["time_detected"] = alert["stats"].get("latest_timestamp")
        docs_to_save.append(doc)
    if docs_to_save:
        alerts_collection.insert_many(docs_to_save)

    texts: list[str] = []
    meta: list[dict[str, Any]] = []
    
    for alert in alerts:
        example_log = alert["logs"][-1].get("message", "") if alert["logs"] else "No recent log"
        text = f"[ALERT] {alert['name']} (Severity: {alert['severity']}) - Reason: {alert['reason']} - Triggered by {alert['stats']['count']} logs. Example log: {example_log}"
        texts.append(text)
        meta.append(
            {
                "user_id": user_id,
                "project_id": project_id,
                "alert_name": alert["name"],
                "severity": alert["severity"],
                "reason": alert["reason"],
                "text": text,
            }
        )

    if not texts:
        return

    vectors = embeddings_client.embed_documents(texts)
    documents: list[dict[str, Any]] = []
    for info, vector in zip(meta, vectors, strict=False):
        doc = dict(info)
        doc["embedding"] = vector
        documents.append(doc)

    if documents:
        collection.insert_many(documents)

