#!/usr/bin/env python3
"""
Sync stream.json → content/now.json dynamic sections.
Run after stream.json updates.

Tag mapping:
  #music → 🎵 最近在聽
  #video → 🎬 最近在看
  #digest, #readwise → 📖 最近在讀
  (all recent) → 🌊 最近的碎片
"""

import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

CONTENT_DIR = Path(__file__).parent.parent / "content"
STREAM_PATH = CONTENT_DIR / "stream.json"
NOW_PATH = CONTENT_DIR / "now.json"

TAG_MAP = {
    "music": "music",
    "video": "video",
    "digest": "reading",
    "readwise": "reading",
}

LIMITS = {"music": 5, "video": 4, "reading": 5, "fragments": 5}
EXPIRY_DAYS = {"music": 30, "video": 60, "reading": 60, "fragments": 30}
ARCHIVE_CAP = 50


def extract_youtube_id(text: str) -> str | None:
    m = re.search(r"(?:youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})", text)
    return m.group(1) if m else None


def extract_url(text: str) -> str | None:
    # Stop at CJK characters, common Chinese punctuation, and non-URL chars
    m = re.search(r"https?://[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+", text)
    return m.group(0).rstrip(").,;:") if m else None


def clean_title(text: str) -> str:
    cleaned = re.sub(r"https?://\S+", "", text)
    cleaned = re.sub(r"#[a-zA-Z0-9_]+", "", cleaned)
    # Remove emoji prefixes and known label prefixes
    cleaned = re.sub(r"^[^\w\u4e00-\u9fff]*", "", cleaned)  # strip leading non-word/non-CJK
    cleaned = re.sub(r"^(Chill\s*音樂|Cool\s*影片|好文|精選摘要|精選摘錄|新文章|精選|摘要)\s*", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:120] if cleaned else "Untitled"


def clean_digest_title(text: str) -> tuple[str, str | None]:
    """Extract title and note from digest/readwise format.
    Format: 📚 精選摘要 #readwise[Title]作者: [Author]來源: [URL]...[Note]
    Returns (title, note)
    """
    cleaned = re.sub(r"#[a-zA-Z0-9_]+", "", text)
    cleaned = re.sub(r"^[^\w\u4e00-\u9fff]*", "", cleaned)
    cleaned = re.sub(r"^(精選摘要|精選摘錄)\s*", "", cleaned)

    # Extract title (before 作者:)
    title_match = re.match(r"^(.+?)(?:作者[:：]|來源[:：])", cleaned)
    title = title_match.group(1).strip() if title_match else cleaned[:80]

    # Extract note (prefer explicit 💡 Note:, fallback to excerpt after URL)
    note_match = re.search(r"(?:💡\s*)?Note[:：]\s*(.+?)(?:🔗|$)", text, re.DOTALL)
    if note_match:
        note = note_match.group(1).strip()[:120]
    else:
        # Fallback: grab text after the source URL as excerpt
        # URL pattern stops at CJK characters (they're not part of URLs)
        url_match = re.search(r"來源[:：]\s*https?://[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+", text)
        if url_match:
            remainder = text[url_match.end():].strip()
            # Remove trailing link/emoji cruft
            remainder = re.sub(r"🔗.*$", "", remainder).strip()
            note = remainder[:120] if remainder else None
        else:
            note = None

    return title, note


def stream_to_item(entry: dict, category: str | None = None) -> dict:
    text = entry.get("text", "") or entry.get("title", "")
    yt_id = extract_youtube_id(text)
    url = extract_url(text)

    if category == "reading":
        title, note = clean_digest_title(text)
    else:
        title = clean_title(text)
        note = None

    item: dict = {
        "streamId": entry.get("id"),
        "title": title,
        "date": entry.get("pubDate", ""),
        "tag": (entry.get("tags") or [""])[0],
        "url": url,
        "youtubeId": yt_id,
        "image": f"https://img.youtube.com/vi/{yt_id}/hqdefault.jpg" if yt_id else None,
        "sourceLink": entry.get("link", ""),
    }
    if note:
        item["description"] = note
    return item


def run():
    if not STREAM_PATH.exists():
        print("[now-sync] stream.json not found, skip")
        return

    stream = json.loads(STREAM_PATH.read_text())

    # Load existing now.json (preserve sections)
    if NOW_PATH.exists():
        now = json.loads(NOW_PATH.read_text())
    else:
        now = {
            "lastUpdated": "",
            "sections": [],
            "dynamic": {"music": [], "video": [], "reading": [], "fragments": []},
            "_archive": {"music": [], "video": [], "reading": [], "fragments": []},
        }

    categorized: dict[str, list] = {"music": [], "video": [], "reading": [], "fragments": []}
    seen_ids: dict[str, set] = {k: set() for k in categorized}

    for entry in stream:
        # id 是去重和 archive 比對的 key，缺 id 的 entry 沒辦法處理——跳過並警告
        entry_id = entry.get("id")
        if not entry_id:
            print(f"[now-sync] WARN: entry without id skipped: {entry.get('text', '')[:50]!r}")
            continue

        pub_str = entry.get("pubDate", "")
        if not pub_str:
            continue
        try:
            pub = datetime.fromisoformat(pub_str)
        except ValueError:
            continue

        tags = entry.get("tags", [])

        # Map to categories
        for tag in tags:
            cat = TAG_MAP.get(tag)
            if cat and entry_id not in seen_ids[cat]:
                cutoff = datetime.now(timezone.utc) - timedelta(days=EXPIRY_DAYS[cat])
                if pub.astimezone(timezone.utc) >= cutoff:
                    item = stream_to_item(entry, category=cat)
                    categorized[cat].append(item)
                    seen_ids[cat].add(entry_id)

        # Fragments: only murmur entries
        if "murmur" in tags and entry_id not in seen_ids["fragments"]:
            cutoff = datetime.now(timezone.utc) - timedelta(days=EXPIRY_DAYS["fragments"])
            if pub.astimezone(timezone.utc) >= cutoff:
                item = stream_to_item(entry, category="fragments")
                categorized["fragments"].append(item)
                seen_ids["fragments"].add(entry_id)

    # Apply limits (stream.json is already sorted newest-first)
    for cat, limit in LIMITS.items():
        categorized[cat] = categorized[cat][:limit]

    # Archive old items
    archive = now.get("_archive", {"music": [], "video": [], "reading": [], "fragments": []})
    for cat in categorized:
        current = now.get("dynamic", {}).get(cat, [])
        new_ids = {i["streamId"] for i in categorized[cat]}
        expired = [i for i in current if i["streamId"] not in new_ids]
        archive[cat] = (expired + archive.get(cat, []))[:ARCHIVE_CAP]

    # Update
    now["dynamic"] = categorized
    now["_archive"] = archive
    now["lastUpdated"] = datetime.now(timezone.utc).isoformat()

    tmp = NOW_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(now, indent=2, ensure_ascii=False) + "\n")
    tmp.rename(NOW_PATH)  # atomic on POSIX

    counts = {k: len(v) for k, v in categorized.items()}
    print(f"[now-sync] Updated: {counts}")


if __name__ == "__main__":
    run()
