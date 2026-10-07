#!/usr/bin/env python3
"""英検の単語カード用データを作る（Claude・2026-10-07）。
  python3 tools/eiken-vocab/build.py          → site-assets/eiken-vocab-bank.json を作る
  python3 tools/eiken-vocab/build.py --check  → 点検だけ。作り直しが必要・不備があれば 1 で終わる
材料：tools/eiken-vocab/grade5.txt・grade4.txt・grade3.txt
  5級・3級＝のびログ独自の目安（英検の公式リストではない）。4級＝英検/英検４級単語.pdf の単語（意味・例文はのびログ独自）。
点検すること：語数（5級600・4級はPDFの語数・3級1150）、級をまたいだ重なりなし、4級がPDFと1語もずれない、
  全語に品詞・意味・英語の例文・日本語訳があり、例文の中にその単語（または変化形）が入っている、例文のダブりなし。"""
import json, re, sys, pathlib, unicodedata
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'site-assets' / 'eiken-vocab-bank.json'
PDF = ROOT / '英検' / '英検４級単語.pdf'
WANT = {'5': 600, '3': 1150}
LABEL = {'5': '5級', '4': '4級', '3': '3級'}
POS = {'名': '名詞', '動': '動詞', '形': '形容詞', '副': '副詞', '前': '前置詞', '代': '代名詞', '接': '接続詞', '間': '間投詞', '助': '助動詞', '数': '数'}
# 例文に原形が入らないときに認める変化形（不規則な形だけ）
IRR = {
 'child': ['children'], 'tooth': ['teeth'], 'foot': ['feet'], 'mouse': ['mice'], 'man': ['men'], 'woman': ['women'],
 'leaf': ['leaves'], 'knife': ['knives'], 'wolf': ['wolves'], 'sleep': ['slept'], 'lose': ['lost'], 'send': ['sent'],
 'ride': ['rode'], 'build': ['built'], 'pay': ['paid'], 'steal': ['stole', 'stolen'], 'shoot': ['shot'], 'sink': ['sank', 'sunk'],
 'buy': ['bought'], 'bring': ['brought'], 'catch': ['caught'], 'teach': ['taught'], 'think': ['thought'], 'feel': ['felt'],
 'get': ['got'], 'give': ['gave', 'given'], 'go': ['went', 'gone'], 'come': ['came'], 'eat': ['ate'], 'drink': ['drank'],
 'do': ['did', 'done', 'does'], 'have': ['had', 'has'], 'make': ['made'], 'see': ['saw', 'seen'], 'say': ['said'], 'sing': ['sang', 'sung'],
 'swim': ['swam'], 'run': ['ran'], 'sit': ['sat'], 'stand': ['stood'], 'take': ['took', 'taken'], 'tell': ['told'],
 'write': ['wrote', 'written'], 'speak': ['spoke', 'spoken'], 'meet': ['met'], 'leave': ['left'], 'win': ['won'], 'find': ['found'],
 'begin': ['began', 'begun'], 'choose': ['chose', 'chosen'], 'wear': ['wore', 'worn'], 'fly': ['flew', 'flies', 'flown'], 'hear': ['heard'],
 'know': ['knew', 'known'], 'hold': ['held'], 'keep': ['kept'], 'lend': ['lent'], 'spend': ['spent'], 'hide': ['hid', 'hidden'],
 'break': ['broke', 'broken'], 'forget': ['forgot', 'forgotten'], 'grow': ['grew', 'grown'], 'throw': ['threw', 'thrown'], 'fall': ['fell', 'fallen'],
 'fight': ['fought'], 'feed': ['fed'], 'hang': ['hung'], 'lie': ['lay', 'lying', 'lied'], 'rise': ['rose', 'risen'], 'shake': ['shook'],
 'shine': ['shone'], 'dig': ['dug'], 'bite': ['bit', 'bitten'], 'blow': ['blew', 'blown'], 'freeze': ['froze', 'frozen'], 'lead': ['led'],
 'mean': ['meant'], 'understand': ['understood'], 'wake': ['woke'], 'forgive': ['forgave', 'forgiven'], 'become': ['became'],
 'sell': ['sold'], 'draw': ['drew', 'drawn'], 'is': ['are'], 'die': ['dying'], 'cry': ['cries', 'cried'], 'try': ['tries', 'tried'],
 'carry': ['carries', 'carried'], 'study': ['studies', 'studied'], 'worry': ['worries', 'worried'], 'hurry': ['hurries', 'hurried'],
 'marry': ['married'], 'fry': ['fried', 'fries'], 'buy': ['bought'], 'easy': ['easier', 'easiest'], 'happy': ['happier'], 'busy': ['busier'], 'early': ['earlier'],
 'good': ['better', 'best'], 'bad': ['worse', 'worst'], 'many': ['more', 'most'], 'much': ['more', 'most'],
 'i': ["i'm", "i'll", "i've", "i'd"], 'you': ["you're", "you'll", "you've"], 'it': ["it's"], 'he': ["he's"], 'she': ["she's"], 'we': ["we're"], 'they': ["they're"],
}
def toks(s):
    t = re.findall(r"[a-z][a-z'\-]*", s.lower().replace('’', "'"))
    return t + [p for x in t for p in re.split(r"['\-]", x) if p]
def in_example(w, ex, alts):
    T = toks(ex)
    for v in [w.lower()] + [a.lower() for a in alts]:
        if v in T or any(v in IRR.get(x, []) for x in [v]) and False: return True
        if any(f in T for f in IRR.get(v, [])): return True
        if ' ' in v and v in ex.lower(): return True
        n = len(v); k = n if n <= 3 else (n - 1 if n <= 5 else n - 2)
        if n > 3 and any(t.startswith(v[:k]) and len(t) <= n + 4 for t in T): return True
        if n <= 3 and any(t in (v + 's', v + 'es', v + 'ed', v + 'd', v + 'ing', v + v[-1] + 'ing', v + v[-1] + 'ed', v + 'er') for t in T): return True
    return False
def slug(w): return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKC', w).lower())
def pdf_words():
    import pypdf
    ws = []
    for p in pypdf.PdfReader(str(PDF)).pages:
        for line in p.extract_text().splitlines():
            if re.fullmatch(r'[a-z]+( [a-z]+)?', line.strip()): ws += line.split()
    return ws
def parse(g):
    rows, errs = [], []
    for no, line in enumerate((HERE / f'grade{g}.txt').read_text(encoding='utf-8').splitlines(), 1):
        if not line.strip() or line.startswith('#'): continue
        f = line.split('|')
        where = f'grade{g}.txt:{no}'
        if len(f) not in (5, 6): errs.append(f'{where} 欄の数が {len(f)}'); continue
        w, pos, mean, ex, ja = [x.strip() for x in f[:5]]; alts = [a.strip() for a in f[5].split(',')] if len(f) == 6 and f[5].strip() else []
        ps = pos.split('・')
        if not w or not all(p in POS for p in ps): errs.append(f'{where} 品詞がおかしい {pos}')
        items = [m.strip() for m in mean.split('；') if m.strip()]
        if not items: errs.append(f'{where} 意味がない')
        ja_show, acc = [], []
        for it in items:
            parts = [p.strip() for p in it.split('=') if p.strip()]
            if not parts: errs.append(f'{where} 意味が空'); continue
            ja_show.append(parts[0]); acc += [p for p in parts if p not in acc]
        if not re.search(r'[A-Za-z]', ex) or not re.search(r'[.?!"]$', ex): errs.append(f'{where} 例文がおかしい: {ex}')
        if not re.search(r'[぀-ヿ一-鿿]', ja): errs.append(f'{where} 訳がない')
        if re.search(r'[぀-ヿ一-鿿]', ex): errs.append(f'{where} 例文に日本語が混ざっている')
        if not in_example(w, ex, alts): errs.append(f'{where} 例文に {w} が入っていない: {ex}')
        rows.append({'id': slug(w), 'grade': g, 'w': w, 'pos': '・'.join(POS[p] for p in ps if p in POS), 'ja': ja_show, 'acc': acc, 'ex': ex, 'exJa': ja, **({'alt': alts} if alts else {})})
    return rows, errs
def build():
    errs, grades, seen, exs = [], [], {}, {}
    pdfw = pdf_words()
    want = dict(WANT, **{'4': len(pdfw)})
    for g in ['5', '4', '3']:
        rows, e = parse(g); errs += e
        if len(rows) != want[g]: errs.append(f'{LABEL[g]} の語数が {len(rows)}（ほしいのは {want[g]}）')
        for r in rows:
            k = r['id']
            if not k: errs.append(f'{r["w"]} のIDが空')
            if k in seen: errs.append(f'重なり：{r["w"]}（{LABEL[seen[k]]} と {LABEL[g]}）')
            seen[k] = g
            ek = r['ex'].lower()
            if ek in exs: errs.append(f'例文のダブり：{r["w"]} と {exs[ek]}：{r["ex"]}')
            exs[ek] = r['w']
        grades.append({'id': g, 'label': LABEL[g], 'words': rows})
    g4 = [r['w'] for r in grades[1]['words']]
    if sorted(g4) != sorted(pdfw): errs.append(f'4級がPDFとちがう：PDFだけ {sorted(set(pdfw) - set(g4))}／リストだけ {sorted(set(g4) - set(pdfw))}')
    data = {'v': 1, 'title': '英検 単語カード',
            'note': '5級・3級の単語リストは、のびログ独自の目安です（英検の公式リストではありません）。4級は 英検/英検４級単語.pdf に書かれた単語です（' + str(len(pdfw)) + '語）。意味・例文・訳はすべてのびログ独自です。',
            'sources': {'5': 'のびログ独自の目安（Claude が選定）', '4': '英検/英検４級単語.pdf（単語だけ。意味・例文はのびログ独自）', '3': 'のびログ独自の目安（Claude が選定）'},
            'counts': {g['id']: len(g['words']) for g in grades}, 'grades': grades}
    return data, errs
def dump(d):
    head = {k: v for k, v in d.items() if k != 'grades'}
    s = json.dumps(head, ensure_ascii=False)[:-1] + ',"grades":[\n'
    s += ',\n'.join('{"id":%s,"label":%s,"words":[\n%s\n]}' % (json.dumps(g['id']), json.dumps(g['label'], ensure_ascii=False), ',\n'.join(json.dumps(w, ensure_ascii=False, separators=(',', ':')) for w in g['words'])) for g in d['grades'])
    return s + '\n]}\n'
if __name__ == '__main__':
    data, errs = build()
    for e in errs: print('❌', e)
    text = dump(data)
    json.loads(text)
    if '--check' in sys.argv:
        same = OUT.exists() and OUT.read_text(encoding='utf-8') == text
        if not same: print('❌ site-assets/eiken-vocab-bank.json が材料と合っていません（build.py を走らせて作り直す）')
        print('counts', data['counts']); sys.exit(1 if errs or not same else 0)
    if errs and '--force' not in sys.argv: print('不備があるので書き出しません'); sys.exit(1)
    OUT.write_text(text, encoding='utf-8'); print('wrote', OUT, data['counts'], len(text.encode()), 'bytes')
