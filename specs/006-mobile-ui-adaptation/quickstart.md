# 快速开始：移动端适配 (Mobile UI Adaptation)

## 开发准备

1. **环境检查**: 确保已安装 Node.js 20+。
2. **分支**: `006-mobile-ui-adaptation`
3. **安装依赖**: `npm install`

## 本地开发流程

1. **启动服务**: `npm run dev`
2. **移动端模拟**:
   - 在 Chrome 中打开 `http://localhost:3000`。
   - 按 `F12` 打开开发者工具。
   - 切换到 **Toggle Device Toolbar** (Ctrl+Shift+M)。
   - 选择 **iPhone 12 Pro** 或 **Pixel 7** 进行测试。
3. **重点检查项**:
   - [ ] 顶部 Navbar 是否在 375px 宽度下发生重叠。
   - [ ] 搜索框和分类切换器是否易于触控。
   - [ ] 作品详情弹窗是否能覆盖全屏且可滚动。
   - [ ] 投稿表单在小屏幕下的布局是否紧凑。

## 验证与发布

1. **Lint 检查**: `npm run lint`
2. **运行测试**: `npm test` (注意：需补齐针对移动端交互的测试用例)。
3. **构建测试**: `npm run build`
