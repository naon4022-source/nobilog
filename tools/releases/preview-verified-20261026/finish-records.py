# -*- coding: utf-8 -*-
from pathlib import Path
import ast
import datetime
import hashlib
import json

b = Path('tools/releases/preview-verified-20261026')
r = Path('tools/candidates/textbook-ai-20261026/review')
published = json.loads((b / 'published-version.json').read_text())
public = json.loads((b / 'public-result.json').read_text())
package = json.loads((b / 'package-result.json').read_text())
scan = json.loads((b / 'scan-result.json').read_text())
assert all(value['status'] == 'passed' for value in [published, public, package, scan])
assert published['release'] == '2.51.0' and package['checks'] == 96 and public['checks'] == 13
p = b / 'deployment.json'
value = json.loads(p.read_text())
assert value['observedExitCode'] == 0 and value['unreviewedInputChanges'] == []
value.update(status='preview published and remote metadata/public checks passed; human login/UI confirmation pending',
             verifiedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), versionId=published['versionId'],
             release=published['release'], publicChecks=public['checks'], scannedTextFiles=scan['filesChecked'],
             userLoginConfirmation='pending; no credentials or private account records inspected')
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
p = b / 'intent.json'
value = json.loads(p.read_text())
value.update(status='preview v2.51.0 published;96 package/13 public checks passed; human login confirmation pending',
             publishedVersion=published['versionId'], origin=published['origin'])
value['remaining'] = ['Human-only check: correct preview plan and one lock click opens pricing; never request/read a password',
                      'Return to remaining textbook vision/media/practice/source coverage and other non-admin work; whole goal incomplete']
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

note = '''

### 2026-10-27 確認版 v2.51.0 公開・ロックから料金説明への導線を反映

ユーザーの明示許可に沿って確認版だけ公開。URLは https://nobilog-preview.naon4022.workers.dev 。本編は公開/更新していない。配信親処理38777の終了0を直接確認し、公開されたWorker版は8b5432f2-b6f2-4243-b1a0-053742bd76ee。変更後の本体全体検証は「ぜんぶ通過」まで完走し、既存のset-e配信手順が専用梱包・検証・秘密名・dry-run・実配信まで終了0で進んだ。途中の全体失敗や中断を成功に置き換えない。

5プランを分けたまま、ロックを1回押すと既存の料金比較を開く。元の134項目と検定fixtureの84項目は条件を削らず通過。本体検査の入力は固定し、その完走後、配信専用の管理機能非公開を別の96項目とdry-runで点検。管理モジュール原本は編集せず、配信物の入口/管理APIを閉じ、共用の新聞表示は保持した。配信専用補助2本の変更とconfigのmainだけの変更はadmin-release-amendment/amendment.jsonで前後SHAを固定。開始時スナップショットは書き換えず、配信補助2本の実際の変化を記録し、未確認の変化0を確認した。

数学1〜5章69本＋巻末6本の現媒体/読書画面SHAは既存300再生の証拠に一致し、許可章を1〜5へ反映。Claude6/7章19本は再制作しない。未点検の他教科動画105本とV3協力は配信物で非公開。333テキスト/コード公開物の秘密形式スキャン、専用DB/KV・秘密名だけの照合、実公開後のログイン画面/私的API拒否/異なるOrigin拒否/管理入口非公開13項目が成功。秘密値・認証ストア・実ユーザーの成績は読み出していない。既存のOpenAI試験設定は維持し、新しい実AI有効化・実Gemini・週次作業の再開は行わない。

本人のパスワードは扱わず、ログイン後に表示プランが合い、鍵1回で料金説明が開くかは本人確認待ち。隔離5プランの検査を実5アカウントのログイン成功とは呼ばない。公開/検証の証拠は tools/releases/preview-verified-20261026/{deployment.json,published-version.json,package-result.json,scan-result.json,public-result.json}。

Claudeの追加18問はpractice-bank.jsonのSHA262837d2…と全10ファイル/参照3件の一致を確認。703項目はClaude報告であり、Codexの画面点検/本体取り込みはまだ。既存30問の答え位置規則性・長さの手がかり2問も未修正。社会の下書き16単元点検→残る地理8単元制作を、AI連絡/Claudeへ_社会特訓の点検と地理残8単元_20261027.md に依頼文として保存した（送信なし）。教科書画像AI、全問解説キューの実運用、類題全形式接続、未点検動画/画像/原本、他の非admin残件は未完了。全体ゴールは完了にしない。
'''
source = ast.parse((b / 'update-status.py').read_text())
files = next(ast.literal_eval(node.value) for node in source.body if isinstance(node, ast.Assign)
             and any(isinstance(target, ast.Name) and target.id == 'files' for target in node.targets))
for file in files:
    p = Path(file)
    text = p.read_text()
    assert '### 2026-10-27 確認版 v2.51.0 公開・ロックから料金説明への導線を反映' not in text
    p.write_text(text + note)
p = Path('AI連絡/現在の状況.md')
text = p.read_text()
start = text.index('<!-- CODEX_CURRENT_TEXTBOOK_STATUS_BEGIN -->')
end = text.index('### 手元本体で確認済み', start)
header = '''<!-- CODEX_CURRENT_TEXTBOOK_STATUS_BEGIN -->
## 最新要約：2026-10-27／確認版v2.51.0公開済み・全体ゴールは未完了

**確認版だけ公開。本編は未更新、新しい実AI有効化なし。** 配信38777は終了0。変更後の本体全体検証成功、ロックUI134・旧検定fixture84、専用梱包96、公開物333ファイルの秘密形式スキャン、実公開後13項目と専用保存先/版の照合が成功。5プランの区別とサーバーロックを保ち、鍵1回で料金比較へ。停止中の管理入口/APIとV3協力、未点検の他教科105動画は配信物のみで非公開。共用の新聞は維持。

本人のログイン後にプランと料金説明への移動が合うかは確認待ち。秘密値/実成績を読み出していない。配信専用変更2本とconfigのmainだけの変更は厳密なSHAで別記し、未確認の入力変化0。全ての項目完成とは扱わない。

'''
text = text[:start] + header + text[end:]
p.write_text(text)
p = r / 'resume.json'
value = json.loads(p.read_text())
value.update(status='active; preview v2.51.0 published/verified96+13, human login confirmation pending; broad goal incomplete',
             activeSessions=[],
             lastGoalTurnClassification='progress: actual preview deploy38777 observed0; mandatory base full passed, reviewed packaging96/scan333/dry-run passed; remote published version/bindings and13 public probes passed. Claude18 SHA intake verified, independent social prompt saved. Goal not complete.')
value['deploymentParentHold']['status'] = 'resumed and parent completed0'
value['next'] = ('No duplicate publish. Handle human pricing/plan feedback first; never read passwords or private learner data. '
                 'Claude has the saved social16+geography8 prompt but no message sent. Read claude-intake-20261027.json and Claude README; '
                 '18-question SHA verified only,703 checks reported by Claude. Next inspect own verify script safely, integrate18 in isolated '
                 'candidate/current practice version, fix predictable choices/2 long correct options with old pending-answer/attempt compatibility. '
                 'Main30 must not be re-created. Textbook vision remains text-only; follow vision-gap-audit.json for Pro Luna/Unlimited Sol, '
                 'owned images/early rights/consent/quota/budget/unknown outcomes.105 nonmath movies and images/source checking, broader non-admin items remain. '
                 'Admin/production/commits/deletions/Gemini/automation still stopped. Preview publication was specifically authorized; no other release authorized.')
value['priorityPreviewPublication'] = str(b / 'deployment.json')
value['claudePrompt'] = 'AI連絡/Claudeへ_社会特訓の点検と地理残8単元_20261027.md'
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
print('All8 records synchronized with actual preview publication, verified limits, Claude intake and remaining work.')
