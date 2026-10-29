"""Build two isolated chapter1 corrections; never write original教材 or restart services."""
from pathlib import Path
import hashlib
import json
import os
import runpy
import subprocess
import sys
import wave

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SHARE = ROOT / '\u6559\u6750\u6574\u7406/Claude_Codex\u5171\u6709'
GENERIC = SHARE / '\u6559\u79d1\u52d5\u753b'
MATH = SHARE / '\u6570\u5b66\u5168\u4f53\u5236\u4f5c/\u30e1\u30c7\u30a3\u30a2/\u5236\u4f5c\u30bd\u30fc\u30b9'
SETTINGS_FILE = MATH / '\u97f3\u58f0\u5171\u6709/\u8a2d\u5b9a.json'
FFMPEG = MATH / '\u5236\u4f5c\u30c4\u30fc\u30eb/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
ENGINE = MATH / '\u52d5\u753b\u30a8\u30f3\u30b8\u30f3/engine.js'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def chunks(value, limit=50):
    result=[]
    while len(value)>limit:
        cuts=[i+1 for i,c in enumerate(value[:limit]) if c in '\u3002\u3001\uff01\uff1f\uff1a' and i>=15]
        cut=cuts[-1] if cuts else limit
        while cut<len(value) and value[cut] in '\u300d\u300f\uff09\u3011\u3009\u300b':cut+=1
        result.append(value[:cut]);value=value[cut:]
    if value:result.append(value)
    return result


def main():
    settings=json.loads(SETTINGS_FILE.read_text())
    assert (settings['voice'],settings['rate'],settings['profile'])==('Kyoko',175,'clear')
    module=runpy.run_path(str(GENERIC/'make.py'),run_name='candidate_library_only')
    manifest=json.loads((HERE/'manifest.json').read_text())
    scripts=[r for r in manifest['files'] if r['file'].endswith('.json')]
    assert {Path(r['file']).stem for r in scripts}=={'K1-C1-S1-V01','K1-C1-S1-VP'}
    results=[]
    for row in scripts:
        ident=Path(row['file']).stem;out=HERE/'videos'/ident
        resumed = out.exists()
        assert not (out/'generation-result.json').exists() and not (out/'candidate.mp4').exists(), 'Never regenerate a completed movie'
        if resumed:
            prior=json.loads((out/'prepared.json').read_text())
            assert prior['sourceSha256']==row['afterSha256'] and prior['settingsSha256']==sha(SETTINGS_FILE)
            previous_timeline=json.loads((out/'timeline.json').read_text())
        else:
            out.mkdir(parents=True);(out/'audio').mkdir()
        candidate=HERE/'output'/row['file'];original=ROOT/row['file']
        assert sha(candidate)==row['afterSha256'] and sha(original)==row['beforeSha256']
        source=json.loads(candidate.read_text());assert all(s['say']==s['cap'] and not s.get('read') for s in source['steps'])
        roles=module['roles'](source['steps'],ident.endswith('-VP'))
        meta={'kind':'VP' if ident.endswith('-VP') else 'V','title':source['title'],
              'steps':[dict(s,role=r,text=module['display'](s['say'],r)) for s,r in zip(source['steps'],roles)]}
        timeline=[];clips=[];at=settings['head']
        for scene_index,s in enumerate(source['steps']):
            parts=chunks(s['say']);assert ''.join(parts)==s['say']
            scene_start=0 if scene_index==0 else at
            first=len(timeline)
            for part_index,part in enumerate(parts):
                name=f'{scene_index:02}-{part_index:02}';raw=out/'audio'/(name+'.wav');filtered=out/'audio'/(name+'-clear.wav')
                reading=module['yomi_ja'](part,False)
                if resumed:
                    old_step=previous_timeline['steps'][len(timeline)]
                    assert old_step['say']==old_step['cap'] and old_step['yomi']==reading
                    closing=str.maketrans('', '', '\u300d\u300f\uff09\u3011\u3009\u300b')
                    assert old_step['say'].translate(closing)==part.translate(closing), 'Reuse speech only for an exact closing-quote boundary move'
                    assert raw.is_file() and filtered.is_file()
                else:
                    subprocess.run(['say','-v','Kyoko','-r','175','-o',str(raw),'--data-format=LEI16@24000',reading],check=True,capture_output=True,timeout=45)
                    subprocess.run([str(FFMPEG),'-nostdin','-v','error','-y','-i',str(raw),'-af',settings['filter'],'-ar','24000','-ac','1','-c:a','pcm_s16le',str(filtered)],check=True,capture_output=True,timeout=45)
                with wave.open(str(filtered)) as audio:duration=audio.getnframes()/audio.getframerate()
                assert duration>=max(.1,len(reading)*.025), 'Missing or truncated speech'
                if resumed:assert abs(duration-old_step['speak'])<=.001
                gap=settings['gap']+s.get('hold',.35) if part_index==len(parts)-1 else .06
                end=at+duration+gap
                timeline.append({'start':round(at,3),'speak':round(duration,3),'end':round(end,3),'say':part,'cap':part,'yomi':reading,'sceneIndex':scene_index,'sceneStart':round(scene_start,3)})
                clips.append((filtered,at));at=end
            for t in timeline[first:]:t['sceneEnd']=round(at,3)
        timeline[0]['start']=0
        tl={'total':round(at+settings['tail'],3),'head':settings['head'],'steps':timeline,'credit':''}
        if resumed:
            stable=lambda value:dict(value,steps=[{k:v for k,v in s.items() if k not in ('say','cap')} for s in value['steps']])
            assert stable(tl)==stable(previous_timeline), 'Do not reuse audio with changed timing or reading'
        (out/'script.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
        (out/'timeline.json').write_text(json.dumps(tl,ensure_ascii=False,indent=2)+'\n')
        rel=lambda p:os.path.relpath(p,out)
        html='<meta charset="utf-8"><style>body{margin:0}canvas{display:block}</style><canvas width="1280" height="720"></canvas>'
        html+='<script src="'+rel(ENGINE)+'"></script><script>window.META='+json.dumps(meta,ensure_ascii=False)+';</script><script src="'+rel(GENERIC/'template.js')+'"></script><script src="'+rel(HERE/'scene.js')+'"></script>'
        (out/'scene.html').write_text(html)
        (out/'prepared.json').write_text(json.dumps({'status':'audio and scene prepared; video pending','sourceSha256':sha(candidate),'settingsSha256':sha(SETTINGS_FILE),'sceneSha256':sha(HERE/'scene.js'),'captionChunks':len(timeline),'logicalScenes':len(source['steps'])},indent=2)+'\n')
        if '--prepare-only' in sys.argv:
            print(ident,'audio and scene prepared; no video render',flush=True)
            continue
        render=subprocess.run(['node',str(GENERIC/'render_fast.mjs'),str(out/'scene.html'),str(out/'timeline.json'),str(out/'silent.mp4'),str(FFMPEG),'30',''],capture_output=True,timeout=1200)
        (out/'render.log').write_bytes(render.stdout+render.stderr)
        render.check_returncode()
        args=[str(FFMPEG),'-nostdin','-v','error','-y','-i',str(out/'silent.mp4')]
        for clip,_ in clips:args+=['-i',str(clip)]
        filters=''.join(f'[{i+1}:a]adelay={round(start*1000)}|{round(start*1000)}[a{i}];' for i,(_,start) in enumerate(clips))
        filters+=''.join(f'[a{i}]' for i in range(len(clips)))+f'amix=inputs={len(clips)}:normalize=0:duration=longest,apad=whole_dur={tl["total"]}[out]'
        args+=['-filter_complex',filters,'-map','0:v','-map','[out]','-c:v','copy','-c:a','aac','-b:a','96k','-t',str(tl['total']),'-movflags','+faststart',str(out/'candidate.mp4')]
        subprocess.run(args,check=True,capture_output=True,timeout=300)
        r={'id':ident,'status':'generated candidate; AV/visual/book checks pending','movie':(out/'candidate.mp4').relative_to(ROOT).as_posix(),'sha256':sha(out/'candidate.mp4'),'duration':tl['total'],'fps':30,'voice':'Kyoko','rate':175,'settingsSha256':sha(SETTINGS_FILE),'captionChunks':len(timeline),'logicalScenes':len(source['steps']),'sourceSha256':sha(candidate),'sceneSha256':sha(HERE/'scene.js')}
        (out/'generation-result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');results.append(r)
        print(ident,'generated',tl['total'],'seconds',flush=True)
    if results:
        (HERE/'videos'/'generation-result.json').write_text(json.dumps({'status':'two candidates generated; main unchanged','items':results},ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':main()
