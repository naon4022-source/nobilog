"""Bind completed visual/content review notes to the currently adopted media."""
from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
e=load(H/'current-evidence.json')
notes=[
 ('M1-P211','PQRSの垂直辺・DEFの二等辺三角形','一般の図形記号を説明。指定する辺名の答えの表示なし。'),
 ('M1-P218','180度回転・(3,2)の右4下1','動画は90度、右6上1で条件が異なる。'),
 ('M1-P222','27度の二等分線・三頂点からの等距離','動画は数量を置かない作図の性質。54度や指定問題の解答の表示なし。'),
 ('M1-P226','75度の作図・6/8/10の三角形高さ','D03の75度の式と同問題の比較表の行を、閉じた確認4-1解説へ移動。本文・答えは保持。4.8cmは図/動画に表示なし。'),
 ('M1-P233','両点高さ3/横8の最短路・公園三入口','動画の岸との高さは異なる。寄り点の距離数値は非表示。'),
 ('M1-P240','直径が最長の理由・30度6cm²から150度','動画は接線と一般の公式。指定の30cm²の答え表示なし。'),
 ('M1-P244','半径6/210度の弧と面積・120度/6πの半径','図と動画は一般式。7π/21π/9cmを該当条件の解答として表示しない。'),
 ('POINTS','角PQR・65度の残角・118度の半分・PA6・同高さ4/横10の最短路・道の等距離・半径3円・半径4/90度','8つの30秒チェックの指定数値を動画へ代入する表示なし。一般の学習内容は保持。')]
write(H/'hidden-answer-review.json',{'date':'2026-10-20','bookSha256':e['bookSha256'],'videos':[{k:x[k] for k in ['id','sha256']} for x in e['videos']],'scope':'近接確認14問・各節ポイント8問と媒体を照合。本文全問と原資料全文は別。','reviews':[{'pid':a,'conditions':b,'finding':c} for a,b,c in notes],'fixedAnswerLeak':'D03と75度の比較表の行を確認4-1の閉じた解説へ移動','answerVisibilityReport':'tools/candidates/math-ch5-recheck-20261019/answer-integrated-visibility/browser-result.json'})
write(H/'image-visual-review.json',{'date':'2026-10-20','reviewer':'Codex','scope':'既存SVG32枚と場面絵6枚を個別表示して目視。3枚の修正候補も個別目視。元図3枚の問題は修正版で解消し、他は変更なし。','images':e['images'],'corrected':['M1-C5-S2-D02','M1-C5-S2-FIG03','M1-C5-S4-FIG01'],'geometryReports':[{'path':str(p.relative_to(R)),'sha256':sha(p)} for p in [H/'extra-images/geometry.json',H/'candidate-images/geometry.json']],'sourcePhotoFullReview':False,'newListeningReview':False,'realIPhoneReview':False})
write(H/'verification-history/diagnostics.json',{'reviewerFailure':'利用上限により最初の2ブラウザ検証は自動承認レビュー未完了で未実行。後の通常申請は承認され実行成功。','verifierCorrections':['SVGはviewBoxのみで幅指定がなく、自然幅1600という検査側の誤認を修正。原本viewBoxと画像復号で検査。','候補ビルダーの--check終了箇所を候補内だけ迂回。コピー抑止を保持して候補JSONを出力。','本棚JSONは末尾改行だけ相違。データ一致を確認し元のバイトを保持。','原稿表示台帳は配列でなくunitsを持つ辞書。スキーマを確認して対象単位だけ比較。'],'materialsChangedForVerifierFailures':False})
print('38 adopted image reviews and 22 nearby question conditions bound; diagnostic-only failures retained')
