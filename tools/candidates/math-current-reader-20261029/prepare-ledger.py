"""Build metadata-only ledger candidates for already produced/currently played75.
Preserve all specifications, ordering, source media and all Claude19 rows.
No source/application writes. No fresh decode, generation or listening claim.
"""
from pathlib import Path
import copy,hashlib,json

ROOT=Path.cwd();HERE=Path(__file__).resolve().parent;BASE=HERE.relative_to(ROOT)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
ledger=Path('教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/依頼台帳_1件ずつ.json')
progress=Path('tools/candidates/textbook-final-20261023/production-math-playback-progress.json')
manifest=load(HERE/'current-math-playback-manifest.json');report=load(HERE/'current-math-playback-result.json')
assert report['status']=='passed' and report['plays']==300 and report['movies']==75 and report['hiddenAnswerPlays']==4
assert not report['errors'] and not report['outside'] and report['manifestSha256']==sha(HERE/'current-math-playback-manifest.json')
for f,digest in report['inputs'].items():assert sha(ROOT/'site-assets'/f)==digest,f
assert manifest['samples']==1805 and manifest['videos']==75 and manifest['main']==69 and manifest['appendix']==6
original=load(ledger);updated=copy.deepcopy(original);targets={r['id']:r for r in manifest['items']}
assert len(targets)==75 and len([r for r in original if r['kind']=='動画'])==94
whole='tools/candidates/nonadmin-ai-reader-successor-20261029/main/full10-result.json'
seen=set()
for before,row in zip(original,updated):
 if row['id'] not in targets:continue
 item=targets[row['id']];seen.add(row['id'])
 assert row['kind']=='動画' and row['sha256']==item['sha256']
 source=ROOT/row.get('file',str(ledger.parent.parent/(row['id']+'.mp4')))
 assert sha(source)==item['sha256'] and sha(ROOT/'site-assets'/item['src'].lstrip('/'))==item['sha256'],row['id']
 plays=[r for r in report['results'] if r['id']==row['id']]
 assert len(plays)==4 and {r['viewport'][0] for r in plays}=={390,820,1180,1440}
 assert all(r['inAnswer']==item['inAnswer'] and r['error']==0 and r['advanced']>0 and r['fitWidth'] and r['fitHeight'] for r in plays)
 row['state']='2026-10-29 現在の手元教科書で4幅再生・元動画/公開コピー/参照SHA一致。既存の全AV/承認Kyoko/30fps/同文字幕/1.5秒場面点検を同一SHAで継承。最終全体検証はverification.currentReader.wholeResultFile参照。未公開。新規聴取・iPhone実機は未確認。'
 row.setdefault('verification',{})['currentReader']={'date':'2026-10-29','report':str(BASE/'current-math-playback-result.json'),'reportSha256':sha(HERE/'current-math-playback-result.json'),'manifest':str(BASE/'current-math-playback-manifest.json'),'manifestSha256':sha(HERE/'current-math-playback-manifest.json'),'plays':4,'widths':[390,820,1180,1440],'inAnswer':item['inAnswer'],'retainedSceneSamples':item['samples'],'wholeResultFile':whole,'wholeResultStatusAtIntegration':'pending','newListening':False,'iPhoneRealDevice':False,'newGeneration':False,'newDecode':False,'published':False}
 assert {k:v for k,v in row.items() if k not in {'state','verification'}}=={k:v for k,v in before.items() if k not in {'state','verification'}}
 assert {k:v for k,v in row['verification'].items() if k!='currentReader'}==before.get('verification',{})
assert seen==set(targets)
assert [r for r in updated if r['id'] not in targets]==[r for r in original if r['id'] not in targets]
assert sum(r!=s for r,s in zip(original,updated))==75
new_progress={'status':'current local book playback passed; overall textbook unfinished; final whole result referenced separately','date':'2026-10-29','movies':75,'mainMovies':69,'appendixMovies':6,'plays':300,'widths':[390,820,1180,1440],'hiddenAnswerPlays':4,'sampleScenesBound':1805,'report':str(BASE/'current-math-playback-result.json'),'reportSha256':sha(HERE/'current-math-playback-result.json'),'manifest':str(BASE/'current-math-playback-manifest.json'),'manifestSha256':sha(HERE/'current-math-playback-manifest.json'),'claude19Excluded':True,'newListening':False,'iPhoneRealDevice':False,'newGeneration':False,'newDecode':False,'wholePostVerification':{'resultFile':whole,'statusAtIntegration':'pending'},'previousProgressFile':str(BASE/'ledger-before'/progress),'previousProgressSha256':sha(progress)}
out=HERE/'ledger-output';out.mkdir(exist_ok=False);rows=[]
for file,value in [(ledger,updated),(progress,new_progress)]:
 before=HERE/'ledger-before'/file;before.parent.mkdir(parents=True,exist_ok=True);before.write_bytes((ROOT/file).read_bytes())
 candidate=out/file;candidate.parent.mkdir(parents=True,exist_ok=True);candidate.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
 rows.append({'file':str(file),'beforeFile':str(before.relative_to(ROOT)),'beforeSha256':sha(before),'candidateFile':str(candidate.relative_to(ROOT)),'afterSha256':sha(candidate)})
(HERE/'ledger-prepared.json').write_text(json.dumps({'status':'metadata candidates only; main ledger unchanged','files':rows,'updatedVideoRows':75,'unchangedOtherRows':274,'excludedClaudeVideoRows':19,'scope':'Only current-reader verification metadata and status. All349 IDs/order/specs/source media retained. Reported past checks reused by identical hashes; no fresh listening/device/decode claim.'},ensure_ascii=False,indent=2)+'\n')
print('Prepared metadata candidates:75 current-video rows,274 other rows unchanged including Claude19; main ledger unchanged.')
