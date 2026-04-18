# 任务列表：极简画廊卡片布局

**输入**: 来自 `specs/002-compact-gallery-cards/` 的设计文档
**先决条件**: plan.md, spec.md

**组织方式**: 任务按用户故事分组，以便能够独立实施和测试每个故事。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行
- **[Story]**: 该任务所属的用户故事

## 阶段 1：准备阶段（共享基础设施）

**目的**: 确认当前工作环境

- [ ] T001 确认当前分支为 `002-compact-gallery-cards` 或 `main`
- [ ] T002 再次备份 `src/components/gallery/Gallery.tsx` 为 `Gallery.tsx.v2.bak`

---

## 阶段 2：用户故事 1 - 沉浸式视觉卡片 (优先级: P1) 🎯 MVP

**目标**: 极简化卡片 UI，移除描述和复制按钮，优化 Padding。

- [ ] T003 [US1] 在 `src/components/gallery/Gallery.tsx` 中，删除主列表卡片渲染中的 `COPY` 按钮逻辑
- [ ] T004 [US1] 在 `src/components/gallery/Gallery.tsx` 中，删除主列表卡片渲染中的 `item.description` 渲染代码
- [ ] T005 [US1] 在 `src/components/gallery/Gallery.tsx` 中，将卡片内容区的内边距 `p-6` 减小到 `p-4` 或更低，并移除 `mb-6` 等多余间距
- [ ] T006 [US1] 在 `src/components/gallery/Gallery.tsx` 中，调整 `h3` 标题字体大小（如从 `text-xl` 到 `text-lg`）以适应更小的卡片

---

## 阶段 3：用户故事 2 - 详情页承载完整信息 (优先级: P2)

**目标**: 验证并确保 Modal 中的信息不受影响。

- [ ] T007 [US2] 验证 `src/components/gallery/Gallery.tsx` 中 `selectedItem` (Modal) 的渲染代码中是否完整包含：标题、视角、提示词、复制按钮
- [ ] T008 [US2] 如果 Modal 中受全局样式影响，需进行样式隔离，确保 Modal 中的显示依然美观

---

## 阶段 N：完善与横切关注点

- [ ] T009 运行 `npm run build` 确保无编译错误
- [ ] T010 进行整体视觉回归检查
