// Run the future exact guard against an in-memory current-file overlay, without editing frozen main inputs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../../../..');
const rel='tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main/';
const spec=JSON.parse(fs.readFileSync(path.join(root,rel+'compat-spec.json'))),overlay=new Map();
for(const row of spec.files)overlay.set(row.file,fs.readFileSync(path.join(root,row.candidateFile)));
function guard(extra=new Map()){
 const view={...fs,readFileSync(file,options){const f=path.relative(root,path.resolve(file)),bytes=extra.get(f)||overlay.get(f);if(!bytes)return fs.readFileSync(file,options);const enc=typeof options==='string'?options:options?.encoding;return enc?bytes.toString(enc):Buffer.from(bytes);}};
 const module={exports:{}},requireView=name=>name==='node:fs'?view:require(name);
 vm.runInNewContext(fs.readFileSync(path.join(root,rel+'checked-successor.cjs'),'utf8'),{module,exports:module.exports,require:requireView,__dirname:path.join(root,rel),Buffer},{timeout:1000});
 return module.exports;
}
let checks=0;
assert.equal(guard().checkMainSource(root,{assets:process.argv.includes('--assets')}).size,27);checks++;
const dependencies=guard().mainDependencyFiles(root);
fs.writeFileSync(path.join(root,rel+'candidate-dependencies.json'),JSON.stringify(dependencies,null,2)+'\n');
for(const row of spec.files)for(const f of [row.file,row.beforeFile,row.candidateFile]){assert(dependencies.includes(f),f);checks++;}
for(const f of [rel+'checked-successor.cjs',rel+'verify-main-integration.mjs',rel+'legacy-view.mjs']){assert(dependencies.includes(f));checks++;}
for(const f of ['site-assets/textbook-book-kokugo1.json','site-assets/textbook-book-english1.json','site-assets/textbook-book.js',spec.historicalGuard]){
 assert.throws(()=>guard(new Map([[f,Buffer.from('tampered')]])).checkMainSource(root,{assets:false}),/drift/);checks++;
}
for(const f of [rel+'compat-spec.json',rel+'legacy-view.mjs',spec.files[0].beforeFile,spec.files[0].candidateFile]){
 assert.throws(()=>guard(new Map([[f,Buffer.from('tampered')]])).checkMainSource(root,{assets:false}),/drift/);checks++;
}
fs.writeFileSync(path.join(root,rel+'candidate-guard-result.json'),JSON.stringify({status:'passed',checks,dependencyCount:dependencies.length,scope:'Future exact67-file guard in memory; actual main not modified. Both books, toolbar, canonical guard, source/backup/spec/helper tamper rejection. Historical predecessor guard executed unchanged.'},null,2)+'\n');
console.log('Successor guard candidate: '+checks+' checks passed.');
