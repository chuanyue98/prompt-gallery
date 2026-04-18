# 数据模型：详情页删除请求流程

## 实体：DeleteRequest

代表一次删除申请。

### 字段
- **slug**: 作品的唯一标识符（目录名）。
- **type**: 作品分类（`video` 或 `image`），决定了删除的根路径（`videos/` 或 `images/`）。

## 接口契约 (API Contract)

### POST `/api/contribute?action=delete`
- **Body**:
  ```json
  {
    "slug": "string",
    "type": "video" | "image"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "prUrl": "string"
  }
  ```
