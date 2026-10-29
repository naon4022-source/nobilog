"""Private Mac dialogs: never write entered PINs, pepper, or hashes to files/logs."""
import base64, hashlib, hmac, json, os, re, secrets, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent
NAMES={'p_mini':'Mini','p_standard':'Standard','p_pro':'Pro','p_unlimit':'UNLIMIT'}
def notice(text):
    subprocess.run(['osascript','-e','display dialog '+json.dumps(text,ensure_ascii=False)+' buttons {"OK"} default button "OK"'],capture_output=True)
def main():
    pepper=secrets.token_hex(32);hashes={};seen=set()
    for uid,name in NAMES.items():
        message=name+'確認版専用の4桁パスコードを入力してください。ほかのプランとは違う番号にしてください。'
        r=subprocess.run(['osascript','-e','text returned of (display dialog '+json.dumps(message,ensure_ascii=False)+' default answer "" with hidden answer buttons {"キャンセル", "次へ"} default button "次へ" cancel button "キャンセル")'],capture_output=True,text=True)
        if r.returncode:return
        pin=r.stdout.rstrip('\r\n')
        if not re.fullmatch(r'[0-9]{4}',pin) or pin in seen:
            notice('4桁の数字を、各プラン別の番号で入力してください。設定は変更していません。');return
        seen.add(pin)
        hashes[uid]=base64.urlsafe_b64encode(hmac.new(pepper.encode(),(uid+'|'+pin).encode(),hashlib.sha256).digest()).decode().rstrip('=')
    pin=None;seen.clear()
    r=subprocess.run(['osascript','-e','button returned of (display dialog "4プランの確認版パスコードをCloudflareに登録します。既存の通常確認版パスワードは変更しません。" buttons {"キャンセル", "登録"} default button "登録" cancel button "キャンセル")'],capture_output=True)
    if r.returncode:return
    childenv=dict(os.environ);childenv['PATH']='/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:'+childenv.get('PATH','')
    if not shutil.which('npx',path=childenv['PATH']):notice('登録に必要な実行環境を見つけられませんでした。パスコードは保存していません。');return
    payload=json.dumps({'PREVIEW_PLAN_PEPPER':pepper,'PREVIEW_PLAN_HASHES':json.dumps(hashes)})
    try:r=subprocess.run(['npx','--yes','wrangler@latest','secret','bulk','--config','wrangler.jsonc'],cwd=ROOT,input=payload,text=True,capture_output=True,env=childenv,timeout=180)
    except (OSError,subprocess.TimeoutExpired):notice('接続を確認できませんでした。設定完了とは扱っていません。');return
    payload=pepper=None;hashes.clear()
    notice('4プランの検証値を登録しました。入力した番号はファイルに保存していません。' if r.returncode==0 else 'Cloudflareへの登録に失敗しました。ログイン状態を確認してください。')
if __name__=='__main__':main()
