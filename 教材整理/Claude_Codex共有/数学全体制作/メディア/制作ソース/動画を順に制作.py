# -*- coding: utf-8 -*-
"""指定IDのみを順に投入。完成判定は目視点検後に別途行う。
2本の独立した描画を並行し、他担当の単元・共有エンジンは書き換えない。
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess,sys,json,hashlib,threading,os,time
here=Path(__file__).resolve().parent
media=here.parent
lock=threading.Lock()
stop_on_failure=threading.Event()
progress_file=here/'69本_制作進捗.json'
def record(id,**values):
    with lock:
        p=json.loads(progress_file.read_text())
        item=next(x for x in p['items'] if x['id']==id)
        item.update(values)
        p['rendered']=sum(x['state'] in ('出力済み／全場面点検待ち','点検・本への反映済み') for x in p['items'])
        p['completed']=sum(x['state']=='点検・本への反映済み' for x in p['items'])
        temp=progress_file.with_suffix('.tmp');temp.write_text(json.dumps(p,ensure_ascii=False,indent=2));os.replace(temp,progress_file)
def make(id):
    if stop_on_failure.is_set():raise RuntimeError('前の出力が失敗したため、新しい動画は投入しません。')
    if id.startswith(('M1-C6-','M1-C7-')):raise ValueError('Claude担当のIDは対象外')
    sc=json.loads((here/(id+'.json')).read_text())
    assert sc.get('settings')=='音声共有/設定.json'
    shots=media/'点検'/(id+'_69本_第1稿')
    # 再出力で古いコマを混ぜない。既存点検コマは削除せず別の連番に保存。
    n=1
    while shots.exists() and list(shots.glob('f*.png')):
        n+=1;shots=media/'点検'/(id+'_69本_第'+str(n)+'稿')
    shots.mkdir(parents=True,exist_ok=True)
    staged=media/'制作中';staged.mkdir(exist_ok=True)
    output=staged/(id+'.mp4')
    log=media/'点検'/(id+'_制作ログ.txt')
    record(id,state='映像出力中',shots=str(shots),log=str(log))
    with log.open('w') as f:
        r=subprocess.run([sys.executable,str(here/'承認音声で動画を作る.py'),str(here/(id+'.html')),str(here/(id+'.json')),str(output),str(shots)],stdout=f,stderr=subprocess.STDOUT)
    if r.returncode:
        stop_on_failure.set()
        record(id,state='出力失敗／未完成');raise RuntimeError(id+' 出力失敗、ログを確認')
    tl=json.loads((here/(id+'.timeline.json')).read_text())
    assert all(x['speak']>.2 for x in tl['steps']), '空の音声を含むため未完成'
    assert output.stat().st_size<4*1024*1024
    os.replace(output,media/(id+'.mp4'))
    record(id,state='出力済み／全場面点検待ち',seconds=tl['total'],steps=len(sc['steps']),sha256=hashlib.sha256((media/(id+'.mp4')).read_bytes()).hexdigest())
    print(id,'rendered',tl['total'],'seconds',flush=True)
def preflight():
    # 1回だけ音声を試し、空音声のまま69本を連続投入しない。
    import runpy,tempfile
    validate=runpy.run_path(str(here/'音声実体を検証.py'))['validate']
    with tempfile.TemporaryDirectory(prefix='nobi-voice-preflight-') as td:
        probe=Path(td)/'voice.wav'
        subprocess.run(['say','-v','Kyoko','-r','175','-o',str(probe),'--data-format=LEI16@24000','せいの数と、ふの数を確かめます。'],check=True,timeout=85)
        result=validate(probe)
    print('Kyoko音声確認成功',round(result['duration'],2),'秒',flush=True)

if __name__=='__main__':
    args=sys.argv[1:]
    ledger=json.loads(progress_file.read_text())
    allowed={x['id']:x for x in ledger['items']}
    if args==['--remaining']:
        # 出力後の目視確認待ちを、再開のたびに重複して生成しない。
        ready=('点検・本への反映済み','出力済み／全場面点検待ち')
        args=[x['id'] for x in ledger['items'] if x['state'] not in ready or not (media/(x['id']+'.mp4')).exists() or hashlib.sha256((media/(x['id']+'.mp4')).read_bytes()).hexdigest()!=x.get('sha256')]
    probe_only=args==['--probe']
    if not probe_only:
        if not args:raise SystemExit('対象ID または --remaining を指定してください。')
        if len(set(args))!=len(args) or any(id not in allowed for id in args):raise SystemExit('69本の台帳にないID、または重複IDは制作しません。')
        for id in args:
            for ext,expected in allowed[id].get('sourceSha256',{}).items():
                actual=hashlib.sha256((here/(id+'.'+ext)).read_bytes()).hexdigest()
                if actual!=expected:raise SystemExit(id+' の台本が点検後に変更されています。再点検してください。')
    preflight()
    if not probe_only:
        with ThreadPoolExecutor(max_workers=2) as pool:
            list(pool.map(make,args))
