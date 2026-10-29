"""Append this isolated candidate stage once; never copy private handoff text."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parents[3]
folder = Path(__file__).resolve().parent
receipt = folder / 'recorded-stage.json'
if receipt.exists():
    raise SystemExit('This stage was already recorded; do not append twice.')

manifest = json.loads((folder / 'manifest.json').read_text())
for entry in manifest['files'] + manifest['proofs']:
    assert hashlib.sha256((root / entry['file']).read_bytes()).hexdigest() == entry['sha256'], entry['file']
for entry in json.loads((root / 'tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/after-full-start.json').read_text())['inputs']:
    assert hashlib.sha256((root / entry['file']).read_bytes()).hexdigest() == entry['sha256'], entry['file']

paths = [
    'AI連絡/作業連絡.md',
    'AI連絡/現在の状況.md',
    'IMPROVEMENT_PROGRESS.md',
    'AI連絡/大型更新_できていることと未完了_20261017.md',
    '.claude/HANDOFF.md',
    '2026年10月大型アップデート.md',
    'tools/candidates/textbook-final-20261023/進捗.md',
    'tools/candidates/textbook-ai-20261025/進捗.md',
]
text = '''

## 2026-10-27 追記：教科書画像AIの入力・通信・型付き金額記録の独立候補

`tools/candidates/textbook-vision-20261027/README.md` に独立候補を記録した。本体へは未反映・未有効化。本人の教科書/版/箇所だけの画像キー、PNGのCRC/画素ID/解凍量、外部URL拒否、Pro=LUNA・UNLIMITED=SOLの入力を実装。共有の通信/安全確認を再利用し、画像のトークン数確認と生成を同じ入力で行う候補を用意した。公式仕様の確認先は同フォルダ `official-contract.json`。

画像専用の `visionPricing` に本文のSHA・モデル・画像数・合計上限を固定する金額記録を追加。既存の文字用精算の制約は変更していない。数確認/生成の前に送信開始を永続化し、同時実行や応答消失から二重送信しない。確実に未送信の失敗だけ同じ原本/一回印で金額を原子的に戻し、送信済み/不明結果は確保を保持。正常終了も事前確認の実請求が不明なため合計確保を保持し、正確な請求額や利用枠の返却成功とは呼ばない。

個別検査は入力347、通信65、型付き金額記録354項目がすべて終了0。空のSQLiteメモリDB、合成画素、合成HTTPのみ。入力/出力の拒否、所有者・本文の変更、本人切替、通信結果消失、送信開始直後の処理消失、完了保存の応答消失、同時実行、予約/返却の途中失敗を点検。各結果の実ソースSHAとmanifestを照合済み。金額記録の初回312項目と拡張354項目のログは別名で残す。

未完了：本人用HTTP入口・同意/教科書権限との一体化、プラン利用枠の控えと共有10回/日の接続、画像の保存/取得入口と上限、旧履歴/送信待ちとの互換、表示中の図だけを送る実画面、実IndexedDB/画面の競合・復旧、本体反映と反映後の全体検証。画像AIを完成/実利用可能とは記録しない。

類題48問の本体反映後の単独全体は、同じ実行75841を生存確認した時点で継続中。`tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/after-full1.log` の終端成功はまだ未観測。凍結した27入力のSHAに差分なし（リポジトリ全体の無変更証明ではない）。本体のテスト実行を重複起動せず、mainの対象ソース/不変の後続記録/旧証拠を変更していない。

Claudeアプリは未接続・未送信。新規エージェント・admin・公開・コミット・削除・実Gemini・自動スケジュール・秘密値/実ユーザーデータ操作は行っていない。本人操作はユーザー帰宅後。残る全体目標は継続中。
'''
records = []
for name in paths:
    path = root / name
    assert path.is_file(), name
    before = path.read_bytes()
    addition = text.encode('utf-8')
    with path.open('ab') as stream:
        stream.write(addition)
    after = path.read_bytes()
    assert after == before + addition, name
    records.append({'file': name, 'beforeSha256': hashlib.sha256(before).hexdigest(), 'afterSha256': hashlib.sha256(after).hexdigest()})
receipt.write_text(json.dumps({'status': 'candidate stage recorded; main final full still live when checked', 'records': records, 'appendSha256': hashlib.sha256(text.encode()).hexdigest()}, ensure_ascii=False, indent=2) + '\n')
print('Appended candidate facts to 8 records; no prior content copied or replaced.')
