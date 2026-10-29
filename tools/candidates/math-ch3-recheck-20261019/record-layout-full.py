"""Record the observed successful full run; never mark unrelated manual/source checks complete."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[3];H=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
log=Path('/tmp/nobi-auth-repair-after-20261019.log');assert log.read_text().rstrip().endswith('✅ ぜんぶ通過')
record={'date':'2026-10-19','session':23747,'observedExitCode':0,'status':'passed','log':str(log),'logSha256':sha(log),'bookSha256':sha(R/'site-assets/textbook-book-math1.json'),'evidenceSha256':sha(H/'current-evidence.json'),'scope':'3章FIG01配置移動・マーカー互換維持後の指定全体検証。実PIN/実端末/原資料全文照合の完了は意味しない。'}
proof=H/'post-layout-full-verification.json';proof.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
value={**record,'exitCode':0,'proof':str(proof.relative_to(R))}
W=R/'教材整理/Claude_Codex共有/数学全体制作';S=W/'メディア/制作ソース';counts={}
for p in [W/'制作台帳.json',S/'依頼台帳_1件ずつ.json',S/'69本_制作進捗.json',H/'layout-integration.json']:
 d=json.loads(p.read_text());count=[0]
 def walk(x):
  if isinstance(x,dict):
   for k,v in list(x.items()):
    if k=='fullSuite' and v in ['pending after figure relocation','pending after layout move']:
     x[k]=value;count[0]+=1
    elif isinstance(v,(dict,list)):walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
 walk(d)
 if count[0]:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 counts[p.name]=count[0]
print('Only pending layout full-suite status updated:',counts,'; source-photo/listening/device flags unchanged')
