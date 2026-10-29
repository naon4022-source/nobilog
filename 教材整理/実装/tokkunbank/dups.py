"""作業用：1つの小単元の問題点を全部表示する（check.py の部品を使う）。使い方: python3 dups.py 単元キー"""
import sys, json, importlib
sys.path.insert(0, '.')
import check
key = sys.argv[1]
m = importlib.import_module('u_' + key)
u = m.U.unit_json()
ex = [(t, check.mask(p)) for t, p in check.existing_prompts()]
others = []
for f in sorted(check.OUT.glob('*.json')):
    d = json.loads(f.read_text())
    if d['id'] != u['id']: others += [(q['id'], check.mask(q['prompt'])) for q in d['questions']]
mine = [(q['id'], check.mask(q['prompt'])) for q in u['questions']]
pairs = check.near_dups(mine, others + ex)
bad = sorted({int(a.split('-')[-1]) for a, b, r in pairs} | {int(b.split('-')[-1]) for a, b, r in pairs if b.startswith(u['id'] + '-')})
print('count', len(u['questions']), 'dup ids', bad)
for a, b, r in pairs:
    if not b.startswith('workbook'): print('  ', a, b, r)
for q, src in zip(u['questions'], m.U.qs):
    for e in check.lint(q): print(q['id'], e)
    try: r = check.verify(q, src['v'])
    except Exception as e: r = repr(e)
    if r: print(q['id'], r)
    l = check.leak(q)
    if l: print(q['id'], l)
print(check.engine_check(u))
