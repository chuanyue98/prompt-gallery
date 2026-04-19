---

description: "功能实施的任务列表：精简作品元数据与布局"
---

# 任务列表：精简作品元数据与布局

**输入**: 来自 `/specs/001-streamline-content-hierarchy/` 的设计文档
**先决条件**: plan.md (必填), spec.md (用户故事必填), research.md, data-model.md, contracts/, quickstart.md

**测试**: 需要更新 `tests/components/gallery.test.tsx`，并在完成后执行 `npm run lint`、`npm run test`，必要时执行 `npm run build`。

**组织方式**: 任务按用户故事分组，以便能够独立实施和测试每个故事。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行（不同文件，无依赖关系）
- **[Story]**: 该任务所属的用户故事（例如：US1, US2）
- 在描述中包含确切的文件路径

## 阶段 1：准备阶段（共享基础设施）

**目的**: 确认当前特性目录、分支和受影响文件范围

- [X] T001 确认当前工作分支与特性目录 `specs/001-streamline-content-hierarchy/` 一致
- [X] T002 [P] 复核 `src/app/page.tsx`、`src/components/gallery/Gallery.tsx`、`src/components/gallery/ContributeModal.tsx` 的现状，记录与计划的差异
- [X] T003 [P] 复核 `tests/components/gallery.test.tsx` 的现有覆盖范围，确认哪些交互需要补测

---

## 阶段 2：基础阶段（阻塞性先决条件）

**目的**: 先整理共享的版式和验证基线，避免后续故事互相冲突

- [X] T004 在 `src/components/gallery/Gallery.tsx` 中整理卡片、详情弹层和状态区的可复用文字层级约束
- [X] T005 [P] 在 `specs/001-streamline-content-hierarchy/contracts/ui-contract.md` 中核对首页、详情弹层、投稿弹层的最终 UI 约束与实现范围一致
- [X] T006 [P] 在 `specs/001-streamline-content-hierarchy/quickstart.md` 中核对手动验证场景，确保后续实现可按文档回归

**检查点**: 共享约束已对齐，可以开始按用户故事分阶段落实现

---

## 阶段 3：用户故事 1 - 更紧凑的内容浏览 (优先级: P1) 🎯 MVP

**目标**: 让首页首屏更快进入作品网格，并进一步降低卡片中文字的视觉占比

**独立测试**: 打开首页，在标准桌面宽度下验证每行作品数量不少于 4 个，且首屏不再被大标题占据，卡片视觉内容明显先于文字被感知。

### 用户故事 1 的测试

- [X] T007 [P] [US1] 在 `tests/components/gallery.test.tsx` 中补充首页/画廊核心渲染断言，覆盖高密度列表和主要筛选交互仍可用

### 用户故事 1 的实施

- [X] T008 [US1] 在 `src/app/page.tsx` 中移除首页 hero 标题与说明文案，缩短首屏到画廊内容的距离
- [X] T009 [US1] 在 `src/components/gallery/Gallery.tsx` 中调整画廊容器、网格间距和卡片排版，确保桌面端每行至少展示 4 个作品卡片
- [X] T010 [US1] 在 `src/components/gallery/Gallery.tsx` 中压缩卡片文字层级，减少标题和标签区域对主视觉的占比
- [X] T020 [US1] 在 `src/components/gallery/Gallery.tsx` 中强化模型标签的视觉层级，使其与其他辅助标签更易区分

**检查点**: 首页已具备更高浏览密度，用户故事 1 可独立演示和验证

---

## 阶段 4：用户故事 2 - 去除作品标题字段 (优先级: P2)

**目标**: 从卡片、详情和投稿流程中移除作品 `title` 字段，同时保留清晰可理解的操作上下文

**独立测试**: 打开首页、详情弹层和投稿弹层，确认作品标题字段不再显示或填写，但用户仍能辨认作品内容和主要操作。

### 用户故事 2 的测试

- [X] T011 [P] [US2] 在 `tests/components/gallery.test.tsx` 中补充“作品标题字段已移除”的断言，覆盖卡片与详情交互仍可用
- [X] T012 [P] [US2] 在 `tests/components/gallery.test.tsx` 中补充投稿表单断言，覆盖标题输入被移除后提交流程上下文仍清晰

### 用户故事 2 的实施

- [X] T013 [US2] 在 `src/types/gallery.ts`、`src/components/gallery/Gallery.tsx` 中移除作品 `title` 字段依赖，并改用其他信息组织卡片与详情
- [X] T014 [US2] 在 `src/components/gallery/ContributeModal.tsx` 中移除作品标题输入，并调整表单校验与提交载荷
- [X] T015 [US2] 在 `src/app/api/contribute/route.ts`、`scripts/sync.ts` 中移除标题字段的生成与消费逻辑，避免旧字段继续回流

**检查点**: 作品标题字段已从展示和投稿流程中移除，用户故事 2 可独立验证

---

## 阶段 N：完善与横切关注点

**目的**: 完成跨故事验证、文档同步和最终回归

- [X] T016 [P] 更新 `specs/001-streamline-content-hierarchy/quickstart.md` 中与最终实现不一致的验证说明
- [X] T017 运行 `npm run lint`
- [X] T018 运行 `npm run test`
- [X] T019 运行 `npm run build`
- [X] T021 [P] 在 `tests/components/gallery.test.tsx` 中补充模型标签视觉强调相关断言或类名覆盖

---

## 依赖关系与执行顺序

### 阶段依赖

- **准备阶段 (阶段 1)**: 无依赖，可立即开始
- **基础阶段 (阶段 2)**: 依赖准备阶段完成
- **用户故事 1 (阶段 3)**: 依赖基础阶段完成
- **用户故事 2 (阶段 4)**: 依赖基础阶段完成；可在 US1 完成后继续细化共享文件中的版式
- **完善阶段 (阶段 N)**: 依赖 US1 与 US2 完成

### 用户故事依赖

- **US1**: MVP，可在阶段 2 完成后独立实施和验证
- **US2**: 依赖同一批前端组件，但目标独立，可在 US1 稳定后继续推进

### 每个用户故事内部

- 测试任务先于对应实现任务
- 首页与卡片布局调整先于细节文案压缩
- 模型标签强化应在卡片基础布局稳定后实施
- 去标题后的间距与语义校正放在相应实现之后

### 并行机会

- T002 与 T003 可并行
- T005 与 T006 可并行
- T011 与 T012 可并行
- T020 与 T021 可并行
- 收尾阶段的文档同步可与最终自测准备并行

---

## 并行示例：用户故事 2

```bash
# 同时准备用户故事 2 的测试覆盖：
任务: "在 tests/components/gallery.test.tsx 中补充详情弹层相关断言"
任务: "在 tests/components/gallery.test.tsx 中补充投稿入口相关断言"
```

---

## 实施策略

### MVP 优先（仅用户故事 1）

1. 完成阶段 1：准备阶段
2. 完成阶段 2：基础阶段
3. 完成阶段 3：用户故事 1
4. 验证首页密度和卡片文字占比是否达到目标

### 增量交付

1. 先交付首页首屏与卡片密度优化
2. 再交付作品标题字段移除
3. 最后完成测试、lint、build 和文档同步

## 备注

- 所有任务均遵循单库前端改动路径，不引入新依赖
- `src/components/gallery/Gallery.tsx` 是 US1 与 US2 的共享热点文件，实施时需按顺序整合改动
