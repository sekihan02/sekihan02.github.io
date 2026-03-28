from __future__ import annotations

import os
from dataclasses import dataclass


def _env_value(name: str, default: str = "") -> str:
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


@dataclass(slots=True)
class AppConfig:
    site_name: str
    allowed_origins: list[str]
    site_data_base_url: str
    fallback_index_url: str
    max_request_bytes: int
    max_question_chars: int


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
        max_request_bytes=_env_int("MAX_REQUEST_BYTES", 16_384),
        max_question_chars=_env_int("MAX_QUESTION_CHARS", 500),
    )

