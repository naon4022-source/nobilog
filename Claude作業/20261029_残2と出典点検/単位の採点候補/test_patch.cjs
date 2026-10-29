// 第2版では scan_units2.cjs の結果を使う。1回目は「1」を前につけた答えを誤答にしたが、π/10 → 1π/10 は同じ値で、検査側の誤り（test_patch_1回目.log）。誤答は「(答え)+1」にした。
// 修正案：答えに units を足すだけ（共通エンジンは変えない）。元のファイルは読むだけで、メモリ上の写しに足して本物の採点エンジンで試す（Claude 2026-10-29）
const fs=require('fs'),path=require('path');const e=require('/Users/shimizunaotomoo/Desktop/my-app/教材整理/実装/material-engine.js');
const hits=JSON.parse(fs.readFileSync(path.join(__dirname,'scan-result.json'),'utf8')).filter(h=>!h.withUnit);
const ALT={'cm²':['cm²','cm2'],'cm³':['cm³','cm3'],'m²':['m²','m2'],'m³':['m³','m3'],'cm':['cm'],'m':['m']};
const OTHER={'cm':'cm²','cm²':'cm³','cm³':'cm²','m':'m²','m²':'m','m³':'m²'};
const root=path.join(__dirname,'..','..');const cache={};
let n=0,bad=0;const patch=[],rows=[];
for(const h of hits){
 const f=path.join(root,h.file);cache[f]=cache[f]||JSON.parse(fs.readFileSync(f,'utf8'));
 const orig=cache[f].questions.find(q=>q.id===h.id);const q=JSON.parse(JSON.stringify(orig));
 const units=ALT[h.unit]||[h.unit];q.answer.units=units;patch.push({file:h.file,id:h.id,addUnits:units});
 const v=q.answer.value;const cases=[[v,true],[v+' '+units[0],true],[v+units[0],true],[v+' '+(units[1]||units[0]),true],
  [v+' '+OTHER[h.unit],false],['('+v+')+1 '+units[0],false],[v.replace(/π/g,'')+' '+units[0],v.includes('π')?false:true]];
 for(const [inp,exp] of cases){const r=e.grade(q,inp);n++;const ok=r.correct===exp;if(!ok){bad++;console.log('期待とちがう',h.id,JSON.stringify(inp),'期待',exp?'○':'×','結果',r.correct?'○':'×',r.reason||'');}rows.push({id:h.id,input:inp,expect:exp,got:r.correct});}
 // 元の問題（units なし）での単位つき入力が×であることも記録（再現）
 const r0=e.grade(orig,v+' '+units[0]);rows.push({id:h.id,input:v+' '+units[0],expect:'元のデータでは×（再現）',got:r0.correct});if(r0.correct){bad++;console.log('再現できない',h.id);}
}
fs.writeFileSync(path.join(__dirname,'修正案_units.json'),JSON.stringify({note:'候補。答え（answer）に units を足すだけ。問題文・答えの値・ほかの項目は変えない。共通エンジンは変更しない。',count:patch.length,patch},null,1)+'\n');
fs.writeFileSync(path.join(__dirname,'test_patch-result.json'),JSON.stringify({total:n,mismatch:bad,rows},null,1)+'\n');
console.log(`対象 ${hits.length} 問・試した入力 ${n} / 期待とちがう ${bad}`);process.exit(bad?1:0);
