const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),base='tools/candidates/textbook-ai-20261025/service-20261025/';
const {clientBeforeSource}=require('../client-source.cjs');
function checkBasicUI(){
 const read=f=>fs.readFileSync(path.join(ROOT,f)),receipt=JSON.parse(read(base+'ui-main/integration.json')),map=new Map();
 if(JSON.stringify(receipt.files.map(r=>r.file).sort())!==JSON.stringify(['index.html','site-assets/textbook-annotations.js']))throw Error('basic UI whitelist');
 for(const row of receipt.files){if(row.beforeFile!==base+'ui-main/before/'+row.file)throw Error('basic UI backup path');const before=read(row.beforeFile).toString(),current=clientBeforeSource(row.file);if(sha(before)!==row.beforeSha256||sha(current)!==row.afterSha256)throw Error('basic UI source drift');let expected=before;for(const edit of row.edits){if(!edit.before||expected.split(edit.before).length!==2)throw Error('basic UI unique delta');expected=expected.replace(edit.before,edit.after);}if(expected!==current)throw Error('basic UI unrelated source change');map.set(row.file,row.beforeFile);}
 const names=['site-assets/textbook-ai-model.js','site-assets/textbook-ai.css','site-assets/textbook-ai.js'];if(JSON.stringify(receipt.newFiles.map(r=>r.file).sort())!==JSON.stringify(names.sort()))throw Error('basic UI asset whitelist');for(const row of receipt.newFiles)if(sha(read(row.file))!==row.sha256||sha(read(row.candidate))!==row.sha256)throw Error('basic UI asset drift');
 if(receipt.uiResult!==base+'ui-book-result.json'||receipt.modelResult!==base+'ui-model-result.json')throw Error('basic UI proof paths');
 const browser=JSON.parse(read(receipt.uiResult)),model=JSON.parse(read(receipt.modelResult));if(browser.status!=='passed'||browser.checks<84||browser.posts!==6||browser.generations!==6||model.status!=='passed'||model.checks!==31)throw Error('basic UI proof incomplete');for(const [name,hash]of Object.entries(browser.inputs))if(sha(read('site-assets/'+name))!==hash)throw Error('basic UI proof source drift');
 const visual=JSON.parse(read(base+'ui-main/visual-review.json'));if(visual.status!=='reviewed'||visual.files.length!==6)throw Error('basic UI visual proof');for(const row of visual.files)if(sha(read(row.file))!==row.sha256)throw Error('basic UI visual drift');
 return map;
}
module.exports={checkBasicUI};
if(require.main===module){const file=process.argv[2],map=checkBasicUI();if(!map.has(file))throw Error('basic UI source outside whitelist');console.log(map.get(file));}
