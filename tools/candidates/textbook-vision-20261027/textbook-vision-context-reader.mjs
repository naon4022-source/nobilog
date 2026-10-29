// Fixed catalogs only. New image contexts never replace original text contexts.
import {readPublicTextbookContext} from '../../../cf-worker/src/textbook-ai-context.mjs';
import {TEXTBOOK_AI_CONTEXTS} from '../../../cf-worker/src/textbook-ai-context-manifest.mjs';
import {TEXTBOOK_VISION_MEDIA} from './textbook-vision-media-manifest.mjs';
import {publicMediaContextReader} from './textbook-vision-media-context.mjs';
export function currentVisionEntry(book,digest){
 if(typeof book!=='string'||!Object.hasOwn(TEXTBOOK_AI_CONTEXTS,book))throw Error('context_changed');
 const entry=[TEXTBOOK_AI_CONTEXTS[book],TEXTBOOK_VISION_MEDIA[book]].find(e=>e.sha256===digest);
 if(!entry)throw Error('context_changed');return entry;
}
export function visionContextReader({readText=readPublicTextbookContext,fetcher=fetch}={}){
 const media=publicMediaContextReader({fetcher});
 return async(env,selection)=>{
  if(selection?.contextSha256===TEXTBOOK_VISION_MEDIA[selection.book]?.sha256)return media(env,selection);
  try{return await readText(env,selection);}catch(error){if(error?.message!=='context_not_found'||selection?.contextSha256!==undefined)throw error;}
  return media(env,selection);
 };
}
export const readVisionContext=visionContextReader();
