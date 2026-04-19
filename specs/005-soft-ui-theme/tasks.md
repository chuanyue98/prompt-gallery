---

description: "功能实施的任务列表：Soft UI 主题切换"
---

# 任务列表：Soft UI 主题切换

**输入**: 来自 `/specs/005-soft-ui-theme/` 的设计文档
**先决条件**: plan.md (必填), spec.md (用户故事必填), research.md, data-model.md, contracts/, quickstart.md

**测试**: 需要更新 `tests/components/gallery.test.tsx`，并在完成后执行 `npm run lint`、`npm run test`，必要时执行 `npm run build`。

**组织方式**: 任务按用户故事分组，以便能够独立实施和测试每个故事。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行（不同文件，无依赖关系）
- **[Story]**: 该任务所属的用户故事（例如：US1, US2, US3）
- 在描述中包含确切的文件路径

## 阶段 1：准备阶段（共享基础设施）

**目的**: 确认当前主题相关文件范围、现有样式入口和测试基线

- [X] T001 确认当前特性目录 `specs/005-soft-ui-theme/`、分支 `005-soft-ui-theme` 与 `AGENTS.md` 引用一致
- [X] T002 [P] 复核 `src/app/layout.tsx`、`src/app/globals.css`、`src/app/page.tsx` 的现有主题与页面壳层实现，记录硬编码样式入口
- [X] T003 [P] 复核 `src/components/layout/Navbar.tsx`、`src/components/gallery/Gallery.tsx`、`src/components/gallery/ContributeModal.tsx` 的主题相关热点区域
- [X] T004 [P] 复核 `tests/components/gallery.test.tsx` 的现有覆盖范围，确认可复用的主题切换与组件断言基线

---

## 阶段 2：基础阶段（阻塞性先决条件）

**目的**: 建立所有用户故事共享的主题 token、主题偏好模型与布局注入点

**⚠️ 关键提示**: 在此阶段完成之前，不得开始任何用户故事的工作

- [X] T005 在 `src/app/globals.css` 中建立默认主题与 Soft UI 主题的全局语义化 CSS 变量和基础表面 token
- [X] T006 [P] 在 `src/app/layout.tsx` 中实现主题根节点标识、初始主题恢复和全局主题注入入口
- [X] T007 [P] 在 `src/lib/` 下新增主题配置与主题偏好工具文件，定义 `ThemeOption`、默认主题与本地持久化读写逻辑
- [X] T008 在 `tests/components/gallery.test.tsx` 中补充共享主题基线断言，覆盖默认主题回退和主题持久化恢复所需测试桩

**检查点**: 主题基础设施已就绪，可以开始按用户故事推进界面切换与主题适配

---

## 阶段 3：用户故事 1 - 切换界面主题 (优先级: P1) 🎯 MVP

**目标**: 让用户可以从全局入口切换默认主题与 Soft UI 主题，并在刷新后保持选择

**独立测试**: 打开应用，使用导航中的主题切换入口在默认主题与 Soft UI 之间切换，确认界面即时变化，刷新后仍恢复上次选择

### 用户故事 1 的测试

- [X] T009 [P] [US1] 在 `tests/components/gallery.test.tsx` 中编写主题切换入口渲染与切换行为测试
- [X] T010 [P] [US1] 在 `tests/components/gallery.test.tsx` 中编写主题偏好持久化与无效值回退测试

### 用户故事 1 的实施

- [X] T011 [US1] 在 `src/components/layout/Navbar.tsx` 中新增全局主题切换选项框，并显示当前主题状态
- [X] T012 [US1] 在 `src/app/page.tsx` 中将页面壳层、背景氛围和 footer 改为消费全局主题 token
- [X] T013 [US1] 在 `src/app/layout.tsx` 与 `src/lib/` 下的主题工具文件中串联主题切换事件与偏好持久化

**检查点**: 用户故事 1 可独立演示，用户已能发现并使用主题切换功能

---

## 阶段 4：用户故事 2 - 使用 Soft UI 控件体验 (优先级: P2)

**目标**: 让 Soft UI 主题在导航、画廊、详情弹层和投稿弹层中形成一致的柔和浮雕控件体验

**独立测试**: 在 Soft UI 主题下浏览导航、搜索框、筛选器、卡片、详情弹层和投稿弹层，确认主要表面、按钮与输入区都具备一致的柔和浮雕风格和交互反馈

### 用户故事 2 的测试

- [X] T014 [P] [US2] 在 `tests/components/gallery.test.tsx` 中补充 Soft UI 主题下导航、搜索框和分类切换器的表面样式断言
- [X] T015 [P] [US2] 在 `tests/components/gallery.test.tsx` 中补充 Soft UI 主题下卡片、详情弹层和投稿弹层关键控件的样式与状态断言

### 用户故事 2 的实施

- [X] T016 [US2] 在 `src/components/layout/Navbar.tsx` 中应用 Soft UI 主题下的导航容器、按钮和主题选中态样式
- [X] T017 [US2] 在 `src/components/gallery/Gallery.tsx` 中改造搜索框、分类切换器、卡片、快捷复制按钮和详情弹层，使其消费共享主题表面 token
- [X] T018 [US2] 在 `src/components/gallery/ContributeModal.tsx` 中改造预览区、模式切换器、输入框和提交按钮，使其在 Soft UI 主题下符合柔和浮雕风格
- [X] T019 [US2] 在 `src/app/globals.css` 中补充 Soft UI 专用的 hover、active、focus、selected 表面状态与阴影语义

**检查点**: 用户故事 2 可独立演示，Soft UI 主题已在关键界面形成一致材质和状态反馈

---

## 阶段 5：用户故事 3 - 保持长时间使用舒适度 (优先级: P3)

**目标**: 在 Soft UI 主题下进一步校正对比度、层级和边缘情况，保证长时间浏览依然舒适清晰

**独立测试**: 在 Soft UI 主题下连续浏览首页、详情弹层和投稿弹层，检查文字、图标、标签、按钮及未专门美化区域的层级是否清晰，快速切换主题也不出现残留样式

### 用户故事 3 的测试

- [X] T020 [P] [US3] 在 `tests/components/gallery.test.tsx` 中补充 Soft UI 主题下可读性、标签层级和快速切换无残留的回归测试

### 用户故事 3 的实施

- [X] T021 [US3] 在 `src/app/globals.css` 中调整 Soft UI 主题的对比度、文本层级、微高光和阴影强度，确保长时间使用舒适
- [X] T022 [US3] 在 `src/app/page.tsx`、`src/components/gallery/Gallery.tsx`、`src/components/gallery/ContributeModal.tsx` 中清理残余硬编码色值并补足未适配区域的主题回退样式
- [X] T023 [US3] 在 `src/components/layout/Navbar.tsx` 与 `src/app/layout.tsx` 中处理快速切换主题时的状态同步与视觉残留边缘情况

**检查点**: 所有用户故事在 Soft UI 主题下均具备稳定、舒适且清晰的长期使用体验

---

## 阶段 N：完善与横切关注点

**目的**: 完成文档同步、验证与最终回归

- [X] T024 [P] 更新 `specs/005-soft-ui-theme/quickstart.md` 中与最终实现不一致的验证说明
- [X] T025 运行 `npm run lint`
- [X] T026 运行 `npm run test`
- [X] T027 运行 `npm run build`

---

## 依赖关系与执行顺序

### 阶段依赖

- **准备阶段 (阶段 1)**: 无依赖，可立即开始
- **基础阶段 (阶段 2)**: 依赖准备阶段完成，阻塞全部用户故事
- **用户故事阶段 (阶段 3-5)**: 全部依赖基础阶段完成；建议按 P1 → P2 → P3 顺序增量推进
- **完善阶段 (阶段 N)**: 依赖所有目标用户故事完成

### 用户故事依赖

- **US1**: MVP，可在阶段 2 完成后独立实施和验证
- **US2**: 依赖主题切换与 token 基础设施完成，并以 US1 的切换能力为前提
- **US3**: 依赖 US1、US2 已完成的主题外观与控件适配，用于做对比度和边缘情况收口

### 每个用户故事内部

- 测试任务先于对应实现任务
- 主题入口与持久化先于页面壳层消费
- 共享表面状态语义先于组件细节打磨
- 可读性和边缘情况收口放在主题主要适配完成之后

### 并行机会

- T002、T003、T004 可并行
- T006、T007、T008 可并行
- T009 与 T010 可并行
- T014 与 T015 可并行
- T024 可与最终验证准备并行

---

## 并行示例：用户故事 2

```bash
# 同时准备 Soft UI 关键界面的测试覆盖：
任务: "在 tests/components/gallery.test.tsx 中补充导航、搜索框和分类切换器的 Soft UI 样式断言"
任务: "在 tests/components/gallery.test.tsx 中补充卡片、详情弹层和投稿弹层的 Soft UI 状态断言"

# 同时推进不同文件中的界面适配：
任务: "在 src/components/layout/Navbar.tsx 中应用 Soft UI 导航和主题选中态样式"
任务: "在 src/components/gallery/ContributeModal.tsx 中应用 Soft UI 表面与输入控件样式"
```

---

## 实施策略

### MVP 优先（仅用户故事 1）

1. 完成阶段 1：准备阶段
2. 完成阶段 2：基础阶段
3. 完成阶段 3：用户故事 1
4. 验证主题切换入口、即时切换与持久化恢复

### 增量交付

1. 先交付主题基础设施与全局切换能力
2. 再交付 Soft UI 在关键界面上的一致控件体验
3. 最后收口长时间使用舒适度、边缘情况与完整验证

## 备注

- 所有任务都遵循现有单体 Web 应用结构，不引入新依赖
- `src/app/globals.css`、`src/app/layout.tsx` 与 `tests/components/gallery.test.tsx` 是共享热点文件，实施时需按顺序整合修改
