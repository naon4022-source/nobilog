"""解説の「a：b ＝ c：d」（数だけの比）が等しいかを、a×d ＝ b×c で確かめる（Claude 2026-10-29）。式の点検で「：」の区切りのために読めなかった分の補い。"""
import json, re, pathlib
from fractions import Fraction as F
D = pathlib.Path(__file__).resolve().parent.parent / '反映用_まとめ候補' / '原稿'
num = r'\(?\s*\d+(?:\.\d+)?(?:/\d+)?(?:\s*[×+]\s*\d+(?:\.\d+)?)*\s*\)?'
pat = re.compile(r'(?<![\d.])(' + num + r')\s*：\s*(' + num + r')((?:\s*：\s*' + num + r')*)\s*＝\s*(' + num + r')\s*：\s*(' + num + r')((?:\s*：\s*' + num + r')*)(?![\d./])')
def v(s):
    # 1回目は小数（float）で計算して 2/3 の誤差で「合わない」と出た（検査側の誤り、ratio_check_1.log）。分数で計算する
    if not re.fullmatch(r'[\d.()+*/ ×]+', s): return None
    t = re.sub(r'\d+(?:\.\d+)?', lambda m: 'F("%s")' % m.group(0), s.replace('×', '*').replace(' ', ''))
    return eval(t, {'F': F}, {})
n = bad = 0; rows = []
for p in sorted(D.glob('*.json')):
    for q in json.loads(p.read_text(encoding='utf-8'))['questions']:
        for m in pat.finditer(q['explanation']):
            L = [m.group(1), m.group(2)] + [x for x in re.split(r'\s*：\s*', m.group(3)) if x.strip()]
            R = [m.group(4), m.group(5)] + [x for x in re.split(r'\s*：\s*', m.group(6)) if x.strip()]
            if len(L) != len(R): continue
            try: L = [F(v(x)) for x in L]; R = [F(v(x)) for x in R]
            except Exception: continue
            n += 1
            if any(L[0] * R[k] != R[0] * L[k] for k in range(1, len(L))): bad += 1; rows.append({'id': q['id'], 'text': m.group(0)})
print('比の式', n, '合わない', bad)
for r in rows: print(' ', r)
json.dump({'checked': n, 'mismatch': bad, 'rows': rows}, open(pathlib.Path(__file__).parent / 'ratio_check-result.json', 'w'), ensure_ascii=False, indent=1)
