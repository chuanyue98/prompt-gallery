# 实施计划：极简画廊卡片布局

**分支**: `002-compact-gallery-cards` | **日期**: 2026-04-18 | **规格说明**: [specs/002-compact-gallery-cards/spec.md](spec.md)
**输入**: 来自 `/specs/002-compact-gallery-cards/spec.md` 的功能规格说明

## 摘要

本项目旨在通过简化画廊主页卡片的 UI 元素（移除描述、移除复制按钮、调整 Padding），在保持 5 列布局的前提下，极大地提升图片在卡片中的视觉占比，从而强化画廊的视觉吸引力。

## 技术上下文

**语言/版本**: TypeScript / Next.js 16.2.4
**主要依赖**: React 19, TailwindCSS 4
**测试**: 手动视觉验证 + 功能回归测试（弹窗功能是否正常）
**项目类型**: Web 应用程序
**性能目标**: 极简 UI 可能带来微小的渲染性能提升
**约束条件**: 遵循 Cyber-obsidian 美学风格，不得破坏已有的 Modal 显示

## 章程检查

- [x] **Aesthetic-Driven UX**: 完全符合，视觉重心重回图片。
- [x] **Modern Tech Stack**: 继续使用 TailwindCSS v4。
- [x] **Data-First Architecture**: 数据层完全无损。

## 项目结构

### 文档 (此功能相关)

```text
specs/002-compact-gallery-cards/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### 源代码 (仓库根目录)

```text
src/
└── components/
    └── gallery/
        └── Gallery.tsx   # 修改主列表卡片，保留 Modal 完整显示
```

**结构决策**: 仅需对 `Gallery.tsx` 进行精准的代码块移除与样式调整。

## 复杂度跟踪

无。
