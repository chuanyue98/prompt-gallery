# 快速入门：详情页删除请求流程

## 开发与测试指南

### 1. 触发删除
在作品详情 Modal 的右下角，有一个不显眼的“申请下架 (TAKE DOWN)”链接。

### 2. API 调用
前端向 `/api/contribute?action=delete` 发送 POST 请求，Body 包含：
```json
{
  "slug": "作品标识",
  "type": "video | image",
  "title": "作品标题"
}
```

后端逻辑：
- 认证 GitHub App。
- 获取 `main` 分支最新 SHA。
- 获取当前 Git 树。
- 过滤并标记目录 `public/data/[videos|images]/[slug]` 下的所有 blob 文件的 `sha` 为 `null`。
- 创建新树并提交变更。
- 创建分支 `delete/[slug]-[random]`。
- 发起标题为 `🗑️ 删除申请: [作品标题]` 的 PR。

### 3. 验证 PR
- 操作后会弹出包含 PR 链接的提示。
- 登录 GitHub 确认 PR 仅包含目标文件夹的物理删除。
