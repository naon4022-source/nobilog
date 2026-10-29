"""Finalize this one observed full suite only after terminal exit and frozen input proof."""
from pathlib import Path
import hashlib,json,subprocess,sys,datetime
H=Path(__file__).resolve().parent;R=H.parents[2]
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert len(sys.argv)==3 and sys.argv[2]=='0','supply actual observed unified-session exit; never infer it from a partial log'
session=int(sys.argv[1])
active=load(H/'final-full-active.json');assert active['sessionId']==session and active['status']=='running'
process=subprocess.run(['pgrep','-f','bash .claude/verify/[r]un.sh'],capture_output=True)
assert process.returncode==1,'full suite still live; do not finalize/restart'
log=Path(active['log']);text=log.read_text()
assert text.rstrip().endswith('EXIT=0') and '✅ ぜんぶ通過' in text and '❌ 落ちたスイートがある' not in text
frozen=load(H/'final-full-inputs.json')['inputs'];assert len(frozen)==active['frozenInputCount'] and len(frozen)>=1477
changes=[name for name,value in frozen.items() if not (R/name).is_file() or sha(R/name)!=value]
assert not changes, 'frozen source drift: '+repr(changes)
proof=load(H/'integrated-preview-result.json');assert proof['status']=='passed' and proof['checks']==24
namespace={'__file__':str(H/'verify_appendix_chain.py'),'__name__':'verification'}
exec((H/'verify_appendix_chain.py').read_text(),namespace);namespace['validate']()
assert '390: saved preview answer/figure/steps/video passed' in text and '1440: saved preview answer/figure/steps/video passed' in text
word=R/'tools/candidates/eiken-word-recording-lifecycle-20261021'
wproof=load(word/'integrated-browser-result.json');assert wproof['status']=='passed' and wproof['integrated'] is True and wproof['checks']==76
wmanifest=load(word/'manifest.json');assert sha(R/wmanifest['file'])==wproof['candidateSha256']==wmanifest['afterSha256']
assert 'verify-eiken-vocab-browser: 102 checks' in text and 'Index recording lifecycle: 4 checks passed' in text
receipt={'status':'passed','sessionId':session,'observedExitCode':0,'log':str(log),'logSha256':sha(log),'frozenInputCount':len(frozen),'allExplicitInputsUnchanged':True,'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'appendix6 local integration and this post-change full; other nonadmin unfinished/held requirements remain','published':False}
ledger_path=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/依頼台帳_1件ずつ.json'
ledger_before=sha(ledger_path);ledger=load(ledger_path)
ids={x['id'] for x in load(H/'inventory.json')['items']}
for row in ledger:
    if row['id'] in ids:
        row['state']='手元教科書へ反映・30fps/承認済みKyoko/全AV/全場面/4幅/変更後全体点検済み・未公開'
        row['verification']['postFullSuite']='passed:'+str(session)
ledger_path.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
receipt['metadataFinalization']={'phase':'after observed completion and explicit frozen-input comparison','file':str(ledger_path.relative_to(R)),'beforeSha256':ledger_before,'afterSha256':sha(ledger_path),'change':'six state and postFullSuite metadata fields only; assets/code unchanged'}
(H/'post-full-verification.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
active.update(status='completed',observedExitCode=0,proof='post-full-verification.json');(H/'final-full-active.json').write_text(json.dumps(active,ensure_ascii=False,indent=2)+'\n')
p=H/'integration.json';d=load(p);d.update(status='local appendix6 integration verified; post-change full passed',postFullSuite=receipt);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
p=H/'resume.json';d=load(p);d.update(status='appendix6 and word-recorder local integration, post-change full passed; whole goal incomplete',activeFull=active,next=['Continue remaining nonadmin goal items; keep policy/source/real-device holds explicit','Do not repeat finished media work or publish']);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
wmanifest.update(status='local word-recorder lifecycle fixed; integrated and post-change full passed',postFullSuite=receipt);(word/'manifest.json').write_text(json.dumps(wmanifest,ensure_ascii=False,indent=2)+'\n')
entry=f'''\n\n### 2026-10-21 Codex：付録6本の本体反映後・全体検証成功

全体{session}を同じハンドルで追跡し、終了0・末尾「ぜんぶ通過」「EXIT=0」を実確認。固定した{len(frozen)}入力SHAが全て不変。付録6動画の実素材/配信用コピー/依頼SHA、全AV・30fps・音声長・159場面目視、6本×4幅の24再生を点検し、APP2の図重なりとAPP3問1の答え先出しだけ修正。元AAC・本文/問題/答え/数値・全2724マーカーを保全。原稿441ページ、本651ページ、原稿表示922カード、素材403枠。実機・新たな実聴は未確認。証跡 tools/candidates/math-appendix-recheck-20261021/post-full-verification.json。単語3秒録音も、遅延マイク許可・離脱・本人切替・非表示・エラー時の停止を修正し、76項目と既存英単語102項目、実index終了口4項目を隔離確認。付録と録音修正の局所完了であり、残る非admin項目/保留を含むゴール全体完了ではない。公開/コミット/削除/admin/実AIなし。\n'''
for name in ['AI連絡/作業連絡.md','AI連絡/現在の状況.md','IMPROVEMENT_PROGRESS.md','AI連絡/大型更新_できていることと未完了_20261017.md','.claude/HANDOFF.md']:
 with (R/name).open('a') as f:f.write(entry)
print('Observed full',session,'exit0 and all',len(frozen),'frozen inputs unchanged; scoped appendix/word-recorder closeout saved')
