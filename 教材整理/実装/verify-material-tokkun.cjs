// 🏋️ 特訓（2026-10-08）：本物の問題バンクで、問題の種類「特訓」→数学1年に19小単元が出て、選ぶと特訓の問題（70問）が出る。教科書モードには混ざらない。
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
 const allTk=bank.units.filter(u=>u.bank==='tokkun');
 const tk=allTk.filter(u=>u.subject==='数学');
 const reviewed=fs.readdirSync(path.join(__dirname,'../確認済み')).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(fs.readFileSync(path.join(__dirname,'../確認済み',n),'utf8'))).filter(u=>u.status==='ready'&&u.bank==='tokkun');
 ok(JSON.stringify(allTk.map(u=>u.id).sort())===JSON.stringify(reviewed.map(u=>u.id).sort()),'all confirmed ready tokkun units are present without missing or extra IDs');
 ok(allTk.every(u=>u.questions.length===70&&u.status==='ready'),'all ready tokkun units contain 70 questions');
 ok(['国語','英語','理科'].every(subject=>allTk.some(u=>u.subject===subject)),'Japanese, English and science completed units are present');
 ok(tk.length===19&&tk.every(u=>u.questions.length===70&&u.subject==='数学'&&u.grade===1&&u.status==='ready'),'19 ready tokkun units of 70');
 ok(allTk.every(u=>engine.validateUnit(u,{sources:bank.sources}).length===0),'every tokkun unit passes the strict check with the source registry');
 ok(bank.units.filter(u=>u.bank!=='tokkun').every(u=>engine.validateUnit(u,{sources:bank.sources}).length===0),'other units still pass');
 // 教科書の出典を使えるのは特訓だけ
 const fake={...bank.units.find(u=>u.bank!=='tokkun'&&u.subject==='数学'&&u.size===70)};const tq=tk[0].questions[0];
 fake.questions=fake.questions.map((q,i)=>i===0?{...q,source:tq.source}:q);
 ok(engine.validateUnit(fake,{sources:bank.sources}).includes('source registry mismatch'),'a non-tokkun unit cannot cite a textbook page');
 const bridge={identity:()=>'synthetic',async load(){return {};},async save(){},async review(){return {items:[]};},async aiStatus(){return {available:false};},async record(a){return {id:'r',result:{correct:false}};},drafts:()=>({}),draftsWrite:()=>true};
 const timers=[],allTimers=[];
 const context={document:{createElement:element},Date,NobiMaterialEngine:{...engine,validateUnit:()=>[],address:()=>'出典'},crypto:{randomUUID:()=>'00000000-0000-4000-8000-000000000001'},setInterval:()=>0,clearInterval(){},clearTimeout(id){const t=allTimers[id-1];if(t)t.cleared=true;},setTimeout:(f,ms)=>{const t={f,ms};timers.push(t);allTimers.push(t);return allTimers.length;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8'),context);
 const host=element('host');const c=context.NobiMaterialUI.mount(host,bank.units,bridge,bank.sources);await tick();
 find(host,'button','特訓').handlers.click();await tick();
 find(host,'button','数学').handlers.click();await tick();
 const text=screen(host);
 ok(!/いま作成中で/.test(text),'no "in progress" note once tokkun units exist');
 const titles=tk.map(u=>u.title),seen=new Set(),majors=[...new Set(tk.map(u=>u.majorTitle))];
 for(const m of majors){const b=find(host,'button',m);ok(b,'major shown: '+m);b.handlers.click();await tick();const now=screen(host);tk.filter(u=>u.majorTitle===m).forEach(u=>{if(now.includes(u.title))seen.add(u.id);});}
 ok(seen.size===19,'all 19 tokkun units are listed under their chapters ('+seen.size+')');
 const unitButtons=findAll(host,'button').map(b=>b.textContent).filter(t=>/　○\d+\/\d+/.test(t));
 ok(unitButtons.length>0&&unitButtons.every(t=>t.includes('（特訓）')),'only 特訓 units are listed in 特訓 ('+unitButtons.length+')');
 for(const subject of ['国語','英語','理科','社会']){find(host,'button',subject).handlers.click();await tick();const foreign=allTk.find(u=>u.subject===subject);find(host,'button',foreign.majorTitle).handlers.click();await tick();ok(screen(host).includes(foreign.title),subject+' tokkun unit is selectable');}
 find(host,'button','数学').handlers.click();await tick();
 const target=tk.find(u=>u.id==='tokkun-math-1-numworld')||tk[0];
 find(host,'button',target.majorTitle).handlers.click();await tick();find(host,'button',t=>t.startsWith(target.title)).handlers.click();await tick();
 const make=find(host,'button','作成する');ok(make,'create button shown');ok(c.activity()===null,'conditions alone are not learning time');make.handlers.click();await tick();
 const shown=screen(host);
 ok(target.questions.some(q=>shown.includes(q.prompt)),'a tokkun question is shown after creating');
 ok(JSON.stringify(c.activity())===JSON.stringify({id:'question:'+target.id,kind:'question',subject:'数学'}),'learning activity contains verified unit metadata only');
 const activityBefore=JSON.stringify(c.activity());for(let i=0;i<100;i++)c.activity();ok(JSON.stringify(c.activity())===activityBefore,'reading activity does not advance the question or progress');
 find(host,'button','教科書').handlers.click();await tick();
 ok(!tk.some(u=>screen(host).includes(u.title)),'switching back to 教科書 hides the tokkun units');
 ok(c.activity()===null,'switching back to conditions ends the activity');
 c.destroy();
 ok(c.activity()===null,'destroyed controller cannot expose an activity');
 console.log('Material tokkun: '+checks+' checks ❌ 0 — 特訓'+allTk.length+'小単元（各70問）・出典の厳しい検査・特訓だけ教科書ページを出典にできる・特訓の一覧と出題・教科書に混ざらない');
})().catch(e=>{console.error(e);process.exit(1);});
