"""70問の検査：数・重なり・かっこ・出典ページ・正答がエンジンで正解になるか・惜しい答えが△になるか"""
import json, subprocess, re, sys
from kbank import ROOT
ENGINE = ROOT / '教材整理/実装/material-engine.js'
BAD = [('  ', '空白の重なり'), ('？？', '？の重なり'), ('。。', '。の重なり'), ('、、', '、の重なり'), ('undefined', 'undefined'), ('None', 'None')]
def brackets(s):
    pairs = {'（': '）', '「': '」', '(': ')', '【': '】', '『': '』', '［': '］'}
    st = []
    for ch in s:
        if ch in pairs: st.append(pairs[ch])
        elif ch in pairs.values():
            if not st or st.pop() != ch: return False
    return not st
def check(unit):
    errs = []
    if len(unit.qs) != 70: errs.append(f'{unit.uid}: {len(unit.qs)}問')
    cases = []
    for q, ex in unit.examples():
        for field in ('prompt', 'explanation'):
            s = q[field]
            if not brackets(s): errs.append(f'{q["id"]} {field} かっこの対応')
            for b, why in BAD:
                if b in s: errs.append(f'{q["id"]} {field} {why}')
        if q['answer']['kind'] == 'rubric':
            for c in q['answer']['criteria']:
                for t in c['any']:
                    if re.fullmatch(r'[ぁ-ん]', t): errs.append(f'{q["id"]} ひらがな1字の採点語「{t}」は広すぎる')
        if ex is None: errs.append(f'{q["id"]} 正解例なし')
        else: cases.append({'q': q, 'input': ex, 'expect': 'correct'})
        cases.append({'q': q, 'input': 'わからない', 'expect': 'wrong'})
        for n in q.get('near', []): cases.append({'q': q, 'input': n, 'expect': 'near'})
    js = "const E=require(process.argv[1]);let out=[];const cs=JSON.parse(require('fs').readFileSync(0,'utf8'));for(const c of cs){const r=E.grade(c.q,c.input);const ok=c.expect==='correct'?r.correct===true:c.expect==='wrong'?r.correct===false:(r.correct===false&&r.near===true);if(!ok)out.push(c.q.id+' '+c.expect+' 「'+c.input+'」→'+JSON.stringify(r));}console.log(JSON.stringify(out));"
    r = subprocess.run(['node', '-e', js, str(ENGINE)], input=json.dumps(cases, ensure_ascii=False), capture_output=True, text=True)
    if r.returncode: errs.append('node: ' + r.stderr[:500])
    else: errs += json.loads(r.stdout)
    js2 = "const E=require(process.argv[1]);const u=JSON.parse(require('fs').readFileSync(0,'utf8'));const e=E.validateUnit(u,{sources:null});console.log(JSON.stringify(e.filter(x=>!/registry/.test(x))));"
    r = subprocess.run(['node', '-e', js2, str(ENGINE)], input=json.dumps(unit.json() if len(unit.qs) == 70 else {}, ensure_ascii=False), capture_output=True, text=True)
    if len(unit.qs) == 70: errs += [unit.uid + ' validate: ' + x for x in json.loads(r.stdout or '[]')]
    return errs
