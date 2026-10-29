// Dedicated security state only. No auth, learning, money or admin records.
export const gatePolicies=Object.freeze({
 global:Object.freeze({capacity:120,refillPerSecond:120}),
 auth:Object.freeze({capacity:20,refillPerSecond:1/3})
});
export function consumeGate(previous,group,now){
 if(!Object.prototype.hasOwnProperty.call(gatePolicies,group)||!Number.isSafeInteger(now)||now<0)throw Error('gate_input');
 const policy=gatePolicies[group];
 if(previous&&(!Number.isFinite(previous.tokens)||previous.tokens<0||previous.tokens>policy.capacity||!Number.isSafeInteger(previous.at)||previous.at<0))throw Error('gate_state');
 const effective=Math.max(now,previous?.at||0);
 const tokens=Math.min(policy.capacity,(previous?.tokens??policy.capacity)+(effective-(previous?.at??effective))*policy.refillPerSecond/1000);
 const allowed=tokens>=1;
 return {allowed,retryAfter:allowed?0:Math.max(1,Math.ceil((1-tokens)/policy.refillPerSecond)),state:{tokens:allowed?tokens-1:tokens,at:effective}};
}
