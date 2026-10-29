# 规则如何加载，以及怎样证明

本轮只核对新需要的 Agent 功能，没有重装已有环境。实测 CLI：Codex 0.164.0-alpha.11.1、Gemini 0.66.0。
版本相关开关以本机 --help 和安装包加载器验证为准，不把网上旧参数直接照搬。

**当前认证限制（已实测）**：2026-10-28 两次账号尝试后，CLI 均返回个人版客户端不受支持，没有成功登录。Google 已于 2026-06-18 停止个人免费/Pro/Ultra 的 Gemini CLI 服务；已有 Standard/Enterprise 许可、有效 API 认证是其他路径。学校 Google Workspace 邮箱本身不等于 Code Assist 企业许可。[官方公告](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)
不要因为通用 authentication 页面仍写着 Google 登录就反复重试。先确认实际服务可用性。未获用户同意，不安装 Antigravity、不配置付费项目/凭证。

## Antigravity CLI 安装记录（2026-10-30）

用户已明确授权安装。已下载并检查 [官方 Windows 安装器](https://antigravity.google/download)，由其校验下载文件的 SHA512；实际安装版本为 1.4.10，Authenticode 签名有效、签发者 Google LLC。
程序位置：`C:\Users\orangekyuuko\AppData\Local\agy\bin\agy.exe`。使用官方 `install --skip-aliases` 将该目录加入用户 PATH，保留现有 shell 别名；未更换 Node/Python/Git、未新增 npm 依赖。
打开新的 PowerShell，执行 `Set-Location 'D:\CodexProject\hackson-prepartion'`，再执行 `agy`。已打开的终端如未识别命令，可执行 `& "$env:LOCALAPPDATA\agy\bin\agy.exe"`。
已验证 `--version`、`--help`、签名和用户 PATH。未执行账号登录、模型请求或自动导入旧凭证。当前 Gemini QA/Policy 配置不能直接视为 Antigravity 配置已生效，需要之后独立验证。

## 一个共享项目入口

根目录 AGENTS.md 是共同规范；GEMINI.md 仅 `@./AGENTS.md`。practice/ 的同名两文件只补局部差异。
Codex 原生加载 AGENTS；Gemini 通过导入展开同一份内容。不另外维护一套近似但可能冲突的规则。
不要把 context.fileName 同时设置 AGENTS.md 和 GEMINI.md，否则可能重复加载相同规则。

| 范围 | Codex | Gemini | 放什么 |
| --- | --- | --- | --- |
| 全局 | ~/.codex/AGENTS.md；override 优先 | 默认 ~/.gemini/GEMINI.md；本仓库包装器改用 .tools/gemini-home | 跨项目个人偏好，简短通用原则；不要放仓库路径、测试命令和比赛策划 |
| 项目 | Git 根的 AGENTS.md | 根 GEMINI.md 导入 AGENTS.md | 验收/依赖/权限原则，仓库命令、状态入口 |
| 局部 | 工作目录祖先链中的 AGENTS.md，越近越具体 | 工作区/祖先与访问子目录时的 JIT context | 只有该子目录的栈、测试、约束 |

Codex 启动时构建指令链；改变规则后新开会话，不能假设旧会话已更新。AGENTS.override.md 会遮盖同目录常规文件，不为长期默认设置它。[OpenAI 官方说明](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
Gemini 可用 /memory show 查看展开内容、/memory reload 重载；导入支持 @ 路径。[Gemini 官方说明](https://geminicli.com/docs/cli/gemini-md/)

这次未改用户全局规则：检查发现上述全局规则文件不存在，先把可复用习惯保存在可版本控制的项目里。未来复制这组 AGENTS.md/GEMINI.md 到新仓库，只替换“本仓库”部分；不必为每个项目配置全局权限。
若以后将个人通用规则放全局，两个工具应引用同一个通用文件；保持项目与局部命令在仓库，避免跨项目污染。不要把全局规则指向将来可能删除的练习目录。

## 本机认证位置与工作目录

`npm run gemini` 使用 scripts/gemini.mjs，将 GEMINI_CLI_HOME 设为 .tools/gemini-home，凭证与历史均被 Git 忽略。
包装器保留调用者 cwd。取得有效 API/企业认证后，要验证局部目录可执行：

```powershell
Set-Location practice
node ..\scripts\gemini.mjs
```

回到根目录用 `Set-Location ..`。npm 脚本通常从包根运行，因此不要用“在子目录执行 npm run gemini”来推断 cwd。
CLI 登录由 CLI 内部处理；我们只检查文件存在与命令结果，不读取认证文件。不要把 API Key 发到聊天。

## 只读审查和权限的实际区别

qa-reviewer 的 tools 明确只有 read_file、list_directory、glob、grep_search，model=inherit。以前“给 shell 再在提示词说只准测试”的配置已移除。
读取工具仍可能读到可访问的文件，因此提示词明确禁止凭证；更严格的默认审查使用已筛选 packet，完全禁止工具。
review-policy.toml 使用当前引擎的 `[[rule]] / decision / priority`；脚本显式传 --policy，不依赖工作区 policy 自动发现。
官方文档警告项目 policies 目录自动发现目前有限制，不能仅创建文件就认为生效。[Policy Engine](https://geminicli.com/docs/reference/policy-engine/)

实现时用默认审批；Plan 用于复杂任务先探索，不为所有小任务强制 Plan。Headless 不是权限沙箱，--allowed-tools 也不是“只允许这些工具”的可靠白名单；本机 help 已把它标为废弃的自动审批选项。

## 从“文件存在”到“真正加载”的验证

1. **配置结构**：npm run check 检查语法/字段，只是基础。
2. **真实加载器，离线**：npm run workflow:test 调用已安装 Gemini 包的发现/导入/Agent 解析/Policy Engine，确认 shared/local 标记出现、工具列表正确、5 种读写/搜索工具实际被 deny。这里验证配置行为，不调用模型。
3. **真实新会话，在线**：从 practice 启动新会话，只问“不要调用工具，仅报告已加载项目指令的两个版本标记和依赖权限”。不要把标记答案放进问题。响应正确说明指令进入了该会话；仍不是永远遵守规则的保证。
4. **行为证据**：检查会话工具记录、diff 范围与测试结果；让其试图修改禁用文件时应被工具权限阻止，而不是只口头承诺。

已用新 Codex read-only 临时会话完成第 3 步，正确报告两标记与“未授权新增依赖”。Gemini 在线结果见本轮实测记录，不把离线加载器通过冒充在线通过。
加载器测试使用 Gemini 0.66.0 的内部导出，便于本次版本验证；不是应用运行依赖。CLI 升级后应调整该检查，不把内部 API 当永久接口。
