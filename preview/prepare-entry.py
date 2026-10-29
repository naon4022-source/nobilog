"""Prepare only the preview entrance against the exact currently published files."""
from pathlib import Path
import hashlib, re, shutil, subprocess

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'site'
DEST=ROOT/'preview/build/main-entry'
ORIGIN='https://nobilog.pages.dev'
LINK='https://nobilog-preview.naon4022.workers.dev/'
def fetch(path):
    return subprocess.run(['curl','--silent','--show-error','--fail','--location','--max-redirs','5','--proto-redir','=https','--max-time','30',ORIGIN+path],check=True,capture_output=True).stdout

def prepare():
    original=(BASE/'index.html').read_bytes()
    if fetch('/')!=original:raise SystemExit('本番の版が変わっています。入口の配信を中止します。')
    for file in BASE.iterdir():
        if file.name=='_headers':continue
        if not file.is_file():raise SystemExit('公開フォルダに不明な項目があります。')
        if fetch('/'+file.name)!=file.read_bytes():raise SystemExit('公開部品が一致しません: '+file.name)
    DEST.mkdir(parents=True,exist_ok=True)
    allowed={file.name for file in BASE.iterdir()}|{'baseline.sha256'}
    if any(file.name not in allowed or not file.is_file() for file in DEST.iterdir()):
        raise SystemExit('入口用フォルダに無関係なファイルがあります。配信しません。')
    for file in BASE.iterdir():shutil.copyfile(file,DEST/file.name)
    page=original.decode()
    if 'name="application-version" content="2.13.0"' not in page:raise SystemExit('入口変更の元の版が違います。')
    anchor='<a id="login-preview-entry" class="login-provider" style="text-decoration:none;justify-content:center" href="'+LINK+'">確認版にログイン</a>'
    marker='<button id="login-create-main" class="login-provider create" onclick="authToggleCreate()">＋ アカウント作成</button>'
    if page.count(marker)!=1:raise SystemExit('入口の位置が一致しません。')
    page=page.replace(marker,marker+'\n        '+anchor)
    page=page.replace('name="application-version" content="2.13.0"','name="application-version" content="2.13.1"',1)
    release="const APP_RELEASE={version:'2.13.1',at:Date.parse('2026-09-30T19:15:00+09:00'),changes:[['ログイン画面・確認版への入口','ログイン画面に「確認版にログイン」を追加しました。確認版専用アカウントで、作業中の画面を開けます。記録は専用の保存先に残し、なお・りらんの本番の記録とは分けて扱います。']]};"
    marker='const APP_RELEASE={version:\'2.13.0\''
    if page.count(marker)!=1:raise SystemExit('更新通知の位置が一致しません。')
    page=page.replace(marker,release+'\n    const RELEASE_2130={version:\'2.13.0\'',1)
    old='RELEASE_2110,RELEASE_2120,APP_RELEASE]'
    if page.count(old)!=1:raise SystemExit('旧通知の保存位置が一致しません。')
    page=page.replace(old,'RELEASE_2110,RELEASE_2120,RELEASE_2130,APP_RELEASE]',1)
    (DEST/'index.html').write_text(page)
    sw=(BASE/'sw.js').read_text()
    if sw.count("const CACHE = 'nobilog-app-v2.13.0';")!=1:raise SystemExit('キャッシュ版が違います。')
    (DEST/'sw.js').write_text(sw.replace("const CACHE = 'nobilog-app-v2.13.0';","const CACHE = 'nobilog-app-v2.13.1';",1))
    # Ensure every changed byte belongs to the reviewed entrance/version/notice edits.
    restored=page.replace(marker.replace('APP_RELEASE','RELEASE_2130'),marker,1)
    restored=restored.replace(release+'\n    ','',1)
    restored=restored.replace('\n        '+anchor,'',1)
    restored=restored.replace('name="application-version" content="2.13.1"','name="application-version" content="2.13.0"',1)
    restored=restored.replace('RELEASE_2110,RELEASE_2120,RELEASE_2130,APP_RELEASE]','RELEASE_2110,RELEASE_2120,APP_RELEASE]',1)
    if restored.encode()!=original:raise SystemExit('入口以外の差分を検出しました。配信しません。')
    (DEST/'baseline.sha256').write_text(hashlib.sha256(original).hexdigest())
    print('Production entrance prepared: exact published baseline, one link, version and preserved notices only')

if __name__=='__main__':prepare()
