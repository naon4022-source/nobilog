"""Read-only integrity checks for the source image and OCR review catalog."""
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter
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


def canonical_relative(raw_path: str, *, base: Path = PROJECT) -> tuple[Path, str]:
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = base / candidate
    resolved = candidate.resolve(strict=True)
    try:
        relative = resolved.relative_to(PROJECT)
    except ValueError as exc:
        raise ValueError("source is outside the project") from exc
    normalized = unicodedata.normalize("NFC", relative.as_posix())
    return resolved, normalized


def classify(relative: str) -> tuple[str, str]:
    """Classify only known folder layouts; unknown paths must be reviewed."""
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


def load_ocr_by_source() -> dict[str, list[dict]]:
    by_source: dict[str, list[dict]] = {}
    if not OCR_DIR.exists():
        return by_source
    for ocr_path in sorted(OCR_DIR.glob("*.json")):
        data = json.loads(ocr_path.read_text(encoding="utf-8"))
        raw_source = data.get("file")
        if not isinstance(raw_source, str) or not raw_source:
            raise ValueError(f"OCR {ocr_path.name} has no source-file reference")
        _, relative = canonical_relative(raw_source)
        if relative in by_source:
            raise ValueError(f"multiple OCR records refer to the same source: {relative}")
        lines = data.get("lines", [])
        if not isinstance(lines, list) or any(not isinstance(line, dict) for line in lines):
            raise ValueError(f"OCR {ocr_path.name} has an invalid lines list")
        by_source[relative] = lines
    return by_source


def run() -> int:
    sources = json.loads(SOURCE_LIST.read_text(encoding="utf-8"))
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))
    if not isinstance(sources, list) or not isinstance(rows, list):
        raise ValueError("source list and catalog must both be JSON arrays")
    if len(sources) != len(rows):
        raise ValueError(f"source count differs from catalog ({len(sources)} vs {len(rows)})")

    # Exercise every declared folder layout and reject plausible-looking unknown names.
    for path, expected in [
        ("ドリル/りか/sample.jpg", ("drill", "理科")),
        ("数学ワーク/sample.pdf", ("workbook", "数学")),
        ("数学/sample.jpg", ("workbook", "数学")),
        ("地理/sample.jpg", ("workbook", "社会")),
        ("歴史/sample.jpg", ("workbook", "社会")),
        ("英語ワーク/sample.heic", ("workbook", "英語")),
        ("社会ワーク/sample.jpg", ("workbook", "社会")),
        ("保健体育ワーク/sample.pdf", ("workbook", "保健体育")),
        ("数学教科書/sample.jpg", ("textbook", "数学")),
        ("地理教科書/sample.jpg", ("textbook", "社会")),
        ("数検/sample.pdf", ("kentei", "数学")),
        ("漢検/sample.pdf", ("kentei", "国語")),
        ("りか検定/sample.pdf", ("kentei", "理科")),
    ]:
        if classify(path) != expected:
            raise ValueError(f"folder classification self-check failed for {path}")
    try:
        classify("未分類/sample.jpg")
    except ValueError:
        pass
    else:
        raise ValueError("unknown material folders must fail closed")

    ocr_by_source = load_ocr_by_source()
    errors: list[str] = []
    ids: set[str] = set()
    paths: set[str] = set()
    counts: Counter[tuple[str, str]] = Counter()
    hash_checked = 0
    ocr_checked = 0
    verified_count = 0

    for index, (raw_source, row) in enumerate(zip(sources, rows)):
        label = f"source row {index}"
        if not isinstance(raw_source, str) or not isinstance(row, dict):
            errors.append(f"{label}: invalid source or catalog row")
            continue
        try:
            source_path, relative = canonical_relative(raw_source)
            catalog_path, catalog_relative = canonical_relative(row.get("file", ""))
        except (OSError, ValueError, TypeError):
            errors.append(f"{label}: missing, invalid, or out-of-project file path")
            continue
        if not source_path.is_file() or not catalog_path.is_file():
            errors.append(f"{label}: source is not a regular file")
            continue
        if relative != catalog_relative:
            errors.append(f"{label}: source list and catalog point to different files")
        if relative in paths:
            errors.append(f"{label}: duplicate source path")
        paths.add(relative)

        source_id = row.get("id")
        if not isinstance(source_id, str) or not re.fullmatch(r"source-\d{4,}", source_id):
            errors.append(f"{label}: invalid stable source ID")
        elif source_id in ids:
            errors.append(f"{label}: duplicate source ID")
        else:
            ids.add(source_id)

        try:
            mode, subject = classify(relative)
        except ValueError:
            errors.append(f"{label}: unrecognized material folder")
            continue
        counts[(mode, subject)] += 1
        if row.get("mode") != mode or row.get("subject") != subject:
            errors.append(f"{label}: mode/subject does not match its folder")

        digest = hashlib.sha256(source_path.read_bytes()).hexdigest()
        hash_checked += 1
        if row.get("sha256") != digest:
            errors.append(f"{label}: source file hash differs from the catalog")

        lines = ocr_by_source.get(relative)
        if lines is not None:
            ocr_checked += 1
        has_text = bool(lines)
        if row.get("ocrComplete") is not has_text:
            errors.append(f"{label}: OCR completion flag does not match its source image")
        candidates = row.get("titleCandidates")
        if not isinstance(candidates, list) or any(not isinstance(item, str) for item in candidates):
            errors.append(f"{label}: invalid OCR title candidates")

        verified = row.get("verified")
        if not isinstance(verified, bool):
            errors.append(f"{label}: review status is not explicit")
        elif verified:
            verified_count += 1
            if row.get("grade") not in (1, 2, 3) or not isinstance(row.get("pages"), list) or not row["pages"]:
                errors.append(f"{label}: verified source lacks a grade or page reference")

    if errors:
        print(f"教材台帳チェック失敗: {len(errors)}件")
        for error in errors[:30]:
            print(f"- {error}")
        if len(errors) > 30:
            print(f"- ほか {len(errors) - 30} 件")
        return 1

    summary = "、".join(f"{mode}/{subject} {count}" for (mode, subject), count in sorted(counts.items()))
    print(f"教材台帳OK: {len(rows)}件 / SHA-256照合 {hash_checked}件 / OCR元画像照合 {ocr_checked}件")
    print(f"分類: {summary}")
    print(f"人手確認済み: {verified_count}件（OCRだけで確認済みにしない）")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"教材台帳チェック失敗: {exc}")
        sys.exit(1)
