"""Minimal public-version patch; never mix the large working-tree update."""
from pathlib import Path
import hashlib,json
H=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
for directory in ['baseline/pages','candidate/pages']:(H/directory).mkdir(parents=True,exist_ok=True)
changes=[]
for name,tmp in [('index.html','/tmp/nobi-public-google-check-20261020.html'),('sw.js','/tmp/nobi-public-sw-google-check-20261021.js')]:
 b=Path(tmp).read_bytes();base=H/'baseline/pages'/name
 if base.exists():assert base.read_bytes()==b
 else:base.write_bytes(b)
 s=b.decode()
 def replace(a,z):
  global s
  assert s.count(a)==1,(name,a[:60],s.count(a));s=s.replace(a,z,1)
 if name=='index.html':
  replace('<button class="login-link" onclick="tryLogin(\'line\')">初めてLINEと連携するときはこちら</button>', '<button class="login-link" onclick="tryLogin(\'google\')">Googleアカウントと連携する（本人確認後）</button>\n            <button class="login-link" onclick="tryLogin(\'line\')">初めてLINEと連携するときはこちら</button>')
  replace("if(linkProvider==='line'){authStart('line');return;}","if(linkProvider==='google'||linkProvider==='line'){authStart(linkProvider);return;}")
  replace('本人確認後、勉強画面へ進みます。Google連携はログイン後のお知らせからできます。','通常のログインは勉強画面へ進みます。Googleと連携するときは、パスワードと本人確認を済ませて下の連携ボタンを押してください。')
  replace('name="application-version" content="2.16.0"','name="application-version" content="2.17.0"')
  replace("const APP_RELEASE={version:'2.16.0'", "const APP_RELEASE={version:'2.17.0',at:Date.parse('2026-10-21T00:00:00+09:00'),changes:[['Google連携の入口','パスワードと本人確認の後、Googleを既存の本人アカウントへ連携できます。新規アカウント作成は不要です。']]};\n    const RELEASE_2160={version:'2.16.0'")
  replace('RELEASE_2150,APP_RELEASE]','RELEASE_2150,RELEASE_2160,APP_RELEASE]')
 else:replace("const CACHE = 'nobilog-app-v2.16.0';","const CACHE = 'nobilog-app-v2.17.0';")
 c=s.encode();(H/'candidate/pages'/name).write_bytes(c);changes.append({'file':'pages/'+name,'beforeSha256':sha(b),'afterSha256':sha(c)})
(H/'changes.json').write_text(json.dumps({'status':'candidate only; not published','publicBaseline':'2.16.0','candidate':'2.17.0','workerChanges':False,'files':changes},indent=2)+'\n')
print('Prepared public-only Google linking entry, index and SW; no account or Worker changes')
