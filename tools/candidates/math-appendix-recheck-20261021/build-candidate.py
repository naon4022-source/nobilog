"""Build isolated appendix data; never write the shared application or assets."""
from pathlib import Path
import copy
import hashlib
import json
import shutil
import sys

H = Path(__file__).resolve().parent
R = H.parents[2]
W = R / '教材整理/Claude_Codex共有/数学全体制作'
U = W / 'Claude原稿/M1-APP3'
out = H / 'candidate'
previous = H / 'previous'
previous.mkdir(exist_ok=True)
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest = load(out / 'answer-placement-candidate.json')
for item in manifest['files'] + load(out / 'annotation-support-candidate.json')['files']:
    assert sha(R / item['file']) == item['beforeSha256'], 'shared source drift'
    assert sha(H / item['candidate']) == item['afterSha256'], 'candidate drift'
for name, digest in manifest['sourceBefore'].items():
    assert sha(U / name) == digest
book_path = R / 'site-assets/textbook-book-math1.json'
paths = [book_path, U / '本文.md', U / '本の追加.json', R / '教材整理/実装/build-textbook-book.py',
         W / '原稿表示を更新.py', R / 'site-assets/textbook-book.js',
         R / 'site-assets/textbook-annotations.js', R / 'site-assets/textbook-annotation-model.js']
before = {str(p.relative_to(R)): sha(p) for p in paths}
for p in paths:
    saved = previous / p.name
    if saved.exists():
        assert saved.read_bytes() == p.read_bytes(), 'do not replace original snapshot'
    else:
        shutil.copy2(p, saved)
code = (out / 'build-textbook-book.py').read_text()
needle = "OUT = ROOT / 'site-assets'"
assert code.count(needle) == 1
code = code.replace(needle, 'OUT = Path(' + repr(str(out)) + ')', 1)
needle = "if '--check' in sys.argv:\n    # 検証用："
assert code.count(needle) == 1
code = code.replace(needle, 'if False:\n    # 検証用：', 1)
read_text = Path.read_text
def overlay(p, *args, **kwargs):
    if p == U / '本文.md':
        return (out / '本文.md').read_bytes().decode('utf-8')
    if p == U / '本の追加.json':
        return (out / '本の追加.json').read_bytes().decode('utf-8')
    return read_text(p, *args, **kwargs)
old_argv = sys.argv
try:
    Path.read_text = overlay
    # Check mode suppresses all asset copies and shared request-list updates.
    # Only its early output comparison is bypassed for the isolated JSON build.
    sys.argv = [str(R / '教材整理/実装/build-textbook-book.py'), '--check']
    exec(compile(code, str(out / 'build-textbook-book.py'), 'exec'),
         {'__file__': str(R / '教材整理/実装/build-textbook-book.py'), '__name__': '__candidate__'})
finally:
    Path.read_text = read_text
    sys.argv = old_argv
shutil.copy2(R / 'site-assets/textbook-books.json', out / 'textbook-books.json')
old = load(book_path)
new = load(out / book_path.name)
expected = copy.deepcopy(old)
p = next(p for p in expected['pages'] if p.get('pid') == 'M1-P387')
figure = next(b for b in p['blocks'] if b.get('src') == '/textbook-book-math1-m1-app3-fig07.svg')
heading = next(b for b in p['blocks'] if b.get('t') == 'h3' and b.get('x') == '手順')
steps = next(b for b in p['blocks'] if b.get('t') == 'ol')
movie = next(b for b in p['blocks'] if b.get('id') == 'M1-APP3-V03')
for b in [figure, heading, steps, movie]:
    p['blocks'].remove(b)
q = next(i for i, b in enumerate(p['blocks']) if b.get('x', '').startswith('**問1**'))
answer = p['blocks'][q + 1]
assert answer['t'] == 'details' and answer['summary'] == '答え'
answer['body'].extend([figure, heading, steps, movie])
def walk(blocks):
    for block in blocks:
        yield block
        if block.get('t') == 'details':
            yield from walk(block.get('body', []))
rules = load(out / 'annotation-compatibility.json')
assert len(rules) == 9
for rule in rules:
    matches = [b for b in walk(p['blocks']) if b == rule['block']]
    assert len(matches) == 1
    matches[0].update(annotationAnchor=rule['anchor'], annotationQuote=rule['quote'])
assert expected == new, 'every other source page, original block and quantity must remain exact'
assert len(new['pages']) == 441
assert [a.get('pid') for a, b in zip(old['pages'], new['pages']) if a != b] == ['M1-P387']
assert all(sha(R / name) == digest for name, digest in before.items()), 'shared input was changed'
result = {'status': 'isolated book built; UI, inherited-marker model and AV checks still pending',
          'sourcePages': 441, 'changedSourcePages': ['M1-P387'], 'compatibilityRules': 9,
          'bookBeforeSha256': sha(book_path), 'bookAfterSha256': sha(out / book_path.name),
          'originalTextQuestionsAnswersNumbersPreserved': True, 'mainChanged': False,
          'sourceSnapshot': before, 'newVideoGenerations': 0}
(H / 'book-candidate-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Isolated appendix book built: exact one-page delta; all original words/numbers retained; shared files unchanged')
