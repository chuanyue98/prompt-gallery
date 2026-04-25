# 实施计划：移动端适配优化 (Mobile UI Adaptation)

**分支**: `006-mobile-ui-adaptation` | **日期**: 2026-04-22 | **规格说明**: [specs/006-mobile-ui-adaptation/spec.md](spec.md)
**输入**: 来自 `/specs/006-mobile-ui-adaptation/spec.md` 的功能规格说明

## 摘要

本项目旨在通过响应式设计（Responsive Design）全面提升 Prompt Gallery 在手机端的浏览体验。主要技术方案包括：利用 TailwindCSS v4 的媒体查询优化网格布局、精简移动端 Navbar、实现全屏详情弹窗。针对详情页，将减小移动端初始图片显示高度以提升信息密度，并增加跨端通用的“点击图片全屏预览（Lightbox）”功能。

## 技术上下文

**语言/版本**: TypeScript, React 19, Next.js 16.2.4  
**主要依赖**: TailwindCSS v4.0  
**存储**: 静态文件系统 (JSON/Markdown)  
**测试**: Vitest, React Testing Library  
**目标平台**: 移动端浏览器 (iOS/Android Safari, Chrome), 平板及桌面端
**项目类型**: Next.js Web 应用程序 (App Router)  
**性能目标**: Lighthouse Accessibility >= 90  
**约束条件**: 保持“赛博黑曜石”及“Soft UI”审美，不增加冗余库，不破坏现有的 84%+ 测试覆盖率门禁
**规模/范围**: 涉及 Navbar, Gallery, ContributeModal, DetailModal 等核心组件的样式调整

## 章程检查

*闸口：必须在阶段 0 研究之前通过。在阶段 1 设计后重新检查。*

1. **审美驱动的 UX**: 移动端适配必须维持高保真视觉效果，不能为了适配而牺牲“极简而高端”的审美。 (✅ 满足)
2. **数据优先架构**: 适配工作不涉及数据结构变更，仅为 UI 表现层调整。 (✅ 满足)
3. **现代技术栈**: 使用 TailwindCSS v4 媒体查询，符合 React 19 规范。 (✅ 满足)
4. **自动化验证**: 必须补齐移动端交互的测试，确保覆盖率不下降。 (✅ 满足)
5. **构建验证**: 推送前必须执行 `npm run build`。 (✅ 承诺)

## 项目结构

### 文档 (此功能相关)

```text
specs/006-mobile-ui-adaptation/
├── plan.md              # 本文件
├── research.md          # 阶段 0 输出
├── data-model.md        # 阶段 1 输出
├── quickstart.md        # 阶段 1 输出
├── checklists/          # 质量检查单
│   └── requirements.md
└── tasks.md             # 任务列表
```

### 源代码 (关键调整位置)

```text
src/
├── components/
│   ├── gallery/
│   │   ├── Gallery.tsx          # 网格列数响应式调整，弹窗全屏化
│   │   └── ContributeModal.tsx  # 投稿表单触控优化
│   └── layout/
│       └── Navbar.tsx           # 移动端精简布局
└── app/
    └── globals.css              # 补充全局响应式变量 (如有)
```

**结构决策**: 采用单项目结构，直接在现有组件中通过 Tailwind 类实现响应式。
