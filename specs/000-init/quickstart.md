# Quickstart：初始化 Prompt Gallery 基线

## 1. 安装与准备

```bash
npm install
```

准备 GitHub App 相关环境变量：

- `APP_ID`
- `PRIVATE_KEY`
- `INSTALLATION_ID`
- `REPO_OWNER`
- `REPO_NAME`

## 2. 生成静态数据

```bash
npm run sync
```

预期结果：

- 生成或刷新 `public/gallery-data.json`
- 数据来自 `public/data/images/` 与 `public/data/videos/`

## 3. 启动本地站点

```bash
npm run dev
```

访问首页后验证：

- 顶部导航与 Hero 正常显示
- 桌面端画廊默认三列
- 支持搜索与图片/视频筛选
- 点击卡片可打开详情弹窗
- 详情中可看到 Prompt、描述、模型与 `Seed`

## 4. 验证投稿流程

1. 点击“我要投稿”
2. 上传图片或视频
3. 填写标题、描述、Prompt、标签、模型与 `Seed`
4. 提交表单

预期结果：

- 服务端创建 `contribution/{slug}` 分支
- 新增 `public/data/{images|videos}/{slug}/index.md`
- 生成一条投稿 Pull Request

## 5. 验证本地投稿工作流

1. 在 `public/data/images/` 或 `public/data/videos/` 下新增一个作品目录
2. 放入媒体文件和 `index.md`
3. 运行 `npm run sync`
4. 刷新首页

预期结果：

- 新作品出现在画廊列表中
- 媒体、Prompt 与元数据被正确解析
