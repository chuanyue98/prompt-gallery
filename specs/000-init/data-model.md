# 数据模型：初始化 Prompt Gallery 基线

## GalleryItem

**说明**: 画廊前端消费的标准化作品对象。

**字段**

- `slug`: 作品的稳定标识，用于目录名、路由上下文与复制反馈状态。
- `title`: 展示标题。
- `description`: 对作品视角、风格或场景的描述。
- `tags`: 标签数组，用于搜索与辅助浏览。
- `content`: Markdown 正文中的提示词文本。
- `model`: 模型名称或引擎名称。
- `seed`: 初始版本保留的生成参数。
- `mediaPath`: 仓库内资源的公共前缀路径；外部媒体时可为空。
- `media`: 媒体数组，首项作为主展示资源，包含 `type`、`src`、`cover`。
- `mediaUrl`: 可选的外部媒体直链。
- `sourceUrl`: 可选的作品来源链接。

**校验规则**

- `slug` 必须可安全用于目录名与分支名。
- `title`、`content`、主媒体信息必须存在。
- `media[0].type` 仅允许 `image` 或 `video`。
- `seed` 在 `000-init` 中视为允许展示与录入的元数据。

## ContributionDraft

**说明**: 网页端一次待提交投稿的表单数据。

**字段**

- `title`
- `description`
- `prompt`
- `tags`
- `model`
- `seed`
- `file`
- `mediaUrl`

**校验规则**

- 必须提供 `title` 与 `prompt`。
- 必须在上传文件与 `mediaUrl` 之间二选一。
- `mediaUrl` 若存在，必须直指图片或视频资源。

## MediaAsset

**说明**: 作品依赖的主媒体或封面资源。

**字段**

- `type`: `image` | `video`
- `src`: 主展示资源
- `cover`: 卡片封面
- `origin`: 仓库文件或外部链接

**派生规则**

- 视频资源优先寻找目录中的 `cover`/`preview` 图片作为封面。
- 若没有独立封面，允许回退到首张图片或视频本身。

## GeneratedGalleryDataset

**说明**: `scripts/sync.ts` 生成的静态 JSON 数据集。

**组成**

- 按作品目录扫描得到的 `GalleryItem[]`
- 合并 Frontmatter、Markdown 正文与目录资源推导结果

**状态转换**

1. 维护者或投稿流程新增 `public/data/.../index.md`
2. 同步脚本扫描目录并推导媒体信息
3. 输出标准化 JSON
4. 前端首页读取 JSON 并渲染
