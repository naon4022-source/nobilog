const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {sandbox:S,X,store}=require('../../../.claude/verify/harness');
const root=require('node:path').resolve(__dirname,'../../..'),main=process.argv.includes('--main');
let source=fs.readFileSync(root+'/index.html','utf8');
if(!main){const patch=JSON.parse(fs.readFileSync(__dirname+'/patch.json','utf8'));for(const [a,b] of [[patch.old,patch.new],[patch.addOld,patch.addNew]]){assert.equal(source.split(a).length,2);source=source.replace(a,b);}const start=source.indexOf('    function examCdTimestamp('),end=source.indexOf('    // 📮 配布物',start);assert(start>0&&end>start);vm.runInContext(source.slice(start,end),S);}
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
S.__fakeNow=new Date('2026-10-17T09:00:00+09:00').getTime();X.uid='x_date_fixture';S.confirm=()=>true;
const key='x_date_fixture:examCountdown',field=(id,value)=>S.document.getElementById(id).value=value;
const good=['2026-10-17','2027-02-28','2028-02-29','2027-04-30','2031-10-17'];
const bad=['2027-02-29','2028-02-30','2027-02-31','2027-04-31','2027-00-01','2027-13-01','2027-01-00','2027-01-32','2027-1-01','2027-01-1','2027-01-01T00:00:00Z','0000-01-01','0099-01-01','not-a-date',''];
for(const value of good){eq(Number.isFinite(S.examCdDays(value)),true);}
for(const value of bad){eq(Number.isNaN(S.examCdDays(value)),true);const before=S.recordStorage.getItem(key);field('exam-cd-name','検定');field('exam-cd-date',value);S.examCdAdd();eq(S.recordStorage.getItem(key),before);eq(/今日から5年以内/.test(S.document.getElementById('exam-cd-msg').textContent),true);}
for(const value of ['2026-10-16','2032-01-01']){const before=S.recordStorage.getItem(key);field('exam-cd-name','検定');field('exam-cd-date',value);S.examCdAdd();eq(S.recordStorage.getItem(key),before);}
for(const value of good.slice(0,4)){field('exam-cd-name','試験'+value);field('exam-cd-date',value);S.examCdAdd();eq(JSON.parse(S.recordStorage.getItem(key)).at(-1).date,value);}
eq(S.examCdDays('2026-10-17'),0);eq(S.examCdDays('2027-02-28'),134);eq(S.examCdDays('2028-02-29')-S.examCdDays('2028-02-28'),1);eq(S.examCdDays('2028-03-01')-S.examCdDays('2028-02-29'),1);
const saved=JSON.stringify([{name:'不正な日付',date:'2027-02-31'},{name:'本人の試験',date:'2027-02-28'}]);S.recordStorage.setItem(key,saved);S.renderExamCountdown();eq(S.document.getElementById('exam-countdown').innerHTML.includes('不正な日付'),false);eq(S.document.getElementById('exam-countdown').innerHTML.includes('本人の試験'),true);eq(S.recordStorage.getItem(key),saved);
X.uid='x_other_date_fixture';S.renderExamCountdown();eq(S.document.getElementById('exam-countdown').innerHTML.includes('本人の試験'),false);X.uid='x_date_fixture';eq(S.recordStorage.getItem(key),saved);
console.log('Exam date validation: '+checks+' checks passed; real app functions, invalid calendar dates rejected without writes, leap day and boundaries, malformed saved date hidden without deletion, account isolation; isolated harness only');
