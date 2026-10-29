// 修正案を入れた単元（メモリ上の写し）が validateUnit で新しいエラーを出さないか（Claude 2026-10-29）
const fs=require('fs'),path=require('path');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const P=JSON.parse(fs.readFileSync(path.join(__dirname,'修正案_units.json'),'utf8')).patch;const root=path.join(__dirname,'..','..');
const files=[...new Set(P.map(p=>p.file))];let bad=0;
for(const f of files){const u=JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));const before=e.validateUnit(u,{sources:null}).filter(x=>x!=='unreviewed question');
 const v=JSON.parse(JSON.stringify(u));for(const p of P.filter(p=>p.file===f)){v.questions.find(q=>q.id===p.id).answer.units=p.addUnits;}
 const after=e.validateUnit(v,{sources:null}).filter(x=>x!=='unreviewed question');const extra=after.filter(x=>!before.includes(x));
 console.log(f,'修正',P.filter(p=>p.file===f).length,'問','前のエラー',before.length,'後のエラー',after.length,'ふえたもの',extra.length);if(extra.length){bad++;console.log('  ',extra.slice(0,5));}}
process.exit(bad?1:0);
