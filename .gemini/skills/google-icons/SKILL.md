---
name: google-icons
description: 下载 Google Fonts Icons (Material Symbols) 的 SVG 图标。支持多种风格（Outlined, Rounded, Sharp）。
---

### 工作流程

当用户请求下载 Google 图标时,按以下步骤执行:

1. **识别用户需求**
   - 提取图标名称 (如 `home`, `settings`, `search`)。
   - 提取图标风格 (默认为 `outlined`，支持 `rounded`, `sharp`)。
   - 提取图标尺寸 (默认为 `24`，常用尺寸包括 `20`, `24`, `40`, `48`)。
   - 提取保存目录 (默认为当前目录或用户指定目录)。

2. **调用下载脚本**
   - 运行 `python scripts/download_google_icon.py --name <icon_name> --style <style> --size <size> --out <output_dir>`。
   - 该脚本会自动处理 Google 的元数据并从 `gstatic.com` 下载对应的 SVG 文件。

3. **反馈结果**
   - 确认文件已保存。
   - 如果发生错误（如图标名称不存在），及时通知用户。

### 使用示例

- "帮我下载 google 的 home 图标" -> 默认下载 outlined 风格，24px。
- "下载 48px rounded 风格的 settings 图标到 ./icons 文件夹" -> 指定风格、尺寸和目录。

### 注意事项

- 本技能优先下载 SVG 格式，因为它是矢量的且方便前端自定义颜色。
- 脚本会自动剥离 Google API 响应中的安全前缀 `)]}'`。
- 如果用户未指定风格，默认使用 `materialsymbolsoutlined`。
- 如果用户未指定尺寸，默认使用 `24`px。
