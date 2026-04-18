---

description: "功能实施的任务列表：详情页删除请求流程"
---

# 任务列表：详情页删除请求流程

**输入**: 来自 `specs/003-delete-request-pr/` 的设计文档
**先决条件**: plan.md (必填), spec.md (用户故事必填), research.md, data-model.md, quickstart.md

**测试**: 本项目主要通过 GitHub API 联调进行视觉与流程验证。

**组织方式**: 任务按用户故事分组，以便能够独立实施和测试每个故事。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行（不同文件，无依赖关系）
- **[Story]**: 该任务所属的用户故事（例如：US1, US2）
- 在描述中包含确切的文件路径

## 阶段 1：准备阶段（共享基础设施）

**目的**: 确认环境与备份

- [x] T001 确认当前开发分支为 `main`
- [x] T002 再次备份受影响文件：`src/app/api/contribute/route.ts` 和 `src/components/gallery/Gallery.tsx`

---

## 阶段 2：基础阶段（阻塞性先决条件）

**目的**: 实现后端删除逻辑分支

- [x] T003 [US2] 在 `src/app/api/contribute/route.ts` 中解析查询参数 `action`
- [x] T004 [US2] 在 `src/app/api/contribute/route.ts` 中实现基于 Git Data API 的删除目录逻辑
- [x] T005 [US2] 确保删除流程中的错误处理

**检查点**: 后端 API 已支持 `?action=delete` 操作，可进行初步调试

---

## 阶段 3：用户故事 1 - 低调的删除申请 (优先级: P1) 🎯 MVP

**目标**: 在详情弹窗中增加极简的删除入口

**独立测试**: 打开任意作品详情，看到“申请下架”链接且不显眼。

- [x] T006 [US1] 在 `src/components/gallery/Gallery.tsx` 的详情 Modal 区域增加一个“申请下架”超链接
- [x] T007 [US1] 使用 Tailwind 设置链接样式

---

## 阶段 4：用户故事 2 - 自动化删除 PR 流程 (优先级: P2)

**目标**: 连通前后端，完成 PR 提交闭环

**独立测试**: 点击“申请下架”，弹出确认，确认后显示 PR 创建成功链接。

- [x] T008 [US2] 在 `src/components/gallery/Gallery.tsx` 中实现点击链接后的确认逻辑
- [x] T009 [US2] 在 `src/components/gallery/Gallery.tsx` 中发起 `fetch` 请求到 `/api/contribute?action=delete`
- [x] T010 [US2] 增加成功后的反馈

---

## 阶段 N：完善与横切关注点

**目的**: 确保整体质量

- [x] T011 运行 `npm run lint` 检查代码规范
- [x] T012 运行 `npm run build` 确保生产环境编译正常
- [x] T013 更新 `specs/003-delete-request-pr/quickstart.md` 以记录最终的 API 契约和操作步骤

---

## 依赖关系与执行顺序

### 阶段依赖

- **准备阶段**: 无依赖
- **基础阶段**: 依赖于准备阶段
- **用户故事 1**: 依赖于准备阶段
- **用户故事 2**: 依赖于基础阶段和用户故事 1
- **完善阶段**: 依赖于所有用户故事完成

### 并行机会

- 阶段 2 (后端) 与 阶段 3 (前端 UI) 可以并行开发。

---

## 实施策略

### MVP 优先

1. 完成后端的删除 PR 逻辑。
2. 在前端增加最简单的触发点。
3. 验证端到端流程。

---

## 备注

- 删除 PR 的标题格式必须为：`🗑️ 删除申请: [作品标题]`。
- 整个删除流程不涉及本地文件系统，全部通过 GitHub API 操作。
