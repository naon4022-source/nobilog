from pathlib import Path
import hashlib,json
base=Path(__file__).resolve().parent
root=base.parents[2]
p=root/'site-assets/profile-photos.js'
s=p.read_text()
patches=[]
def patch(a,b):
 global s
 assert s.count(a)==1,'profile UI anchor changed'
 patches.append({'old':a,'new':b});s=s.replace(a,b)
patch("gen:{open:false,busy:false,msg:'',retry:null,candidates:[]}","gen:{open:false,busy:false,loading:false,ready:api.generatorReady?.()===true,msg:'',retry:null,candidates:[],status:null}")
patch(" async function generate(ta){",''' async function privateCandidates(rows){
  if(!Array.isArray(rows)||rows.length>20||typeof api.imageBlob!=='function')throw Error('candidate');
  return Promise.all(rows.filter(c=>!c.state||c.state==='done').slice(0,6).map(async c=>{
   const match=typeof c.src==='string'&&/^\\/learning-image\\?id=([a-f0-9]{64})$/.exec(c.src);if(!match)throw Error('candidate');
   const blob=await api.imageBlob(match[1]);if(!live())throw Error('changed');
   if(!blob||blob.type!=='image/png'||blob.size<57||blob.size>400*1024)throw Error('candidate');
   const bytes=new Uint8Array(await blob.arrayBuffer());if(!live())throw Error('changed');let binary='';
   for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   return {src:'data:image/png;base64,'+btoa(binary),blob};
  }));
 }
 async function refreshGeneration(){
  if(!live()||S.gen.busy||S.gen.loading||typeof api.generatorStatus!=='function')return;
  S.gen.loading=true;render();
  try{
   const status=await api.generatorStatus();if(!live())return;
   const candidates=await privateCandidates(status.items||[]);if(!live())return;
   S.gen.status=status;S.gen.ready=status.ready===true;S.gen.candidates=candidates;
   const reasons={generator_setup:'AIアイコンの接続設定を確認しています。',budget_limit:'今月のAI費用の見積り上限に達しています。',plan_limit:'今日のAI回分が足りません。',daily_limit:'今日の全体試験10回を使い切りました。',stopped:'安全のためAIを一時停止しています。',consent_required:'AIの利用確認が必要です。',billing_required:'AI提供元への支払い設定を確認しています。',controls_unavailable:'安全な利用上限を確認できないため停止しています。'};
   S.gen.msg=status.ready?'ボタンを押したときだけ1枚作ります。':(reasons[status.reason]||'今はAIアイコンを作れません。');
   if((status.items||[]).some(x=>x.state==='unknown'))S.gen.msg+=' 前の作成結果はまだ確認できません。「保存した候補を確認」で読み直せます。新しい作成は別の依頼になります。';
  }catch(_){if(live()){S.gen.ready=false;S.gen.msg='接続か保存した候補を確認できませんでした。自動で作り直しません。';}}
  finally{if(live()){S.gen.loading=false;render();}}
 }
 async function generate(ta){''')
patch("if(api.generatorReady?.()!==true){", "if(S.gen.ready!==true){")
patch("if(S.gen.busy||!live())return;if(!S.gen.retry", "if(S.gen.busy||S.gen.loading||!live())return;if(!S.gen.retry")
patch("S.gen.candidates=d.candidates.filter(c=>c&&typeof c.src==='string').slice(0,4);S.gen.msg=", "S.gen.candidates=await privateCandidates(d.candidates);if(!live())return;S.gen.msg=")
patch(" async function adopt(c){try{const r=await api.fetchImage(c.src);if(!live())return;await use(new File([r],'candidate.png',{type:r.type||'image/png'}));}", " async function adopt(c){try{if(!c.blob||!live())return;await use(new File([c.blob],'candidate.png',{type:'image/png'}));}")
patch("const ready=api.generatorReady?.()===true;", "const ready=S.gen.ready===true;")
patch("}catch(_){if(live())S.gen.msg='通信が切れました。書いた自己紹介は残っています。もう一度押すと、同じ依頼として送りなおします。';}", "}catch(error){if(live())S.gen.msg=error?.message==='candidate'?'候補を安全に開けませんでした。新しく作り直さず「保存した候補を確認」で確認できます。':'通信が切れました。書いた自己紹介は残っています。もう一度押すと、同じ依頼として送りなおします。';}")
patch("ta.disabled=S.gen.busy||!ready;", "ta.disabled=S.gen.busy||S.gen.loading||!ready;")
patch("generateButton.disabled=S.gen.busy||!ready;", "generateButton.disabled=S.gen.busy||S.gen.loading||!ready;")
patch("g.append(ta,generateButton,gs);", "g.append(el('p','1枚の作成に3回分。今のアイコンは、候補を選んで保存するまで変わりません。','pp-note'),el('p','名前・学校名・連絡先は書かず、好きな色・動物・雰囲気を教えてください。','pp-note'),ta,generateButton,gs);if(typeof api.generatorStatus==='function'){const refresh=btn(S.gen.loading?'確認しています…':'保存した候補を確認',()=>void refreshGeneration());refresh.disabled=S.gen.busy||S.gen.loading;g.append(refresh);}")
patch(" render();\n return {destroy(){S.alive=false;if(S.bitmap)", " render();if(api.plan()==='unlimit'&&typeof api.generatorStatus==='function')void refreshGeneration();\n return {destroy(){S.alive=false;if(S.bitmap)")
(base/'profile-photos.js').write_text(s)
(base/'ui-patches.json').write_text(json.dumps({'sourceSHA':hashlib.sha256(p.read_bytes()).hexdigest(),'patches':patches},indent=2)+'\n')
print('Prepared private candidate UI; runtime untouched')
