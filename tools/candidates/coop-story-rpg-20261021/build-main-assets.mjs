// Local artifact build only. No network, install, authentication or deployment.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..');
const cache=path.join(os.homedir(),'.npm/_npx'),packages=[];
for(const dir of await fs.readdir(cache)){
 const file=path.join(cache,dir,'node_modules/wrangler/package.json');
 try{packages.push({file,version:JSON.parse(await fs.readFile(file,'utf8')).version});}catch(error){if(error.code!=='ENOENT')throw error;}
}
packages.sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
if(!packages.length)throw Error('Use the existing cached build runtime; do not install implicitly');
const {build}=createRequire(packages[0].file)('esbuild');
const serverFiles=['party-core.mjs','party-store.mjs','equipment.mjs','equipment-store.mjs','invitation-store.mjs','presence-store.mjs','story-catalog.mjs','eligible-pool.mjs','word-challenges.mjs','word-grader.mjs','battle-core.mjs','battle-store.mjs','quiz-service.mjs','battle-service.mjs','route.mjs','owned-word-reader.mjs','invalidation-hub.mjs','invalidation-do.mjs','resume-store.mjs','progress-store.mjs','history-store.mjs','room-management.mjs','worker-adapter.mjs'];
const fingerprint=bytes=>createHash('sha256').update(bytes).digest('hex');
const inputs={},outputs={},serverDir=path.join(root,'cf-worker/src/coop-story');
const sourceNames=[...new Set([...serverFiles,'app-entry.js','view.css','game-controller.mjs','client-actions.mjs','view.mjs','view-dom.mjs','live-refresh.mjs','build-main-assets.mjs'])];
for(const name of sourceNames)inputs[name]=fingerprint(await fs.readFile(path.join(here,name)));
let previous={outputsSha256:{}};try{previous=JSON.parse(await fs.readFile(path.join(here,'main-build.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
async function writeArtifact(target,bytes){
 const relative=path.relative(root,target),next=fingerprint(bytes);
 try{const old=fingerprint(await fs.readFile(target));if(old!==next&&previous.outputsSha256[relative]!==old)throw Error('Unreviewed existing artifact changed: '+relative);}catch(error){if(error.code!=='ENOENT')throw error;}
 await fs.writeFile(target,bytes);outputs[relative]=next;
}
await fs.mkdir(serverDir,{recursive:true});
for(const name of serverFiles){const bytes=await fs.readFile(path.join(here,name));if(fingerprint(bytes)!==inputs[name])throw Error('Source drift before copy');await writeArtifact(path.join(serverDir,name),bytes);}
const compiled=await build({entryPoints:[path.join(here,'game-controller.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:['es2022'],minify:false,legalComments:'inline'});
const target=path.join(root,'site-assets/coop-story-client.mjs');await writeArtifact(target,compiled.outputFiles[0].contents);
for(const [name,dest]of [['app-entry.js','coop-story-entry.js'],['view.css','coop-story.css']])await writeArtifact(path.join(root,'site-assets',dest),await fs.readFile(path.join(here,name)));
for(const name of sourceNames)if(fingerprint(await fs.readFile(path.join(here,name)))!==inputs[name])throw Error('Source drift during build');
await fs.writeFile(path.join(here,'main-build.json'),JSON.stringify({runtime:packages[0].version,inputsSha256:inputs,outputsSha256:outputs,serverCopiesExact:true,mainMounted:false,deployed:false},null,2)+'\n');
console.log('Built local cooperation artifacts with exact server-copy hashes; main mounting and verification are separate.');
