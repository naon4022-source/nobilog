"""Record verified chapter-five media work, keeping post-change full suite pending."""
from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';S=W/'メディア/制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rel=lambda p:str(p.relative_to(R));write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
e=load(H/'current-evidence.json');assert e['status']=='passed' and len(e['videos'])==12 and e['sampleFrames']==302
play=W/'メディア/点検/20261019_章別再点検/本内再生_答え非表示反映後/M1-C5-.json';assert load(play)['status']=='成功' and len(load(play)['results'])==48
assert load(H/'answer-integrated-visibility/browser-result.json')['checks']==78
assert load(H/'review-render-result.json')['checks']==79
progress=load(S/'69本_制作進捗.json')
for x in progress['items']:
 if not x['id'].startswith('M1-C5-'):continue
 x['latestLocalRecheck']={'date':'2026-10-20','status':'全AV・音声長・30fps・字幕同文・全302場面・本内4幅・SHA一致成功／画像と配置変更後の指定全体検証待ち','evidence':rel(H/'current-evidence.json'),'newListeningReview':False,'realIPhoneReview':False}
 x['latestBookRecheck']={'date':'2026-10-20','status':'図修正と解説内配置の反映後4幅再生成功','report':rel(play),'fullSuite':'pending'}
 x['independentMathReview']={'date':'2026-10-20','status':'passed','report':rel(H/'independent-math-result.json'),'checksInChapter':143,'scriptSha256':sha(S/(x['id']+'.json'))}
progress['verification']['chapter5Recheck']={'date':'2026-10-20','status':'media passed; post-change full suite pending','evidence':rel(H/'current-evidence.json'),'videos':12,'images':38,'samples':302,'fullSuite':'pending'}
write(S/'69本_制作進捗.json',progress)
requests=load(S/'依頼台帳_1件ずつ.json');videoIds={x['id'] for x in e['videos']}
for x in requests:
 if x['id'] in videoIds:x['state']='2026-10-20 既存動画の全AV/音声長/30fps/字幕/全場面/反映後4幅再生済み／指定全体検証待ち'
write(S/'依頼台帳_1件ずつ.json',requests)
prod=load(W/'制作台帳.json');prod.setdefault('latestLocalRechecks',{})['chapter5']={'date':'2026-10-20','report':'AI連絡/数学5章_反映と検証結果_20261020.md','evidence':rel(H/'current-evidence.json'),'videos':12,'images':38,'samples':302,'independentMathematics':143,'svgCorrections':3,'answerPlacement':'D03と75度の比較表1行を確認4-1の閉じた解説へ移動','fullSuite':'pending','scope':'媒体内容・本内動作・SHA照合。原資料写真全文/本文全問/新たな聴取/iPhone実機は未完了。'}
write(W/'制作台帳.json',prod)
integration=load(H/'integration.json');integration['postIntegrationChecks']={'status':'passed','svgChecks':145,'mathChecks':143,'hiddenAnswerChecks':78,'rawPreviewChecks':79,'markerAnchors':2724,'normalImages':37,'closedAnswerImages':1,'figureChecks':1060,'videoPlays':48,'physicalPages':652,'readingCards':923};write(H/'integration.json',integration)
report='''
## 2026-10-20 数学5章：既存12動画の点検と図・答え先出しの修正

- 「制作待ち」と残っていた5章12動画はすべて実在。再制作せず全AV復号・音声長・30fps・承認Kyoko設定・台本と同文字幕・全302場面の目視・コピーと参照先SHAを確認。元のAAC/動画は全12本ともバイト不変。
- 全38画像（SVG32・場面絵6）を個別目視。S4-FIG01の接線方向を半径と直角に修正し、同図のTとS2-D02/S2-FIG03の点名を補助線から離した。既存3図の修正だけで新規画像枠の制作なし。
- S2-D03に確認4-1の75°の作り方があり、同問題の比較表にも方法が見えていた。文言・数値・条件は変えず、既存画像と表の該当1行を、その問題の閉じた「答えと解説」へ移動。変更する原稿ページはP225/P226だけ。他ページは完全一致。
- 反映後：SVG145項目、独立幾何/公式143項目、解説の開閉78項目、原稿表示79項目、既存マーカー2724件の保持が成功。通常ページ37画像×4幅1060項目と、解説内画像1枚の別途開閉/読み込みも成功。動画12本×4幅48回も再生・終盤シーク・収まり成功。
- 原稿441ページ・本652ページ・原稿表示923カードを保持。配置台帳はD03が解説内へ、FIG04の物理ページが変わった2件を更新。素材402件を保持。本文・問題・答え・数量の変更なし。
- 根拠：tools/candidates/math-ch5-recheck-20261019/current-evidence.json、integration.json、answer-data-integrated-result.json、placement-update.json。前章の検証証拠はprior-chapter-evidence/に保管。4章は後の5章配置変更で本全体SHAが変わるため、前後SHAの連鎖と4章全ページの不変を厳密に検査する。
- **今回の変更後の指定全体検証はこれから単独実行。成功確定前に5章や全数学を完了扱いにしない。** 次の媒体点検対象は別枠付録6動画。Claude担当6・7章19本は変更・再制作なし。
- 原資料写真全文・本文全問・新たな聴取・iPhone実機、全体のサブスク/AI契約・実費・規約判断等は未完了/保留のまま。制作台帳の候補選定が未確定の箇所も、媒体ファイルの存在と分ける。公開・コミット・削除・admin・実Gemini・自動スケジュール変更なし。
'''
(R/'AI連絡/数学5章_反映と検証結果_20261020.md').write_text('# 数学5章・反映と検証結果\n'+report)
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','2026年10月大型アップデート.md','.claude/HANDOFF.md']:
 with (R/name).open('a') as f:f.write(report)
print('Chapter5 media work and exact remaining checks recorded; post-change full suite pending')
