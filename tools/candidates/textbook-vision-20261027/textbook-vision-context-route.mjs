// Reuse the original metadata route's session, owner, query and Origin guards.
import {textbookAIContextRoute} from '../../../cf-worker/src/textbook-ai-context-route.mjs';
import {readVisionContext} from './textbook-vision-context-reader.mjs';
export function textbookVisionContextRoute(request,env,session,options={}){
 const url=new URL(request.url);
 if(url.pathname!=='/textbook-ai-vision-context')return Promise.resolve(Response.json({error:'not_found'},{status:404,headers:{'Cache-Control':'private, no-store'}}));
 url.pathname='/textbook-ai-context';
 return textbookAIContextRoute(new Request(url,request),env,session,{...options,readContext:options.readContext||readVisionContext});
}
