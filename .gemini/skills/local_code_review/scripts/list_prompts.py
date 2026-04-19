import os
import glob
import sys

def main():
    # 获取 WORK_HOME 环境变量
    work_home = os.environ.get('WORK_HOME')
    if not work_home:
        print("错误：未设置 WORK_HOME 环境变量", file=sys.stderr)
        sys.exit(1)
    
    # 构建路径
    # 目标: CodeAgent/prompt/front_end_review
    base_path = os.path.join(work_home, 'CodeAgent', 'prompt', 'front_end_review')
    
    if not os.path.exists(base_path):
        print(f"错误：未找到提示词目录: {base_path}", file=sys.stderr)
        sys.exit(1)

    # 搜索 .md 文件
    search_pattern = os.path.join(base_path, "*.md")
    files = glob.glob(search_pattern)

    if not files:
        print(f"警告：在 {base_path} 未找到 Markdown 提示词文件", file=sys.stderr)
    else:
        print(f"找到 {len(files)} 个提示词文件：")
        # 排序以确保顺序确定
        for f in sorted(files):
            print(f"提示词文件: {os.path.abspath(f)}")

if __name__ == "__main__":
    main()
