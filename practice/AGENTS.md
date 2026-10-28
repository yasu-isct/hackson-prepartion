# 局部指令 · practice-rules-v1

- 先读 README.md；这是独立的回合制教学样例，不扩展成比赛成品。
- 浏览器用原生 JS，Python 服务只用标准库；没有新增运行依赖的授权。
- Game State 只由纯函数更新；AI 只提议行动，合法性由代码决定。
- 异步 AI 结果带状态版本，重开或玩家行动后丢弃旧响应。
- `npm run practice:verify` 检查 JS、Python 和 HTTP；`npm run practice:e2e` 检查浏览器。
