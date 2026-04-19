# Contract: `POST /api/contribute`

## 目的

接收网页端投稿表单，将作品内容转换为 GitHub Pull Request。

## 请求

**Content-Type**: `multipart/form-data`

**字段**

- `title` (required)
- `description` (optional)
- `prompt` (required)
- `tags` (optional, comma separated)
- `model` (optional)
- `file` (required when `mediaUrl` absent)
- `mediaUrl` (required when `file` absent)

## 处理规则

1. 校验 `title`、`prompt` 与媒体输入。
2. 根据文件 MIME 或 `mediaUrl` 后缀推断媒体类型。
3. 生成稳定 slug。
4. 创建投稿分支 `contribution/{slug}`。
5. 写入 `public/data/{images|videos}/{slug}/index.md`。
6. 若存在本地上传文件，同时写入对应媒体文件。
7. 创建标题为 `🎨 社区投稿: {title}` 的 Pull Request。

## 成功响应

**Status**: `200`

```json
{
  "success": true,
  "prUrl": "https://github.com/<owner>/<repo>/pull/123"
}
```

## 失败响应

**Status**: `400 | 500`

```json
{
  "error": "Human readable error message"
}
```

## 非目标

- 不处理删除申请。
- 不处理登录态或用户账户系统。
- 不直接写入主分支。
