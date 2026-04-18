---

description: "功能实施的任务列表：优化画廊布局并移除 Seed 参数"
---

# 任务列表：优化画廊布局并移除 Seed 参数

**输入**: 来自 `specs/001-optimize-layout-remove-seed/` 的设计文档
**先决条件**: plan.md (必填), spec.md (用户故事必填), research.md, data-model.md, quickstart.md

**测试**: 本项目主要通过手动视觉验证和响应式测试进行验证。

**组织方式**: 任务按用户故事分组，以便能够独立实施和测试每个故事。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行（不同文件，无依赖关系）
- **[Story]**: 该任务所属的用户故事（例如：US1, US2）
- 在描述中包含确切的文件路径

## 阶段 1：准备阶段（共享基础设施）

**目的**: 项目初始化和基础确认

- [x] T001 确认当前开发分支为 `main`
- [x] T002 [P] 检查并确认 `tailwind.config.ts` 或相关配置支持自定义断点（当前使用标准类）

---

## 阶段 2：基础阶段（阻塞性先决条件）

**目的**: 在实施用户故事之前必须完成的核心调整

- [x] T003 备份受影响的组件文件：`src/components/gallery/Gallery.tsx` 和 `src/components/gallery/ContributeModal.tsx`

**检查点**: 准备就绪 - 现在可以开始用户故事的实施

---

## 阶段 3：用户故事 1 - 更紧凑的画廊布局 (优先级: P1) 🎯 MVP

**目标**: 提高画廊网格的显示密度，在大屏幕上显示 4-5 列

**独立测试**: 在浏览器中打开画廊，调整窗口宽度至 1280px 以上，确认每行显示至少 4 个项目。

### 用户故事 1 的实施

- [x] T004 [US1] 在 `src/components/gallery/Gallery.tsx` 中修改 Grid 容器的类名，增加 `sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5` 支持
- [x] T005 [US1] 在 `src/components/gallery/Gallery.tsx` 中将网格间距 `gap-10` 调整为 `gap-6` 以适应更高密度
- [x] T006 [US1] 在 `src/components/gallery/Gallery.tsx` 中微调卡片内边距（如 `p-8` 调整为 `p-6`）以优化小尺寸下的视觉比例

**检查点**: 此时，画廊布局应已更新且响应式表现良好

---

## 阶段 4：用户故事 2 - 简化参数显示 (优先级: P2)

**目标**: 从界面中完全移除 “Seed” 参数

**独立测试**: 检查画廊详情模态框和投稿表单，确认不再显示任何与 “Seed” 相关的字段。

### 用户故事 2 的实施

- [x] T007 [US2] 在 `src/components/gallery/Gallery.tsx` 的详情模态框（Modal）渲染逻辑中，删除 Seed 显示区块
- [x] T008 [US2] 在 `src/components/gallery/ContributeModal.tsx` 中检查并移除任何残留的 Seed 输入字段（确认已无相关输入）
- [x] T009 [US2] 在 `src/app/api/contribute/route.ts` 中确保生成的 `index.md` 内容不再包含（或不再硬编码要求）Seed 字段逻辑（当前为可选，保持一致性）
- [x] T010 [P] [US2] 在 `scripts/sync.ts` 中优化同步逻辑，在生成 JSON 时显式删除 `seed` 属性

**检查点**: 此时，Seed 参数已从用户界面中彻底消失

---

## 阶段 N：完善与横切关注点

**目的**: 确保整体质量和文档更新

- [x] T011 [P] 运行 `npm run lint` 检查是否有代码规范违规 (已修复 sync.ts 的 any 类型问题)
- [x] T012 运行 `npm run build` 确保项目编译正常
- [x] T013 更新 `specs/001-optimize-layout-remove-seed/quickstart.md` 以反映最终的实施细节

---

## 依赖关系与执行顺序

### 阶段依赖

- **准备阶段 (阶段 1)**: 无依赖项
- **基础阶段 (阶段 2)**: 依赖于阶段 1
- **用户故事 (阶段 3 & 4)**: 依赖于基础阶段的完成
  - US1 和 US2 在文件修改层面有交集（都在 `Gallery.tsx`），建议按顺序执行
- **完善阶段**: 依赖于所有用户故事的完成

### 并行机会

- 阶段 4 中的 T010 可以与其他任务并行执行。
- 阶段 N 中的 T011 可以在实施完成后立即开始。

---

## 实施策略

### MVP 优先（用户故事 1）

1. 完成布局调整（US1），这是用户最直观的诉求。
2. 验证响应式效果。

### 增量交付

1. 交付更紧凑的布局。
2. 紧接着移除 Seed 显示，完成界面简化。

---

## 备注

- 所有任务均在单库结构下进行。
- 重点在于 Tailwind 类的精确修改，以确保 Cyber-obsidian 美学不受损。
