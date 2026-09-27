#!/usr/bin/env python3
"""Serves the multi-site straight from source - no build.sh needed for local
preview. Every request is read off disk on the fly, so editing shared/,
configs/<site>.json, or assets/ and refreshing the browser is enough.

build.sh (and the Pages workflow) is still what produces the real dist/ that
actually gets deployed - this is a dev-only stand-in for that layout.

Usage: scripts/dev.py [port]   (default port 8000)
"""
import http.server
import mimetypes
import os
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIGS_DIR = os.path.join(ROOT, "configs")
SHARED_DIR = os.path.join(ROOT, "shared")
ASSETS_DIR = os.path.join(ROOT, "assets")


def site_names():
    return {
        os.path.splitext(f)[0]
        for f in os.listdir(CONFIGS_DIR)
        if f.endswith(".json")
    }


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = urllib.parse.urlsplit(self.path).path

        # "/<site>" with no trailing slash would break the page's relative
        # asset URLs (app.js, ../assets/...), so send it to "/<site>/".
        if not path.endswith("/"):
            bare_site = path.lstrip("/")
            if bare_site and "/" not in bare_site and bare_site in site_names():
                self.send_response(302)
                self.send_header("Location", f"/{bare_site}/")
                self.end_headers()
                return

        resolved = self.resolve(path)
        if resolved is None or not os.path.isfile(resolved):
            self.send_error(404, f"Not found: {path}")
            return
        self.send_file(resolved)

    def resolve(self, path):
        path = path.lstrip("/")
        if path == "":
            return os.path.join(ROOT, "index.html")
        if path.startswith("assets/"):
            return os.path.join(ROOT, path)

        site, _, rest = path.partition("/")
        if site not in site_names():
            return None
        rest = rest or "index.html"
        if rest == "config.json":
            return os.path.join(CONFIGS_DIR, f"{site}.json")
        if rest in ("index.html", "app.js", "style.css", "shop.css"):
            return os.path.join(SHARED_DIR, rest)
        return None

    def send_file(self, filepath):
        ctype = mimetypes.guess_type(filepath)[0] or "application/octet-stream"
        with open(filepath, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        sys.stderr.write(f"{self.address_string()} - {fmt % args}\n")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = http.server.HTTPServer(("localhost", port), Handler)
    sites = ", ".join(sorted(site_names()))
    print(f"Serving from source on http://localhost:{port}/  (sites: {sites})")
    print("Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
