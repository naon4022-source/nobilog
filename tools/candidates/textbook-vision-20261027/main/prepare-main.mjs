// Prepare reviewable outputs only. This script never writes app source files.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../../',import.meta.url),here=new URL('./',import.meta.url),candidate=new URL('../',here),sha=x=>createHash('sha256').update(x).digest('hex');
const read=async p=>readFile(new URL(p,root),'utf8');
const write=async(p,value)=>{const u=new URL(p,here);await mkdir(new URL('./',u),{recursive:true});await writeFile(u,value);};
const stage=JSON.parse(await readFile(new URL('media-stage-result.json',candidate),'utf8'));
if(stage.status!=='passed'||stage.checks!==4624)throw Error('candidate_not_verified');
for(const r of stage.frozenInputs)if(sha(await readFile(new URL(r.file,root)))!==r.sha256)throw Error('candidate_changed');
const rows=[],newFiles=[];
async function edit(file,changes){
 const before=await read(file);let after=before;
 for(const {before:a,after:b}of changes){if(!a||after.split(a).length!==2)throw Error('nonunique_main_edit:'+file);after=after.replace(a,b);}
 await write('before/'+file,before);await write('output/'+file,after);
 rows.push({file,beforeFile:'tools/candidates/textbook-vision-20261027/main/before/'+file,beforeSha256:sha(before),candidateFile:'tools/candidates/textbook-vision-20261027/main/output/'+file,afterSha256:sha(after),edits:changes});
}
async function add(file,source,transform=x=>x){
 try{await readFile(new URL(file,root));throw Error('main_file_already_exists:'+file);}catch(e){if(e.code!=='ENOENT')throw e;}
 const bytes=transform(await readFile(new URL(source,candidate),'utf8'));await write('output/'+file,bytes);
 newFiles.push({file,candidateFile:'tools/candidates/textbook-vision-20261027/main/output/'+file,sha256:sha(bytes),sourceFile:'tools/candidates/textbook-vision-20261027/'+source});
}
const server=['input','transport','operation','images-route','service','context','route','media-context','media-manifest','context-reader','context-route'].map(s=>'textbook-vision-'+s+'.mjs');
for(const name of server)await add('cf-worker/src/'+name,name,s=>s.replaceAll("from '../../../cf-worker/src/","from './"));
for(const name of ['textbook-vision-model.js','textbook-vision-capture.js','textbook-vision-api.js','textbook-vision-media-browser.mjs','textbook-vision-media-context.mjs','textbook-vision-media-dom.mjs','textbook-vision-media-manifest.mjs'])await add('site-assets/'+name,name);
await add('site-assets/textbook-vision-panel.js','ui-candidate/textbook-ai.js');
await add('site-assets/textbook-vision.css','ui-candidate/textbook-vision.css');
for(const book of ['math1','kokugo1','english1','science1','geography','history'])await add('site-assets/textbook-ai-media-context-'+book+'.json','media-contexts/textbook-ai-media-context-'+book+'.json');
const boot='// Deferred after the original textbook API and the vision components.\n(function(root){\n\'use strict\';\nif(root.nobiTextbookAIAPI&&root.NobiTextbookVisionAPI&&typeof root.textbookAIRequest===\'function\'){root.nobiTextbookAIAPI=root.NobiTextbookVisionAPI.extend(root.nobiTextbookAIAPI,root.textbookAIRequest);}\n})(globalThis);\n';
await write('output/site-assets/textbook-vision-boot.js',boot);newFiles.push({file:'site-assets/textbook-vision-boot.js',candidateFile:'tools/candidates/textbook-vision-20261027/main/output/site-assets/textbook-vision-boot.js',sha256:sha(boot),sourceFile:'tools/candidates/textbook-vision-20261027/main/prepare-main.mjs'});
const tag='    <script src="/textbook-ai.js" defer></script>';
await edit('index.html',[{before:tag,after:tag+'\n    <link rel="stylesheet" href="/textbook-vision.css">\n'+['model','capture','api','panel','boot'].map(n=>'    <script src="/textbook-vision-'+n+'.js" defer></script>').join('\n')+'\n    <script type="module" src="/textbook-vision-media-browser.mjs"></script>'}]);
const route="    if(path==='/textbook-ai-chat'){";
const routes="    if(path==='/textbook-ai-vision-context'){\n      const {textbookVisionContextRoute}=await import('./textbook-vision-context-route.mjs');\n      return scopedApiResponse(await textbookVisionContextRoute(request,env,session,{owner:await opaqueKey(session.token)}),env);\n    }\n    if(path==='/textbook-ai/images'||path==='/textbook-ai/image'){\n      const {textbookVisionImagesRoute}=await import('./textbook-vision-images-route.mjs');\n      return scopedApiResponse(await textbookVisionImagesRoute(request,env,session,{owner:await opaqueKey(session.token)}),env);\n    }\n    if(path==='/textbook-ai-vision'){\n      const {textbookVisionAIRoute}=await import('./textbook-vision-route.mjs');\n      return scopedApiResponse(await textbookVisionAIRoute(request,env,session,{owner:await opaqueKey(session.token),fetcher:fetch}),env);\n    }\n";
await edit('cf-worker/src/index.js',[{before:route,after:routes+route}]);
const copy="    for name in ['textbook-annotations.mjs',";
await edit('preview/build.py',[{before:copy,after:'    for name in '+JSON.stringify(server)+":\n        shutil.copyfile(ROOT / 'cf-worker/src' / name, DEST / name)\n"+copy}]);
await edit('site-assets/sw.js',[{before:'textbook-(?:annotations|ink|ai-context|ai-chat)',after:'textbook-(?:annotations|ink|ai-context|ai-chat|ai-vision(?:-context)?|ai)'}]);
const run='node "$PROJECT_DIR/tools/candidates/textbook-ai-20261025/verify-contexts.mjs" || fail=1';
await edit('.claude/verify/run.sh',[{before:run,after:run+'\nnode "$PROJECT_DIR/tools/candidates/textbook-vision-20261027/main/verify-main-source.mjs" || fail=1\nnode "$PROJECT_DIR/tools/candidates/textbook-vision-20261027/main/verify-main-book.mjs" || fail=1'}]);
const helper='tools/candidates/textbook-ai-20261026/review/practice-source.cjs';
await edit(helper,[{before:'const {checkExpansionSource,expansionDependencyFiles}=require(expansionHelper);',after:"const {checkExpansionSource,expansionDependencyFiles}=require('../../textbook-vision-20261027/main/check-expansion.cjs');"}]);
await write('prepared.json',JSON.stringify({status:'prepared only; not main integration',existing:rows,newFiles,candidateStageSha256:sha(await readFile(new URL('media-stage-result.json',candidate))),scope:'Original text panel, context catalog and marker IDs retained. New panel is a separate script. Fixed public catalogs; same private-owner routing. No activation/publication, no user data.'},null,2)+'\n');
console.log('Prepared '+rows.length+' exact existing-file edits and '+newFiles.length+' new files; app source untouched.');
