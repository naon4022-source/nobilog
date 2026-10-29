const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),engine=require(root+'/site-assets/material-engine.js');
const source='Claude作業/20261017/難しさの点検/数学1章_入試チャレンジ_試作.json',raw=fs.readFileSync(root+'/'+source,'utf8'),draft=JSON.parse(raw);
const supported=new Set(['number','numbers','exact','rubric','expr','relation','set']);
const items=draft.questions.map(q=>{
 const a=q.answer||{};let issue=null;
 if(!supported.has(a.kind))issue='answer.kind '+a.kind+' は未対応';
 else if(a.kind==='set'&&!Array.isArray(a.items))issue='集合の採点条件itemsがなく、valueだけでは登録できない。小さい順の指定にはnumbers/values/ordered:trueを使う。';
 let sample=null;
 if(!issue){const grade=engine.grade(q,a.value);sample=grade.correct;if(!sample)issue='保存された答えを現行採点が受け付けない';}
 return {id:q.id,stage:q.stage,kind:a.kind,compatible:!issue,sampleAccepted:sample,issue};
});
const bank=JSON.parse(fs.readFileSync(root+'/site-assets/material-bank.json','utf8'));
const math=bank.units.filter(u=>u.subject==='数学'&&u.mode!=='drill'&&u.bank!=='tokkun');
let total=0,membersOfGroups3=0,excessOver2=0;const examples=[];
for(const u of math){
 const groups=new Map();for(const q of u.questions||[]){total++;const signature=String(q.prompt).normalize('NFKC').replace(/\d+(?:\.\d+)?/g,'#').replace(/\s+/g,'');if(!groups.has(signature))groups.set(signature,[]);groups.get(signature).push(q);}
 for(const group of groups.values())if(group.length>=3){membersOfGroups3+=group.length;excessOver2+=group.length-2;examples.push({unit:u.id,title:u.title,count:group.length,ids:group.map(q=>q.id),sample:group[0].prompt.slice(0,160)});}
}
examples.sort((a,b)=>b.count-a.count);
const report={source,sha256:crypto.createHash('sha256').update(raw).digest('hex'),count:items.length,numericCompatible:items.filter(x=>x.compatible&&x.kind==='number').length,needsAdaptation:items.filter(x=>!x.compatible).length,items,heuristic:{unitCount:math.length,total,membersOfGroups3,excessOver2,ratio:membersOfGroups3/total,method:'単元内のpromptをNFKC正規化、数字/小数を#へ置換、空白を除去。符号・演算子・文は維持。型の近さを調べる候補抽出であり、数学的同型や問題品質の断定ではない。',largestGroups:examples.slice(0,10)},paidCalls:0,bankChanged:false};
const out=root+'/AI連絡/Claude_入試試作と同型候補の互換点検_20261017.json';fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({questions:report.count,numericCompatible:report.numericCompatible,needsAdaptation:report.needsAdaptation,mathQuestions:total,heuristicMembers:membersOfGroups3,heuristicExcessOver2:excessOver2,paidCalls:0,bankChanged:false}));
