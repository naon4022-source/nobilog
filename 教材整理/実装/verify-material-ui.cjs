const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function element(tag){
 return {tag,textContent:'',children:[],handlers:{},append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},setAttribute(){},addEventListener(name,fn){this.handlers[name]=fn;}};
}
function descendants(node){return [node,...node.children.flatMap(descendants)];}
const find=(host,tag,label)=>descendants(host).find(node=>node.tag===tag&&(!label||node.textContent===label));
const screen=host=>descendants(host).map(node=>node.textContent).join('\n');
const tick=()=>new Promise(resolve=>setImmediate(resolve));

async function create(status,load,withTests=false,extra={}){
 const context={document:{createElement:element},NobiMaterialEngine:{completion:require('./material-engine').completion,validateUnit(){return [];},address(_unit,q){return '国語 2p '+q.id;},grade(){return {correct:true};}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'material-ui.js'),'utf8'),context);
 const host=element('host');
 const questions=[{id:'q1',type:'input',prompt:'第一問'},{id:'q2',type:'input',prompt:'第二問'},...Array.from({length:13},(_,i)=>({id:'q'+(i+3),type:'input',prompt:'追加問題'+i}))];
 const unit={id:'kokugo',status:'ready',mode:'workbook',grade:1,subject:'国語',title:'確認済み単元',questions,tests:withTests?Array.from({length:15},(_,i)=>({id:'t'+(i+1),type:'input',prompt:i?'別問題'+i:'別問題',explanation:'解説文'})):[],textbook:{status,sections:[{title:'未確認の見出し',body:'未確認の本文'}]}};
 let saves=0,saved;
 const bridge={identity(){return 'test';},load,async save(value){saves++;saved=value;},...extra};
 const controller=context.NobiMaterialUI.mount(host,[unit],bridge,[]);
 await tick();
 const createButton=find(host,'button','作成する');if(createButton&&!createButton.disabled){createButton.handlers.click();await tick();}
 return {host,controller,get saves(){return saves;},get saved(){return saved;}};
}

(async()=>{
 let test=await create('draft',async()=>({}));
 const draftButton=find(test.host,'button','教科書を読む');
 assert.ok(draftButton?.disabled);
 draftButton.handlers.click();
 assert.ok(!screen(test.host).includes('未確認の本文'));
 test.controller.destroy();

 test=await create('ready',async()=>({}));
 find(test.host,'button','教科書を読む').handlers.click();
 assert.ok(screen(test.host).includes('未確認の本文'));
 test.controller.destroy();

 test=await create('draft',async()=>({kokugo:{done:['q1']}}));
 assert.ok(screen(test.host).includes('第二問'));
 {const sc=screen(test.host);assert.ok(sc.indexOf('第二問')<sc.indexOf('第一問'));}   // 2026-10-21：全部並べて表示。正解ずみの問題は後ろに回る
 find(test.host,'textarea').value='回答';
 find(test.host,'form').handlers.submit({preventDefault(){}});
 await tick();
 assert.equal(test.saves,1);
 assert.ok(screen(test.host).includes('追加問題0'));
 test.controller.destroy();

 test=await create('draft',async()=>({kokugo:{done:['q1'],testDone:[]}}),true);
 assert.equal(find(test.host,'button','テスト').disabled,false);
 find(test.host,'button','テスト').handlers.click();find(test.host,'button','作成する').handlers.click();await tick();
 assert.ok(screen(test.host).includes('別問題'));
 assert.ok(screen(test.host).includes('国語 2p t1'));
 find(test.host,'textarea').value='回答';
 find(test.host,'form').handlers.submit({preventDefault(){}});
 await tick();
 assert.equal(test.saves,1);
 assert.equal(JSON.stringify(test.saved.kokugo.done),'["q1"]');
 assert.equal(JSON.stringify(test.saved.kokugo.testDone),'["t1"]');
 assert.ok(screen(test.host).includes('別問題1'));
 assert.ok(screen(test.host).includes('解説文'));
 find(test.host,'button','問題').handlers.click();find(test.host,'button','作成する').handlers.click();await tick();
 assert.ok(screen(test.host).includes('第二問'));
 test.controller.destroy();

 test=await create('draft',async()=>({kokugo:{done:'broken'}}),true);
 find(test.host,'textarea').value='回答';
 find(test.host,'form').handlers.submit({preventDefault(){}});
 await tick();
 assert.equal(JSON.stringify(test.saved.kokugo.done),'["q1"]');
 test.controller.destroy();

 test=await create('draft',async()=>{throw Error('offline');});
 assert.ok(screen(test.host).includes('読み込めませんでした'));
 assert.equal(find(test.host,'form'),undefined);
 assert.equal(test.saves,0);
 test.controller.destroy();
 let reviewCalls=[],failSave=true;
 const reviewRow={unitId:'kokugo',subject:'国語',unitTitle:'確認済み単元',questionId:'q1',mode:'study',question:{id:'q1',prompt:'第一問'},before:{answer:'<script>誤答</script>',at:1000},firstBefore:{answer:'最初の回答',at:500},latestImprovement:{answer:'正しい回答',at:2000},reviewDay:3,dueAt:3000,due:true};
 test=await create('draft',async()=>({kokugo:{done:['q1']}}),false,{
  async review(_uid,options){reviewCalls.push(options.view);return {items:[reviewRow],next:null};},
  async save(){if(failSave)throw Error('offline');}
 });
 assert.ok(screen(test.host).includes('第二問'));
 find(test.host,'button','誤答の復習').handlers.click();await tick();
 assert.ok(screen(test.host).includes('3日後の復習'));
 assert.ok(screen(test.host).includes('最初の誤答：最初の回答'));
 assert.ok(screen(test.host).includes('その後の正解：正しい回答'));
 assert.equal(descendants(test.host).some(n=>n.tag==='script'),false);
 find(test.host,'button','この問題を復習する').handlers.click();
 assert.ok(screen(test.host).includes('第一問'));assert.ok(!screen(test.host).includes('第二問'));
 find(test.host,'textarea').value='正しい回答';find(test.host,'form').handlers.submit({preventDefault(){}});await tick();
 assert.ok(screen(test.host).includes('保存できませんでした'));
 assert.equal(find(test.host,'textarea').value,'正しい回答');
 failSave=false;find(test.host,'form').handlers.submit({preventDefault(){}});await tick();
 assert.ok(reviewCalls.filter(v=>v==='due').length>=2);assert.ok(reviewCalls.includes('all'));assert.ok(screen(test.host).includes('自分の回答の変化'));
 test.controller.destroy();
 let finishReview;
 test=await create('draft',async()=>({}),false,{review(){return new Promise(resolve=>{finishReview=resolve;});}});
 find(test.host,'button','誤答の復習').handlers.click();
 find(test.host,'button','問題へ戻る').handlers.click();
 finishReview({items:[reviewRow],next:null});await tick();
 assert.ok(!screen(test.host).includes('自分の回答の変化'));
 test.controller.destroy();
 test=await create('draft',async()=>({}),false,{async review(){throw Error('offline');}});
 find(test.host,'button','誤答の復習').handlers.click();await tick();
 assert.ok(screen(test.host).includes('復習を読み込めませんでした'));
 assert.ok(find(test.host,'button','再試行'));test.controller.destroy();
 let dailyCalls=0,releaseDaily;
 test=await create('draft',async()=>({}),false,{daily(){dailyCalls++;if(dailyCalls===1)return new Promise(resolve=>releaseDaily=resolve);return Promise.resolve({});}});
 find(test.host,'textarea').value='回答';find(test.host,'form').handlers.submit({preventDefault(){}});await tick();
 assert.equal(dailyCalls,1);releaseDaily({});await tick();assert.equal(dailyCalls,2,'save during earlier daily query queues fresh count');test.controller.destroy();
 console.log('material-ui: textbook gate, independent test progress, resume, save and load failure passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
