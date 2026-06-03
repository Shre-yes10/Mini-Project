from typing import Any

from bson import ObjectId

from app.config import load_config
from app.database import get_db
from app.rag.clients import HFAPIEmbeddings, HFChatClient


def chat_with_project(project_id: str, user_id: str, messages: list[dict[str, Any]]) -> tuple[str, list[dict[str, Any]]]:
    if not messages:
        raise ValueError("messages array is empty")

    last_user_message = next(
        (m for m in reversed(messages) if m.get("role") == "user"), None
    )
    if not last_user_message:
        raise ValueError("No user message found in the chat history")

    query = last_user_message.get("content", "").strip()
    if not query:
        raise ValueError("User message content is empty")

    # project_id is now a UUID string

    config = load_config()
    if not config.hf_embedding_model or not config.hf_chat_model:
        raise RuntimeError("HF models not configured")

    embeddings_client = HFAPIEmbeddings(
        model_name=config.hf_embedding_model,
        api_token=config.hf_token,
    )
    
    query_vector = embeddings_client.embed_query(query)

    db = get_db()
    collection = db["project_alert_embeddings"]

    pipeline = [
        {
            "$vectorSearch": {
                "index": "project_alert_embeddings_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100,
                "limit": 3,
                "filter": {
                    "$and": [
                        {"user_id": user_id},
                        {"project_id": project_id}
                    ]
                }
            }
        },
        {
            "$project": {
                "text": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]

    results = list(collection.aggregate(pipeline))
    context_lines = [doc.get("text", "") for doc in results if doc.get("text")]
    context_block = "\n".join(context_lines)
    
    print(f"RAG Debug - Query: {query}")
    print(f"RAG Debug - Found {len(results)} matches for project {project_id}.")
    print(f"RAG Debug - Context length: {len(context_block)} chars")


    system_instruction = (
        "You are an AI assistant helping a user analyze their application anomalies. "
        "Use the provided context containing relevant parsed system ALERTS to answer the user's question. "
        "If the user is just greeting you or engaging in casual conversation, reply normally and politely. "
        "Always provide your answer in Markdown format. Be concise and precise."
    )

    prompt_parts: list[str] = []
    prompt_parts.append(f"System: {system_instruction}\n")

    if context_block:
        prompt_parts.append(f"Context (Retrieved Logs):\n{context_block}\n")

    prompt_parts.append("Conversation history:")
    for i in range(len(messages) - 1):
        msg = messages[i]
        role = str(msg.get("role", "user")).capitalize()
        content = str(msg.get("content", ""))
        prompt_parts.append(f"{role}: {content}")

    prompt_parts.append(f"User Question: {query}")
    prompt_parts.append("Assistant:")

    full_prompt = "\n".join(prompt_parts)

    chat_client = HFChatClient(
        model_name=config.hf_chat_model,
        api_token=config.hf_token,
    )

    response_text = chat_client.generate(full_prompt, max_new_tokens=1024)
    retrieved_docs = [{"text": doc.get("text", ""), "score": doc.get("score", 0)} for doc in results if doc.get("text")]
    return response_text, retrieved_docs
