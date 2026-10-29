// Isolated workerd fixture only. Never used as a production application entry.
import {createSecurityGateway} from './security-gateway.mjs';
export {NobiSecurityGate} from './security-rate-do.mjs';
const app={fetch:async()=>Response.json({fixture:true})};
const fetch=createSecurityGateway({upstream:app.fetch,clock:()=>1000,consume:(key,group,now,env)=>env.NOBI_SECURITY_GATE.getByName(key).consume(group,now)});
export default {fetch(request,env,ctx){
 if(env.FIXTURE_ONLY!=='true'||!['localhost','127.0.0.1'].includes(new URL(request.url).hostname))return new Response(null,{status:404});
 return fetch(request,env,ctx);
}};
