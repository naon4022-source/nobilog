"""Read only the two nonprivate markers written by our operation; never read auth values."""
from pathlib import Path
import subprocess,json,datetime,hashlib
R=Path(__file__).resolve().parent
query="SELECT EXISTS(SELECT 1 FROM auth_kv WHERE k='maintenance:20261019-nao-google-reset' AND v='done') AS reset_completed, EXISTS(SELECT 1 FROM auth_kv WHERE k='google-reset:u1' AND v='1') AS fallback_revoked"
r=subprocess.run(['npx','--yes','wrangler@latest','d1','execute','d3345327-f92c-4c72-b35c-671e84365e6a','--remote','--command',query,'--json','--yes','--config',str(R/'candidate/cf-worker/wrangler.jsonc')],capture_output=True,text=True)
if r.returncode:raise SystemExit('処理済みマーカーの確認に失敗しました。認証値は取得していません。')
decoder=json.JSONDecoder();found=[]
def visit(value):
 if isinstance(value,dict):
  if set(value)=={'reset_completed','fallback_revoked'}:found.append(value)
  else:
   for item in value.values():visit(item)
 elif isinstance(value,list):
  for item in value:visit(item)
for i,c in enumerate(r.stdout):
 if c not in '[{':continue
 try:obj,_=decoder.raw_decode(r.stdout[i:]);visit(obj)
 except ValueError:pass
if not found or any(v!={'reset_completed':1,'fallback_revoked':1} for v in found):raise SystemExit('処理完了を確認できません。連携解除の再実行はしていません。')
receipt={'success':True,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sqlSha256':hashlib.sha256((R/'reset-nao-google.sql').read_bytes()).hexdigest(),'verifiedOperationMarkersOnly':True,'authValuesRead':False,'learningDataChanged':False,'note':'Initial execute response was not plain JSON. No repeat mutation; own completion/revocation markers verified.'}
(R/'reset-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('なおのGoogle連携解除と旧KV連携の失効を、処理済みマーカーだけで確認しました。解除処理の再実行・認証値や学習記録の読み出しはしていません。')
