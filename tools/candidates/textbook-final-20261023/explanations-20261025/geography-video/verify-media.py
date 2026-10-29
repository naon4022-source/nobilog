from pathlib import Path
import hashlib
import json
import math
import re
import subprocess
import wave

here = Path(__file__).resolve().parent
root = here.parents[4]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
generation = json.loads((here / 'generation-result.json').read_text())
movie = here / 'candidate.mp4'
assert sha(movie) == generation['movieSha256']
for file, digest in generation['inputs'].items():
    if sha(root / file) == digest:
        continue
    promotion = json.loads((here / 'integration.json').read_text())
    row = next(r for r in promotion['files'] if r['file'] == file)
    assert file == '教材整理/Claude_Codex共有/地理全体制作/制作ソース/G-C2-S1-VP.json'
    assert row['beforeSha256'] == digest and sha(root / row['beforeFile']) == digest
    assert sha(root / file) == row['afterSha256']
assert sha(root / generation['settingsFile']) == generation['settingsSha256']
output = here / 'media-result.json'
if output.exists():
    prior = json.loads(output.read_text())
    assert prior['movieSha256'] == sha(movie)
    assert all(sha(root / file) == digest for file, digest in prior['outputs'].items())
    print('Existing exact media verification reused; no duplicate decode/extraction')
    raise SystemExit(0)
binary = root / '教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/制作ツール/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
script = json.loads((here / 'script.json').read_text())
timeline = json.loads((here / 'timeline.json').read_text())
assert len(script['steps']) == len(timeline['steps']) == 7
audio = []
for i, (source, step) in enumerate(zip(script['steps'], timeline['steps'])):
    assert source['say'] == source['cap'] == step['say'] == step['cap']
    clip = here / 'audio' / f'{i:02}-clear.wav'
    with wave.open(str(clip)) as f:
        assert f.getframerate() == 24000 and f.getnchannels() == 1 and f.getsampwidth() == 2
        duration = f.getnframes() / f.getframerate()
    assert abs(duration - step['speak']) <= 0.001
    assert step['end'] - step['start'] >= duration
    audio.append({'step': i, 'seconds': duration, 'file': str(clip.relative_to(root)), 'sha256': sha(clip)})
assert timeline['total'] <= 60
decoded = subprocess.run([str(binary), '-nostdin', '-hide_banner', '-xerror', '-err_detect', 'explode', '-i', str(movie), '-map', '0', '-f', 'null', '-'], capture_output=True, text=True, check=True)
(here / 'full-av-decode.log').write_text(decoded.stderr)
assert re.search(r'Video: h264[^\n]*1280x720[^\n]*30 fps', decoded.stderr)
assert re.search(r'Audio: aac[^\n]*24000 Hz[^\n]*mono', decoded.stderr)
frames_count = re.findall(r'frame=\s*(\d+)', decoded.stderr)
assert frames_count and int(frames_count[-1]) == round(timeline['total'] * 30)
frames = here / 'actual-frames'
frames.mkdir()
subprocess.run([str(binary), '-nostdin', '-v', 'error', '-i', str(movie), '-vf', 'select=not(mod(n\,45))', '-vsync', 'vfr', str(frames / '%03d.png')], capture_output=True, check=True)
shots = sorted(frames.glob('*.png'))
expected = math.floor((int(frames_count[-1]) - 1) / 45) + 1
assert len(shots) == expected
tail_time = (int(frames_count[-1]) - 1) / 30
subprocess.run([str(binary), '-nostdin', '-v', 'error', '-ss', str(tail_time), '-i', str(movie), '-frames:v', '1', str(frames / 'tail.png')], capture_output=True, check=True)
result = {'status': 'technical checks passed; every-scene direct visual review pending', 'id': 'G-C2-S1-VP',
          'movieSha256': sha(movie), 'fullAVDecode': 'passed', 'fps': 30, 'frames': int(frames_count[-1]),
          'seconds': timeline['total'], 'voice': 'Kyoko', 'rate': 175, 'profile': 'clear', 'captions': 'all7 canonical say/cap pairs identical',
          'audio': audio, 'samples': [{'time': i * 1.5, 'file': str(p.relative_to(root)), 'sha256': sha(p)} for i, p in enumerate(shots)]
                     + [{'time': tail_time, 'file': str((frames / 'tail.png').relative_to(root)), 'sha256': sha(frames / 'tail.png')}],
          'outputs': {str(p.relative_to(root)): sha(p) for p in [*shots, frames / 'tail.png', here / 'full-av-decode.log']},
          'scope': 'Candidate only. Actual full AV decode and actual encoded frames every1.5s plus tail; no publication, integration, real account use or unchanged-media redecoding.'}
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Corrected geography full AV/30fps/audio lengths/caption identity passed; actual sampled images:', len(result['samples']))
