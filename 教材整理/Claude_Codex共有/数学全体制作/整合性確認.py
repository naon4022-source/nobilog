# coding: utf-8
from pathlib import Path
import json,hashlib,collections
b=Path(__file__).resolve().parent;r=b.parents[2]
m=json.loads((b/'制作台帳.json').read_text())
# all planned pages are content-neutral shells
assert len(m['pages'])==m['pageCount'] and m['pageCount']>164
assert len({p['id'] for p in m['pages']})==m['pageCount']
assert len(m['units'])==21
for p in m['pages']:
 assert all(p[k] is None for k in ['body','examples','questions','answers'])
 assert p['author']=='Claude'
 assert p['teachingContract']['questionOnly'] is False
 assert len(p['teachingContract']['mustInclude'])>=3
 assert p['teachingContract']['practiceRule']
 assert p['sourceTextbookPages'] or p['unitId']=='INDEX'
for u in m['units']:
 assert u['pageIds']==[p['id'] for p in m['pages'] if p['unitId']==u['id']]
 assert u['imageSlots']==[s['id'] for s in m['imageSlots'] if s['unitId']==u['id']]
slots={s['id']:s for s in m['imageSlots']}
assert len(slots)==m['slotCount']==105
used=collections.Counter(sid for p in m['pages'] for sid in p['imageSlots'])
assert set(used)==set(slots) and all(x==1 for x in used.values())
ids=[];ready=0
for s in slots.values():
 if s['selected'] is not None:
  chosen=next(c for c in s['candidates'] if c['id']==s['selected'])
  assert chosen['file'] and chosen['sha256']==s['selectionEvidence']['candidateSha256']
  evidence=b/s['selectionEvidence']['file']
  recorded=s['selectionEvidence'].get('recordedCandidateId',s['selected'])
  assert recorded==s['selected'] or Path(chosen['file']).stem==recorded
  choice=next(c for c in json.loads(evidence.read_text())['choices'] if c['slotId']==s['id'] and c['candidateId']==recorded and c['decision'].startswith('採用'))
  assert hashlib.sha256(json.dumps(choice,ensure_ascii=False,sort_keys=True).encode()).hexdigest()==s['selectionEvidence']['choiceSha256']
 assert len(s['candidates'])==4
 if s['kind']=='exact-diagram' and s['spec'] is not None:
  assert s['spec']['source'].startswith('Claude原稿/')
  assert hashlib.sha256((b/s['spec']['file']).read_bytes()).hexdigest()==s['spec']['sha256']
 for c in s['candidates']:
  ids.append(c['id'])
  if c['file']:
   assert hashlib.sha256((b/c['file']).read_bytes()).hexdigest()==c['sha256'];ready+=1
  else:assert c['sha256'] is None
assert len(ids)==len(set(ids))==m['candidateCount']==420
assert len(m['sourceBookPhotos'])==141 and len(m['sourceWorkbookPhotos'])==72
for x in m['sourceBookPhotos']+m['sourceWorkbookPhotos']:
 assert hashlib.sha256((r/x['file']).read_bytes()).hexdigest()==x['sha256']
bookpages={p for x in m['sourceBookPhotos'] for p in x['pages']};workpages={p for x in m['sourceWorkbookPhotos'] for p in x['pages']}
assert bookpages==set(range(12,294)) and workpages==set(range(2,145))
assert all(not x['contentVerified'] for x in m['sourceBookPhotos'])
print(f'枠{len(m["pages"])}ページ、21節、{m["slotCount"]}配置、{m["candidateCount"]}一意候補、原本213枚のハッシュとページ連続性、本文空欄、選定記録との一致を確認。生成済み{ready}。全編内容の正確さ検証とは別。')
