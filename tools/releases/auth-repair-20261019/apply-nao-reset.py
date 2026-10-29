"""Apply the explicitly authorized Google reset without reading any identity/session values."""
from pathlib import Path
import subprocess,json,sys,hashlib,datetime
R=Path(__file__).resolve().parent
# Require the scoped repair to be the public frontend before touching its auth records.
check=subprocess.run([sys.executable,str(R/'verify-public.py'),'--static-only','--attempts','3'],capture_output=True)
if check.returncode:raise SystemExit('公開先の修正候補一致を確認できません。連携解除は実行していません。')
sql=R/'reset-nao-google.sql'
cmd=['npx','--yes','wrangler@latest','d1','execute','d3345327-f92c-4c72-b35c-671e84365e6a','--remote','--file',str(sql),'--json','--yes','--config',str(R/'candidate/cf-worker/wrangler.jsonc')]
run=subprocess.run(cmd,capture_output=True,text=True)
if run.returncode:raise SystemExit('連携解除コマンドが正常完了しませんでした。応答は秘密保全のため表示していません。再試行前に状態を確認してください。')
try:data=json.loads(run.stdout)
except Exception:raise SystemExit('解除結果の形式を確認できません。実行状態は未確定です。')
if not isinstance(data,list) or not data or not all(x.get('success') is True for x in data):raise SystemExit('解除結果を安全に確認できません。状態は未確定です。')
receipt={'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'success':True,'sqlSha256':hashlib.sha256(sql.read_bytes()).hexdigest(),'statementsReported':len(data),'authValuesRead':False,'learningDataChanged':False,'scope':'Nao Google binding and existing Google sessions; pending Nao proof invalidated; active lease released'}
(R/'reset-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('なおのGoogle連携解除コマンドが正常完了しました。学習記録の読み出し・変更は行っていません。')
