// Historical curriculum checks accept only the exact, independently reviewed math correction.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../../../',import.meta.url);
const base='tools/candidates/textbook-ai-20261026/review/math-order-followup/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFile(new URL(p,root));
export async function reviewedMathBankSuccessor(expected,current){
 const raw=await read(base+'main-integration.json');
 assert.equal(hash(raw),'bcded615d818a315c938561a00936bd88ed44af1848b2f255a14d08bcc2735a0','pinned math integration receipt');
 const receipt=JSON.parse(raw);
 assert.deepEqual(receipt.units,['drill-math-1-signedcalc','workbook-math-1-calc1','workbook-math-1-calc2','workbook-math-1-review']);
 for(const row of receipt.files){
  assert.equal(hash(await read(row.beforeFile)),row.beforeSha256,'exact math predecessor '+row.file);
  assert.equal(hash(await read(row.file)),row.afterSha256,'exact reviewed math successor '+row.file);
 }
 for(const proof of receipt.proofs){
  const bytes=await read(proof.file);assert.equal(hash(bytes),proof.sha256,'frozen math proof');
  const value=JSON.parse(bytes);assert.equal(value.status,'passed');assert.equal(value.checks,proof.checks);
 }
 const previous=JSON.parse(await read(base+'main-before/site-assets/material-bank.json'));
 const actual=JSON.parse(await read('site-assets/material-bank.json'));
 assert.deepEqual(current,actual,'caller must compare actual current bank');
 const result=structuredClone(expected);
 for(const id of receipt.units){
  const index=result.units.findIndex(u=>u.id===id);assert.ok(index>=0,'historical math unit exists');
  assert.deepEqual(result.units[index],previous.units.find(u=>u.id===id),'historical unit must match exact approved predecessor '+id);
  result.units[index]=structuredClone(actual.units.find(u=>u.id===id));
 }
 return result;
}
