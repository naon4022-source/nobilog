# -*- coding: utf-8 -*-
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
H=Path(__file__).resolve().parent;R=H.parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((H/'preparation.json').read_text())
for info in old['targets'].values():
 assert sha(R/info['base'])==info['baseSha256'],'Existing application changed; inspect ownership before proceeding'
old['status']='superseded: latest user requires the existing application code untouched; do not apply inline candidates'
old['supersededBy']='layer-preparation.json'
(H/'preparation.json').write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
files=['oauth-form-body.mjs','rate-policy.mjs','security-gateway.mjs','security-rate-do.mjs','attach-gateway.mjs','main-entry.mjs','public-entry.mjs','fixture-worker.mjs','verify-gateway.mjs','verify-rpc.mjs']
report={'at':datetime.now(timezone.utc).isoformat(),'status':'dedicated front layer prepared; checks pending','existingApplicationInputs':{v['base']:v['baseSha256'] for v in old['targets'].values()},'files':{n:sha(H/n) for n in files},'applicationCodeChanged':False,'configurationChanged':False,'deployed':False,'realUserData':False,'testsRun':False,'preFull':{'execSession':56548,'log':'/tmp/nobi-security-before-20261022.log','terminalKnown':False},'resumeOriginalWorkAfterSecurityChecks':True}
(H/'layer-preparation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Dedicated layer prepared; both original Worker hashes still match. Inline candidates superseded.')
