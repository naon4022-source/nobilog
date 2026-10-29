// Candidate only. No namespace/migration/main Worker change has been applied.
import {DurableObject} from 'cloudflare:workers';
import {createInvalidationHub} from './invalidation-hub.mjs';
export class CoopStoryEvents extends DurableObject{
 constructor(ctx,env){super(ctx,env);this.hub=createInvalidationHub();}
 // Called through a namespace binding after the Worker verifies the session
 // AND room membership. Never forward a public arbitrary-method RPC endpoint.
 watch(){return this.hub.watch();}
 // Called only after an authoritative commit, including replay/refetch recovery.
 invalidate(revision){return this.hub.invalidate(revision);}
}
