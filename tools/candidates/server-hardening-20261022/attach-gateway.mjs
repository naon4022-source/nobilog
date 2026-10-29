import {createSecurityGateway} from './security-gateway.mjs';
export function attachGateway(app){
 const fetch=createSecurityGateway({
  upstream:(request,env,ctx)=>app.fetch(request,env,ctx),
  consume:(key,group,now,env)=>{
   if(!env?.NOBI_SECURITY_GATE)throw Error('security_binding_missing');
   return env.NOBI_SECURITY_GATE.getByName(key).consume(group,now);
  }
 });
 return {...app,fetch};
}
