// Operator-side candidate only. Never expose this function through a learner
// API or accept operatorConfirmed from a browser request body.
const UID=/^(u[12]|p_(free|mini|standard|pro|unlimit))$/;
const VERSION='2026-10-14';
export function approvalStatement(assertion){
 if(!assertion||Object.keys(assertion).sort().join(',')!=='ageBand,guardianConsent,minimumAgeConfirmed'||assertion.minimumAgeConfirmed!==true||!['13-17','adult'].includes(assertion.ageBand)||typeof assertion.guardianConsent!=='boolean'||assertion.ageBand==='13-17'&&assertion.guardianConsent!==true)throw Error('consent_required');
 return {version:VERSION,approved:true,ageBand:assertion.ageBand,guardianConsent:assertion.guardianConsent};
}
export async function registerPreviewApproval(env,uid,assertion,{operatorConfirmed=false}={}){
 if(operatorConfirmed!==true||env?.APP_ORIGIN!=='https://nobilog-preview.naon4022.workers.dev'||env?.SUBSCRIPTION_PREVIEW!=='1'||env?.PREVIEW_PLAN_ACCOUNTS!=='1'||env?.OPENAI_ENABLED!=='0'||env?.GEMINI_ENABLED!=='0'||!env.AUTH_DB||!UID.test(uid))return {error:'approval_not_authorized'};
 let record;try{record=approvalStatement(assertion);}catch(_){return {error:'consent_required'};}
 const key='openai-access:'+uid,value=JSON.stringify(record),db=env.AUTH_DB;
 try{
  const saved=await db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO NOTHING RETURNING 1 AS saved').bind(key,value).first('saved');
  if(saved)return {ok:true,created:true};
  // Equality comparison uses the known new statement; never reads an existing
  // approval's content or silently replaces a revocation/different statement.
  const same=await db.prepare('SELECT 1 AS same FROM auth_kv WHERE k=? AND v=?').bind(key,value).first('same');
  return same?{ok:true,created:false}:{error:'approval_conflict'};
 }catch(_){return {error:'approval_save_unconfirmed'};}
}
