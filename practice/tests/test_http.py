import json
import os
from pathlib import Path
import sys
from threading import Thread
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import Handler, ThreadingHTTPServer
from test_ai import VIEW


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        mode = patch.dict(os.environ, {"PRACTICE_AI_MODE": "mock"})
        mode.start()
        cls.addClassCleanup(mode.stop)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_assets_and_no_source_exposure(self):
        for path in ["/", "/game.js", "/app.js", "/style.css", "/api/health"]:
            with urllib.request.urlopen(self.base + path) as reply:
                self.assertEqual(reply.status, 200)
        for path in ["/.env", "/ai.py", "/../AGENTS.md"]:
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(self.base + path)
            self.assertEqual(error.exception.code, 404)

    def test_decision_and_invalid_input(self):
        request = urllib.request.Request(self.base + "/api/decision", data=json.dumps(VIEW).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(request) as reply:
            self.assertIn(json.load(reply)["decision"]["action"], VIEW["legalActions"])
        for data, status in [(b"{}", 400), (b"{", 400), (b"x" * 5000, 413)]:
            request.data = data
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(request)
            self.assertEqual(error.exception.code, status)

    def test_content_type_and_cross_origin(self):
        for headers, status in [({"Content-Type": "text/plain"}, 415), ({"Content-Type": "application/json", "Origin": "https://other.example"}, 403)]:
            request = urllib.request.Request(self.base + "/api/decision", data=b"{}", headers=headers)
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(request)
            self.assertEqual(error.exception.code, status)
