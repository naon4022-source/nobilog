from pathlib import Path
import hashlib,json
base=Path(__file__).resolve().parent
root=base.parents[2]
p=root/'cf-worker/src/ai-trial-control.mjs'
s=p.read_text()
patches=[
 ("export async function runRealAITrial(db, work, now = Date.now()) {", "export function runRealAITrial(db,work,now=Date.now()){return runBoundedTrial(db,work,now,12000);}\nexport function runAvatarAITrial(db,work,now=Date.now()){return runBoundedTrial(db,work,now,60000);}\nasync function runBoundedTrial(db, work, now, timeoutMs) {"),
 ("now+60000,now).first('v')", "now+timeoutMs+48000,now).first('v')"),
 ("const remaining=12000-(performance.now()-started);", "const remaining=timeoutMs-(performance.now()-started);")
]
for old,new in patches:
 assert s.count(old)==1,'trial anchor changed'
 s=s.replace(old,new)
(base/'trial-control.mjs').write_text(s)
(base/'trial-patches.json').write_text(json.dumps({'sourceSHA':hashlib.sha256(p.read_bytes()).hexdigest(),'patches':[{'old':a,'new':b} for a,b in patches]},indent=2)+'\n')
print('Prepared shared trial candidate; runtime untouched')
