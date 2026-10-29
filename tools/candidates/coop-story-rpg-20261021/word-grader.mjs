// Generated from the existing pure grader. Run build-word-grader.py to update.
function kataToHira(s){return s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));}
function normJa(s){return kataToHira(String(s==null?'':s).normalize('NFKC')).replace(/[\s、。,.，．!！?？・「」『』〜~…]/g,'').replace(/[()（）]/g,'');}
function normEn(s){return String(s==null?'':s).normalize('NFKC').replace(/[’‘`´]/g,"'").toLowerCase().replace(/\s+/g,' ').trim().replace(/[.!?。]+$/,'').trim();}
function variants(m){
 const s=String(m).normalize('NFKC'),out=[s,s.replace(/[(（][^)）]*[)）]/g,''),s.replace(/[()（）]/g,'')];
 out.push(out[1].replace(/^[〜~](を|に|が|で|と|へ|の)?/,''));
 return out;
}
const FORMS=new WeakMap(),SHOW=new WeakMap();
function jaForms(w){if(!FORMS.has(w))FORMS.set(w,new Set([].concat(...(w.acc||w.ja||[]).map(variants)).map(normJa).filter(Boolean)));return FORMS.get(w);}
function showForms(w){if(!SHOW.has(w))SHOW.set(w,new Set([].concat(...(w.ja||[]).map(variants)).map(normJa).filter(x=>x.length>1)));return SHOW.get(w);}
function jaOne(F,g){if(!g)return false;if(F.has(g))return true;
 // 「勉強」→「勉強する」、「有名」→「有名な」のような書き落としは正解にする（2文字以上）
 return g.length>=2&&['する','な','の','に','だ'].some(x=>F.has(g+x));}
function judgeJa(w,given){
 const raw=String(given==null?'':given),g=normJa(raw);if(!g)return{ok:false,empty:true};
 const F=jaForms(w);if(jaOne(F,g))return{ok:true};
 const parts=raw.split(/[、,，\/／;；]/).map(normJa).filter(Boolean);
 if(parts.length>1&&parts.every(p=>jaOne(F,p)))return{ok:true};
 return{ok:false};
}
function lev1(a,b){if(a===b)return false;if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++d>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}}return d+(a.length-i)+(b.length-j)===1;}
const INDEX=new WeakMap();
function enIndex(bank){if(!bank)return null;if(!INDEX.has(bank)){const m=new Map();for(const g of bank.grades)for(const w of g.words)for(const v of [w.w].concat(w.alt||[]))if(!m.has(normEn(v)))m.set(normEn(v),w);INDEX.set(bank,m);}return INDEX.get(bank);}
function judgeEn(w,given,bank){
 const g=normEn(given);if(!g)return{ok:false,empty:true};
 const acc=[w.w].concat(w.alt||[]).map(normEn);if(acc.includes(g))return{ok:true};
 // 同じ意味の別の単語（例：「話す」に talk と書いた）は、まちがいにせず、もう一度書いてもらう
 const o=enIndex(bank)&&enIndex(bank).get(g);
 if(o&&o!==w){const A=showForms(w);for(const x of showForms(o))if(A.has(x))return{ok:false,other:true,word:o.w};}
 const near=acc.some(a=>a.replace(/[^a-z]/g,'').length>=3&&lev1(g,a));
 return{ok:false,near};
}

export {normJa,normEn,judgeJa,judgeEn};
