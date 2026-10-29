"""ドリル（mode: drill）の小単元を作る共通部品。既存の drill-math-1-signed と同じ形：
本問題100問＋確認テスト15問＋解き方ガイド（guide）5つ。問題は115問つくり、最後の15問を確認テストにする。
検査に1つでも落ちたら何も書かない。台帳は出典に使った写真（目視した見開き）だけ確認済みにする。"""
import json, subprocess, sys, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
LEDGER_PATH = ROOT / '教材整理/教材照合台帳.json'
ENGINE = ROOT / '教材整理/実装/material-engine.js'
OUT = ROOT / '教材整理/確認済み'
OUTLINE = ROOT / 'site-assets/material-outline.js'
BAD = [('  ', '空白の重なり'), ('。。', '。の重なり'), ('、、', '、の重なり'), ('undefined', 'undefined'), ('None', 'None')]

def to_json(u, subject, guide, note):
    """u.qs（115問）を 100問＋確認テスト15問 の形にする"""
    assert len(u.qs) == 115, (u.uid, len(u.qs))
    clean = lambda q: {k: v for k, v in q.items() if k != 'example'}
    qs = [dict(clean(q), id=f'{u.uid}-{i}') for i, q in enumerate(u.qs[:100], 1)]
    ts = [dict(clean(q), id=f'{u.uid}-test-{i}') for i, q in enumerate(u.qs[100:], 1)]
    assert len(guide) == 5 and all(g.get('title') and g.get('body') for g in guide)
    return {'id': u.uid, 'mode': 'drill', 'subject': subject, 'grade': getattr(u, 'grade', 1), 'title': u.title, 'majorTitle': u.major, 'status': 'ready',
            'questions': qs, 'tests': ts, 'reviewNote': note, 'guide': guide}

def _example(q):
    a = q['answer']
    if 'example' in q: return q['example']
    k = a['kind']
    if k == 'exact': return a['accepted'][0]
    if k in ('number', 'expr', 'relation'): return a['value'] + ((a.get('units') or [''])[0] if k == 'number' and a.get('unitRequired') else '')
    if k == 'numbers': return ','.join(a['values'])
    if k == 'set': return '、'.join(x[0] for x in a['items'])
    if k == 'rubric': return '、'.join(c['any'][0] for c in a['criteria'])
    return None

def brackets(s):
    pairs = {'（': '）', '「': '」', '(': ')', '【': '】', '『': '』'}
    st = []
    for ch in s:
        if ch in pairs: st.append(pairs[ch])
        elif ch in pairs.values():
            if not st or st.pop() != ch: return False
    return not st

def check(unit_json, viewed):
    errs, cases = [], []
    allq = unit_json['questions'] + unit_json['tests']
    if len(unit_json['questions']) != 100 or len(unit_json['tests']) != 15: errs.append('数がちがう')
    prompts = [re.sub(r'\s+', ' ', q['prompt']).strip() for q in allq]
    if len(set(prompts)) != len(prompts): errs.append('問題文の重なり')
    for q in allq:
        if q['source']['page'] not in viewed: errs.append(f"{q['id']} 目視していないページ p{q['source']['page']}")
        for f in ('prompt', 'explanation'):
            if not brackets(q[f]): errs.append(f"{q['id']} {f} かっこ")
            for b, why in BAD:
                if b in q[f]: errs.append(f"{q['id']} {f} {why}")
    return errs

def engine_check(unit_json, raw_qs):
    """正答例が正解・わからないが不正解・惜しいが△・validateUnit が通る"""
    cases = []
    for jq, rq in zip(unit_json['questions'] + unit_json['tests'], raw_qs):
        ex = _example(rq)
        if ex is None: cases.append({'q': jq, 'input': '', 'expect': 'noexample'}); continue
        cases.append({'q': jq, 'input': ex, 'expect': 'correct'})
        cases.append({'q': jq, 'input': 'わからない', 'expect': 'wrong'})
        for n in jq.get('near', []): cases.append({'q': jq, 'input': n, 'expect': 'near'})
    js = ("const E=require(process.argv[1]);const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));const out=[];"
          "for(const c of d.cases){if(c.expect==='noexample'){out.push(c.q.id+' 正答例なし');continue;}const r=E.grade(c.q,c.input);"
          "const ok=c.expect==='correct'?r.correct===true:c.expect==='wrong'?r.correct===false:(r.correct===false&&r.near===true);"
          "if(!ok)out.push(c.q.id+' '+c.expect+' 「'+c.input+'」→'+JSON.stringify(r));}"
          "out.push(...E.validateUnit(d.unit,{sources:null}).filter(x=>!/registry/.test(x)).map(x=>'validate: '+x));console.log(JSON.stringify(out));")
    r = subprocess.run(['node', '-e', js, str(ENGINE)], input=json.dumps({'cases': cases, 'unit': unit_json}, ensure_ascii=False), capture_output=True, text=True)
    if r.returncode: return ['node: ' + r.stderr[:400]]
    return json.loads(r.stdout)

def build(units, *, subject, viewed, file_info, area, write, today='2026-10-08', grade_of=None):
    """units: (unitオブジェクト, guide, note) を返す関数の並び"""
    built, bad = [], 0
    for fn in units:
        u, guide, note = fn()
        uj = to_json(u, subject, guide, note)
        errs = check(uj, viewed) + engine_check(uj, u.qs)
        print(u.uid, len(uj['questions']), '+', len(uj['tests']), 'OK' if not errs else f'NG {len(errs)}')
        for e in errs[:20]: print('  ', e)
        if errs: bad += 1; continue
        built.append((u, uj))
    if bad: print('NG units:', bad); sys.exit(1)
    if not write: return built
    ledger = json.loads(LEDGER_PATH.read_text(encoding='utf-8'))
    used = {}
    for u, uj in built:
        for q in uj['questions'] + uj['tests']: used.setdefault(q['source']['file'], set()).add(q['source']['page'])
    seen = set()
    for e in ledger:
        if e['file'] not in used: continue
        assert e['file'] in file_info, ('目視していない写真', e['file'])
        pages, title = file_info[e['file']]
        assert used[e['file']] <= set(pages), ('ページが見開きの外', e['file'], used[e['file']], pages)
        seen.add(e['file'])
        if e.get('verified') and e.get('pages') == list(pages): continue
        g = {uj['grade'] for u, uj in built for q in uj['questions'] + uj['tests'] if q['source']['file'] == e['file']}
        assert len(g) == 1, ('学年がまざる写真', e['file'], g)
        gv = g.pop()
        e.update({'verified': True, 'grade': gv, 'pages': list(pages), 'gradeSource': 'user-confirmed-all-workbooks-grade-1' if gv == 1 else 'drill-chapter-heading',
                  'reviewNote': f'{today} Claude 原本p{pages[0]}' + (f'〜{pages[-1]}' if len(pages) > 1 else '') + 'を目視（見出し・問題番号）。ドリルの類題（作り直した問題）の出典住所に使う。手書きの答えは採用しない。',
                  'visualReview': 'full-image-reviewed', 'contentArea': area, 'visualTitle': title})
    assert seen == set(used), ('台帳にない写真', set(used) - seen)
    LEDGER_PATH.write_text(json.dumps(ledger, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for u, uj in built:
        (OUT / f'{u.uid}.json').write_text(json.dumps(uj, ensure_ascii=False, indent=1), encoding='utf-8')
    src = OUTLINE.read_text(encoding='utf-8')
    head, body = src.split('globalThis.NobiMaterialOutline = ', 1)
    rows = json.loads(body.rstrip().rstrip(';'))
    titles = {(uj['grade'], u.title) for u, uj in built}
    # 同じ教科のドリル行のうち、今回つくった単元と同じ名前の行だけを置きかえる（ほかの準備中の行は残す）
    hit = lambda r: r['mode'] == 'drill' and r['subject'] == subject and (r['grade'], r['title']) in titles
    new = [{'mode': 'drill', 'grade': uj['grade'], 'subject': subject, 'major': u.major, 'title': u.title, 'source': '確認済み問題バンク'} for u, uj in built]
    at = next((i for i, r in enumerate(rows) if hit(r)), None)
    if at is None:
        idx = [i for i, r in enumerate(rows) if r['mode'] == 'drill' and r['subject'] == subject] or [i for i, r in enumerate(rows) if r['mode'] == 'drill']
        at = idx[-1] + 1 if idx else len(rows)
    before = [r for r in rows[:at] if not hit(r)]; after = [r for r in rows[at:] if not hit(r)]
    OUTLINE.write_text(head + 'globalThis.NobiMaterialOutline = ' + json.dumps(before + new + after, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print('written', len(built), 'units')
    return built
