from pathlib import Path
import hashlib
import json
import shutil

here = Path(__file__).resolve().parent
root = here.parents[3]
proposal = json.loads((here.parent / 'calculation-order-proposal.json').read_text())
sha = lambda value: hashlib.sha256(value).hexdigest()
rows = []

def save(relative, old, new, changes=None, edits=None):
    path = root / relative
    backup = here / 'before' / relative
    assert path.read_bytes() == old and old != new
    assert not backup.exists(), 'Do not reapply an already saved explanation delta'
    backup.parent.mkdir(parents=True, exist_ok=True)
    backup.write_bytes(old)
    path.write_bytes(new)
    rows.append({'file': relative, 'beforeFile': str(backup.relative_to(root)),
                 'beforeSha256': sha(old), 'afterSha256': sha(new),
                 **({'jsonChanges': changes} if changes else {}), **({'edits': edits} if edits else {})})

md = root / proposal['source']
raw = md.read_bytes()
assert sha(raw) == proposal['sourceSha256']
text = raw.decode()
edits = []
for before, after in proposal['replacements']:
    assert text.count(before) == 1
    text = text.replace(before, after, 1)
    edits.append({'before': before, 'after': after})
save(proposal['source'], raw, text.encode(), edits=edits)

book_path = 'site-assets/textbook-book-math1.json'
raw = (root / book_path).read_bytes()
book = json.loads(raw)
assert json.dumps(book, ensure_ascii=False, separators=(',', ':')).encode() == raw
page1 = next(i for i, page in enumerate(book['pages']) if page.get('pid') == 'M1-P051' and page.get('tag') == 'しくみ')
page2 = next(i for i, page in enumerate(book['pages']) if page.get('pid') == 'M1-P052' and page.get('tag') == '解き方')
changes = []

def replace_at(path, after):
    node = book
    for key in path[:-1]:
        node = node[key]
    before = node[path[-1]]
    assert isinstance(before, str) and before != after
    node[path[-1]] = after
    changes.append({'path': path, 'before': before, 'after': after})

list_index = next(i for i, block in enumerate(book['pages'][page1]['blocks']) if block['t'] == 'ol')
new_list = [line.split('. ', 1)[1] for line in proposal['replacements'][0][1].splitlines()]
old_list = [line.split('. ', 1)[1] for line in proposal['replacements'][0][0].splitlines()]
assert [x['x'] for x in book['pages'][page1]['blocks'][list_index]['items']] == old_list
for i, value in enumerate(new_list):
    replace_at(['pages', page1, 'blocks', list_index, 'items', i, 'x'], value)
assert book['pages'][page2]['blocks'][1]['items'][0]['x'] == proposal['replacements'][1][0][3:]
replace_at(['pages', page2, 'blocks', 1, 'items', 0, 'x'], proposal['replacements'][1][1][3:])
assert book['pages'][page2]['blocks'][2]['x'] == proposal['replacements'][2][0]
replace_at(['pages', page2, 'blocks', 2, 'x'], proposal['replacements'][2][1])
goal_index = next(i for i, block in enumerate(book['pages'][page1]['blocks']) if block['t'] == 'goal')
old_goal = book['pages'][page1]['blocks'][goal_index]['x']
new_goal = old_goal.replace('（累乗→乗除→加減）', '（かっこの中→累乗→乗除→加減）')
replace_at(['pages', page1, 'blocks', goal_index, 'x'], new_goal)
save(book_path, raw, json.dumps(book, ensure_ascii=False, separators=(',', ':')).encode(), changes=changes)

extra_path = str(Path(proposal['source']).with_name('本の追加.json'))
raw = (root / extra_path).read_bytes()
assert raw.decode().count(old_goal) == 1
save(extra_path, raw, raw.decode().replace(old_goal, new_goal, 1).encode(), edits=[{'before': old_goal, 'after': new_goal}])

geo_book_path = 'site-assets/textbook-book-geography.json'
raw = (root / geo_book_path).read_bytes()
geo = json.loads(raw)
assert json.dumps(geo, ensure_ascii=False, separators=(',', ':')).encode() == raw
path = ['pages', 22, 'blocks', 3, 'items', 0, 'x']
old = geo['pages'][22]['blocks'][3]['items'][0]['x']
assert old == '赤道から極に向かって「熱→乾→温→冷→寒」の順に並ぶイメージ。'
new = '赤道付近は暑く、極に近づくほど寒くなる傾向があります。乾燥帯は雨の少なさにも注目して見分けましょう。'
geo['pages'][22]['blocks'][3]['items'][0]['x'] = new
save(geo_book_path, raw, json.dumps(geo, ensure_ascii=False, separators=(',', ':')).encode(), changes=[{'path': path, 'before': old, 'after': new}])
geo_source = '教材整理/Claude_Codex共有/地理全体制作/原稿/u02.py'
raw = (root / geo_source).read_bytes()
assert raw.decode().count(old) == 1
save(geo_source, raw, raw.decode().replace(old, new, 1).encode(), edits=[{'before': old, 'after': new}])

receipt = {'version': 1, 'status': 'applied locally; preservation/browser/source generation checks pending',
           'approval': 'User explicitly authorized all evidence-backed corrections to confusing/incorrect explanations and improvements to clarity/fun; not only the geography sentence.',
           'scope': 'Math chapter1 explanatory text/order/goal and geography climate tip only. All other JSON fields and all problems/answers/example numbers preserved.',
           'files': rows, 'mathVideo': 'Existing V07 already puts brackets first; no regeneration.',
           'geographyVideo': 'Source scripts and existing source image contain former text; actual current MP4 verification and any affected-only repair remain pending.',
           'wholeBefore': 'tools/candidates/textbook-ai-20261025/post-access-full-attempt1.json',
           'references': ['https://hosho.ees.hokudai.ac.jp/tsuyu/top/dct/climate-j.html'],
           'proofs': []}
(here / 'receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print('Applied five exact source/book changes. Content/media integration verification still pending.')
