---
name: local_code_review
description: 审查本地刚写但未推送的代码（包括未跟踪、已修改、已暂存、已提交）。使用指定目录下的提示词进行单次审查，并自动修复发现的确定性错误。
---

# 本地代码审查

本技能旨在对开发者刚编写的本地代码进行全方位的质量审查。它针对的是所有**未推送到远程仓库**的代码变更，包括：
- Untracked (未跟踪文件)
- Modified (工作区修改)
- Staged (暂存区修改)
- Committed (本地已提交但未推送)

审查使用 `$WORK_HOME/CodeAgent/prompt/front_end_review` 目录下定义的角色提示词。

## 核心规则

1.  **覆盖范围**：- 必须包含所有本地未同步到远程服务器的变更。
2.  **绝对不Push**：此过程只读，绝对不执行 push 操作。
3.  **单次审查**：对于每一个提示词（角色），仅执行**一次**审查流程。
4.  **中文输出**：所有审查报告使用中文。

## 执行步骤

### 第一步：获取变更上下文 (Context Gathering)

你需要收集所有"刚写的代码"的内容。请顺序执行以下动作，组合成待审查代码集：

1.  **检查未跟踪文件**:
    - Command: `git ls-files --others --exclude-standard`
    - Action: 读取这些文件的内容。

2.  **检查工作区、暂存区及未推送的提交**:
    - **暂存区**: `git diff --cached`
    - **工作区**: `git diff`
    - **本地提交**: `git log --oneline --no-merges -p @"{u}"..HEAD` (注意：必须通过双引号包裹 @"{u}" 以兼容 PowerShell)。
    
3.  **变更影响分析 (Impact Analysis)**:
    - 对于变动的文件，使用 `view_file` 读取其**最新完整内容**。上下文完整对于代码审查至关重要。
    - **注意**：自动跳过二进制文件（如图片、视频、锁文件），避免读取乱码。

### 第二步：加载审查角色 (Load Roles)

1.  **运行脚本获取提示词列表**:
    - Command (PowerShell): `python $env:WORK_HOME/CodeAgent/skills/local_code_review/scripts/list_prompts.py`
    - Command (Bash/Zsh): `python $WORK_HOME/CodeAgent/skills/local_code_review/scripts/list_prompts.py`
    - Action: **必须**解析脚本输出的每一个 `提示词文件` 路径。严禁跳过任何一个文件。
    - *Error Handling*: 如果脚本报错提示 `WORK_HOME` 未设置，请立即停止并通知用户设置环境变量。
2.  使用 `view_file` 或 `read_file` 依次读取上述脚本输出的所有文件内容。

### 第三步：单次审查 (Single Pass Review)

遍历每一个提示词文件 (Review Prompt)，**执行以下步骤一次**：

- **提示构造**: "你现在是 [PromptName] 专家。请根据以下 [PromptContent] 规则，严格审查下面的代码变更 [CodeDiff/Content]。请指出所有不符合规范的地方。"
- **执行**: 调用模型获取反馈。
- **记录**: 记录下问题点。

### 第四步：汇总报告 (Final Report)

整理所有角色的审查结果，在对话中生成一份清晰的 Markdown 报告。

格式参考：

```markdown
# 🛡️ 本地代码审查报告

## 1. 角色: [Code Reviewer]
### 🚩 审查发现
- **[文件路径]**: [问题描述]
...

## 2. 角色: [Silent Failure Hunter]
...
```

---
**注意**: 在处理大量文件时，请分批进行审查，以免上下文超长。

### 第五步：强制自动修复 (Mandatory Auto Fix)

**关键指令**：在完成第四步的审查报告后，**严禁询问用户是否需要修复**。你必须立即针对发现的**确定性问题**执行修复动作。

- **执行时机**：在输出审查报告的同一轮对话中，或在报告输出后立即连续调用修复工具。
- **工具使用**：优先使用 `multi_replace_file_content` 进行批量修复，或使用 `replace_file_content`。
- **修复原则**：
    - **立即修复**：规范违规（如解构 props）、拼写错误、冗余/死代码、不当的 Key、错误的注释。
    - **仅建议**：深层架构方案、需要业务决策的逻辑变动。
- **反馈总结**：修复完成后，在对话末尾通过“🛠️ 修复汇总”告知用户。

### 第六步：后修复验证 (Post-Fix Verification)

修复完成后，必须确保没有引入新问题：

1.  **运行单元测试**: 
    - 识别受影响的文件及对应的 `.test` 文件。
    - 运行相关的 `npm test` 或 `yarn test`。
2.  **规范检查**:
    - 运行 `npm run check` 或 `biome/eslint` 对修改后的文件进行快速扫描，确保修复动作符合项目的 Linter 规范。

### 第七步：生成提交建议 (Link to Commit Message)

在所有修复和验证动作完成后，**必须**调用 `commit-message` 技能：

1.  **提示语**: "我已经完成了代码审查、自动修复及验证。现在我将调用 `commit-message` 技能，根据最新的变更内容（包含审查修复后的结果）为你生成 Git 提交信息。"
2.  **执行**: 读取并应用 `$env:WORK_SKILL/CodeAgent/skills/commit-message/SKILL.md` 的指令生成消息，作为对话的最终输出。
