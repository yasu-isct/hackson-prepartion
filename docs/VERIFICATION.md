# 本机验证记录

日期：2026-10-28（Asia/Tokyo）。目录：D:\CodexProject\hackson-prepartion。

## 结果

| 检查 | 实际结果 |
| --- | --- |
| npm run doctor | Node、Git、Python、pip、Gemini CLI 版本检查全部可用 |
| activate.ps1 后直接调用 | python、pip、gemini 均能运行并输出版本 |
| npm run check | 14 个 JavaScript 文件语法、3 个 JSON 文件和 QA Agent YAML 配置通过 |
| npm test | 35 passed / 0 failed |
| npm run test:e2e | 7 passed / 0 failed，真实本机 Chrome，headless |
| npm run verify | 配置/语法、单元/HTTP、浏览器测试串行全部通过 |
| npm run test:live | SKIPPED：没有 GEMINI_API_KEY，未发出请求，按设计返回非零退出码 |
| 忽略规则 | .env、.tools、.venv、浏览器截图被 git check-ignore 命中 |
| UI 人工复核 | 已查看桌面与手机截图，修正手机标题换行 |

## 已验证范围

- 游戏：初始化、输入标准化、空输入、错误输入、正确计分、通关、重开、截止瞬间拒绝输入。
- 9 种 Mock 主题/难度组合均符合 Schema，且不调用网络。
- 模拟 Gemini live 路径验证了请求头、官方 REST 结构化输出字段及 JSON Schema、有效响应。
- 模拟 401/403、429、404/500、网络中断、超时 abort、无效 JSON、缺失字段、难度不符、拦截与截断。
- fallback 返回有效 Mock 与明确 warning；严格模式返回稳定错误；无密钥不发送请求。
- HTTP：静态资源 MIME/CSP、health、请求大小、Content-Type、参数、跨 Origin 和静态白名单。
- Chrome：完整通关、错误输入、重新开始、倒计时、主题/难度、失败重试、回退提示、安全文本显示、390px 手机布局。

## 环境问题与解决

受限工具环境最初拒绝 DNS 和 127.0.0.1 回环连接，首次 HTTP 测试出现 EACCES。
已通过工具权限机制允许依赖下载与本机浏览器/HTTP 测试，最终 35 + 7 项全部通过。
没有用跳过测试或改变断言掩盖这些失败。

Python 原有入口不可用。官方签名验证通过的 MSI 安装器返回 3（日志 0x80070003），随后改用 uv 安装项目独立 CPython，成功验证 python、pip 和 venv。
Git 发现目录所有者为 Administrators，因此仅将此明确目录加入 safe.directory；提交身份和协作设置均在本仓库配置。

## 未验证与后续输入

- 没有 API Key：真实 Gemini 网络、配额、模型权限及生成质量未验证。提供本机 .env 后运行 npm run test:live。
- 没有 Gemini CLI 登录：QA Subagent 配置已写入且结构已校验，在线委派未执行。认证后用 /agents list 和 npm run qa 验证。
- 没有远端仓库 URL：未推送、未执行远端 GitHub Actions、未配置线上分支保护。
- 浏览器仅在本机 Chrome 上执行；没有宣称 Safari、Firefox 或实体手机兼容性通过。

## 本机产物

- artifacts/desktop.png：1440px 桌面截图。
- artifacts/mobile.png：390px 手机截图。
- playwright-report/index.html：7 项浏览器测试报告。
- test-results/：浏览器测试运行数据；失败时配置保留 trace。

浏览器测试创建的服务和浏览器进程已自动关闭。重新体验请运行 npm start。
