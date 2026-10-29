"""70問の小単元を組み立てる共通部品（数学）。出典は教材照合台帳の確認済みページを使う。"""
import json, random, itertools, hashlib
from fractions import Fraction as F
from pathlib import Path
from expr import show, mistakes, ans_str, fmt_num, Chain, lits, dec_str, Lit, Pow, Neg, Grp, steps

ROOT = Path(__file__).resolve().parents[3]
LEDGER = {e['file']: e for e in json.loads((ROOT / '教材整理/教材照合台帳.json').read_text(encoding='utf-8'))}
BOOK = {'drill': '数学ドリル', 'workbook': '数学ワーク'}

# 印刷ページ → 写真ファイル（見開き写真を名前順に並べると p2〜3、p4〜5…と続く。目視で確認済み）
def _spreads(folder):
    out = {}
    for k, p in enumerate(sorted((ROOT / folder).glob('S__*.jpg'), key=lambda x: x.name)):
        out[2 + 2 * k] = out[3 + 2 * k] = f'{folder}/{p.name}'
    return out
PAGES = {'drill': _spreads('ドリル/数学'), 'workbook': _spreads('数学ワーク')}

# 教科書（数学教科書/ の見開き写真。p12〜293 が名前順に2ページずつ並ぶ。目視で確認済み）
TB_FILES = sorted(p.name for p in (ROOT / '数学教科書').glob('S__*.jpg'))
_TB_SHA = {}
def textbook_ref(page):
    i = (page - 12) // 2
    assert 0 <= i < len(TB_FILES), page
    name = '数学教科書/' + TB_FILES[i]
    if name not in _TB_SHA: _TB_SHA[name] = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
    return {'file': name, 'sha256': _TB_SHA[name], 'page': page}

class Unit:
    def __init__(self, uid, mode, title, major, note, tb=None):
        self.uid, self.mode, self.title, self.major, self.note, self.tb = uid, mode, title, major, note, tb
        self.qs = []; self.prompts = set()
    def add(self, prompt, answer, explanation, page, number, topic, near=(), mode=None, tb=None, tbnote=''):
        if prompt in self.prompts: return False
        mode = mode or self.mode
        file = PAGES[mode][page]; led = LEDGER[file]
        tb = tb or self.tb
        n = len(self.qs) + 1
        q = {'id': f'{self.uid}-{n}', 'type': 'input', 'prompt': prompt, 'answer': answer, 'explanation': explanation,
             'source': {'id': led['id'], 'file': file, 'sha256': led['sha256'], 'page': page, 'number': number},
             'ref': f'参考：{BOOK[mode]} p{page} {number}（{topic}）' + (f'・教科書 p{tb}{(" " + tbnote) if tbnote else ""}' if tb else ''),
             'origin': 'adapted', 'reviewed': True, 'difficulty': 'hard'}
        if tb: q['textbook'] = textbook_ref(tb)
        near = [x for x in near if x is not None]
        if answer.get('kind') in ('expr', 'relation'):
            near = [x for x in dict.fromkeys(near) if x != answer['value']]
        elif answer.get('kind') == 'number':  # 正解と同じ値・重なりは「惜しい」に入れない
            near = [x for x in dict.fromkeys(near) if F(x) != F(answer['value'])]
        elif answer.get('kind') == 'exact':
            import re as _re
            more = []
            for x in near:  # 座標の惜しい答えは (a,b) の形も入れる
                if _re.fullmatch(r'-?[\d/]+,-?[\d/]+', str(x)): more.append('(' + x + ')')
            near = [x for x in dict.fromkeys(list(near) + more) if x not in answer['accepted']]
        if near: q['near'] = near
        self.prompts.add(prompt); self.qs.append(q); return True
    def json(self):
        assert len(self.qs) == 70, (self.uid, len(self.qs))
        return {'id': self.uid, 'mode': self.mode, 'subject': '数学', 'grade': 1, 'title': self.title, 'majorTitle': self.major,
                'status': 'ready', 'size': 70, 'schedule': 'marks', 'questions': self.qs, 'tests': [],
                'reviewNote': self.note}

def num_answer(v, dec=False):
    """dec=True のとき、有限小数なら小数で持つ（小数の問題の答えを 13/2 のような分数で見せない）"""
    v = F(v)
    if dec and v.denominator != 1:
        d = dec_str(abs(v))
        if d is not None: return {'kind': 'number', 'value': ('-' if v < 0 else '') + d}
    return {'kind': 'number', 'value': ans_str(v)}
def nums_answer(vs, ordered=False): return {'kind': 'numbers', 'values': [ans_str(F(v)) for v in vs], 'ordered': ordered}
def exact_answer(accepted, compact=False):
    a = {'kind': 'exact', 'accepted': list(dict.fromkeys(accepted))}
    if compact: a['compact'] = True
    return a
def expr_answer(value, form=None, units=None, order=False):
    """式の答え（同じ式なら書き方は自由。表し方が足りないときは△）"""
    a = {'kind': 'expr', 'value': value}
    if form: a['form'] = form
    if units: a['units'] = list(units)
    if order: a['order'] = True
    return a
def relation_answer(value, units=None):
    a = {'kind': 'relation', 'value': value}
    if units: a['units'] = list(units)
    return a

def choice_answer(letters):
    """記号の答え（ア、イ…）。並び順と区切りのちがいを全部正解にする"""
    letters = list(letters)
    acc = []
    for perm in itertools.permutations(letters):
        for sep in ('、', ',', '', ' ', '・'):
            acc.append(sep.join(perm))
    return exact_answer(acc)

def expr_q(u, e, page, number, topic, lead='次の計算をしよう。', extra_near=(), tb=None, tbnote=''):
    """計算問題：答え・誤りの値（惜しい）・説明を自動でつける"""
    v = e.val()
    dec = not any(x.kind == 'frac' for x in lits(e)) and any(x.kind == 'dec' for x in lits(e))
    near = [ans_str(x) for x in mistakes(e)] + [ans_str(F(x)) for x in extra_near if F(x) != v]
    expl = explain(e, dec)
    return u.add(f'{lead}\n{show(e)}', num_answer(v, dec), expl, page, number, topic, near, tb=tb, tbnote=tbnote)

def explain(e, dec=False):
    v = e.val(); k = 'dec' if dec else 'auto'
    if isinstance(e, Chain):
        parts, ops = e.terms()
        if len(parts) == 1 and all(isinstance(x, Lit) for x in lits(e)) and not any(isinstance(t, (Pow, Neg, Grp)) for t in [e.first] + [t for _, t in e.rest]):
            # 乗除だけの式：①÷を×になおす ②符号を決める ③絶対値を計算する（教科書 p40 例10 の順）
            items = [e.first.v] + [t.v for _, t in e.rest]; opl = [op for op, _ in e.rest]
            negs = sum(1 for x in items if x < 0)
            s = ''
            if '÷' in opl and not dec:
                conv = [items[0]] + [x if op == '×' else 1 / x for op, x in zip(opl, items[1:])]
                s += '÷ をわる数の逆数の × になおすと ' + ' × '.join(Lit(x, 'int' if x.denominator == 1 else 'frac').render(i == 0, True) for i, x in enumerate(conv)) + '。'
            if v == 0: return s + '0 をかけると積は 0。答え 0'
            s += f'負の数が {negs} 個（{"偶数" if negs % 2 == 0 else "奇数"}）なので、答えの符号は {"＋" if negs % 2 == 0 else "−"}。'
            s += f'絶対値を計算して、答え {fmt_num(v, k)}'
            return s
        if len(parts) > 1 and (any(len(p) > 1 for p in parts) or any(isinstance(t, (Pow, Neg, Grp)) for t in [e.first] + [t for _, t in e.rest])):
            # 累乗・かっこ・乗除がまざった式は、途中式を1段ずつ書く
            return '計算の順序（累乗 → かっこの中 → 乗除 → 加減）にしたがうと、' + show(e) + ' ＝ ' + ' ＝ '.join(steps(e, dec)) + '。答え ' + fmt_num(v, k)
        if len(parts) > 1:
            vals = []
            for p in parts:
                c = Chain(p[0], *p[1:]) if len(p) > 1 else p[0]
                vals.append(c.val())
            sig = [x if i == 0 or ops[i - 1] == '+' else -x for i, x in enumerate(vals)]
            pos = sum(x for x in sig if x > 0); neg = sum(x for x in sig if x < 0)
            head = '累乗 → かっこの中 → 乗除 → 加減 の順に計算する。' if any(len(p) > 1 for p in parts) or any(isinstance(t, (Pow, Neg, Grp)) for t in [e.first] + [t for _, t in e.rest]) else 'ひく数は符号を変えて、加法だけの式とみる。'
            return head + f' 項に直すと {"、".join(fmt_num(x, k) for x in sig)}。正の項の和 {fmt_num(pos, k)}、負の項の和 {fmt_num(neg, k)} をまとめて、答え {fmt_num(v, k)}'
    return '計算の順序（累乗 → かっこの中 → 乗除 → 加減）にしたがうと、' + show(e) + ' ＝ ' + ' ＝ '.join(steps(e, dec)) + '。答え ' + fmt_num(v, k)

def rng(seed): return random.Random(seed)
