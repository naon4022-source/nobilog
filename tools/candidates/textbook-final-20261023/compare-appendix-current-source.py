"""Compare current HTML samples with retained decoded movie frames; no AV decoding."""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageChops,ImageStat
H=Path(__file__).resolve().parent;P=H.parent/'math-appendix-recheck-20261021';D=H/'appendix-source-frames-current-20261025';load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();m=load(D/'manifest.json');assert m['status']=='captured; pixel comparison pending';results=[]
for row in m['results']:
 frames=[]
 for f in row['frames']:
  current=D/f['file'];assert sha(current)==f['sha256'];folder=P/'candidate/M1-APP2-V01/actual-shots' if row['id']=='M1-APP2-V01' else P/'original-av'/row['id']/'actual-shots';actual=folder/current.name
  with Image.open(current) as a,Image.open(actual) as b:
   assert a.size==b.size==(1280,720);rms=max(ImageStat.Stat(ImageChops.difference(a.convert('RGB'),b.convert('RGB'))).rms)
  assert rms<12,(row['id'],f['frame'],rms);frames.append({**f,'decodedFrame':str(actual.relative_to(H.parents[2])),'decodedFrameSha256':sha(actual),'maxChannelRMS':rms})
 results.append({**row,'frames':frames,'maxChannelRMS':max(x['maxChannelRMS'] for x in frames)});print(row['id']+': current HTML matches retained real movie frames; max RMS '+str(round(results[-1]['maxChannelRMS'],3)))
assert len(results)==6 and sum(len(x['frames']) for x in results)==159
(D/'result.json').write_text(json.dumps({'status':'passed','scope':'six current source HTML + current engine compared to retained actual movie samples; prior same-SHA full AV unchanged','sourceManifestSha256':sha(D/'manifest.json'),'engineSha256':m['engineSha256'],'movies':6,'samples':159,'results':results,'newMovieGenerations':0,'newAVDecodes':0,'newListening':False},ensure_ascii=False,indent=2)+'\n')
