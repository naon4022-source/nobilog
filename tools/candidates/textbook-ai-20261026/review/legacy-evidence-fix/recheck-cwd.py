from pathlib import Path
import subprocess,os,json,hashlib

ROOT=Path(__file__).resolve().parents[5]
HERE=Path(__file__).resolve().parent
report=json.loads((HERE.parent/'post-client-full-attempt1.json').read_text())
names=report['observedWorkingDirectoryFailures']
assert len(names)==11 and len(set(names))==11
lines=(ROOT/'.claude/verify/run.sh').read_text().splitlines()
results=[]
for name in names:
    matches=[line for line in lines if '/textbook-ai-20261026/review/'+name+'"' in line]
    assert len(matches)==1 and matches[0].startswith('(cd "$PROJECT_DIR" && node ')
    command=matches[0].removesuffix(' || fail=1')
    process=subprocess.run(['bash','-c',command],cwd=ROOT/'.claude/verify',env={**os.environ,'PROJECT_DIR':str(ROOT),'VERIFY_DIR':str(ROOT/'.claude/verify')},capture_output=True,text=True)
    log=HERE/('cwd-after-fix-'+name+'.log')
    log.write_text(process.stdout+process.stderr)
    results.append({'name':name,'exitCode':process.returncode,'invocation':matches[0],'log':str(log.relative_to(ROOT)),'sha256':hashlib.sha256(log.read_bytes()).hexdigest()})
    print(name+': '+str(process.returncode),flush=True)
(HERE/'cwd-recheck-result.json').write_text(json.dumps({'status':'passed' if all(r['exitCode']==0 for r in results) else 'failed','checks':len(results),'results':results,'scope':'Exactly the11 cwd-failing suites invoked through their actual corrected runner command from the original verification directory. Old assertions retained. Does not claim full-suite success.'},indent=2)+'\n')
raise SystemExit(0 if all(r['exitCode']==0 for r in results) else 1)
