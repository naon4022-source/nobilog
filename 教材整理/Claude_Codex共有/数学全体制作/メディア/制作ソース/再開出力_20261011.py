# coding: utf-8
"""依頼済み動画だけを再出力。復号できた新動画でだけ差し替え、旧版は履歴に保全する。"""
from pathlib import Path
import datetime, hashlib, json, os, re, shutil, subprocess, sys
SOURCE = Path(__file__).resolve().parent
MEDIA = SOURCE.parent
LEDGER = SOURCE / '69本_制作進捗.json'
FFMPEG = next((SOURCE / '制作ツール/imageio_ffmpeg/binaries').glob('ffmpeg-macos-*'))
STAGE = Path('/tmp/nobi-math-resume-20261011'); STAGE.mkdir(exist_ok=True)
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def sources(vid):
    html = SOURCE / (vid + '.html')
    deps = re.findall(r'<script\s+src="([^"]+)"', html.read_text())
    paths = {name: SOURCE / name for name in deps}
    paths['音声共有/設定.json'] = SOURCE / '音声共有/設定.json'
    for path in paths.values():
        assert path.resolve().is_relative_to(SOURCE.resolve()) and path.is_file()
    return ({ext:sha(SOURCE/(vid+'.'+ext)) for ext in ['html','json']}, {name:sha(path) for name,path in paths.items()})
for vid in sys.argv[1:]:
    data = json.loads(LEDGER.read_text()); item = next(x for x in data['items'] if x['id'] == vid)
    assert vid.startswith(('M1-C4-', 'M1-C5-')), '対象外の動画を再制作しない'
    assert item['state'] in ('補正済み／再出力待ち','台本・専用アニメーション作成／配置点検済み／実音声出力待ち')
    script = json.loads((SOURCE/(vid+'.json')).read_text())
    assert script['settings'] == '音声共有/設定.json' and script['id'] == vid
    before = sources(vid)
    shots = MEDIA/'点検'/(vid+'_69本_再開20261011'); shots.mkdir(parents=True,exist_ok=True)
    old = MEDIA/(vid+'.mp4'); stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    history = MEDIA/'履歴'/'20261011再開'/vid/stamp
    if old.exists():
        history.mkdir(parents=True,exist_ok=True); shutil.copy2(old,history/old.name)
        if shots.exists(): shutil.copytree(shots,history/'点検',dirs_exist_ok=True)
        tlold = SOURCE/(vid+'.timeline.json')
        if tlold.exists(): shutil.copy2(tlold,history/tlold.name)
    target = STAGE/(vid+'.mp4'); log = shots/'制作ログ.txt'
    command = [sys.executable,str(SOURCE/'動画エンジン/make_video.py'),str(SOURCE/(vid+'.html')),str(SOURCE/(vid+'.json')),str(target),str(shots)]
    print(vid,'音声・30fpsの出力開始',flush=True)
    with log.open('w') as output:
        result = subprocess.run(command,env={**os.environ,'FFMPEG':str(FFMPEG)},stdout=output,stderr=subprocess.STDOUT)
    assert result.returncode == 0, vid+' の生成失敗。旧動画は保全済み：'+str(log)
    assert before == sources(vid), '出力中に制作ソースが変わりました'
    decode = subprocess.run([str(FFMPEG),'-nostdin','-i',str(target),'-af','volumedetect','-f','null','-'],capture_output=True,text=True)
    assert decode.returncode == 0 and all(x in decode.stderr for x in ['Video: h264','Audio: aac','1280x720','30 fps'])
    mean = float(re.search(r'mean_volume: ([\d.-]+) dB',decode.stderr)[1]); peak = float(re.search(r'max_volume: ([\d.-]+) dB',decode.stderr)[1])
    assert -40 < mean < 0 and peak < 0, '音声の量を再確認してください'
    assert target.stat().st_size < 4*1024*1024, '4MB上限を超えました。旧動画は置換しません'
    tl = json.loads((SOURCE/(vid+'.timeline.json')).read_text())
    assert len(tl['steps']) == len(script['steps'])
    assert all(a['say']==b['say'] and b['cap']==a.get('cap',a['say'])==a['say'] for a,b in zip(script['steps'],tl['steps']))
    assert all(step['speak'] > .2 for step in tl['steps'])
    shutil.copy2(target,old)
    if item.get('failure'):
        item.setdefault('previousFailures',[]).append(item['failure']);item['failure']=None
    item.update(state='出力済み／全場面点検待ち',shots=str(shots),log=str(log),seconds=tl['total'],steps=len(tl['steps']),sha256=sha(old),sourceSha256=before[0],dependencySha256=before[1])
    item['resumeOutput']={'date':'2026-10-11','decode':'全映像・音声を復号成功','meanDB':mean,'peakDB':peak,'previousMedia':str(history/old.name) if history.exists() else None}
    data['rendered']=sum((MEDIA/(x['id']+'.mp4')).exists() for x in data['items'])
    data['verification']['audio']='2026-10-11 Kyokoの短文3.2秒と、今回の全ステップ音声・復号成功を確認。耳での実機確認とは区別。'
    LEDGER.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(vid,'出力と復号成功',tl['total'],'秒。全場面目視と本への反映はこれから。',flush=True)
