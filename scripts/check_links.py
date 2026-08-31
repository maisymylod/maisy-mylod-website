#!/usr/bin/env python3
"""Check that every internal link, asset, and anchor on the site resolves.

External URLs are deliberately not fetched: they make CI flaky and slow, and
a rate-limited request is not evidence that a link is broken.
"""

from __future__ import annotations

import html
import pathlib
import re
import sys
from urllib.parse import unquote, urlparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_SCHEMES = ("http://", "https://", "mailto:", "tel:", "data:", "javascript:")

REF = re.compile(r'\b(?:href|src)\s*=\s*"([^"]+)"')
ID = re.compile(r'\bid\s*=\s*"([^"]+)"')


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        print("no HTML pages found", file=sys.stderr)
        return 1

    ids: dict[str, list[str]] = {}
    for page in pages:
        ids[page.name] = ID.findall(page.read_text(encoding="utf-8"))

    problems: list[str] = []

    # A duplicate id silently breaks anchor navigation and querySelector.
    for name, found in ids.items():
        for dupe in {i for i in found if found.count(i) > 1}:
            problems.append(f"{name}: duplicate id {dupe!r}")

    for page in pages:
        text = page.read_text(encoding="utf-8")
        for raw in REF.findall(text):
            ref = html.unescape(raw).strip()
            if not ref or ref.startswith(SKIP_SCHEMES):
                continue

            if ref.startswith("#"):
                if len(ref) > 1 and ref[1:] not in ids[page.name]:
                    problems.append(f"{page.name}: anchor {ref} does not exist on the page")
                continue

            parsed = urlparse(ref)
            target = unquote(parsed.path)
            if not target:
                continue

            resolved = (ROOT / target).resolve()
            if not resolved.exists():
                problems.append(f"{page.name}: missing target -> {target}")
            elif parsed.fragment and target.endswith(".html"):
                if parsed.fragment not in ids.get(pathlib.Path(target).name, []):
                    problems.append(
                        f"{page.name}: {target}#{parsed.fragment} anchor does not exist"
                    )

    checked = sum(len(REF.findall(p.read_text(encoding='utf-8'))) for p in pages)
    print(f"checked {checked} references across {len(pages)} pages")

    if problems:
        print(f"\n{len(problems)} problem(s):", file=sys.stderr)
        for problem in problems:
            print(f"  {problem}", file=sys.stderr)
        return 1

    print("all internal links, assets, and anchors resolve")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
