// Run the byte-identical original expansion verifier in a private filesystem
// view. No global fs monkeypatch, receipt rewrite, test-data change or skip.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {checkMainSource,mainDependencyFiles}=require('./checked-source.cjs');
const ROOT=path.resolve(__dirname,'../../../..'),ORIGINAL='tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/checked-source.cjs';
const SHA='f212e47e3dd56ff90a5490d0ee91a85fbd5786bc59ff17b5745a631ab6a853e7';
function originalVerifier(root){
 const before=checkMainSource(root,{assets:false}),source=fs.readFileSync(path.join(root,ORIGINAL),'utf8');
 if(crypto.createHash('sha256').update(source).digest('hex')!==SHA)throw Error('original expansion verifier changed');
 const view=Object.freeze({...fs,readFileSync(file,options){
  const relative=path.relative(root,path.resolve(file)),bytes=before.get(relative);
  if(!bytes)return fs.readFileSync(file,options);
  const encoding=typeof options==='string'?options:options?.encoding;return encoding?bytes.toString(encoding):Buffer.from(bytes);
 }}),module={exports:{}};
 const trustedRequire=name=>{if(name==='node:fs')return view;if(['node:path','node:crypto'].includes(name))return require(name);throw Error('unexpected historical verifier dependency');};
 vm.runInNewContext(source,{module,exports:module.exports,require:trustedRequire,__dirname:path.dirname(path.join(root,ORIGINAL)),Buffer},{filename:ORIGINAL,timeout:1000});
 return {original:module.exports,before};
}
function checkExpansionSource(root=ROOT){const {original,before}=originalVerifier(root);return new Map([...before,...original.checkExpansionSource(root)]);}
function expansionDependencyFiles(root=ROOT){const {original}=originalVerifier(root);return [...new Set([...original.expansionDependencyFiles(root),ORIGINAL,...mainDependencyFiles(root)])];}
module.exports={checkExpansionSource,expansionDependencyFiles};
