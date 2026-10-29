"""Build the OCR/source catalog without losing human review metadata."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[2]
MATERIALS = PROJECT / "教材整理"
SOURCE_LIST = MATERIALS / "教材ファイル一覧.json"
CATALOG = MATERIALS / "教材照合台帳.json"
OCR_DIR = MATERIALS / "OCR"

DRILL_SUBJECTS = {
    "国語": "国語",
    "数学": "数学",
    "英語": "英語",
    "りか": "理科",
}
WORKBOOK_ROOTS = {
    "国語ワーク": "国語",
    "数学ワーク": "数学",
    "数学": "数学",
    "英語ワーク": "英語",
    "理科ワーク": "理科",
    "社会ワーク": "社会",
    "地理": "社会",
    "地理ワーク": "社会",
    "歴史": "社会",
    "歴史ワーク": "社会",
    "保健体育ワーク": "保健体育",
}

TEXTBOOK_ROOTS = {
    "数学教科書": "数学",
    "地理教科書": "社会",  # 特訓（社会）の参考ページ（2026-10-21 Claude）
    "理科の教科書": "理科",  # 特訓（理科）の参考ページ（2026-10-22 Claude）
    "歴史きょうかしょ": "社会",  # 特訓（社会・歴史）の参考ページ（2026-10-22 Claude）
}

# 検定（数検・漢検・理科検定）の過去問・サンプル。問題の形式とレベルの参考だけに使い、問題文は写さない（2026-10-22 Claude）
KENTEI_ROOTS = {
    "数検": "数学",
    "漢検": "国語",
    "りか検定": "理科",
}


def source_path(raw: str) -> tuple[Path, str]:
    candidate = Path(raw)
    if not candidate.is_absolute():
        candidate = PROJECT / candidate
    resolved = candidate.resolve(strict=True)
    relative = resolved.relative_to(PROJECT.resolve())
    return resolved, unicodedata.normalize("NFC", relative.as_posix())


def classify(relative: str) -> tuple[str, str]:
    parts = unicodedata.normalize("NFC", relative).split("/")
    if len(parts) < 2:
        raise ValueError("source is not inside a recognized material folder")
    if parts[0] == "ドリル":
        if len(parts) < 3 or parts[1] not in DRILL_SUBJECTS:
            raise ValueError("drill subject folder is not recognized")
        return "drill", DRILL_SUBJECTS[parts[1]]
    if parts[0] in WORKBOOK_ROOTS:
        return "workbook", WORKBOOK_ROOTS[parts[0]]
    # 教科書の写真（特訓の参考ページ。2026-10-08 Claude）
    if parts[0] in TEXTBOOK_ROOTS:
        return "textbook", TEXTBOOK_ROOTS[parts[0]]
    if parts[0] in KENTEI_ROOTS:
        return "kentei", KENTEI_ROOTS[parts[0]]
    raise ValueError("material folder is not recognized")


def load_existing() -> tuple[dict[str, dict], int]:
    if not CATALOG.exists():
        return {}, -1
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise ValueError("existing catalog must be a JSON array")
    by_source: dict[str, dict] = {}
    max_id = -1
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("file"), str):
            raise ValueError("existing catalog has an invalid row")
        _, relative = source_path(row["file"])
        if relative in by_source:
            raise ValueError("existing catalog has duplicate source paths")
        by_source[relative] = row
        match = re.fullmatch(r"source-(\d{4,})", str(row.get("id", "")))
        if match:
            max_id = max(max_id, int(match.group(1)))
    return by_source, max_id


def load_ocr_by_source() -> dict[str, dict]:
    records: dict[str, dict] = {}
    if not OCR_DIR.exists():
        return records
    for ocr_path in sorted(OCR_DIR.glob("*.json")):
        data = json.loads(ocr_path.read_text(encoding="utf-8"))
        raw_source = data.get("file")
        if not isinstance(raw_source, str) or not raw_source:
            raise ValueError(f"OCR {ocr_path.name} has no source-file reference")
        _, relative = source_path(raw_source)
        if relative in records:
            raise ValueError(f"multiple OCR records refer to the same source: {relative}")
        lines = data.get("lines", [])
        if not isinstance(lines, list) or any(not isinstance(line, dict) for line in lines):
            raise ValueError(f"OCR {ocr_path.name} has an invalid lines list")
        records[relative] = data
    return records


def build() -> list[dict]:
    sources = json.loads(SOURCE_LIST.read_text(encoding="utf-8"))
    if not isinstance(sources, list):
        raise ValueError("source list must be a JSON array")
    old_by_source, max_id = load_existing()
    ocr_by_source = load_ocr_by_source()
    seen: set[str] = set()
    entries: list[dict] = []

    for raw_source in sources:
        if not isinstance(raw_source, str):
            raise ValueError("source list contains a non-string entry")
        path, relative = source_path(raw_source)
        if not path.is_file():
            raise ValueError(f"source is not a regular file: {relative}")
        if relative in seen:
            raise ValueError(f"source list contains a duplicate file: {relative}")
        seen.add(relative)
        mode, subject = classify(relative)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        previous = old_by_source.get(relative)
        if previous:
            source_id = previous["id"]
            previous_digest = previous.get("sha256")
        else:
            max_id += 1
            source_id = f"source-{max_id:04d}"
            previous_digest = None

        ocr = ocr_by_source.get(relative, {})
        lines = ocr.get("lines", [])
        candidates = [
            line["text"]
            for line in lines
            if isinstance(line.get("text"), str)
            and isinstance(line.get("y"), (int, float))
            and isinstance(line.get("x"), (int, float))
            and line["y"] > 0.88
            and line["x"] < 0.5
        ][:8]
        entry = dict(previous or {})
        entry.update({
            "id": source_id,
            "file": previous.get("file") if previous else str(path.relative_to(PROJECT.resolve())),
            "sha256": digest,
            "mode": mode,
            "subject": subject,
            "ocrComplete": bool(lines),
            "titleCandidates": candidates,
        })
        entry.setdefault("verified", False)
        entry.setdefault("grade", None)
        entry.setdefault("pages", [])

        # A changed image is a new source revision; invalidate its old human confirmation.
        if previous and previous_digest != digest and previous.get("verified") is True:
            entry["verified"] = False
            entry["grade"] = None
            entry["pages"] = []
            entry["reviewNote"] = "画像の内容が変わったため、前回の確認状態を解除。再確認が必要。"
        entries.append(entry)

    return entries


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="確認のみ。台帳は書き換えない")
    args = parser.parse_args()
    entries = build()
    old = json.loads(CATALOG.read_text(encoding="utf-8")) if CATALOG.exists() else []
    if args.check:
        changed = []
        by_id = {row.get("id"): row for row in old if isinstance(row, dict)}
        for entry in entries:
            prior = by_id.get(entry["id"])
            if prior != entry:
                changed.append(entry["id"])
        removed = set(by_id) - {entry["id"] for entry in entries}
        if changed or removed:
            print(f"更新候補: {len(changed)}件 / 一覧から外れた既存項目: {len(removed)}件。台帳は変更していません。")
            if changed:
                print("変更例: " + ", ".join(changed[:12]))
            return 1
        print(f"変更なし: {len(entries)}件を確認。台帳は書き換えていません。")
        return 0

    temporary = CATALOG.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(CATALOG)
    print(f"台帳を更新: {len(entries)}件。人手確認済み扱いには変更していません。")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"台帳更新を中止: {exc}")
        sys.exit(1)
