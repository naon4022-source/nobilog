"""Record actual terminal full success, then update status metadata only."""
from pathlib import Path
import hashlib
import json
import sys

H = Path(__file__).resolve().parent
R = H.parents[2]
W = R / '教材整理/Claude_Codex共有/数学全体制作'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
write = lambda p, d: p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert sys.argv[1:] == ['84909', '0'], 'pass the actually observed session and exit code'
assert not (H / 'layout-post-full-verification.json').exists(), 'already finalized'
log = Path('/tmp/nobi-c5-layout-full-20261021.log')
assert log.read_text().rstrip().endswith('✅ ぜんぶ通過')
inputs = load(H / 'layout-full-inputs.json')
additive_run_change = None
for name, digest in inputs.items():
    if sha(R / name) == digest:
        continue
    assert name == '.claude/verify/run.sh', 'math full-run input drift: ' + name
    # Claude added one stronger suite while the shared run was in progress.
    # Prove the complete previous script byte-for-byte, and require evidence
    # that this exact added invocation also ran and passed in this same run.
    current = (R / name).read_bytes()
    added = b'node "$VERIFY_DIR/verify-nonadmin-settings-browser.mjs" || fail=1\n'
    assert current.count(added) == 1
    assert hashlib.sha256(current.replace(added, b'', 1)).hexdigest() == digest
    assert 'Non-admin settings/sound: 178 checks passed;' in log.read_text()
    additive_run_change = {'path': name, 'beforeSha256': digest, 'afterSha256': sha(R / name),
        'scope': 'one additional test invocation; all original bytes preserved; added 178 checks observed passed',
        'analysis': 'layout-full-input-drift.json'}
integration = load(H / 'layout-integration.json')
assert integration['postIntegrationChecks']['status'] == 'passed'
assert integration['postIntegrationChecks']['videoPlays'] == 48
assert integration['postIntegrationChecks']['figureChecks'] == 1088
proof = {'status': 'passed', 'session': 84909, 'observedExitCode': 0,
         'log': str(log), 'logSha256': sha(log), 'inputs': inputs,
         'bookSha256': sha(R / 'site-assets/textbook-book-math1.json'),
         'additiveVerificationChange': additive_run_change,
         'scope': 'post-layout full suite exit0, fixed math inputs; one audited additive shared test; subsequent edits below change status metadata only; Claude nonadmin final full remains separate'}
write(H / 'layout-post-full-verification.json', proof)
ref = {'status': 'passed', 'proof': str((H / 'layout-post-full-verification.json').relative_to(R))}
integration['postFullSuite'] = ref
write(H / 'layout-integration.json', integration)
active = load(H / 'layout-active-full-run.json')
active.update(status='completed', observedExitCode=0, proof=ref['proof'])
write(H / 'layout-active-full-run.json', active)

p = W / '制作台帳.json'
ledger = load(p)
slot = next(x for x in ledger['imageSlots'] if x['id'] == 'M1-C5-S2-APPLY')
candidate = next(x for x in slot['candidates'] if x['id'] == slot['selected'])
candidate['status'] = '1枠1枚・目視/手元反映/本内4幅/変更後指定全体検証成功'
chapter = ledger['latestLocalRechecks']['chapter5']
chapter['images'] = 39
chapter['latestLayoutFullSuite'] = ref
chapter['layoutFollowup'] = {'status': 'two newly introduced gaps resolved and full suite passed',
    'resolvedSpreads': ['416-417', '420-421'], 'evidence': str((H / 'layout-integration.json').relative_to(R)),
    'scope': 'earlier unrelated pictureless spreads and broader content/device checks remain separate'}
write(p, ledger)
p = W / 'メディア/制作ソース/依頼台帳_1件ずつ.json'
requests = load(p)
images = {x['id'] for x in load(H / 'current-evidence.json')['images']}
for row in requests:
    if row['id'] in images:
        row['state'] = '2026-10-21 素材目視・SHA・手元本内表示と配置変更後の指定全体検証成功。原資料全文/実機等は別。'
        row.setdefault('latestLocalRecheck', {})['fullSuite'] = ref
write(p, requests)
p = W / 'メディア/制作ソース/69本_制作進捗.json'
progress = load(p)
for item in progress['items']:
    if item['id'].startswith('M1-C5-'):
        item['latestLayoutVerification'] = {'date': '2026-10-21', 'fullSuite': ref, 'videoBytesUnchanged': True,
            'scope': 'layout changed; four-width playback passed; previous full AV/302-scene evidence SHA matched'}
progress['verification']['chapter5Recheck']['latestLayoutFullSuite'] = ref
progress['verification']['chapter5Recheck']['images'] = 39
write(p, progress)
note = '''

### 2026-10-21 数学5章配置：変更後の指定全体検証成功

全体84909の終了0・末尾「ぜんぶ通過」を観測し、数学の固定入力SHA一致を確認。共有run.shだけClaudeが検証1行を追加していたため、最初の厳格固定チェックは失敗。追加行を除く全バイトが元SHAと一致し、追加178件も同実行で成功したことを証明して例外を明記。証拠は tools/candidates/math-ch5-recheck-20261019/layout-post-full-verification.json と layout-full-input-drift.json。Claudeの非admin変更後全体89159は別に実行中で、その成功とは混同しない。生成済みAPPLY1枚を採用し、既存DP3を対応する例題へ移動。本文/問題/答え/数値不変、マーカー2724件を保持。原稿441/本652ページ、403素材枠、5章39画像。反映後の画像1088項目・答え開閉78項目・12動画×4幅48回再生が成功。今回の新規画像生成/動画再制作/再復号は0。全体終了後は状態メタデータだけを成功へ更新。

5章で新たに生じていた図なし416-417/420-421は解消。既存の他の図なし見開き、原資料全文/本文全問/新たな聴取/iPhone実機は未完了と区別。次は付録6動画の実物/依頼/既存検証を照合。主69動画の既存点検と、全担当動画完了を混同しない。Claude担当6・7章19動画は再制作なし。Claudeへ渡した非admin残機能は二重編集せず、サブスクAIの5保留を維持。公開・コミット・削除・admin・実Gemini・スケジュール変更なし。
'''
for name in ['AI連絡/数学5章_反映と検証結果_20261020.md', 'AI連絡/作業連絡.md', 'AI連絡/現在の状況.md',
             'IMPROVEMENT_PROGRESS.md', '2026年10月大型アップデート.md', '.claude/HANDOFF.md']:
    with (R / name).open('a', encoding='utf-8') as f:
        f.write(note)
print('Observed full success and unchanged inputs recorded; metadata synchronized; broader goal remains incomplete')
