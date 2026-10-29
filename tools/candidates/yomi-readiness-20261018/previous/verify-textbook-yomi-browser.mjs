// 🔊 教科書の読み上げ（Claude・2026-10-07）：本物の textbook-book.js と国語の本データ・音声（m4a）を使う。外部通信なし。
// 本文：押すと声が出て、いま読んでいる1行の下の線が毎フレームなめらかに伸びる／会話も読める／自分でページをめくると止まる
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=new URL('../../site-assets/',import.meta.url);
const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/textbook-book.css"><section id="view-textbook"><div id="textbook-app" class="tb-app"></div></section><script src="/textbook-book.js"></script>`;
const types={mp3:'audio/mpeg',js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',m4a:'audio/mp4',mp4:'video/mp4',jpg:'image/jpeg',png:'image/png'};
const server=createServer(async(req,res)=>{const name=decodeURIComponent(req.url.split('?')[0].slice(1));if(!name){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
 if(name.includes('..')){res.writeHead(404);res.end();return;}
 try{const b=await readFile(new URL(name,base));const ext=name.split('.').pop();const range=req.headers.range;
  if(range&&(ext==='m4a'||ext==='mp3')){const m=/bytes=(\d*)-(\d*)/.exec(range)||[];const s=Number(m[1]||0),end=m[2]?Math.min(b.length-1,Number(m[2])):b.length-1;res.writeHead(206,{'Content-Type':types[ext],'Content-Range':`bytes ${s}-${end}/${b.length}`,'Accept-Ranges':'bytes','Content-Length':end-s+1});res.end(b.subarray(s,end+1));return;}
  res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Accept-Ranges':'bytes'});res.end(b);}catch(_){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.getByRole('button',{name:'全画面で教科書を開く'}).click();await page.getByRole('button',{name:'国語 1を開く'}).click();await page.locator('.tb-spread').waitFor({timeout:180000});
 const goTo=async rid=>{const n=await page.evaluate(rid=>{const ph=NobiTextbook._state.book.phys;for(let i=0;i<ph.length;i++)for(const b of ph[i].blocks||[])if(b&&(b.rid===rid||(b.rids||[]).includes(rid)))return i+1;return 0;},rid);ok(n>0,'page for '+rid);
  await page.getByLabel('コードでページへ移動').fill(String(n));await page.getByRole('button',{name:'コードで移動'}).click();await page.locator('[data-rid="'+rid+'"]').waitFor();return n;};
 // 1) 本文（蜘蛛の糸）
 await goTo('K1-C5-S5-H01');
 ok(await page.getByRole('button',{name:'本文を読み上げる'}).count()===1,'read-aloud button on a 本文 page');
 await page.getByRole('button',{name:'本文を読み上げる'}).click();
 await page.locator('.tb-yomi-line').waitFor({timeout:20000});
 // 毎フレームの線の長さ（scaleX）を2.5秒ぶん取る
 const samples=await page.evaluate(()=>new Promise(res=>{const out=[];const t0=performance.now();const f=()=>{const l=document.querySelector('.tb-yomi-line');const m=l&&/scaleX\(([\d.]+)\)/.exec(l.style.transform);const top=l&&l.style.top;out.push([performance.now()-t0,m?Number(m[1]):-1,top]);const t=performance.now()-t0;if(t<2500||(out.length<40&&t<8000))requestAnimationFrame(f);else res(out);/* 重い時はフレームが減るので、40フレームそろうまで（最大8秒）取る（2026-10-08） */};requestAnimationFrame(f);}));
 const vals=samples.filter(s=>s[1]>=0);const distinct=new Set(vals.map(s=>s[1])).size;
 ok(vals.length>20&&distinct>=Math.min(20,vals.length*0.4),'line grows smoothly: '+distinct+' distinct widths in '+vals.length+' frames');
 let backwards=0;for(let i=1;i<vals.length;i++)if(vals[i][2]===vals[i-1][2]&&vals[i][1]<vals[i-1][1]-0.001)backwards++;
 ok(backwards===0,'never shrinks on the same line ('+backwards+')');
 const audio=await page.evaluate(()=>{const a=[...document.querySelectorAll('audio')].concat(window.__yomiAudio?[window.__yomiAudio]:[]);return true;});
 ok(await page.getByRole('button',{name:'本文を読み上げる'}).getAttribute('aria-pressed')==='true','button shows reading');
 // 2) 読んでいる段落が次のページへ移ったら、自動でページをめくる（読み上げは続く）
 const turn=await page.evaluate(()=>{const y=NobiTextbook._yomi(),s=NobiTextbook._state,b=s.book;const shown=[...document.querySelectorAll('.tb-page[data-page]')].map(p=>Number(p.dataset.page));
  const ids=Object.keys(y.data.blocks).filter(k=>/-H\d+$/.test(k)).sort((a,c)=>y.data.blocks[a].t0-y.data.blocks[c].t0);
  const later=ids.find(id=>{for(let i=0;i<b.phys.length;i++)for(const x of b.phys[i].blocks||[])if(x&&x.rid===id)return !shown.includes(i+1);return false;});
  if(!later)return null;y.audio.currentTime=y.data.blocks[later].t0+0.2;return {later,shown};});
 ok(turn,'a later paragraph exists on another page');
 await page.locator('[data-rid="'+turn.later+'"]').waitFor({timeout:10000});
 ok(await page.evaluate(()=>NobiTextbook._yomi().on),'reading continues after the automatic page turn');
 const after=await page.evaluate(()=>[...document.querySelectorAll('.tb-page[data-page]')].map(p=>Number(p.dataset.page)));
 ok(JSON.stringify(after)!==JSON.stringify(turn.shown),'pages turned automatically: '+JSON.stringify(turn.shown)+' → '+JSON.stringify(after));
 await page.locator('.tb-yomi-line').waitFor({timeout:10000});
 // 3) 自分でページをめくると止まる
 await page.getByRole('button',{name:'次のページ'}).click();await page.waitForTimeout(400);
 ok(await page.locator('.tb-yomi-line').count()===0,'manual page turn stops reading (line removed)');
 // 3) 会話（しくみ）
 await goTo('K1-C1-S1-T01');
 await page.getByRole('button',{name:'本文を読み上げる'}).click();
 await page.locator('.tb-yomi-line').waitFor({timeout:20000});
 // 読んでいる途中で会話の1行目を押すと、その会話から読む
 await page.locator('[data-rid="K1-C1-S1-T01"]').click();await page.waitForTimeout(1500);
 ok(await page.evaluate(()=>!!document.querySelector('.tb-yomi')?.closest('.tb-page')?.querySelector('[data-rid^="K1-C1-S1-T"]')),'tapping a conversation line reads the conversation');
 await page.getByRole('button',{name:'本文を読み上げる'}).click();await page.waitForTimeout(300);ok(await page.locator('.tb-yomi-line').count()===0,'second press stops');
 ok(errors.length===0,'no page errors: '+errors.join(' / '));
 console.log('verify-textbook-yomi-browser: '+checks+' checks — 本文の読み上げ（自動でページをめくる・線が毎フレームなめらかに伸び、同じ行で縮まない）、手でめくると止まる、会話の読み上げ、もう一度押すと止まる');
}finally{await browser?.close();server.close();}
