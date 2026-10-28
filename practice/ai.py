"""Small replaceable adapter: observe -> propose -> validate -> fallback. No SDK."""
import json
import http.client
import os
import socket
import urllib.error
import urllib.request

MOVES = {"up": (0, -1), "down": (0, 1), "left": (-1, 0), "right": (1, 0)}
DECISION_SCHEMA = {
    "type": "object", "additionalProperties": False,
    "properties": {"action": {"type": "string", "enum": list(MOVES)},
                   "reason": {"type": "string", "minLength": 1, "maxLength": 120}},
    "required": ["action", "reason"],
}


class AIError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def validate_observation(data):
    if not isinstance(data, dict) or set(data) != {"player", "goal", "turnsLeft", "legalActions"}:
        raise ValueError("观察字段无效")
    for key in ("player", "goal"):
        if not isinstance(data[key], list) or len(data[key]) != 2 or any(type(n) is not int or not 0 <= n < 3 for n in data[key]):
            raise ValueError("坐标无效")
    if type(data["turnsLeft"]) is not int or not 1 <= data["turnsLeft"] <= 8:
        raise ValueError("剩余回合无效")
    actions = data["legalActions"]
    if not isinstance(actions, list) or not 1 <= len(actions) <= 4 or any(not isinstance(a, str) or a not in MOVES for a in actions) or len(actions) != len(set(actions)):
        raise ValueError("行动列表无效")
    return data


def validate_decision(data, view):
    # Exact semantic equivalent of DECISION_SCHEMA, plus state-dependent legality.
    if not isinstance(data, dict) or set(data) != {"action", "reason"}:
        raise AIError("INVALID_DECISION", "AI 决策字段无效")
    if not isinstance(data["action"], str) or data["action"] not in view["legalActions"]:
        raise AIError("ILLEGAL_ACTION", "AI 选择了非法行动")
    if not isinstance(data["reason"], str) or not data["reason"].strip() or not 1 <= len(data["reason"]) <= 120:
        raise AIError("INVALID_DECISION", "AI 决策说明无效")
    return data


def mock_decision(view):
    def distance(action):
        dx, dy = MOVES[action]
        return abs(view["player"][0] + dx - view["goal"][0]) + abs(view["player"][1] + dy - view["goal"][1])
    return {"action": min(view["legalActions"], key=distance), "reason": "选择一个合法且靠近目标的方向。"}


def gemini_decision(view, env, transport):
    key = env.get("GEMINI_API_KEY")
    if not key:
        raise AIError("MISSING_KEY", "尚未配置 API Key")
    model = env.get("GEMINI_MODEL", "gemini-3.8-flash")
    if not model or any(not (c.isascii() and (c.isalnum() or c in "-_.")) for c in model):
        raise AIError("CONFIG", "模型名无效")
    try:
        timeout = float(env.get("GEMINI_TIMEOUT_SECONDS", "5"))
        if not 0.1 <= timeout <= 30:
            raise ValueError()
    except ValueError:
        raise AIError("CONFIG", "超时配置无效") from None
    body = {
        "contents": [{"parts": [{"text": "Choose one action from legalActions. Explain briefly in Chinese. Observation: " + json.dumps(view)}]}],
        "generationConfig": {"responseFormat": {"text": {"mimeType": "APPLICATION_JSON", "schema": DECISION_SCHEMA}}},
    }
    request = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key}, method="POST")
    try:
        with transport(request, timeout=timeout) as response:
            envelope = json.loads(response.read(65537))
        candidate = envelope.get("candidates", [{}])[0]
        if candidate.get("finishReason") != "STOP" or envelope.get("promptFeedback", {}).get("blockReason"):
            raise AIError("INCOMPLETE", "AI 响应被拦截或没有完整结束")
        text = "".join(part.get("text", "") for part in candidate["content"]["parts"] if not part.get("thought"))
        return validate_decision(json.loads(text), view)
    except urllib.error.HTTPError as error:
        code = "AUTH" if error.code in (401, 403) else "RATE_LIMIT" if error.code == 429 else "UPSTREAM"
        raise AIError(code, "AI 服务暂时不可用") from None
    except (TimeoutError, socket.timeout):
        raise AIError("TIMEOUT", "AI 服务超时") from None
    except urllib.error.URLError as error:
        code = "TIMEOUT" if isinstance(error.reason, TimeoutError) else "NETWORK"
        raise AIError(code, "AI 网络请求失败") from None
    except (OSError, http.client.HTTPException):
        raise AIError("NETWORK", "AI 连接中断") from None
    except (ValueError, KeyError, IndexError, TypeError, AttributeError):
        raise AIError("INVALID_JSON", "AI 返回的数据无效") from None


def decide(data, env=None, transport=urllib.request.urlopen):
    view = validate_observation(data)
    env = os.environ if env is None else env
    mode = env.get("PRACTICE_AI_MODE", "mock")
    if mode not in ("mock", "live"):
        raise AIError("CONFIG", "PRACTICE_AI_MODE 必须为 mock 或 live")
    if mode == "mock":
        return {"decision": validate_decision(mock_decision(view), view), "source": "mock", "warning": None}
    try:
        return {"decision": gemini_decision(view, env, transport), "source": "gemini", "warning": None}
    except AIError as error:
        return {"decision": validate_decision(mock_decision(view), view), "source": "fallback",
                "warning": {"code": error.code, "message": f"{error}；已使用离线决策。"}}
