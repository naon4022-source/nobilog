from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess
H=Path(__file__).resolve().parent;R=H.parents[2]
assert subprocess.run(['pgrep','-f',r'^(/[^ ]*/)?bash .*\.claude/verify/run.sh$'],capture_output=True).returncode==1
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
previous=H/'checks/20261021T220536083919Z/failure.json';old=json.loads(previous.read_text());gateway=old['checks'][0];assert gateway['file']=='verify-gateway.mjs' and gateway['exitCode']==0 and sha(R/gateway['log'])==gateway['logSha256']
for name,digest in old['inputsBefore'].items():
 if not name.endswith('/verify-rpc.mjs'):assert sha(R/name)==digest,name
log=Path('/tmp/nobi-security-rpc-retry-20261022.log');assert '"concurrentRequests":50,"accepted":20' in log.read_text() and 'passed; production binding/deployment unverified.' in log.read_text()
current={n:sha(R/n) for n in old['inputsBefore']}
proof={'at':datetime.now(timezone.utc).isoformat(),'status':'isolated Node gateway and native local-workerd security checks passed; unapplied','checks':[gateway,{'file':'verify-rpc.mjs','ownExecSession':59298,'ownObservedExitCode':0,'log':str(log),'logSha256':sha(log),'runtime':'Miniflare 5.20261019.1-beta / local workerd'}],'inputSha256ObservedAfterNativeRun':current,'gatewayDependenciesUnchangedSincePass':True,'nativeAllInputsFrozenBeforeRun':False,'harnessConfigOnlyChangedBeforeNativeRetry':True,'previousSetupFailure':str(previous.relative_to(R)),'applicationCodeChanged':False,'configurationChanged':False,'realUserData':False,'deployed':False,'productionProtectionEnabled':False}
(H/'verification.json').write_text(json.dumps(proof,indent=2)+'\n')
p=H/'layer-preparation.json';prepared=json.loads(p.read_text());prepared['status']='isolated gateway/native checks passed; existing application/configuration untouched; not deployed';prepared['testsRun']=True;prepared['latestVerification']='verification.json';prepared['files']['verify-rpc.mjs']=sha(H/'verify-rpc.mjs');p.write_text(json.dumps(prepared,ensure_ascii=False,indent=2)+'\n')
print('Gateway pass reused only with unchanged dependencies; own native exec59298 exit0 recorded. Original setup failure preserved; no deployment.')
