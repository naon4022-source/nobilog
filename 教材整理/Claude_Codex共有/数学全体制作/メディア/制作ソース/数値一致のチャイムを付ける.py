# -*- coding: utf-8 -*-
"""指定された数値一致の瞬間にだけ短いチャイムを重ねる。映像・声・字幕は保持。"""
from pathlib import Path
import array, hashlib, json, math, subprocess, tempfile, wave
source=Path(__file__).resolve().parent
media=source.parent
id='M1-C3-S1-V01'
p=source/'69本_制作進捗.json'
ledger=json.loads(p.read_text())
assert not any(x['state']=='映像出力中' for x in ledger['items']), '制作プロセス終了後に実行してください'
item=next(x for x in ledger['items'] if x['id']==id)
video=media/(id+'.mp4')
old_hash=hashlib.sha256(video.read_bytes()).hexdigest()
assert old_hash==item['sha256'] and item['state']=='出力済み／全場面点検待ち'
if item.get('chime'): raise SystemExit('チャイム追加済み。重複しません。')
tl=json.loads((source/(id+'.timeline.json')).read_text())
# draw の seg(p,.12,.82) が1になり、左右とも7でそろう瞬間。
st=tl['steps'][4]
time=st['start']+(st['end']-st['start'])*.82
assert 0<time<tl['total']-.45
ffmpeg=next((source/'制作ツール/imageio_ffmpeg/binaries').glob('ffmpeg-macos-*'))
with tempfile.TemporaryDirectory(prefix='nobi-chime-') as td:
 tone=Path(td)/'tone.wav';out=Path(td)/'with-chime.mp4';rate=24000
 samples=array.array('h')
 for n in range(round(rate*.45)):
  t=n/rate;env=min(1,t/.025)*max(0,1-t/.45)**2
  value=.055*env*sum(math.sin(2*math.pi*f*t) for f in (523.251,659.255,783.991))/3
  samples.append(round(value*32767))
 with wave.open(str(tone),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(samples.tobytes())
 delay=round(time*1000)
 subprocess.run([str(ffmpeg),'-nostdin','-y','-i',str(video),'-i',str(tone),'-filter_complex',f'[1:a]adelay={delay}:all=1[tone];[0:a][tone]amix=inputs=2:duration=first:normalize=0[a]','-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','96k','-movflags','+faststart',str(out)],check=True,capture_output=True)
 assert out.stat().st_size<4*1024*1024
 backup=source/'チャイム追加前';backup.mkdir(exist_ok=True)
 saved=backup/(id+'.mp4');assert not saved.exists()
 video.replace(saved);out.replace(video)
item['sha256']=hashlib.sha256(video.read_bytes()).hexdigest()
item['chime']={'seconds':time,'duration':.45,'reason':'依頼書のx=4で左右7が一致する瞬間','oldSha256':old_hash,'source':str(Path(__file__).resolve())}
p.write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
print(id,'チャイム追加',round(time,3),'秒。AVと音量の再点検が必要です。')
