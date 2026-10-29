"""ここまでの候補の修正を1つにまとめた「反映用の写し」をつくる（Claude 2026-10-29）。前の候補フォルダ・本体は変更しない。
土台：20261029_立体残7/原稿（全単元）＋ このフォルダの ../原稿（spaceuse・solidreview の完成候補）
入れる修正：①出典ページ（../出典点検、9単元）②単位の登録（../単位の採点候補 第2版、111問）③georeview-22 の差しかえ（../発展の差しかえ）④spaceline-12 の解説の最後「答え 4組」→「答え 4通り」⑤calc2-24 の解説の式の符号
入れないもの：hist1・hist2 のグラフ差しかえ（採用するかの判断待ち）、surface2（保留）"""
import json, copy, pathlib, hashlib
H = pathlib.Path(__file__).resolve().parent; C = H.parent; W = C.parent
base = {p.name: json.loads(p.read_text(encoding='utf-8')) for p in sorted((W / '20261029_立体残7' / '原稿').glob('tokkun-math-1-*.json'))}
for n in ('tokkun-math-1-spaceuse.json', 'tokkun-math-1-solidreview.json'):
    base[n] = json.loads((C / '原稿' / n).read_text(encoding='utf-8'))
orig = copy.deepcopy(base); log = []
byid = {q['id']: (n, i) for n, u in base.items() for i, q in enumerate(u['questions'])}
# ① 出典ページ
aud = json.loads((C / '出典点検' / '出典ページ対応_候補.json').read_text(encoding='utf-8'))
for key, rows in aud['units'].items():
    for r in rows:
        n, i = byid[r['id']]; q = base[n]['questions'][i]
        assert q['source']['page'] == r['currentPage'] and q['source']['file'] == r['currentFile'], r['id']
        if r['changed']:
            q['source'] = dict(q['source'], file=r['proposedFile'], sha256=r['sha256'], page=r['proposedPage'])
            q['textbook'] = {'file': r['proposedFile'], 'sha256': r['sha256'], 'page': r['proposedPage']}
            log.append(('出典', r['id']))
# ② 単位
for p in json.loads((C / '単位の採点候補' / '修正案_units.json').read_text(encoding='utf-8'))['patch']:
    n, i = byid[p['id']]; a = base[n]['questions'][i]['answer']; assert 'units' not in a; a['units'] = p['addUnits']; log.append(('単位', p['id']))
# ③ georeview-22
rep = json.loads((C / '発展の差しかえ' / 'tokkun-math-1-georeview.json').read_text(encoding='utf-8'))['questions'][21]
n, i = byid['tokkun-math-1-georeview-22']; q = base[n]['questions'][i]
for k in ('prompt', 'answer', 'explanation'): q[k] = rep[k]
log.append(('差しかえ', q['id']))
# ④ spaceline-12
n, i = byid['tokkun-math-1-spaceline-12']; q = base[n]['questions'][i]
assert q['explanation'].endswith('答え 4組'); q['explanation'] = q['explanation'][:-len('答え 4組')] + '答え 4通り'; log.append(('解説', q['id']))
# ⑤ calc2-24（自己点検の解説の計算で発見）：「3 × (−7) × (−10) ＝ (−7) × 30」は左が 210、右が −210 で等しくない。ひく記号をふくめて書く
n, i = byid['tokkun-math-1-calc2-24']; q = base[n]['questions'][i]
a = '①3 × (−7) × (−10) ＝ (−7) × 30 と見る'; assert q['explanation'].startswith(a)
q['explanation'] = '①− 3 × (−7) × (−10) ＝ (−7) × 30 と見る' + q['explanation'][len(a):]; log.append(('解説', q['id']))
# 変わったところが、ねらった項目だけかを確かめる
ALLOWED = {'出典': {'source', 'textbook'}, '単位': {'answer'}, '差しかえ': {'prompt', 'answer', 'explanation'}, '解説': {'explanation'}}
want = {}
for kind, qid in log: want.setdefault(qid, set()).update(ALLOWED[kind])
changed = 0
for n in base:
    assert {k: v for k, v in base[n].items() if k != 'questions'} == {k: v for k, v in orig[n].items() if k != 'questions'}, n
    for a, b in zip(orig[n]['questions'], base[n]['questions']):
        diff = {k for k in set(a) | set(b) if a.get(k) != b.get(k)}
        assert diff <= want.get(a['id'], set()), (a['id'], diff)
        if diff: changed += 1
    (H / '原稿' / n).write_text(json.dumps(base[n], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
from collections import Counter
summary = {'units': len(base), 'questionsChanged': changed, 'byKind': dict(Counter(k for k, _ in log))}
(H / '変更一覧.json').write_text(json.dumps({'summary': summary, 'changes': [{'kind': k, 'id': i} for k, i in log]}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(summary)
