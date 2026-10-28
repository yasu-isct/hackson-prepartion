# 三人协作规范

## 分工与文件所有权

| 成员 | 负责 | 文件 | 初始分支 |
| --- | --- | --- | --- |
| A：前端 / 游戏 | 布局、交互、状态、计分、移动适配 | public/ | feat/ui |
| B：AI / 后端 | HTTP、Gemini、Schema 校验、Mock、错误码 | server/ | feat/ai |
| C：QA / 集成 | 测试、环境工具、CI、验收、演示文档 | tests/、scripts/、.github/、docs/ | test/qa |

shared/level.schema.json、package.json、package-lock.json、GEMINI.md 和 .gemini/ 是共同契约。
改契约时先写一个请求/响应例子，说明兼容性；三人确认后由一人统一落地。
跨模块改动先在团队沟通，交给对应负责人 review。不要同时让两个人修改同一个共享文件。
不要复制另一人的未提交工作；每次交接给出分支、提交、变更文件、测试结果。

## 已在本机配置

- main 为集成分支，另已创建 feat/ui、feat/ai、test/qa。
- 仓库内配置 LF 换行、pull.ff=only、fetch.prune=true、push.default=current、merge.conflictStyle=zdiff3、rerere.enabled=true。
- `.githooks/pre-commit` 执行配置/语法检查与单元/HTTP 集成测试。
- 初始提交使用本仓库占位身份 Hackathon Team <hackathon@example.invalid>；不修改全局提交身份。
- 目录由 Administrators 拥有，已仅为此项目添加全局 safe.directory 信任项：D:/CodexProject/hackson-prepartion。
- 尚未连接远端；此处的本地规范和 CI 文件不能代替远端分支保护。

每位真实成员在自己的克隆中设置身份：

```powershell
git config --local user.name "你的名字"
git config --local user.email "你的提交邮箱"
git config --local core.autocrlf false
git config --local pull.ff only
git config --local fetch.prune true
git config --local push.default current
git config --local merge.conflictStyle zdiff3
git config --local rerere.enabled true
git config --local core.hooksPath .githooks
```

Git 的本地配置与 hooksPath 不随 clone 复制，必须由成员各自设置。

## 每日工作流

首次关联团队已有远端：`git remote add origin <团队仓库URL>`，然后 `git push -u origin main`。
如远端已有历史，不覆盖；先 fetch 并确认如何整合。

使用各自克隆或工作目录，不在同一文件夹里同时切换分支。后续新任务从最新 main 开新分支：

```powershell
git switch main
git pull --ff-only
git switch -c feat/ui-scoreboard
# 完成一个小改动
git add public/
git commit -m "feat(ui): add scoreboard"
git push -u origin feat/ui-scoreboard
```

提交使用 `feat(ui): …`、`feat(ai): …`、`fix(api): …`、`test(qa): …`、`docs: …`。
每个分支只完成一个可验收任务；每 30–60 分钟同步一次接口与进度。

开 PR 前运行 `npm run verify` 并调用 `npm run qa`（需 Gemini 认证）。至少一位其他成员 review。
PR 描述说明结果、API/Schema 变化、实际测试和未验证内容。由 C 负责集成与演示检查。
在远端配置 main：必须 PR、至少一个 approval、必须通过 CI 的 verify 状态、禁止 force push。
本任务未创建远端仓库，也未应用远端分支保护。

## 冲突处理

共享功能分支优先 merge 最新 main，避免改写其他成员历史：

```powershell
git fetch origin
git merge origin/main
# 与冲突文件负责人确认，编辑保留正确行为
git add <已解决的文件>
git commit
npm run verify
git push
```

不确定可执行 `git merge --abort` 返回合并前状态。不要用 reset --hard 或强推解决冲突。
package-lock 冲突由集成人统一核对 package.json 后执行 npm install 重建，再测试。
个人尚未共享的分支可以 rebase；共享分支避免 rebase。

## 演示前验收

1. `npm ci` 后 `npm run verify` 全绿。
2. 无密钥可用 Mock 完整通关；联网失败时界面明确显示回退。
3. 密钥配置后用 `npm run test:live` 真实验证一次，禁止把 Mock 通过当作真实 API 通过。
4. 开始、错误输入、倒计时结束、重开、手机浏览器均可用。
5. main 包含最新文档、没有 .env/凭据/工具缓存；演示机预装依赖。
