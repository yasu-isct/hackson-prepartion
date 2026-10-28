"""Local teaching server, not a production hosting stack."""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from ai import AIError, decide

PUBLIC = Path(__file__).parent / "public"
ASSETS = {"/": ("index.html", "text/html"), "/app.js": ("app.js", "text/javascript"),
          "/game.js": ("game.js", "text/javascript"), "/style.css": ("style.css", "text/css")}


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, *_):
        pass  # Avoid logging payloads or credentials.

    def reply(self, status, body, mime="application/json"):
        raw = json.dumps(body, ensure_ascii=False).encode() if mime == "application/json" else body
        self.send_response(status)
        self.send_header("Content-Type", f"{mime}; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/health":
            return self.reply(200, {"ok": True, "mode": os.environ.get("PRACTICE_AI_MODE", "mock")})
        if path not in ASSETS:
            return self.reply(404, {"error": "NOT_FOUND"})
        name, mime = ASSETS[path]
        self.reply(200, (PUBLIC / name).read_bytes(), mime)

    def do_POST(self):
        if self.path != "/api/decision":
            return self.reply(404, {"error": "NOT_FOUND"})
        origin = self.headers.get("Origin")
        if origin and origin != f"http://{self.headers.get('Host')}":
            return self.reply(403, {"error": "INVALID_ORIGIN"})
        if self.headers.get_content_type() != "application/json":
            return self.reply(415, {"error": "CONTENT_TYPE"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 4096:
                return self.reply(413, {"error": "BODY_TOO_LARGE"})
            data = json.loads(self.rfile.read(length))
            self.reply(200, decide(data))
        except (ValueError, UnicodeError):
            self.reply(400, {"error": "INVALID_REQUEST"})
        except AIError as error:
            self.reply(503, {"error": error.code})


if __name__ == "__main__":
    port = int(os.environ.get("PRACTICE_PORT", "3200"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Practice ready: http://127.0.0.1:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
