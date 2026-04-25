---
name: image-optimizer
description: 扫描并优化项目中的静态图片资源,将大图片转换为WebP格式
---

### 工作流程

1. **扫描图片**:扫描指定目录下大于指定大小的图片文件(PNG/JPG/JPEG/SVG)
2. **列出候选**:显示所有符合条件的图片及其大小
3. **批量转换**:将图片转换为WebP格式,减小文件大小
4. **返回结果**:显示转换结果和节省的空间

### 执行命令

#### 扫描模式(仅列出大图片)

```bash
python CodeAgent/skills/image-optimizer/scripts/optimize_images.py --scan --path "项目路径" --min-size 100
```

#### 转换模式(扫描并转换)

```bash
python CodeAgent/skills/image-optimizer/scripts/optimize_images.py --convert --path "项目路径" --min-size 100 --quality 85
```

> **注意**:脚本路径是相对于 WORK_HOME 的 `CodeAgent/skills/image-optimizer/scripts/optimize_images.py`。

### 脚本说明

- **脚本位置**: `scripts/optimize_images.py`
- **依赖**: 
  - Python 3.x
  - Pillow 库(用于图片处理,运行 `pip install Pillow`)
- **参数**:
  - `--scan`: 仅扫描并列出大图片(可选)
  - `--convert`: 扫描并转换为WebP格式(可选)
  - `--path`: 项目路径(必需)
  - `--min-size`: 最小文件大小(KB),默认100KB
  - `--quality`: WebP质量(1-100),默认85
  - `--exclude`: 排除的目录(可选,默认排除node_modules等)
- **功能**:
  - 自动扫描指定目录下的图片文件
  - 过滤掉node_modules、dist等构建目录
  - 支持PNG、JPG、JPEG、SVG格式
  - 转换为WebP格式并保留原文件
  - 显示转换前后的文件大小对比

### 使用示例

#### 仅扫描大图片

告诉AI:
```
扫描 game_portal_react 项目中大于100KB的图片
```

或者:
```
列出 wallet 应用中的大图片文件
```

#### 转换为WebP

如果需要转换,明确说明:
```
把 game_portal_react 项目中大于100KB的图片转换为WebP格式
```

或者:
```
优化 wallet 应用中的图片,转换为WebP
```

#### 自定义参数

- 指定最小大小:`扫描大于50KB的图片`
- 指定质量:`转换图片为WebP,质量设为90`
