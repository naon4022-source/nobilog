// Run the future exact guard against an in-memory current-file overlay, without editing frozen main inputs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..');
const rel='tools/candidates/review-practice-choice-order-20261029/main/';
const spec=JSON.parse(fs.readFileSync(path.join(root,rel+'prepared.json'))),overlay=new Map();
for(const row of spec.files)overlay.set(row.file,fs.readFileSync(path.join(root,row.candidateFile)));
function guard(extra=new Map()){
 const view={...fs,readFileSync(file,options){const f=path.relative(root,path.resolve(file)),bytes=extra.get(f)||overlay.get(f);if(!bytes)return fs.readFileSync(file,options);const enc=typeof options==='string'?options:options?.encoding;return enc?bytes.toString(enc):Buffer.from(bytes);}};
 const module={exports:{}},requireView=name=>name==='node:fs'?view:require(name);
 vm.runInNewContext(fs.readFileSync(path.join(root,rel+'checked-successor.cjs'),'utf8'),{module,exports:module.exports,require:requireView,__dirname:path.join(root,rel),Buffer},{timeout:1000});
 return module.exports;
}
let checks=0;
assert.equal(guard().checkMainSource(root,{assets:process.argv.includes('--assets')}).size,28);checks++;
const dependencies=guard().mainDependencyFiles(root);
fs.writeFileSync(path.join(root,rel+'candidate-dependencies.json'),JSON.stringify(dependencies,null,2)+'\n');
for(const row of spec.files)for(const f of [row.file,row.beforeFile,row.candidateFile]){assert(dependencies.includes(f),f);checks++;}
for(const f of [rel+'checked-successor.cjs',rel+'verify-main-integration.mjs',rel+'predecessor-view.mjs',rel+'verify-main-library.mjs',rel+'preparation.json']){assert(dependencies.includes(f));checks++;}
for(const f of ['cf-worker/src/ai-review-practice-data.mjs','site-assets/textbook-book-kokugo1.json','site-assets/textbook-book-english1.json','site-assets/textbook-book.js',spec.historicalGuard]){
 assert.throws(()=>guard(new Map([[f,Buffer.from('tampered')]])).checkMainSource(root,{assets:false}),/drift/);checks++;
}
for(const f of [rel+'prepared.json',rel+'predecessor-view.mjs',spec.files[0].beforeFile,spec.files[0].candidateFile]){
 assert.throws(()=>guard(new Map([[f,Buffer.from('tampered')]])).checkMainSource(root,{assets:false}),/drift/);checks++;
}
fs.writeFileSync(path.join(root,rel+'candidate-guard-result.json'),JSON.stringify({status:'passed',checks,dependencyCount:dependencies.length,scope:'Future exact4-file AI96 guard in memory; actual main not modified. Current AI96 data, both books, toolbar, prior guard, source/backup/spec/helper tamper rejection. Historical predecessor guard executed unchanged.'},null,2)+'\n');
console.log('Successor guard candidate: '+checks+' checks passed.');
