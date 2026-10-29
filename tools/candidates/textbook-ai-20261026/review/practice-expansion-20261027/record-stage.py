import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
stamp = HERE / 'recorded-stage.json'
if stamp.exists():
    raise SystemExit('This stage was already recorded; do not duplicate append.')
records = [
    'AI連絡/作業連絡.md',
    'AI連絡/現在の状況.md',
    'IMPROVEMENT_PROGRESS.md',
    'AI連絡/大型更新_できていることと未完了_20261017.md',
    '.claude/HANDOFF.md',
    '2026年10月大型アップデート.md',
    'tools/candidates/textbook-final-20261023/進捗.md',
    'tools/candidates/textbook-ai-20261025/進捗.md',
]
for name in records:
    assert (ROOT / name).is_file(), name
expected = {'library-result.json': 1865, 'arithmetic-result.json': 31,
            'candidate-route-result.json': 125, 'legacy-jobs-result.json': 38,
            'candidate-browser-result.json': 214}
proofs = []
for name, checks in expected.items():
    data = json.loads((HERE / name).read_text())
    assert data['status'] == 'passed' and data['checks'] == checks
    for row in data['inputs']:
        assert hashlib.sha256((ROOT / row['file']).read_bytes()).hexdigest() == row['sha256'], (name, row['file'])
    proofs.append({'file': str((HERE / name).relative_to(ROOT)), 'sha256': hashlib.sha256((HERE / name).read_bytes()).hexdigest()})
visual = json.loads((HERE / 'visual-review.json').read_text())
assert visual['status'] == 'passed' and len(visual['reviewedQuestionIds']) == 48
for row in visual['inputs']:
    assert hashlib.sha256((ROOT / row['file']).read_bytes()).hexdigest() == row['sha256']
before = json.loads((HERE / 'before-full.json').read_text())
assert before['exitCode'] == 0 and before['observedTerminal']
body = '''

### 2026-10-27 最新追記：類題48問候補・旧回答/未完了ジョブ保全（本体未反映）

単独の作業前全体session17771は最後まで終了0、「ぜんぶ通過」を実測し、before-full.json/logへ固定。当方の作業中の変更は隔離候補のみで、予定していた本体6ソースの旧SHA一致も確認した。現本体は従来30問のまま。今回の候補成功を変更後本体・公開済みとは扱わない。

Claude納品原本を保ち、追加18問と既存30問の選択肢位置/長さ改善版を48問として候補制作。過去の30問と旧候補列を別に完全保持。元設問・正式解答の指紋を限定して負の減法3問を既存テストへ追加接続し、現在の教材テストから実到達するのは41/48問。旧記録の39はパターン単位の数え違いで、変更前38→今回41と訂正。残る7問は乗除同順位1・社会6で未接続。旧30を加えて78問の新作とは数えない。

候補の純粋ライブラリ1865、独立AST/分数27式＋不正構文3＋新接続先1の31、実HTTP/SQLite125、旧完成済み/待ち/途中/結果不明の実ジョブ互換38、実UI/実IndexedDB214が成功。旧有料chunkを再生成せず、100回分を二重消費せず、unknownを再送せず、保存manifestの不一致を内容変更として保留。旧UIで保存した旧誤答・未送信回答を候補へ更新して復旧し、通常の成績やAI枠の追加変更なし。48問×3幅を表示検査、48問のスマホ画面すべてと7状態画面を直接目視。文字同士の縦分数と空の解説枠の見た目を最小限のJS/CSS候補で改善。サーバー5＋UI2の7ファイルが反映予定範囲。初回生成/検査の失敗ログと修正前214結果も保全した。

証拠：tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/ の進捗.md、before-full.json、library-result.json、arithmetic-result.json、candidate-route-result.json、legacy-jobs-result.json、candidate-browser-result.json、visual-review.json。次は旧期待SHA/証拠を上書きしない厳密な後続差分の照合を準備し、本体へ反映、現本体の個別検査と変更後単独全体を実行する。Claudeアプリとの接続は未成立・依頼文は未送信で、稼働も未確認。教科書画像AI、全問解説の実キュー運用、他形式の接続、未点検画像/動画/原本、その他非admin残件は未完了。公開・コミット・削除・admin編集・実Gemini・スケジュール再開・秘密値/実記録操作は実施していない。
'''
# Append only; never load the private HANDOFF or any credential store.
for name in records:
    with (ROOT / name).open('a', encoding='utf-8') as stream:
        stream.write(body)
stamp.write_text(json.dumps({'status': 'candidate stage recorded; main integration pending',
                             'records': records, 'bodySha256': hashlib.sha256(body.encode()).hexdigest(),
                             'proofs': proofs}, ensure_ascii=False, indent=2) + '\n')
print('Eight records updated by append only; candidate, main and unfinished scopes separated.')
