---
name: qrcode
description: 生成二维码，支持屏幕显示或保存为文件
---

### 工作流程

1. **解析内容**：从用户指令中提取需要生成二维码的内容
2. **确定模式**：判断是屏幕显示还是保存为文件
3. **执行脚本**：调用 `scripts/generate_qrcode.py` 脚本生成二维码
4. **返回结果**：显示二维码或返回文件路径

### 执行命令

#### 屏幕显示模式（默认）

```bash
python CodeAgent/skills/qrcode/scripts/generate_qrcode.py --content "你的内容"
```

#### 保存为文件模式

```bash
# Bash/Zsh (Linux/macOS)
python CodeAgent/skills/qrcode/scripts/generate_qrcode.py --content "你的内容" --save --output-dir $TMP --output "qrcode.png"
# 或使用 $TEMP
python CodeAgent/skills/qrcode/scripts/generate_qrcode.py --content "你的内容" --save --output-dir $TEMP --output "qrcode.png"

# PowerShell (Windows)
python CodeAgent/skills/qrcode/scripts/generate_qrcode.py --content "你的内容" --save --output-dir $env:TEMP --output "qrcode.png"
# 或使用 $env:TMP
python CodeAgent/skills/qrcode/scripts/generate_qrcode.py --content "你的内容" --save --output-dir $env:TMP --output "qrcode.png"
```
> **任务完成后，请删除生成的临时文件。**

> **注意**：脚本路径是相对于 WORK_HOME 的 `CodeAgent/skills/qrcode/scripts/generate_qrcode.py`。

### 脚本说明

- **脚本位置**: `scripts/generate_qrcode.py`
- **依赖**: 
  - Python 3.x
  - qrcode 库（脚本会自动检测并安装，也可手动运行 `pip install qrcode[pil]`）
  - Pillow 库（用于 GUI 显示，运行 `pip install Pillow`）
  - tkinter（Python 自带，用于 GUI 窗口）
- **参数**:
  - `--content`: 要生成二维码的内容（必需）
  - `--save`: 是否保存为文件（可选，默认不保存）
  - `--output`: 输出文件名（默认为 `qrcode.png`）
  - `--output-dir`: 输出目录路径（建议使用 `$TMP`, `$TEMP` 等临时目录）
  - `--size`: 二维码大小（可选，默认为 10）
  - `--border`: 边框大小（可选，默认为 4）
- **功能**:
  - 默认使用 GUI 弹窗显示二维码图片
  - 可选保存为 PNG 图片文件
  - 支持自定义二维码大小和边框

### 使用示例

#### 终端显示（默认）

只需要告诉 AI：
```
把 "https://example.com" 生成二维码
```

或者：
```
生成二维码：Hello World
```

#### 保存为文件

如果需要保存为文件，明确说明：
```
把 "https://example.com" 生成二维码并保存为文件
```

或者：
```
生成二维码并保存：Hello World
```

#### 更多示例

- 生成网址二维码：`把 "https://github.com" 生成二维码`
- 生成文本二维码并保存：`把 "这是一段测试文本" 生成二维码并保存为文件`
