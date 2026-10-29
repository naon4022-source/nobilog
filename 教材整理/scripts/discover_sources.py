"""Register new material files only; never OCR answers or mark sources verified."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import catalog

EXTENSIONS = {'.jpg', '.jpeg', '.png', '.heic', '.heif', '.pdf'}

def discover():
    sources = json.loads(catalog.SOURCE_LIST.read_text(encoding='utf-8'))
    known = {catalog.source_path(raw)[1] for raw in sources}
    roots = [catalog.PROJECT / folder for folder in catalog.WORKBOOK_ROOTS]
    roots += [catalog.PROJECT / 'ドリル' / folder for folder in catalog.DRILL_SUBJECTS]
    added = []
    for root in roots:
        if not root.is_dir():
            continue
        for path in sorted(root.rglob('*')):
            if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
                continue
            _, relative = catalog.source_path(str(path))
            catalog.classify(relative)
            if relative not in known:
                known.add(relative)
                added.append(str(path.relative_to(catalog.PROJECT)))
    return sources, added

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--grade', type=int, choices=[1, 2, 3])
    args = parser.parse_args()
    sources, added = discover()
    if args.check:
        print(f'未登録の教材: {len(added)}件（画像・台帳は無変更）')
        return 1 if added else 0
    if not added:
        print('追加なし。台帳は無変更。')
        return 0
    original = catalog.SOURCE_LIST.read_bytes()
    catalog.SOURCE_LIST.write_text(json.dumps(sources + added, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    try:
        rows = catalog.build()
        new_paths = {catalog.source_path(raw)[1] for raw in added}
        for row in rows:
            if catalog.source_path(row['file'])[1] in new_paths:
                row['verified'] = False
                if row['mode'] == 'workbook':
                    row['grade'] = args.grade
                row['reviewNote'] = '追加登録のみ。ページ・設問・解答は未照合。'
        catalog.CATALOG.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    except Exception:
        catalog.SOURCE_LIST.write_bytes(original)
        raise
    print(f'{len(added)}件を追加登録。確認済みの扱いにはしていません。合計{len(rows)}件。')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
