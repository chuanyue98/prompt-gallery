# 实施计划：详情页删除请求流程

**分支**: `003-delete-request-pr` | **日期**: 2026-04-18 | **规格说明**: [specs/003-delete-request-pr/spec.md](spec.md)
**输入**: 来自 `/specs/003-delete-request-pr/spec.md` 的功能规格说明

## 摘要

本项目将在作品详情页中集成一个低调的删除申请入口。该功能通过调用 GitHub API，自动创建一个删除对应作品文件夹的 Pull Request，从而实现社区驱动的内容下架流程。

## 技术上下文

**语言/版本**: TypeScript / Next.js 16.2.4
**主要依赖**: Octokit (GitHub API)
**存储**: GitHub 仓库中的物理文件
**测试**: GitHub API 联调测试
**目标平台**: Web
**项目类型**: API 扩展 + UI 微调

## 章程检查

- [x] **Aesthetic-Driven UX**: 删除按钮将设计得非常隐蔽，符合“极简”和“低调”要求。
- [x] **Community-Led Contributions**: 通过 PR 方式下架，完全符合社区驱动逻辑。
- [x] **Data-First Architecture**: 针对文件系统的直接操作。

## 项目结构

### 文档 (此功能相关)

```text
specs/003-delete-request-pr/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### 源代码 (仓库根目录)

```text
src/
├── app/api/contribute/
│   └── route.ts         # 增加删除逻辑分支
└── components/gallery/
    └── Gallery.tsx      # 在 Modal 中增加删除入口
```

**结构决策**: 扩展现有的投稿 API，通过 query 参数（如 `?action=delete`）区分投稿与删除操作，复用已有的 Octokit 认证实例。

## 复杂度跟踪

无。
