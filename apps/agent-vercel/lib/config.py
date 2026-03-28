from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

_AGENT_ROOT = Path(__file__).resolve().parents[1]
_REPO_ROOT = _AGENT_ROOT.parents[1]
_ENV_FILENAMES = (".env", ".env.local")
_ENV_LOADED = False


def _load_local_env() -> None:
    global _ENV_LOADED
    if _ENV_LOADED:
        return

    merged: dict[str, str] = {}
    for filename in _ENV_FILENAMES:
        env_path = _AGENT_ROOT / filename
        if not env_path.is_file():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            name, value = line.split("=", 1)
            parsed = value.strip()
            if len(parsed) >= 2 and parsed[0] == parsed[-1] and parsed[0] in {"'", '"'}:
                parsed = parsed[1:-1]
            merged[name.strip()] = parsed

    for name, value in merged.items():
        os.environ.setdefault(name, value)

    _ENV_LOADED = True


def _env_value(name: str, default: str = "") -> str:
    _load_local_env()
    value = os.getenv(name, default)
    return str(value).strip()


def _env_int(name: str, default: int) -> int:
    value = _env_value(name, str(default))
    try:
        return int(value)
    except ValueError:
        return default


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _generated_path(filename: str) -> str:
    return str(_REPO_ROOT / "content" / "generated" / filename)


@dataclass(slots=True)
class AppConfig:
    site_name: str
    allowed_origins: list[str]
    site_data_base_url: str
    fallback_index_url: str
    local_search_index_path: str
    local_related_manifest_path: str
    max_request_bytes: int
    max_question_chars: int
    chat_backend: str
    ollama_base_url: str
    ollama_model: str
    ollama_timeout_seconds: int
    ollama_keep_alive: str


def load_config() -> AppConfig:
    return AppConfig(
        site_name=_env_value("SITE_NAME", "道草ログ"),
        allowed_origins=_split_csv(
            _env_value("ALLOWED_ORIGINS", "http://127.0.0.1:3000,https://sekihan02.github.io")
        ),
        site_data_base_url=_env_value("SITE_DATA_BASE_URL", "https://sekihan02.github.io"),
        fallback_index_url=_env_value(
            "FALLBACK_INDEX_URL",
            "https://sekihan02.github.io/data/search-index.json",
        ),
        local_search_index_path=_env_value("LOCAL_SEARCH_INDEX_PATH", _generated_path("search-index.json")),
        local_related_manifest_path=_env_value(
            "LOCAL_RELATED_MANIFEST_PATH",
            _generated_path("related-manifest.json"),
        ),
        max_request_bytes=_env_int("MAX_REQUEST_BYTES", 16_384),
        max_question_chars=_env_int("MAX_QUESTION_CHARS", 500),
        chat_backend=_env_value("CHAT_BACKEND", "search_only").lower(),
        ollama_base_url=_env_value("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
        ollama_model=_env_value("OLLAMA_MODEL", "qwen3:4b"),
        ollama_timeout_seconds=_env_int("OLLAMA_TIMEOUT_SECONDS", 120),
        ollama_keep_alive=_env_value("OLLAMA_KEEP_ALIVE", "10m"),
    )
