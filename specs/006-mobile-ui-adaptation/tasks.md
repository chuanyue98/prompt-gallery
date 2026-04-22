# 任务列表：移动端适配优化 (Mobile UI Adaptation)

**输入**: 来自 `specs/006-mobile-ui-adaptation/` 的设计文档
**先决条件**: plan.md (必填), spec.md (用户故事必填), research.md, data-model.md, ui-layout.md

**测试**: 本功能涉及 UI 响应式调整，建议通过 React Testing Library 验证不同视口下的组件状态，并结合人工浏览器模拟验证。

---

## 依赖关系

### 用户故事完成顺序

1. **阶段 3 (US1)**: 基础导航与画廊网格适配 (P1) - **核心体验**
2. **阶段 4 (US2)**: 详情弹窗移动端重构 (P2)
3. **阶段 5 (US3)**: 投稿流程触控优化 (P3)

---

## 并行机会

- **阶段 3 (US1)** 与 **阶段 4 (US2)** 可以并行，因为它们修改的是不同的组件（Navbar/Gallery 基础 vs Detail Modal 逻辑）。
- **阶段 5 (US3)** 可以独立开发。

---

## 实施策略

### MVP 优先

1. 完成响应式断点的全局配置。
2. 实现 Navbar 和画廊网格的基础移动端布局，确保在 375px 下不溢出。
3. 验证最关键的 P1 路径。

---

## 任务状态说明

- 🟢 **准备就绪**: 先决条件已满足
- 🟡 **阻塞**: 正在等待其他任务
- 🔴 **暂停**: 任务已推迟

---

## 阶段 1: 设置 (Setup)

**目标**: 验证开发环境并准备响应式测试工具。

- [x] T001 验证当前 TailwindCSS v4 配置，确保断点符合 `ui-layout.md` 定义
- [x] T002 确认本地开发环境支持移动端模拟调试

---

## 阶段 2: 基础 (Foundational)

**目标**: 建立全局响应式基础样式。

- [x] T003 在 `src/app/globals.css` 中根据 `ui-layout.md` 优化移动端阴影 (Spread) 和点击反馈变量
- [x] T004 为 `src/components/gallery/Gallery.tsx` 的 Grid 容器添加响应式内边距契约

---

## 阶段 3: 用户故事 1 - 移动端响应式画廊浏览 (US1)

**目标**: 确保 Navbar 不溢出，画廊网格在移动端显示 2 列。

**独立测试**: 在宽度 < 640px 环境下，Navbar 元素不重叠，网格显示 2 列且无水平滚动。

- [x] T005 [P] [US1] 重构 `src/components/layout/Navbar.tsx`：隐藏移动端下的文字标签，改用精简图标/缩写模式
- [x] T006 [P] [US1] 调整 `src/components/layout/Navbar.tsx` 中的主题切换器宽度，使其在 320px 屏幕上自适应
- [x] T007 [US1] 修改 `src/components/gallery/Gallery.tsx` 的网格类：从 `sm:grid-cols-2` 调整为默认 `grid-cols-2`，极窄屏 `max-[340px]:grid-cols-1`
- [x] T008 [US1] 补齐针对 Navbar 移动端折叠逻辑的交互测试 `tests/components/navbar.test.tsx`

---

## 阶段 4: 用户故事 2 - 移动端详情页与操作交互 (US2)

**目标**: 详情弹窗全屏化及内容垂直堆叠。

**独立测试**: 手机端点击作品，详情以 Full Sheet 模式弹出，内容上下排列，按钮易于点击。

- [x] T009 [US2] 修改 `src/components/gallery/Gallery.tsx` 中的 `selectedItem` 弹窗容器类：移动端 `rounded-none` 或 `rounded-t-3xl`，全屏宽度
- [x] T010 [US2] 重构详情页内容布局：将 `md:flex-row` 改为默认 `flex-col`，确保媒体区与内容区在移动端垂直分布
- [ ] T011 [US2] 在 `src/components/gallery/Gallery.tsx` 中为移动端详情页图片添加 `max-h-[35vh]` 限制
- [ ] T012 [US2] 在 `src/components/gallery/Gallery.tsx` 中实现 Lightbox 全屏预览逻辑及样式
- [x] T013 [P] [US2] 优化详情页操作按钮点击区域：在 `src/components/gallery/Gallery.tsx` 中为移动端按钮增加 `min-h-[44px]` 逻辑
- [x] T014 [US2] 验证并补齐详情页移动端滚动锁定逻辑测试 `tests/components/gallery.test.tsx`

---

## 阶段 5: 用户故事 3 - 移动端投稿流程适配 (US3)

**目标**: 投稿表单在窄屏下的紧凑布局。

**独立测试**: 移动端打开投稿页，表单字段不超出屏幕，软键盘弹出时不导致布局崩溃。

- [x] T013 [US3] 修改 `src/components/gallery/ContributeModal.tsx`：将“模型”与“标签”的 2 列布局在移动端降级为单列
- [x] T014 [US3] 移除 `src/components/gallery/ContributeModal.tsx` 媒体预览区的固定最小高度，改为响应式高度
- [x] T015 [US3] 优化投稿成功后的反馈视图，确保在小屏幕上居中对齐且视觉完整

---

## 阶段 6: 润色与交叉验证 (Polish)

**目标**: 确保全局一致性和性能达标。

- [x] T016 执行全量 `npm run build` 验证生产环境响应式样式打包
- [x] T017 人工通过 Lighthouse 验证移动端 Accessibility 评分
- [x] T018 运行全量 `npm test` 确保 84%+ 覆盖率门禁未被破坏
