// Execute actual entry functions with synthetic dependencies and no persistence.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const H=new URL('./',import.meta.url),bytes=await readFile(new URL('../../../index.html',import.meta.url)),html=bytes.toString();
const extract=(start,end)=>{const a=html.indexOf(start);assert(a>=0);const b=html.indexOf(end,a+start.length);assert(b>a);return html.slice(a,b);};
const change=extract('    function switchView(id) {','    /* ================= 🎯 受験');
const logoutStart=html.indexOf('    async function logoutUser() {');
const logoutEnd=html.indexOf('\n    function ',logoutStart+20);
assert(logoutEnd>logoutStart);const logout=html.slice(logoutStart,logoutEnd);
let checks=0,stops=0;const ok=(v,m)=>{assert(v,m);checks++;};
const context=vm.createContext({window:{NobiEikenVocab:{stopSentencePractice:()=>stops++},NobiFocus:{exit(){}},NobiInput:{clear(){}}},presenceSend(){},isTrial:()=>false,pwaOnline:()=>false,PWA_OFFLINE_OK:[],alert(){},document:{getElementById:()=>null},adminController:{dirty:()=>true},console,setTimeout,clearTimeout});
vm.runInContext(change,context);
context.switchView('calendar');ok(stops===1,'actual switch entry invokes recorder teardown before offline gate');
context.switchView('settings');ok(stops===2,'repeated screen selection invokes teardown');
// Compile the full logout function, but stop before record/auth operations.
vm.runInContext(logout,context);await context.logoutUser();ok(stops===3,'actual logout entry invokes teardown before unsaved-state gate');
const helperAt=html.indexOf('src="/sentence-shadowing.js"'),vocabAt=html.indexOf('src="/eiken-vocab.js"');
ok(helperAt>0&&helperAt<vocabAt,'helper script precedes dependent module');
await writeFile(new URL('index-lifecycle-result.json',H),JSON.stringify({status:'passed',checks,indexSha256:createHash('sha256').update(bytes).digest('hex'),scope:'actual entry functions, synthetic offline/unsaved gates; full page navigation and microphone hardware not tested'},null,2)+'\n');
console.log('Index recording lifecycle:',checks,'checks passed; synthetic only');
