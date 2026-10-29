// Current exact reader is validated first; historical UI assertions execute unchanged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),{createRequire}=require('node:module');
const ROOT=path.resolve(__dirname,'../../../../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ORIGINAL='tools/candidates/textbook-ai-20261026/review/legacy-evidence-fix/checked-basic-ui.cjs';
const ARCHIVE='tools/candidates/basic-ui-reader-compat-20261029/checked-basic-ui.original.cjs';
const READER='site-assets/textbook-book.js',BEFORE='tools/candidates/textbook-final-20261023/remaining-alignment-20261028/answer-safe-v2/main/before-compat/site-assets/textbook-book.js';
function checkBasicUI(){
 const requireOriginal=createRequire(path.join(ROOT,ORIGINAL));
 const current=require(path.join(ROOT,'tools/candidates/textbook-vision-20261027/main/checked-source.cjs'));
 current.checkMainSource(ROOT,{assets:false});
 const actual=fs.readFileSync(path.join(ROOT,READER)),previous=fs.readFileSync(path.join(ROOT,BEFORE)),source=fs.readFileSync(path.join(ROOT,ARCHIVE));
 if(sha(actual)!=='356583f3f3be75d3cca4bb4b28c2b8cc3c9c1ccd8c0d44b5503f06878d50d745'||sha(previous)!=='074e74171666d5e24eeefd05ea8adcb7c914a9670511d51a3abe6a95390c32d1')throw Error('basic UI current/previous reader drift');
 const line="  if(e.target.closest?.('.tb-bar-actions'))return;\n";
 if(previous.toString().split("  if(!isFull())return;\n").length!==2||previous.toString().replace("  if(!isFull())return;\n","  if(!isFull())return;\n"+line)!==actual.toString())throw Error('basic UI unrelated reader edit');
 if(sha(source)!=='b771938dc0084e8b8ebb1dd7e27c3fcb812f4ee2a70987a85cfaac247a8e6ebf')throw Error('basic UI original assertion drift');
 const view=Object.freeze({...fs,readFileSync(file,options){if(path.resolve(file)!==path.join(ROOT,READER))return fs.readFileSync(file,options);const encoding=typeof options==='string'?options:options?.encoding;return encoding?previous.toString(encoding):Buffer.from(previous);}});
 const module={exports:{}},trustedRequire=name=>{if(name==='node:fs')return view;if(['node:path','node:crypto'].includes(name))return require(name);if(name==='../client-source.cjs')return requireOriginal(name);throw Error('unexpected original basic UI dependency');};
 vm.runInNewContext(source.toString(),{module,exports:module.exports,require:trustedRequire,__dirname:path.dirname(path.join(ROOT,ORIGINAL)),Buffer,process},{filename:ORIGINAL,timeout:1000});
 return module.exports.checkBasicUI();
}
module.exports={checkBasicUI};
if(require.main===module){const file=process.argv[2],map=checkBasicUI();if(!map.has(file))throw Error('basic UI source outside whitelist');console.log(map.get(file));}
