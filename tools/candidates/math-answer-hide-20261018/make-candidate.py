"""Integrate Claude's reviewed placement proposal in an isolated, reproducible build."""
import pathlib, hashlib, json, shutil, sys

here = pathlib.Path(__file__).resolve().parent
root = here.parents[2]
source = root / '教材整理/実装/build-textbook-book.py'
draft = root / '教材整理/Claude_Codex共有/数学全体制作/Claude原稿/M1-C1-S2/本文.md'
claude = root / 'Claude作業/20261018_短時間/答え先出し修正候補'
previous = here / 'previous'; previous.mkdir(exist_ok=True)
related_row = '--with-related-row' in sys.argv
out = here / ('out-final' if related_row else 'out'); out.mkdir(exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
code = source.read_text()
old = draft.read_bytes()
assert sha(old) == 'fcf27f4621df16e9d8d489c6a9184b519313b8618d8e0ee20f5745174d3e4eef'
original_book = (root / 'site-assets/textbook-book-math1.json').read_bytes()
assert sha(original_book) == '5efc90e0c6234f67177626d333e16ee58c9f407f48df82da8dc90a207cf41748'
candidate_draft = (claude / 'M1-C1-S2_本文_修正候補.md').read_bytes()
assert sha(candidate_draft) == 'b5b34c455138328fe11f3357741e93465b94503721e26b2d152b0b70b1f6f692'
if related_row:
    # The received report also identified this same-page answer leak; preserve its exact words.
    text = candidate_draft.decode('utf-8')
    line = '| (−4.8)÷0.6＝8 | ちがう符号なので − |'
    assert text.count(line) == 1
    text = text.replace(line+'\n', '', 1)
    answer = '<details><summary>答えと解説</summary>−8。ちがう符号で −。4.8÷0.6＝8。</details>'
    assert text.count(answer) == 1
    text = text.replace(answer, '<details><summary>答えと解説</summary>\n\n−8。ちがう符号で −。4.8÷0.6＝8。\n\n| まちがい | 正しい考え方 |\n|---|---|\n'+line+'\n\n</details>')
    candidate_draft = text.encode('utf-8')
changes = [
 ('def parse_blocks(lines):', 'def parse_blocks(lines, in_answer=False):'),
 ("            flush(); blocks.append(figure(m.group(1), m.group(2), m.group(3))); i += 1; continue",
  "            flush()\n            # An authored answer figure reuses its media identity and specification.\n            authored = next((item for ex in extras.values() for item in ex.get('media', []) if item['id'] == m.group(2)), None) if in_answer else None\n            blocks.append(media_block(authored) if authored else figure(m.group(1), m.group(2), m.group(3))); i += 1; continue"),
 ("            body = parse_blocks(mm.group(2).strip().split('\\n')) if mm else []",
  "            body = parse_blocks(mm.group(2).strip().split('\\n'), in_answer=True) if mm else []"),
 ('def apply_extras(unit, page):',
  "def contains_media(blocks, slot):\n    return any((b.get('t') == 'media' and b.get('id') == slot) or contains_media(b.get('body', []), slot) for b in blocks)\n\ndef apply_extras(unit, page):"),
 ("    for m in ex.get('media', []):\n        if m['pid'] == pid or (m['pid'] == 'POINTS' and page.get('kind') == 'points'):",
  "    for m in ex.get('media', []):\n        # A figure explicitly placed inside an answer must not also appear outside it.\n        if contains_media(page['blocks'], m['id']): continue\n        if m['pid'] == pid or (m['pid'] == 'POINTS' and page.get('kind') == 'points'):")
]
for before, after in changes:
    assert code.count(before) == 1, before
    code = code.replace(before, after)
for path in (source, draft, root/'site-assets/textbook-book-math1.json', root/'site-assets/textbook-books.json'):
    target = previous / path.name
    if target.exists(): assert target.read_bytes() == path.read_bytes()
    else: shutil.copyfile(path, target)
(here / 'build-textbook-book.py').write_text(code)
(here / '本文.md').write_bytes(candidate_draft)
# The subprocess writes only into the candidate out directory. Other subjects are kept.
for name in ['kokugo1','english1','science1','geography','history','health']:
    p = root / ('site-assets/textbook-book-' + name + '.json')
    if p.exists(): shutil.copyfile(p, out / p.name)
stage = code.replace("OUT = ROOT / 'site-assets'", 'OUT = Path(' + repr(str(out)) + ')')
anchor = "(WORK / 'Codexへ_画像と動画の依頼.md').write_text"
assert stage.count(anchor) == 1
stage = stage.replace(anchor, "(Path(" + repr(str(here)) + ") / '依頼一覧_候補.md').write_text")
read_text = pathlib.Path.read_text
def overlay(path, *args, **kwargs):
    if path == draft: return candidate_draft.decode('utf-8')
    return read_text(path, *args, **kwargs)
try:
    pathlib.Path.read_text = overlay
    sys.argv = [str(source)]
    exec(compile(stage, str(source), 'exec'), {'__file__': str(source), '__name__': '__main__'})
finally:
    pathlib.Path.read_text = read_text
generated = json.loads((out / 'textbook-book-math1.json').read_text())
expected = json.loads((claude / 'textbook-book-math1.json').read_text())
if related_row:
    p = next(p for p in expected['pages'] if p.get('pid') == 'M1-P046')
    table = next(b for b in p['blocks'] if b.get('t') == 'table')
    row = ['(−4.8)÷0.6＝8', 'ちがう符号なので −']
    assert table['rows'].count(row) == 1
    table['rows'].remove(row)
    q = next(i for i,b in enumerate(p['blocks']) if b.get('x','').startswith('**確認5-1**'))
    answer = p['blocks'][q+1]
    assert answer['t'] == 'details'
    answer['body'].append({'t':'table', 'rows':[['まちがい','正しい考え方'],row]})
assert generated == expected, 'regenerated data must exactly equal the independently reviewed Claude candidate'
original = json.loads(original_book)
changed = [a['pid'] for a,b in zip(original['pages'], generated['pages']) if a != b]
assert changed == ['M1-P046', 'M1-P050'], changed
assert len(original['pages']) == len(generated['pages'])
manifest = {
    str(source.relative_to(root)): {'before': sha(source.read_bytes()), 'after': sha(code.encode())},
    str(draft.relative_to(root)): {'before': sha(old), 'after': sha(candidate_draft)},
    'site-assets/textbook-book-math1.json': {'before': sha(original_book), 'after': sha((out/'textbook-book-math1.json').read_bytes())},
    'site-assets/textbook-books.json': {'before': sha((root/'site-assets/textbook-books.json').read_bytes()), 'after': sha((out/'textbook-books.json').read_bytes())}
}
(here/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print('Source-generated candidate equals Claude data'+(' plus the related confirmation 5-1 row move' if related_row else '')+'; only P046/P050 change; other pages and media declarations retained. Shared originals unchanged.')
