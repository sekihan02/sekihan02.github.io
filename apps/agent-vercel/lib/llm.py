from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from typing import Any

from .config import AppConfig
from .search import SearchHit

_THINK_BLOCK_PATTERN = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)


def ollama_enabled(config: AppConfig) -> bool:
    return config.chat_backend == "ollama" and bool(config.ollama_model.strip())


def strip_think_blocks(text: str) -> str:
    cleaned = _THINK_BLOCK_PATTERN.sub("", text)
    return cleaned.strip()


def _system_prompt(site_name: str) -> str:
    return (
        f"あなたは {site_name} の記事案内アシスタントです。"
        "回答は必ず日本語で、提供された記事コンテキストだけを根拠にしてください。"
        "コンテキストにない事実は断定せず、『記事内では確認できません』と伝えてください。"
        "内部思考や推論過程は出力せず、2から4文で簡潔に答えてください。"
    )


def _short_excerpt(text: str, limit: int = 140) -> str:
    compact = " ".join(text.split())
    if len(compact) <= limit:
        return compact
    return f"{compact[: limit - 1].rstrip()}…"


def _user_prompt(question: str, hits: list[SearchHit], article_context: dict[str, Any] | None) -> str:
    article_scope = ""
    if article_context:
        article_scope = (
            "現在選択されている記事:\n"
            f"- タイトル: {article_context.get('title', '')}\n"
            f"- 要約: {article_context.get('summary', '')}\n"
            f"- タグ: {', '.join(article_context.get('tags', []))}\n\n"
        )

    context_lines = []
    for index, hit in enumerate(hits[:2], start=1):
        context_lines.append(
            "\n".join(
                [
                    f"[{index}] 記事タイトル: {hit.title}",
                    f"[{index}] 記事URL: {hit.url}",
                    f"[{index}] 抜粋: {_short_excerpt(hit.excerpt)}",
                ]
            )
        )

    return (
        "次の質問に、与えられた記事コンテキストだけを使って答えてください。\n"
        "箇条書きでも短い段落でも構いませんが、分かりやすさを優先してください。\n"
        "根拠が足りない場合は、そのことを明示してください。\n\n"
        f"質問:\n{question}\n\n"
        f"{article_scope}"
        "記事コンテキスト:\n"
        f"{chr(10).join(context_lines)}"
    )


def _chat_request_payload(question: str, hits: list[SearchHit], article_context: dict[str, Any] | None, config: AppConfig) -> dict[str, Any]:
    return {
        "model": config.ollama_model,
        "stream": False,
        "think": False,
        "keep_alive": config.ollama_keep_alive,
        "options": {
            "temperature": 0.2,
            "num_predict": 320,
        },
        "messages": [
            {
                "role": "system",
                "content": _system_prompt(config.site_name),
            },
            {
                "role": "user",
                "content": _user_prompt(question, hits, article_context),
            },
        ],
    }


def generate_grounded_answer(
    question: str,
    hits: list[SearchHit],
    article_context: dict[str, Any] | None,
    config: AppConfig,
) -> str | None:
    if not ollama_enabled(config) or not hits:
        return None

    payload = json.dumps(
        _chat_request_payload(question, hits, article_context, config),
        ensure_ascii=False,
    ).encode("utf-8")
    endpoint = f"{config.ollama_base_url.rstrip('/')}/api/chat"
    request = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"content-type": "application/json", "user-agent": "MichikusaLogAgent/1.0"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=config.ollama_timeout_seconds) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except (OSError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        return None

    message = raw.get("message", {})
    if not isinstance(message, dict):
        return None

    content = strip_think_blocks(str(message.get("content", "")).strip())
    return content or None
