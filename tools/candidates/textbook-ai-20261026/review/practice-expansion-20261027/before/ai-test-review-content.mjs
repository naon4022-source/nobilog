// Completed-test text only. No screenshot, notes, identity or arbitrary client
// supplied source is silently added. This does not dispatch or charge anything.
import {completedTestData} from './ai-test-session.mjs';
import {requestBody} from './openai-policy.mjs';
import {chatContent} from './openai-chat-content.mjs';
import {TEST_REVIEW_CHUNK_SIZE,TEST_REVIEW_INSTRUCTIONS,testReviewModel} from './ai-test-review-format.mjs';
import {reviewPracticeOptions} from './ai-review-practice-library.mjs';
export const testReviewDigest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const fail=code=>{throw Error(code);};
function learnerText(text){
 // Reuse the current private-input checks, including across each boundary.
 for(let at=0;at<text.length;at+=2900){const part=text.slice(at,at+3000);if(part.trim())chatContent({text:part});}
 return text;
}
function content(rows){return {instructions:TEST_REVIEW_INSTRUCTIONS,input:JSON.stringify({task:'completed-test-review',questions:rows}),maxOutputTokens:4096};}
export async function buildTestReviewChunks(proof,uid,plan){
 testReviewModel(plan);const source=completedTestData(proof,uid),rows=await Promise.all(source.session.questions.map(async(slot,index)=>({questionId:slot.question.id,question:slot.question.prompt,officialAnswer:slot.question.answer,officialExplanation:slot.question.explanation||'',learnerAnswer:learnerText(source.records[index].answer),correct:source.records[index].result.correct,practices:await reviewPracticeOptions(slot.question)})));
 const groups=[];let current=[];
 const fits=items=>{try{requestBody(plan,'test-review',content(items));return true;}catch(error){if(!['invalid_input','invalid_budget'].includes(error?.message))throw error;return false;}};
 for(const row of rows){
  if(current.length===TEST_REVIEW_CHUNK_SIZE||!fits([...current,row])){if(!current.length)fail('review_input_too_large');groups.push(current);current=[];}
  if(!fits([row]))fail('review_input_too_large');current.push(row);
 }
 if(current.length)groups.push(current);if(!groups.length||groups.length>128)fail('review_input_too_large');
 const chunks=[];
 for(const [index,items] of groups.entries()){
  const body=content(items),policy=requestBody(plan,'test-review',body),digest=await testReviewDigest(JSON.stringify(policy.body)),id=await testReviewDigest('test-review:v1:'+source.session.id+':'+source.fingerprint+':'+index+':'+digest);
  chunks.push({id,digest,questionIds:items.map(r=>r.questionId),practices:items.map(r=>({questionId:r.questionId,ids:r.practices.map(p=>p.id)})),content:body,policy});
 }
 return {sessionId:source.session.id,fingerprint:source.fingerprint,total:rows.length,plan,model:testReviewModel(plan),chunks};
}
