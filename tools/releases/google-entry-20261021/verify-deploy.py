"""Execute the real deploy wrapper against fake CLIs only."""
from pathlib import Path
import tempfile,subprocess,os,json
H=Path(__file__).resolve().parent
node='''#!/bin/bash
set -eu
if [[ "$1" != /synthetic/wrangler.js ]];then exit 0;fi
shift
if [[ "$1" == secret && "$2" == list ]];then
 echo secrets >> "$ACTIONS"
 if [[ "$CASE" == missing_secret ]];then echo '[]';exit 0;fi
 for n in PIN_PEPPER LEGACY_NAO_PIN_HASH LEGACY_RIRAN_PIN_HASH LEGACY_SOUTA_PIN_HASH TURNSTILE_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET LINE_CLIENT_ID LINE_CLIENT_SECRET;do printf '{"name": "%s"}\n' "$n";done
elif [[ "$1" == pages ]];then echo pages >> "$ACTIONS";[[ "$CASE" != pages_old && "$CASE" != pages_unknown && "$CASE" != pages_lost ]]
elif [[ " $* " == *" --dry-run "* ]];then echo dry >> "$ACTIONS";[[ "$CASE" != dry_fail ]]
elif [[ " $* " == *" --config "* ]];then echo rollback >> "$ACTIONS"
else echo worker >> "$ACTIONS";[[ "$CASE" != worker_fail ]]
fi
'''
python='''#!/bin/bash
set -eu
case "$1" in
 *full-proof.py) [[ "$CASE" != proof_fail ]];;
 *check-worker-baseline.py) echo worker_base >> "$ACTIONS";[[ "$CASE" != worker_changed ]];;
 *check-published-baseline.py)
  echo pages_base >> "$ACTIONS"
  if [[ -f "$BASE_SEEN" ]];then [[ "$CASE" == pages_old ]];else touch "$BASE_SEEN";[[ "$CASE" != pages_changed ]];fi;;
 *verify-public.py)
  echo public_check >> "$ACTIONS"
  if [[ " $* " == *" --static-only "* ]];then [[ "$CASE" == pages_lost ]];fi;;
 *) exit 1;;
esac
'''
cases={
 'ok':(0,['dry','secrets','pages_base','worker_base','worker','pages','public_check']),
 'proof_fail':(1,[]),'dry_fail':(1,['dry']),'missing_secret':(1,['dry','secrets']),
 'pages_changed':(1,['dry','secrets','pages_base']),
 'worker_changed':(1,['dry','secrets','pages_base','worker_base']),
 'worker_fail':(1,['dry','secrets','pages_base','worker_base','worker']),
 'pages_old':(1,['dry','secrets','pages_base','worker_base','worker','pages','public_check','pages_base','rollback']),
 'pages_unknown':(1,['dry','secrets','pages_base','worker_base','worker','pages','public_check','pages_base']),
 'pages_lost':(0,['dry','secrets','pages_base','worker_base','worker','pages','public_check','public_check'])}
checks=0
with tempfile.TemporaryDirectory(prefix='nobi-deploy-fake-') as tmp:
 t=Path(tmp)
 for name,source in [('node',node),('python3',python),('git','#!/bin/bash\nexit 0\n')]:p=t/name;p.write_text(source);p.chmod(0o755)
 for case,(code,expected) in cases.items():
  actions=t/(case+'.actions');env={**os.environ,'PATH':str(t)+':'+os.environ['PATH'],'NOBI_WRANGLER_CLI':'/synthetic/wrangler.js','CASE':case,'ACTIONS':str(actions),'BASE_SEEN':str(t/(case+'.seen'))}
  r=subprocess.run(['bash',str(H/'candidate/cf-worker/deploy-secure.sh')],env=env,capture_output=True,text=True,encoding='utf-8',errors='replace')
  assert (r.returncode==0)==(code==0),(case,r.returncode,r.stderr);checks+=1
  actual=actions.read_text().splitlines() if actions.exists() else [];assert actual==expected,(case,actual,expected);checks+=1
(H/'deploy-test-result.json').write_text(json.dumps({'status':'passed','checks':checks,'scope':'real wrapper/fake CLIs; no Cloudflare calls','cases':list(cases)},indent=2)+'\n')
print('Secure deploy wrapper:',checks,'checks passed; no real deployment')
