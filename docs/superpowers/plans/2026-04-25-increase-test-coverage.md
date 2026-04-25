# 提升测试覆盖率至 100% 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全缺失的测试用例，使项目测试覆盖率（Statements, Branches, Functions, Lines）达到 100%。

**Architecture:** 针对 Vitest 报告中识别出的未覆盖行，编写精准的单元测试和组件测试。

**Tech Stack:** Vitest, React Testing Library, Next.js (App Router).

---

### Task 1: 补全 API Route 覆盖率

**Files:**
- Modify: `tests/api/contribute.test.ts`

- [ ] **Step 1: 增加测试用例覆盖 `buildContributionSlug` 的特殊字符处理**
- [ ] **Step 2: 增加测试用例覆盖 `handleCreate` 中 `mediaUrl` 的边缘情况**
- [ ] **Step 3: 增加测试用例覆盖 `handleDelete` 的缺失验证分支**
- [ ] **Step 4: 运行测试并验证覆盖率**

### Task 2: 补全 Gallery 组件覆盖率

**Files:**
- Modify: `tests/components/gallery.test.tsx`

- [ ] **Step 1: 增加测试用例覆盖 `Gallery.tsx` 中搜索无结果但数据不为空的分支**
- [ ] **Step 2: 检查并补全 `ContributeModal`, `ContributePreview`, `DetailModal` 等组件的细微缺失点**
- [ ] **Step 3: 运行测试并验证覆盖率**

### Task 3: 补全 Lib 工具库覆盖率

**Files:**
- Modify: `tests/lib/github.test.ts`
- Modify: `tests/lib/theme.test.ts`

- [ ] **Step 1: 增加测试用例覆盖 `github.ts` 中的未覆盖行**
- [ ] **Step 2: 增加测试用例覆盖 `theme.ts` 中的未覆盖行**
- [ ] **Step 3: 运行测试并验证覆盖率**

### Task 4: 验证与清理阶段

- [ ] **Step 1: 运行全量测试，确保所有指标达到 100%**
- [ ] **Step 2: 清理 `IMPLEMENTATION_PLAN.md` 和临时文件**
