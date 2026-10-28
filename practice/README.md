# 独立练习：状态 → AI 建议 → 校验 → 行动

这只是接口和游戏流程教学，不是 Memory Guard，也不是预先决定的比赛企划。复用已安装的 Python/Node，不用 Phaser、新 SDK 或新依赖。

在仓库根目录：

```powershell
npm run practice:start
```

打开 [http://127.0.0.1:3200](http://127.0.0.1:3200)。点击方向自己走，或点“让 AI 走一步”。8 回合内走到绿色终点即成功，墙与边界不可进入；可随时重开。
Mock 四步可通关；无密钥、不联网也能运行。Ctrl+C 关闭。原有 Type Orbit 仍使用 npm start，端口 3000。

## 先读四个文件

1. public/game.js：纯状态与合法行动，和 DOM、网络无关。
2. public/app.js：输入、渲染、fetch，以及旧响应失效。
3. ai.py：有限观察、结构化决策、Validator、Mock、Gemini、回退。
4. server.py：静态资源与一个 JSON HTTP 接口，Python 标准库。

浏览器和 Python 使用同一个 Origin；浏览器不直接请求 Gemini，所以无需先研究 CORS 中间件。

## 接口

POST /api/decision，Content-Type: application/json：

```json
{"player":[0,0],"goal":[2,2],"turnsLeft":8,"legalActions":["down","right"]}
```

只传这四个字段；不传完整聊天、身份、密钥、全仓库内容或全部游戏实现。

```json
{"decision":{"action":"right","reason":"靠近目标"},"source":"mock","warning":null}
```

决策只有 action 和 reason；action 必须属于请求的 legalActions；reason 1–120 字符。不接受 score、代码、额外字段。
DECISION_SCHEMA 发给模型；无第三方依赖的本地 Validator 再检查字段和语义。UI 接收后还会按当前状态校验行动。
模型不能直接设置位置、分数、胜负、回合数，也不能执行返回的代码。

source 为 mock/gemini/fallback；fallback 附带安全 warning，UI 用 textContent 展示。网络失败时也可继续手动玩。
模型输出 Schema 合法不等于玩法聪明；这里验证的是合法性，不声称 AI 总能获胜。

## 真实 Gemini（可选）

在专用 PowerShell 终端设置 PRACTICE_AI_MODE=live，并通过你选择的本机安全方式配置 GEMINI_API_KEY。
此教学 Python 服务**不自动读取 .env**；避免安装 dotenv。不要把密钥放命令历史、聊天、源码或截图。
Gemini CLI 的 Google 登录不等于 Gemini Developer API 密钥。服务端还可设置 GEMINI_MODEL（默认 gemini-3.8-flash）、GEMINI_TIMEOUT_SECONDS（默认 5、范围 0.1–30）。
启动命令不变。默认不自动重试：失败立即给离线合法行动，避免卡住游戏或重复调用成本。
urllib 的 timeout 限制阻塞网络操作，并非严格的全请求 wall-clock 预算；前端另有 35 秒等待上限，取消等待不保证取消服务器已发出的计费请求。

如主办方提供 Vertex AI，需要另写 transport/认证适配器；当前不是 Vertex AI 实现。不要把 Developer API Key 认证方式套用到 Vertex。

## 测试

```powershell
npm run practice:verify
npm run practice:e2e
```

第一条：Python AST 语法、JS 纯逻辑、Python Validator/适配器及本机 HTTP。
第二条：真实浏览器验证手动通关、Mock 通关、网络失败、请求期间重开。
测试注入传输层，不需要真实密钥；没有把假响应标为真实模型连通验证。

## 为什么游戏逻辑要与 UI 和 AI 分离？

一次普通表单请求常是“提交→等待→显示结果”。游戏有持续存在的状态；等待期间玩家可能行动、重开或结束。响应回来时，原状态可能已经失效。
game.js 只做 state + action → nextState，让边界、胜负、剩余回合可以不用浏览器或模型就测试。UI 负责显示；AI 负责建议；规则负责裁决。
revision 每次行动/重开递增。发请求时记住 revision；响应回来若版本不同就丢弃。AbortController 负责停止前端等待，版本检查才是状态正确性的最后防线。

## Game Loop 与普通 Web 流程

实时游戏通常不断执行 Input → Update(dt) → Render，dt 是距上一帧的时间。逻辑不能假定所有电脑每秒帧数相同；网络调用尤其不能阻塞这一循环。
这个回合制样例只在玩家/AI 行动时更新再渲染，不需要 requestAnimationFrame。先理解状态、合法行动、终局与异步，若比赛玩法需要实时移动，再学 Loop、Scene、Collision 与 Phaser。
即使换 Unity、桌面引擎或纯 Python，规则/显示/AI 边界以及“旧请求不能改新状态”的原则仍然适用。

## 已知范围

仅本机教学服务，绑定 127.0.0.1，没有公网认证/生产级并发限流。不要直接发布到公网。
legalActions 来自客户端，便于练习；这不是防作弊的服务器权威状态。正式多人游戏需服务端保存并裁决状态。
