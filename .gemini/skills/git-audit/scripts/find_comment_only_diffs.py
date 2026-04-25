#!/usr/bin/env python3
"""比较两个代码版本，找出只包含注释或空行差异的文件。"""

from __future__ import annotations

import argparse
import ast
import difflib
import io
from dataclasses import dataclass
from pathlib import Path
import tokenize


ARGPARSE_TRANSLATIONS = {
    "usage: ": "用法: ",
    "options": "可选参数",
    "optional arguments": "可选参数",
    "show this help message and exit": "显示帮助并退出",
}

argparse._ = lambda s: ARGPARSE_TRANSLATIONS.get(s, s)  # type: ignore[attr-defined]


@dataclass
class FileMatch:
    relative_path: Path
    left_path: Path
    right_path: Path
    left_content: str
    right_content: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="找出仅存在注释、文档字符串或空行差异的文件。",
        add_help=False,
    )
    parser.add_argument("-h", "--help", action="help", help="显示帮助并退出")
    parser.add_argument(
        "--from",
        dest="source_from",
        required=True,
        type=Path,
        help="对比的起始目录路径",
    )
    parser.add_argument(
        "--to",
        dest="source_to",
        required=True,
        type=Path,
        help="对比的目标目录路径",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="输出正在比较的文件路径",
    )
    return parser.parse_args()


def iter_files(root: Path) -> dict[Path, Path]:
    files: dict[Path, Path] = {}
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        try:
            relative = path.relative_to(root)
        except ValueError:
            continue
        files[relative] = path
    return files


def strip_docstrings(node: ast.AST) -> ast.AST:
    for child_name, child in ast.iter_fields(node):
        if isinstance(child, list):
            new_items = []
            for item in child:
                if isinstance(item, ast.AST):
                    new_items.append(strip_docstrings(item))
                else:
                    new_items.append(item)
            setattr(node, child_name, new_items)
        elif isinstance(child, ast.AST):
            setattr(node, child_name, strip_docstrings(child))

    if isinstance(
        node, (ast.Module, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
    ):
        new_body = []
        for idx, stmt in enumerate(node.body):
            is_docstring = (
                idx == 0
                and isinstance(stmt, ast.Expr)
                and isinstance(stmt.value, ast.Constant)
                and isinstance(stmt.value.value, str)
            )
            if not is_docstring:
                new_body.append(stmt)
        node.body = new_body
    return node


def normalize_with_ast(text: str) -> str | None:
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return None
    stripped = strip_docstrings(tree)
    return ast.dump(stripped, annotate_fields=False, include_attributes=False)


def normalize_with_tokenize(text: str) -> str | None:
    try:
        tokens = tokenize.generate_tokens(io.StringIO(text).readline)
    except (tokenize.TokenError, IndentationError):
        return None

    normalized: list[tuple[int, str]] = []
    try:
        for tok in tokens:
            if tok.type in {tokenize.COMMENT, tokenize.NL, tokenize.ENCODING}:
                continue
            normalized.append((tok.type, tok.string))
    except (tokenize.TokenError, IndentationError):
        return None

    try:
        return tokenize.untokenize(normalized)
    except (tokenize.TokenError, IndentationError, TypeError):
        return None


def normalize_text_content(text: str) -> str | None:
    normalized = normalize_with_ast(text)
    if normalized is not None:
        return normalized
    return normalize_with_tokenize(text)


def normalize_text(path: Path) -> str | None:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return None

    return normalize_text_content(text)


def read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return None


VISIBLE_SPACE = "·"
VISIBLE_TAB = "⇥"
EMPTY_MARK = "〈空行〉"


def _format_diff_line(text: str) -> str:
    if not text:
        return EMPTY_MARK
    visible = text.replace("\t", VISIBLE_TAB)
    if visible.strip(" ") == "":
        return visible.replace(" ", VISIBLE_SPACE)
    return visible


def build_diff_preview(match: FileMatch) -> list[str]:
    diff_lines: list[str] = []
    for raw_line in difflib.ndiff(
        match.left_content.splitlines(),
        match.right_content.splitlines(),
    ):
        tag = raw_line[:2]
        content = _format_diff_line(raw_line[2:])
        if tag == "- ":
            diff_lines.append(f"左侧：{content}")
        elif tag == "+ ":
            diff_lines.append(f"右侧：{content}")
    return diff_lines


def find_comment_only_differences(
    left_root: Path,
    right_root: Path,
    *,
    verbose: bool = False,
) -> list[FileMatch]:
    left_files = iter_files(left_root)
    right_files = iter_files(right_root)
    matches: list[FileMatch] = []

    for relative_path in sorted(set(left_files) & set(right_files)):
        if verbose:
            print(f"比较中：{relative_path}")
        left_path = left_files[relative_path]
        right_path = right_files[relative_path]

        left_norm = normalize_text(left_path)
        right_norm = normalize_text(right_path)
        if left_norm is None or right_norm is None:
            continue
        if left_norm != right_norm:
            continue

        left_raw = read_text(left_path)
        right_raw = read_text(right_path)
        if left_raw is None or right_raw is None:
            continue
        if left_raw == right_raw:
            continue

        matches.append(
            FileMatch(
                relative_path=relative_path,
                left_path=left_path,
                right_path=right_path,
                left_content=left_raw,
                right_content=right_raw,
            )
        )

    return matches


def main() -> int:
    args = parse_args()

    try:
        from_root = args.source_from.expanduser().resolve()
    except OSError as error:
        raise SystemExit(f"无法解析起始目录：{args.source_from}（{error}）") from error

    try:
        to_root = args.source_to.expanduser().resolve()
    except OSError as error:
        raise SystemExit(f"无法解析目标目录：{args.source_to}（{error}）") from error

    if not from_root.is_dir():
        raise SystemExit(f"起始路径不是有效目录：{from_root}")
    if not to_root.is_dir():
        raise SystemExit(f"目标路径不是有效目录：{to_root}")

    matches = find_comment_only_differences(from_root, to_root, verbose=args.verbose)

    if not matches:
        print("未发现仅包含注释或空行差异的文件。")
        return 0

    print("以下文件仅在注释或空行上存在差异：\n")
    for match in matches:
        print(f"- {match.relative_path}")
        print(f"  左侧：{match.left_path}")
        print(f"  右侧：{match.right_path}")

        diff_lines = build_diff_preview(match)
        if not diff_lines:
            print("  差异：无法生成 diff（可能包含非文本内容）\n")
            continue

        print("  差异：")
        for line in diff_lines:
            print(f"    {line}")
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
