# Type Orbit 开发约定

这是本地运行的三人黑客松练习项目：原生浏览器模块 + Node.js HTTP 服务 + Gemini REST API。
先阅读 README.md、docs/API.md、docs/TEAM.md。保持中文产品文案。

## 命令

- `npm start`：127.0.0.1:3000；默认 Mock，不需要密钥。
- `npm run check`：JS 语法、JSON 和 QA Agent 配置校验。
- `npm test`：游戏、JSON、Gemini 异常和 HTTP 集成测试。
- `npm run test:e2e`：Playwright 自动启动独立的 Mock 服务；优先已安装的 Chrome/Edge。
- `npm run verify`：以上全部检查。
- `npm run doctor`：仅输出工具版本与配置状态，不输出密钥。

## 设计和安全

- API 密钥只能在服务器环境变量或被忽略的 .env 中；不可写入 public、测试快照、URL、日志或提交。
- 默认离线；真实 API 必须显式 `GEMINI_MODE=live`。`npm run test:live` 会调用真实 API 并可能消耗配额。
- 所有模型输出先 JSON.parse，再用 shared/level.schema.json 校验；不要使用 eval/innerHTML 渲染 AI 文本。
- 请求/响应遵守 docs/API.md。改 Schema 必须同步 UI 和测试，并征求三个模块负责人的 review。
- 前端和纯游戏逻辑归 A；server 归 B；tests、scripts、CI 和文档归 C。依赖与契约由三人共同 review。
- 每个任务使用独立分支；不强推共享分支，不直接向 main 开发。一个 PR 由另一位成员审查。

## QA Subagent

涉及功能改动或合并前，委派 `qa-reviewer`（定义在 .gemini/agents/qa-reviewer.md）执行审查。
明确记录实际测试结果和不能验证的内容。先修复失败再交付。
QA agent 的 shell 工具有执行能力，提示词命令白名单是行为约定，不是操作系统沙箱；保留 Gemini 的工具审批，不启用 YOLO。
