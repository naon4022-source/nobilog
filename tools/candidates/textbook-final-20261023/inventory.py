"""Inventory actual ready books; missing files and future placeholders stay distinct."""
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ASSETS = ROOT / 'site-assets'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
books = json.loads((ASSETS / 'textbook-books.json').read_text())['books']
rows = []
for meta in books:
    if meta['status'] != 'ready':
        continue
    path = ASSETS / meta['data'].lstrip('/')
    book = json.loads(path.read_text())
    refs = []
    external = []
    unresolved = []

    def walk(value, page):
        if isinstance(value, dict):
            src = value.get('src')
            if isinstance(src, str) and src.startswith('/'):
                file = (ASSETS / src.lstrip('/')).resolve()
                assert file.is_relative_to(ASSETS.resolve())
                refs.append({'id': value.get('id'), 'page': page, 'kind': value.get('kind'),
                             'src': src, 'exists': file.is_file(),
                             'sha256': sha(file) if file.is_file() else None})
            if value.get('kind') == 'video' and not src:
                links = value.get('links') or []
                if links:
                    external.append({'id': value.get('id'), 'page': page, 'links': links})
                else:
                    unresolved.append({'id': value.get('id'), 'page': page, 'kind': 'video'})
            for child in value.values():
                walk(child, page)
        elif isinstance(value, list):
            for child in value:
                walk(child, page)

    for page in book['pages']:
        walk(page.get('blocks', []), page.get('id'))
    rows.append({'book': meta['id'], 'data': meta['data'], 'sha256': sha(path),
                 'logicalPages': len(book['pages']), 'references': refs,
                 'localVideos': sum(x['src'].endswith('.mp4') for x in refs),
                 'images': sum(x['src'].endswith(('.svg', '.png', '.jpg', '.webp')) for x in refs),
                 'externalVideoSlots': external, 'unresolvedVideoSlots': unresolved})

result = {'status': 'inventory only; existence and hashes do not prove content approval',
          'books': rows, 'missingFiles': [x for b in rows for x in b['references'] if not x['exists']],
          'unresolvedVideoSlots': [x for b in rows for x in b['unresolvedVideoSlots']],
          'scope': 'Actual ready textbooks only. External official links are not still-image substitutes or generated videos.'}
(HERE / 'current-book-inventory.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
for b in rows:
    print(f"{b['book']}: {b['logicalPages']} pages, {b['images']} images, {b['localVideos']} local videos, {len(b['externalVideoSlots'])} external video slots")
print('Missing files:', len(result['missingFiles']), '; unresolved video slots:', len(result['unresolvedVideoSlots']))
