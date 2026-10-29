# 黑客松准备：通用 AI Coding + 独立游戏接口练习

本轮在已有环境上继续，没有重装工具。目标是能在三人、约 15 小时的开发中独立交付可靠 AI 模块，并保留未来 Python/Web/AI 项目也能用的工作习惯。
不预设比赛主题、Memory Guard、浏览器、Phaser 或最终分工。

建议按这个顺序看：

1. [学习优先级与动手验收](docs/LEARNING.md)：P0–P3，每项都有用途、掌握程度、替代和证明方式；含约 5–6 小时赛前安排。
2. [五字段任务模板](docs/TASKS.md)：新增、Bug、重构、API、陌生项目实例。
3. [AI Coding 工作流](docs/WORKFLOW.md)：Plan → Implement → Test → 独立 Review → Commit。
4. [Agent 配置与真实加载验证](docs/AGENT-CONFIG.md)：Codex/Gemini、全局/项目/局部、只读权限。
5. [独立 practice](practice/README.md)：原生 JS + Python 标准库，小棋盘的状态/行动/AI 决策/Validator/Mock。
6. [本轮验证结果](docs/WORKFLOW-VERIFICATION.md) 与 [当前状态](docs/STATUS.md)。
7. [官方资料与 GitHub Desktop 回顾](docs/OFFICIAL-PREP.md)：按官方页码分成同步、提交、分支/PR、冲突四课；与主办方现场规则衔接。

启动新的练习：

```powershell
npm run practice:start
```

浏览器打开 http://127.0.0.1:3200。方向操作或请 Mock AI 走一步，8 回合内到达终点；随时重开。默认不需要密钥、不调用网络。

```powershell
npm run practice:verify   # JS 状态 + Python/HTTP
npm run practice:e2e      # 浏览器行为
npm run workflow:verify  # 全仓库客观检查与证据
npm run review:pack      # 有 Scope、凭证路径和新鲜度检查的审查材料
npm run review:gemini -- SAME_MODEL_ID
```

Gemini CLI 入口为 `npm run gemini`。本机 Google 登录已实际被服务端拒绝：个人免费/Pro/Ultra 的这条路径于 2026-06-18 停服；学校邮箱本身不保证拥有企业许可。继续使用需有效 API/企业凭证，不能反复 OAuth 解决。[Google 官方公告](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)
GEMINI_CLI_HOME 位于被忽略的 .tools/gemini-home；CLI 身份与服务端 API Key 是两回事。没有擅自安装 Antigravity 或启用收费项目。
AGENTS.md 是共享项目规范，GEMINI.md 只导入；不为两种工具维护重复规则。
在线能力必须依据真实执行结果判断，配置文件和 Mock 测试通过不代表模型调用已通过。
用户已决定暂缓 Gemini 在线登录/API/Review；当前先用现有 Codex 和离线练习，不等待账号审批。

旧 Type Orbit 保留原命令 `npm start`，端口 3000；它不是正式比赛企划。旧说明见 [TYPE-ORBIT.md](docs/TYPE-ORBIT.md)。
Git 协作继续使用 [TEAM.md](docs/TEAM.md)，分工是讨论起点，不代表提前指定你和陌生队友的角色。
