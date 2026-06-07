#!/usr/bin/env python3
"""Serve the GSU Hazing Awareness & Prevention static site locally."""

import http.server
import os
import socketserver
from pathlib import Path

SITE_DIR = Path(__file__).resolve().parent / "cloned_site" / "site"
PORT = 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path in ("/index.html", "/index.html/"):
            self.send_response(301)
            self.send_header("Location", "/")
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main() -> None:
    os.chdir(SITE_DIR)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving {SITE_DIR}")
        print(f"Open http://localhost:{PORT}/")
        print("Press Ctrl+C to stop.")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
