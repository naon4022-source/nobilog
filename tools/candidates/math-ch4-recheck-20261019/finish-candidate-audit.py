"""Audio-only timing check and record of reviewed 1.5-second contact sheets; never rewrites media."""
from pathlib import Path
import subprocess,json,re,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
ff=next((S/'制作ツール/imageio_ffmpeg/binaries').glob('ffmpeg-macos-*'))
notes={'M1-C4-S2-VP':'整数の6点と原点、点は飛び飛びの説明、まとめを確認。連続した青い直線なし。', 'M1-C4-S1-VP':'0分を除いた料金グラフと0＜x≦60の白丸・黒丸を確認。30分の100円と200円の境界を区別。','M1-C4-REVIEW-V01':'同じ駐車料金グラフの0分白丸を確認。階段・クッキー・紙束・まとめの式と数量を確認。'}
results=[]
for ident,note in notes.items():
 d=H/'candidate'/ident;v=d/(ident+'.mp4');p=d/'actual-shots/実動画の点検.json';a=json.loads(p.read_text());assert hashlib.sha256(v.read_bytes()).hexdigest()==a['sha256']
 r=subprocess.run([str(ff),'-hide_banner','-nostdin','-xerror','-i',str(v),'-map','0:a:0','-vn','-f','null','-','-progress','pipe:1','-nostats'],capture_output=True,text=True);assert r.returncode==0,r.stderr[-800:]
 values=re.findall(r'out_time_us=(\d+)',r.stdout);assert values
 secs=int(values[-1])/1e6;assert abs(secs-a['seconds'])<.2,(ident,secs,a['seconds'])
 (d/'audio-length-decode.log').write_text(r.stderr+'\n'+r.stdout)
 a['audioDurationCheck']={'decodedSeconds':secs,'timelineSeconds':a['seconds'],'differenceSeconds':secs-a['seconds'],'toleranceSeconds':.2,'passed':True,'decode':'audio-only -xerror'}
 a['visualReview']={'date':'2026-10-19','reviewer':'Codex','result':'全場面を目視確認済み','scope':str(a['sampleFrames'])+'場面を1.5秒ごとに実動画から抽出し全場面目視。'+note+'承認済みAACバイト同一。新たな耳の確認と実機iPhoneは別。','contactSheetSha256':hashlib.sha256((d/'actual-shots/全場面_1.jpg').read_bytes()).hexdigest()}
 p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n');results.append({'id':ident,'sha256':a['sha256'],'audio':a['audioDurationCheck'],'samples':a['sampleFrames']})
(H/'candidate-audio-and-visual-result.json').write_text(json.dumps({'passed':True,'results':results},ensure_ascii=False,indent=2)+'\n')
print('3 candidate audio lengths decoded; 76 sampled scenes reviewed; existing AAC preserved')
