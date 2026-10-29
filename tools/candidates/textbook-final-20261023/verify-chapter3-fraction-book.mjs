// Reuse current real-book geometry assertions for the six public images.
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const root=new URL('../../../',import.meta.url),here=new URL('./chapter3-fraction-book/',import.meta.url);
const original=new URL('tools/candidates/math-ch1-layout-20261018/verify-book-images.mjs',root);
let source=await readFile(original,'utf8');
const replace=(a,b)=>{assert.equal(source.split(a).length-1,1,'unchanged image harness anchor');source=source.replace(a,b);};
replace("const root=new URL('../../../',import.meta.url),here=new URL('./',import.meta.url),assets=new URL('site-assets/',root);",'const root=new URL('+JSON.stringify(root.href)+'),here=new URL('+JSON.stringify(here.href)+'),assets=new URL("site-assets/",root);');
replace('createRequire(import.meta.url)','createRequire('+JSON.stringify(original.href)+')');
replace("const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',here),'utf8'));",`const registry=JSON.parse(await fs.readFile(new URL('教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/縦分数_3章_20261023/manifest.json',root),'utf8')).items;
const manifest=Object.entries(registry).map(([id,r])=>({id,file:new URL(r.target,root),copy:new URL(r.copy,root),after:r.afterSha256}));`);
replace('assert.equal(items.length,20);','assert.equal(items.length,6);');
replace('assert.match(await fs.readFile(x.file,\'utf8\'),/viewBox="0 0 1600 900"/);',`const vb=/viewBox="0 0 ([0-9]+) ([0-9]+)"/.exec(await fs.readFile(x.file,'utf8'));assert(vb,'original viewBox retained');x.ratio=Number(vb[1])/Number(vb[2]);`);
replace("const n=await page.evaluate(id=>NobiTextbook._state.book.phys.find(p=>(p.blocks||[]).some(b=>b.id===id))?.n,item.id);",'const n=await page.evaluate(({id,src})=>NobiTextbook._state.book.phys.find(p=>(p.blocks||[]).some(b=>b.id===id||b.src===src))?.n,{id:item.id,src});');
replace('fit.width-fit.height*16/9','fit.width-fit.height*item.ratio');
replace("item.id+' displayed 16:9 within pixel rounding'","item.id+' retained source aspect ratio within pixel rounding: '+JSON.stringify(fit)");
replace("if(['M1-C1-S1-D03','M1-C1-S2-D09'].includes(item.id))",'if(true)');
replace("console.log(width+'px: 20 modified visible diagrams decoded and fit actual pages');","console.log(width+'px: six chapter3 stacked-fraction diagrams decoded and fit actual pages');");
replace("scope:'20 public diagrams x 4 widths; the other two answer diagrams are covered by the 177-check answer harness'","scope:'Six public chapter3 fraction diagrams x four widths plus approved explanation hook x four widths; contain paint geometry checked; chapter1 hidden M06 remains separately covered'");
replace("date:'2026-10-18'","date:'2026-10-24'");
replace('naturalHeight:im.naturalHeight,fit:','naturalHeight:im.naturalHeight,objectFit:getComputedStyle(im).objectFit,fit:');
// Contain preserves image aspect inside a shorter media frame; the frame itself
// need not have the source ratio. Verify the actual painted area, not only its box.
replace('assert(Math.abs(fit.width-fit.height*item.ratio)<2,',`const paintScale=Math.min(fit.width/fit.naturalWidth,fit.height/fit.naturalHeight);fit.paintWidth=fit.naturalWidth*paintScale;fit.paintHeight=fit.naturalHeight*paintScale;
 assert(fit.paintWidth<=fit.width+1&&fit.paintHeight<=fit.height+1,'paint inside image frame');
 assert(Math.abs(fit.paintWidth-fit.paintHeight*item.ratio)<1.5,'intrinsic source aspect retained');
 assert(fit.objectFit==='contain'||Math.abs(fit.width-fit.height*item.ratio)<2,`);
replace('<script src="/textbook-book.js"></script>','<script src="/vertical-fractions.js"></script><script src="/textbook-book.js"></script>');
replace("if(!/^textbook-[a-z0-9-]+\\.(js|css|json|svg|jpg|mp4)$/.test(name))","if(name!=='vertical-fractions.js'&&!/^nobi-[a-z]+\\.svg$/.test(name)&&!/^textbook-[a-z0-9-]+\\.(js|css|json|svg|jpg|webp|mp4)$/.test(name))");
replace("const im=page.locator('.tb-spread img[src=","assert(await page.evaluate(()=>!!globalThis.NobiFractions),'production fraction module loaded');const im=page.locator('.tb-spread img[src=");
replace("jpg:'image/jpeg',mp4:'video/mp4'","jpg:'image/jpeg',webp:'image/webp',mp4:'video/mp4'");
const hookExpected="1より大きい自然数は、素数のかけ算に分けられる。数の「部品」を見つけよう。",hookPrevious="どんな自然数も、素数のかけ算に分けられる。数の「部品」を見つけよう。";
replace(' assert.deepEqual(errors,[]);await page.close();',` const hookText=${JSON.stringify(hookExpected)};
 const hookPage=await page.evaluate(text=>NobiTextbook._state.book.phys.find(p=>(p.blocks||[]).some(b=>b.t==='hook'&&b.x===text))?.n,hookText);assert(hookPage,'approved hook physical page');
 if(width>900){await page.getByLabel('コードでページへ移動').fill('数'+hookPage);await page.getByRole('button',{name:'コードで移動'}).click();}else{await page.evaluate(n=>{const s=NobiTextbook._state,target=s.single?n-1:Math.floor(n/2);s.spread=target-1;},hookPage);await page.getByRole('button',{name:'次のページ'}).click();}
 await page.evaluate(()=>document.getAnimations().forEach(a=>{if(Number.isFinite(a.effect.getTiming().iterations))try{a.finish();}catch{}}));
 const hook=page.locator('.tb-spread').getByText(hookText,{exact:true});await hook.waitFor();
 await hook.locator('..').locator('..').locator('img').evaluateAll(async images=>{for(const img of images){await img.decode();if(!img.naturalWidth)throw Error('hook illustration failed to decode');}});
 const hookFit=await hook.evaluate(n=>{const b=n.getBoundingClientRect(),p=n.closest('.tb-body').getBoundingClientRect();return b.width>0&&b.height>0&&b.left>=p.left-1&&b.right<=p.right+1&&b.top>=p.top-1&&b.bottom<=p.bottom+1;});assert(hookFit,'approved explanation fits page');
 assert.equal(await page.locator('.tb-spread').getByText(${JSON.stringify(hookPrevious)},{exact:true}).count(),0);
 results.push({id:'approved-prime-domain-hook',viewport:[width,height],page:hookPage,fit:hookFit});
 await page.screenshot({path:new URL('book-images/approved-prime-domain-'+width+'.png',here).pathname});
 assert.deepEqual(errors,[]);await page.close();`);
await mkdir(here,{recursive:true});
try{await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}catch(error){console.error(error.message);process.exitCode=1;}
