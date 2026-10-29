"""Check only the new preview login, static delivery and logout; no record reads."""
import getpass, hashlib, http.cookiejar, urllib.parse, urllib.request, urllib.error, json
from pathlib import Path

origin='https://nobilog-preview.naon4022.workers.dev'
password=getpass.getpass('確認版のログイン確認（パスワードは非表示）: ')
cookies=http.cookiejar.CookieJar()
opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
opener.addheaders=[('User-Agent','curl/8.7.1')]
request=urllib.request.Request(origin+'/preview-login',data=urllib.parse.urlencode({'password':password}).encode(),headers={'Origin':origin,'Content-Type':'application/x-www-form-urlencoded'})
password=None
try:
    with opener.open(request,timeout=30) as response: page=response.read()
except urllib.error.HTTPError as error:
    try: reason=json.loads(error.read()).get('error','request_rejected')
    except Exception: reason='request_rejected'
    raise SystemExit('Login request failed: '+str(error.code)+' '+reason)
expected=(Path(__file__).resolve().parent/'build/assets/index.html').read_bytes()
if hashlib.sha256(page).digest()!=hashlib.sha256(expected).digest():raise SystemExit('認証後の画面が一致しません。')
request=urllib.request.Request(origin+'/api/auth/logout',data=b'',headers={'Origin':origin})
with opener.open(request,timeout=30) as response:
    if response.status!=200:raise SystemExit('ログアウトを確認できません。')
if list(cookies):raise SystemExit('ログアウト後のCookieが残っています。')
print('確認版のログイン、非公開画面の配信一致、ログアウトを確認しました。記録は操作していません。')
