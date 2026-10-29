// 問題の図（q.image / q.imageAlt）が、バンク作成・検査・画面表示・配信の各段階で保たれるかを写しで確かめる（Claude 2026-10-28）。本体は変えない。
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const H=__dirname;let n=0;const res=[];const ok=(c,m)=>{n++;res.push({check:m,ok:!!c});};
// 合成の問題（本物の問題ではない）
const q={id:'tokkun-math-1-circle-fig-test',type:'input',prompt:'右の図で、半径は何 cm か。',answer:{kind:'number',value:'5'},explanation:'①図の OA が半径　②OA ＝ 5　③答え 5 cm',image:'/tokkun-fig-circle-01.svg',imageAlt:'中心O、点A、OA ＝ 5 cm の円'};
// 1) バンク作成：build-material-assets.py の写しを一時フォルダで動かす（確認済み→site-assets と cf-worker の両方）
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'figbank-'));
const src=fs.readFileSync(path.join(H,'build-material-assets.copy.py'),'utf8');
fs.mkdirSync(path.join(tmp,'教材整理/確認済み'),{recursive:true});fs.mkdirSync(path.join(tmp,'site-assets'));fs.mkdirSync(path.join(tmp,'cf-worker/src'),{recursive:true});fs.mkdirSync(path.join(tmp,'教材整理/scripts'),{recursive:true});
fs.writeFileSync(path.join(tmp,'教材整理/教材照合台帳.json'),JSON.stringify([{id:'source-test',file:'x.jpg',sha256:'0'.repeat(64),mode:'textbook',subject:'数学',grade:1,pages:[170],verified:true}]));
const qb={...q,source:{id:'source-test',page:170}};
fs.writeFileSync(path.join(tmp,'教材整理/確認済み/x.json'),JSON.stringify({id:'x',status:'ready',subject:'数学',grade:1,mode:'tokkun',questions:[qb],tests:[]}));
fs.mkdirSync(path.join(tmp,'教材整理/実装'));for(const f of ['material-engine.js','material-ui.js','material-ui.css'])fs.writeFileSync(path.join(tmp,'教材整理/実装',f),'// 写し\n');
fs.writeFileSync(path.join(tmp,'教材整理/scripts/b.py'),src);
let built=null;try{cp.execFileSync('python3',[path.join(tmp,'教材整理/scripts/b.py')],{cwd:tmp,stdio:'pipe'});built=JSON.parse(fs.readFileSync(path.join(tmp,'site-assets/material-bank.json'),'utf8'));}catch(e){res.push({check:'バンク作成の写しが一時フォルダで動かない',ok:false,detail:String(e.stderr||e).slice(0,400)});}
if(built){const bq=built.units[0].questions[0];ok(bq.image===q.image&&bq.imageAlt===q.imageAlt,'1. バンク作成（site-assets）で image と imageAlt が残る');
 const srv=fs.readFileSync(path.join(tmp,'cf-worker/src/material-bank.mjs'),'utf8');ok(srv.includes(q.image)&&srv.includes(q.imageAlt),'1. バンク作成（サーバー用）でも残る');}
// 2) エンジンの validateUnit が image 項目でエラーを出さないか
const e=require('./material-engine.copy.js');const errs=(e.validateUnit({id:'x',subject:'数学',grade:1,title:'t',mode:'tokkun',status:'draft',questions:[q]},{sources:[]})||[]);
ok(!errs.some(x=>/image/i.test(x)),'2. validateUnit が image を理由に落とさない（ほかの理由：'+errs.filter(x=>!/image/i.test(x)).slice(0,3).join(' / ')+'）');
// 3) 画面：material-ui.js の写しから、図を出す条件の式を取り出して試す
const ui=fs.readFileSync(path.join(H,'material-ui.copy.js'),'utf8');const m=ui.match(/if\(q\.image&&(\/\^.*?\$\/)\.test\(q\.image\)&&!q\.image\.includes\('\.\.'\)\)/);
ok(!!m,'3. 画面の表示条件を写しから見つけた');
if(m){const re=eval(m[1]);const show=p=>!!p&&re.test(p)&&!p.includes('..');
 ok(show('/tokkun-fig-circle-01.svg'),'3. 直下の英数字パスは表示される');ok(show('/figures/tokkun/circle-01.svg'),'3. サブフォルダのパスも画面の条件は通る');
 ok(!show('tokkun-fig.svg'),'3. / で始まらないパスは出ない');ok(!show('/図/円.svg'),'3. 日本語のパスは出ない');ok(!show('/../x.svg'),'3. .. をふくむパスは出ない');ok(!show('https://example.com/x.svg'),'3. 外のサイトの画像は出ない');
 ok(/img\.alt=q\.imageAlt\|\|'問題の図'/.test(ui),'3. imageAlt が alt に入る');}
// 4) 配信：本番 deploy.sh は site-assets をフォルダごと写す／確認版 build.py は直下のファイルだけ
const dep=fs.readFileSync(path.join(H,'deploy.copy.sh'),'utf8');ok(/cp -R site-assets\/\* site\//.test(dep),'4. 本番の配信は site-assets/ の中をフォルダごと写す（サブフォルダの図も届く）');
const pb=fs.readFileSync(path.join(H,'preview-build.copy.py'),'utf8');const onlyTop=/for source in \(ROOT \/ 'site-assets'\)\.iterdir\(\):\s*\n\s*if source\.is_file\(\)/.test(pb);
ok(onlyTop,'4. 確認版のビルドは site-assets の直下のファイルだけを写す（サブフォルダの図は確認版に届かない）');
// 5) 図ファイル：SVG の中に外部参照・スクリプトがない
const svg=fs.readFileSync(path.join(H,'sample-fig.svg'),'utf8');ok(!/<script|href=|xlink|on\w+=/i.test(svg),'5. 見本SVGにスクリプト・外部参照がない');
const bad=res.filter(r=>!r.ok);fs.writeFileSync(path.join(H,'result.json'),JSON.stringify({checks:n,failed:bad.length,results:res},null,1)+'\n');
res.forEach(r=>console.log(r.ok?'✓':'✗',r.check,r.detail||''));console.log(`検査 ${n} / ✗ ${bad.length}`);process.exit(bad.length?1:0);
