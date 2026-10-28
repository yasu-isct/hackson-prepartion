# 模块契约 v1

浏览器只调用本机 Node 服务；Node 使用 Gemini Developer API 的 `generateContent` REST 接口。
默认模型 `gemini-3.8-flash`，可用 `GEMINI_MODEL` 覆盖。密钥通过 `x-goog-api-key` 请求头发送。
REST 结构化输出采用 `generationConfig.responseFormat.text`（mimeType=APPLICATION_JSON，schema=关卡 Schema）。
Gemini 仅支持 JSON Schema 子集，因此字符串长度、正则和唯一性等仍由本地 Ajv 完整校验。

## GET /api/health

返回 `{ "ok": true, "mode": "mock", "model": "gemini-3.8-flash", "keyConfigured": false }`。
只反映配置状态；不是 Gemini 连通性验证。

## POST /api/level

Content-Type 必须为 application/json；请求体最多 4096 字节；最多同时处理 3 个出题请求。
浏览器跨 Origin 请求会被拒绝。服务默认只绑定 127.0.0.1，适用于本机练习；公网部署需另做认证和速率限制。

请求：

```json
{ "theme": "space", "difficulty": "normal" }
```

theme：space / ocean / forest。difficulty：easy / normal / hard。不接受额外字段。

成功（200）：

```json
{
  "level": {
    "title": "星际信号",
    "difficulty": "normal",
    "durationSec": 30,
    "words": ["star", "moon", "nova", "orbit", "comet", "solar", "planet", "rocket"]
  },
  "source": "mock",
  "warning": null
}
```

source：mock（主动离线）/ gemini（真实模型）/ fallback（真实调用失败后回退）。
fallback 时 warning 是 `{ "code": "UPSTREAM_TIMEOUT", "message": "…已切换到离线关卡。" }`，前端必须显示。

关卡以 `shared/level.schema.json` 为唯一服务端 Schema：title 1–40 字符；durationSec 整数 15–60；words 8–20 个、不重复、仅 a–z、每词 2–12 字母；不接受额外字段；difficulty 必须与请求一致。
内置 Mock 始终 8 词，easy/normal/hard 分别为 45/30/20 秒；真实 AI 也会收到这些目标值，但以返回的有效 durationSec 为准。

失败：

```json
{ "error": { "code": "INVALID_REQUEST", "message": "请选择有效的主题与难度。" } }
```

| HTTP | code | 含义 |
| --- | --- | --- |
| 400 | INVALID_JSON / INVALID_REQUEST | 请求 JSON 或参数无效 |
| 403 | INVALID_ORIGIN | 跨 Origin 请求 |
| 413 | BODY_TOO_LARGE | 请求超过限制 |
| 415 | CONTENT_TYPE | 请求类型错误 |
| 429 | SERVER_BUSY | 本机并发出题数已达上限 |
| 503 | MISSING_API_KEY | 缺少密钥 |
| 503 | UPSTREAM_AUTH | Gemini 返回 401/403 |
| 503 | UPSTREAM_RATE_LIMIT | Gemini 返回 429 |
| 504 | UPSTREAM_TIMEOUT | 超时且已中断请求 |
| 502 | UPSTREAM_NETWORK / UPSTREAM_HTTP | 网络失败或其他上游状态 |
| 502 | INVALID_UPSTREAM_JSON / INVALID_MODEL_JSON | 响应 JSON 或关卡 Schema 无效 |
| 502 | UPSTREAM_BLOCKED | 安全拦截、截断或非 STOP 结束 |

默认 `GEMINI_FALLBACK=true` 会把上游异常转换成带 warning 的 200 Mock 关卡；输入错误不回退。
设置 false 用于严格联调。不会自动重试，避免重复消耗配额；由玩家主动重试。
服务不转发上游原始错误、堆栈、提示词或密钥。

## 游戏规则

前端根据服务端返回的数据创建状态。每正确输入一个单词 +100 分；错误输入记录次数，不扣分。
输入会 trim 并转为小写；空输入忽略。全部完成即通关；达到截止时刻（包含相等）即失败。
基于 performance.now 的绝对截止时间，切回标签页也会重新核对，不依赖 interval 计数。
重开清空状态，重新请求关卡。AI 字符串只用 textContent 渲染。

## 资料

- [Gemini 结构化输出](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)
- [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
