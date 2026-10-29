"""Full AV decoding and exact audio/frame evidence for completed candidate movies only."""
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

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BUILDER = runpy.run_path(str(HERE / 'build-movies-final.py'), run_name='media_evidence_library')
LIB = BUILDER['LIB']
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def verify(ident):
    directory = HERE / 'movies-final' / ident
    movie = directory / 'candidate.mp4'
    generation = json.loads((directory / 'generation-result.json').read_text())
    prepared = json.loads((directory / 'prepared.json').read_text())
    assert generation['sha256'] == sha(movie)
    assert generation['preparedSha256'] == sha(directory / 'prepared.json')
    assert generation['approvalSha256'] == sha(directory / 'scene-approval.json')
    assert generation['sceneSha256'] == sha(HERE / 'scene-final.js')
    for file, digest in prepared['inputs'].items():
        assert sha(ROOT / file) == digest
    destination = directory / 'technical-media-result.json'
    if destination.exists():
        old = json.loads(destination.read_text())
        assert old['status'] == 'technical checks passed; actual-frame review pending'
        assert all(sha(ROOT / row['file']) == row['sha256'] for row in old['inputs'] + old['outputs'])
        return old
    settings = json.loads(LIB['SETTINGS_FILE'].read_text())
    assert (settings['voice'], settings['rate'], settings['profile']) == ('Kyoko', 175, 'clear')
    source = json.loads((directory / 'script.json').read_text())
    timeline = json.loads((directory / 'timeline.json').read_text())
    assert 0 < timeline['total'] <= 90 and timeline['total'] == generation['seconds']
    assert len(source['steps']) == prepared['logicalScenes']
    assert len(timeline['steps']) == prepared['captionChunks']
    inputs = [movie, directory / 'generation-result.json', directory / 'prepared.json', directory / 'scene-approval.json',
              directory / 'script.json', directory / 'timeline.json', HERE / 'scene-final.js', HERE / 'build-movies-final.py',
              Path(__file__), LIB['SETTINGS_FILE'], LIB['ENGINE'], LIB['GENERIC'] / 'template.js', LIB['GENERIC'] / 'render_fast.mjs']
    counts, audio, previous = {}, [], -1
    for row in timeline['steps']:
        scene = row['sceneIndex']
        assert previous <= scene < len(source['steps'])
        previous = scene
        index = counts.get(scene, 0)
        counts[scene] = index + 1
        clip = directory / 'audio' / f'{scene:02}-{index:02}-clear.wav'
        with wave.open(str(clip)) as stream:
            assert (stream.getframerate(), stream.getnchannels(), stream.getsampwidth()) == (24000, 1, 2)
            pcm = stream.readframes(stream.getnframes())
        seconds = len(pcm) / 48000
        assert row['say'] == row['cap'] and len(row['cap']) <= 54
        assert abs(seconds - row['speak']) <= .001 and audioop.rms(pcm, 2) > 5
        start = timeline['head'] if not audio else row['start']
        assert row['end'] - start >= seconds - .002
        inputs.append(clip)
        audio.append(dict(file=clip.relative_to(ROOT).as_posix(), sha256=sha(clip), seconds=seconds, rms=audioop.rms(pcm, 2)))
    for scene, step in enumerate(source['steps']):
        assert ''.join(row['say'] for row in timeline['steps'] if row['sceneIndex'] == scene) == step['say'] == step['cap']
    log, decode_receipt = directory / 'full-av-decode.log', directory / 'decode-receipt.json'
    if decode_receipt.exists():
        decoded = json.loads(decode_receipt.read_text())
        assert decoded['movieSha256'] == sha(movie) and decoded['logSha256'] == sha(log)
        frames = decoded['frames']
    else:
        assert not log.exists(), 'Incomplete previous decode retained; inspect before rerunning'
        process = subprocess.run([str(LIB['FFMPEG']), '-nostdin', '-hide_banner', '-xerror', '-err_detect', 'explode', '-i', str(movie), '-map', '0', '-f', 'null', '-'], capture_output=True, text=True)
        log.write_text(process.stderr)
        process.check_returncode()
        assert re.search(r'Video: h264[^\n]*1280x720[^\n]*30 fps', process.stderr)
        assert re.search(r'Audio: aac[^\n]*24000 Hz[^\n]*mono', process.stderr)
        frames = int(re.findall(r'frame=\s*(\d+)', process.stderr)[-1])
        assert frames == round(timeline['total'] * 30)
        write(decode_receipt, dict(status='all streams decoded', movieSha256=sha(movie), logSha256=sha(log), frames=frames))
    assert frames == round(timeline['total'] * 30)
    folder = directory / 'actual-frames'
    if not folder.exists():
        folder.mkdir()
        subprocess.run([str(LIB['FFMPEG']), '-nostdin', '-v', 'error', '-i', str(movie), '-vf', 'select=not(mod(n\\,45))', '-vsync', 'vfr', str(folder / '%03d.png')], check=True, capture_output=True)
    shots = sorted(folder.glob('[0-9][0-9][0-9].png'))
    assert len(shots) == math.floor((frames - 1) / 45) + 1
    tail = (frames - 1) / 30
    if not (folder / 'tail.png').exists():
        subprocess.run([str(LIB['FFMPEG']), '-nostdin', '-v', 'error', '-ss', str(tail), '-i', str(movie), '-frames:v', '1', str(folder / 'tail.png')], check=True, capture_output=True)
    samples = [dict(time=index * 1.5, file=p.relative_to(ROOT).as_posix(), sha256=sha(p)) for index, p in enumerate(shots)]
    samples.append(dict(time=tail, file=(folder / 'tail.png').relative_to(ROOT).as_posix(), sha256=sha(folder / 'tail.png')))
    outputs = [*shots, folder / 'tail.png', log, decode_receipt]
    result = dict(status='technical checks passed; actual-frame review pending', id=ident, movieSha256=sha(movie), fps=30,
                  frames=frames, seconds=timeline['total'], fullAVDecode='passed', voice='Kyoko', rate=175,
                  logicalScenes=len(source['steps']), captionChunks=len(timeline['steps']), audio=audio, samples=samples,
                  inputs=[dict(file=p.relative_to(ROOT).as_posix(), sha256=sha(p)) for p in inputs],
                  outputs=[dict(file=p.relative_to(ROOT).as_posix(), sha256=sha(p)) for p in outputs],
                  scope='Completed candidate only. Full-stream decode, exact source/caption concatenation, actual nonempty audio lengths, every1.5s+tail encoded samples. Direct visual/book/main/device/listening approval separate.')
    write(destination, result)
    print(ident, 'AV passed;', frames, 'frames;', len(samples), 'actual samples pending review', flush=True)
    return result


if __name__ == '__main__':
    ids = sys.argv[1:]
    assert ids and len(ids) == len(set(ids)) and set(ids) <= BUILDER['expected_ids']
    for ident in ids:
        verify(ident)
