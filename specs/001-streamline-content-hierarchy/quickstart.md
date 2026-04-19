# 快速入门：精简作品元数据与布局

## 1. 开发前确认

1. 切换到分支 `001-streamline-content-hierarchy`
2. 确认当前规格文件为 `specs/001-streamline-content-hierarchy/spec.md`
3. 本次改动只覆盖首页与 gallery 相关前端组件，不改动数据来源模式

## 2. 实施范围

- `src/app/page.tsx`
  - 如仍保留额外首屏文案，需确认不会喧宾夺主
- `src/components/gallery/Gallery.tsx`
  - 维持高密度网格
  - 移除作品标题字段展示
  - 继续压缩卡片文字占比
  - 强化模型标签的视觉辨识度
- `src/components/gallery/ContributeModal.tsx`
  - 移除作品标题输入
  - 保持投稿表单上下文清晰
- `src/types/gallery.ts`
  - 更新 `GalleryItem` 定义，移除 `title`
- `tests/components/gallery.test.tsx`
  - 增补或更新与作品标题字段移除相关的测试
  - 补充模型标签强调样式的覆盖

## 3. 验证步骤

1. 运行 `npm run lint`
2. 运行 `npm run test`
3. 如改动涉及首页布局或 Next 组件结构，运行 `npm run build`
4. 手动验证以下场景：
   - 桌面端每行可见作品数量不少于 4 个
   - 卡片与详情弹层都不再显示作品标题字段
   - 卡片中的模型标签比其他辅助标签更容易被扫视识别
   - 投稿弹层不再要求填写作品标题字段
   - 字段移除后，筛选、复制和投稿流程仍可用

## 4. 完成标准

- 标题字段完全从展示和录入流程中消失
- 现有筛选、复制、详情弹层和投稿流程不回退
