"""Catalog textbook reference photos without treating them as verified questions."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[2]
CATALOG = PROJECT / "教材整理" / "教科書参考資料台帳.json"
SOURCE_SETS = {
    "国語の教科書": ("textbook-reference", "中一"),
    "国語資料集": ("supplement-reference", "中一〜中三"),
}


def stable_id(relative: str) -> str:
    return "reference-" + hashlib.sha256(relative.encode("utf-8")).hexdigest()[:16]


def reconcile(relative: str, digest: str, kind: str, grade_scope: str, previous: dict | None) -> dict:
    same_image = bool(previous and previous.get("sha256") == digest)
    return {
        "id": stable_id(relative),
        "file": relative,
        "sha256": digest,
        "kind": kind,
        "subject": "国語",
        "gradeScope": grade_scope,
        "verified": bool(previous.get("verified")) if same_image else False,
        "pages": previous.get("pages", []) if same_image else [],
        "units": previous.get("units", []) if same_image else [],
    }


def load_existing() -> dict[str, dict]:
    if not CATALOG.exists():
        return {}
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise ValueError("reference catalog must be a list")
    existing: dict[str, dict] = {}
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("file"), str):
            raise ValueError("invalid reference catalog row")
        if row["file"] in existing:
            raise ValueError("duplicate reference source")
        existing[row["file"]] = row
    return existing


def build() -> list[dict]:
    existing = load_existing()
    rows: list[dict] = []
    used_ids: set[str] = set()
    for folder, (kind, grade_scope) in SOURCE_SETS.items():
        root = PROJECT / folder
        if not root.is_dir():
            raise ValueError(f"missing reference folder: {folder}")
        files = sorted(root.iterdir(), key=lambda path: path.name)
        if not files:
            raise ValueError(f"empty reference folder: {folder}")
        for path in files:
            if path.is_symlink() or not path.is_file() or path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".heic"}:
                raise ValueError(f"unsupported reference entry: {path.name}")
            relative = path.relative_to(PROJECT).as_posix()
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            row = reconcile(relative, digest, kind, grade_scope, existing.get(relative))
            if row["id"] in used_ids:
                raise ValueError("reference ID collision")
            used_ids.add(row["id"])
            rows.append(row)
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the catalog without writing")
    args = parser.parse_args()
    rows = build()
    previous = json.loads(CATALOG.read_text(encoding="utf-8")) if CATALOG.exists() else []
    if args.check:
        if rows != previous:
            print("参考資料台帳に未反映または変更された画像があります。")
            return 1
        print(f"参考資料台帳OK: {len(rows)}枚 / 人手確認済み {sum(row['verified'] for row in rows)}枚")
        return 0
    temporary = CATALOG.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(CATALOG)
    print(f"参考資料台帳を更新: {len(rows)}枚。ページ・単元は推測せず未確認のまま。")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"参考資料台帳を更新できません: {exc}")
        sys.exit(1)
