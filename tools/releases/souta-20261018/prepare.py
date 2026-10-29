from pathlib import Path
import json, hashlib

ROOT = Path(__file__).resolve().parent
changes = []

def edit(relative, replacements):
    before = (ROOT / 'baseline' / relative).read_text()
    text = before
    for old, new in replacements:
        assert text.count(old) == 1, (relative, old[:100], text.count(old))
        text = text.replace(old, new, 1)
    (ROOT / 'candidate' / relative).write_text(text)
    changes.append({'file': relative, 'before': hashlib.sha256(before.encode()).hexdigest(),
                    'after': hashlib.sha256(text.encode()).hexdigest(), 'edits': len(replacements)})

audiences = '''    function schoolExamAudienceHtml() {
        return '<div class="m-card"><h3>定期テストの出題先</h3><div class="m-row"><b style="flex:0 0 auto;white-space:nowrap">なお・りらん用</b><span>'+(isFamily()?'自分の出題先':'別の学校・教材')+'</span></div><div class="m-row"><b style="flex:0 0 auto;white-space:nowrap">そうた用</b><span>'+(currentUserId==='u4'?(exList('u4').length?'自分の出題先':'自分の出題先／まだテストは登録されていません'):'別の学校・教材')+'</span></div><p class="m-desc">範囲と過去のテスト形式に合わせて出題します。過去のテストがない場合は、その人の教科書から出題します。</p></div>';
    }
    function schoolContestHtml() {
        const rows=APP_USERS.filter(u=>['u1','u2','u4'].includes(u.id)).map(u=>{
            const tests=stList(u.id,'teiki');
            return '<tr><th scope="row">'+esc(u.name)+'</th><td>'+(tests.length?tests.map(t=>esc(t.name)+'：'+stTotal(t)+'点 / 500点').join('<br>'):'未登録')+'</td></tr>';
        }).join('');
        return '<h3>定期テストの対決</h3><p class="m-desc">各自の学校のテストの合計点です。範囲・問題は学校ごとに異なります。</p><table style="width:100%;text-align:left"><tbody>'+rows+'</tbody></table>';
    }
'''

edit('pages/index.html', [
    ("{ id:'u2', name:'りらん' },", "{ id:'u2', name:'りらん' },\n        { id:'u4', name:'そうた' },"),
    ("const canTakeExams = () => isFamily();", "const canTakeExams = () => isFamily() || currentUserId === 'u4';"),
    ("if(!isFamily() && !isTrial()) show('nav-ottake', false);", "if(!canTakeExams() && !isTrial()) show('nav-ottake', false);"),
    ("const M_GRANTS = [", "const M_GRANTS = [\n        { id:'20261018-souta-start-cash', user:'u4', yen:1000000, msg:'🎁 そうたのスタート補助100万円' },"),
    ("function calEventsFor(key) {", "function calEventsFor(key) {\n        if(currentUserId==='u4') return [];"),
    ("function calMonthPlanHtml(y, mo) {", "function calMonthPlanHtml(y, mo) {\n        if(currentUserId==='u4') return '<div class=\"cal-empty\">そうたの学校の予定はまだ登録されていません。</div>';"),
    ("const hws = HOMEWORK[key] || [];", "const hws = currentUserId==='u4' ? [] : HOMEWORK[key] || [];"),
    ("const sel = calSelected, selHw = HOMEWORK[sel] || [];", "const sel = calSelected, selHw = currentUserId==='u4' ? [] : HOMEWORK[sel] || [];"),
    ("if(isTrial()) { box.style.display = 'none'; box.innerHTML = ''; return; }", "if(isTrial() || currentUserId==='u4') { box.style.display = 'none'; box.innerHTML = ''; return; }"),
    ("async function schoolResultsLoad(){\n        if(!isFamily())return;", "async function schoolResultsLoad(){\n        if(!isFamily() && currentUserId!=='u4')return;"),
    ("    function renderSchoolTests(anim) {\n        if(!currentUserId) return;", audiences+'''    function renderSchoolTests(anim) {
        if(!currentUserId) return;
        let contest=document.getElementById('school-contest');
        const body=document.getElementById('st-body');
        if(!contest && body){contest=document.createElement('div');contest.id='school-contest';contest.className='section';body.before(contest);}
        if(contest){contest.hidden=!canTakeExams();contest.innerHTML=canTakeExams()?schoolContestHtml():'';}
        if(currentUserId==='u4')void schoolResultsLoad();'''),
    ("function schoolScopeHtml() {", "function schoolScopeHtml() {\n        if(currentUserId==='u4') return '<div class=\"cal-empty\">そうた用の範囲・教科書は未登録です。</div>';"),
    ("function exStudyOpen(id) {", "function exStudyOpen(id) {\n        if(currentUserId==='u4') return;"),
    ("if(exNow) { exRender(); return; }                       // テスト中は そのまま", "if(exNow) { exRender(); return; }                       // テスト中は そのまま"),
    ("const list = exList();\n        if(!list.length)", "const list = exList();\n        if(currentUserId==='u4' && !list.length) { box.innerHTML=schoolExamAudienceHtml()+schoolScopeHtml(); return; }\n        if(!list.length)"),
    ("box.innerHTML = schoolSeptemberArchiveHtml();", "box.innerHTML = schoolExamAudienceHtml()+schoolSeptemberArchiveHtml();"),
    ("let h = schoolScopeHtml();", "let h = schoolExamAudienceHtml()+schoolScopeHtml();"),
    ('name="application-version" content="2.13.2"', 'name="application-version" content="2.14.0"'),
    ("const APP_RELEASE={version:'2.13.2'", "const APP_RELEASE={version:'2.14.0',at:Date.parse('2026-10-18T14:00:00Z'),changes:[['そうたの追加','そうたのログイン・初回補助と学校別の予定・定期テストの出題先を追加しました。']]};\n    const RELEASE_2132={version:'2.13.2'"),
    ("RELEASE_2131,APP_RELEASE]", "RELEASE_2131,RELEASE_2132,APP_RELEASE]"),
])
edit('pages/sw.js', [("const CACHE = 'nobilog-app-v2.13.2';", "const CACHE = 'nobilog-app-v2.14.0';")])

worker=[]
worker.append(('const knownName = uid === "u1" ?', 'const knownName = uid === "u4" ? "そうた" : uid === "u1" ?'))
worker.append(('  const uid = constantEqual(verifier, env.LEGACY_NAO_PIN_HASH)', '  if(env.LEGACY_SOUTA_PIN_HASH && constantEqual(verifier,env.LEGACY_SOUTA_PIN_HASH) && (constantEqual(verifier,env.LEGACY_NAO_PIN_HASH)||constantEqual(verifier,env.LEGACY_RIRAN_PIN_HASH))) return serviceUnavailable();\n  const uid = constantEqual(verifier, env.LEGACY_NAO_PIN_HASH)'))
worker.append(('constantEqual(verifier, env.LEGACY_RIRAN_PIN_HASH) ? "u2" : "";', 'constantEqual(verifier, env.LEGACY_RIRAN_PIN_HASH) ? "u2" : env.LEGACY_SOUTA_PIN_HASH && constantEqual(verifier, env.LEGACY_SOUTA_PIN_HASH) ? "u4" : "";'))
worker.append(('name: uid === "u1" ?', 'name: uid === "u4" ? "そうた" : uid === "u1" ?'))
worker.append(('const name = uid === "u1" ?', 'const name = uid === "u4" ? "そうた" : uid === "u1" ?'))
worker.append(('async function schoolCalendarApi(request, env, session) {', '''async function schoolCalendarApi(request, env, session) {
  if(session.uid === "u4") return request.method === "GET" ? json({events:[],holidays:[],details:{},notices:[],leadDays:0,now:Date.now()}) : unauthorized();'''))
worker.append(('async function schoolResultsApi(request, env, session) {', '''async function schoolResultsApi(request, env, session) {
  if(session.uid === "u4") {
    if(request.method !== "GET") return json({error:"method not allowed"},405);
    if(!env.AUTH_DB) return serviceUnavailable();
    const records={u4:{teiki:[],kakunin:[]}};
    for(const uid of ["u1","u2"]){
      const row=await env.AUTH_DB.prepare("SELECT v FROM auth_kv WHERE k=?").bind("school-result:"+uid+":2026-09").first();
      const r=row?JSON.parse(row.v):null;
      if(r){const total=Number.isFinite(r.total)?r.total:Object.values(r.s||{}).reduce((a,b)=>a+(Number(b)||0),0);records[uid]={teiki:[{id:r.id,name:r.name,total}]};}
    }
    return json({records});
  }'''))
edit('cf-worker/src/index.js',worker)
(ROOT/'changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
print('Prepared',len(changes),'files; original main app/baseline preserved')
