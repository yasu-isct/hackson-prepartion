## Goal
建立可复用 AI Coding 工作流和独立 Python/浏览器 AI 决策练习，不决定比赛企划。
## Scope
- AGENTS.md
- GEMINI.md
- README.md
- package.json
- scripts/
- tests/workflow/
- practice/
- docs/
- tasks/
- .gemini/agents/qa-reviewer.md
- .gemini/review-policy.toml
- .github/workflows/ci.yml
## Constraints
不安装新依赖，不读取凭证，不改旧游戏玩法，不自动 push。保留原样例，不以 Mock 通过冒充真实 Gemini 通过。
## Acceptance Criteria
共享规则只有一个入口；只读 Review；五字段模板；练习支持操作/状态/胜负/重开/有限观察/合法决策/失败回退；有客观测试和实测记录。
## Validation
npm run workflow:verify；认证后用新 Gemini 会话执行 rules probe 和独立 Review。
