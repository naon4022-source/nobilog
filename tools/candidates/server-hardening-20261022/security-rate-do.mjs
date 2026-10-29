import {DurableObject} from 'cloudflare:workers';
import {consumeGate} from './rate-policy.mjs';
// Bind in a separate configuration only after local verification. No migration
// or deployment is performed by creating this source file.
export class NobiSecurityGate extends DurableObject{
 async consume(group,now){
  return this.ctx.storage.transaction(async transaction=>{
   const previous=await transaction.get(group);
   const result=consumeGate(previous,group,now);
   if(result.allowed)await transaction.put(group,result.state);
   return {allowed:result.allowed,retryAfter:result.retryAfter};
  });
 }
}
