#!/usr/bin/env python3
"""使用 colordiff 对两个目录进行递归比较。"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

import shutil
from pathspec import PathSpec


DEFAULT_EXCLUDES = [".git"]

ARGPARSE_TRANSLATIONS = {
    "usage: ": "用法: ",
    "options": "可选参数",
    "optional arguments": "可选参数",
    "show this help message and exit": "显示帮助并退出",
}


argparse._ = lambda s: ARGPARSE_TRANSLATIONS.get(s, s)  # type: ignore[attr-defined]


class PathSpecIgnore:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.spec = self._build_spec()

    def _build_spec(self) -> PathSpec | None:
        patterns: list[str] = []
        for dirpath, dirnames, _ in os.walk(self.root):
            dirnames[:] = [name for name in dirnames if name not in DEFAULT_EXCLUDES]
            directory = Path(dirpath)
            gitignore_path = directory / ".gitignore"
            if not gitignore_path.is_file():
                continue
            try:
                lines = gitignore_path.read_text(encoding="utf-8").splitlines()
            except OSError:
                continue
            relative_dir = "."
            try:
                relative_dir = directory.relative_to(self.root).as_posix()
            except ValueError:
                pass
            prefix = "" if relative_dir in (".", "") else f"{relative_dir}/"
            for line in lines:
                transformed = self._transform_pattern(line, prefix)
                if transformed is not None:
                    patterns.append(transformed)
        if not patterns:
            return None
        return PathSpec.from_lines("gitwildmatch", patterns)

    def _transform_pattern(self, pattern: str, prefix: str) -> str | None:
        if not pattern:
            return pattern
        stripped = pattern.lstrip()
        if not stripped or stripped.startswith("#"):
            return pattern
        negated = pattern.startswith("!")
        body = pattern[1:] if negated else pattern
        body = body.lstrip("/")
        if prefix and body:
            body = f"{prefix}{body}"
        elif prefix and not body:
            body = prefix.rstrip("/")
        if not body:
            return None
        return f"!{body}" if negated else body

    def matches_file(self, relative: Path) -> bool:
        if self.spec is None:
            return False
        candidate = relative.as_posix()
        return self.spec.match_file(candidate)

    def matches_dir(self, relative: Path) -> bool:
        if self.spec is None:
            return False
        candidate = relative.as_posix()
        if candidate and not candidate.endswith("/"):
            candidate = f"{candidate}/"
        return self.spec.match_file(candidate)

    def is_ignored(self, path: Path) -> bool:
        if self.spec is None:
            return False
        try:
            relative = path.relative_to(self.root)
        except ValueError:
            return False
        if path.is_dir():
            return self.matches_dir(relative)
        return self.matches_file(relative)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="调用 colordiff 展示两个目录之间的差异。",
        add_help=False,
    )
    parser.add_argument("-h", "--help", action="help", help="显示帮助并退出")
    parser.add_argument(
        "--from",
        dest="source_from",
        required=True,
        type=Path,
        help="对比的源目录路径",
    )
    parser.add_argument(
        "--to",
        dest="source_to",
        required=True,
        type=Path,
        help="对比的目标目录路径",
    )
    parser.add_argument(
        "--colordiff-bin",
        dest="colordiff_bin",
        type=str,
        help="自定义 colordiff 可执行文件路径",
    )
    parser.add_argument(
        "--no-recursive",
        dest="recursive",
        action="store_false",
        help="只比较顶层文件，不递归子目录",
    )
    parser.add_argument(
        "--line",
        dest="line_limit",
        type=int,
        help="只显示行数少于该值的差异块",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="输出正在比较的文件路径及处理结果",
    )
    parser.set_defaults(recursive=True)
    return parser.parse_args()


def ensure_directory(path: Path, label: str) -> None:
    if not path.exists():
        raise ValueError(f"{label} 不存在: {path}")
    if not path.is_dir():
        raise ValueError(f"{label} 不是目录: {path}")


def resolve_colordiff(candidate: str | None) -> str:
    if candidate:
        if shutil.which(candidate):
            return candidate
        resolved = shutil.which(candidate, path=str(Path(candidate).parent))
        if resolved:
            return resolved
        raise FileNotFoundError(f"未找到指定的 colordiff 可执行文件: {candidate}")
    detected = shutil.which("colordiff")
    if detected:
        return detected
    raise FileNotFoundError("系统中未找到 colordiff，请先安装该工具。")


def collect_files(root: Path, *, recursive: bool) -> dict[Path, Path]:
    files: dict[Path, Path] = {}
    for dirpath, dirnames, filenames in os.walk(root):
        current = Path(dirpath)
        try:
            relative_dir = current.relative_to(root)
        except ValueError:
            continue
        if recursive:
            dirnames[:] = [name for name in dirnames if name not in DEFAULT_EXCLUDES]
        else:
            dirnames[:] = []
        for filename in filenames:
            relative = (
                Path(filename) if relative_dir == Path(".") else relative_dir / filename
            )
            if any(part in DEFAULT_EXCLUDES for part in relative.parts):
                continue
            full_path = current / filename
            if full_path.is_file():
                files[relative] = full_path
    return files


def files_differ(left: Path, right: Path) -> bool:
    try:
        if left.stat().st_size != right.stat().st_size:
            return True
    except OSError:
        return True
    try:
        with left.open("rb") as left_file, right.open("rb") as right_file:
            while True:
                left_chunk = left_file.read(8192)
                right_chunk = right_file.read(8192)
                if not left_chunk and not right_chunk:
                    return False
                if left_chunk != right_chunk:
                    return True
    except OSError:
        return True
    return False


def is_binary_file(path: Path) -> bool:
    try:
        with path.open("rb") as file_obj:
            chunk = file_obj.read(2048)
            if b"\0" in chunk:
                return True
    except OSError:
        return False
    return False


def run_colordiff(command: list[str]) -> tuple[int, str, str]:
    try:
        completed = subprocess.run(
            command,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            env={**os.environ, "TERM": os.environ.get("TERM", "xterm-256color")},
        )
    except OSError as exc:
        raise RuntimeError(f"执行 colordiff 失败: {exc}")
    return completed.returncode, completed.stdout, completed.stderr


def run_file_diff(
    colordiff_path: str, left: Path | None, right: Path | None
) -> tuple[int, str, str]:
    command = [colordiff_path, "-u", "-N"]
    if left is None:
        command.extend(["/dev/null", str(right)])
    elif right is None:
        command.extend([str(left), "/dev/null"])
    else:
        command.extend([str(left), str(right)])
    return run_colordiff(command)


def count_block_lines(block: str) -> int:
    stripped = block.rstrip("\n")
    if not stripped:
        return 0
    return stripped.count("\n") + 1


def build_verbose_description(
    relative: Path, left_exists: bool, right_exists: bool
) -> str:
    text = relative.as_posix()
    if left_exists and right_exists:
        return text
    if left_exists:
        return f"{text} (仅源目录)"
    if right_exists:
        return f"{text} (仅目标目录)"
    return text


def format_verbose_message(
    relative: Path,
    left_exists: bool,
    right_exists: bool,
    *,
    kept: bool,
    reason: str,
) -> str:
    description = build_verbose_description(relative, left_exists, right_exists)
    status = "保留" if kept else f"跳过({reason})"
    return f"正在比较: {description} -> {status}"


def format_exit_message(
    *,
    differences_found: bool,
    output_printed: bool,
    line_limit: int | None,
    ignored_blocks: bool,
    line_filtered: bool,
    binary_filtered: bool,
) -> str:
    if not differences_found:
        return "目录内容完全一致。"
    if output_printed:
        return "目录存在差异（已显示 colordiff 输出）。"
    reasons: list[str] = []
    if ignored_blocks:
        reasons.append(".gitignore 规则")
    if line_limit is not None and line_filtered:
        reasons.append(f"行数阈值(>= {line_limit} 行)")
    if binary_filtered:
        reasons.append("二进制文件")
    if reasons:
        return f"目录存在差异，但差异块已被以下条件过滤: {'、'.join(reasons)}。"
    return "目录存在差异。"


def should_ignore(
    left_path: Path | None,
    right_path: Path | None,
    ignore_from: PathSpecIgnore,
    ignore_to: PathSpecIgnore,
) -> bool:
    if left_path is not None and ignore_from.is_ignored(left_path):
        return True
    if right_path is not None and ignore_to.is_ignored(right_path):
        return True
    return False


def main() -> int:
    args = parse_args()
    if args.line_limit is not None and args.line_limit < 1:
        print("--line 参数必须是大于 0 的整数", file=sys.stderr)
        return 2

    source_from = args.source_from.resolve()
    source_to = args.source_to.resolve()

    try:
        ensure_directory(source_from, "源目录")
        ensure_directory(source_to, "目标目录")
    except ValueError as error:
        print(error, file=sys.stderr)
        return 2

    try:
        colordiff_path = resolve_colordiff(args.colordiff_bin)
    except FileNotFoundError as error:
        print(error, file=sys.stderr)
        return 127

    ignore_from = PathSpecIgnore(source_from)
    ignore_to = PathSpecIgnore(source_to)

    files_from = collect_files(source_from, recursive=args.recursive)
    files_to = collect_files(source_to, recursive=args.recursive)

    all_relatives = sorted(set(files_from) | set(files_to))

    differences_found = False
    output_printed = False
    ignored_blocks = False
    line_filtered = False
    binary_filtered = False

    for relative in all_relatives:
        left_path = files_from.get(relative)
        right_path = files_to.get(relative)

        left_exists = left_path is not None
        right_exists = right_path is not None

        left_binary = left_path is not None and is_binary_file(left_path)
        right_binary = right_path is not None and is_binary_file(right_path)

        if left_exists and right_exists:
            difference_detected = files_differ(left_path, right_path)
        else:
            difference_detected = True

        if not difference_detected:
            if args.verbose:
                message = format_verbose_message(
                    relative,
                    left_exists,
                    right_exists,
                    kept=False,
                    reason="内容一致",
                )
                print(message, file=sys.stderr)
            continue

        if should_ignore(left_path, right_path, ignore_from, ignore_to):
            ignored_blocks = True
            if args.verbose:
                message = format_verbose_message(
                    relative,
                    left_exists,
                    right_exists,
                    kept=False,
                    reason=".gitignore 规则",
                )
                print(message, file=sys.stderr)
            continue

        differences_found = True

        if left_binary or right_binary:
            binary_filtered = True
            if args.verbose:
                message = format_verbose_message(
                    relative,
                    left_exists,
                    right_exists,
                    kept=False,
                    reason="二进制文件",
                )
                print(message, file=sys.stderr)
            continue

        try:
            return_code, stdout_text, stderr_text = run_file_diff(
                colordiff_path, left_path, right_path
            )
        except RuntimeError as error:
            print(error, file=sys.stderr)
            return 126

        if stderr_text:
            sys.stderr.write(stderr_text)

        if return_code not in (0, 1):
            print(f"colordiff 返回了非预期的退出码: {return_code}", file=sys.stderr)
            return return_code

        kept = True
        reason = "保留"
        if args.line_limit is not None and stdout_text:
            if count_block_lines(stdout_text) >= args.line_limit:
                kept = False
                reason = f"行数阈值(>= {args.line_limit} 行)"
                line_filtered = True

        if args.verbose:
            message = format_verbose_message(
                relative,
                left_exists,
                right_exists,
                kept=kept,
                reason=reason,
            )
            print(message, file=sys.stderr)

        if kept and stdout_text:
            sys.stdout.write(stdout_text)
            if not stdout_text.endswith("\n"):
                sys.stdout.write("\n")
            output_printed = True

    final_message = format_exit_message(
        differences_found=differences_found,
        output_printed=output_printed,
        line_limit=args.line_limit,
        ignored_blocks=ignored_blocks,
        line_filtered=line_filtered,
        binary_filtered=binary_filtered,
    )
    print(final_message)

    if not differences_found:
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
