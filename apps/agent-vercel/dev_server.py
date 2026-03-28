from __future__ import annotations

import os
from http.server import ThreadingHTTPServer

from lib.server import AppHandler


class DevHandler(AppHandler):
    use_request_path = True


if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8787"))
    print(f"Michikusa Log API listening on http://{host}:{port}")
    ThreadingHTTPServer((host, port), DevHandler).serve_forever()

