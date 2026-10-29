# -*- coding: utf-8 -*-
"""Build exact, separate candidates; never write the current Worker inputs."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
H=Path(__file__).resolve().parent;R=H.parents[2]
helper=(H/'oauth-form-body.mjs').read_text()
assert helper.count('export async function ')==1
inline=helper.replace('export async function ','async function ',1)
old='  const data = request.method === "POST" ? new URLSearchParams(await request.text()) : new URL(request.url).searchParams;'
new='''  let data;
  try {
    data = request.method === "POST" ? await readBoundedOAuthForm(request) : new URL(request.url).searchParams;
  } catch (error) {
    return json({error:"invalid oauth body"}, [400,408,413,415].includes(error.oauthBodyStatus) ? error.oauthBodyStatus : 400);
  }'''
sha=lambda raw:hashlib.sha256(raw).hexdigest()
targets={'main-worker.js':'cf-worker/src/index.js','public-worker.js':'tools/releases/google-entry-20261021/nobilog-board/src/index.js'}
report={'at':datetime.now(timezone.utc).isoformat(),'status':'prepared, not tested or applied','helperSha256':sha(helper.encode()),'targets':{},'mainApplied':False,'publicBaseApplied':False,'deployed':False}
marker='async function oauthCallback(request, env, provider) {'
for output,name in targets.items():
 original=(R/name).read_text()
 assert original.count(old)==1 and original.count(marker)==1
 assert 'function readBoundedOAuthForm' not in original
 changed=original.replace(marker,inline+'\n'+marker,1).replace(old,new,1)
 assert changed.replace(inline+'\n','',1).replace(new,old,1)==original
 (H/output).write_text(changed)
 report['targets'][output]={'base':name,'baseSha256':sha(original.encode()),'candidateSha256':sha(changed.encode()),'onlyOAuthFormAndHelperChanged':True}
(H/'preparation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Prepared two separate OAuth form candidates; original Worker files were not changed.')
