---

description: "功能实施的任务列表：初始化 Prompt Gallery 基线"
---

# 任务列表：初始化 Prompt Gallery 基线

**输入**: 来自 `specs/000-init/` 的设计文档  
**先决条件**: plan.md (必填), spec.md (用户故事必填), research.md, data-model.md, quickstart.md, contracts/

**测试**: 本功能以手动验收与脚本验证为主，不要求在 `000-init` 阶段先补自动化测试。

**组织方式**: 任务按用户故事分组，以便能够独立实施和测试每个故事。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行（不同文件，无依赖关系）
- **[Story]**: 该任务所属的用户故事（例如：US1, US2）
- 在描述中包含确切的文件路径

## 阶段 1：准备阶段（共享基础设施）

**目的**: 建立 `000-init` 所需的项目骨架与基础配置

- [ ] T001 初始化 `package.json`、`tsconfig.json`、`next.config.ts` 与基础 npm scripts
- [ ] T002 [P] 配置 `src/app/layout.tsx`、`src/app/globals.css` 与全局视觉基线
- [ ] T003 [P] 配置 `eslint.config.mjs` 与基础 TypeScript/Next.js 开发约束

---

## 阶段 2：基础阶段（阻塞性先决条件）

**目的**: 搭建所有用户故事共享的数据结构、工具函数与内容目录约定

- [ ] T004 定义 `src/types/gallery.ts` 中的 `GalleryItem`、`Media` 等基础类型，包含 `seed`
- [ ] T005 [P] 实现 `src/lib/utils.ts` 中的复制、slug 生成与通用辅助函数
- [ ] T006 [P] 创建 `public/data/images/`、`public/data/videos/` 示例目录及示例 `index.md`
- [ ] T007 实现 `scripts/sync.ts`，将 `public/data/` 内容生成到 `public/gallery-data.json`

**检查点**: 数据模型、工具函数与静态同步链路已就绪，可以开始用户故事实施

---

## 阶段 3：用户故事 1 - 浏览初始画廊 (优先级: P1) 🎯 MVP

**目标**: 交付一个可浏览、可筛选、可查看详情并可复制提示词的初始画廊首页

**独立测试**: 运行 `npm run sync` 与 `npm run dev`，确认首页能展示三列画廊、支持搜索/分类、打开详情并复制提示词。

### 用户故事 1 的实施

- [ ] T008 [P] [US1] 实现 `src/components/layout/Navbar.tsx`，提供品牌展示与投稿入口按钮
- [ ] T009 [P] [US1] 实现 `src/app/page.tsx` 的首页布局、Hero 与画廊容器
- [ ] T010 [US1] 实现 `src/components/gallery/Gallery.tsx` 的数据加载、搜索、分类筛选与桌面三列卡片布局
- [ ] T011 [US1] 在 `src/components/gallery/Gallery.tsx` 中实现详情弹窗，展示 Prompt、描述、模型与 `Seed`
- [ ] T012 [US1] 在 `src/components/gallery/Gallery.tsx` 与 `src/lib/utils.ts` 中实现复制反馈逻辑

**检查点**: 用户故事 1 完成后，站点已具备核心浏览价值

---

## 阶段 4：用户故事 2 - 发起社区投稿 (优先级: P2)

**目标**: 交付网页端投稿弹窗与自动化投稿 PR 流程

**独立测试**: 填写投稿表单并提交，验证生成投稿 PR 与目标目录文件。

### 用户故事 2 的实施

- [ ] T013 [US2] 实现 `src/components/gallery/ContributeModal.tsx`，支持文件上传与标题、描述、Prompt、标签、模型、`Seed` 输入
- [ ] T014 [US2] 在 `src/components/layout/Navbar.tsx` 中接入投稿弹窗开关与提交流程入口
- [ ] T015 [US2] 实现 `src/app/api/contribute/route.ts` 的表单校验、媒体类型识别与 slug 生成逻辑
- [ ] T016 [US2] 在 `src/app/api/contribute/route.ts` 中实现 GitHub App 鉴权、分支创建、`index.md` 写入与 Pull Request 创建
- [ ] T017 [US2] 在 `src/app/api/contribute/route.ts` 中生成包含 `Seed` 字段的投稿 `index.md` 模板

**检查点**: 用户故事 2 完成后，社区用户可通过网页向仓库提交新作品

---

## 阶段 5：用户故事 3 - 维护静态数据基线 (优先级: P3)

**目标**: 让维护者可以通过文件系统与同步脚本稳定维护画廊数据

**独立测试**: 在 `public/data/` 中手动新增一个作品目录后运行 `npm run sync`，确认前端可展示新增内容。

### 用户故事 3 的实施

- [ ] T018 [US3] 扩展 `scripts/sync.ts`，支持从 Frontmatter、正文与目录文件推导完整媒体信息
- [ ] T019 [P] [US3] 在 `README.md` 中补充本地投稿与 `npm run sync` 使用说明
- [ ] T020 [US3] 在 `public/data/` 下准备至少一组图片样例与一组视频样例，验证同步输出

**检查点**: 用户故事 3 完成后，项目形成完整的 git-first 内容维护闭环

---

## 阶段 N：完善与横切关注点

**目的**: 收尾并验证 `000-init` 基线可用

- [ ] T021 [P] 运行 `npm run sync` 验证 `public/gallery-data.json` 可正确生成
- [ ] T022 运行 `npm run lint` 修复规范问题
- [ ] T023 按 `specs/000-init/quickstart.md` 执行一次人工验收

---

## 依赖关系与执行顺序

### 阶段依赖

- **准备阶段 (阶段 1)**: 无依赖项
- **基础阶段 (阶段 2)**: 依赖于准备阶段完成
- **用户故事阶段 (阶段 3-5)**: 依赖于基础阶段完成
- **完善阶段**: 依赖于所有目标用户故事完成

### 用户故事依赖

- **US1**: 基础阶段完成后即可开始，是 MVP
- **US2**: 依赖基础类型、工具与页面骨架，但不依赖 US3
- **US3**: 依赖同步脚本基础版，可在 US1 后补强

### 并行机会

- `T002` 与 `T003` 可并行
- `T004`、`T005`、`T006` 可在阶段 2 内局部并行
- `T008` 与 `T009` 可并行
- `T019` 可与 `T018`、`T020` 并行

---

## 并行示例：用户故事 1

```bash
任务: "实现 src/components/layout/Navbar.tsx，提供品牌展示与投稿入口按钮"
任务: "实现 src/app/page.tsx 的首页布局、Hero 与画廊容器"
```

---

## 实施策略

### MVP 优先（仅用户故事 1）

1. 完成阶段 1 与阶段 2
2. 完成用户故事 1，建立可浏览的画廊首页
3. 执行一次人工验收，确认核心浏览链路成立

### 增量交付

1. 先交付浏览体验（US1）
2. 再补社区投稿能力（US2）
3. 最后完善文件系统同步与维护闭环（US3）

---

## 备注

- `000-init` 以“可生成 `001` 之前的代码”为目标，因此任务中显式保留了桌面三列布局与 `Seed` 字段。
- 删除申请与自动化测试不在本规格实施范围内。
