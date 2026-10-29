(function(){
'use strict';
const subjects=['数学','英語','国語','理科','社会'];
function build(bank,progress){
 const seen=new Set(),groups=subjects.map(subject=>({subject,points:0,units:[]}));
 for(const u of Array.isArray(bank?.units)?bank.units:[]){
  if(!u||u.status!=='ready'||typeof u.id!=='string'||seen.has(u.id)||!subjects.includes(u.subject))continue;
  seen.add(u.id);const ids=new Set((Array.isArray(u.questions)?u.questions:[]).filter(q=>q&&typeof q.id==='string').map(q=>q.id));if(!ids.size)continue;
  const done=new Set((Array.isArray(progress?.[u.id]?.done)?progress[u.id].done:[]).filter(id=>ids.has(id)));
  const ratio=done.size/ids.size,stars=ratio===1?3:ratio>=.8?2:ratio>=.5?1:0;
  const group=groups.find(g=>g.subject===u.subject);group.points+=stars*5;group.units.push({id:u.id,title:typeof u.title==='string'?u.title:'単元',grade:u.grade,kind:u.bank==='tokkun'?'特訓':u.mode==='drill'?'ドリル':'教科書',done:done.size,total:ids.size,stars});
 }
 return groups;
}
if(typeof module!=='undefined')module.exports={build};
else window.NobiSkillTreeModel=Object.freeze({build});

})();
