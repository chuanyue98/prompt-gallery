# 实施计划：Soft UI 主题切换

**分支**: `005-soft-ui-theme` | **日期**: 2026-04-19 | **规格说明**: [specs/005-soft-ui-theme/spec.md](spec.md)
**输入**: 来自 `/specs/005-soft-ui-theme/spec.md` 的功能规格说明

## 摘要

本功能将在保持现有 cyber-obsidian 默认主题不回退的前提下，为 Prompt Gallery 增加用户可见、可扩展的主题切换能力，并新增一套 Soft UI（新拟物/柔和浮雕）主题。实现将围绕全局主题 token、主题持久化、导航选项框式主题切换以及首页画廊/详情弹层/投稿弹层等高频界面展开，使用户能够无刷新切换主题，并在 Soft UI 模式下获得柔和卡片、胶囊按钮、细腻阴影和明确交互反馈；同时会调整导航品牌标题与图形标识，让其与页面背景氛围更协调。

## 技术上下文

**语言/版本**: TypeScript / Next.js 16.2.4 / React 19.2.4  
**主要依赖**: Next.js App Router, Tailwind CSS 4, next/font, Vitest, Testing Library  
**存储**: 文件系统驱动的 Markdown + JSON 数据；主题偏好使用浏览器本地持久化  
**测试**: `vitest`, `eslint`, 必要时 `next build`  
**目标平台**: Web（桌面优先，同时覆盖常见移动端响应式场景）  
**项目类型**: 单体 Web 应用  
**性能目标**: 主题切换无需页面跳转或整页刷新；首屏主题应用应尽量避免明显闪烁；关键交互动效保持 150–220ms 的柔和反馈  
**约束条件**: 保留现有 cyber-obsidian 主题作为默认体验；不引入新依赖；不改变文件系统数据流；Soft UI 必须在设定面板、小工具、控制板和个人效率式界面中形成一致体验；不得因新主题降低文本与操作辨识度  
**规模/范围**: 影响 `src/app/layout.tsx`、`src/app/globals.css`、`src/app/page.tsx`、`src/components/layout/Navbar.tsx`、`src/components/gallery/Gallery.tsx`、`src/components/gallery/ContributeModal.tsx` 以及相关测试

## 章程检查

*闸口：必须在阶段 0 研究之前通过。在阶段 1 设计后重新检查。*

- [x] **Aesthetic-Driven UX**: 新主题直接服务于审美升级，但需要保留现有默认主题并通过 token 化确保 Soft UI 也满足 “minimalist yet premium” 目标。
- [x] **Community-Led Contributions**: 投稿入口和浏览流程仍保留，不因主题切换增加额外门槛。
- [x] **Data-First Architecture**: 该功能不改动 Markdown/JSON 数据来源，主题偏好仅属于前端展示状态。
- [x] **Modern Tech Stack**: 继续使用现有 Next.js 16、React 19、Tailwind 4 与 TypeScript，不引入额外主题库。
- [x] **Automated Validation & Sync**: 需要补充组件测试并执行 lint / test / build；不影响 `scripts/sync.ts` 的数据职责。

## 项目结构

### 文档 (此功能相关)

```text
specs/005-soft-ui-theme/
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
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── gallery/
│   │   ├── ContributeModal.tsx
│   │   └── Gallery.tsx
│   └── layout/
│       └── Navbar.tsx
└── types/
    └── gallery.ts

tests/
└── components/
    └── gallery.test.tsx
```

**结构决策**: 采用现有单体 Web 应用结构。主题系统落在 `app` 级别的全局样式与布局，界面适配集中在 gallery 与 navbar 组件，测试继续收敛在现有组件测试文件中。

## 复杂度跟踪

无。
