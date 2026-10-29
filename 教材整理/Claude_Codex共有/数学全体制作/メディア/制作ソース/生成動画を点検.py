# -*- coding: utf-8 -*-
"""実出力を復号し、時間割・音声・全場面の点検資料を保存する。採用判定はしない。"""
from pathlib import Path
import json, hashlib, subprocess, re, math, sys
from PIL import Image, ImageDraw, ImageChops, ImageStat

source=Path(__file__).resolve().parent
media=source.parent
ffmpeg=next((source/'制作ツール/imageio_ffmpeg/binaries').glob('ffmpeg-macos-*'))
ledger=json.loads((source/'69本_制作進捗.json').read_text())
items={x['id']:x for x in ledger['items']}
def already_audited(x):
    path=Path(x.get('shots',''))/'実動画の点検.json'
    return path.is_file() and json.loads(path.read_text()).get('sha256')==x.get('sha256')
ids=sys.argv[1:] or [x['id'] for x in ledger['items'] if x['state']=='出力済み／全場面点検待ち' and not already_audited(x)]
for id in ids:
    item=items[id]
    assert item['state'] in ('出力済み／全場面点検待ち','点検・本への反映済み'),id+' は未出力'
    video=media/(id+'.mp4')
    assert hashlib.sha256(video.read_bytes()).hexdigest()==item['sha256'],id+' の動画が台帳と違う'
    for ext,h in item['sourceSha256'].items():
        assert hashlib.sha256((source/(id+'.'+ext)).read_bytes()).hexdigest()==h
    for name,h in item.get('dependencySha256',{}).items():
        assert hashlib.sha256((source/name).read_bytes()).hexdigest()==h, id+' の描画・音声依存が出力時から変わりました'
    script=json.loads((source/(id+'.json')).read_text())
    timeline=json.loads((source/(id+'.timeline.json')).read_text())
    assert script['settings']=='音声共有/設定.json'
    assert len(script['steps'])==len(timeline['steps'])
    for st,tm in zip(script['steps'],timeline['steps']):
        assert tm['say']==st['say'] and tm['cap']==st.get('cap',st['say'])==st['say']
        assert tm['speak']>.2 and tm['end']>tm['start']
    decoded=subprocess.run([str(ffmpeg),'-nostdin','-i',str(video),'-af','volumedetect','-f','null','-'],capture_output=True,text=True)
    assert decoded.returncode==0,decoded.stderr[-1000:]
    log=decoded.stderr
    assert all(s in log for s in ('Video: h264','Audio: aac','1280x720','30 fps'))
    mean=float(re.search(r'mean_volume: ([\d.-]+) dB',log)[1])
    peak=float(re.search(r'max_volume: ([\d.-]+) dB',log)[1])
    assert -40<mean<0 and peak<0,(mean,peak)
    directory=Path(item['shots'])
    frames=sorted(directory.glob('f*.png'))
    frame_count=round(timeline['total']*30)
    assert [f.name for f in frames]==['f'+str(n).zfill(5)+'.png' for n in range(0,frame_count,45)]
    for f in frames:
        with Image.open(f) as im:
            assert im.size==(1280,720)
            assert len(im.convert('RGB').getcolors(1280*720))>10,'空の点検コマ'
    proof=[]
    for index in sorted({0,len(frames)//2,len(frames)-1}):
        frame=frames[index];n=int(frame.stem[1:]);out=directory/('実動画_'+frame.name)
        r=subprocess.run([str(ffmpeg),'-nostdin','-y','-i',str(video),'-vf','select=eq(n\\,'+str(n)+')','-vsync','0','-frames:v','1',str(out)],capture_output=True,text=True)
        assert r.returncode==0,r.stderr[-500:]
        with Image.open(frame) as a,Image.open(out) as b:
            rms=ImageStat.Stat(ImageChops.difference(a.convert('RGB'),b.convert('RGB'))).rms
            assert max(rms)<12,'点検コマと実動画の内容が違う'
        proof.append({'frame':n,'rms':rms})
    sheets=[]
    for start in range(0,len(frames),24):
        group=frames[start:start+24]
        sheet=Image.new('RGB',(1536,236*math.ceil(len(group)/4)),'white');draw=ImageDraw.Draw(sheet)
        for k,f in enumerate(group):
            with Image.open(f) as im:sheet.paste(im.convert('RGB').resize((384,216)),((k%4)*384,(k//4)*236))
            draw.text(((k%4)*384+5,(k//4)*236+218),str(round(int(f.stem[1:])/30,1))+'s',fill='black')
        out=directory/('全場面_'+str(start//24+1)+'.jpg');sheet.save(out,quality=92);sheets.append(str(out))
    result={'id':id,'sha256':item['sha256'],'seconds':timeline['total'],'frames':frame_count,'sampleFrames':len(frames),'decode':'映像・音声を最後まで復号成功','format':'H264・1280x720・30fps・AAC','meanDB':mean,'peakDB':peak,'captions':'全ステップが台本と一致','videoFrameProof':proof,'contactSheets':sheets,'visualReview':'未確認：一覧を目視してから完成判定','adoption':'Claude確認待ち'}
    (directory/'実動画の点検.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(id,len(frames),'場面、実動画・音声・字幕の点検成功',flush=True)
