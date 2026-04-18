# 实施计划：[功能名称]

**分支**: `[###-feature-name]` | **日期**: [DATE] | **规格说明**: [链接]
**输入**: 来自 `/specs/[###-feature-name]/spec.md` 的功能规格说明

**注意**: 此模板由 `/speckit.plan` 命令填充。有关执行流程，请参阅 `.specify/templates/plan-template.md`。

## 摘要

[从功能规格说明中提取：主要需求 + 研究得出的技术方案]

## 技术上下文

<!--
  需要操作：将此部分内容替换为项目的具体技术细节。
  此处结构仅作为引导迭代过程的建议。
-->

**语言/版本**: [例如：Python 3.11, Swift 5.9, Rust 1.75 或 需要澄清]  
**主要依赖**: [例如：FastAPI, UIKit, LLVM 或 需要澄清]  
**存储**: [如果适用，例如：PostgreSQL, CoreData, 文件 或 不适用]  
**测试**: [例如：pytest, XCTest, cargo test 或 需要澄清]  
**目标平台**: [例如：Linux 服务器, iOS 15+, WASM 或 需要澄清]
**项目类型**: [例如：库/CLI/Web 服务/移动应用/编译器/桌面应用 或 需要澄清]  
**性能目标**: [领域特定，例如：1000 req/s, 10k lines/sec, 60 fps 或 需要澄清]  
**约束条件**: [领域特定，例如：<200ms p95, <100MB 内存, 支持离线 或 需要澄清]  
**规模/范围**: [领域特定，例如：1万用户, 100万行代码, 50个页面 或 需要澄清]

## 章程检查

*闸口：必须在阶段 0 研究之前通过。在阶段 1 设计后重新检查。*

[基于项目章程文件确定的检查项]

## 项目结构

### 文档 (此功能相关)

```text
specs/[###-feature]/
├── plan.md              # 本文件 (/speckit.plan 命令输出)
├── research.md          # 阶段 0 输出 (/speckit.plan 命令)
├── data-model.md        # 阶段 1 输出 (/speckit.plan 命令)
├── quickstart.md        # 阶段 1 输出 (/speckit.plan 命令)
├── contracts/           # 阶段 1 输出 (/speckit.plan 命令)
└── tasks.md             # 阶段 2 输出 (/speckit.tasks 命令 - 非 /speckit.plan 创建)
```

### 源代码 (仓库根目录)
<!--
  需要操作：将下方的占位树替换为此功能的具体布局。
  删除未使用的选项，并使用实际路径（例如 apps/admin, packages/something）扩展所选结构。
  交付的计划中不应包含“选项”标签。
-->

```text
# [如果未使用请删除] 选项 1: 单一项目 (默认)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [如果未使用请删除] 选项 2: Web 应用程序 (当检测到“前端”+“后端”时)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [如果未使用请删除] 选项 3: 移动端 + API (当检测到“iOS/Android”时)
api/
└── [同上方的后端结构]

ios/ 或 android/
└── [平台特定结构：功能模块、UI 流程、平台测试]
```

**结构决策**: [记录所选结构并引用上方捕获的实际目录]

## 复杂度跟踪

> **仅在“章程检查”存在必须解释的违规项时填写**

| 违规项 | 必要性原因 | 拒绝更简单方案的原因 |
|-----------|------------|-------------------------------------|
| [例如：第4个项目] | [当前需求] | [为什么3个项目不够用] |
| [例如：Repository 模式] | [特定问题] | [为什么直接访问数据库不够用] |
