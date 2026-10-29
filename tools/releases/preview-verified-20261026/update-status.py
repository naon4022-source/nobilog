# -*- coding: utf-8 -*-
from pathlib import Path
import hashlib
import json

r = Path('tools/candidates/textbook-ai-20261026/review')
b = Path('tools/releases/preview-verified-20261026')
p = b / 'promotion.json'
value = json.loads(p.read_text())
value.update(status='actual main applied;134 lock UI and84 exam fixture checks passed; publication pending', observedTargetedExitCode=0)
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
p = b / 'intent.json'
value = json.loads(p.read_text())
value.update(status='authorized preview deploy prepared; actual main lock134 and fixture84 passed; no publication yet', latestFull='29789 terminal1/drift0; sole outdated exam fixture failed, now repaired with all84 original checks passed. Mandatory final full before publication remains required.')
value['remaining'] = ['Run existing preview/deploy.sh once: whole success, package81, scan/names, dry-run, preview deploy', 'Verify published preview isolation/version metadata; no production deployment or credential/record reading']
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

note = '''

### 2026-10-26 鍵から料金説明へ直行する修正を手元反映・確認版公開前の最終工程

全体29789は終了1、入力SHA変化0。失敗は検定の画面待ち1件で、旧検査用サーバーが現行のテスト開始記録を扱っていなかった。他の教材検証と同じ既存の隔離fixtureを3行追加し、問題数・順番・採点・保存など元の条件を削らず84項目が終了0。失敗した全体結果は成功へ変更しない。84081の古い抽出も訂正し、TimeoutErrorを含め実際は16失敗ブロックだったことを記録した。

継続中の修復作業として、鍵から既存の料金比較へ直行する1行を実際のplan-study.jsへ反映し、実際の元検証134項目が終了0。Free/Mini/Standard/Pro/UNLIMITを分け、保存・下書き・採点・有料処理の権限は維持。preview/deploy.shの先頭の全体検証を残し、成功後に専用ビルドとWorker依存補完、隔離5プラン等81項目、秘密形式スキャンを追加。元の秘密名確認、dry-run、確認版公開の順序を保つ。本編/admin/認証/秘密設定は変更しない。数学の許可章を1〜5へ更新し、75本と読書画面の現SHAを既存300再生の証拠と照合した。

次はユーザー承認済みのpreview/deploy.shを一度実行し、最終全体が失敗すれば配信しない。未点検の他教科105動画とV3協力は、この配信物だけで非公開。まだ公開済みとも全体完成とも扱わない。証拠：tools/releases/preview-verified-20261026/promotion.json。
'''
files = ['AI連絡/作業連絡.md', 'AI連絡/現在の状況.md', 'IMPROVEMENT_PROGRESS.md', 'AI連絡/大型更新_できていることと未完了_20261017.md', '.claude/HANDOFF.md', '2026年10月大型アップデート.md', 'tools/candidates/textbook-final-20261023/進捗.md', 'tools/candidates/textbook-ai-20261025/進捗.md']
for file in files:
    p = Path(file)
    text = p.read_text()
    assert '### 2026-10-26 鍵から料金説明へ直行する修正を手元反映' not in text
    p.write_text(text + note)
p = Path('AI連絡/現在の状況.md')
text = p.read_text()
start = text.index('**公開なし・実AI有効化なし・全体目標は未完了。**')
end = text.index('\n\n### 手元本体で確認済み', start)
text = text[:start] + '**確認版はまだ未公開・新しい実AI有効化なし・全体目標は未完了。** 確認版だけの配信をユーザーが許可。本編は更新しない。5プランを分けたまま、鍵を押すと料金説明へ直行する1行を本体反映し134項目が成功。全体29789は検定の旧仮サーバー1件で終了1・SHA変化0。検査側だけを現行方式に合わせ、元の84項目が成功。既存preview/deploy.shの最終全体・専用梱包81・秘密形式/名前・dry-runを成功させてから確認版だけ公開する。' + text[end:]
p.write_text(text)

changed = [item['file'] for item in json.loads((b / 'promotion.json').read_text())['files']]
changed += ['.claude/verify/verify-kentei-browser.mjs']
changed += [str(b / name) for name in ['prepare-release.py', 'verify-package.mjs', 'scan-package.py', 'promote.py']]
p = r / 'source-review.json'
value = json.loads(p.read_text())
rows = {item['file']: item for item in value['files']}
for file in changed:
    rows[file] = {'file': file, 'sha256': hashlib.sha256(Path(file).read_bytes()).hexdigest()}
value['files'] = list(rows.values())
value['status'] = 'Actual lock134 and original exam84 passed; exact source additions reviewed; final authorized preview deploy full pending.'
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
previous = json.loads((r / 'post-math-full-attempt2.json').read_text())
paths = set(previous['firstObservedInputSha256']) | set(changed)
value = {'status': 'prepared; final full/deploy not launched', 'observedExitCode': None,
         'firstObservedInputSha256': {file: hashlib.sha256(Path(file).read_bytes()).hexdigest() for file in sorted(paths)},
         'log': str(b / 'deploy-attempt1.log'), 'previousFailedFull': str(r / 'post-math-full-attempt2.json'),
         'targetedChecks': {'lockUI': 134, 'examFixture': 84, 'stagePackage': 81},
         'workStartPassedProof': 'tools/candidates/textbook-final-20261023/pre-full-verification.json',
         'scope': 'Dedicated preview only. Existing script requires full success before packaging/scans/names/dry-run/deploy.'}
(b / 'deployment.json').write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
print('All8 records match actual main/fixture changes and pending preview publication; goal incomplete.')
