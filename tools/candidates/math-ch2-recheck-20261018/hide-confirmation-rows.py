"""Move two unchanged answer rows into their own explanations; keep all other book blocks."""
from pathlib import Path
import copy, hashlib, json, sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
WORK = ROOT / '教材整理/Claude_Codex共有/数学全体制作'
OUT = HERE / 'answer-rows-20261019'
PREVIOUS = OUT / 'previous'
PREVIOUS.mkdir(parents=True, exist_ok=True)
sha = lambda value: hashlib.sha256(value).hexdigest()
cases = [
    ('M1-C2-S1', 'M1-P087', '**確認3-2**',
     ['20/x で x＝−4 を 20−4 とする', '20/x は 20÷x → −5'],
     '−5。20÷(−4)＝−5。'),
    ('M1-C2-S2', 'M1-P094', '**確認1-1**',
     ['7y−y を 7 とする', 'y は 1y。7y−1y＝6y'],
     '6y。y の係数は 1。'),
]
book_path = ROOT / 'site-assets/textbook-book-math1.json'
book_bytes = book_path.read_bytes()
original = json.loads(book_bytes)
expected = copy.deepcopy(original)
drafts = []
for unit, pid, question, row, answer in cases:
    path = WORK / 'Claude原稿' / unit / '本文.md'
    before = path.read_bytes()
    text = before.decode()
    line = '| ' + ' | '.join(row) + ' |'
    target = '<details><summary>答えと解説</summary>' + answer + '</details>'
    assert text.count(line) == text.count(target) == 1, unit
    text = text.replace(line + '\n', '', 1).replace(
        target,
        '<details><summary>答えと解説</summary>\n\n' + answer +
        '\n\n| まちがい | 正しい考え方 |\n|---|---|\n' + line + '\n\n</details>', 1)
    drafts.append((path, before, text.encode()))
    page = next(p for p in expected['pages'] if p.get('pid') == pid)
    table = next(b for b in page['blocks'] if b['t'] == 'table')
    assert table['rows'].count(row) == 1
    table['rows'].remove(row)
    index = next(i for i, b in enumerate(page['blocks'])
                 if b.get('t') == 'p' and b.get('x', '').startswith(question))
    explanation = page['blocks'][index + 1]
    assert explanation['t'] == 'details' and explanation['summary'] == '答えと解説'
    explanation['body'].append({'t': 'table', 'rows': [['まちがい', '正しい考え方'], row]})

def preserve(name, value):
    path = PREVIOUS / name
    if path.exists():
        assert path.read_bytes() == value, 'Do not overwrite a previous snapshot: ' + name
    else:
        path.write_bytes(value)

preserve('textbook-book-math1.json', book_bytes)
preserve('textbook-books.json', (ROOT / 'site-assets/textbook-books.json').read_bytes())
for path, before, after in drafts:
    preserve(path.parent.name + '_本文.md', before)
    path.write_bytes(after)

# Use the actual source builder in its read-only mode. Capture its derived JSON
# without re-encoding or copying any already completed video/image assets.
builder = ROOT / '教材整理/実装/build-textbook-book.py'
namespace = {'__file__': str(builder), '__name__': '__main__'}
argv = sys.argv
try:
    sys.argv = [str(builder), '--check']
    try:
        exec(compile(builder.read_text(), str(builder), 'exec'), namespace)
    except SystemExit as error:
        assert error.code == 0
finally:
    sys.argv = argv
generated = namespace['book']
assert generated == expected, 'Only the two exact row placements may change'
book_path.write_text(namespace['data'])
assert (ROOT / 'site-assets/textbook-books.json').read_bytes() == (PREVIOUS / 'textbook-books.json').read_bytes()
manifest = {'status': 'applied locally', 'changedPages': [c[1] for c in cases],
            'unchangedAllOtherBookBlocks': True, 'newImagesOrVideos': 0,
            'published': False, 'files': {str(book_path.relative_to(ROOT)):
            {'before': sha(book_bytes), 'after': sha(book_path.read_bytes())}}}
for path, before, after in drafts:
    manifest['files'][str(path.relative_to(ROOT))] = {'before': sha(before), 'after': sha(after)}
(OUT / 'integration.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print('Two unchanged answer rows moved into their own closed explanations; all other book blocks and shelf unchanged; no media regeneration.')
