from __future__ import annotations

from lib.server import AppHandler


class handler(AppHandler):
    route_path = "/healthz"

