<!--
Sync Impact Report:
Version change: [ALL_CAPS_TOKEN] -> 1.0.0
List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. Aesthetic-Driven UX
  - [PRINCIPLE_2_NAME] -> II. Community-Led Contributions
  - [PRINCIPLE_3_NAME] -> III. Data-First Architecture (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] -> IV. Modern Tech Stack (Next.js 16 + React 19)
  - [PRINCIPLE_5_NAME] -> V. Automated Validation & Sync
Added sections:
  - Technology Stack & Constraints
  - Contribution & Review Workflow
Removed sections:
  - None
Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated - reviewed for alignment)
  - .specify/templates/spec-template.md (✅ updated - reviewed for alignment)
  - .specify/templates/tasks-template.md (✅ updated - reviewed for alignment)
Follow-up TODOs:
  - None
-->

# Prompt Gallery 项目宪法

## 核心原则

### I. 审美驱动的 UX
画廊必须优先考虑高保真视觉效果（赛博黑曜石风格、玻璃拟态）和沉浸式体验（视频悬停预览、Framer Motion 动画）。每一个 UI 元素都必须为“极简而高端”的审美做出贡献。

### II. 社区驱动的贡献
支持通过网页端（GitHub App）和本地（Markdown/JSON）两种工作流进行便捷投稿。自动化流程（GitHub Actions）处理数据同步和 PR 管理，确保创作者的参与门槛降至最低。

### III. 数据优先架构（不可逾越）
所有提示词数据和视觉资产均通过本地 Markdown 文件 (Frontmatter) 和 JSON 进行管理。任何类似数据库的行为必须由文件系统同步（`npm run sync`）支持。代码库保持可移植性，并以 git 为中心。

### IV. 现代技术栈（Next.js 16 + React 19）
使用最新的 App Router 模式、TailwindCSS v4 和 TypeScriptBox。所有组件必须是类型安全的，并遵循项目的极简设计哲学。严禁使用过时的库或绕过类型系统的“临时偏方”。

### V. 自动化验证与同步
每次贡献都必须通过自动化检查（Linting、同步脚本）。`scripts/sync.ts` 是生成画廊静态数据的唯一事实来源。不鼓励手动向 JSON 文件录入数据；请使用同步脚本。

**【强制准则】在推送到远程分支前，必须执行全量项目构建（`npm run build`）。**

## 技术栈与约束

框架：Next.js 16.2.4 (App Router)。样式：TailwindCSS 4.0。运行时：Node.js 20+。包管理器：npm。类型系统：严格模式 TypeScript。所有资产必须存储在 `public/data/` 目录下。

## 贡献与评审流程

网页提交通过 GitHub App 触发自动化 PR。本地提交在创建 PR 前必须运行 `npm run sync`。代码评审必须核实是否符合赛博黑曜石审美，并确保 `index.md` 中的元数据完整准确。

## 治理

本宪法高于任何临时性的设计决策。所有 PR 必须符合“审美驱动”原则。任何增加复杂度的行为必须经过“极简目标”的严格权衡。修改本宪法需达成共识并同步更新此文档。

**Version**: 1.0.0 | **Ratified**: 2026-04-18 | **Last Amended**: 2026-04-18
