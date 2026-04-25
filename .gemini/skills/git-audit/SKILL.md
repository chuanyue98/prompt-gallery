---
name: git-audit
description: Git 差异审计能力，帮助 AI 过滤非必要的代码变动，专注于核心逻辑改动。
---

# Git Audit Skill
Git 差异审计能力，帮助 AI 过滤非必要的代码变动，专注于核心逻辑改动。

## Capabilities
- **find_diffs.py**: 查找两个分支之间的差异并生成报告。
- **find_comment_only_diffs.py**: 过滤掉仅修改注释的差异，识别真正的逻辑变更。

## Usage
AI 可以调用 `scripts/` 下的 Python 脚本进行自动化审计。
