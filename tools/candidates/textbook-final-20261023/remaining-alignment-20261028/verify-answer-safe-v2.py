"""Prove the successor changes teaching text only, and retains every exercise block."""
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
STAGE = HERE / 'answer-safe-v2'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest = json.loads((STAGE / 'manifest.json').read_text())
pairs = [(r['before'], r['after']) for r in manifest['changesFromPriorCandidate']]
assert len(pairs) == 8


def replace(value):
    if isinstance(value, dict):
        return {k: replace(v) for k, v in value.items()}
    if isinstance(value, list):
        return [replace(v) for v in value]
    if isinstance(value, str):
        for before, after in pairs:
            value = value.replace(before, after)
    return value


books = []
for book, title in [('kokugo1', '単語のいろいろ'), ('english1', 'What 〜! / How 〜!（感嘆文）')]:
    name = f'textbook-book-{book}.json'
    old_path, new_path = HERE / 'candidate-books' / name, STAGE / 'candidate-books' / name
    old, new = (json.loads(p.read_text()) for p in [old_path, new_path])
    assert replace(old) == new, 'Only the exact authorized teaching replacements may change'
    protected = 0
    movie_refs = []
    for a, b in zip(old['pages'], new['pages']):
        assert (a['n'], a.get('sectionTitle'), a.get('tag')) == (b['n'], b.get('sectionTitle'), b.get('tag'))
        if a.get('tag') in ['確認', '練習', '例題']:
            assert a == b, 'Exercise and worked-example pages must be byte-value equivalent'
            protected += 1
        for block in b.get('blocks', []):
            if block.get('t') == 'media' and block.get('kind') == 'video':
                movie_refs.append((block['id'], block.get('src')))
    context = json.loads((STAGE / 'integration-contexts/output/site-assets' / f'textbook-ai-context-{book}.json').read_text())
    assert context['sourceSha256'] == sha(new_path)
    if book == 'english1':
        # Later confirmation still asks cute, but the teaching example now uses the worked-example cold.
        section = [p for p in new['pages'] if p.get('sectionTitle') == title]
        assert sum('How cute!' in str(b) for p in section for b in p.get('blocks', []) if b.get('t') != 'details') == 0
        assert any('How cute!' in str(b) for p in section for b in p.get('blocks', []) if b.get('t') == 'details')
        assert all('How cute!' not in r['quote'] for r in context['contexts'])
    else:
        for page in new['pages']:
            if page.get('sectionTitle') == title and page.get('tag') not in ['確認', '練習']:
                assert '大きな' not in str(page), 'Do not classify the later exercise word publicly'
        assert any('小さな' in str(p) for p in new['pages'] if p.get('sectionTitle') == title)
    books.append(dict(book=book, priorSha256=sha(old_path), successorSha256=sha(new_path), protectedPages=protected,
                      movieReferences=movie_refs, publicContexts=len(context['contexts'])))
result = dict(status='passed', books=books, exactTeachingEdits=8, scope='Questions, answers, worked examples, numbers, IDs, page metadata and movie references retained. Only teaching examples changed, including their derived prompts. Closed answer bodies remain present. Main untouched.')
(STAGE / 'answer-preservation-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k != 'books'}, ensure_ascii=False))
