"""Isolated scene preparation/rendering. Rendering requires a pinned direct-review approval."""
from pathlib import Path
import hashlib
import json
import os
import runpy
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
LIB = runpy.run_path(str(HERE.parent / 'kokugo-intonation-20261027/build-videos-v3.py'), run_name='render_library')
GENERIC = runpy.run_path(str(LIB['GENERIC'] / 'make.py'), run_name='display_library')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
expected_ids = set(json.loads((HERE / 'source-preservation-result.json').read_text())['currentlyReferencedVideos']) - {'K1-C2-S5-VP'}
assert len(expected_ids) == 9


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def prepare(ident):
    audio = HERE / 'audio-candidates' / ident
    proof = json.loads((audio / 'prepared.json').read_text())
    source = json.loads((audio / 'script.json').read_text())
    timeline = json.loads((audio / 'timeline.json').read_text())
    assert proof['status'].startswith('speech prepared') and proof['id'] == ident
    assert 0 < timeline['total'] <= 90
    assert proof['inputs']['settingsSha256'] == sha(LIB['SETTINGS_FILE'])
    for clip in proof['clips']:
        assert clip['say'] == clip['cap']
        for output in clip['outputs']:
            assert sha(audio / output['file']) == output['sha256']
    roles = GENERIC['roles'](source['steps'], ident.endswith('-VP'))
    assert roles == proof['roles']
    for step, role in zip(source['steps'], roles):
        assert step['say'] == step['cap']
        if step['say'].startswith('\u6c17\u3092\u3064\u3051\u3066'):
            assert role == 'caution'
    directory = HERE / 'movies-final' / ident
    inputs = {str(p.relative_to(ROOT)): sha(p) for p in [HERE / 'scene-final.js', LIB['SETTINGS_FILE'], LIB['ENGINE'], LIB['GENERIC'] / 'template.js', audio / 'prepared.json', audio / 'script.json', audio / 'timeline.json']}
    if directory.exists():
        prepared = json.loads((directory / 'prepared.json').read_text())
        assert prepared['inputs'] == inputs, 'Do not reuse scenes after an unreviewed input change'
        assert sha(directory / 'scene.html') == prepared['htmlSha256']
        return directory, prepared
    directory.mkdir(parents=True)
    (directory / 'audio').symlink_to(audio / 'audio', target_is_directory=True)
    for name in ['script.json', 'timeline.json']:
        (directory / name).write_bytes((audio / name).read_bytes())
    meta = dict(id=ident, subject='\u82f1\u8a9e' if ident.startswith('E1-') else '\u56fd\u8a9e',
                kind='VP' if ident.endswith('-VP') else 'V', title=source['title'],
                steps=[dict(step, role=role, text=GENERIC['display'](step['say'], role)) for step, role in zip(source['steps'], roles)])
    relative = lambda p: os.path.relpath(p, directory)
    html = '<meta charset="utf-8"><style>body{margin:0}canvas{display:block}</style><canvas width="1280" height="720"></canvas>'
    html += '<script src="' + relative(LIB['ENGINE']) + '"></script><script>window.META=' + json.dumps(meta, ensure_ascii=False) + ';</script>'
    html += '<script src="' + relative(LIB['GENERIC'] / 'template.js') + '"></script><script src="' + relative(HERE / 'scene-final.js') + '"></script>'
    (directory / 'scene.html').write_text(html)
    prepared = dict(status='scene prepared; mechanical/direct preflight required before rendering', id=ident, inputs=inputs,
                    htmlSha256=sha(directory / 'scene.html'), seconds=timeline['total'], logicalScenes=len(source['steps']),
                    captionChunks=len(timeline['steps']), sceneSha256=sha(HERE / 'scene-final.js'))
    write(directory / 'prepared.json', prepared)
    return directory, prepared


def render(ident):
    directory, prepared = prepare(ident)
    approval = json.loads((directory / 'scene-approval.json').read_text())
    assert approval['approved'] is True and approval['preparedSha256'] == sha(directory / 'prepared.json')
    assert approval['sceneSha256'] == sha(HERE / 'scene-final.js')
    assert approval['preflightSha256'] == sha(directory / 'preflight-result.json')
    for row in approval['screens']:
        assert sha(directory / row['file']) == row['sha256']
    assert not (directory / 'candidate.mp4').exists() and not (directory / 'generation-result.json').exists(), 'Never regenerate a completed movie'
    process = subprocess.run(['node', str(LIB['GENERIC'] / 'render_fast.mjs'), str(directory / 'scene.html'), str(directory / 'timeline.json'), str(directory / 'silent.mp4'), str(LIB['FFMPEG']), '30', ''], capture_output=True, timeout=1200)
    (directory / 'render.log').write_bytes(process.stdout + process.stderr)
    process.check_returncode()
    timeline = json.loads((directory / 'timeline.json').read_text())
    counters, clips = {}, []
    for step in timeline['steps']:
        scene = step['sceneIndex']
        number = counters.get(scene, 0)
        counters[scene] = number + 1
        clips.append((directory / 'audio' / f'{scene:02}-{number:02}-clear.wav', step['start']))
    clips[0] = (clips[0][0], timeline['head'])
    command = [str(LIB['FFMPEG']), '-nostdin', '-v', 'error', '-i', str(directory / 'silent.mp4')]
    for clip, _ in clips:
        command += ['-i', str(clip)]
    filters = ''.join(f'[{n+1}:a]adelay={round(at*1000)}|{round(at*1000)}[a{n}];' for n, (_, at) in enumerate(clips))
    filters += ''.join(f'[a{n}]' for n in range(len(clips))) + f'amix=inputs={len(clips)}:normalize=0:duration=longest,apad=whole_dur={timeline["total"]}[out]'
    command += ['-filter_complex', filters, '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-t', str(timeline['total']), '-movflags', '+faststart', str(directory / 'candidate.mp4')]
    subprocess.run(command, check=True, capture_output=True, timeout=300)
    assert all(sha(ROOT / file) == digest for file, digest in prepared['inputs'].items())
    write(directory / 'generation-result.json', dict(status='candidate generated; AV/frame/book approval pending', id=ident,
          sha256=sha(directory / 'candidate.mp4'), fps=30, seconds=timeline['total'], preparedSha256=sha(directory / 'prepared.json'),
          approvalSha256=sha(directory / 'scene-approval.json'), sceneSha256=sha(HERE / 'scene-final.js')))
    print(ident, 'candidate generated;', timeline['total'], 'seconds', flush=True)


if __name__ == '__main__':
    mode = sys.argv[1]
    assert mode in ['--prepare-only', '--render']
    ids = sys.argv[2:] or sorted(p.parent.name for p in (HERE / 'audio-candidates').glob('*/prepared.json'))
    assert ids and len(ids) == len(set(ids)) and set(ids) <= expected_ids
    for ident in ids:
        if mode == '--render':
            render(ident)
        else:
            directory, result = prepare(ident)
            print(ident, 'scene prepared;', result['logicalScenes'], 'logical scenes', flush=True)
