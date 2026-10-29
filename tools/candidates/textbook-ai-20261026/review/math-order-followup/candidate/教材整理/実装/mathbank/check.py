"""70問の小単元の品質検査（文字飛び・答えの採点・惜しいの判定・出典の番号）"""
import json, re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
ENGINE = ROOT / '教材整理/実装/material-engine.js'

BAD = [r'None', r'nan\b', r'\binf\b', r'undefined', r'\{\}', r'\[\]', r'  ', r'[+−×÷] −\d', r'[+−×÷]\s*[+×÷]', r'−\s*−\d', r'\(\)', r'^\s', r'\s$', r'、、', r'。。', r'\?\?',
       r'(^|[ ：　、。＝])−\d+(\.\d+)?(/\d+)? ?[×÷]', r'[×÷] ?−?\d+/\d+', r'(^|[^(\d/])\d+/\d+ ?[×÷]', r'(?<![\w/.])-\d']  # 半角の - は使わない（−）  # かけ算・わり算の中の負の数と分数はかっこ

def balanced(s):
    st = []
    pairs = {')': '(', '}': '{', ']': '[', '）': '（', '」': '「'}
    for ch in s:
        if ch in '({[（「': st.append(ch)
        elif ch in pairs:
            if not st or st.pop() != pairs[ch]: return False
    return not st

def check(unit, allowed):
    errs = []
    qs = unit['questions']
    if len(qs) != 70: errs.append(f'問題数 {len(qs)}')
    if len({q['prompt'] for q in qs}) != len(qs): errs.append('同じ問題文がある')
    if len({q['id'] for q in qs}) != len(qs): errs.append('同じIDがある')
    for q in qs:
        tag = q['id']
        for field in ('prompt', 'explanation', 'ref'):
            t = q.get(field, '')
            if not t: errs.append(f'{tag}: {field} が空'); continue
            for line in t.split('\n'):
                for pat in BAD:
                    if re.search(pat, line): errs.append(f'{tag}: {field} に {pat!r}: {line}')
            if not balanced(t): errs.append(f'{tag}: {field} のかっこが閉じていない: {t}')
        src = q['source']; num = src['number']
        if src['page'] not in allowed or not any(num.startswith(a) for a in allowed[src['page']]):
            errs.append(f'{tag}: 出典 p{src["page"]} {num} は確認したページの番号にない')
        if 'textbook' in q and q['textbook']['page'] not in allowed.get('tb', ()):
            errs.append(f'{tag}: 教科書 p{q["textbook"]["page"]} は確認したページにない')
    # 採点（エンジンで正答が正解・惜しいが惜しいになるか）
    js = r"""
const e=require(process.argv[1]);const u=JSON.parse(require('fs').readFileSync(0,'utf8'));const out=[];
for(const q of u.questions){const a=q.answer;const right=['number','expr','relation'].includes(a.kind)?a.value:a.kind==='numbers'?a.values.join(','):a.kind==='set'?a.items.map(x=>x[0]).join('、'):a.accepted[0];
 const r=e.grade(q,right);if(!r.correct)out.push(q.id+': 正答が正解にならない '+right);
 for(const n of q.near||[]){const g=e.grade(q,n);if(g.correct)out.push(q.id+': 惜しいの値が正解になる '+n);else if(!g.near)out.push(q.id+': 惜しいの値が△にならない '+n);}
 if(e.grade(q,'わからない').correct)out.push(q.id+': わからないが正解');}
const errs=e.validateUnit(u,{sources:null});console.log(JSON.stringify(out));"""
    p = subprocess.run(['node', '-e', js, str(ENGINE)], input=json.dumps(unit, ensure_ascii=False), capture_output=True, text=True)
    if p.returncode: errs.append('node: ' + p.stderr[-400:])
    else: errs += json.loads(p.stdout.strip().splitlines()[-1])
    return errs
