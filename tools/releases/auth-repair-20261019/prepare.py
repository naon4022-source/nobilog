"""Patch only the verified public2.15.0. Never read root large-update files or secret values."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parent;changes=[]
def edit(name,replacements):
 before=(R/'baseline'/name).read_text();s=before
 for old,new in replacements:
  assert s.count(old)==1,(name,old[:60],s.count(old));s=s.replace(old,new,1)
 (R/'candidate'/name).write_text(s);changes.append({'file':name,'before':hashlib.sha256(before.encode()).hexdigest(),'after':hashlib.sha256(s.encode()).hexdigest(),'edits':len(replacements)})
fallback='''const value = await env.BOARD.get(String(key));
    // A targeted Google unlink must also reject an old KV-only identity/session.
    let resetApplies = (String(key).startsWith("identity:google:") || String(key).startsWith("legacy:")) && value === "u1";
    if (String(key).startsWith("session:") && value) {
      try { const prior = JSON.parse(value); resetApplies = prior.uid === "u1" && prior.provider === "google"; } catch {}
    }
    if (resetApplies) {
      if (!env.AUTH_DB) return null;
      try {
        const reset = await env.AUTH_DB.prepare("SELECT 1 AS revoked FROM auth_kv WHERE k = ? AND v = '1' LIMIT 1").bind("google-reset:u1").first();
        if (reset) return null;
      } catch { return null; }
    }
    return value;'''
edit('cf-worker/src/index.js', [
 ('return await env.BOARD.get(String(key));',fallback),
 ('      uid = legacy;\n      await authPut(env, ikey, uid);', "      uid = legacy;\n      const linked=await env.AUTH_DB.prepare(\"INSERT INTO auth_kv (k,v,expires_at) SELECT ?,?,0 WHERE EXISTS (SELECT 1 FROM auth_kv WHERE k=? AND v=? AND expires_at>?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=0 WHERE auth_kv.v=excluded.v OR auth_kv.v='' RETURNING v\").bind(ikey,uid,'legacy:'+rec.ticket,uid,Date.now()).first();\n      if(!linked)throw new Error('連携の有効時間が切れました。もう一度本人確認をしてください。');"),
])
before='''            pinFail = 0; authLegacyTicket = d.ticket;
            authProviderDisplay(true);
            authMainActions(false);
            document.getElementById('login-pin-enter').style.display = 'flex';
            document.getElementById('login-legacy').style.display = 'none';
            document.getElementById('login-title').innerText = `🔐 ${d.name || '今までの記録'}で確認できたよ`;
            document.getElementById('login-sub').innerText = 'GoogleかLINEと連携するか、パスワードでログインしてね';
            err.innerText = '';
            return;'''
after='''            pinFail = 0; authLegacyTicket = d.ticket;
            document.getElementById('login-pin').value = '';
            if(linkProvider==='line'){authStart('line');return;}
            await authLegacyEnter();
            return;'''
old_ts=(R/'baseline/pages/index.html').read_text().split("    let turnstileToken =",1)[1].split("    const authSession",1)[0]
old_ts="    let turnstileToken ="+old_ts
edit('pages/index.html',[
 (old_ts,(R/'turnstile-client.js').read_text()),
 ('<div id="turnstile-widget" aria-label="不正ログイン防止"></div>','<div id="turnstile-widget" aria-label="不正ログイン防止"></div>\n            <button class="login-link" onclick="turnstileRetryNow()">本人確認をやり直す</button>'),
 ('本人確認後、そのままログインするか、GoogleまたはLINEと連携できます。','本人確認後、勉強画面へ進みます。Google連携はログイン後のお知らせからできます。'),
 ('onclick="tryLogin()">つぎへ</button>','onclick="tryLogin()">ログイン</button>\n            <button class="login-link" onclick="tryLogin(\'line\')">初めてLINEと連携するときはこちら</button>'),
 ('let pinFail = 0, pinLockUntil = 0;','let pinFail = 0, pinLockUntil = 0, authLegacyBusy = false;'),
 ('async function tryLogin() {','async function tryLogin(linkProvider) {\n        if(authLegacyBusy)return;'),
 ("if(!turnstileToken) { err.innerText = 'まず本人確認を完了してね'; return; }","if(!turnstileToken || Date.now()-turnstileLoadedAt>=300000) { turnstileToken=''; err.innerText = 'まず本人確認を完了してね'; return; }\n        authLegacyBusy=true;authSetBusy(true);err.innerText='本人確認しています…';"),
 ("            if(!r.ok || !d.ticket) throw new Error(d.error || 'PINがちがうよ');","            if(!r.ok || !d.ticket){const failure=new Error(d.error || 'ログインできませんでした');failure.pinMismatch=r.status===401;throw failure;}"),
 ("            pinFail++;\n            document.getElementById('login-pin').value = '';","            if(!e.pinMismatch){err.innerText=(e.message || '通信を確認してください')+' 本人確認をやり直してから、もう一度ログインしてください。';return;}\n            pinFail++;\n            document.getElementById('login-pin').value = '';"),
 (before,after),
 ("            err.innerText = `${e.message || 'パスコードがちがうよ'}🔒（あと${5 - pinFail}回）`;\n            return;\n        }\n    }", "            err.innerText = `${e.message || 'パスコードがちがうよ'}🔒（あと${5 - pinFail}回）`;\n            return;\n        }finally{authLegacyBusy=false;authSetBusy(false);}\n    }"),
 ("            recordStorage.setItem(AUTH_KEY,d.session);\n            const known = APP_USERS.find(x => x.id === d.user.id);\n            completeLogin(Object.assign({},d.user,known||{}));", "            authLegacyTicket='';\n            recordStorage.setItem(AUTH_KEY,d.session);\n            const known = APP_USERS.find(x => x.id === d.user.id);\n            await completeLogin(Object.assign({},d.user,known||{}));"),
 ('name="application-version" content="2.15.0"','name="application-version" content="2.15.1"'),
 ("const APP_RELEASE={version:'2.15.0'","const APP_RELEASE={version:'2.15.1',at:Date.parse('2026-10-19T10:00:00Z'),changes:[['パスワードログインの修正','本人確認後は勉強画面へ進み、Google連携はログイン後に行います。']]};\n    const RELEASE_2150={version:'2.15.0'"),
 ('RELEASE_2140,APP_RELEASE]','RELEASE_2140,RELEASE_2150,APP_RELEASE]'),
])
edit('pages/sw.js',[("const CACHE = 'nobilog-app-v2.15.0';","const CACHE = 'nobilog-app-v2.15.1';")])
(R/'changes.json').write_text(json.dumps(changes,indent=2)+'\n')
print('Public2.15.1 candidate: PIN goes directly to study; explicit LINE linking retained; scoped Google-reset fallback protection; 3 files changed')
