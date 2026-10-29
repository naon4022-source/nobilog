"""Change only the published 2.13.1 login entrance, never the working app."""
from pathlib import Path
import shutil, subprocess

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'preview/build/main-entry'
DEST=ROOT/'preview/build/password-entry'
ORIGIN='https://nobilog.pages.dev'

def fetch(path):
    return subprocess.run(['curl','--silent','--show-error','--fail','--location','--max-redirs','5','--proto-redir','=https','--max-time','30',ORIGIN+path],check=True,capture_output=True).stdout

def prepare():
    files=[p for p in BASE.iterdir() if p.name!='baseline.sha256']
    if any(not p.is_file() for p in files):raise SystemExit('Baseline contains unknown files')
    for p in files:
        if p.name!='_headers' and fetch('/' if p.name=='index.html' else '/'+p.name)!=p.read_bytes():
            raise SystemExit('Published baseline changed; do not deploy: '+p.name)
    original=(BASE/'index.html').read_text()
    if 'name="application-version" content="2.13.1"' not in original:raise SystemExit('Expected published 2.13.1')
    page=original
    edits=[]
    def change(old,new):
        nonlocal page
        if page.count(old)!=1:raise SystemExit('Entrance edit is not unique')
        page=page.replace(old,new,1);edits.append((old,new))
    anchor='        <a id="login-preview-entry" class="login-provider" style="text-decoration:none;justify-content:center" href="https://nobilog-preview.naon4022.workers.dev/">確認版にログイン</a>\n'
    change(anchor,'')
    change('</head>','<script src="/preview-entry-client.js"></script>\n</head>')
    condition="            if(!r.ok || !d.ticket) throw new Error(d.error || 'PINがちがうよ');"
    change(condition,'            if(r.status===401 && await previewPasswordEnter(pin)) return;\n'+condition)
    change('name="application-version" content="2.13.1"','name="application-version" content="2.13.2"')
    marker="const APP_RELEASE={version:'2.13.1'"
    release="const APP_RELEASE={version:'2.13.2',at:Date.parse('2026-09-30T14:22:32Z'),changes:[['ログイン・確認版の入口','確認版への別ボタンを削除し、パスワードでログインから確認版専用コードで入れるようにしました。本編の学習機能・記録は変更していません。']]};\n    "
    change(marker,release+"const RELEASE_2131={version:'2.13.1'")
    change('RELEASE_2130,APP_RELEASE]','RELEASE_2130,RELEASE_2131,APP_RELEASE]')
    restored=page
    for old,new in reversed(edits):
        if new:restored=restored.replace(new,old,1)
        else:
            original_marker='<button id="login-create-main" class="login-provider create" onclick="authToggleCreate()">＋ アカウント作成</button>\n'
            restored=restored.replace(original_marker,original_marker+anchor,1)
    if restored!=original:raise SystemExit('Unrelated app change detected')
    allowed={p.name for p in files}|{'preview-entry-client.js'}
    DEST.mkdir(parents=True,exist_ok=True)
    if any(not p.is_file() or p.name not in allowed for p in DEST.iterdir()):raise SystemExit('Unrelated deployment files')
    for p in files:shutil.copyfile(p,DEST/p.name)
    (DEST/'index.html').write_text(page)
    sw=(BASE/'sw.js').read_text();old="const CACHE = 'nobilog-app-v2.13.1';"
    if sw.count(old)!=1:raise SystemExit('Unexpected cache version')
    (DEST/'sw.js').write_text(sw.replace(old,"const CACHE = 'nobilog-app-v2.13.2';",1))
    header=(BASE/'_headers').read_text()
    old="connect-src 'self' https://nobilog-board.naon4022.workers.dev https://challenges.cloudflare.com"
    if header.count(old)!=1:raise SystemExit('Unexpected CSP')
    (DEST/'_headers').write_text(header.replace(old,old+' https://nobilog-preview.naon4022.workers.dev'))
    shutil.copyfile(ROOT/'site-assets/preview-entry-client.js',DEST/'preview-entry-client.js')
    print('Password entrance prepared: exact published baseline; unrelated app changes excluded')

if __name__=='__main__':prepare()
