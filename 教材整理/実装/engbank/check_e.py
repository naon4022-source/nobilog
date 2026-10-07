"""英語70問の検査：理科と同じ check_k（数・重なり・かっこ・正答がエンジンで正解・惜しいが△）に加えて、
出典ページが目視した見開きにあること・検証スクリプト(verify-material-marks)と同じ「正答」の作り方でも正解になること・
単元をまたいだ問題文の重なりがないこと、を見る"""
import json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scibank'))
from check_k import check as check_k, ENGINE

_ALL = {}
def extra(unit, viewed):
    errs = []
    for q in unit.qs:
        if q['source']['page'] not in viewed: errs.append(f"{q['id']} 目視していないページ p{q['source']['page']}")
        p = q['prompt']
        if p in _ALL and _ALL[p] != unit.uid: errs.append(f"{q['id']} 別の単元 {_ALL[p]} と同じ問題文")
        _ALL.setdefault(p, unit.uid)
    # verify-material-marks.mjs の right(q) と同じ正答で正解になるか
    js = ("const E=require(process.argv[1]);const qs=JSON.parse(require('fs').readFileSync(0,'utf8'));const out=[];"
          "const right=q=>['number','expr','relation'].includes(q.answer.kind)?q.answer.value:q.answer.kind==='numbers'?q.answer.values.join(','):"
          "q.answer.kind==='set'?q.answer.items.map(x=>x[0]).join('、'):q.answer.kind==='rubric'?q.answer.criteria.map(c=>c.any[0]).join('、'):q.answer.accepted[0];"
          "for(const q of qs){if(!E.grade(q,right(q)).correct)out.push(q.id+' right()が正解にならない');}console.log(JSON.stringify(out));")
    r = subprocess.run(['node', '-e', js, str(ENGINE)], input=json.dumps([{k: v for k, v in q.items() if k != 'example'} for q in unit.qs], ensure_ascii=False), capture_output=True, text=True)
    errs += json.loads(r.stdout or '["node error ' + r.stderr[:200].replace('"', '') + '"]')
    return errs

def make_check(viewed):
    return lambda u: check_k(u) + extra(u, viewed)
