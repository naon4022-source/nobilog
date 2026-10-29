// Reuse a completed full run only for the exact unchanged public candidate and test entry points.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),project=new URL('../../../',root),hash=b=>createHash('sha256').update(b).digest('hex');
const proofUrl=new URL('full-verification.json',root);
async function inputs(){
 const files=['.claude/verify/run.sh'];
 for(const prefix of ['tools/releases/souta-20261018/baseline/pages/','tools/releases/souta-20261018/candidate/pages/','tools/releases/souta-20261018/candidate/cf-worker/']){
  async function visit(relative){for(const e of await readdir(new URL(relative,project),{withFileTypes:true})){if(e.name.startsWith('.')||e.name==='node_modules')continue;const p=relative+e.name;if(e.isDirectory())await visit(p+'/');else files.push(p);}}
  await visit(prefix);
 }
 for(const file of ['verify.mjs','verify-browser.mjs','verify-login-flow.mjs','verify-preservation.mjs','verify-deploy.py','changes.json','baseline-sha.json','candidate/deploy.sh','check-published-baseline.py','verify-public.py','full-proof.mjs'])files.push('tools/releases/souta-20261018/'+file);
 const result={};for(const name of files.sort())result[name]=hash(await readFile(new URL(name,project)));
 return result;
}
if(process.argv[2]==='--record'){
 assert.equal(process.argv[4],'--exit-code');assert.equal(process.argv[5],'0','only an observed successful process can be recorded');
 const log=process.argv[3],bytes=await readFile(log),text=bytes.toString();
 assert.ok(text.trimEnd().endsWith('✅ ぜんぶ通過'),'full suite success terminator required');
 for(const file of ['isolated-result.json','preservation-result.json','browser-result.json','login-flow-result.json','deploy-test-result.json'])assert.equal(JSON.parse(await readFile(new URL(file,root),'utf8')).passed,true,file);
 await writeFile(proofUrl,JSON.stringify({exitCode:0,finishedAt:Date.now(),log,logSha:hash(bytes),inputs:await inputs()},null,2)+'\n');
 console.log('Full verification recorded for exact public candidate; no secret values');
}else{
 try{
  const proof=JSON.parse(await readFile(proofUrl,'utf8'));
  assert.equal(proof.exitCode,0);assert.ok(Date.now()-proof.finishedAt>=0&&Date.now()-proof.finishedAt<3600000,'verification expires after one hour');
  assert.equal(hash(await readFile(proof.log)),proof.logSha,'completed full log unchanged');
  assert.deepEqual(await inputs(),proof.inputs,'all candidate files and release verification entry points unchanged');
  console.log('Completed full verification matches exact candidate SHA; duplicate full execution skipped');
 }catch{console.error('No fresh unchanged full verification proof; full run required');process.exitCode=1;}
}
