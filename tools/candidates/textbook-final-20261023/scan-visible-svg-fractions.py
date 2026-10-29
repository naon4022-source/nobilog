"""Read-only content inventory; skip fractions already rendered as stacked groups."""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as E

H = Path(__file__).resolve().parent
R = H.parents[2]
A = R / 'site-assets'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
books = json.loads((A / 'textbook-books.json').read_text())['books']
items, reviewed_groups, source_hashes = [], [], {}
symbols = '¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⁄'


def blocks(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from blocks(child)
    elif isinstance(value, list):
        for child in value:
            yield from blocks(child)


for meta in books:
    if meta['status'] != 'ready':
        continue
    book = json.loads((A / meta['data'].lstrip('/')).read_text())
    seen = set()
    for page in book['pages']:
        for block in blocks(page.get('blocks', [])):
            src = block.get('src') or ''
            if not src.startswith('/') or not src.endswith('.svg') or src in seen:
                continue
            seen.add(src)
            path = A / src[1:]
            assert path.resolve().is_relative_to(A.resolve())
            source_hashes[src] = sha(path)

            def walk(node):
                if 'data-stacked-fraction' in node.attrib:
                    reviewed_groups.append({'book': meta['id'], 'src': src, 'text': node.attrib['data-stacked-fraction']})
                    return
                if node.tag.rsplit('}', 1)[-1] == 'text':
                    text = ''.join(node.itertext())
                    if not any(c in text for c in '/／' + symbols):
                        return
                    if meta['id'] == 'math1':
                        classification = ('unit; preserve' if 'm/分' in text else 'mathematical fraction; typesetting remains' if '/' in text or any(c in text for c in symbols) else 'explanation separator; preserve')
                    elif meta['id'] == 'science1':
                        classification = ('mathematical fraction; typesetting remains' if re.search(r'[0-9]+/[0-9]+', text) else 'biological alternatives separator; preserve' if '／' in text else 'physical unit notation (speed/density); preserve')
                    elif meta['id'] == 'english1':
                        classification = 'numeric or Unicode fraction; review' if re.search(r'[0-9]+/[0-9]+', text) or any(c in text for c in symbols) else 'language alternatives/separator; preserve'
                    elif meta['id'] == 'kokugo1':
                        classification = 'Japanese segmentation/alternatives separator; preserve'
                    else:
                        classification = 'manual semantic review needed'
                    items.append({'book': meta['id'], 'page': page.get('pid', page.get('id')), 'id': block.get('id'),
                                  'src': src, 'text': text, 'classification': classification})
                    return
                for child in node:
                    walk(child)

            walk(E.parse(path).getroot())
summary = {}
for item in items:
    key = item['book'] + ': ' + item['classification']
    summary[key] = summary.get(key, 0) + 1
result = {'date': '2026-10-24', 'status': 'read-only inventory; classifications do not approve content or integration',
          'summary': summary, 'items': items, 'existingStackedGroups': reviewed_groups, 'sourceSha256': source_hashes,
          'remainingMathematicalRows': sum('mathematical fraction' in x['classification'] for x in items),
          'remainingMathematicalImages': len({x['src'] for x in items if 'mathematical fraction' in x['classification']}),
          'teachingAssetsChanged': False}
(H / 'visible-svg-fractions-20261024.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False))
print('Existing stacked groups:', len(reviewed_groups), '; remaining mathematical rows:', sum('mathematical fraction' in x['classification'] for x in items))
