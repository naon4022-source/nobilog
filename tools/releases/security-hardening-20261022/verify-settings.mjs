import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const H=new URL('./',import.meta.url),source=await readFile(new URL('google-settings.js',H),'utf8');
const {chromium}=createRequire(import.meta.url)('/Users/shimizunaotomoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true});let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
try{for(const id of ['u1','u2','u4'])for(const width of [390,1440]){
 const p=await browser.newPage({viewport:{width,height:900}});let network=0;p.on('request',()=>network++);
 await p.setContent('<!doctype html><meta charset="utf-8"><main id="target"></main>');await p.addScriptTag({content:source});
 await p.evaluate(id=>{window.state={owner:{id,name:'合成本人'+id,generation:1},linked:false,actions:[],confirm:false,fail:false,pending:false};
 window.adapter={owner:()=>state.owner,status:async()=>{if(state.fail)throw Error('synthetic');if(state.pending)return new Promise(r=>state.resolve=r);return {linked:state.linked};},confirmUnlink:async()=>state.confirm,verifyAndApply:async action=>{state.actions.push(action);state.linked=action==='link';return {ok:true};}};
 window.view=NobiGoogleSettings.mount(document.querySelector('#target'),adapter);},id);
 await p.getByText('Googleは未連携です。',{exact:true}).waitFor();ok(await p.getByText('合成本人'+id+'の設定',{exact:true}).isVisible(),'own name '+id+' '+width);
 await p.getByRole('button',{name:'Googleアカウントと連携する',exact:true}).click();await p.getByText('Googleと連携済みです。',{exact:true}).waitFor();ok(await p.evaluate(()=>state.actions.join(',')==='link'),'explicit link action only');
 await p.getByRole('button',{name:'Googleとの連携を解除する',exact:true}).click();ok(await p.evaluate(()=>state.actions.length===1),'cancel unlink does not mutate');
 await p.evaluate(()=>state.confirm=true);await p.getByRole('button',{name:'Googleとの連携を解除する',exact:true}).click();await p.getByText('Googleは未連携です。',{exact:true}).waitFor();ok(await p.evaluate(()=>state.actions.join(',')==='link,unlink'),'confirmed action delegated for verification');
 await p.evaluate(()=>{view.dispose();state.fail=true;view=NobiGoogleSettings.mount(document.querySelector('#target'),adapter);});await p.getByText('連携状態を確認できませんでした。接続を確認してください。',{exact:true}).waitFor();ok(await p.getByRole('button',{name:'Googleアカウントと連携する',exact:true}).count()===0,'failed status not mistaken for unlinked');
 await p.evaluate(()=>{view.dispose();state.fail=false;state.pending=true;view=NobiGoogleSettings.mount(document.querySelector('#target'),adapter);state.owner={id:'other',generation:2};state.resolve({linked:true});});await p.waitForFunction(()=>document.querySelector('#target').children.length===0);ok(true,'late previous-owner state removed');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');ok(network===0,'no external calls');await p.close();
}
await writeFile(new URL('settings-result.json',H),JSON.stringify({status:'passed',checks,scope:'UI candidate; three synthetic users/two widths; adapter fake; not production integration'},null,2)+'\n');console.log('Google settings candidate:',checks,'checks passed');
}finally{await browser.close();}
