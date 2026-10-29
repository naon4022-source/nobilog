import fs from 'node:fs';import{createRequire}from'node:module';import{pathToFileURL}from'node:url';
const{chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=new URL('./',import.meta.url);const items=JSON.parse(fs.readFileSync(new URL('69本_制作進捗.json',base))).items;
const browser=await chromium.launch();let checks=0;const errors=[];function check(ok,msg){checks++;if(!ok)errors.push(msg)}const near=(a,b)=>Math.abs(a-b)<1e-7;
const hidden={
'M1-C1-S2-V03':/^−1$/,'M1-C1-S2-V06':/[＝=]\s*3$/,'M1-C1-S2-V07':/^19$/,'M1-C1-S2-V08':/−800/,'M1-C1-S3-V01':/^21$|平均[^。]*21/,
'M1-C2-S1-V03':/^11$/,'M1-C2-S2-V04':/6x[−-]2/,'M1-C3-S1-V03':/x[＝=][−-]4/,
'M1-C3-S2-V01':/^12$|^87$|12人|87枚/,'M1-C3-S2-V02':/10分|1500|1500m/,'M1-C3-S2-V03':/^40$|^140$|40g|140g|40グラム|140グラム/};
for(const {id}of items){const sc=JSON.parse(fs.readFileSync(new URL(id+'.json',base)));check(sc.id===id,id+' ID');check(sc.settings==='音声共有/設定.json',id+' 音声設定');const tl={steps:sc.steps.map((s,i)=>({...s,start:i*6,end:(i+1)*6}))};const page=await browser.newPage();await page.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());await page.addInitScript(t=>{window.TL=t;window.drawTexts=[];const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(s,...v){if(this.globalAlpha>.05)drawTexts.push(String(s));return f.call(this,s,...v)}},tl);await page.goto(new URL(id+'.html',base).href);await page.evaluate(()=>document.fonts.ready);
for(let i=0;i<sc.steps.length;i++){check(sc.steps[i].say.length>0,id+' 台本'+i);for(const p of [0,.15,.5,.85,1]){const r=await page.evaluate(({i,p})=>{drawTexts=[];g.setTransform(1,0,0,1,0,0);const state=SCENE.draw({i,p,t:i*6+p*6,tl:TL,step:TL.steps[i]});caption(TL.steps[i].say);return{state,texts:drawTexts}}, {i,p});check(!!r.state,id+' 描画'+i);if(hidden[id])check(!r.texts.some(t=>hidden[id].test(t)),id+' 答え非表示 '+i+' '+p);const st=r.state;
if(st.original&&st.transformed&&p===1){const lengths=arr=>arr.map((a,j)=>Math.hypot(a[0]-arr[(j+1)%3][0],a[1]-arr[(j+1)%3][1]));const a=lengths(st.original),b=lengths(st.transformed);check(a.every((v,j)=>near(v,b[j])),id+' 移動後の3辺');}
if(st.vertices){const v=st.vertices,ss=v.map((a,j)=>Math.hypot(a[0]-v[(j+1)%4][0],a[1]-v[(j+1)%4][1]));check(ss.every(s=>near(s,st.radius)),id+' ひし形の4辺');}
if(st.total!==undefined&&st.people)check(st.people*st.each===24,id+' クッキーの合計');
if(st.speedFactor!==undefined)check(near(st.speedFactor*st.timeFactor,1),id+' 速さを変えても道のりは一定');
if(st.peopleBefore!==undefined)check(near(st.peopleBefore*st.daysBefore,st.peopleAfter*st.daysAfter),id+' 人数と日数の積');
if(st.unitGrams&&st.paperCount!==null&&st.totalGrams!==null)check(near(st.unitGrams*st.paperCount,st.totalGrams),id+' 紙の枚数と重さ');
if(st.uniqueOutput&&st.input!==undefined)check(st.output===4*st.input,id+' 正方形の周の長さ');
if(st.points)check(st.points.every(([x,y])=>near(y,st.a*x)),id+' 比例座標');
if(st.left!==undefined&&st.right!==undefined&&st.x!==undefined){check(st.left===3*st.x-5&&st.right===st.x+3,id+' 方程式の両辺');check(st.equal===(st.x===4),id+' 解の判定');}
if(st.Bp){check(near(st.B[0],st.Bp[0])&&near((st.B[1]+st.Bp[1])/2,340),id+' 反射軸');const va=[st.P[0]-st.A[0],st.P[1]-st.A[1]],vb=[st.Bp[0]-st.P[0],st.Bp[1]-st.P[1]];check(near(va[0]*vb[1]-va[1]*vb[0],0),id+' A・P・B′一直線');check(near(Math.hypot(st.B[0]-st.P[0],st.B[1]-st.P[1]),Math.hypot(st.Bp[0]-st.P[0],st.Bp[1]-st.P[1])),id+' PB＝PB′');}
if(st.sectors)check([8,16,32].includes(st.sectors)&&near(st.totalAngle,2*Math.PI),id+' 円の分割');
}}
await page.close();}
await browser.close();const out={status:errors.length?'失敗':'制作ソースの数学条件点検成功',scope:'実音声動画の完成点検ではない',videos:items.length,checks,errors};const dir=new URL('../点検/69本_制作ソース配置/',base);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(new URL('数学条件.json',dir),JSON.stringify(out,null,2));console.log(JSON.stringify(out));if(errors.length)process.exit(1);
