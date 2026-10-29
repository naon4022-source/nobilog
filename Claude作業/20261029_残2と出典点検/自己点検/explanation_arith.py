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
# 2回目：1回目は「a ＝ b ＋ c ＝ d」の途中で切って比べる取り出し方の誤りがあった（explanation_arith_1回目.py・_1.log）。
# 解説を区切り（①〜⑨・、。：とその前後）で分け、区切りの中で「＝」でつながった部分をすべて計算し、計算できる部分どうしが等しいかを見る。
SEP = re.compile(r'[①②③④⑤⑥⑦⑧⑨、。：，]|　|\s(?=答え)|でも|なので|だから|から|より')
n = bad = approx = 0; rows = []
for p in sorted(D.glob('*.json')):
    for q in json.loads(p.read_text(encoding='utf-8'))['questions']:
        for seg in SEP.split(q['explanation']):
            if '＝' not in seg: continue
            parts = [x.strip() for x in seg.split('＝')]
            vals = []
            for k, x in enumerate(parts):
                # 左はしの部分は、数でない文字（ことば）があれば、その後ろの数式だけを使う
                # 3回目：ことば・□・π・文字のすぐ後ろ（前）にくっついた数式の切れはしは使わない（2回目は「□ + 3.5」の「3.5」などを拾った）
                if k == 0:
                    m = re.search(r'(' + r'[0-9.＋+−\-×÷()（）/²³ ]' + r'+)$', x)
                    if m:
                        pre = x[:m.start()].rstrip(); t = m.group(1).strip()
                        if (pre and not re.search(r'[はがでとをにもの]$|^$', pre)) or re.match(r'^[＋+×÷/)）]', t): t = ''
                        x = t
                    else: x = ''
                elif k == len(parts) - 1:
                    m = re.match(r'^(' + r'[0-9.＋+−\-×÷()（）/²³ ]' + r'+)', x)
                    if m:
                        post = x[m.end():]; t = m.group(1).strip()
                        if post and not re.match(r'^\s*(?:[^\w+＋−\-×÷π²³ⁿ⁶]|[ぁ-んァ-ヶ一-龠])', post) or re.match(r'^[a-zA-Zπ²³ⁿ⁶□○]', post): t = ''
                        if post and re.match(r'^[a-zA-Zπ]', post.strip()): t = ''
                        x = t
                    else: x = ''
                if not x or not re.search(r'\d', x) or re.search(r'[^0-9.＋+−\-×÷()（）/²³ ]', x): vals.append(None); continue
                try: vals.append(ev(x))
                except Exception: vals.append(None)
            got = [(parts[k], v) for k, v in enumerate(vals) if v is not None]
            if len(got) < 2: continue
            n += 1
            base = got[0][1]
            for txt, v in got[1:]:
                if v != base:
                    if abs(float(v) - float(base)) < 0.001 and re.search(r'\.\d{3}', txt):
                        approx += 1; continue   # 0.333 のような、およその小数
                    bad += 1; rows.append({'id': q['id'], 'segment': seg.strip(), 'values': [str(v) for _, v in got]}); break
(H / 'explanation_arith-result.json').write_text(json.dumps({'checkedSegments': n, 'mismatch': bad, 'approxDecimals': approx, 'rows': rows}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('調べた式の区切り', n, '合わない', bad, '（およその小数', approx, '）')
for r in rows: print(' ', r['id'], '｜', r['segment'][:90], '→', r['values'])
