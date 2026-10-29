import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {update} from './plan-study-copy.mjs';
const source=await readFile(new URL('../../../site-assets/plan-study.js',import.meta.url),'utf8'),next=source.includes('実AIはまだ未接続です')?update(source):source;
new vm.Script(next);
assert.throws(()=>update(next),/Source changed/);
assert.ok(!next.includes('実AIはまだ未接続です'));
assert.ok(!next.includes('カメラはStudent以上'));
assert.ok(next.includes('ノートのAI分析とAIアイコン生成は、まだ使えません'));
// Execute the actual quota fragment with synthetic server plans; no DOM/API.
const fragment=next.slice(next.indexOf("  if(plan?.provisional&&plan.creditsVersion"),next.indexOf('  if(api.study)'));
for(const [plan,expected] of [
 [{provisional:true,creditsVersion:'daily-v2',dailyLeft:497.5,dailyLimit:500,aiLeft:100,aiLimit:300},'今日のAI：残り 497.5 / 500回分'],
 [{provisional:true,creditsVersion:'daily-v2',dailyLeft:4999,dailyLimit:5000,aiLeft:null,aiLimit:null},'今日のAI：残り 4999 / 5000回分'],
 [{provisional:true,aiLeft:20,aiLimit:30},'今月残り 20 / 30回'],
 [{provisional:false,creditsVersion:'daily-v2',dailyLeft:50,dailyLimit:100},null]
]){
 const values=[];vm.runInNewContext(fragment,{plan,box:{append:x=>values.push(x)},el:(tag,text)=>text});
 assert.equal(values.length,expected?1:0);if(expected)assert.ok(values[0].includes(expected));
}
console.log('Plan-study copy candidate: syntax, fail-closed replacement, truthful unavailable features, daily fractional quota, UNLIMIT and legacy monthly fallback passed; no served-file writes');
