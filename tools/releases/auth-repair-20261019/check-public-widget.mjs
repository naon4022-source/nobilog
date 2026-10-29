// Fresh browser, no credentials/session/PIN. Only public widget lifecycle is observed.
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({serviceWorkers:'block'});
 await page.route('**/*.workers.dev/**',route=>{const u=new URL(route.request().url());return u.pathname==='/auth/legacy'&&route.request().method()==='POST'?route.continue():route.abort();});
 await page.goto('https://nobilog.pages.dev/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof authShowLegacy==='function');await page.evaluate(()=>authShowLegacy());
 await page.waitForTimeout(12000);
 const result=await page.evaluate(()=>({publicOrigin:location.origin,widgetApiLoaded:!!window.turnstile,widgetCreated:turnstileWidgetId!==null,hasChallengeResponse:!!turnstileToken,loginMessage:document.getElementById('login-err').innerText,enteredPin:false,enteredAccount:false}));
 // A deliberately non-four-digit string cannot be a registered four-digit PIN.
 if(result.hasChallengeResponse)result.siteverifyPathStatus=await page.evaluate(async()=>{try{const r=await fetch(SYNC_URL.replace(/\/$/,'')+'/auth/legacy',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({pin:'synthetic-invalid-not-a-real-pin',turnstile:turnstileToken})});turnstileToken='';return r.status;}catch{return 0;}});
 await writeFile(new URL('public-widget-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();}
