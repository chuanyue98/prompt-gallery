import os
import requests
import json
import argparse
import sys

def download_icon(icon_name, style, size, output_dir):
    # 映射风格名称
    style_map = {
        "outlined": "materialsymbolsoutlined",
        "rounded": "materialsymbolsrounded",
        "sharp": "materialsymbolssharp"
    }
    
    family = style_map.get(style.lower())
    if not family:
        print(f"错误: 不支持的风格 '{style}'。支持的风格有: outlined, rounded, sharp")
        return False

    # 构造 SVG URL
    # 模式: https://fonts.gstatic.com/s/i/short-term/release/{family}/{name}/default/{size}px.svg
    svg_url = f"https://fonts.gstatic.com/s/i/short-term/release/{family}/{icon_name.lower()}/default/{size}px.svg"
    
    print(f"正在从 Google 下载图标: {icon_name} ({style}, {size}px)...")
    
    try:
        response = requests.get(svg_url, timeout=10)
        if response.status_code == 200:
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            file_path = os.path.join(output_dir, f"{icon_name}_{style}_{size}px.svg")
            with open(file_path, "wb") as f:
                f.write(response.content)
            
            print(f"成功保存到: {file_path}")
            return True
        elif response.status_code == 404:
            print(f"错误: 找不到图标 '{icon_name}' (风格: {style}, 尺寸: {size}px)。请检查名称和参数是否正确。")
            return False
        else:
            print(f"错误: 下载失败，HTTP 状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"异常: {str(e)}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="下载 Google Fonts Icons (Material Symbols) SVG")
    parser.add_argument("--name", required=True, help="图标名称 (例如: home, settings)")
    parser.add_argument("--style", default="outlined", help="风格 (outlined, rounded, sharp)")
    parser.add_argument("--size", default="24", help="尺寸 (例如: 20, 24, 40, 48)")
    parser.add_argument("--out", default=".", help="输出目录")

    args = parser.parse_args()
    
    success = download_icon(args.name, args.style, args.size, args.out)
    if not success:
        sys.exit(1)
