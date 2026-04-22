# 数据模型：移动端适配优化 (Mobile UI Adaptation)

## 变更说明

本功能为 **纯 UI/UX 适配**，不涉及后端 API 逻辑变更或底层数据结构的修改。

## 实体关系 (无变更)

- **GalleryItem**: 保持现有字段（slug, description, tags, mediaPath, media, content, model, mediaUrl, sourceUrl）。
- **Media**: 保持现有字段（type, src, cover）。

## 验证规则 (UI 层面)

- **响应式状态**: 组件内部需维护 `mounted` 状态以防止 Hydration 错误（已在之前修复中实施，本次将巩固）。
- **视口断点**:
  - `sm`: 640px (Tailwind 默认)
  - `md`: 768px (Tailwind 默认)
  - `lg`: 1024px (Tailwind 默认)
  - `xl`: 1280px (Tailwind 默认)
