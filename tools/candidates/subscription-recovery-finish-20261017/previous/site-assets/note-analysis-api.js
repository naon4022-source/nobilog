(function(root){
'use strict';
function create(options){
 const same=()=>options.same()===true;
 async function request(path,body){
  if(!same())throw Error('session_changed');
  const response=await options.request(path,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!same())throw Error('session_changed');
  if(response.status===404&&body===undefined&&path.startsWith('/learning-note-analysis?id='))return null;
  const result=await response.json();if(!same())throw Error('session_changed');
  if(!response.ok)throw Error('note_analysis_request_failed');return result;
 }
 const jobPath=()=>'/learning-note-analysis-job?noteId='+encodeURIComponent(options.saved().id);
 return {
  same,saved:options.saved,draft:options.draft,allowed:options.allowed,lock:options.lock,refreshQuota:options.refreshQuota,
  async status(){if(!options.allowed())return {ready:false};const [status,plan]=await Promise.all([request('/learning-chat?status=1'),request('/plan')]);return {...status,plan};},
  async loadJob(){if(!options.allowed())return null;return (await request(jobPath())).job;},
  async saveJob(job){
   const body={id:job.id,noteId:job.noteId,revision:job.revision};
   const expected=x=>x&&x.id===body.id&&x.noteId===body.noteId&&x.revision===body.revision;
   if(!expected((await request('/learning-note-analysis-job',body)).job))throw Error('job_conflict');
   // Read back from the authenticated server, never from recordMemory/localStorage.
   const remote=await request('/learning-note-analysis-job?noteId='+encodeURIComponent(body.noteId));
   if(!expected(remote.job))throw Error('job_unconfirmed');return true;
  },
  readResult:id=>request('/learning-note-analysis?id='+encodeURIComponent(id)),
  analyze:body=>request('/learning-note-analysis',body)
 };
}
root.NobiNoteAnalysisAPI=Object.freeze({create});
})(globalThis);
