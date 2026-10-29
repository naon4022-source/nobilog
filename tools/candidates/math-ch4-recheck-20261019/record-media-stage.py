"""Record current media evidence without claiming post-change full-suite completion."""
from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';S=W/'メディア/制作ソース'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
rel=lambda p:str(p.relative_to(R))
write=lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
play=next((W/'メディア/点検/20261019_章別再点検/本内再生_図条件修正後').glob('*.json'))
d=load(play);assert d['status']=='成功' and len(d['results'])==12
progress=load(S/'69本_制作進捗.json');ev=load(H/'current-evidence.json');math=load(H/'independent-math-result.json');ids={x['id'] for x in d['items']}
for x in progress['items']:
 if not x['id'].startswith('M1-C4-'):continue
 x['latestLocalRecheck']={'date':'2026-10-19','status':'全12本の媒体内容・全AV・30fps・字幕同文・全290場面・参照SHA一致を確認／変更後全体検証待ち','evidence':rel(H/'current-evidence.json'),'newListeningReview':False,'realIPhoneReview':False}
 x['independentMathReview']={'status':'passed','report':rel(H/'independent-math-result.json'),'checksInChapter':math['checks'],'scriptSha256':sha(S/(x['id']+'.json'))}
 if x['id'] in ids:
  x['latestBookRecheck']={'date':'2026-10-19','status':'修正後4幅再生成功／変更後全体検証待ち','report':rel(play)}
 else:
  x['latestBookRecheck']={'date':'2026-10-19','status':'4幅再生成功・動画バイト不変／変更後全体検証待ち','report':rel(W/'メディア/点検/20261019_章別再点検/本内再生/M1-C4-.json')}
progress['verification']['chapter4Recheck']={'date':'2026-10-19','status':'media passed; full suite pending','evidence':rel(H/'current-evidence.json'),'videos':12,'samples':290,'images':36,'mathematicsChecks':math['checks'],'fullSuite':'pending'}
write(S/'69本_制作進捗.json',progress)
requests=load(S/'依頼台帳_1件ずつ.json')
for x in requests:
 if x['id'] in {v['id'] for v in ev['videos']}:
  x['sha256']=next(v['sha256'] for v in ev['videos'] if v['id']==x['id'])
  x['state']='2026-10-19 4章媒体点検・本内4幅再生済み／変更後全体検証待ち'
write(S/'依頼台帳_1件ずつ.json',requests)
prod=load(W/'制作台帳.json')
prod.setdefault('latestLocalRechecks',{})['chapter4']={'date':'2026-10-19','report':'AI連絡/数学4章_反映と検証結果_20261019.md','evidence':rel(H/'current-evidence.json'),'videos':12,'images':36,'samples':290,'corrections':3,'independentMathChecks':179,'bookPlayback':'全12本×4幅成功、修正3本を再度4幅成功','fullSuite':'pending','scope':'動画・画像媒体の内容、近接する確認問題の答え非表示、参照SHA。原資料全文・全問・新たな聴取・実機は別。'}
write(W/'制作台帳.json',prod)
integration=load(H/'integration.json');integration['playback']={'status':'passed','report':rel(play),'plays':12,'widths':[390,820,1180,1440]};write(H/'integration.json',integration)
report='''
## 2026-10-19 数学4章・3本の図条件修正と章内点検（ローカルのみ）

- 4章12動画を全AV復号し、30fps・承認Kyoko設定・音声長・台本と同文字幕・全290場面を確認。全36画像（SVG30・場面画像6）を個別目視し、選択元と本内コピーのSHAを照合。新規画像制作なし。
- M1-C4-S2-VPは原稿の「0以上の整数」の段数条件に合わせ、連続線を除き6点と説明を表示。M1-C4-S1-VPとREVIEWは既存採用図D02に合わせ、0分を除く白丸と例示変域を修正。本文・問題・答え・数値・音声・字幕・タイミング不変。既存承認AACを無変換コピー。他9動画はバイト不変。
- 修正候補の全76場面目視・全AV復号・音声長検査、変更場面限定52項目、採用描画と制作候補の全時刻一致18項目、12台本の独立計算179項目が成功。
- 全12本×4画面幅48回の本内再生に加え、修正3本×4幅12回の反映後再生・終盤シーク・収まり成功。画像の本内4幅検証1024項目も成功。
- 根拠：tools/candidates/math-ch4-recheck-20261019/current-evidence.json、integration.json、independent-math-result.json、hidden-answer-review.json。
- **変更後の指定全体検証はこれから単独実行。4章全体完了・全数学完了とは扱わない。** 3章の原稿表示同期後の全体確認も同じ実行で確認する。
- 原資料写真全文と本文全問の照合、新たな聴取、iPhone実機は未完了として分離。数学5章12本・付録6本も未点検。サブスク/AIの契約・実API費用・規約判断の保留は継続。公開・コミット・削除・admin変更・実Gemini・スケジュール変更なし。
'''
(R/'AI連絡/数学4章_反映と検証結果_20261019.md').write_text('# 数学4章・反映と検証結果\n'+report)
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','2026年10月大型アップデート.md','.claude/HANDOFF.md']:
 with (R/name).open('a') as f:f.write(report)
print('Chapter-four media evidence and handoff recorded; post-change standalone full suite pending')
