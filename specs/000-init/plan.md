# 实施计划：初始化 Prompt Gallery 基线

**分支**: `000-init` | **日期**: 2026-04-18 | **规格说明**: [specs/000-init/spec.md](spec.md)  
**输入**: 来自 `/specs/000-init/spec.md` 的功能规格说明

## 摘要

本计划定义 Prompt Gallery 在 `001` 之前的初始产品基线：一个以高视觉风格为核心的静态画廊站点，支持浏览、搜索、分类筛选、详情复制、网页投稿与 Markdown/JSON 数据同步。计划刻意保留三列桌面布局，以作为后续 `001`、`002`、`003`、`004` 的演进起点。

## 技术上下文

**语言/版本**: TypeScript / Next.js 16.2.4 / React 19  
**主要依赖**: TailwindCSS 4, Next Image, gray-matter, fs-extra, Octokit, GitHub App Auth  
**存储**: `public/data/` 下的 Markdown + 媒体文件，构建为 `public/gallery-data.json`  
**测试**: 以手动验证与脚本验收为主；自动化测试不属于 `000-init` 范围  
**目标平台**: Web（Desktop 优先，同时保持移动端可用）  
**项目类型**: 单仓库 Next.js Web 应用  
**性能目标**: 首页在静态 JSON 可用时应快速完成首屏数据展示与交互  
**约束条件**: 保持 cyber-obsidian / glassmorphism 视觉风格；坚持 git-first 与 file-based data flow

## 章程检查

- [x] **Aesthetic-Driven UX**: 首页、卡片、详情与投稿弹窗都围绕高视觉风格构建。
- [x] **Community-Led Contributions**: 规划中包含网页投稿入口与 GitHub PR 自动化流程。
- [x] **Data-First Architecture**: 所有展示数据均来自 `public/data/` 与同步脚本生成的静态 JSON。
- [x] **Modern Tech Stack**: 使用 Next.js App Router、TypeScript、TailwindCSS 4 的现有栈。
- [x] **Automated Validation & Sync**: 将 `scripts/sync.ts` 视为静态数据生成的唯一入口。

## 项目结构

### 文档（此功能相关）

```text
specs/000-init/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── contribute-api.md
└── tasks.md
```

### 源代码（仓库根目录）

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/contribute/route.ts
├── components/
│   ├── gallery/
│   │   ├── Gallery.tsx
│   │   └── ContributeModal.tsx
│   └── layout/Navbar.tsx
├── lib/utils.ts
└── types/gallery.ts

scripts/
└── sync.ts

public/
├── data/
└── gallery-data.json
```

**结构决策**: 初始版本保持单仓库、单应用结构，不引入额外服务层拆分；核心复杂性集中在画廊展示、GitHub 投稿接口与数据同步脚本。

## Phase 0: Research

详见 [research.md](research.md)。本阶段确认初始基线需要保留桌面三列布局、文件系统驱动的数据模型，以及 GitHub App PR 投稿方式。

## Phase 1: Design & Contracts

- 数据模型详见 [data-model.md](data-model.md)
- 投稿接口约定详见 [contracts/contribute-api.md](contracts/contribute-api.md)
- 手动验收流程详见 [quickstart.md](quickstart.md)

## 复杂度跟踪

无违例项。`000-init` 选择最直接的静态文件驱动方案，不引入数据库、后台管理系统或独立媒体服务。
