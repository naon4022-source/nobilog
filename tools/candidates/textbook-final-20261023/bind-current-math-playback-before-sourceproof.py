"""Bind75 current movies to completed AV/source/scene evidence; no new decoding."""
from pathlib import Path
import hashlib,json,math
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';M=S.parent;A=R/'site-assets';P=H.parent/'math-appendix-recheck-20261021'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();rel=lambda p:str(p.relative_to(R));book=load(A/'textbook-book-math1.json');progress=load(S/'69本_制作進捗.json');assert len(progress['items'])==69
settings=load(S/'音声共有/設定.json');assert (settings['engine'],settings['voice'],settings['rate'],settings['profile'])==('say','Kyoko',175,'clear');refs={}
def walk(blocks,pid,closed=False):
 for b in blocks:
  if b.get('kind')=='video' and b.get('id'):
   assert b['id'] not in refs;refs[b['id']]={'block':b,'pid':pid,'closed':closed}
  if isinstance(b.get('body'),list):walk(b['body'],pid,closed or b.get('t')=='details')
for p in book['pages']:walk(p.get('blocks',[]),p.get('pid'))
reports={};proofs=[]
for n in range(1,6):
 path=H/'chapter1-current-evidence.json' if n==1 else H.parent/('math-ch'+str(n)+'-recheck-202610'+('18' if n==2 else '19'))/'current-evidence.json';report=load(path);assert report['status']=='passed' and report['bookSha256']==sha(A/'textbook-book-math1.json');proofs.append({'file':rel(path),'sha256':sha(path)});reports.update({x['id']:x for x in report['videos']})
assert set(reports)=={x['id'] for x in progress['items']};rows=[]
def current(ident,expected,seconds,scene_count,group):
 ref=refs[ident];b=ref['block'];src='/textbook-book-math1-'+ident.lower()+'.mp4';assert b['src']==src;assert sha(M/(ident+'.mp4'))==sha(A/src[1:])==expected
 sc=load(S/(ident+'.json'));tl=load(S/(ident+'.timeline.json'));assert sc['settings']=='音声共有/設定.json' and len(sc['steps'])==len(tl['steps'])
 for a,c in zip(sc['steps'],tl['steps']):assert a['say']==a.get('cap',a['say'])==c['say']==c['cap'] and c['end']-c['start']>=c['speak']>.2
 assert abs(tl['total']-seconds)<.02 and math.ceil(round(tl['total']*30)/45)==scene_count
 rows.append({'id':ident,'group':group,'sha256':expected,'src':src,'seconds':tl['total'],'samples':scene_count,'sourcePage':ref['pid'],'inAnswer':ref['closed'],'scriptSha256':sha(S/(ident+'.json')),'timelineSha256':sha(S/(ident+'.timeline.json'))})
for item in progress['items']:
 ident=item['id'];e=reports[ident];assert e['sha256']==item['sha256']
 for ext,digest in item['sourceSha256'].items():assert sha(S/(ident+'.'+ext))==digest
 for file,digest in item.get('dependencySha256',{}).items():assert sha(S/file)==digest
 samples=e.get('sampleFrames',e.get('samples'));assert isinstance(samples,int)
 current(ident,item['sha256'],item['seconds'],samples,'C'+ident.split('-')[1][1:])
inv=load(P/'inventory.json');prior=load(R/inv['priorReport']);assert sha(R/inv['priorReport'])==inv['priorReportSha256'];assert len(inv['items'])==6
av_path=P/'unchanged-av-result.json';av=load(av_path);assert av['status']=='passed' and av['newVideoGenerations']==av['audioGenerations']==0;unchanged={x['id']:x for x in av['results']};assert len(unchanged)==5
visual=load(P/'visual-review.json');assert visual['samples']==159;visual_by={x['id']:x for x in visual['items']};nearby=load(P/'other-five-nearby-answer-review.json');oldbook=load(P/'previous/textbook-book-math1.json');assert sha(P/'previous/textbook-book-math1.json')==inv['bookSha256'];oldpages={p.get('pid'):p for p in oldbook['pages']};newpages={p.get('pid'):p for p in book['pages']}
for x in nearby['items']:
 assert oldpages[x['sourcePage']]==newpages[x['sourcePage']]
 assert sha(S/(x['id']+'.json'))==x['scriptSha256']
for item in inv['items']:
 ident=item['id'];assert sha(S/(ident+'.json'))==item['scriptSha256'] and sha(S/(ident+'.timeline.json'))==item['timelineSha256']
 if ident=='M1-APP2-V01':
  ep=P/'candidate/M1-APP2-V01/actual-shots/実動画の点検.json';e=load(ep);expected=e['sha256'];assert e['previousSha256']==item['sha256'] and e['format']=='H264・1280x720・30fps・AAC';assert e['visualReview']['result']=='passed' and e['visualReview']['reviewedSamples']==item['expectedSamples'];assert e['audioPreservation']['sameAsPrevious'] and not e['audioPreservation']['reencoded'];assert e['audioDurationCheck']['passed'] and abs(e['audioDurationCheck']['decodedSeconds']-item['seconds'])<.2;assert 'decoded with -xerror' in e['decode'];assert sha(Path(e['contactSheets'][0]))==e['visualReview']['contactSheetSha256'];assert sha(S/(ident+'.html'))==sha(P/'candidate/M1-APP2-V01.html')
 else:
  ep=av_path;e=unchanged[ident];expected=item['sha256'];assert e['sha256']==expected and e['fps']==30 and e['decode']=='all AV decoded with -xerror in one pass';assert abs(e['audioSeconds']-item['seconds'])<.2;assert sha(R/e['log'])==e['logSha256'];v=visual_by[ident];assert v['sha256']==expected and v['samplesReviewed']==item['expectedSamples'];assert sha(R/item['contactSheet'])==item['contactSheetSha256']==v['contactSheetSha256'];assert ident=='M1-APP3-V03' or v['result']=='no issue observed in sampled scenes'
  assert all(f['reviewedSheetRMS']<12 for f in e['videoFrameProof'])
 assert e['frames']==round(item['seconds']*30) and e['sampleFrames']==item['expectedSamples'];assert [f['frame'] for f in e['videoFrameProof']]==list(range(0,e['frames'],45));assert max(f['maxChannelRMS'] for f in e['videoFrameProof'])<12;assert -40<e['meanDB']<0 and e['peakDB']<0
 current(ident,expected,item['seconds'],item['expectedSamples'],'APP');proofs.append({'id':ident,'file':rel(ep),'sha256':sha(ep),'scope':'unchanged full AV/1.5s samples, no new listening'})
assert len(rows)==75 and len({x['id'] for x in rows})==75 and sum(x['samples'] for x in rows)==1805;assert {x['id'] for x in rows if x['inAnswer']}=={'M1-APP3-V03'}
requests={x['id']:x for x in load(S/'依頼台帳_1件ずつ.json')}
for x in rows:
 if 'sha256' in requests[x['id']]:assert requests[x['id']]['sha256']==x['sha256']
report={'status':'current evidence bound; current production playback pending','date':'2026-10-25','videos':75,'samples':1805,'main':69,'appendix':6,'items':rows,'proofs':proofs,'bookSha256':sha(A/'textbook-book-math1.json'),'voiceSettings':settings,'voiceSettingsSha256':sha(S/'音声共有/設定.json'),'newDecodes':0,'newMovieGenerations':0,'newListening':False,'claude19Excluded':True,'bodyRendererInputs':load(H/'body-fractions-20261025/book-result-verified.json')['inputs'],'limits':['Prior same-SHA AV/scene records reused; not fresh listening or iPhone device review','Current playback all75 and final whole remain separate','Other-subject media/content and textbook drawing/AI/plans remain']}
(H/'current-math-playback-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('Current75 movies /1805 reviewed1.5s samples: source/copy/reference, Kyoko175 clear, captions/timeline/audio/FPS/hidden-answer chain bound. No decode/generation/listening repeated.')
