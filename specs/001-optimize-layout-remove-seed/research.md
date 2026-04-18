# 研究报告：优化布局与移除 Seed 参数

## 决策：优化画廊布局

### 方案：增加网格列数并优化间距
- **具体选择**：将 `src/components/gallery/Gallery.tsx` 中的网格配置从 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` 修改为 `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`。
- **配套调整**：将外层容器的间距和卡片的内边距进行微调，以适应更高密度的显示。
- **技术理由**：Tailwind CSS 的响应式前缀可以轻松实现这一需求，且无需引入复杂的布局库。

## 决策：移除 Seed 参数

### 方案：全面下线 Seed 显示与输入
- **展示层**：删除 `Gallery.tsx` 中详情弹窗（Modal）里的 Seed 显示区域。
- **输入层**：虽然当前 `ContributeModal.tsx` 似乎已经没有明显的 Seed 输入框（根据代码审计，它只有 model, tags, prompt 等），但需要确保 `route.ts` 也不再尝试处理或生成该字段。
- **数据层**：保持现有 `index.md` 中的数据结构不变（以防未来需要恢复），但在 `sync.ts` 生成的 `gallery-data.json` 中可以继续保留或移除。鉴于用户要求“去除”，我们将从 UI 上完全抹除其存在感。

## 考虑过的替代方案

### 方案 A：保留 Seed 但默认隐藏
- **评估**：用户明确表示要“去除”，保留会导致代码冗余。
- **结论**：拒绝，直接移除以简化代码。

### 方案 B：使用 Masonry 布局
- **评估**：Masonry 布局虽然美观，但实现复杂度较高且与当前“极致美学”的对称感不符。
- **结论**：拒绝，维持当前的 Grid 布局但提高密度。
