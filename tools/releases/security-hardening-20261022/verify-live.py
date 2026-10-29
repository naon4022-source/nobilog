# 公開後の確認：ログインせず、記録を書き換えない呼び出しだけを使う。
import urllib.request,urllib.error,json,time,sys,hashlib
PART=sys.argv[1] if len(sys.argv)>1 else 'worker'
B='https://nobilog-board.naon4022.workers.dev';A='https://nobilog.pages.dev';UA={'User-Agent':'Mozilla/5.0 (Macintosh) nobilog-hardening-check'}
def call(path,origin=A,method='GET',data=None):
    h={**UA,'Origin':origin};
    if data is not None:h['Content-Type']='application/json'
    req=urllib.request.Request(B+path,method=method,headers=h,data=data)
    try:
        with urllib.request.urlopen(req,timeout=20) as r:return r.status,r.read()
    except urllib.error.HTTPError as e:return e.code,e.read()
ok=0
def check(c,m):
    global ok
    if not c:raise SystemExit('NG: '+m)
    ok+=1;print('OK',m)
if PART=='pages':
    for i in range(6):
        html=urllib.request.urlopen(urllib.request.Request(A+'/',headers=UA),timeout=30).read()
        if hashlib.sha256(html).hexdigest()==hashlib.sha256(open(__file__.replace('verify-live.py','candidate/pages/index.html'),'rb').read()).hexdigest():break
        time.sleep(10)
    else:raise SystemExit('NG: 公開中の画面が候補と一致しない')
    print('OK 画面は候補（2.17.1）と一致')
    js=urllib.request.urlopen(urllib.request.Request(A+'/vendor/chart-4.4.1.umd.js',headers=UA),timeout=30).read()
    if js!=open(__file__.replace('verify-live.py','candidate/pages/vendor/chart-4.4.1.umd.js'),'rb').read():raise SystemExit('NG: グラフの部品が一致しない')
    print('OK グラフの部品はのびログの中の版')
    r=urllib.request.urlopen(urllib.request.Request(A+'/',headers=UA),timeout=30);csp=r.headers.get('content-security-policy','')
    if "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com" not in csp:raise SystemExit('NG: CSPが入っていない')
    print('OK 画面の守り（CSP）が入っている');sys.exit(0)
check(call('/auth/me')[0]==401,'未ログインの /auth/me は401')
r=urllib.request.urlopen(urllib.request.Request(B+'/auth/me',headers={**UA,'Origin':A}),timeout=20) if False else None
check(call('/auth/me',origin='https://evil.invalid')[0]==403,'よそのサイトからは403')
check(call('/auth/me',origin='http://localhost:8080')[0]==403,'localhost からは403（本番）')
# ログイン入口の回数制限：トークンなしの /auth/legacy は照合前に断られ記録を書かない。同じIPから21回で429
codes=[]
for i in range(150):   # Cloudflareの回数制限は場所ごとに少し遅れて数えるので、最大150回・少し間をあけて呼ぶ
    codes.append(call('/auth/legacy',method='POST',data=b'{}')[0])
    if codes[-1]==429:break
    time.sleep(0.15)
check(429 in codes,'ログイン入口は同じIPから続けて呼ぶと429（'+','.join(map(str,codes[-4:]))+'）')
check(all(c in (400,403,429) for c in codes),'それ以外は今までどおり断るだけ')
st,_=call('/auth/me');
import urllib.request as U
try:
    U.urlopen(U.Request(B+'/.env',headers={**UA,'Origin':A}),timeout=20);check(False,'変な呼び出しは403')
except urllib.error.HTTPError as e:check(e.code==403,'変な呼び出し（/.env）は403')
print('live checks',ok)
