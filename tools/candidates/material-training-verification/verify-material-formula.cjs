// 📐 公式カードと電卓（2026-10-08・台帳28）：数学7・理科の大単元に公式カード、電卓は計算する理科の単元だけ、テスト中は出さない、電卓は安全な自前の計算（evalなし）
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function element(tag){return {tag,textContent:'',children:[],handlers:{},attrs:{},value:'',append(...c){this.children.push(...c);},replaceChildren(...c){this.children=c;},setAttribute(k,v){this.attrs[k]=v;},addEventListener(n,f){this.handlers[n]=f;},remove(){}};}
const all=node=>[node,...node.children.flatMap(all)];
const find=(host,tag,test)=>all(host).find(n=>n.tag===tag&&(typeof test==='function'?test(n.textContent||''):!test||n.textContent===test));
const findAll=(host,tag)=>all(host).filter(n=>n.tag===tag);
const screen=host=>all(host).map(n=>n.textContent).join('\n');
const tick=async()=>{for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r));};
const engine=require('./material-engine.js');
let checks=0;const ok=(c,m)=>{checks++;assert.ok(c,m);};
(async()=>{
 const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'../../site-assets/material-bank.json'),'utf8'));
 const bridge={identity:()=>'synthetic',async load(){return {};},async save(){},async review(){return {items:[]};},async aiStatus(){return {available:false};},async record(a){return {id:'r',result:{correct:false}};},drafts:()=>({}),draftsWrite:()=>true};
 const timers=[],allTimers=[];
 const context={document:{createElement:element},Date,NobiMaterialEngine:{...engine,validateUnit:()=>[],address:()=>'出典'},crypto:{randomUUID:()=>'00000000-0000-4000-8000-000000000001'},setInterval:()=>0,clearInterval(){},clearTimeout(id){const t=allTimers[id-1];if(t)t.cleared=true;},setTimeout:(f,ms)=>{const t={f,ms};timers.push(t);allTimers.push(t);return allTimers.length;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8'),context);
 const U=context.NobiMaterialUI,F=U._formulaFor,C=U._calcEval;
 const majors=[...new Set(bank.units.filter(u=>u.subject==='数学'&&u.majorTitle).map(u=>u.majorTitle))];
 ok(majors.length>=7&&majors.every(m=>F(bank.units.find(u=>u.subject==='数学'&&u.majorTitle===m))),'every math chapter has a formula card ('+majors.join('・')+')');
 const sci=t=>F(bank.units.find(u=>u.subject==='理科'&&u.majorTitle===t));
 ok(sci('いろいろな物質とその性質')?.calc&&sci('水溶液の性質')?.calc&&sci('音による現象')?.calc&&sci('力による現象')?.calc&&sci('ゆれる大地')?.calc,'calculator in science calculation chapters');
 ok(sci('光による現象')&&!sci('光による現象').calc,'light: card without calculator');
 ok(!sci('植物の特徴と分類')&&!F(bank.units.find(u=>u.subject==='国語')),'no card where there is no formula (plants, 国語)');
 ok(majors.every(m=>!F(bank.units.find(u=>u.subject==='数学'&&u.majorTitle===m)).calc),'no calculator in math (hand calculation practice)');
 ok(/質量\[g\] ÷ 体積/.test(JSON.stringify(sci('いろいろな物質とその性質').items))&&/溶質の質量 ÷ 溶液の質量 × 100/.test(JSON.stringify(sci('水溶液の性質').items)),'density and concentration formulas');
 const cases=[['2+3×4',14],['(2+3)×4',20],['10÷4',2.5],['-3×(-2)',6],['1.2+0.3',1.5],['２５÷５',5],['20÷(5−5)',null],['2+',null],['alert(1)',null],['3**2',null],['((1)',null],['50÷200×100',25]];
 for(const [e,v] of cases)ok(C(e)===v,'calc '+e+' = '+v+' (got '+C(e)+')');
 // 画面：問題では出る、テストでは出ない
 const unit=bank.units.find(u=>u.subject==='理科'&&u.majorTitle==='いろいろな物質とその性質'&&u.status==='ready'&&u.mode!=='drill'&&u.bank!=='tokkun');
 const host=element('host');const c=U.mount(host,bank.units,bridge,bank.sources);await tick();
 const goto=async(sub,major,title)=>{find(host,'button','理科')?.handlers.click();await tick();find(host,'button',major).handlers.click();await tick();find(host,'button',t=>t.startsWith(title)).handlers.click();await tick();};
 find(host,'button','理科').handlers.click();await tick();await goto('理科',unit.majorTitle,unit.title);
 find(host,'button','作成する').handlers.click();await tick();
 const sum=find(host,'summary',t=>t.startsWith('📐 公式カード'));ok(sum,'card shown on a question');
 const inp=all(host).find(n=>n.tag==='input'&&/^material-calc-/.test(n.id||''));ok(inp,'calculator shown in density unit');
 inp.value='54÷20';inp.handlers.input();ok(screen(host).includes('＝ 2.7'),'calculator answers 54÷20 ＝ 2.7');
 c.destroy();
 const src=fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8');
 ok(/const card=state\.tab==='テスト'\?null:formulaFor\(unit\)/.test(src),'cards are hidden in テスト');
 ok(!/\beval\(|new Function/.test(src),'no eval in the calculator');
 ok(src===fs.readFileSync(path.join(__dirname,'../../site-assets/material-ui.js'),'utf8'),'site-assets copy is identical');
 console.log('Material formula cards: '+checks+' checks ❌ 0 — 数学7章・理科の公式カード、電卓は理科の計算単元だけ、テストでは出さない、電卓の計算（evalなし）');
})().catch(e=>{console.error(e);process.exit(1);});
