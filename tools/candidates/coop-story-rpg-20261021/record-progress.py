"""Append exact candidate status only after full and isolated results exist."""
from pathlib import Path
import hashlib,json
H=Path(__file__).resolve().parent
R=H.parents[2]
full=json.loads((R/'tools/candidates/social-geo-nihon-review-20261021/post-full-input-drift-52964.json').read_text())
assert full['status']=='observed_full_exit0_but_input_identity_not_certified' and full['sessionId']==52964
proof=json.loads((H/'candidate-verification.json').read_text())
assert len(proof['checks'])==4 and all(row['exitCode']==0 for row in proof['checks'])
for file,value in proof['sha256'].items():
 if Path(file).suffix == '.mjs':
  assert hashlib.sha256((H/file).read_bytes()).hexdigest()==value,file
old=R/'tools/candidates/vs-coop-room-20261021/provenance.json'
legacy=json.loads(old.read_text())
legacy['bossRule']='superseded by latest user decision: tap RPG, 2-3 participants only, companion clear history'
legacy['coopSupersededBy']='tools/candidates/coop-story-rpg-20261021/実装条件.md'
legacy['reuseBoundary']='two-player lobby candidate is not the new 2-3 participant RPG; VS remains separate and unintegrated'
old.write_text(json.dumps(legacy,ensure_ascii=False,indent=2)+'\n')
marker='### 2026-10-21 Codex：協力RPGは2〜3人専用・仲間のクリア履歴'
entry='''

'''+marker+'''

最新のユーザー回答で、物語付きタップRPGは2〜3人専用、1人では開始不可、ステージ履歴に誰とクリアしたかを記録する仕様へ確定。旧「2人固定」「正解数の合算でボス撃破」の案はこのRPGには使わない。通常VSは別の残件。

tools/candidates/coop-story-rpg-20261021/ に隔離候補を準備。単独開始拒否/2・3人開始/4人目拒否/1人時の一時停止/復帰/再送/仲間別履歴と、本人別の正解済み候補、素手・装備なし開始/装備によるタップ攻撃力、D1相当の実メモリーSQLiteによるCAS/所有者失効/同時更新/履歴の一括保存・ロールバックを4ハーネスで確認。検査対象コードSHAはcandidate-verification.jsonに保存。実ユーザーデータ・Cloudflare・ネットワーク不使用。

これは候補の部分検証であり、本体組み込み・実際の2〜3人通信・部屋招待/承認・接続期限・装備/購入の永続化・学習保存成功直後の連動・問題採点・ハンバーガーメニュー/画面・全章本文・実画面/変更後全体の完了ではない。物語は全12章の構成と第1〜5章初稿を準備し、第6〜12章と全章内容点検は未完了。既存単語履歴cは正解回数のみで方向別情報を持たないため、全方向で正解済みと推定しない。既存教材/成績/政治経済の現金を変更しない。物理的な通信遅延ゼロは保証しない。

先行していた全体52964は同じハンドルで終了0・ぜんぶ通過を確認。ただし確定時に固定入力7件のSHA不一致があり、現状の本体への最終合格の紐付けはできていない。教材エンジンは記号組の区切りに→を許容する1行差分で、配信/Workerコピーも変更されている。問題データにも社会以外の差分があり、追加のエンジン55項目は通過したが、社会用の「対象1単元以外不変」の照合は失敗（反例の再採点に入る前の失敗）。現在の本体全体成功とは扱わない。既存変更の作成者を推定したり上書きしたりせず、元1575入力と終了ログ、現差分を social-geo-nihon-review-20261021/post-full-input-drift-52964.json に保全。52964の確定スクリプトのSHA不一致失敗も保全対象。差分の照合と変更後再検証が必要。

今回のRPGコードは固定入力外の隔離候補であり、52964をRPG本体完成の証拠にしない。ゴール全体は未完了。公開/コミット/削除/admin制作/スケジュール再開なし。
'''
tracking=H/'progress-recorded.json'
recorded=json.loads(tracking.read_text()) if tracking.exists() else []
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 if name not in recorded:
  with (R/name).open('a') as f:f.write(entry)
  recorded.append(name)
  tracking.write_text(json.dumps(recorded,ensure_ascii=False,indent=2)+'\n')
print('Recorded verified isolated candidate status and remaining integration work in five progress files.')
