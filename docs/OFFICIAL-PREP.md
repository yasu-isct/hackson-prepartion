# 官方资料与 GitHub Desktop 回顾路线

阅读日期：2026-10-30。依据用户提供的两份本地 PDF，已提取全部正文，并查看活动 4 页及 GitHub 关键操作截图。PDF 未修改、未上传、未加入 Git。

来源（PDF 实际页码，从 1 开始）：

- 活动资料：`C:/Users/orangekyuuko/Downloads/AIハッカソン_参加者向けご案内.pdf`，4 页。
- GitHub 资料：`C:/Users/orangekyuuko/Downloads/GitHub利用ガイド_GitHubDesktop.pdf`，72 页；带 CONFIDENTIAL 标记，保留本地使用。

## 与准备方向有关的官方事实

- 活动资料 p1：10/31–11/2，每队 3 人，用生成式 AI 开发游戏。每日受付 10:00–10:30，10:30 开始；不要早于 10:00 集合。前两天 18:00 结束，可自愿延长至 20:00；最后一天 20:00 结束。
- 活动资料 p3：主办方提供开发 PC、开发账号和基本开发环境。准备重点应是能快速适应现场环境，不能假定个人会员或本机配置会原样带入现场。
- 本次两份资料没有指定 Gemini CLI / Antigravity / 模型、游戏引擎、最终游戏主题或明确的成果提交方式；这些需以现场或其他正式资料为准。“15 小时”仍是用户估计，不是这两份文件确认的可开发时长。
- 入馆信息存在需确认之处：p1 标题写 9 层活动厅，p2 周末路线和 p4 受付地点写 5 层；不要自行把两者当成同一地点。周末先按 3 层集合路线和工作人员引导；11/2 的入馆方式不同。必要时通过 My Page 中的官方联系方式确认。

## GitHub 学到哪里就够

目标不是背命令，而是能够完成“接入队伍仓库 → 取最新代码 → 在自己的分支工作 → 检查/保存/上传 → PR 合并 → 同步 → 处理一次冲突”。
官方 p2 明确：主要通过 GitHub Desktop 与 VS Code 界面学习，不使用命令。后续教学优先沿用这一方式；终端测试命令单独解释，不要求把 Git 操作都改成命令行。

| 回顾课 | 对应官方页 | 实际操作 | 完成标准 |
| --- | --- | --- | --- |
| 1. 接入与同步 | p3、p7–9、p37–49、p58–60 | 接受邀请 → Clone → 确认本地目录、仓库、当前分支 → Fetch / Pull | 找得到代码；能区分本机与 GitHub；知道 Fetch 只获取远端信息、Pull 才整合到当前本地分支 |
| 2. 保存与共享 | p18–26、p50–56 | Agent/编辑器改一个小功能 → 保存 → Changes 看 diff → 运行测试 → Commit → Push | 能区分保存文件、Commit、Push；确认实际上传的文件不含凭证/缓存/无关变更 |
| 3. 分支与合流 | p27–34 | 从最新 main 创建任务分支 → Publish branch → 改动/测试/Commit/Push → Preview/Create PR → review/merge → 本机 main Pull | 知道 PR 的源分支和目标分支；能把功能合入 main，并在本机拿到合并后的代码 |
| 4. 冲突与恢复 | p61–70 | 在独立练习仓库制造同一行冲突 → VS Code 解决 → 保存 → 测试 → Continue merge → Push | 能解释 Current / Incoming 的来源；不盲点 Both；知道 Abort merge 可取消当前合并 |

一次只练一课，开始先说目的，结束以实际行为验收。不从创建账号重新讲起，也不逐页抄 72 页。让用户亲手点击关键操作；Agent 可辅助分析 diff 和冲突，但不代替用户学习操作。

## 一张日常操作卡

1. **开工前**：确认 Current repository / Current branch；已有未提交改动先保存或妥善安置，不直接切分支/合并。工作区干净后，切 main → Fetch origin → 有更新才 Pull origin → New branch。
2. **写功能**：让 Coding Agent 在该仓库/分支修改；GitHub Desktop 的 Changes 中检查文件和红绿 diff → 执行相关测试。
3. **交付**：写 Summary → Commit to 当前任务分支 → Publish branch（首次）或 Push origin → Preview/Create Pull Request，目标 main → 队友查看后 Merge。
4. **合并后**：切回本机 main → Fetch / Pull → 运行；确认当前分支的改动已保存再开始下一任务。
5. **冲突时**：先确认两边意图 → Open in VS Code → 保留正确行为并清除冲突标记 → 保存/测试 → Continue merge → Push。拿不准先咨询负责同一文件的队友，可取消当前 merge。

Fetch 并不等于已经把代码拉到本地工作文件；Commit 并不等于上传；Push 并不等于合并到 main。这三个区别比记按钮位置更重要。

## 指南中不能机械照搬的地方

以下是基于指南和 GitHub 官方说明的补充判断，不是主办方额外要求：

- **p44–45 的 Repository settings / URL**：截图是在修改当前仓库的远端地址，不是 Clone 的必要步骤，也不只是“切换显示仓库”。接入队友仓库直接用 p46–47 的 File → Clone repository → GitHub.com 列表或 URL → 独立本地目录；避免把现有项目 origin 改到另一个项目。参照 [GitHub 官方 Clone 说明](https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop)。
- **p15–16 的 Public**：是教程里的公开设置示例，不能推断为比赛仓库必须公开。正式仓库的组织、可见性、邀请与成果发布由主办方/团队确认；不要把带 CONFIDENTIAL 的官方 PDF、密钥或账号资料推到公开仓库。
- **p24 / p54 的 Commit to main**：用于基础教学演示，不代表三人并行开发都应直接改 main。短期协作可用任务分支 + 小 PR；这是我们的建议，现场若指定流程则按现场规则执行。
- **p66 的 Current / Incoming**：这里针对普通 merge；Current 是当前检出的分支，Incoming 是正在合入的分支，不永远等于“我/队友”。不把这套标签含义直接套到 rebase。
- **p67 的 Accept Both Changes**：教程文本例子可以双保留；业务代码可能重复执行/互相矛盾。选择后仍需读最终代码并测试，标记消失不等于功能正确。
- 不需要为了这些练习立即开新云仓库、邀请他人、改仓库可见性、上传或安装应用。后续对应实操明确需要时再执行。

## 三人的最小约定（现场共同决定）

- 一个共享仓库，每人独立本地 Clone，约定一个稳定 main。
- 一人负责一个任务/分支，先说清文件范围；共享接口先协商，再改。
- 小功能先测试再 Commit/Push；PR 至少由另一人快速看 diff，主办方如指定其他流程则按指定流程。
- 公共 API 返回示例和 Mock 尽早提交，避免队友必须等待个人密钥才能集成。
- 不 Force push、不用 reset --hard 或盲选整个文件来“消灭冲突”；操作恢复需明确当前状态。

以上约定不提前指定你的角色，也不强制旧样例的 feat/ui / feat/ai / test/qa 命名搬到正式比赛。
