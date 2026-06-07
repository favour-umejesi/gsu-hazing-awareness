#!/usr/bin/env python3
"""Build search-index.json for static End Hazing mirror + fix UA_TitleSearch form actions."""

import html as html_module
import json
import os
import re
import glob

SITE_ROOT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "cloned_site",
    "site",
)

UA_SEARCH_TERMS = re.compile(
    r"University of Alabama|\bAlabama\b|Capstone|UAct|UAPD|"
    r"policystat\.com|safecolleges\.com|UnivofAlabama|"
    r"assetfiles\.ua\.edu|sl\.ua\.edu|www\.ua\.edu|"
    r"Division of Student Life|bamastudentlife|Roll Tide|Tuscaloosa",
    re.I,
)


def depth_from_root(rel_path: str) -> int:
    d = os.path.dirname(rel_path.replace("\\", "/"))
    if not d or d == ".":
        return 0
    return len([x for x in d.split("/") if x])


def search_form_action_for_file(rel_path: str) -> str:
    d = depth_from_root(rel_path)
    return ("../" * d) + "search/"


def strip_html_for_text(raw: str) -> str:
    raw = re.sub(r"<script[\s\S]*?</script>", " ", raw, flags=re.I)
    raw = re.sub(r"<style[\s\S]*?</style>", " ", raw, flags=re.I)
    raw = re.sub(r"<[^>]+>", " ", raw)
    raw = re.sub(r"\s+", " ", raw)
    return html_module.unescape(raw).strip()


def extract_indexable_text(content: str) -> str:
    """Index only main page content — skip nav, header chrome, and footer."""
    main = re.search(r"<main[^>]*>([\s\S]*?)</main>", content, re.I)
    if main:
        chunk = main.group(1)
        chunk = re.sub(r"<footer[\s\S]*", " ", chunk, flags=re.I)
        return strip_html_for_text(chunk)
    entry = re.search(
        r'<div class="entry-content[\s\S]*?</div>\s*(?=</div>\s*</main>)',
        content,
        re.I,
    )
    if entry:
        return strip_html_for_text(entry.group(0))
    return strip_html_for_text(content)


def sanitize_search_text(text: str) -> str:
    text = re.sub(r"https?://[^\s]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def should_index(rel: str) -> bool:
    if "/feed/" in rel or rel.startswith("wp-json"):
        return False
    if rel.replace("\\", "/").startswith("search/"):
        return False
    if rel.startswith("posts/"):
        return False
    if rel.startswith("index.html?p="):
        return False
    if not rel.lower().endswith(".html"):
        return False
    return True


def main():
    all_html = glob.glob(os.path.join(SITE_ROOT, "**", "*.html"), recursive=True)
    entries = []
    for filepath in sorted(all_html):
        rel = os.path.relpath(filepath, SITE_ROOT).replace("\\", "/")
        if not should_index(rel):
            continue
        index_path = rel
        if rel.endswith("/index.html"):
            index_path = rel[: -len("index.html")]
        elif rel == "index.html":
            index_path = ""
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except OSError:
            continue
        m = re.search(r"<title[^>]*>([\s\S]*?)</title>", content, re.I)
        title = sanitize_search_text(strip_html_for_text(m.group(1)) if m else rel)
        text = sanitize_search_text(extract_indexable_text(content))[:8000]
        if not text and not title:
            continue
        if UA_SEARCH_TERMS.search(title) or UA_SEARCH_TERMS.search(text):
            continue
        entries.append({"path": index_path, "title": title, "text": text})

    out_json = os.path.join(SITE_ROOT, "search-index.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=0)
    print(f"Wrote {len(entries)} entries to {out_json}")

    updated = 0
    for filepath in all_html:
        rel = os.path.relpath(filepath, SITE_ROOT).replace("\\", "/")
        if not rel.lower().endswith(".html"):
            continue
        if "/feed/" in rel or rel.startswith("wp-json"):
            continue
        new_action = search_form_action_for_file(rel)
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            c = f.read()
        orig = c
        c = re.sub(
            r'(id="UA_TitleSearch"\s*\n\s*action=")[^"]*(")',
            rf"\1{new_action}\2",
            c,
            count=1,
        )
        if c != orig:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(c)
            updated += 1
    print(f"Updated UA_TitleSearch form action in {updated} files")


if __name__ == "__main__":
    main()
