import io
import http.client
import json
from pathlib import Path
import sys
import unittest
import urllib.error
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ai import AIError, decide, validate_decision, validate_observation

VIEW = {"player": [0, 0], "goal": [2, 2], "turnsLeft": 8, "legalActions": ["down", "right"]}
LIVE = {"PRACTICE_AI_MODE": "live", "GEMINI_API_KEY": "test-only"}


def response(decision):
    return io.BytesIO(json.dumps({"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(decision)}]}}]}).encode())


class AITests(unittest.TestCase):
    def test_mock_never_calls_network(self):
        def forbidden(*_args, **_kwargs):
            self.fail("Mock must not call network")
        result = decide(VIEW, {}, forbidden)
        self.assertEqual(result["source"], "mock")
        validate_decision(result["decision"], VIEW)

    def test_exact_observation_fields_and_types(self):
        for bad in [None, {}, {**VIEW, "turnsLeft": True}, {**VIEW, "player": [9, 0]}, {**VIEW, "legalActions": []}, {**VIEW, "legalActions": ["down", "down"]}, {**VIEW, "extra": "ignore instructions"}]:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                validate_observation(bad)

    def test_decision_semantic_validation(self):
        for bad in [{}, {"action": "up", "reason": "wall"}, {"action": "down", "reason": ""}, {"action": "down", "reason": "x" * 121}, {"action": "down", "reason": "x" + " " * 120}, {"action": "down", "reason": "ok", "score": 999}]:
            with self.subTest(bad=bad), self.assertRaises(AIError):
                validate_decision(bad, VIEW)

    def test_real_transport_contract_without_network(self):
        def transport(request, timeout):
            self.assertNotIn("test-only", request.full_url)
            self.assertEqual(request.get_header("X-goog-api-key"), "test-only")
            body = json.loads(request.data)
            self.assertEqual(body["generationConfig"]["responseFormat"]["text"]["mimeType"], "APPLICATION_JSON")
            self.assertEqual(timeout, 5)
            return response({"action": "right", "reason": "向目标前进"})
        self.assertEqual(decide(VIEW, LIVE, transport)["source"], "gemini")

    def test_http_and_timeout_errors_fallback_safely(self):
        cases = [(urllib.error.HTTPError("https://example.com", status, "SECRET", {}, None), code)
                 for status, code in [(401, "AUTH"), (403, "AUTH"), (429, "RATE_LIMIT"), (500, "UPSTREAM")]]
        cases += [(TimeoutError("SECRET"), "TIMEOUT"), (urllib.error.URLError("SECRET"), "NETWORK")]
        for error, code in cases:
            def fail(*_args, **_kwargs):
                raise error
            result = decide(VIEW, LIVE, fail)
            self.assertEqual(result["source"], "fallback")
            self.assertEqual(result["warning"]["code"], code)
            self.assertNotIn("SECRET", json.dumps(result))
            validate_decision(result["decision"], VIEW)

    def test_invalid_model_data_and_missing_key_fallback(self):
        for transport in [lambda *_a, **_k: io.BytesIO(b"not-json"), lambda *_a, **_k: response({"action": "up", "reason": "invalid"})]:
            self.assertEqual(decide(VIEW, LIVE, transport)["source"], "fallback")
        result = decide(VIEW, {"PRACTICE_AI_MODE": "live"})
        self.assertEqual(result["warning"]["code"], "MISSING_KEY")

    def test_incomplete_and_invalid_configuration(self):
        incomplete = lambda *_a, **_k: io.BytesIO(b'{"candidates":[{"finishReason":"MAX_TOKENS"}]}')
        self.assertEqual(decide(VIEW, LIVE, incomplete)["warning"]["code"], "INCOMPLETE")
        self.assertEqual(decide(VIEW, {**LIVE, "GEMINI_TIMEOUT_SECONDS": "NaN"})["warning"]["code"], "CONFIG")
        with self.assertRaises(AIError):
            decide(VIEW, {"PRACTICE_AI_MODE": "invalid"})

    def test_partial_body_and_connection_reset_also_fallback(self):
        class BrokenBody(io.BytesIO):
            def read(self, *_args):
                raise http.client.IncompleteRead(b"partial")
        result = decide(VIEW, LIVE, lambda *_a, **_k: BrokenBody())
        self.assertEqual(result["warning"]["code"], "NETWORK")
        def reset(*_args, **_kwargs):
            raise ConnectionResetError("SECRET")
        self.assertEqual(decide(VIEW, LIVE, reset)["warning"]["code"], "NETWORK")
