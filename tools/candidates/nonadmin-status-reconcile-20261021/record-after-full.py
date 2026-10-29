"""Record source inventories after the active verification has actually succeeded."""
from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2]
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
proof=load(R/'tools/candidates/math-appendix-recheck-20261021/post-full-verification.json')
assert proof['status']=='passed' and proof['observedExitCode']==0
assert sha(Path(proof['log']))==proof['logSha256']
images=load(H/'image-reference-reconcile.json');bank=load(H/'material-bank-counts.json');holds=load(H/'unbound-image-slots.json')
assert sha(R/'site-assets/material-bank.json')==bank['bankSha256']
assert images['missingImageFiles']==0 and images['legacyMathUnselectedCount']==44 and holds['count']==15
assert sum(bool(x['currentBookReferences']) for x in images['legacyMathUnselected'])==29
for b in images['books']:assert sha(R/'site-assets'/b['book'])==b['bookSha256']
math=load(H/'math-target-coverage.json')
assert math['codexTargets']==math['codexCurrentAllHashMatched']==75 and math['claudePreservedCount']==19 and math['actualBookVideoReferences']==94
assert math['bookSha256']==sha(R/'site-assets/textbook-book-math1.json')
assert all(x['sourceSha256']==x['copySha256'] for x in math['claude'])
math.update(status='75 current Codex targets bound to original/copy/request/fullAV/visual evidence; combined post-change full passed',postFullSuite={'sessionId':proof['sessionId'],'log':proof['log'],'logSha256':proof['logSha256']})
(H/'math-target-coverage.json').write_text(json.dumps(math,ensure_ascii=False,indent=2)+'\n')
entry='''\n\n### 2026-10-21 Codex：画像/特訓の現物照合（重複生成を回避）

6冊の本データを再帰走査し771画像参照は全て手元ファイルあり。場面は数学48・国語52・英語34・理科19・地理17・歴史19。これはファイル存在の証拠であり全画像の内容採用とは別。srcなしの非数学動画枠はNHK外部リンクがあり、未制作画像として生成しない。外部リンクの最新到達性は今回未確認。

数学旧台帳の未選択44枠のうち29枠は実本で既に参照されており、再生成しない。残15枠は原稿の明示ID参照・本の追加エントリー・現在本参照・元素材がいずれもなく、汎用の将来枠。実際の対象ページ/既存例題/目的/隠す答えを具体化するまで仕様保留。15件別々の理由/必要情報/SHAを tools/candidates/nonadmin-status-reconcile-20261021/unbound-image-slots.json に保存。math2章タイルの内容条件確認待ちは、ファイル欠落と混同せず従前の記録を維持。今回画像生成0、削除0。

数学動画の対象はCodex75本（1章21/2章13/3章11/4章12/5章12/付録6）。75本全ての現在の元MP4/本コピー/依頼/既存全AV・全場面点検証拠SHAが一致し、各IDの本参照は1件。既存目視標本は計1805場面。Claude6・7章19本も元/コピーSHA一致で保全、今回再制作/内容再点検なし。全本参照は94件。math-target-coverage.json。新たな実聴/全端末確認や全教材の本文全問点検まで済んだ意味ではない。

実bankは教科書139単元9820問、特訓50単元3500問（社会1追加）、ドリル22単元2200問。登録数を内容全問点検や全対象充足とは扱わない。正本 image-reference-reconcile.json と material-bank-counts.json。\n'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/name).open('a') as f:f.write(entry)
print('Recorded current image references and15 unbound holds without generation; bank counts matched current SHA')
