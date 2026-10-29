// New preview-only signing key: never written to files or printed.
import { generateKeyPairSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const cwd=import.meta.dirname,config=JSON.parse(readFileSync(resolve(cwd,'wrangler.jsonc'),'utf8'));
if(config.name!=='nobilog-preview')throw new Error('Preview only');
const names=spawnSync('npx',['--yes','wrangler@latest','secret','list','--config','wrangler.jsonc'],{cwd,encoding:'utf8'});
if(names.status!==0)throw new Error('Unable to check preview secret names');
const configured=JSON.parse(names.stdout).some(row=>row.name==='NOTICE_VAPID_JWK');
if(configured){console.log('Preview notification signing key already configured; kept unchanged.');}
else{
    const {privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
    const value=JSON.stringify(privateKey.export({format:'jwk'}));
    const result=spawnSync('npx',['--yes','wrangler@latest','secret','put','NOTICE_VAPID_JWK','--config','wrangler.jsonc'],{cwd,input:value,encoding:'utf8'});
    if(result.status!==0)throw new Error('Unable to configure preview notification signing key');
    console.log('Preview notification signing key configured. No secret values were printed or saved to files.');
}
