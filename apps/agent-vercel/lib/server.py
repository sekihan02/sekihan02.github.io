from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler

from .app import process_request
from .config import load_config


class AppHandler(BaseHTTPRequestHandler):
    route_path: str | None = None
    use_request_path = False

    def do_GET(self) -> None:  # noqa: N802
        self._dispatch()

    def do_POST(self) -> None:  # noqa: N802
        self._dispatch()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._dispatch()

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return

    def _dispatch(self) -> None:
        body = b""
        length = self.headers.get("Content-Length")
        if length and length.isdigit():
            body = self.rfile.read(int(length))

        path = self.path.split("?", 1)[0] if self.use_request_path else self.route_path or self.path
        status, payload, headers = process_request(self.command, path, self.headers, body, load_config())

        response_body = b""
        if payload is not None:
            response_body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

        self.send_response(status)
        for key, value in headers.items():
            self.send_header(key, value)
        if payload is not None:
            self.send_header("content-type", "application/json; charset=utf-8")
            self.send_header("content-length", str(len(response_body)))
        self.end_headers()

        if response_body:
            self.wfile.write(response_body)

