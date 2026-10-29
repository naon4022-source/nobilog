"""Exercise the exact deploy wrapper with fake CLIs; never run network commands."""
from pathlib import Path
import json, os, subprocess, tempfile

ROOT=Path(__file__).resolve().parent
SCRIPT=ROOT/'candidate/cf-worker/deploy-secure.sh'
with tempfile.TemporaryDirectory(prefix='nobi-souta-deploy-') as folder:
    tmp=Path(folder)
    def executable(name, text):
        p=tmp/name
        p.write_text('#!/bin/bash\nset -eu\n'+text)
        p.chmod(0o700)
    executable('node', 'exit 0\n')
    executable('git', 'exit 0\n')
    executable('npx', '''
case "$*" in
 *"secret list"*)
  if [ "$NOBI_CASE" = missing_secret ]; then echo '[]'; else
   for name in PIN_PEPPER LEGACY_NAO_PIN_HASH LEGACY_RIRAN_PIN_HASH LEGACY_SOUTA_PIN_HASH TURNSTILE_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET LINE_CLIENT_ID LINE_CLIENT_SECRET; do echo "{\\"name\\": \\"$name\\"}"; done
  fi;;
 *"--dry-run"*) echo dry-run >> "$NOBI_ACTIONS";;
 *"pages deploy"*) echo pages >> "$NOBI_ACTIONS";case "$NOBI_CASE" in response_lost|pages_failed|unknown)exit 1;;esac;;
 *"deploy --config"*) echo rollback >> "$NOBI_ACTIONS";;
 *" deploy") echo worker >> "$NOBI_ACTIONS";[ "$NOBI_CASE" != worker_failed ];;
 *) exit 97;;
esac
''')
    executable('python3', '''
case "$1" in
 *check-published-baseline.py)
  if [ -f "$NOBI_BASE_CHECKED" ]; then [ "$NOBI_CASE" = pages_failed ];else touch "$NOBI_BASE_CHECKED";[ "$NOBI_CASE" != baseline_changed ];fi;;
 *verify-public.py)
  if [ "${2:-}" = --static-only ];then [ "$NOBI_CASE" = response_lost ];else exit 0;fi;;
 *)exit 98;;
esac
''')
    cases={
        'success':(0,['dry-run','worker','pages']),
        'response_lost':(0,['dry-run','worker','pages']),
        'pages_failed':(1,['dry-run','worker','pages','rollback']),
        'unknown':(1,['dry-run','worker','pages']),
        'missing_secret':(1,['dry-run']),
        'baseline_changed':(1,['dry-run']),
        'worker_failed':(1,['dry-run','worker']),
    }
    checks=0
    for case,(code,expected) in cases.items():
        actions=tmp/(case+'.actions')
        result=subprocess.run(['bash',str(SCRIPT)],env={**os.environ,'PATH':str(tmp)+':'+os.environ['PATH'],'NOBI_CASE':case,'NOBI_ACTIONS':str(actions),'NOBI_BASE_CHECKED':str(tmp/(case+'.baseline'))},capture_output=True,text=True,encoding='utf-8',errors='replace')
        actual=actions.read_text().splitlines() if actions.exists() else []
        assert result.returncode==code,(case,result.returncode,result.stdout,result.stderr)
        assert actual==expected,(case,actual,expected)
        checks+=2
    (ROOT/'deploy-test-result.json').write_text(json.dumps({'checks':checks,'passed':True,'cases':list(cases),'realDeployments':0,'networkCalls':0},indent=2)+'\n')
    print('Deploy wrapper:',checks,'checks passed; exact Worker→Pages ordering, response loss, safe rollback, unknown state, secret/origin guards; fake CLIs only')
