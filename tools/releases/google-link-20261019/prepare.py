from pathlib import Path
import hashlib,json,datetime
ROOT=Path(__file__).resolve().parent
changes=[]
def edit(name,replacements):
    before=(ROOT/'baseline'/name).read_text();text=before
    for old,new in replacements:
        assert text.count(old)==1,(name,old[:90],text.count(old))
        text=text.replace(old,new,1)
    (ROOT/'candidate'/name).write_text(text)
    changes.append({'file':name,'before':hashlib.sha256(before.encode()).hexdigest(),'after':hashlib.sha256(text.encode()).hexdigest(),'edits':len(replacements)})
client=(ROOT/'client.js').read_text()
edit('pages/index.html',[
    ('    function authStart(provider) {',client+'    function authStart(provider) {'),
    ("const authErr = fragment.get('auth_error');","const authErr = fragment.get('auth_error');\n        const googleLinkResult=fragment.get('google_link'),googleLinkError=fragment.get('google_link_error');"),
    ('if(incoming || authErr || hadLegacyAuthQuery) {','if(incoming || authErr || hadLegacyAuthQuery || googleLinkResult || googleLinkError) {'),
    ("fragment.delete('auth'); fragment.delete('auth_error');","fragment.delete('auth'); fragment.delete('auth_error');fragment.delete('google_link');fragment.delete('google_link_error');"),
    ('            completeLogin(Object.assign({}, d.user, known || {}));',"            await completeLogin(Object.assign({}, d.user, known || {}));\n            if(serverBootReady&&!authLeaseBlocked&&currentUserId===d.user.id){\n                if(googleLinkResult==='ok'&&d.user.googleLinked===true)noticeToast({id:'google-link-result',at:Date.now(),title:'Googleアカウントと連携しました',body:'次回から本人のGoogleアカウントでログインできます。',category:'other'});\n                else if(googleLinkError)noticeToast({id:'google-link-result',at:Date.now(),title:googleLinkError==='cancelled'?'Googleとの連携をキャンセルしました':'Googleとの連携を完了できませんでした',body:googleLinkError==='linked_elsewhere'?'このGoogleアカウントは別の利用者と連携済みです。本人のGoogleアカウントでやり直してください。':'勉強はそのまま続けられます。連携はベルのお知らせからやり直せます。',category:'other'});\n            }"),
    ('currentUserId=u.id;currentUser=u;','currentUserId=u.id;currentUser=u;googleLinkNoticeState={uid:u.id,at:Date.now()};'),
    ("showMotivation();switchView('study');","showMotivation();switchView('study');authGoogleLinkNotice();"),
    ("return archive.filter(n=>!n.schoolEventId||currentUserId==='u1').sort((a,b)=>b.at-a.at);","const linkNotice=authGoogleLinkNoticeItem();\n        return archive.filter(n=>!n.schoolEventId||currentUserId==='u1').concat(linkNotice?[linkNotice]:[]).sort((a,b)=>b.at-a.at);"),
    ('    function noticeDetail(n) {',"    function noticeDetail(n) {\n        if(n.googleLink){if(n.uid===currentUserId)authGoogleLinkOpen();return;}"),
    ('const seconds=appSettings().toastSeconds;if(seconds&&noticeToastMap.has(id)',"const seconds=appSettings().toastSeconds;if(noticeToastMap.get(id)?.googleLink)return;if(seconds&&noticeToastMap.has(id)"),
    ('        if(!currentUserId||!noticeAllowed(n))return;',"        if(!currentUserId||!noticeAllowed(n))return;\n        if(n.googleLink&&(n.uid!==currentUserId||[...noticeToastMap.values()].some(old=>old.googleLink&&old.uid===n.uid)))return;"),
    ('items.filter(n=>!n.release&&n.at>read&&noticeAllowed(n))','items.filter(n=>!n.release&&!n.googleLink&&n.at>read&&noticeAllowed(n))'),
    ('name="application-version" content="2.14.0"','name="application-version" content="2.15.0"'),
    ("const APP_RELEASE={version:'2.14.0'","const APP_RELEASE={version:'2.15.0',at:Date.parse('2026-10-18T15:30:00Z'),changes:[['Google連携のお知らせ','パスワードでログインした後、Google未連携の人へ通知します。ベルから本人のGoogleアカウントと連携できます。']]};\n    const RELEASE_2140={version:'2.14.0'"),
    ('RELEASE_2132,APP_RELEASE]','RELEASE_2132,RELEASE_2140,APP_RELEASE]'),
])
worker=(ROOT/'worker.js').read_text()
edit('cf-worker/src/index.js',[
    ('async function oauthStart(request, env) {',worker+'async function oauthStart(request, env) {'),
    ('  if (!rec || rec.provider !== provider || !code) return json({ error: "invalid oauth callback" }, 400);',"  if(rec&&rec.mode==='session-link'&&rec.provider===provider&&provider==='google')return await sessionGoogleCallback(request,env,state,data);\n  if (!rec || rec.provider !== provider || !code) return json({ error: \"invalid oauth callback\" }, 400);"),
    ('return json({ session, user: { id: uid, name, provider: "pin" } });','return json({ session, user: { id: uid, name, provider: "pin", googleLinked: await googleLinked(env,uid) } });'),
    ('      if (path === "/auth/me" && request.method === "GET") {',"      if(path==='/auth/link/google')return await sessionGoogleStart(request,env,session);\n      if (path === \"/auth/me\" && request.method === \"GET\") {"),
    ('name: session.name, provider: session.provider }, leaseSeconds:', 'name: session.name, provider: session.provider, googleLinked: session.provider===\"google\"||await googleLinked(env,session.uid) }, leaseSeconds:'),
])
edit('pages/sw.js',[("const CACHE = 'nobilog-app-v2.14.0';","const CACHE = 'nobilog-app-v2.15.0';")])
(ROOT/'changes.json').write_text(json.dumps(changes,indent=2)+'\n')
print('Prepared Google-link notice: 3 public files changed; baseline retained')
