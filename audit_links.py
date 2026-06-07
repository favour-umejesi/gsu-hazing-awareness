#!/usr/bin/env python3
"""Audit internal links in the static GSU Hazing Awareness site."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

SITE_ROOT = Path(__file__).resolve().parent / "cloned_site" / "site"

SKIP_PARTS = {"/feed/", "wp-json", "/search/"}


def should_process(path: Path) -> bool:
    rel = path.as_posix()
    if not rel.endswith(".html"):
        return False
    return not any(part in rel for part in SKIP_PARTS)


def target_exists(resolved: Path) -> bool:
    if resolved.is_file():
        return True
    if resolved.is_dir() and (resolved / "index.html").is_file():
        return True
    return False


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[int, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return
        for name, value in attrs:
            if name == "href" and value:
                self.links.append((self.getpos()[0], value))


def resolve_href(from_file: Path, href: str) -> tuple[str | None, Path | None]:
    href = unquote(href.strip())
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None, None
    parsed = urlparse(href)
    if parsed.scheme in ("http", "https"):
        return None, None
    path = parsed.path
    if not path:
        return href, from_file.parent
    if path.startswith("/"):
        target = (SITE_ROOT / path.lstrip("/")).resolve()
    else:
        target = (from_file.parent / path).resolve()
    try:
        target.relative_to(SITE_ROOT.resolve())
    except ValueError:
        return href, None
    return href, target


def main() -> int:
    broken: list[tuple[str, int, str, str]] = []
    checked = 0

    for html_file in sorted(SITE_ROOT.rglob("*.html")):
        if not should_process(html_file):
            continue
        rel_from = html_file.relative_to(SITE_ROOT).as_posix()
        try:
            text = html_file.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        parser = LinkParser()
        parser.feed(text)
        for line, href in parser.links:
            checked += 1
            original, target = resolve_href(html_file, href)
            if original is None:
                continue
            if target is None:
                broken.append((rel_from, line, href, "outside site root"))
                continue
            if not target_exists(target):
                broken.append((rel_from, line, href, "target missing"))

    print(f"Checked {checked} links in {SITE_ROOT}")
    if not broken:
        print("No broken internal links found.")
        return 0

    print(f"\nBroken internal links ({len(broken)}):")
    for page, line, href, reason in broken:
        print(f"  {page}:{line}  {href!r}  ({reason})")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
