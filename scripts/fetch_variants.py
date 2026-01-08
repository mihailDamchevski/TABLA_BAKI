"""
Fetch and normalize backgammon variant rules from bkgm.com/variants.

Outputs a JSON array with a standard schema per variant:
{
  "name": "...",
  "source_url": "...",
  "setup": "...",
  "movement": "...",
  "dice": "...",
  "hitting": "...",
  "bar_enter": "...",
  "forced_moves": "...",
  "combined_moves": "...",
  "bearing_off": "...",
  "win_condition": "...",
  "special_rules": "...",
  "notes": "..."
}

Note: The content on bkgm.com is mostly unstructured; this script
collects page text into the "notes" field. Further parsing can be
added later if needed.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import List, Optional

BASE_INDEX = "https://www.bkgm.com/variants/"


class LinkExtractor(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self.links: List[str] = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        href = dict(attrs).get("href")
        if not href:
            return
        # Only keep links that look like variant pages (html files).
        if href.lower().endswith(".html"):
            full = urllib.parse.urljoin(self.base_url, href)
            if full not in self.links:
                self.links.append(full)


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts: List[str] = []
        self.in_script_or_style = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.in_script_or_style = True

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.in_script_or_style = False

    def handle_data(self, data):
        if self.in_script_or_style:
            return
        text = data.strip()
        if text:
            self.text_parts.append(text)

    def get_text(self) -> str:
        return " ".join(self.text_parts)


@dataclass
class VariantEntry:
    name: str
    source_url: str
    setup: str = ""
    movement: str = ""
    dice: str = ""
    hitting: str = ""
    bar_enter: str = ""
    forced_moves: str = ""
    combined_moves: str = ""
    bearing_off: str = ""
    win_condition: str = ""
    special_rules: str = ""
    notes: str = ""

    def to_dict(self):
        return {
            "name": self.name,
            "source_url": self.source_url,
            "setup": self.setup,
            "movement": self.movement,
            "dice": self.dice,
            "hitting": self.hitting,
            "bar_enter": self.bar_enter,
            "forced_moves": self.forced_moves,
            "combined_moves": self.combined_moves,
            "bearing_off": self.bearing_off,
            "win_condition": self.win_condition,
            "special_rules": self.special_rules,
            "notes": self.notes,
        }


def fetch(url: str) -> str:
    with urllib.request.urlopen(url) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def extract_links(index_html: str) -> List[str]:
    parser = LinkExtractor(BASE_INDEX)
    parser.feed(index_html)
    return parser.links


def extract_text(html: str) -> str:
    parser = TextExtractor()
    parser.feed(html)
    text = parser.get_text()
    # Collapse excessive whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def infer_name_from_url(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    name = path.rstrip("/").split("/")[-1]
    if name.lower().endswith(".html"):
        name = name[:-5]
    return name.replace("-", " ").replace("_", " ").title()


def main(output_path: Optional[str] = None):
    print("Fetching index...", file=sys.stderr)
    index_html = fetch(BASE_INDEX)
    links = extract_links(index_html)
    print(f"Found {len(links)} variant links", file=sys.stderr)

    variants: List[VariantEntry] = []
    for link in links:
        try:
            page_html = fetch(link)
            text = extract_text(page_html)
            name_match = re.search(r"<title>(.*?)</title>", page_html, re.IGNORECASE | re.DOTALL)
            if name_match:
                title = name_match.group(1).strip()
                # Clean common suffixes
                title = re.sub(r"Backgammon Galore!|\s*Backgammon\s*Variants?", "", title, flags=re.IGNORECASE).strip(" -|")
                name = title if title else infer_name_from_url(link)
            else:
                name = infer_name_from_url(link)

            entry = VariantEntry(
                name=name,
                source_url=link,
                notes=text,
            )
            variants.append(entry)
            print(f"Fetched: {name}", file=sys.stderr)
        except Exception as exc:  # noqa: BLE001
            print(f"Failed to fetch {link}: {exc}", file=sys.stderr)
            entry = VariantEntry(
                name=infer_name_from_url(link),
                source_url=link,
                notes=f"Fetch error: {exc}",
            )
            variants.append(entry)

    data = [v.to_dict() for v in variants]
    out = json.dumps(data, indent=2, ensure_ascii=False)
    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"Wrote {len(variants)} variants to {output_path}", file=sys.stderr)
    else:
        print(out)


if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else None
    main(out_path)
