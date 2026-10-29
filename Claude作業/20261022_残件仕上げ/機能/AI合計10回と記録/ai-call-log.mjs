// Claude と ChatGPT を合わせて1日10回まで・1回ずつ記録（2026-10-22 Claude・候補）
// ・回数の上限・同時実行1つ・3回続けて失敗したら止める、は今ある ai-trial-control.mjs の runRealAITrial をそのまま使う（提供元に関係なく合計で数える）。
// ・記録：ai-log:<日本時間の日付>:<id> に {提供元, モデル, 用途, 本人UID, 結果, 理由コード, 時間ms, トークン数} だけ。問題文・答え・AIの返事・鍵は入れない。
// ・結果：unsent（上限・停止・混雑で送らなかった）／success／failed（送ったが失敗）／unknown（送ったあと結果が返らなかった＝あとで見ると pending のまま）
const PROVIDERS={anthropic:new Set(['claude-haiku-5-5','claude-sonnet-5-5']),openai:new Set(['gpt-6-luna','gpt-6.1-sol'])};   // ChatGPT 側は今の openai-policy.mjs と同じ名前
const day=now=>new Date(now+32400000).toISOString().slice(0,10);
async function put(db,key,rec){await db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(key,JSON.stringify(rec)).run();}
export async function loggedCall(db,{provider,model,purpose,uid},work,{now=Date.now(),run}){
 if(!PROVIDERS[provider]||!PROVIDERS[provider].has(model))return {error:'ai_model_not_allowed'};
 if(typeof purpose!=='string'||!/^[a-z-]{1,40}$/.test(purpose)||typeof uid!=='string'||!/^[a-z0-9_]{1,40}$/.test(uid))return {error:'ai_bad_request'};
 const id=crypto.randomUUID(),key='ai-log:'+day(now)+':'+id,base={v:1,id,at:now,provider,model,purpose,uid};
 await put(db,key,{...base,outcome:'pending'});
 let sent=false;const t0=performance.now();
 const result=await run(db,async signal=>{sent=true;await put(db,key,{...base,outcome:'pending',sentAt:now});return await work(signal);},now);
 const ms=Math.round(performance.now()-t0);
 const usage=result&&result.usage&&Number.isSafeInteger(result.usage.input_tokens)&&Number.isSafeInteger(result.usage.output_tokens)?{input:result.usage.input_tokens,output:result.usage.output_tokens}:null;
 const reason=result&&typeof result.error==='string'&&/^[a-z_]{1,40}$/.test(result.error)?result.error:null;
 await put(db,key,{...base,outcome:!sent?'unsent':reason?'failed':'success',reason,ms,usage});
 return result;
}
export async function callLog(db,date){
 const rows=(await db.prepare("SELECT v FROM auth_kv WHERE k>=? AND k<? ORDER BY k").bind('ai-log:'+date+':','ai-log:'+date+';').all()).results||[];
 return rows.map(r=>{const x=JSON.parse(r.v);return x.outcome==='pending'?{...x,outcome:x.sentAt?'unknown':'unsent'}:x;});   // 送ったあと返らなかったものは unknown（無料扱いにしない）
}
