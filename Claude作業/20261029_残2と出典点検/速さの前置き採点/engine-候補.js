/* 教材問題の検証・採点。ブラウザと隔離Node検証で共用する。 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NobiMaterialEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const subjects=['国語','数学','英語','理科','社会','保健体育'];
function normalize(value){return String(value??'').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\r\n?/g,'\n').trim().replace(/[ \t\n]+/g,' ').replace(/[−–]/g,'-').replace(/[‘’‛ʼ′]/g,"'").replace(/[“”‟″]/g,'"');}   // iPhoneの自動変換の ’ “ ” も ' " と同じに（2026-10-22）
function text(value){return normalize(value).toLocaleLowerCase('en-US').replace(/[。．.!！?？]+$/,'').trim();}
function number(value){const s=normalize(value).replace(/ /g,'');if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d+)?|\.\d+))?$/.test(s))return null;const a=s.split('/').map(Number);if(a.length===2&&a[1]===0)return null;const n=a.length===2?a[0]/a[1]:a[0];return Number.isFinite(n)?n:null;}
function thousands(value){const s=String(value).replace(/ /g,'');return /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s)?s.replace(/,/g,''):value;}
function rubricLengthValid(a){return ['minChars','maxChars'].every(k=>a[k]===undefined||Number.isSafeInteger(a[k])&&a[k]>=1&&a[k]<=4000)&&(a.minChars===undefined||a.maxChars===undefined||a.minChars<=a.maxChars);}
function checkRubricLength(question,input){
 const a=question?.answer||{};
 if(a.kind!=='rubric'||a.minChars===undefined&&a.maxChars===undefined)return null;
 if(!rubricLengthValid(a))return {correct:false,ratio:0,reason:'この問題の字数条件を確認中です。'};
 // Count punctuation and internal spaces; CR/LF are not written characters.
 // NFC treats a kana plus combining dakuten as the same one written character.
 const count=Array.from(String(input??'').normalize('NFC').trim().replace(/\r\n?|\n/g,'')).length;
 if(a.maxChars!==undefined&&count>a.maxChars)return {correct:false,ratio:0,reason:'字数をこえています（'+count+'字／'+a.maxChars+'字以内）。'};
 if(a.minChars!==undefined&&count<a.minChars)return {correct:false,ratio:0,reason:'あと'+(a.minChars-count)+'字以上、説明を書いてみよう。'};
 return null;
}

function result(correct,ratio,reason){return {correct,ratio,reason};}
// 惜しい（△）：正解ではないが、あと少しの答え。記録は不正解のまま、1週間後にもう一度出す。
function distance1(x,y){
 if(x===y||Math.abs(x.length-y.length)>1)return x===y?0:2;
 let i=0;while(i<x.length&&i<y.length&&x[i]===y[i])i++;
 if(x.length===y.length)return x.slice(i+1)===y.slice(i+1)?1:2;
 return (x.length>y.length?x.slice(i+1)===y.slice(i):x.slice(i)===y.slice(i+1))?1:2;
}
function near(question,raw,base){
 const a=question.answer||{},list=Array.isArray(question.near)?question.near:[];
 if(base.correct||raw==='わからない')return base;
 const close=reason=>({correct:false,ratio:base.ratio||0,reason:'惜しい！'+reason,near:true});
 const same=(x,y)=>x!==null&&y!==null&&Math.abs(x-y)<=Math.max(1,Math.abs(y))*1e-10;
 if(a.kind==='number'){
  let value=raw.replace(/^[a-zA-Z]\s*=\s*/,'').replace(/[。.]+$/,'').trim(); // 「x=5」と書いても読む。最後の「。」もはずす
  const units=[...(a.units||[])].map(normalize).sort((x,y)=>y.length-x.length),unit=units.find(u=>value.endsWith(u));if(unit)value=value.slice(0,-unit.length).trim();value=thousands(value);
  const actual=number(value),expected=number(a.value);
  if(actual===null||expected===null)return base;
  if(a.unitRequired&&!unit&&same(actual,expected))return close('数は合っています。単位もつけよう。');
  if(expected!==0&&same(actual,-expected))return close('符号（＋・−）だけがちがいます。');
  if(list.some(v=>same(actual,number(v))))return close('考え方の途中までは合っています。'+(question.nearHint||'計算の順番と符号をもう一度確かめよう。'));
  if(!Number.isInteger(expected)||!Number.isInteger(actual)){if(same(actual,expected*10)||same(actual,expected/10))return close('小数点の位置を確かめよう。');}
  return base;
 }
 if(a.kind==='numbers'){
  const tokens=raw.replace(/[。.]+$/,'').replace(/\s*=\s*/g,'=').replace(/[、，]/g,',').split(/[,\s]+/).filter(Boolean).map(t=>t.replace(/^[a-zA-Z]=/,'')).filter(Boolean),values=tokens.map(number),expected=(a.values||[]).map(number);
  if(values.some(v=>v===null)||!expected.length)return base;
  const left=[...expected];let hit=0;for(const v of values){const i=left.findIndex(e=>same(v,e));if(i>=0){left.splice(i,1);hit++;}}
  if(a.ordered===true&&hit===expected.length&&values.length===expected.length)return close('数は全部合っています。並べる順番を確かめよう。');
  if(expected.length>=2&&hit*2>=expected.length&&values.length<=expected.length+1)return close('半分以上合っています。'+(expected.length-hit)+'つ足りないか、ちがっています。');
  return base;
 }
 if(a.kind==='exact'){
  const norm=a.caseSensitive?normalize:text,mine=norm(raw);
  if(list.some(v=>norm(v)===mine))return close(question.nearHint||'あと少しです。');
  if(a.caseSensitive&&(a.accepted||[]).some(v=>text(v)===text(raw)))return close('大文字・小文字を確かめよう。');
  if(mine.length>=3&&(a.accepted||[]).some(v=>norm(v).length>=3&&distance1(norm(v),mine)===1))return close('あと1文字ちがいます。');
  return base;
 }
 if(a.kind==='rubric'&&(base.ratio||0)>=0.5)return close('必要な内容の半分以上が書けています。足りない所を補おう。');
 return base;
}
// ---- 式の答え（文字式）：同じ式かを多項式として比べる。正しい式でも表し方が足りないときは「惜しい」 ----
function exprTokens(src){
 const s=String(src??'').replace(/[²³]/g,m=>'^'+(m==='²'?2:3)).normalize('NFKC').replace(/[−–ー]/g,'-').replace(/[＊*]/g,'×').replace(/\s+/g,'');
 const out=[];let i=0;
 while(i<s.length){
  const c=s[i];
  if(/[0-9.]/.test(c)){let j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;const num=s.slice(i,j);if(!/^\d+(\.\d+)?$|^\.\d+$/.test(num))return null;
   // 1/3x のような分数の係数（数/数 のすぐ後に文字・かっこ）
   const m=s.slice(j).match(/^\/(\d+)(?=[a-zA-Z(])/);
   if(m&&(!out.length||['+','-','(','×','÷'].includes(out.at(-1).t))){out.push({t:'n',v:Number(num)/Number(m[1])});i=j+m[0].length;continue;}
   out.push({t:'n',v:Number(num)});i=j;continue;}
  if(/[a-zA-Zπ]/.test(c)){out.push({t:'v',v:c});i++;continue;} // π は文字と同じように扱う（12π、10π+10 など）
  if('+-×÷/()^'.includes(c)){out.push({t:c});i++;continue;}
  if(c==='x'){out.push({t:'v',v:'x'});i++;continue;}
  return null;
 }
 return out;
}
function polyAdd(a,b,k=1){const r={...a};for(const m in b){r[m]=(r[m]||0)+k*b[m];if(Math.abs(r[m])<1e-12)delete r[m];}return r;}
function monoKey(list){
 // 文字でわった部分は「/x」として持ち、x と /x は打ち消す
 const out=[...list];
 for(const c of new Set(out.filter(v=>!v.startsWith('/')))){let i;while(out.includes(c)&&(i=out.indexOf('/'+c))>=0){out.splice(i,1);out.splice(out.indexOf(c),1);}}
 return out.sort().join(',');
}
function polyMul(a,b){let r={};for(const x in a)for(const y in b){const key=monoKey([...(x?x.split(','):[]),...(y?y.split(','):[])]);r=polyAdd(r,{[key]:a[x]*b[y]});}return r;}
function exprParse(src){
 const t=exprTokens(src);if(!t||!t.length)return null;let p=0;const info={mulSign:false,parens:false,divVar:false};
 const peek=()=>t[p]?.t,take=()=>t[p++];
 function primary(){
  const k=peek();
  if(k==='n')return {'':take().v};
  if(k==='v')return {[take().v]:1};
  if(k==='('){take();const e=sum();if(peek()!==')')throw 0;take();
   // (1/3)x のような数だけのかっこと、(8x−3)/12 のような分子のかっこは、表し方の誤りにしない
   if(Object.keys(e).some(m=>m!=='')&&peek()!=='/')info.parens=true;return e;}
  throw 0;
 }
 function power(){let b=primary();if(peek()==='^'){take();const e=take();if(!e||e.t!=='n'||!Number.isInteger(e.v)||e.v<1||e.v>6)throw 0;let r={'':1};for(let i=0;i<e.v;i++)r=polyMul(r,b);b=r;}return b;}
 function unary(){if(peek()==='-'){take();return polyMul({'':-1},unary());}if(peek()==='+'){take();return unary();}return power();}
 function product(){
  let a=unary();
  for(;;){const k=peek();
   if(k==='×'){info.mulSign=true;take();a=polyMul(a,unary());}
   else if(k==='÷'||k==='/'){if(k==='÷')info.mulSign=true;take();const d=unary(),keys=Object.keys(d);if(keys.length!==1||!d[keys[0]])throw 0;
    // 数でわる、または1つの項（5÷x、a÷b など）でわる
    const inv=keys[0]?keys[0].split(',').map(v=>v.startsWith('/')?v.slice(1):'/'+v).join(','):'';a=polyMul(a,{[inv]:1/d[keys[0]]});}
   else if(k==='n'||k==='v'||k==='('){a=polyMul(a,power());}
   else return a;}
 }
 function sum(){let a=product();for(;;){const k=peek();if(k==='+'){take();a=polyAdd(a,product());}else if(k==='-'){take();a=polyAdd(a,product(),-1);}else return a;}}
 try{const e=sum();if(p!==t.length)return null;return {poly:e,info,tokens:t};}catch(_){return null;}
}
function polyEqual(a,b){const keys=new Set([...Object.keys(a),...Object.keys(b)]);for(const k of keys)if(Math.abs((a[k]||0)-(b[k]||0))>1e-9*Math.max(1,Math.abs(b[k]||0)))return false;return true;}
function topTerms(tokens){let depth=0,n=1;tokens.forEach((x,i)=>{if(x.t==='(')depth++;else if(x.t===')')depth--;else if(depth===0&&(x.t==='+'||x.t==='-')&&i>0&&!['×','÷','/','^','(','+','-'].includes(tokens[i-1].t))n++;});return n;}
function stripUnit(a,input){
 let s=String(input??'').trim().replace(/[。．.]+$/,'').trim(); // 最後の「。」ははずす（2026-10-22）
 for(const u of [...(a.units||[])].sort((x,y)=>y.length-x.length)){for(const w of ['（'+u+'）','('+u+')',u]){if(s.endsWith(w)){return s.slice(0,-w.length).trim();}}}
 return s;
}
function gradeExpr(question,input){
 const a=question.answer||{};input=stripUnit(a,input);const mine=exprParse(input),want=exprParse(a.value);
 if(!want)return result(false,0,'この問題の採点条件を確認中です。');
 if(!mine)return result(false,0,'式として読み取れませんでした。かけ算の記号やかっこを確かめよう。');
 if(!polyEqual(mine.poly,want.poly)){
  if((question.near||[]).some(v=>{const n=exprParse(v);return n&&polyEqual(mine.poly,n.poly);}))return {correct:false,ratio:0,reason:'惜しい！'+(question.nearHint||'符号やかっこのはずし方を確かめよう。'),near:true};
  return result(false,0,'式をもう一度確かめよう。');
 }
 if(a.form!=='any'){
  const close=reason=>({correct:false,ratio:0.5,reason:'惜しい！式は合っています。'+reason,near:true});
  if(mine.info.mulSign)return close('×や÷の記号を使わない書き方にしよう。');
  if(a.form==='nosign')return result(true,1,'正解です。');
  if(mine.info.parens&&!want.info.parens)return close('かっこをはずして整理しよう。');
  if(topTerms(mine.tokens)>topTerms(want.tokens))return close('同じ文字の項（同類項）や数の項をまとめよう。');
  const raw=String(input).replace(/[²³]/g,'^2').normalize('NFKC').replace(/\s+/g,'');
  if(/(^|[^0-9.])1[a-zA-Z(]/.test(raw))return close('1 は書かないで表そう（1x は x）。');
  if(/[a-zA-Zπ]\d/.test(raw.replace(/\^\d/g,'')))return close('数は文字の前に書こう。');
  if(a.order===true){const letters=raw.replace(/\^\d/g,'').split(/[+\-()]/).map(term=>term.replace(/[^a-zA-Z]/g,''));if(letters.some(w=>w!==[...w].sort().join('')))return close('文字はふつうアルファベット順に書こう。');}
 }
 return result(true,1,'正解です。');
}
function relSplit(src){
 const s=String(src??'').normalize('NFKC').replace(/[≧≥]|>=|＞＝/g,'≥').replace(/[≦≤]|<=|＜＝/g,'≤').replace(/[＜]/g,'<').replace(/[＞]/g,'>').replace(/[＝]/g,'=');
 const m=s.match(/^([^=<>≤≥]+)(=|<|>|≤|≥)([^=<>≤≥]+)$/);if(!m)return null;
 const l=exprParse(m[1]),r=exprParse(m[3]);if(!l||!r)return null;
 return {op:m[2],diff:polyAdd(l.poly,r.poly,-1),mul:l.info.mulSign||r.info.mulSign};
}
function gradeRelation(question,input){
 const a=question.answer||{},mine=relSplit(stripUnit(a,input)),want=relSplit(a.value);
 if(!want)return result(false,0,'この問題の採点条件を確認中です。');
 if(!mine)return result(false,0,'等号（＝）や不等号（＜、＞、≦、≧）を使った式で答えよう。');
 const key=Object.keys(want.diff).find(k=>k!=='')||Object.keys(want.diff)[0];
 const k=key!==undefined&&want.diff[key]?(mine.diff[key]||0)/want.diff[key]:0;
 const same=k!==0&&polyEqual(mine.diff,Object.fromEntries(Object.entries(want.diff).map(([m,c])=>[m,c*k])));
 const flip={'<':'>','>':'<','≤':'≥','≥':'≤','=':'='};
 const opOk=want.op==='='?mine.op==='=':(k>0?mine.op===want.op:mine.op===flip[want.op]);
 if(same&&opOk){if(mine.mul)return {correct:false,ratio:0.5,reason:'惜しい！関係は合っています。×や÷の記号を使わない書き方にしよう。',near:true};
  // 両辺を何倍かした形（2a＝2b＋8、x＜4 など）は、数量をそのまま表した式ではないので「惜しい」
  if(Math.abs(Math.abs(k)-1)>1e-9)return {correct:false,ratio:0.5,reason:'惜しい！関係は合っていますが、数量をそのまま式に表そう（両辺を何倍もしない）。',near:true};
  return result(true,1,'正解です。');}
 if(same&&want.op!=='='&&mine.op!=='='){
  const strict=o=>o==='<'||o==='>';
  if(strict(mine.op)!==strict(want.op))return {correct:false,ratio:0.5,reason:'惜しい！「以上・以下」（≧・≦）と「より大きい・未満」（＞・＜）のちがいを確かめよう。',near:true};
  return {correct:false,ratio:0.5,reason:'惜しい！不等号の向きを確かめよう。',near:true};
 }
 // 問題ごとに用意した「惜しい」関係（符号のまちがいなど）
 for(const v of question.near||[]){const n=relSplit(v);if(!n)continue;const kk=Object.keys(n.diff).find(x=>x!=='')||Object.keys(n.diff)[0];const f=kk!==undefined&&n.diff[kk]?(mine.diff[kk]||0)/n.diff[kk]:0;
  if(f!==0&&polyEqual(mine.diff,Object.fromEntries(Object.entries(n.diff).map(([m,c])=>[m,c*f])))&&(n.op==='='?mine.op==='=':(f>0?mine.op===n.op:mine.op===flip[n.op])))return {correct:false,ratio:0,reason:'惜しい！'+(question.nearHint||'どちらが多い（大きい）か、符号や向きを確かめよう。'),near:true};}
 return result(false,0,'数量の関係をもう一度確かめよう。');
}
// 集合の答え（辺・面・記号をすべて答える）：順番・区切り・「辺」「面」などのことばは自由。全部そろえば正解、半分以上なら惜しい
function setTokens(raw,a={}){
 // letters：記号（ア・イ…）の組は区切りなしの「イエ」も1文字ずつ読む。plain：用語の組（沸点・断面など）から字を削らない。
 const s=normalize(raw).replace(/[。.]+$/,'');
 if(a.letters)return [...s.replace(/[、,，・\s→]+/g,'')].map(t=>t.toUpperCase());
 return (a.plain?s:s.replace(/(?:直線|平面|辺|面|線分|点)/g,' ')).split(/[、,，・\s]+/).map(t=>t.trim().toUpperCase()).filter(Boolean);
}
function gradeSet(question,input){
 const a=question.answer||{},items=Array.isArray(a.items)?a.items:[],toks=setTokens(input,a);
 if(!toks.length)return result(false,0,'答えを入力してください。');
 const used=new Set();let hit=0,extra=0;
 for(const t of toks){const i=items.findIndex((alts,k)=>!used.has(k)&&alts.some(v=>normalize(v).toUpperCase()===t));if(i>=0){used.add(i);hit++;}else extra++;}
 if(hit===items.length&&!extra)return result(true,1,'正解です。');
 if(items.length>=2&&hit*2>=items.length&&extra<=1)return {correct:false,ratio:hit/items.length,reason:'惜しい！'+(hit<items.length?'あと'+(items.length-hit)+'つ足りません。':'')+(extra?'ちがうものが入っています。':''),near:true};
 return result(false,hit/Math.max(1,items.length),'もう一度、条件に合うものを確かめよう。');
}
function grade(question,input){if((question.answer||{}).kind==='set'){const r=normalize(input);if(!r)return result(false,0,'答えを入力してください。');if(r.length>400)return result(false,0,'回答が長すぎます。');return gradeSet(question,input);}if((question.answer||{}).kind==='relation'){const r=normalize(input);if(!r)return result(false,0,'答えを入力してください。');if(r.length>200)return result(false,0,'回答が長すぎます。');return gradeRelation(question,input);}if((question.answer||{}).kind==='expr'){const r=normalize(input);if(!r)return result(false,0,'答えを入力してください。');if(r.length>200)return result(false,0,'回答が長すぎます。');if(r==='わからない')return result(false,0,'式として読み取れませんでした。');return gradeExpr(question,input);}return near(question,normalize(input),gradeOnly(question,input));}
function gradeOnly(question,input){
 const a=question.answer||{},raw=normalize(input);
 if(question.type==='reading')return result(false,0,'読む教材は採点しません。');
 if(!raw)return result(false,0,'答えを入力してください。');
 if(raw.length>4000)return result(false,0,'回答が長すぎます。');
 if(a.kind==='number'){
  let value=raw.replace(/^[a-zA-Z]\s*=\s*/,'').replace(/[。.]+$/,'').trim(); // 方程式の答えを「x=5」と書いても読む。最後の「。」もはずす（2026-10-22）
  const units=[...(a.units||[])].map(normalize).sort((x,y)=>y.length-x.length); // ℃ などは入力と同じく正規化して比べる
  {const tail=value.match(/\s*(以上|未満)$/);if(tail&&new RegExp('何\\s*\\S*\\s*'+tail[1]).test(String(question.prompt||'')))value=value.slice(0,-tail[0].length).trim();} // 「何 cm 以上の階級か」に「145 cm 以上」と答えても読む（2026-10-29 候補）
  const unit=units.find(u=>value.endsWith(u));if(unit)value=value.slice(0,-unit.length).trim();
  {const rate=value.match(/^(分速|秒速|時速|毎分|毎秒|毎時)\s*/);if(rate&&unit&&String(question.prompt||'').includes(rate[1]))value=value.slice(rate[0].length).trim();} // 「分速175m」：問題文にある「分速」などの前置きは、単位をつけたときだけ読む（2026-10-29 候補）
  value=thousands(value); // 「1,500」のような3けたごとのカンマも読む（2026-10-22）
  if(a.unitRequired&&!unit)return result(false,0,'単位も入力してください。');
  const actual=number(value),expected=number(a.value);
  if(actual===null||expected===null)return result(false,0,'数値と指定の単位を確認してください。');
  const same=Math.abs(actual-expected)<=Math.max(1,Math.abs(expected))*1e-10;
  // 答えが分数の問題で、約分していない分数（9/30 など）は○にしない（2026-10-22 候補）
  const fm=String(value).replace(/ /g,'').match(/^[+-]?(\d+)\/(\d+)$/);
  if(same&&fm){let x=+fm[1],y=+fm[2];const den=y;while(y){[x,y]=[y,x%y];}if(x>1||den===1)return result(false,0.5,'約分しよう。');}
  return result(same,same?1:0,same?'正解です。':'数値をもう一度確認してください。');
 }
 if(a.kind==='numbers'){
  const tokens=raw.replace(/[。.]+$/,'').replace(/\s*=\s*/g,'=').replace(/[、，]/g,',').split(/[,\s]+/).filter(Boolean).map(t=>t.replace(/^[a-zA-Z]=/,'')).filter(Boolean),values=tokens.map(number),expected=a.values.map(number);
  if(values.some(v=>v===null)||expected.some(v=>v===null)||values.length!==expected.length)return result(false,0,'数の個数と区切りを確認してください。');
  if(a.ordered!==true){values.sort((x,y)=>x-y);expected.sort((x,y)=>x-y);}
  const same=values.every((v,i)=>Math.abs(v-expected[i])<=Math.max(1,Math.abs(expected[i]))*1e-10);
  return result(same,same?1:0,same?'正解です。':'数や並べる順序を確認してください。');
 }
 if(a.kind==='exact'){
  // 文法を問う問題では大文字小文字も採点条件にできる。
  const base=a.caseSensitive?normalize:text,norm=a.compact?v=>base(v).replace(/\s+/g,'').replace(/[*＊]/g,'×'):base;
  const same=(a.accepted||[]).some(v=>norm(v)===norm(raw));
  return result(same,same?1:0,same?'正解です。':'用語や表記を確認してください。');
 }
 if(a.kind==='rubric'){
  const lengthResult=checkRubricLength(question,input);if(lengthResult)return lengthResult;
  if(text(raw)==='わからない')return result(false,0,'考えを書いてみよう。');
  if(a.allowNegation!==true&&/(?:(?<!少|危|汚|切|つ|間も|だけで)(?:ない|なく)|不要|無関係|not\b|never\b)/i.test(raw))   // 「少ない」「つないで」「間もなく」「だけでなく」は否定ではない（2026-10-22）
 return result(false,0,'否定の表現があるため、正解の条件と照合できません。');
  const s=text(raw),has=terms=>terms.some(t=>s.includes(text(t)));
  if((a.reject||[]).some(has))return result(false,0,'説明に矛盾する部分があります。');
  if((a.required||[]).some(terms=>!has(terms)))return result(false,0,'説明の中心となる内容を確認してください。');
  const criteria=a.criteria||[],total=criteria.reduce((n,c)=>n+c.weight,0);
  if(!total)return result(false,0,'この問題の採点条件を確認中です。');
  const earned=criteria.reduce((n,c)=>n+(has(c.any)?c.weight:0),0),ratio=earned/total;
  // 必要な内容をすべて満たしたときだけ正解（文字が7割合っているだけでは正解にしない）
  return result(ratio>=1,ratio,ratio>=1?'必要な内容をすべて満たしています。':ratio>0?'必要な内容の一部が足りません。足りない所を補ってください。':'理由や必要な内容を補ってください。');
 }
 return result(false,0,'この問題の採点条件を確認中です。');
}
function sourceFor(registry,id){
 if(registry instanceof Map)return registry.get(id)||null;
 if(Array.isArray(registry))return registry.find(s=>s&&s.id===id)||null;
 return registry&&typeof registry==='object'?registry[id]||null:null;
}
function sourcePage(value){
 if(Number.isInteger(value))return value;
 const m=normalize(value).match(/^(?:p(?:age)?\.?\s*)?(\d+)$/i);return m?Number(m[1]):null;
}
function validateReference(ref,registry,unit,errors){
 if(!ref||typeof ref!=='object'){errors.push('source reference');return;}
 if(!/^source-\d{4,}$/.test(ref.id||'')||!/^([a-f\d]{64})$/i.test(ref.sha256||'')||!Number.isInteger(ref.page)||ref.page<1||!ref.number){errors.push('source reference');return;}
 const source=sourceFor(registry,ref.id);
 if(!source){errors.push('source registry entry');return;}
 const pageList=Array.isArray(source.pages)?source.pages.map(sourcePage):[];
 // 特訓（bank:'tokkun'）はオリジナル問題で、参考にした教科書のページ（台帳 mode:'textbook'）を出典にできる（2026-10-08）
 if(source.verified!==true||source.file!==ref.file||source.sha256!==ref.sha256||(source.mode!==unit.mode&&!(unit.bank==='tokkun'&&source.mode==='textbook'&&ref.page>0))||source.subject!==unit.subject||source.grade!==unit.grade||!pageList.includes(ref.page))errors.push('source registry mismatch');
}
function validateTextbookReference(ref,registry,unit,errors){
 if(!ref||typeof ref!=='object'||!/^([a-f\d]{64})$/i.test(ref.sha256||'')||typeof ref.file!=='string'||!ref.file||!Number.isInteger(ref.page)||ref.page<1){errors.push('textbook source reference');return;}
 if(/^source-\d{4,}$/.test(ref.id||'')){validateReference({...ref,number:ref.number||'本文'},registry,unit,errors);return;}
 if(!/^reference-[a-f\d]{16}$/.test(ref.id||'')){errors.push('textbook source reference');return;}
 const source=sourceFor(registry,ref.id);
 if(!source){errors.push('textbook source registry entry');return;}
 const pages=Array.isArray(source.pages)?source.pages.map(sourcePage):[];
 const gradeAllowed=source.kind==='textbook-reference'?source.gradeScope==='中一'&&unit.grade===1:source.kind==='supplement-reference'&&source.gradeScope==='中一〜中三'&&[1,2,3].includes(unit.grade);
 if(source.verified!==true||source.file!==ref.file||source.sha256!==ref.sha256||source.subject!==unit.subject||!gradeAllowed||!pages.includes(ref.page))errors.push('textbook source registry mismatch');
}
function validateQuestion(q,unit,registry,strict,ids,prompts,errors,isTest){
 if(!q||typeof q!=='object'||Array.isArray(q)){errors.push('question object');return;}
 if(!q.id||ids.has(q.id))errors.push('duplicate/missing question id');ids.add(q.id);
 const prompt=normalize(q.prompt);
 if(!prompt||prompts.has(prompt))errors.push('duplicate/missing prompt');prompts.add(prompt);
 if(!q.source||!q.source.file||!Number.isInteger(q.source.page)||q.source.page<1||!q.source.number)errors.push('source');
 else if(strict)validateReference(q.source,registry,unit,errors);
 if(!['original','adapted'].includes(q.origin))errors.push('origin');
 if(isTest&&q.origin!=='adapted'&&!(unit.mode==='drill'&&unit.testPolicy==='reviewed-original'&&q.origin==='original'))errors.push('test must be adapted');
 if(q.reviewed!==true)errors.push('unreviewed question');
 if(q.type==='reading'&&!strict)return;
 if(q.type!=='input')errors.push('input only');
 const a=q.answer||{};
 if(a.kind==='rubric'&&!rubricLengthValid(a))errors.push('rubric length');
 if(a.kind==='number'&&number(a.value)===null)errors.push('invalid number');
 else if(a.kind==='exact'&&(!Array.isArray(a.accepted)||!a.accepted.length||a.accepted.some(v=>!normalize(v))))errors.push('accepted answers');
 else if(a.kind==='rubric'&&(!Array.isArray(a.criteria)||!a.criteria.length||a.criteria.some(c=>!Number.isFinite(c.weight)||c.weight<=0||!Array.isArray(c.any)||!c.any.length||c.any.some(t=>!normalize(t)))))errors.push('rubric');
 else if(a.kind==='numbers'&&(!Array.isArray(a.values)||!a.values.length||a.values.some(v=>number(v)===null)))errors.push('number list');
 else if(a.kind==='expr'&&!exprParse(a.value))errors.push('expression answer');
 else if(a.kind==='relation'&&!relSplit(a.value))errors.push('relation answer');
 else if(a.kind==='set'&&(!Array.isArray(a.items)||!a.items.length||a.items.some(x=>!Array.isArray(x)||!x.length||x.some(v=>typeof v!=='string'||!normalize(v)))))errors.push('set answer');
 else if(!['number','numbers','exact','rubric','expr','relation','set'].includes(a.kind))errors.push('answer kind');
 if(!q.explanation)errors.push('explanation');
 if(q.near!==undefined&&(!Array.isArray(q.near)||q.near.some(v=>typeof v!=='string'||!normalize(v))))errors.push('near answers');
 if(unit.size===70&&!isTest&&(typeof q.ref!=='string'||!/^参考：\S/.test(q.ref)))errors.push('reference label');
}
function validateUnit(unit,context={}){
 if(!unit||typeof unit!=='object'||Array.isArray(unit))return ['unit object'];
 const errors=[];if(!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(unit.id||''))errors.push('unit id');
 if(!['workbook','drill','kentei'].includes(unit.mode))errors.push('mode');
 if(unit.mode==='kentei'&&(![20,50,120].includes(unit.size)||unit.bank!=='kentei'||(Array.isArray(unit.tests)&&unit.tests.length)))errors.push('kentei unit');   // 模擬検定は本番と同じ問題数（20・50・120問）、確認テストなし（2026-10-22）
 if(unit.testPolicy!==undefined&&(unit.mode!=='drill'||unit.testPolicy!=='reviewed-original'))errors.push('test policy');
 if(!subjects.includes(unit.subject))errors.push('subject');if(![1,2,3].includes(unit.grade))errors.push('grade');
 if(unit.subject==='保健体育'&&unit.mode!=='workbook')errors.push('PE must be workbook');
 if(!unit.title)errors.push('title');
 const ready=unit.status==='ready',registry=context&&context.sources;
 if(ready&&!registry)errors.push('ready unit requires a verified source registry');
 const ids=new Set(),prompts=new Set();
 const questions=Array.isArray(unit.questions)?unit.questions:[];
 if(!Array.isArray(unit.questions))errors.push('questions array');
 for(const q of questions)validateQuestion(q,unit,registry,ready,ids,prompts,errors,false);
 if(ready){
  // 70問の小単元（○△×で管理）は確認テストを持たなくてよい。これまでの100問の小単元は従来どおり。
  const size=unit.mode==='kentei'?unit.size:unit.size===70?70:100;
  if(questions.length!==size||questions.some(q=>!q||q.type!=='input'))errors.push('ready unit requires exactly '+size+' input questions');
  const tests=Array.isArray(unit.tests)?unit.tests:[];
  if(size===100&&!tests.length)errors.push('ready unit requires a test bank');
  for(const q of tests)validateQuestion(q,unit,registry,true,ids,prompts,errors,true);
 }
 const lesson=unit.textbook;
 if(lesson!=null&&(typeof lesson!=='object'||Array.isArray(lesson)))errors.push('textbook object');
 else if(lesson&&lesson.status==='ready'){
  if(!registry)errors.push('ready textbook requires a verified source registry');
  if(!Array.isArray(lesson.goals)||!lesson.goals.length||lesson.goals.some(g=>!normalize(g))||!normalize(lesson.summary))errors.push('ready textbook requires goals and summary');
  const sections=lesson&&Array.isArray(lesson.sections)?lesson.sections:[];
  if(!sections.length)errors.push('ready textbook requires sections');
  const sectionIds=new Set();
  for(const section of sections){
   if(!section||typeof section!=='object'){errors.push('textbook section');continue;}
   if(!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(section.id||'')||sectionIds.has(section.id))errors.push('textbook section id');sectionIds.add(section.id);
   if(!normalize(section.title)||!normalize(section.body)||section.reviewed!==true)errors.push('unreviewed textbook section');
   if(!Array.isArray(section.sources)||!section.sources.length)errors.push('textbook source references');
   else section.sources.forEach(ref=>validateTextbookReference(ref,registry,unit,errors));
  }
 }
 return [...new Set(errors)];
}
function address(unit,q){if(typeof q.ref==='string'&&q.ref)return q.ref;const s=q.source;return `${unit.subject} ${s.page}p ${s.number}${q.origin==='adapted'?'（類題）':''}`;}
function completion(unit,progress){
 const record=progress&&typeof progress==='object'&&!Array.isArray(progress)?progress:{};
 function count(questions,key){
  const ids=new Set((Array.isArray(questions)?questions:[]).filter(q=>q&&q.type==='input'&&typeof q.id==='string').map(q=>q.id));
  const done=new Set((Array.isArray(record[key])?record[key]:[]).filter(id=>typeof id==='string'&&ids.has(id))).size;
  return {done,total:ids.size,percent:ids.size?Math.floor(done/ids.size*100):0,complete:ids.size>0&&done===ids.size};
 }
 return {study:count(unit?.questions,'done'),test:count(unit?.tests,'testDone')};
}
return Object.freeze({normalize,grade,validateUnit,address,completion});
});
