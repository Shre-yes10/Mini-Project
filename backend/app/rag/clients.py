from typing import List, Sequence
import time

from huggingface_hub import InferenceClient
from openai import OpenAI


class HFAPIEmbeddings:
    def __init__(
        self,
        model_name: str,
        api_token: str | None,
        batch_size: int = 32,
        sleep_seconds: float = 0.5,
    ):
        self.client = InferenceClient(
            model=model_name,
            token=api_token,
        )
        self.model_name = model_name
        self.batch_size = batch_size
        self.sleep_seconds = sleep_seconds

    def embed_documents(self, texts: Sequence[str]) -> List[List[float]]:
        embeddings: List[List[float]] = []
        batch_num = 0
        total_chunks = len(texts)
        print(f"Total chunks to embed: {total_chunks}")
        
        for i in range(0, total_chunks, self.batch_size):
            batch = list(texts[i : i + self.batch_size])
            if not batch:
                continue
            batch_embeddings = self.client.feature_extraction(batch)
            if hasattr(batch_embeddings, "tolist"):
                batch_embeddings = batch_embeddings.tolist()
            embeddings.extend(batch_embeddings)
            batch_num += 1
            total_processed = len(embeddings)
            print(f"batch {batch_num} done --> {total_processed} chunks")
            time.sleep(self.sleep_seconds)
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        embedding = self.client.feature_extraction([text])[0]
        if hasattr(embedding, "tolist"):
            embedding = embedding.tolist()
        time.sleep(self.sleep_seconds)
        return embedding


class HFChatClient:
    def __init__(self, model_name: str, api_token: str | None):
        self.model_name = model_name
        self.client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=api_token,
        )

    def generate(self, prompt: str, max_new_tokens: int = 512) -> str:
        completion = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_new_tokens,
            temperature=0.3,
            top_p=0.9,
        )
        return getattr(completion.choices[0].message, "content", "") or ""

