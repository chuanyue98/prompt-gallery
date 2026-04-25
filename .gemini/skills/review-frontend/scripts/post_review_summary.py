#!/usr/bin/env python3
"""
将前端专家评审总结发送到 GitHub PR 评论
直接展示完整的 Markdown 格式内容，不使用折叠标签
"""

import json
import subprocess
import sys
import re
from pathlib import Path
from typing import Optional


def run_gh_command(cmd: list) -> str:
    """运行 GitHub CLI 命令"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"❌ GitHub CLI 命令失败: {e.stderr}", file=sys.stderr)
        sys.exit(1)


def get_repo_info() -> str:
    """获取当前仓库信息"""
    try:
        result = subprocess.run(
            ["gh", "repo", "view", "--json", "nameWithOwner"],
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(result.stdout)["nameWithOwner"]
    except Exception:
        print("❌ 请在 Git 仓库目录下运行或使用 --repo 参数", file=sys.stderr)
        sys.exit(1)


def sanitize_content(content: str) -> str:
    """清理内容，移除本地路径等敏感信息"""
    # 移除 Windows 绝对路径
    content = re.sub(r"[A-Z]:\\[^\s\n]+", "[本地路径已隐藏]", content)
    # 移除 Unix 绝对路径（保留相对路径）
    content = re.sub(
        r"(?<![a-zA-Z0-9_/])(/[a-z]+/[^\s\n]+)", "[本地路径已隐藏]", content
    )
    # 移除 cci:// 引用
    content = re.sub(r"cci://[^\s\n]+", "[IDE引用已隐藏]", content)
    return content


def validate_summary(content: str) -> bool:
    """验证评审总结的基本格式"""
    required_sections = [
        "## 前端专家评审报告",
        "### 🏁 参与评审的角色",
        "### 📊 评审摘要",
        "### 💡 整体结论",
    ]

    for section in required_sections:
        if section not in content:
            print(f"⚠️  警告: 评审总结缺少必要章节: {section}", file=sys.stderr)
            return False

    return True


def post_pr_comment(pr_number: int, repo: str, comment_body: str):
    """发送评论到 PR"""
    print(f"📤 正在发送评审总结到 PR #{pr_number} ({repo})...")

    # 使用 gh pr comment 命令
    cmd = [
        "gh",
        "pr",
        "comment",
        str(pr_number),
        "--repo",
        repo,
        "--body",
        comment_body,
    ]

    run_gh_command(cmd)
    print(f"✅ 评审总结已成功发送到 PR #{pr_number}")
    print(f"🔗 查看: https://github.com/{repo}/pull/{pr_number}")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="将前端专家评审总结发送到 GitHub PR 评论"
    )
    parser.add_argument("pr_input", type=str, help="PR URL 或编号")
    parser.add_argument(
        "summary_file", type=str, help="包含评审总结的 Markdown 文件路径"
    )
    parser.add_argument("--repo", type=str, help="仓库名称 (owner/repo)")
    parser.add_argument(
        "--skip-validation", action="store_true", help="跳过评审总结格式验证"
    )

    args = parser.parse_args()

    # 解析 PR 编号和仓库
    pr_id = args.pr_input
    repo = args.repo

    if "github.com" in pr_id:
        # 从 URL 提取仓库和 PR 编号
        match = re.search(r"github\.com/([^/]+/[^/]+)/pull/(\d+)", pr_id)
        if match:
            repo = match.group(1)
            pr_id = match.group(2)
        else:
            print("❌ 无效的 PR URL", file=sys.stderr)
            sys.exit(1)

    if not repo:
        repo = get_repo_info()

    # 读取评审总结文件
    summary_path = Path(args.summary_file)
    if not summary_path.exists():
        print(f"❌ 文件不存在: {args.summary_file}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(summary_path, "r", encoding="utf-8") as f:
            summary_content = f.read()
    except Exception as e:
        print(f"❌ 读取文件失败: {e}", file=sys.stderr)
        sys.exit(1)

    # 清理敏感信息
    sanitized_content = sanitize_content(summary_content).strip()

    # 验证评审总结格式（可选）
    if not args.skip_validation:
        if not validate_summary(sanitized_content):
            print("⚠️  警告: 评审总结格式可能不完整", file=sys.stderr)
            print("💡 提示: 使用 --skip-validation 跳过验证", file=sys.stderr)

    # 限制内容长度（GitHub 评论有长度限制）
    max_length = 60000
    if len(sanitized_content) > max_length:
        sanitized_content = (
            sanitized_content[:max_length] + "\n\n...\n\n[内容过长，已截断]"
        )

    # 显示预览
    print("\n" + "=" * 60)
    print("📝 评审总结预览:")
    print("=" * 60)
    preview = (
        sanitized_content[:800] if len(sanitized_content) > 800 else sanitized_content
    )
    print(preview)
    if len(sanitized_content) > 800:
        print("\n... (预览已截断)")
    print("=" * 60)
    print(f"\n评审总结总长度: {len(sanitized_content)} 字符\n")

    # 发送评论
    post_pr_comment(int(pr_id), repo, sanitized_content)


if __name__ == "__main__":
    main()
