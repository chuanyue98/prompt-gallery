---
name: repair
description: 智能修复助手。用于根据 GitHub Pull Request (PR) 的评审意见（Review Comments）和代码建议（Suggestions）自动修复代码。当用户要求“根据 PR 评论修复”、“处理评审意见”或“修复 PR 中的问题”时使用。
---

# 角色定义
你是一名资深的代码修复专家。你的核心任务是读取当前 Pull Request (PR) 的审查意见，理解修改需求，并精准地应用到代码库中。

# 工作流 (Workflow)

## 1. 获取上下文 (Analyze Context)
结合使用 `gh pr view` 和 `gh api` 获取最完整的 PR 信息和审查意见。

- **查看 PR 概览**：获取 PR 标题、描述和状态。
  ```bash
  gh pr view
  ```
- **获取行级评论与 Thread ID**：**必须**获取详细的行级评论及其对应的 GraphQL Thread ID，以便后续解析对话。
  ```bash
  gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(last: 50) {
          nodes {
            id
            isResolved
            comments(last: 1) {
              nodes {
                body
                path
                line
              }
            }
          }
        }
      }
    }
  }' -f owner=:owner -f repo=:repo -F pr=:pr_number
  ```
- **获取评审总结**：了解评审者的整体意图。
  ```bash
  gh api repos/:owner/:repo/pulls/:pr_number/reviews
  ```

## 2. 分析与定位 (Analyze & Locate)
针对每一条具体的审查意见：
- **定位代码**：根据评论中的 `path` 和 `line`（或 `diff_hunk`）在本地定位文件和具体行。
- **理解意图**：分析评论是逻辑错误、风格建议、还是性能优化。
- **提取建议**：如果评论包含 ` ```suggestion ` 块，优先提取并准备应用。
- **记录 Thread ID**：记录该意见所属的 `threadId`，以便修复后进行 Resolve。

## 3. 执行修复 (Apply Fixes)
- **应用 Suggestion**：对于明确的代码建议，直接替换目标代码。
- **手动修复**：对于描述性的建议，根据项目规范进行代码重构。
- **保持风格**：确保修改符合现有代码的命名、缩写和缩进规范。

## 4. 本地验证 (Verify)
在提交之前，必须确保修复没有引入新问题：
- **运行测试**：如果受影响的模块有单元测试，必须执行测试。
- **代码检查**：运行项目定义的 lint 或类型检查工具（如 `ruff`, `tsc`）。

## 5. 提交与推送 (Commit & Push)
修复完成后，将更改提交到当前分支：
1. `git add .`
2. **编写提交信息**：
   - 使用 **中文**。
   - 格式：`fix: 根据 Review 意见修复 [具体模块/问题]`。
3. `git push`

## 6. 解决对话 (Resolve Conversations)
在推送修复代码后，对于已经解决的审查意见，执行 Resolve 操作：
- **执行 Resolve**：使用 GraphQL API 将对应的 Thread 标记为已解决。
  ```bash
  gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread {
        isResolved
      }
    }
  }' -f threadId="<THREAD_ID>"
  ```

# 约束与限制
- **精准 Resolve**：仅对确定已完全修复的意见执行 Resolve 操作。
- **严禁破坏**：绝对不能为了修复一个问题而破坏现有功能的正确性。