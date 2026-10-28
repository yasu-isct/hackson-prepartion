> 这是上一轮 Type Orbit 的历史说明。当前共享规则、只读 QA 和命令以根 README 与 AGENT-CONFIG.md 为准。

# Type Orbit · 黑客松开发环境与练习项目

当前电脑上已实际安装和验证的三人黑客松起步项目。选择星际、海洋或森林主题，在倒计时内输入 8 个英文单词，每词 100 分。支持轻松、标准、挑战难度及重新开始。

## 直接运行

在 PowerShell 中：

```powershell
Set-Location D:\CodexProject\hackson-prepartion
. .\scripts\activate.ps1
npm start
```

浏览器打开 [http://127.0.0.1:3000](http://127.0.0.1:3000)。按“开始任务”，输入屏幕单词，按 Enter。Ctrl+C 停止服务器。
无需 .env、无需密钥、无需联网，默认使用 Mock 关卡。`npm run dev` 可监听服务端文件变化。
激活脚本只影响当前终端；新终端重新运行。项目入口不依赖激活，直接 npm start 也能运行。

## 本机环境

| 工具 | 实测版本 | 配置方式 |
| --- | --- | --- |
| Node.js | v24.22.1 | 复用已有系统安装；项目要求 24.x |
| npm | 11.19.1 | 复用已有系统安装，package-lock 锁定依赖 |
| Git | 2.54.0.windows.1 | 复用已有安装；已初始化 main 与三条模块分支 |
| Python | 3.13.18 | uv 管理于 .tools/python-managed，虚拟环境 .venv |
| pip | 26.2.2 | .venv 内可用 |
| Gemini CLI | 0.66.0 | 项目 devDependency，通过 npm run gemini 使用 |
| 浏览器测试 | Playwright 1.64.1 | 使用本机 Chrome，测试进程自动启动和关闭 |

最初 python 命令是不可用的 Windows 商店入口。Python 官方 MSI 安装器失败后，已用 uv 安装独立 CPython 并成功创建含 pip 的 .venv。
没有更改全局 PATH。`.tools`、`.venv`、node_modules 和凭据均不入 Git。
Gemini CLI 的用户状态隔离到 `.tools/gemini-home`，通过包装脚本设置 GEMINI_CLI_HOME，不修改系统 HOME。

```powershell
npm run doctor
python --version       # 先执行 activate.ps1
pip --version
npm run gemini -- --version
```

## 新队员复现

先在电脑上安装 Node.js 24 和 Git，clone 仓库后：

```powershell
npm ci
.\scripts\setup-python.ps1
. .\scripts\activate.ps1
npm run doctor
npm run verify
npm start
```

Python 安装脚本面向 Windows x64，需要网络，使用 [uv 独立 Python](https://docs.astral.sh/uv/guides/install-python/)，不写系统 PATH 或 Python 注册表。
游戏运行不依赖 Python，Python 为黑客松脚本工具准备。macOS/Linux 可自行准备 Python 3.13 与虚拟环境。
如机器没有 Chrome/Edge，先运行 `npx playwright install chromium`；Linux CI 用 `npx playwright install --with-deps chromium`。
可用 PLAYWRIGHT_CHROMIUM_EXECUTABLE 指定浏览器绝对路径。

## Gemini API

```powershell
Copy-Item .env.example .env
```

在本机编辑 .env：

```dotenv
GEMINI_MODE=live
GEMINI_API_KEY=你的真实密钥
GEMINI_MODEL=gemini-3.8-flash
GEMINI_TIMEOUT_MS=10000
GEMINI_FALLBACK=true
```

重启 npm start。密钥来自 [Google AI Studio](https://aistudio.google.com/apikey)，只存本机，禁止提交。
切勿在浏览器前端配置密钥。环境变量优先于 .env；CLI 的 Google 账号登录不等于服务端 API Key。
当前默认模型依据 [官方模型页](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)；可在 .env 中更换账号可用的模型。

服务使用 REST + JSON Schema 结构化输出，再进行 JSON.parse 与 Ajv 本地校验。
覆盖请求参数、关卡范围、单词格式、重复词和难度一致性。对超时、网络、401/403、429、5xx、非 JSON、Schema 错误、拦截、截断分别处理。
默认异常回退到 Mock，界面显示“离线回退”和原因；GEMINI_FALLBACK=false 时返回错误供严格联调。
不自动重试真实请求。完整契约和错误码见 [docs/API.md](API.md)。

```powershell
npm run test:live
```

此命令强制真实调用、禁用回退，可能消耗 API 配额；没有密钥时明确报 SKIPPED 并返回非零退出码。
**本次没有可用密钥，真实 Gemini API 调用未验证；测试通过包含模拟传输层的 live 路径测试。**

## GEMINI.md 与 QA Subagent

已配置项目根 GEMINI.md、.gemini/settings.json 和 `.gemini/agents/qa-reviewer.md`。
Agent 使用 [官方 Markdown + YAML frontmatter 格式](https://geminicli.com/docs/core/subagents/)，开启 enableAgents，继承主模型，限制 20 轮 / 10 分钟。

```powershell
npm run gemini
# 按 CLI 提示完成 Google 登录；也可在当前终端配置 GEMINI_API_KEY
```

进入 CLI 后先信任当前项目，再用 `/agents list` 检查 qa-reviewer；更新后 `/agents reload`。
请求：“请委派 qa-reviewer 检查当前项目并运行测试”。或认证后直接 `npm run qa`。
CLI 包装脚本不自动读取 .env；若用 API Key 认证，需显式配置当前终端环境变量。

QA agent 负责运行检查、测试、复核 API/游戏/异常路径并输出复现步骤；不修改业务代码、不提交、不推送。
提示词中的 shell 命令白名单是行为约定，不是安全沙箱，请保留 CLI 工具审批。
**本次已验证 CLI 版本和 Agent 配置结构；未完成 Google 登录，因此未执行在线 QA Subagent。**

## 测试与产物

```powershell
npm run check       # 语法、JSON、QA 配置
npm test            # 35 个单元与 HTTP 集成测试
npm run test:e2e    # 7 个真实 Chrome 浏览器测试
npm run verify      # 一次完成全部
```

浏览器测试自动启动端口 3100 的独立 Mock 服务，结束后关闭，不使用你的真实密钥。
覆盖通关、错误输入、计分、重新开始、严格倒计时、主题难度、失败重试、回退提示、安全文字渲染、移动布局。
桌面和手机截图：artifacts/desktop.png、artifacts/mobile.png；HTML 报告：playwright-report/index.html。
测试报告见 [docs/VERIFICATION.md](VERIFICATION.md)。CI 配置已准备，本次仅运行本机测试，未在远端执行 Actions。

## 三人分工与 Git

| 成员 | 范围 | 分支 |
| --- | --- | --- |
| A | public/ 前端、交互和游戏 | feat/ui |
| B | server/ Gemini、HTTP 和异常处理 | feat/ai |
| C | tests/、scripts/、CI 和文档 | test/qa |

shared/ 和依赖文件由三人共同 review，main 只接收通过测试且经另一人审查的 PR。
详见 [docs/TEAM.md](TEAM.md)，含身份设置、首次远端、分支命令、PR、合并冲突和演示验收流程。
当前 Git 身份是**仅本仓库的演示占位身份**，请每位成员换成真实名字/邮箱。
未设置 remote、未推送、未创建线上分支保护；需要团队仓库地址后执行。

## 项目结构

```text
public/                  界面、样式、纯游戏逻辑
server/                  HTTP 服务与 Gemini 适配
shared/level.schema.json 服务端关卡契约
tests/                   单元、HTTP 集成与 E2E
scripts/                 环境、检查、CLI 与真实调用验证
.gemini/                 QA Agent 与项目设置
.github/                 CI 与 PR 模板
.githooks/               pre-commit 检查
docs/                    API、团队协作与实测记录
GEMINI.md                主代理项目约定
```

这是本机练习项目，默认只监听 127.0.0.1。没有注册或发布托管网站。
端口 3000 占用时可在 .env 中改 PORT；CLI 无法写入用户目录时，使用 npm run gemini 包装入口。
