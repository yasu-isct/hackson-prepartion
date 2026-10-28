# 给 Agent 的五字段任务

小任务每项一行即可。复杂任务才展开。无需复制整个聊天；仓库规则自动提供常驻约束。

```text
Goal: 想实现或修复什么
Scope: 可修改的文件/目录
Constraints: 特殊限制（没有就写遵守 AGENTS.md）
Acceptance Criteria: 用户能观察到的结果/边界
Validation: 应运行的检查（不知道可让 Agent 从相关测试推导）
```

默认流程：读相关代码→小改动→运行验证→独立审查→修复→复验→本地提交→简短更新状态。只在真实阻塞/越过风险边界时询问。
以下是练习任务，不代表已经实施的待办。

**新增功能**

```text
Goal: 显示本局已执行的行动次数。
Scope: practice/public/app.js, practice/public/index.html, practice/tests/browser/
Constraints: 不改变 AI 接口或游戏规则，不加依赖。
Acceptance Criteria: 新局显示 0，每次合法移动 +1，撞墙不计数，重开归零。
Validation: npm run practice:verify; npm run practice:e2e
```

**修 Bug**

```text
Goal: 修复最后一回合到终点却显示失败的问题。
Scope: practice/public/game.js, practice/tests/game.test.js
Constraints: 先写复现；不要修改 UI/API。
Acceptance Criteria: 最后一回合到终点成功；未到终点且回合用尽才失败。
Validation: node --test practice/tests/game.test.js
```

当前代码已经包含这条边界测试；要练习，先在临时分支引入错误，再交给 Agent 修复。

**重构**

```text
Goal: 提取棋盘坐标合法性判断，减少重复条件。
Scope: practice/public/game.js, practice/tests/game.test.js
Constraints: 行为、导出接口和依赖不变，不顺手改其他文件。
Acceptance Criteria: 各方向/边界/墙/终局行为与原来相同。
Validation: npm run practice:verify
```

**集成 API**

```text
Goal: 给现有 AI adapter 增加比赛现场提供的模型服务实现。
Scope: practice/ai.py, practice/tests/test_ai.py, practice/README.md
Constraints: 保留 decide 输入输出；不访问凭证文件；Mock 默认可用；核心接口变更先确认。
Acceptance Criteria: 合法行动通过；超时/429/非法 JSON 回退；密钥不进前端/URL/日志；旧状态不受影响。
Validation: npm run practice:verify；真实调用须单独授权配置和记录。
```

**阅读陌生项目**

```text
Goal: 找到输入、状态更新、AI 接口、胜负和重开路径。
Scope: 只读 practice/ 与相关测试；仅可写 artifacts/project-map.md。
Constraints: 不改源码，不安装依赖，不请求外部 API。
Acceptance Criteria: 用文件位置和一条调用链解释；列出最多 3 个真实不确定点。
Validation: 把说明与源文件逐项核对；确认 git diff 没有业务改动。
```

脚本可读版本见 tasks/preparation.md：同样五字段，用 `##` 标题、Scope 每行一个仓库相对路径，目录以 `/` 结尾。日常聊天无需为了脚本强行格式化。
