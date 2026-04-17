# 🎨 Prompt Gallery

> 一个极致美学驱动的 AIGC 提示词画廊，专注于收集、展示和分享最优质的 AI 视觉艺术提示词。

[🚀 立即访问画廊网页](https://prompt-gallery-sigma.vercel.app/)

---

## ✨ 核心特性

- **沉浸式视觉体验**：赛博黑曜石风格，支持视频悬停自动预览。
- **一键灵感获取**：支持提示词快速复制，完整的模型参数展示。
- **社区驱动投稿**：集成了自动化的 GitHub App 投稿流程。
- **数据驱动架构**：基于 Next.js 16 + TypeScript 构建。

## 🛠️ 技术栈

- **前端框架**: Next.js (App Router)
- **样式方案**: TailwindCSS + Framer Motion (Glassmorphism)
- **自动化**: GitHub Actions + GitHub App Bot
- **数据管理**: Markdown (Frontmatter) + JSON

## 🤝 如何贡献

我们非常欢迎来自社区的投稿！你可以通过以下两种方式参与：

1. **网页端一键投稿 (推荐)**：
   访问 [Prompt Gallery 官网](https://prompt-gallery-sigma.vercel.app/)，点击页面上的 **“我要投稿”** 按钮，上传你的作品。系统会自动为你发起 Pull Request。

2. **本地投稿**：
   - Fork 本仓库。
   - 在 `public/data/` 目录下新建一个以作品命名的文件夹。
   - 放入你的图片/视频，并创建一个 `index.md`（可参考已有的模板）。
   - 运行 `npm run sync` 并提交 PR。

## 📝 开源许可

本项目采用 [MIT License](LICENSE) 许可协议。

---

© 2026 [chuanyue98](https://github.com/chuanyue98). Built for the AIGC community.
