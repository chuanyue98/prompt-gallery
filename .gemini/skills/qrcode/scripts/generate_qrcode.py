#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
二维码生成脚本
支持终端显示和文件保存两种模式
"""

import argparse
import sys
import subprocess
from pathlib import Path

# 检查并安装依赖
try:
    import qrcode
except ImportError:
    print("❌ 缺少 qrcode 库，正在尝试自动安装...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "qrcode[pil]"])
        import qrcode
        print("✅ qrcode 库安装成功！")
    except Exception as e:
        print(f"❌ 自动安装失败: {e}", file=sys.stderr)
        print("\n请手动运行以下命令安装依赖：", file=sys.stderr)
        print("  python -m pip install qrcode[pil]", file=sys.stderr)
        sys.exit(1)


def generate_qrcode_terminal(content, size=10, border=4):
    """
    使用 GUI 弹窗显示二维码
    
    Args:
        content: 二维码内容
        size: 二维码大小
        border: 边框大小
    """
    try:
        import tkinter as tk
        from tkinter import ttk
        from PIL import Image, ImageTk
    except ImportError as e:
        print(f"❌ 缺少必要的 GUI 库: {e}", file=sys.stderr)
        print("请安装 Pillow 库: python -m pip install Pillow", file=sys.stderr)
        sys.exit(1)
    
    # 生成二维码
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=border,
    )
    qr.add_data(content)
    qr.make(fit=True)
    
    # 创建二维码图片
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 创建 GUI 窗口
    root = tk.Tk()
    root.title("二维码")
    
    # 设置窗口居中
    window_width = 500
    window_height = 600
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    x = (screen_width - window_width) // 2
    y = (screen_height - window_height) // 2
    root.geometry(f"{window_width}x{window_height}+{x}+{y}")
    
    # 创建主框架
    main_frame = ttk.Frame(root, padding="20")
    main_frame.pack(fill=tk.BOTH, expand=True)
    
    # 显示二维码图片
    # 调整图片大小以适应窗口
    img_resized = img.resize((400, 400), Image.Resampling.LANCZOS)
    photo = ImageTk.PhotoImage(img_resized)
    
    img_label = ttk.Label(main_frame, image=photo)
    img_label.image = photo  # 保持引用，防止被垃圾回收
    img_label.pack(pady=10)
    
    # 显示内容文本（如果内容较长则截断显示）
    content_display = content if len(content) <= 60 else content[:57] + "..."
    content_label = ttk.Label(
        main_frame,
        text=f"内容: {content_display}",
        wraplength=450,
        justify=tk.CENTER
    )
    content_label.pack(pady=10)
    
    # 关闭按钮
    close_btn = ttk.Button(
        main_frame,
        text="关闭",
        command=root.destroy
    )
    close_btn.pack(pady=10)
    
    print(f"✅ 二维码窗口已打开")
    print(f"📝 二维码内容: {content}")
    
    # 运行 GUI 主循环
    root.mainloop()


def generate_qrcode_file(content, output_path, output_dir=None, size=10, border=4):
    """
    生成二维码并保存为文件
    
    Args:
        content: 二维码内容
        output_path: 输出文件路径（文件名或完整路径）
        output_dir: 输出目录（可选）
        size: 二维码大小
        border: 边框大小
    """
    import os
    
    # process output path
    if output_dir:
        dir_path = os.path.expandvars(output_dir)
        filename = os.path.basename(output_path)
        final_path = os.path.join(dir_path, filename)
    else:
        final_path = os.path.expandvars(output_path)
        
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=border,
    )
    qr.add_data(content)
    qr.make(fit=True)
    
    # 创建图片
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 确保输出目录存在
    output_file = Path(final_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # 保存图片
    img.save(str(output_file))
    print(f"✅ 二维码已保存到: {output_file.absolute()}")
    print(f"📝 二维码内容: {content}")


def main():
    parser = argparse.ArgumentParser(
        description="生成二维码，支持终端显示或保存为文件"
    )
    parser.add_argument(
        "--content",
        required=True,
        help="要生成二维码的内容"
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="是否保存为文件（默认在终端显示）"
    )
    parser.add_argument(
        "--output",
        default="qrcode.png",
        help="输出文件路径或文件名（默认: qrcode.png）"
    )
    parser.add_argument(
        "--output-dir",
        help="输出目录路径（可选，结合--output使用）"
    )
    parser.add_argument(
        "--size",
        type=int,
        default=10,
        help="二维码大小（默认: 10）"
    )
    parser.add_argument(
        "--border",
        type=int,
        default=4,
        help="边框大小（默认: 4）"
    )
    
    args = parser.parse_args()
    
    try:
        if args.save:
            # 保存为文件模式
            generate_qrcode_file(
                args.content,
                args.output,
                args.output_dir,
                args.size,
                args.border
            )
        else:
            # 终端显示模式
            generate_qrcode_terminal(
                args.content,
                args.size,
                args.border
            )
    except Exception as e:
        print(f"❌ 生成二维码失败: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
