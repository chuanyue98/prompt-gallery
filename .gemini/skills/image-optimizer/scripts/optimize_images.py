#!/usr/bin/env python3
"""
图片优化脚本
扫描并转换大图片为WebP格式以减小文件大小
"""

import argparse
import os
import sys
from pathlib import Path
from typing import List, Tuple

try:
    from PIL import Image
except ImportError:
    print("正在安装 Pillow 库...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image


# 默认排除的目录
DEFAULT_EXCLUDES = [
    'node_modules',
    'playwright-report',
    'playwright',
    '@mf-types',
    'test-results',
    '.turbo',
    'dist',
    'build',
    '.git',
    '.next',
    'coverage'
]

# 支持的图片格式
SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg']


class ImageOptimizer:
    """图片优化器"""
    
    def __init__(self, base_path: str, min_size_kb: int = 100, 
                 quality: int = 85, excludes: List[str] = None):
        """
        初始化图片优化器
        
        Args:
            base_path: 项目根目录
            min_size_kb: 最小文件大小(KB)
            quality: WebP质量(1-100)
            excludes: 排除的目录列表
        """
        self.base_path = Path(base_path).resolve()
        self.min_size_bytes = min_size_kb * 1024
        self.quality = quality
        self.excludes = excludes or DEFAULT_EXCLUDES
        
    def should_exclude(self, path: Path) -> bool:
        """检查路径是否应该被排除"""
        parts = path.parts
        return any(exclude in parts for exclude in self.excludes)
    
    def scan_images(self) -> List[Tuple[Path, int]]:
        """
        扫描所有符合条件的图片
        
        Returns:
            [(图片路径, 文件大小), ...]
        """
        images = []
        
        for ext in SUPPORTED_FORMATS:
            for img_path in self.base_path.rglob(f'*{ext}'):
                # 跳过排除的目录
                if self.should_exclude(img_path):
                    continue
                
                # 检查文件大小
                size = img_path.stat().st_size
                if size > self.min_size_bytes:
                    images.append((img_path, size))
        
        # 按大小降序排序
        images.sort(key=lambda x: x[1], reverse=True)
        return images
    
    def convert_to_webp(self, img_path: Path) -> Tuple[bool, str, int, int]:
        """
        将图片转换为WebP格式
        
        Args:
            img_path: 图片路径
            
        Returns:
            (是否成功, 消息, 原始大小, 新大小)
        """
        try:
            # 打开图片
            with Image.open(img_path) as img:
                # 保持透明度: 如果是 P 或 LA 模式，转换为 RGBA
                if img.mode in ('P', 'LA'):
                    img = img.convert('RGBA')
                # 如果不是 RGBA 或 RGB (例如 CMYK)，则转换为 RGB
                elif img.mode not in ('RGBA', 'RGB'):
                    img = img.convert('RGB')
                
                # 生成WebP文件路径
                webp_path = img_path.with_suffix('.webp')
                
                # 保存为WebP
                img.save(webp_path, 'WEBP', quality=self.quality, method=6)
                
                # 获取文件大小
                original_size = img_path.stat().st_size
                new_size = webp_path.stat().st_size
                
                return True, f"成功转换: {webp_path.name}", original_size, new_size
                
        except Exception as e:
            return False, f"转换失败: {str(e)}", 0, 0
    
    def format_size(self, size_bytes: int) -> str:
        """格式化文件大小"""
        kb = size_bytes / 1024
        if kb < 1024:
            return f"{kb:.2f} KB"
        else:
            mb = kb / 1024
            return f"{mb:.2f} MB"
    
    def print_scan_results(self, images: List[Tuple[Path, int]]):
        """打印扫描结果"""
        if not images:
            print("未找到符合条件的图片")
            return
        
        print(f"\n找到 {len(images)} 个大于 {self.min_size_bytes // 1024} KB 的图片:\n")
        print(f"{'路径':<80} {'大小':>15}")
        print("-" * 95)
        
        for img_path, size in images:
            # 计算相对路径
            try:
                rel_path = img_path.relative_to(self.base_path)
            except ValueError:
                rel_path = img_path
            
            print(f"{str(rel_path):<80} {self.format_size(size):>15}")
        
        total_size = sum(size for _, size in images)
        print("-" * 95)
        print(f"总计: {len(images)} 个文件, {self.format_size(total_size)}")
    
    def convert_all(self, images: List[Tuple[Path, int]]):
        """批量转换图片"""
        if not images:
            print("没有需要转换的图片")
            return
        
        print(f"\n开始转换 {len(images)} 个图片...\n")
        
        success_count = 0
        fail_count = 0
        total_original = 0
        total_new = 0
        
        for i, (img_path, _) in enumerate(images, 1):
            # 计算相对路径
            try:
                rel_path = img_path.relative_to(self.base_path)
            except ValueError:
                rel_path = img_path
            
            print(f"[{i}/{len(images)}] 处理: {rel_path}")
            
            success, message, original_size, new_size = self.convert_to_webp(img_path)
            
            if success:
                success_count += 1
                total_original += original_size
                total_new += new_size
                saved = original_size - new_size
                saved_percent = (saved / original_size * 100) if original_size > 0 else 0
                print(f"  ✓ {message}")
                print(f"    原始: {self.format_size(original_size)} -> WebP: {self.format_size(new_size)} "
                      f"(节省 {self.format_size(saved)}, {saved_percent:.1f}%)")
            else:
                fail_count += 1
                print(f"  ✗ {message}")
            
            print()
        
        # 打印总结
        print("=" * 95)
        print(f"转换完成!")
        print(f"  成功: {success_count} 个")
        print(f"  失败: {fail_count} 个")
        
        if total_original > 0:
            total_saved = total_original - total_new
            saved_percent = (total_saved / total_original * 100)
            print(f"  原始总大小: {self.format_size(total_original)}")
            print(f"  WebP总大小: {self.format_size(total_new)}")
            print(f"  节省空间: {self.format_size(total_saved)} ({saved_percent:.1f}%)")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='图片优化工具 - 扫描并转换大图片为WebP格式')
    parser.add_argument('--scan', action='store_true', help='仅扫描并列出大图片')
    parser.add_argument('--convert', action='store_true', help='扫描并转换为WebP格式')
    parser.add_argument('--path', type=str, required=True, help='项目路径')
    parser.add_argument('--min-size', type=int, default=100, help='最小文件大小(KB),默认100')
    parser.add_argument('--quality', type=int, default=85, help='WebP质量(1-100),默认85')
    parser.add_argument('--exclude', type=str, nargs='*', help='额外排除的目录')
    
    args = parser.parse_args()
    
    # 验证参数
    if not args.scan and not args.convert:
        parser.error("必须指定 --scan 或 --convert")
    
    if args.quality < 1 or args.quality > 100:
        parser.error("quality 必须在 1-100 之间")
    
    # 合并排除列表
    excludes = DEFAULT_EXCLUDES.copy()
    if args.exclude:
        excludes.extend(args.exclude)
    
    # 创建优化器
    optimizer = ImageOptimizer(
        base_path=args.path,
        min_size_kb=args.min_size,
        quality=args.quality,
        excludes=excludes
    )
    
    # 扫描图片
    print(f"正在扫描 {args.path} ...")
    images = optimizer.scan_images()
    
    # 显示结果
    optimizer.print_scan_results(images)
    
    # 如果是转换模式,执行转换
    if args.convert and images:
        print("\n" + "=" * 95)
        response = input(f"\n是否要将这些图片转换为WebP格式? (y/n): ")
        if response.lower() in ['y', 'yes']:
            optimizer.convert_all(images)
        else:
            print("已取消转换")


if __name__ == '__main__':
    main()
