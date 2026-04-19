# 实施计划：精简作品元数据与布局

**分支**: `001-streamline-content-hierarchy` | **日期**: 2026-04-18 | **规格说明**: [specs/001-streamline-content-hierarchy/spec.md](spec.md)
**输入**: 来自 `/specs/001-streamline-content-hierarchy/spec.md` 的功能规格说明

## 摘要

本功能将继续收紧 Prompt Gallery 的信息层级：在保证响应式和现有审美风格不回退的前提下，提高首页单屏展示密度，并从卡片、详情弹层和投稿表单中彻底移除作品 `title` 字段。同时，首页卡片中的模型标签会被强化为更易扫视识别的视觉锚点。实现将主要集中在首页画廊网格、详情弹层、投稿弹层以及相关类型与测试，并通过现有组件测试验证核心交互未受影响。

## 技术上下文

**语言/版本**: TypeScript / Next.js 16.2.4 / React 19  
**主要依赖**: Next.js App Router, Tailwind CSS 4, Vitest, Testing Library  
**存储**: 文件系统驱动的 Markdown + JSON 同步数据  
**测试**: `vitest`, `eslint`, 必要时 `next build`  
**目标平台**: Web（桌面优先，同时覆盖移动端和平板）  
**项目类型**: 单体 Web 应用  
**性能目标**: 首屏在标准桌面宽度下每行至少展示 4 个作品卡片，用户能在 5 秒内识别作品内容与投稿入口，并能直接扫视识别模型标签  
**约束条件**: 保持现有 cyber-obsidian / glassmorphism 审美；不得引入新依赖；不得用新的替代文本重新制造标题层级；模型标签强化应通过现有视觉系统内的颜色或对比度调整实现  
**规模/范围**: 影响 `Gallery` 卡片网格、详情弹层、投稿弹层、作品类型定义及对应组件测试

## 章程检查

*闸口：必须在阶段 0 研究之前通过。在阶段 1 设计后重新检查。*

- [x] **Aesthetic-Driven UX**: 方案目标是减少文案噪音、提高视觉占比，符合“minimalist yet premium”的审美要求。
- [x] **Community-Led Contributions**: 投稿入口被精简但不会被弱化成功能不可发现，仍支持社区投稿路径。
- [x] **Data-First Architecture**: 调整聚焦在展示层与已有同步数据消费方式，不引入数据库或绕过 `npm run sync` 的数据流程。
- [x] **Modern Tech Stack**: 继续使用现有 Next.js 16 + React 19 + Tailwind 体系，不引入额外库或规避类型系统。
- [x] **Automated Validation & Sync**: 计划保留并更新组件测试，执行 lint / test / build 验证，不修改静态数据来源规则。

## 项目结构

### 文档 (此功能相关)

```text
specs/001-streamline-content-hierarchy/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md
```

### 源代码 (仓库根目录)

```text
src/
├── app/
│   └── page.tsx
├── components/
│   ├── gallery/
│   │   ├── Gallery.tsx
│   │   └── ContributeModal.tsx
│   └── layout/
│       └── Navbar.tsx
└── types/
    └── gallery.ts

tests/
└── components/
    └── gallery.test.tsx
```

**结构决策**: 采用单体 Web 应用结构，文档集中在 `specs/001-streamline-content-hierarchy/`，实现集中在首页与 gallery 组件。该功能是典型的前端展示层改动，不需要额外拆分后端结构。

## 复杂度跟踪

无。
