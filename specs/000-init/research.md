# 研究记录：初始化 Prompt Gallery 基线

## 决策 1：以文件系统为唯一数据源

**Decision**: 使用 `public/data/` 下的 `index.md` 与媒体文件作为内容源，并通过 `scripts/sync.ts` 生成 `public/gallery-data.json`。  
**Rationale**: 该方式满足 git-first、可审查、易迁移的要求，也与仓库现有章程一致。  
**Alternatives considered**:
- 使用数据库直接驱动前端：超出初始版本复杂度，不符合数据优先章程。
- 在前端运行时直接扫描目录：浏览器不可行，也不利于静态部署。

## 决策 2：初始首页保留三列桌面布局

**Decision**: `000-init` 将桌面端默认浏览密度定义为 3 列。  
**Rationale**: 这样可以与后续 `001-streamline-content-hierarchy` 的“提高显示密度”形成清晰演进关系。  
**Alternatives considered**:
- 直接把初始版本定义为 4-5 列：会与 `001` 规格重叠，削弱增量边界。

## 决策 3：网页投稿直接生成 GitHub Pull Request

**Decision**: 投稿流程通过 GitHub App 认证，在目标仓库创建分支、写入内容并发起 PR。  
**Rationale**: 该流程让非开发者也能通过网页提交内容，同时保证所有内容变更仍经过 git 审查。  
**Alternatives considered**:
- 直接写入主分支：缺少审查闭环，风险高。
- 仅支持本地投稿：门槛过高，不利于社区扩张。

## 决策 4：初始版本不纳入删除申请与测试基线

**Decision**: `000-init` 不包含删除申请 PR 与自动化测试补齐。  
**Rationale**: 这两项已分别由 `003` 与 `004` 定义为后续增量需求。  
**Alternatives considered**:
- 将所有已存在能力都回灌进 `000-init`：会破坏版本演进顺序，降低 spec 的可追踪性。
