---
name: pr-hygiene
description: 专门用于在创建 Pull Request (PR) 前检查并修复“无意义修改”的技能。当 Agent 准备提交代码、准备 commit 或创建 PR 时使用。该技能会扫描 Git 变更，识别并回滚那些不增加逻辑价值、仅造成代码噪音的细微措辞改动（如 Docstring 中将“用户名”改为“代理名”，或错误消息中将 "Agency Name" 改为 "Agency name" 等）。
---

# PR 卫生检查与修复指南 (PR Hygiene)

## 核心目标
在 PR 提交前过滤掉“噪音修改”，确保 Reviewer 专注于真正的功能或逻辑变更。

## 触发场景
1. 执行 `git commit` 前。
2. 执行 `gh pr create` 前。
3. 当用户要求“检查 PR 质量”或“清理无用改动”时。

## 审查与修复规范

### 1. 术语一致性保护 (Terminology Protection)
- **禁止无意义替换**：如果原有术语（如“用户名”、“用户 ID”）在上下文中已能清晰表达意图，严禁将其微调为同义词（如“代理名”、“代理 ID”），除非这是本次重构的明确目标。
- **修复动作**：发现此类替换时，应将文本还原为 master 分支的原始状态。

### 2. 报错信息微调过滤 (Error Message Noise Reduction)
- **禁止非关键性修改**：严禁对报错信息进行仅涉及大小写（"Name" -> "name"）、标点符号或语气词的修改。
- **示例**：
  - ❌ `Agency Name already exists` -> `Agency name already exists`
  - ❌ `Agency Name too long` -> `Agency name is too long`
- **修复动作**：还原为原始报错字符串。

### 3. Docstring 冗余改动 (Docstring Hygiene)
- **禁止重复/混合注释**：严禁在 Docstring 中保留新旧两份注释，或将简洁的单行注释改为冗余的多行注释而未增加信息量。
- **修复动作**：清理冗余行，保留最简洁且符合项目风格的版本。

### 4. 变量名缩写还原
- **禁止随意缩写**：除非是重构目标，否则严禁将原本完整的变量名缩写（如 `RecentlyJoined` -> `Recently`）。
- **修复动作**：还原为完整命名。

## 操作流程

1. **获取变更集**：使用 `git diff HEAD` 查看当前暂存和未暂存的改动。
2. **逻辑比对**：
   - 提取所有被修改的字符串（Strings）和注释（Comments）。
   - 将修改前后的内容进行相似度对比。
   - 如果差异仅在于：同义词替换、大小写微调、连词增减，且不影响逻辑功能，则判定为“噪音”。
3. **执行修复**：
   - 使用 `replace` 或 `write_file` 将噪音部分还原。
   - 重新运行 `git diff` 确认噪音已消除。
4. **验证**：确保修复后代码依然通过单元测试和 Lint。

## 示例 (修复前 vs 修复后)

**❌ 噪音修改 (PR 中不应出现):**
```python
class AgencyNameAlreadyExists(EngineException):
    """
    用户名已存在
    代理名已经存在
    """
    error_message = "Agency Name already exists"
```

**✅ 修复后的纯净状态:**
```python
class AgencyNameAlreadyExists(EngineException):
    """
    用户名已存在
    """
    error_message = "Agency Name already exists"
```
