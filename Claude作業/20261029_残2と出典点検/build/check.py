"""特訓70問の下書きの検査。
1) 1小単元ちょうど70問  2) 問題文の重複・数字だけ替えた類題（特訓どうし・教科書問題すべてと比べる）
3) 答えを別の道すじで計算し直す（式は jmath.py で問題文から直接、文章題は総当たり・別の式）
4) 採点エンジン（site-assets/material-engine.js を node で実行）で、正答が○・誤答が×・惜しいが△
5) 問題文に答えがそのまま書かれていない  6) 解説がある  7) 書き方のきまり（−、かっこ）
使い方: python3 check.py [小単元キー ...]"""
import json, re, subprocess, sys, random, inspect, difflib, unicodedata, importlib
from fractions import Fraction as F
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import jmath, mk
from units import ORDER

ROOT = mk.ROOT
ENGINE = ROOT / 'site-assets/material-engine.js'
OUT = mk.OUT

BAD = [r'None', r'nan\b', r'\binf\b', r'undefined', r'\{\}', r'\[\]', r'  ', r'[+−×÷] −\d', r'[+−×÷]\s*[+×÷]', r'−\s*−\d', r'\(\)', r'^\s', r'\s$', r'、、', r'。。', r'\?\?',
       r'(^|[ ：　、。＝])−\d+(\.\d+)?(/\d+)? ?[×÷]', r'[×÷] ?−?\d+/\d+', r'(^|[^(\d/])\d+/\d+ ?[×÷]', r'(?<![\w/.])-\d', r'Fraction']


def balanced(s):
    st, pairs = [], {')': '(', '}': '{', ']': '[', '）': '（', '」': '「'}
    for ch in s:
        if ch in '({[（「': st.append(ch)
        elif ch in pairs:
            if not st or st.pop() != pairs[ch]: return False
    return not st


def mask(s):
    s = ''.join('#' if c in jmath.SUP else c for c in str(s))
    s = unicodedata.normalize('NFKC', s).replace('−', '-').replace('－', '-')
    s = re.sub(r'\d+(\.\d+)?', '#', s)
    return re.sub(r'\s+', '', s)


def existing_prompts():
    out = []
    for f in sorted((ROOT / '教材整理/確認済み').glob('workbook-math-1-*.json')):
        d = json.loads(f.read_text(encoding='utf-8'))
        out += [(q['id'], q['prompt']) for q in d['questions'] + d.get('tests', [])]
    bank = json.loads((ROOT / 'site-assets/material-bank.json').read_text(encoding='utf-8'))
    seen = {i for i, _ in out}
    for u in bank['units']:
        if u.get('subject') == '数学' and u.get('grade') == 1:
            out += [(q['id'], q['prompt']) for q in u.get('questions', []) + u.get('tests', []) if q['id'] not in seen and not q['id'].startswith('tokkun-')]  # 確認版へつないだ特訓（自分自身）は比べない
    return out


def rand_frac(rng):
    while True:
        v = F(rng.randint(-40, 40), rng.choice([1, 1, 1, 2, 3, 5, 7]))
        if v != 0: return v


def same(a, b):
    return F(a) == F(b)


def pyeval(s):
    """jmath とは別の道すじ：書き方を Python の式に置きかえて、Fraction で eval する（数だけの式用）"""
    t = ''
    for c in s:
        t += {'²': '**2', '³': '**3', '⁴': '**4', '⁵': '**5', '⁶': '**6', '⁷': '**7', '⁸': '**8', '⁹': '**9', '⁰': '**0', '¹': '**1'}.get(c, c)
    t = re.sub(r'\*\*(\d)\*\*(\d)(\*\*(\d))?', lambda m: '**' + m.group(1) + m.group(2) + (m.group(4) or ''), t)
    t = t.replace('−', '-').replace('×', '*').replace('÷', '/').replace('{', '(').replace('}', ')').replace('[', '(').replace(']', ')').replace(' ', '')
    t = re.sub(r'(\d+\.\d+|\d+)', lambda m: f'F("{m.group(1)}")', t)
    t = re.sub(r'F\("(\d+)"\)\*\*F\("(\d+)"\)', r'F("\1")**\2', t)
    t = re.sub(r'\)\*\*F\("(\d+)"\)', r')**\1', t)
    # 単項マイナスは累乗より弱い（−3² ＝ −9）：Python と同じ
    return F(eval(t, {'F': F}))


def pyroot(line):
    """jmath とは別の道すじ：両辺を Python の式として計算し、一次式として解いて、その解を代入して確かめる"""
    l, r = line.split('＝') if '＝' in line else line.split('=')
    g = lambda x: pyeval_x(l, F(x)) - pyeval_x(r, F(x))
    g0, g1 = g(0), g(1)
    if g1 == g0 or g(2) - g1 != g1 - g0: return None
    x = -g0 / (g1 - g0)
    return x if g(x) == 0 else None


def pyeval_x(s, x):
    t = s
    t = re.sub(r'(\d)x', r'\1*x', t)
    t = re.sub(r'\)x', r')*x', t)
    t = re.sub(r'(\d|x|\))\(', r'\1*(', t)
    t = t.replace('x', '(' + str(x.numerator) + '/' + str(x.denominator) + ')')
    return pyeval(t)


def verify(q, spec):
    """答えを別の道すじで計算し直す。まちがいがあれば文を返す"""
    a = q['answer']; k = a['kind']; rng = random.Random(q['id'])
    if spec == 'auto':
        line = q['prompt'].split('\n')[-1]
        if k == 'number':
            got = jmath.value(line)
            got2 = pyeval(line)
            if got != got2: return f'2つの計算方法の結果がちがう {got} / {got2}'
            return None if got == jmath.number(a['value']) else f'式を計算すると {got}、答えは {a["value"]}'
        if k == 'expr':
            vs = sorted(set(jmath.variables(line)) | set(jmath.variables(a['value'])))
            f, g = jmath.parse(line), jmath.parse(a['value'])
            for _ in range(8):
                env = {v: rand_frac(rng) for v in vs}
                if f(env) != g(env): return f'式の値がちがう {env}: 問題 {f(env)}、答え {g(env)}'
            return None
        return 'auto はこの答えの種類に使えない'
    if spec == 'autoeq':
        line = q['prompt'].split('\n')[-1]
        L, op, R, vs = jmath.relation(line)
        if op != '=' or vs != ['x']: return '方程式の形が読めない'
        g = lambda t: L({'x': F(t)}) - R({'x': F(t)})
        if g(1) == g(0): return '解が1つに決まらない'
        if g(2) - g(1) != g(1) - g(0): return '一次方程式ではない'
        root = -g(0) / (g(1) - g(0))
        if g(root) != 0: return '検算で解が合わない'
        got2 = pyroot(line)
        if got2 != root: return f'2つの解き方の結果がちがう {root} / {got2}'
        return None if root == jmath.number(a['value']) else f'方程式を解くと {root}、答えは {a["value"]}'
    if k == 'number':
        got = spec()
        return None if F(got) == jmath.number(a['value']) else f'検算 {got}、答え {a["value"]}'
    if k == 'numbers':
        got = sorted(F(x) for x in spec()); want = sorted(jmath.number(x) for x in a['values'])
        if a.get('ordered'): got = [F(x) for x in spec()]; want = [jmath.number(x) for x in a['values']]
        return None if got == want else f'検算 {got}、答え {want}'
    if k == 'set':
        got = set(spec()); want = {x[0] for x in a['items']}
        return None if got == want else f'検算 {sorted(got)}、答え {sorted(want)}'
    if k == 'exact':
        got = spec()
        return None if got == a['accepted'][0] else f'検算 {got}、答え {a["accepted"][0]}'
    if k == 'expr':
        names = list(inspect.signature(spec).parameters)
        g = jmath.parse(a['value'])
        extra = set(jmath.variables(a['value'])) - set(names)
        if extra: return f'答えに検算にない文字 {extra}'
        for _ in range(8):
            env = {v: rand_frac(rng) for v in names}
            if F(spec(**env)) != g(env): return f'式の値がちがう {env}: 検算 {spec(**env)}、答え {g(env)}'
        return None
    if k == 'relation':
        op_s, fn = spec
        L, op, R, vs = jmath.relation(a['value'])
        names = list(inspect.signature(fn).parameters)
        if set(vs) - set(names): return f'答えに検算にない文字 {set(vs) - set(names)}'
        flip = {'>': '<', '≧': '≦', '<': '<', '≦': '≦', '=': '='}
        want_op = {'lt': '<', 'le': '≦', 'gt': '>', 'ge': '≧', 'eq': '='}[op_s]
        sa = -1 if op in ('>', '≧') else 1; sw = -1 if want_op in ('>', '≧') else 1
        if flip[op] != flip[want_op]: return f'不等号の種類がちがう {op} / {want_op}'
        ratio = None
        for _ in range(8):
            env = {v: rand_frac(rng) for v in names}
            d1 = sa * (L(env) - R(env)); d2 = sw * F(fn(**env))
            if d2 == 0:
                if d1 != 0: return '関係がちがう'
                continue
            r = d1 / d2
            if ratio is None: ratio = r
            if r != ratio or r == 0 or (op != '=' and r < 0): return f'関係がちがう（比 {r}）'
        return None
    return f'検算できない答えの種類 {k}'


def mutated(q):
    """空振り防止：答えをわざとこわした問題。verify がこれを見のがしたら検査が働いていない"""
    import copy
    m = copy.deepcopy(q); a = m['answer']; k = a['kind']
    if k == 'number': a['value'] = str(jmath.number(a['value']) + 1)
    elif k == 'numbers': a['values'][0] = str(jmath.number(a['values'][0]) + 1)
    elif k == 'set': a['items'] = a['items'][:-1] if len(a['items']) > 1 else [[next(c for c in 'アイウエオカキク' if [c] not in a['items'])]]
    elif k == 'exact': a['accepted'] = ['（ちがう答え）']
    elif k == 'expr': a['value'] = a['value'] + '+1'
    elif k == 'relation': a['value'] = a['value'] + '+1'
    return m


def wrong_answer(a):
    k = a['kind']
    if k == 'number': return str(jmath.number(a['value']) + 1).replace('-', '−')
    if k == 'numbers': v = list(a['values']); v[0] = str(jmath.number(v[0]) + 7); return '、'.join(v)
    if k == 'set':
        items = [x[0] for x in a['items']]
        if len(items) >= 2: return items[0]
        return next(c for c in 'アイウエオカキク' if c not in items)
    if k == 'exact': return 'ちがう答え'
    if k == 'expr': return a['value'] + '+1'
    if k == 'relation':
        m = re.search(r'(=|<|>|≦|≧|＜|＞)', a['value']); return a['value'] + '+1' if m else a['value'] + '=1'
    raise ValueError(k)


def model_answer(a):
    k = a['kind']
    if k in ('number', 'expr', 'relation'): return a['value']
    if k == 'numbers': return '、'.join(a['values'])
    if k == 'set': return '、'.join(x[0] for x in a['items'])
    return a['accepted'][0]


NODE = r"""
const e=require(process.argv[1]);const u=JSON.parse(require('fs').readFileSync(0,'utf8'));const out=[];
const byId=Object.fromEntries(u.questions.map(q=>[q.id,q]));
for(const t of u.__tests){const q=byId[t.id];for(const [inp,exp] of t.cases){const r=e.grade(q,inp);
 const got=r.correct?'correct':r.near?'near':'wrong';
 if(exp==='wrong'?r.correct:got!==exp)out.push(t.id+': 「'+inp+'」は '+exp+' のはずが '+got+'（'+r.reason+'）');}}
const errs=e.validateUnit(Object.assign({},u,{__tests:undefined}),{sources:null});
console.log(JSON.stringify({out,errs}));"""


def engine_check(unit):
    tests = []
    for q in unit['questions']:
        cases = [(model_answer(q['answer']), 'correct'), (wrong_answer(q['answer']), 'wrong'), ('わからない', 'wrong')]
        cases += [(n, 'near') for n in q.get('near', [])]
        tests.append({'id': q['id'], 'cases': cases})
    data = dict(unit); data['__tests'] = tests
    p = subprocess.run(['node', '-e', NODE, str(ENGINE)], input=json.dumps(data, ensure_ascii=False), capture_output=True, text=True)
    if p.returncode: return ['node: ' + p.stderr[-500:]]
    r = json.loads(p.stdout.strip().splitlines()[-1])
    errs = list(r['out'])
    other = [x for x in r['errs'] if x != 'unreviewed question']
    if other: errs.append('validateUnit: ' + ', '.join(other))
    return errs


def leak(q):
    a = q['answer']; k = a['kind']; pr = unicodedata.normalize('NFKC', q['prompt']).replace('−', '-').replace(' ', '')
    if k == 'number':
        v = jmath.number(a['value'])
        if v.denominator == 1 and abs(v) < 10: return None
        forms = {unicodedata.normalize('NFKC', a['value']).replace('−', '-')}
        if v.denominator == 1: forms.add(str(v))
        for f in forms:
            if re.search(r'(?<![\d./])' + re.escape(f) + r'(?![\d./])', pr): return f'問題文に答え {f} がある'
    if k in ('expr', 'relation'):
        sup = lambda t: ''.join('^' + jmath.SUP[ch] if ch in jmath.SUP else ch for ch in t)
        pr = unicodedata.normalize('NFKC', sup(q['prompt'])).replace('−', '-').replace(' ', '')
        f = unicodedata.normalize('NFKC', sup(a['value'])).replace('−', '-').replace(' ', '')
        if len(f) >= 3 and re.search(r'(?<![\w^.+\-/])' + re.escape(f) + r'(?![\w^])', pr): return f'問題文に答え {f} がある'
    if k == 'exact':
        f = a['accepted'][0]
        if len(f) >= 2 and f in q['prompt']: return f'問題文に答え {f} がある'
    return None


def lint(q):
    errs = []
    for field in ('prompt', 'explanation', 'ref'):
        t = q.get(field, '')
        if not t: errs.append(f'{field} が空'); continue
        for line in t.split('\n'):
            for pat in BAD:
                if re.search(pat, line): errs.append(f'{field} に {pat!r}: {line}')
        if not balanced(t): errs.append(f'{field} のかっこが閉じていない')
    if len(q.get('explanation', '')) < 25: errs.append('解説が短すぎる')
    if not q['ref'].startswith('参考：'): errs.append('ref')
    return errs


def near_dups(items, others, th=0.9):
    """items: [(tag, masked)]。数字以外が同じ、またはほとんど同じ（似ている割合 th 以上）の組を返す"""
    out = []
    allm = items + others
    for i, (t1, m1) in enumerate(items):
        for t2, m2 in allm[i + 1:]:
            if m1 == m2: out.append((t1, t2, 1.0)); continue
            l1, l2 = len(m1), len(m2)
            if min(l1, l2) < 12 or min(l1, l2) / max(l1, l2) < th: continue
            sm = difflib.SequenceMatcher(None, m1, m2, autojunk=False)
            if sm.real_quick_ratio() < th or sm.quick_ratio() < th: continue
            r = sm.ratio()
            if r >= th: out.append((t1, t2, round(r, 3)))
    return out


def main(keys):
    present = [k for k in ORDER if (HERE / f'u_{k}.py').exists()]
    mods = {k: importlib.import_module('u_' + k) for k in present}
    keys = keys or present
    total_err = 0; summary = []; holds = []
    exist = [(t, mask(p)) for t, p in existing_prompts()]
    all_items = []
    units = {}
    for key in ORDER:
        p = OUT / f'tokkun-math-1-{key}.json'
        if not p.exists(): continue
        units[key] = json.loads(p.read_text(encoding='utf-8'))
        for q in units[key]['questions']: all_items.append((q['id'], mask(q['prompt'])))
    for key in keys:
        if key not in units: print(f'{key}: 下書きファイルがない'); total_err += 1; continue
        u = units[key]; U = mods[key].U; errs = []
        qs = u['questions']
        held = len(qs) != 70 and '【保留】' in u.get('reviewNote', '')
        if len(qs) != 70 and not held: errs.append(f'問題数 {len(qs)}（70ではない）')
        if held: holds.append((key, len(qs)))
        if len(U.qs) != len(qs): errs.append('下書きファイルが作問データと合わない（build.py を実行）')
        for q, src in zip(qs, U.qs):
            if q['prompt'] != src['prompt'] or q['answer'] != src['answer']: errs.append(f'{q["id"]}: ファイルと作問データが合わない')
            try:
                r = verify(q, src['v'])
            except Exception as ex:
                r = f'検算できない: {type(ex).__name__} {ex}'
            if r: errs.append(f'{q["id"]}: 答えの検算 ✗ {r}')
            else:
                try:
                    caught = bool(verify(mutated(q), src['v']))
                except Exception:
                    caught = True
                if not caught: errs.append(f'{q["id"]}: 検算が空振り（こわした答えも通る）')
            r = leak(q)
            if r: errs.append(f'{q["id"]}: {r}')
            errs += [f'{q["id"]}: {x}' for x in lint(q)]
            if q.get('origin') != 'original' or q.get('bank') != 'tokkun': errs.append(f'{q["id"]}: origin/bank')
        if u.get('bank') != 'tokkun' or u.get('status') != 'preparing' or u.get('size') != 70 or u.get('schedule') != 'marks' or u.get('mode') != 'workbook':
            errs.append('小単元の項目（bank/status/size/schedule/mode）')
        mine = [(q['id'], mask(q['prompt'])) for q in qs]
        others = [x for x in all_items if not x[0].startswith(u['id'] + '-')]
        for a, b, r in near_dups(mine, others + exist):
            errs.append(f'重複・類題: {a} と {b}（似ている割合 {r}）')
        errs += engine_check(u)
        total_err += len(errs)
        print(f'■ {key}: {len(qs)}問  ' + ('OK' if not errs else f'✗ {len(errs)}件') + ('（保留：70問未満。理由は reviewNote）' if held else ''))
        for e in errs[:60]: print('   ', e)
        summary.append((key, len(qs), len(errs)))
    print('合計', sum(n for _, n, _ in summary), '問 / 不合格', total_err, '件 / 70問の小単元', sum(1 for _, n, _ in summary if n == 70), '/ 保留', len(holds), ' '.join(f'{k}({n}問)' for k, n in holds))
    return total_err


if __name__ == '__main__':
    sys.exit(1 if main(sys.argv[1:]) else 0)
