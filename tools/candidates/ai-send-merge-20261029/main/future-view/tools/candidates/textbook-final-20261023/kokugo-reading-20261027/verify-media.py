"""Full AV and every1.5-second encoded-frame evidence for these two candidates."""
from pathlib import Path
import audioop
import hashlib
import json
import math
import re
import runpy
import subprocess
import sys
import wave

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
library=runpy.run_path(str(HERE/'build-videos.py'),run_name='media_verification_library')
BINARY=library['FFMPEG']
GROUP='videos-caption-v2' if '--caption-v2' in sys.argv else 'videos'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()


def verify(ident):
    directory=HERE/GROUP/ident
    generation=json.loads((directory/'generation-result.json').read_text())
    movie=directory/'candidate.mp4'
    assert sha(movie)==generation['sha256']
    assert sha(HERE/'scene.js')==generation['sceneSha256']
    assert sha(library['SETTINGS_FILE'])==generation['settingsSha256']
    inputs=[movie,HERE/'scene.js',library['SETTINGS_FILE'],directory/'script.json',directory/'timeline.json',directory/'generation-result.json',Path(__file__),HERE/'build-videos.py',library['ENGINE'],library['GENERIC']/'template.js',library['GENERIC']/'render_fast.mjs']
    output=directory/'technical-media-result.json'
    if output.exists():
        old=json.loads(output.read_text())
        assert old['status']=='technical checks passed; direct actual-frame review pending'
        assert all(sha(ROOT/r['file'])==r['sha256'] for r in old['inputs']+old['outputs'])
        return old
    source=json.loads((directory/'script.json').read_text())
    timeline=json.loads((directory/'timeline.json').read_text())
    assert 0<timeline['total']<=90
    assert len(source['steps'])==generation['logicalScenes']
    assert len(timeline['steps'])==generation['captionChunks']
    counters={};audio=[];previous=-1
    for step in timeline['steps']:
        index=step['sceneIndex'];assert previous<=index<len(source['steps']);previous=index
        part=counters.get(index,0);counters[index]=part+1
        assert step['say']==step['cap'] and len(step['cap'])<=54
        clip=directory/'audio'/f'{index:02}-{part:02}-clear.wav'
        with wave.open(str(clip)) as reader:
            assert (reader.getframerate(),reader.getnchannels(),reader.getsampwidth())==(24000,1,2)
            data=reader.readframes(reader.getnframes());seconds=len(data)/48000
        assert abs(seconds-step['speak'])<=.001 and audioop.rms(data,2)>5
        start=timeline['head'] if not audio else step['start']
        assert step['end']-start>=seconds-.002
        inputs.append(clip);audio.append({'file':clip.relative_to(ROOT).as_posix(),'sha256':sha(clip),'seconds':seconds,'rms':audioop.rms(data,2)})
    for i,step in enumerate(source['steps']):
        assert ''.join(s['say'] for s in timeline['steps'] if s['sceneIndex']==i)==step['say']==step['cap']
    decode_log=directory/'full-av-decode.log';decode_receipt=directory/'decode-receipt.json'
    if decode_receipt.exists():
        receipt=json.loads(decode_receipt.read_text());assert receipt['movieSha256']==sha(movie) and receipt['logSha256']==sha(decode_log)
        count=receipt['frames']
    else:
        decoded=subprocess.run([str(BINARY),'-nostdin','-hide_banner','-xerror','-err_detect','explode','-i',str(movie),'-map','0','-f','null','-'],capture_output=True,text=True)
        decode_log.write_text(decoded.stderr);decoded.check_returncode()
        assert re.search(r'Video: h264[^\n]*1280x720[^\n]*30 fps',decoded.stderr)
        assert re.search(r'Audio: aac[^\n]*24000 Hz[^\n]*mono',decoded.stderr)
        counts=re.findall(r'frame=\s*(\d+)',decoded.stderr);assert counts
        count=int(counts[-1]);assert count==round(timeline['total']*30)
        decode_receipt.write_text(json.dumps({'status':'full AV decoded successfully','movieSha256':sha(movie),'logSha256':sha(decode_log),'frames':count},indent=2)+'\n')
    assert count==round(timeline['total']*30)
    frames=directory/'actual-frames'
    if not frames.exists():
        frames.mkdir()
        subprocess.run([str(BINARY),'-nostdin','-v','error','-i',str(movie),'-vf','select=not(mod(n\\,45))','-vsync','vfr',str(frames/'%03d.png')],check=True,capture_output=True)
    shots=sorted(frames.glob('[0-9][0-9][0-9].png'))
    assert len(shots)==math.floor((count-1)/45)+1
    tail_time=(count-1)/30
    if not (frames/'tail.png').exists():
        subprocess.run([str(BINARY),'-nostdin','-v','error','-ss',str(tail_time),'-i',str(movie),'-frames:v','1',str(frames/'tail.png')],check=True,capture_output=True)
    samples=[{'time':i*1.5,'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for i,p in enumerate(shots)]
    samples.append({'time':tail_time,'file':(frames/'tail.png').relative_to(ROOT).as_posix(),'sha256':sha(frames/'tail.png')})
    outputs=[*shots,frames/'tail.png',decode_log,decode_receipt]
    result={'status':'technical checks passed; direct actual-frame review pending','id':ident,'movieSha256':sha(movie),'fps':30,'frames':count,'seconds':timeline['total'],'fullAVDecode':'passed','voice':'Kyoko','rate':175,'captionIdentity':'All chunk say/cap identical; exact concatenation to each original logical step','audio':audio,'samples':samples,'inputs':[{'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for p in inputs],'outputs':[{'file':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for p in outputs],'scope':'Candidate only; actual all-stream decode/audio lengths and every1.5s+tail encoded frames. Main/book playback and human listening excluded.'}
    output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(ident,'AV passed;',count,'frames;',len(samples),'visual samples pending',flush=True)
    return result


ids=[s for s in sys.argv[1:] if s!='--caption-v2'] or ['K1-C1-S1-V01','K1-C1-S1-VP']
assert ids and len(ids)==len(set(ids)) and set(ids)<={'K1-C1-S1-V01','K1-C1-S1-VP'}
results=[verify(i) for i in ids]
(HERE/GROUP/'technical-media-result.json').write_text(json.dumps({'status':str(len(results))+' technical checks passed; visual/book approval pending','items':[{'id':r['id'],'movieSha256':r['movieSha256'],'samples':len(r['samples'])} for r in results]},ensure_ascii=False,indent=2)+'\n')
