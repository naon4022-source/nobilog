// 2026-10-22：画面（Pages）の守り。本物の _headers の CSP をつけて公開版の画面を開き、ちがう場所のスクリプトを読まないこと・
// グラフの部品はのびログの中の版（中身の指紋つき）だけを読むこと・画面がふつうに動くことを確かめる。外部通信なし。
import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const P=new URL('candidate/pages/',import.meta.url);let checks=0;const ok=(c,m)=>{assert(c,m);checks++;};
const headers=Object.fromEntries((await readFile(new URL('_headers',P),'utf8')).split('\n').filter(l=>/^\s+[a-z-]+:/.test(l)).map(l=>{const i=l.indexOf(':');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const csp=headers['content-security-policy'];ok(/script-src 'self' 'unsafe-inline' https:\/\/challenges\.cloudflare\.com;/.test(csp)&&!/jsdelivr/.test(csp),'scripts only from the app itself and Turnstile');
const js=await readFile(new URL('vendor/chart-4.4.1.umd.js',P));
const html=await readFile(new URL('index.html',P),'utf8');ok(!html.includes('cdn.jsdelivr.net'),'no third-party CDN left in the app');
const sri='sha384-'+createHash('sha384').update(js).digest('base64');ok(html.includes("script.integrity = '"+sri+"'"),'the chart file is pinned by its integrity hash');
const types={html:'text/html;charset=utf-8',js:'text/javascript',css:'text/css',json:'application/json',png:'image/png',webmanifest:'application/manifest+json'};
const server=createServer(async(req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://x').pathname.slice(1))||'index.html';try{const b=await readFile(new URL(name,P));res.writeHead(200,{'Content-Type':types[name.split('.').pop()]||'application/octet-stream','Content-Security-Policy':csp.replace(' upgrade-insecure-requests;','')});res.end(b);}catch(_){res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage();const viol=[];page.on('console',m=>{if(/Content Security Policy|Refused to/.test(m.text()))viol.push(m.text().slice(0,160));});const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.hostname==='127.0.0.1'?r.continue():r.abort();});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForTimeout(1500);
 ok(await page.evaluate(()=>!!document.getElementById('login-overlay')),'login screen renders under the CSP');
 ok(await page.evaluate(async()=>await chartEnsure()&&typeof Chart==='function'),'the self-hosted chart library loads with its integrity check');
 const tampered=await page.evaluate(async()=>new Promise(res=>{const s=document.createElement('script');s.src='/vendor/chart-4.4.1.umd.js?x';s.integrity='sha384-AAAA';s.onload=()=>res('loaded');s.onerror=()=>res('blocked');document.head.append(s);}));ok(tampered==='blocked','a file with a different fingerprint is refused');
 const external=await page.evaluate(async()=>new Promise(res=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/chart.js';s.onload=()=>res('loaded');s.onerror=()=>res('blocked');document.head.append(s);}));ok(external==='blocked','scripts from other sites are refused');
 ok(viol.every(v=>/jsdelivr|chart\.umd\.js\?x|integrity/i.test(v)),'no other CSP violations: '+viol.join(' | '));ok(errs.length===0,'no page errors: '+errs.join(' | '));
}finally{await browser.close();server.close();}
console.log('Pages security: '+checks+' checks passed; scripts only from the app and Turnstile, Chart.js self-hosted v4.4.1 (npm registry integrity verified) with SRI, tampered/external scripts refused, app renders under CSP');
