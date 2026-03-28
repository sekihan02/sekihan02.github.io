from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

AGENT_ROOT = Path(__file__).resolve().parents[2] / "apps" / "agent-vercel"
if str(AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(AGENT_ROOT))

from lib.app import process_request  # noqa: E402
from lib.config import AppConfig  # noqa: E402


def make_config() -> AppConfig:
    return AppConfig(
        site_name="道草ログ",
        allowed_origins=["https://sekihan02.github.io", "http://127.0.0.1:3000"],
        site_data_base_url="https://sekihan02.github.io",
        fallback_index_url="https://sekihan02.github.io/data/search-index.json",
        max_request_bytes=16_384,
        max_question_chars=500,
    )


def make_index() -> dict:
    return {
        "articles": [
            {
                "slug": "zip-guide",
                "title": "ZIP の仕組み",
                "summary": "ZIP を学ぶ記事",
                "url": "/articles/zip-guide/",
                "tags": ["ZIP", "Deflate"],
                "chunks": [
                    {
                        "id": "zip-guide-1",
                        "heading": "本文",
                        "text": "ZIP は複数ファイルをまとめるアーカイブ形式です。",
                    }
                ],
            }
        ]
    }


class AgentAppTests(unittest.TestCase):
    def test_healthz_returns_local_index_mode(self):
        status, payload, headers = process_request("GET", "/healthz", {"Origin": "https://sekihan02.github.io"}, b"", make_config())
        self.assertEqual(status, 200)
        self.assertEqual(payload["mode"], "local_index")
        self.assertEqual(headers["access-control-allow-origin"], "https://sekihan02.github.io")

    def test_search_requires_query(self):
        status, payload, _ = process_request(
            "POST",
            "/v1/search",
            {"Origin": "https://sekihan02.github.io"},
            json.dumps({}).encode("utf-8"),
            make_config(),
        )
        self.assertEqual(status, 400)
        self.assertEqual(payload["error"], "query is required.")

    def test_chat_returns_citations_from_local_index(self):
        with (
            patch("lib.app.load_search_index", return_value=make_index()),
            patch("lib.app.load_related_manifest", return_value={"related": {}}),
        ):
            status, payload, _ = process_request(
                "POST",
                "/v1/chat",
                {"Origin": "https://sekihan02.github.io"},
                json.dumps({"question": "ZIP は何ですか？"}).encode("utf-8"),
                make_config(),
            )

        self.assertEqual(status, 200)
        self.assertEqual(payload["mode"], "answer")
        self.assertEqual(payload["citations"][0]["slug"], "zip-guide")

    def test_rejects_disallowed_origin(self):
        status, payload, _ = process_request("GET", "/healthz", {"Origin": "https://example.com"}, b"", make_config())
        self.assertEqual(status, 403)
        self.assertEqual(payload["error"], "Origin is not allowed.")


if __name__ == "__main__":
    unittest.main()

