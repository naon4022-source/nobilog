import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
stamp = HERE / 'recorded-main-stage.json'
assert not stamp.exists(), 'Main stage already appended; inspect instead of repeating.'
receipt = json.loads((HERE / 'main-integration.json').read_text())
for row in receipt['products'] + receipt['verifiers']:
    assert hashlib.sha256((ROOT / row['file']).read_bytes()).hexdigest() == row['afterSha256']
checks = json.loads((HERE / 'main-checks.json').read_text())
assert checks['status'] == 'passed'
for row in checks['checks']:
    assert hashlib.sha256((ROOT / row['file']).read_bytes()).hexdigest() == row['sha256']
run = json.loads((HERE / 'after-full-start.json').read_text())
assert run['status'] == 'running' and run['session'] == 75841
records = json.loads((HERE / 'recorded-stage.json').read_text())['records']
assert len(records) == 8 and all((ROOT / name).is_file() for name in records)
body = '''

### 2026-10-27 最新追記：類題48問を手元本体へ反映・最終全体は実行中

前追記の「本体は30のまま」を更新。Claude追加18問＋既存30問改善版を48問として、手元本体のサーバー5ファイルと類題UIのJS/CSS2ファイルだけへ反映した。旧30問・旧候補順序は過去の回答/有料ジョブ用に保持。実到達41/48で、乗除同順位1・社会6の7問は未接続のまま。公開版/確認版への追加公開、その他の教材や既存の成績の変更は行っていない。

旧5ソース/5素材/125・145証拠/3目視画像/旧30問の照合を残し、認めた7本体＋8検証の差分だけを厳密に前段へ戻す後続を追加。隔離コピー34項目と旧integration88項目が成功し、ソース/証拠/バックアップ/参照資料の変更を拒否。実本体でも純粋ライブラリ1007、本人用HTTP/SQLite125、3幅実画面199、integration88が終了0。worker/client/10月25日serviceの旧照合5/3/6も成功。旧成功JSON4本・旧目視画像3枚・教材パッケージ2本のSHAは保った。元の期待SHAや旧成功を新結果で上書きせず、current別名へ保存している。

変更後の単独全体はsession75841で実行中。証拠は practice-expansion-20261027/after-full-start.json と after-full1.log。15変更ソース、補助/後続記録、runner、保全9素材のSHAを開始時固定した（全リポジトリの一括スナップショットではない）。本体の変更を止めて同じ実行の終了を確認する。終了0はまだ未確認なので、全体合格・全非admin完成とは扱わない。残る画像AI、他の出題形式、実キュー運用、未点検素材、その他の残件/保留は引き続き未完了。

反映記録は main-integration.json（不変の後続）、promotion.json、main-checks.json、successor-clone-result.json。作業前の全体17771終了0と候補1865/31/125/38/214成功・48問目視の記録は保持。Claudeアプリは未接続/未送信のまま。admin・公開・コミット・削除・実Gemini・自動再開スケジュール・秘密値/実ユーザーデータの操作はしていない。
'''
for name in records:
    with (ROOT / name).open('a', encoding='utf-8') as stream:
        stream.write(body)
stamp.write_text(json.dumps({'status': 'local main reflected; final full running', 'records': records,
                             'session': 75841, 'bodySha256': hashlib.sha256(body.encode()).hexdigest()}, ensure_ascii=False, indent=2) + '\n')
print('Eight records now reflect actual local main48; final full explicitly running, not passed.')
