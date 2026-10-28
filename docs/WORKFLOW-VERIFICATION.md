# 本轮实测记录

2026-10-28（Asia/Tokyo）。已有 Node/Git/Python/Gemini 环境沿用，没有重新安装工具或新增依赖。

## 已完成验证

- Codex 0.164.0-alpha.11.1 新的 read-only ephemeral 会话，从 practice 启动；问题未包含答案、未调用工具，正确报告 workflow-rules-v1 / practice-rules-v1 与依赖权限。
- Gemini 0.66.0 安装包真实的目录发现、Markdown import、Agent frontmatter loader、Policy Engine 离线通过。不是我们自己解析 YAML 就声称加载成功。
- 实际权限引擎确认 run_shell_command、write_file、replace、read_file、google_web_search 均被显式 Review policy 拒绝。
- 独立练习：5 项 JS 状态测试、11 项 Python/HTTP 测试、4 项 Chrome 浏览器测试通过。
- 原样例 35 项单元/HTTP + 7 项 Chrome、工作流 6 项测试也通过；总计 68 项，0 失败。
- npm run practice:git 在全新 .tools/git-lab-* 仓库实际执行分支、冲突合并、解决、错误提交与 revert，成功保留历史并恢复正确内容。
- 工作流单测覆盖五字段、Scope、敏感路径、新鲜度、删除行中的凭证特征；完整检查以 artifacts/workflow/validation.json 本机结果为准。

## 独立审查确实找到了什么

一次补充的同模型 Codex 只读审查（无实现者聊天）发现并已修复：

1. AI 响应体读取中断不触发 fallback：补充网络/HTTP 读取异常处理与回归测试。
2. HTTP 测试可能继承 live 配置并调用收费 API：测试服务生命周期固定 Mock。
3. reason 用 strip 后长度判断却返回原值：按实际原文长度验证，空白不当作有效说明。
4. Review diff 中删除的凭证未被过滤：扫描 diff 和最终 packet，发送前再次检查。
5. Git rename 只检查目标路径，可能漏掉范围外删除：收集变更路径禁用 rename 折叠。
6. Windows 反斜杠绕过敏感路径判断：规范分隔符，并在读取任务前检查目录边界/符号链接/类型。

这些是本轮 Codex 交付质量检查，不冒称 Gemini-only 在线审查。Gemini-only 用新的 Gemini CLI 进程和 packet，状态如下。

## 真实认证尝试与未完成部分

用户最新决定：先跳过 Gemini 在线部分，等账号条件明确后再处理。本轮不再尝试登录、不配置凭证、不安装替代 CLI；以下在线项目明确暂缓，不算通过。

- 用户已明确允许仅信任当前项目，已通过 CLI 完成当前目录信任和 qa-reviewer 启用，没有信任父目录。先前的自动审批拒绝已通过用户明确授权解决，没有绕过。
- 用户报告完成个人/学校账号的浏览器授权，但两次 CLI 服务端均拒绝：This client is no longer supported for Gemini Code Assist for individuals。没有读取认证文件，缓存存在性检查和 CLI 状态未显示成功登录。不能据此断言学校没有许可；只能确认当前请求仍被拒绝。
- 已核实 [Google 官方停服公告](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)：个人免费/Pro/Ultra 于 2026-06-18 停服；企业许可与有效 API 认证另有可用路径。此前只依据通用认证页建议个人登录，遗漏停服公告，现已更正。
- 新 Gemini 会话的在线规则 probe / 同一 Gemini 模型独立 Review：被服务可用性阻断，未执行成功。未擅自安装 Antigravity、启用收费服务或使用另一模型冒充 Gemini 验证。
- Developer API 真实决策：需要单独 API Key，CLI Google 登录不等于 API Key；尚未执行。
- Vertex AI：没有现场端点、权限或认证信息，未实现/验证。

## 范围与限制

原 Type Orbit 的测试在最终工作流检查中继续通过；未修改其玩法。GitHub Actions 只更新配置，未上传或远端执行。
浏览器验证是本机 Chrome；不是所有引擎/浏览器兼容性声明。
Python urllib timeout 是阻塞 I/O 超时，不是总墙钟预算；不承诺取消浏览器请求就取消上游计费。
没有默认运行编译/Lint/类型检查的空壳命令：项目没有这些工具，实际执行的是 JS/Python 语法与行为测试。
