// Claude（Anthropic Messages API）への接続（2026-10-22 Claude・候補。鍵の登録・有効化はしていない）
const ENDPOINT='https://api.anthropic.com/v1/messages',MODELS=new Set(['claude-haiku-5-5','claude-sonnet-5-5']),MAX_BYTES=64*1024;
export async function anthropicMessage({apiKey,model,system,messages,maxTokens=800,signal,fetchImpl=fetch}){
 if(typeof apiKey!=='string'||!apiKey)return {error:'ai_not_configured'};
 if(!MODELS.has(model))return {error:'ai_model_not_allowed'};
 if(!Array.isArray(messages)||!messages.length||messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>6000))return {error:'ai_bad_request'};
 if(!Number.isInteger(maxTokens)||maxTokens<1||maxTokens>2000)return {error:'ai_bad_request'};
 let res;
 try{res=await fetchImpl(ENDPOINT,{method:'POST',redirect:'error',signal,headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model,max_tokens:maxTokens,...(typeof system==='string'&&system?{system}:{}),messages})});}
 catch{return {error:signal&&signal.aborted?'ai_timeout':'ai_network'};}
 // 返事は64KBまでだけ読む。こえたら読むのをやめる
 const reader=res.body&&res.body.getReader?res.body.getReader():null;let bytes=new Uint8Array(0);
 if(reader){try{for(;;){const {done,value}=await reader.read();if(done)break;const next=new Uint8Array(bytes.length+value.length);next.set(bytes);next.set(value,bytes.length);bytes=next;if(bytes.length>MAX_BYTES){await reader.cancel();return {error:'ai_response_too_large'};}}}catch{return {error:signal&&signal.aborted?'ai_timeout':'ai_network'};}}
 if(!res.ok)return {error:res.status===429?'ai_rate_limited':res.status===401||res.status===403?'ai_not_configured':res.status===529||res.status>=500?'ai_provider_down':'ai_failed',status:res.status};   // 相手の本文はそのまま返さない
 let data;try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{return {error:'ai_failed'};}
 if(!data||data.type!=='message'||data.model&&!String(data.model).startsWith(model.replace(/-\d+-\d+$/,'')))return {error:'ai_failed'};
 const text=(Array.isArray(data.content)?data.content:[]).filter(c=>c&&c.type==='text'&&typeof c.text==='string').map(c=>c.text).join('');
 if(!text)return {error:'ai_failed'};
 const usage=data.usage&&Number.isSafeInteger(data.usage.input_tokens)&&Number.isSafeInteger(data.usage.output_tokens)?{input_tokens:data.usage.input_tokens,output_tokens:data.usage.output_tokens}:null;
 return {text,usage,stop:data.stop_reason||null};
}
