// Explicit opt-in for reviewed original drill tests; retain their true origin.
function update(source){
 const changes=[
  ["if(isTest&&q.origin!=='adapted')errors.push('test must be adapted');","if(isTest&&q.origin!=='adapted'&&!(unit.mode==='drill'&&unit.testPolicy==='reviewed-original'&&q.origin==='original'))errors.push('test must be adapted');"],
  ["if(!['workbook','drill'].includes(unit.mode))errors.push('mode');","if(!['workbook','drill'].includes(unit.mode))errors.push('mode');\n if(unit.testPolicy!==undefined&&(unit.mode!=='drill'||unit.testPolicy!=='reviewed-original'))errors.push('test policy');"]
 ];
 for(const [old,next] of changes){if(source.split(old).length!==2)throw Error('Engine changed; review before applying');source=source.replace(old,next);}
 return source;
}
module.exports={update};
