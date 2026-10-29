"""解説の中の「数の式 ＝ 数」を取り出して、分数で計算しなおす（Claude 2026-10-29）。対象：反映用の写し（3713問）。
数・＋−×÷・かっこだけの式に限る（文字や π をふくむ式、「…」で省いた式は数えない）。式の左はしは、直前の区切り（①②③、、。：）から。"""
import json, re, pathlib, sys
from fractions import Fraction as F
H = pathlib.Path(__file__).resolve().parent
D = H.parent / '反映用_まとめ候補' / '原稿'
TOK = re.compile(r'\s*(\d+(?:\.\d+)?|[+\-×÷()/^²³])')
def ev(s):
    s = s.replace('＋', '+').replace('−', '-').replace('－', '-').replace('（', '(').replace('）', ')').replace(' ', '')
    toks = []; i = 0
    while i < len(s):
        m = TOK.match(s, i)
        if not m: raise ValueError(s)
        toks.append(m.group(1)); i = m.end()
    pos = 0
    def peek(): return toks[pos] if pos < len(toks) else None
    def take():
        nonlocal pos; t = toks[pos]; pos += 1; return t
    def atom():
        t = peek()
        if t == '(':
            take(); v = expr()
            if take() != ')': raise ValueError
        elif t == '-': take(); v = -atom()
        else: v = F(take())
        while peek() in ('²', '³'): v = v ** (2 if take() == '²' else 3)
        return v
    def frac():
        v = atom()
        while peek() == '/': take(); v = v / atom()
        return v
    def term():
        v = frac()
        while peek() in ('×', '÷'):
            op = take(); w = frac(); v = v * w if op == '×' else v / w
        return v
    def expr():
        v = term()
        while peek() in ('+', '-'):
            op = take(); w = term(); v = v + w if op == '+' else v - w
        return v
    v = expr()
    if pos != len(toks): raise ValueError(s)
    return v
CH = r'[0-9.＋+−\-×÷()（）/²³ ]'
pat = re.compile(r'(?<![0-9a-zA-Zπ.^/])(' + CH + r'+?)\s*＝\s*(−?\d+(?:\.\d+)?(?:/\d+)?)(?![0-9.πa-zA-Z²³/(])')
n = bad = 0; rows = []
for p in sorted(D.glob('*.json')):
    for q in json.loads(p.read_text(encoding='utf-8'))['questions']:
        for m in pat.finditer(q['explanation']):
            left, right = m.group(1).strip(), m.group(2)
            if not re.search(r'[＋+−\-×÷/²³]', left) or not re.search(r'\d', left): continue
            if re.match(r'^[＋+×÷/)）]', left): continue
            try: lv = ev(left); rv = ev(right)
            except Exception: continue
            n += 1
            if lv != rv:
                bad += 1; rows.append({'id': q['id'], 'expr': left + ' ＝ ' + right, 'calc': str(lv)})
(H / 'explanation_arith-result.json').write_text(json.dumps({'checked': n, 'mismatch': bad, 'rows': rows}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('調べた式', n, '合わない', bad)
for r in rows: print(' ', r['id'], r['expr'], '→', r['calc'])
