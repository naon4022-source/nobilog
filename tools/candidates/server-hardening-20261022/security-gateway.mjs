// New front layer only. The original Worker source is imported unchanged.
import {readBoundedOAuthForm} from './oauth-form-body.mjs';
const authPaths=new Set(['/auth/start','/auth/legacy','/auth/legacy/login','/auth/signup','/auth/login']);
const response=(status,error,retryAfter)=>Response.json({error},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(retryAfter?{'Retry-After':String(retryAfter)}:{})}});
const ipKey=async ip=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('nobilog-security-gate-v1:'+ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
function finish(result,request){
 if(result.status===101)return result;
 const headers=new Headers(result.headers);
 headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
 if(new URL(request.url).protocol==='https:')headers.set('Strict-Transport-Security','max-age=31536000');
 // Keep PDF framing, microphone flows, OAuth redirects, CORS and the response
 // body as supplied by the existing application. Do not rewrite its settings.
 return new Response(result.body,{status:result.status,statusText:result.statusText,headers});
}
export function createSecurityGateway({upstream,consume,clock=()=>Date.now()}){
 if(typeof upstream!=='function'||typeof consume!=='function')throw Error('gate_configuration');
 return async function gate(request,env,ctx){
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'');
  const oauth=/^\/auth\/callback\/(google|line)$/.test(path);
  const deny=(status,error,retryAfter)=>{
   const result=response(status,error,retryAfter);
   const app=String(env?.APP_ORIGIN||'https://nobilog.pages.dev').replace(/\/$/,'');
   if(request.headers.get('Origin')===app){result.headers.set('Access-Control-Allow-Origin',app);result.headers.set('Vary','Origin');}
   return finish(result,request);
  };
  try{
   // Only Cloudflare's trusted connecting-IP header is used for this quota.
   // It never proves identity or grants access, and raw IP is never persisted.
   const key=await ipKey(request.headers.get('CF-Connecting-IP')||'missing');
   const now=clock();
   if(!Number.isSafeInteger(now)||now<0)return deny(503,'security_unavailable');
   const budget=await consume(key,'global',now,env);
   if(budget?.allowed!==true)return deny(budget?.allowed===false?429:503,budget?.allowed===false?'rate_limited':'security_unavailable',budget?.retryAfter);
   if(authPaths.has(path)||oauth){
    const auth=await consume(key,'auth',now,env);
    if(auth?.allowed!==true)return deny(auth?.allowed===false?429:503,auth?.allowed===false?'rate_limited':'security_unavailable',auth?.retryAfter);
   }
   if(oauth&&request.method==='POST'){
    let form;try{form=await readBoundedOAuthForm(request);}catch(error){return deny([400,408,413,415].includes(error.oauthBodyStatus)?error.oauthBodyStatus:400,'invalid_oauth_body');}
    const headers=new Headers(request.headers);headers.delete('Content-Length');
    request=new Request(request,{headers,body:form.toString()});
   }
   return finish(await upstream(request,env,ctx),request);
  }catch(_){return deny(503,'security_unavailable');}
 };
}
