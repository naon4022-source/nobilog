"""対象1本の音声を無変換で保全し、修正映像を全AV復号して実動画の全1.5秒場面を採取する。"""
from pathlib import Path
from io import BytesIO
import subprocess,json,hashlib,re,math
from PIL import Image,ImageDraw,ImageChops,ImageStat
root=Path(__file__).resolve().parents[3];here=Path(__file__).resolve().parent;source=root/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';media=source.parent
ffmpeg=next((source/'制作ツール/imageio_ffmpeg/binaries').glob('ffmpeg-macos-*'));ident=__import__('sys').argv[1];assert ident in ['M1-C4-S2-VP','M1-C4-S1-VP','M1-C4-REVIEW-V01'];candidate=here/'candidate'/ident;video=candidate/(ident+'.mp4');old=media/(ident+'.mp4');shots=candidate/'actual-shots';shots.mkdir(exist_ok=True)
run=lambda args:subprocess.run([str(ffmpeg),'-hide_banner','-nostdin',*args],capture_output=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
r=run(['-y','-i',str(candidate/'silent.mp4'),'-i',str(old),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(video)]);assert r.returncode==0,r.stderr[-800:]
def audio_hash(p):
 r=run(['-i',str(p),'-map','0:a:0','-c:a','copy','-f','adts','-']);assert r.returncode==0,r.stderr[-800:];return sha(r.stdout)
audio=audio_hash(old);assert audio_hash(video)==audio,'AAC bytes preserved; no voice synthesis, correction, or encoding'
tl=json.loads((source/(ident+'.timeline.json')).read_text());script=json.loads((source/(ident+'.json')).read_text())
assert all(a['say']==b['say']==b['cap'] for a,b in zip(script['steps'],tl['steps']))
r=run(['-y','-xerror','-i',str(video),'-map','0:v:0','-vf',"showinfo,select='not(mod(n,45))'",'-fps_mode','vfr','-enc_time_base','1:30','-frame_pts','1',str(shots/'f%05d.png'),'-map','0:a:0','-af','volumedetect','-f','null','-','-progress','pipe:1','-nostats']);log=r.stderr.decode();assert r.returncode==0,log[-1000:]
(candidate/'full-av-decode.log').write_text(log)
assert all(x in log for x in ['Video: h264','Audio: aac','1280x720','30 fps'])
nums=[int(x) for x in re.findall(r'Parsed_showinfo_\d+[^\n]*\bn:\s*(\d+)\s',log)];expected=round(tl['total']*30);assert nums==list(range(expected)),(len(nums),expected)
frames=sorted(shots.glob('f*.png'));assert [p.name for p in frames]==['f'+str(n).zfill(5)+'.png' for n in range(0,expected,45)]
mean=float(re.search(r'mean_volume: ([\d.-]+) dB',log)[1]);peak=float(re.search(r'max_volume: ([\d.-]+) dB',log)[1]);assert -40<mean<0 and peak<0
proof=[]
for frame in frames:
 with Image.open(frame) as a,Image.open(candidate/'shots'/frame.name) as b:
  assert a.size==b.size==(1280,720);rms=ImageStat.Stat(ImageChops.difference(a.convert('RGB'),b.convert('RGB'))).rms;assert max(rms)<12
 proof.append({'frame':int(frame.stem[1:]),'maxChannelRMS':max(rms)})
sheet=Image.new('RGB',(1536,236*math.ceil(len(frames)/4)),'white');draw=ImageDraw.Draw(sheet)
for k,p in enumerate(frames):
 with Image.open(p) as im:sheet.paste(im.convert('RGB').resize((384,216)),((k%4)*384,(k//4)*236))
 draw.text(((k%4)*384+5,(k//4)*236+218),str(round(int(p.stem[1:])/30,1))+'s',fill='black')
sheet.save(shots/'全場面_1.jpg',quality=92)
report={'id':ident,'sha256':sha(video.read_bytes()),'previousSha256':sha(old.read_bytes()),'seconds':tl['total'],'frames':expected,'sampleFrames':len(frames),'decode':'all video/audio decoded with -xerror; every decoded video frame enumerated by showinfo','format':'H264・1280x720・30fps・AAC','meanDB':mean,'peakDB':peak,'captions':'all steps equal unchanged script','audioPreservation':{'aacSha256':audio,'sameAsPrevious':True,'reencoded':False},'videoFrameProof':proof,'contactSheets':[str(shots/'全場面_1.jpg')],'visualReview':{'result':'未確認'},'adoption':'4章の図条件修正候補・本体未反映'}
(shots/'実動画の点検.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('candidate:',expected,'full AV frames;',len(frames),'actual 1.5s scenes; AAC byte-identical to approved existing voice; awaiting visual review')
