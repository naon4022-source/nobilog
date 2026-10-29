const fs=require('node:fs'),path=require('node:path');
function update(source){
 if(source.includes('function checkRubricLength('))throw Error('Length rules already installed; review before applying');
 let helper=fs.readFileSync(path.join(__dirname,'rubric-length.cjs'),'utf8');
 helper=helper.slice(helper.indexOf('function valid('),helper.indexOf('module.exports='))
  .replace('function valid(', 'function rubricLengthValid(').replace('function check(', 'function checkRubricLength(').replace('!valid(a)','!rubricLengthValid(a)');
 const apply=(old,next)=>{if(source.split(old).length!==2)throw Error('Engine changed; no automatic overwrite');source=source.replace(old,next);};
 apply('function result(correct,ratio,reason)',helper+'\nfunction result(correct,ratio,reason)');
 apply(" if(a.kind==='rubric'){\n  if(text(raw)"," if(a.kind==='rubric'){\n  const lengthResult=checkRubricLength(question,input);if(lengthResult)return lengthResult;\n  if(text(raw)");
 apply(' const a=q.answer||{};\n'," const a=q.answer||{};\n if(a.kind==='rubric'&&!rubricLengthValid(a))errors.push('rubric length');\n");
 return source;
}
module.exports={update};
