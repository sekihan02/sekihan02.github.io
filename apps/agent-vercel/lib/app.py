from __future__ import annotations

import ipaddress
import json
from typing import Any, Mapping
from urllib.parse import urlparse

from .config import AppConfig
from .search import (
    build_answer,
    choose_related,
    combine_query,
    load_related_manifest,
    load_search_index,
    pick_article_context,
    rank_local_hits,
)


def _is_local_dev_origin(origin: str) -> bool:
    parsed = urlparse(origin)
    hostname = parsed.hostname or ""
    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    if parsed.scheme != "http" or port != 3000:
        return False

    if hostname == "localhost":
        return True

    try:
        address = ipaddress.ip_address(hostname)
    except ValueError:
        return False

    return address.is_loopback or address.is_private


def _allows_local_dev(allowed_origins: list[str]) -> bool:
    return any(_is_local_dev_origin(origin) for origin in allowed_origins)


def origin_allowed(origin: str | None, allowed_origins: list[str]) -> bool:
    if not origin:
        return True
    if origin in allowed_origins:
        return True
    if _allows_local_dev(allowed_origins) and _is_local_dev_origin(origin):
        return True
    return False


def cors_headers(origin: str | None, allowed_origins: list[str]) -> dict[str, str]:
    headers = {
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
        "vary": "Origin",
    }

    if origin and origin_allowed(origin, allowed_origins):
        headers["access-control-allow-origin"] = origin

    return headers


def _error(status: int, message: str, origin: str | None, config: AppConfig) -> tuple[int, dict[str, Any], dict[str, str]]:
    return status, {"error": message}, cors_headers(origin, config.allowed_origins)


def _load_payload(body: bytes, config: AppConfig) -> dict[str, Any]:
    if len(body) > config.max_request_bytes:
        raise ValueError("Request body is too large.")

    try:
        payload = json.loads(body.decode("utf-8") or "{}")
    except json.JSONDecodeError as error:
        raise ValueError("Invalid JSON body.") from error

    if not isinstance(payload, dict):
        raise ValueError("Invalid JSON body.")

    return payload


def process_request(
    method: str,
    path: str,
    headers: Mapping[str, str],
    body: bytes,
    config: AppConfig,
) -> tuple[int, dict[str, Any] | None, dict[str, str]]:
    origin = headers.get("Origin")

    if method == "OPTIONS":
        if not origin_allowed(origin, config.allowed_origins):
            return _error(403, "Origin is not allowed.", origin, config)
        return 204, None, cors_headers(origin, config.allowed_origins)

    if not origin_allowed(origin, config.allowed_origins):
        return _error(403, "Origin is not allowed.", origin, config)

    if path == "/healthz":
        if method != "GET":
            return _error(405, "Method not allowed.", origin, config)
        return (
            200,
            {"ok": True, "site": config.site_name, "mode": "local_index"},
            cors_headers(origin, config.allowed_origins),
        )

    if method != "POST":
        return _error(405, "Method not allowed.", origin, config)

    try:
        payload = _load_payload(body, config)
    except ValueError as error:
        message = str(error)
        status = 413 if "too large" in message else 400
        return _error(status, message, origin, config)

    if path == "/v1/search":
        query = str(payload.get("query", "")).strip()
        article_slug = str(payload.get("articleSlug", "")).strip() or None

        if not query:
            return _error(400, "query is required.", origin, config)
        if len(query) > config.max_question_chars:
            return _error(400, "query is too long.", origin, config)

        search_index = load_search_index(config)
        article_context = pick_article_context(search_index, article_slug)
        expanded_query = combine_query(query, article_context)
        hits = rank_local_hits(search_index, expanded_query, article_slug)

        return (
            200,
            {
                "mode": "search",
                "results": [
                    {
                        "slug": hit.slug,
                        "title": hit.title,
                        "url": hit.url,
                        "excerpt": hit.excerpt,
                        "score": hit.score,
                    }
                    for hit in hits
                ],
            },
            cors_headers(origin, config.allowed_origins),
        )

    if path == "/v1/chat":
        question = str(payload.get("question", "")).strip()
        article_slug = str(payload.get("articleSlug", "")).strip() or None

        if not question:
            return _error(400, "question is required.", origin, config)
        if len(question) > config.max_question_chars:
            return _error(400, "question is too long.", origin, config)

        search_index = load_search_index(config)
        article_context = pick_article_context(search_index, article_slug)
        expanded_query = combine_query(question, article_context)
        hits = rank_local_hits(search_index, expanded_query, article_slug)
        related_manifest = load_related_manifest(config)

        if hits:
            answer, mode = build_answer(question, hits, config.site_name)
        else:
            answer, mode = (
                "サイト内の記事だけでは十分な根拠を見つけられませんでした。別の言い方で試すか、近い記事を選んで質問してください。",
                "search_only",
            )

        return (
            200,
            {
                "mode": mode,
                "answer": answer,
                "citations": [
                    {
                        "slug": hit.slug,
                        "title": hit.title,
                        "url": hit.url,
                        "excerpt": hit.excerpt,
                    }
                    for hit in hits
                ],
                "related": [
                    {
                        "slug": item.get("slug"),
                        "title": item.get("title"),
                        "url": item.get("url"),
                    }
                    for item in choose_related(related_manifest, article_slug, hits)
                ],
            },
            cors_headers(origin, config.allowed_origins),
        )

    return _error(404, "Not found.", origin, config)

