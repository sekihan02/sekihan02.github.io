from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from .config import AppConfig

_CACHE_TTL_SECONDS = 300
_search_index_cache: dict[str, Any] = {"url": None, "loaded_at": 0.0, "data": None}
_related_cache: dict[str, Any] = {"url": None, "loaded_at": 0.0, "data": None}


@dataclass(slots=True)
class SearchHit:
    slug: str
    title: str
    url: str
    excerpt: str
    score: float


def normalize_text(value: str) -> str:
    compact = "".join(char.lower() for char in value if not char.isspace())
    return "".join(
        char for char in compact if char.isalnum() or "\u3040" <= char <= "\u30ff" or "\u4e00" <= char <= "\u9fff"
    )


def char_ngrams(value: str, size: int = 2) -> set[str]:
    normalized = normalize_text(value)
    if len(normalized) <= size:
        return {normalized} if normalized else set()
    return {normalized[index : index + size] for index in range(len(normalized) - size + 1)}


def overlap_score(query: str, text: str) -> float:
    query_grams = char_ngrams(query, 2) | char_ngrams(query, 3)
    text_grams = char_ngrams(text, 2) | char_ngrams(text, 3)
    if not query_grams or not text_grams:
        return 0.0

    overlap = len(query_grams & text_grams)
    containment = 0.15 if normalize_text(query) and normalize_text(query) in normalize_text(text) else 0.0
    return overlap / max(len(query_grams), 1) + containment


def combine_query(question: str, article_context: dict[str, Any] | None) -> str:
    if not article_context:
        return question

    tags = " ".join(article_context.get("tags", []))
    return " ".join(
        value
        for value in [
            question,
            article_context.get("title", ""),
            article_context.get("summary", ""),
            tags,
        ]
        if value
    )


def build_answer(question: str, hits: list[SearchHit], site_name: str) -> tuple[str, str]:
    if not hits:
        return (
            "関連する記述を見つけられませんでした。言い換えてもう一度試すか、近い記事を選んで質問してください。",
            "search_only",
        )

    lead = f"{site_name} 内の記事では、質問「{question}」に対して次の記述が見つかりました。"
    bullets = [f"- {hit.excerpt}" for hit in hits[:3]]
    return ("\n".join([lead, *bullets]), "answer")


def _fetch_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"user-agent": "MichikusaLogAgent/1.0"})
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def _load_json(url: str, cache_ref: dict[str, Any], empty_value: dict[str, Any]) -> dict[str, Any]:
    now = time.time()
    if (
        cache_ref["url"] == url
        and cache_ref["data"] is not None
        and now - float(cache_ref["loaded_at"]) < _CACHE_TTL_SECONDS
    ):
        return cache_ref["data"]

    try:
        data = _fetch_json(url)
    except (OSError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        data = empty_value

    cache_ref["url"] = url
    cache_ref["loaded_at"] = now
    cache_ref["data"] = data
    return data


def load_search_index(config: AppConfig) -> dict[str, Any]:
    return _load_json(config.fallback_index_url, _search_index_cache, {"articles": []})


def load_related_manifest(config: AppConfig) -> dict[str, Any]:
    base_url = config.site_data_base_url.rstrip("/")
    return _load_json(f"{base_url}/data/related.json", _related_cache, {"related": {}})


def choose_related(related_manifest: dict[str, Any], article_slug: str | None, hits: list[SearchHit]) -> list[dict[str, Any]]:
    related = related_manifest.get("related", {})
    if article_slug and article_slug in related:
        return related[article_slug][:3]

    for hit in hits:
        if hit.slug in related:
            return related[hit.slug][:3]

    return []


def pick_article_context(search_index: dict[str, Any], article_slug: str | None) -> dict[str, Any] | None:
    if not article_slug:
        return None

    for article in search_index.get("articles", []):
        if article.get("slug") == article_slug:
            return article
    return None


def rank_local_hits(search_index: dict[str, Any], query: str, article_slug: str | None) -> list[SearchHit]:
    results: list[SearchHit] = []

    for article in search_index.get("articles", []):
        for chunk in article.get("chunks", []):
            score = overlap_score(query, f"{article.get('title', '')} {chunk.get('heading', '')} {chunk.get('text', '')}")
            if article_slug and article.get("slug") == article_slug:
                score += 0.2

            if score <= 0:
                continue

            results.append(
                SearchHit(
                    slug=article.get("slug", ""),
                    title=article.get("title", ""),
                    url=article.get("url", ""),
                    excerpt=chunk.get("text", "")[:220],
                    score=score,
                )
            )

    deduped: dict[tuple[str, str], SearchHit] = {}
    for result in sorted(results, key=lambda item: item.score, reverse=True):
        key = (result.slug, result.excerpt)
        if key not in deduped:
            deduped[key] = result

    return list(deduped.values())[:3]

