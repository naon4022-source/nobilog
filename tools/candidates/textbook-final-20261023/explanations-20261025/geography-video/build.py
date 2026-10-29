from pathlib import Path
import hashlib
import json
import os
import runpy
import shutil
import subprocess
import wave

here = Path(__file__).resolve().parent
root = here.parents[4]
share = root / '教材整理/Claude_Codex共有'
generic = share / '教科動画'
engine = share / '数学全体制作/メディア/制作ソース/動画エンジン/engine.js'
settings_file = share / '数学全体制作/メディア/制作ソース/音声共有/設定.json'
settings = json.loads(settings_file.read_text())
assert settings['voice'] == 'Kyoko' and settings['rate'] == 175 and settings['profile'] == 'clear'
binary = share / '数学全体制作/メディア/制作ソース/制作ツール/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
source = share / '地理全体制作/制作ソース/G-C2-S1-VP.json'
original = json.loads(source.read_text())
book = json.loads((root / 'site-assets/textbook-book-geography.json').read_text())
approved = book['pages'][22]['blocks'][3]['items'][0]['x']
assert approved == '赤道付近は暑く、極に近づくほど寒くなる傾向があります。乾燥帯は雨の少なさにも注目して見分けましょう。'
assert original['steps'][4]['say'].startswith('かんたんにやるコツ。赤道から極')
assert not (here / 'candidate.mp4').exists(), 'Do not regenerate a completed candidate'
original['steps'] = original['steps'][:4] + [
    {'say': '赤道付近は暑く、極に近づくほど寒くなる傾向があります。',
     'cap': '赤道付近は暑く、極に近づくほど寒くなる傾向があります。',
     'read': 'せきどうふきんは暑く、きょくに近づくほど寒くなる傾向があります。', 'hold': 0.35},
    {'say': '乾燥帯は雨の少なさにも注目して見分けましょう。',
     'cap': '乾燥帯は雨の少なさにも注目して見分けましょう。',
     'read': 'かんそうたいは雨の少なさにも注目して見分けましょう。', 'hold': 0.35}
] + original['steps'][5:]
assert all(s['say'] == s['cap'] for s in original['steps'])
(here / 'script.json').write_text(json.dumps(original, ensure_ascii=False, indent=2) + '\n')
module = runpy.run_path(str(generic / 'make.py'))
metadata = {'kind': 'VP', 'chip': '地理', 'title': '世界の気候と暮らし',
            'steps': [{'role': 'pt', 'text': s['say']} for s in original['steps']]}
relative = lambda p: os.path.relpath(p, here)
(here / 'scene.html').write_text('<!doctype html><meta charset="utf-8"><style>body{margin:0}canvas{display:block}</style><canvas width="1280" height="720"></canvas>\n'
    + '<script src="' + relative(engine) + '"></script><script>window.META=' + json.dumps(metadata, ensure_ascii=False) + ';</script>'
    + '<script src="' + relative(generic / 'template.js') + '"></script><script src="scene.js"></script>\n')
audio = here / 'audio'
audio.mkdir(exist_ok=True)
steps = []
clips = []
at = settings['head']
for i, s in enumerate(original['steps']):
    raw = audio / f'{i:02}.wav'
    # Pronunciation overrides are speech-only; visible captions keep the exact canonical say.
    reading = module['yomi_ja'](s.get('read') or s['say'], False)
    subprocess.run(['say', '-v', settings['voice'], '-r', str(settings['rate']), '-o', str(raw), '--data-format=LEI16@24000', reading], check=True, capture_output=True, timeout=45)
    filtered = audio / f'{i:02}-clear.wav'
    subprocess.run([str(binary), '-nostdin', '-v', 'error', '-y', '-i', str(raw), '-af', settings['filter'], '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(filtered)], check=True, capture_output=True)
    with wave.open(str(filtered)) as f:
        duration = f.getnframes() / f.getframerate()
    assert duration >= max(0.1, len(reading) * 0.025)
    end = at + duration + settings['gap'] + s.get('hold', 0.35)
    steps.append({'start': round(at, 3), 'speak': round(duration, 3), 'end': round(end, 3), 'say': s['say'], 'cap': s['cap'], 'yomi': reading})
    clips.append((filtered, at))
    at = end
steps[0]['start'] = 0
timeline = {'total': round(at + settings['tail'], 3), 'head': settings['head'], 'steps': steps, 'credit': ''}
(here / 'timeline.json').write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + '\n')
subprocess.run(['node', str(generic / 'render_fast.mjs'), str(here / 'scene.html'), str(here / 'timeline.json'), str(here / 'silent.mp4'), str(binary), '30', ''], check=True, capture_output=True, timeout=1200)
args = [str(binary), '-nostdin', '-v', 'error', '-y', '-i', str(here / 'silent.mp4')]
for clip, _ in clips:
    args += ['-i', str(clip)]
filters = ''.join(f'[{i+1}:a]adelay={round(start*1000)}|{round(start*1000)}[a{i}];' for i, (_, start) in enumerate(clips))
filters += ''.join(f'[a{i}]' for i in range(len(clips))) + f'amix=inputs={len(clips)}:normalize=0:duration=longest,apad=whole_dur={timeline["total"]}[out]'
args += ['-filter_complex', filters, '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-t', str(timeline['total']), '-movflags', '+faststart', str(here / 'candidate.mp4')]
subprocess.run(args, check=True, capture_output=True, timeout=300)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
result = {'status': 'candidate generated, not yet integrated/AV/visual approved', 'id': 'G-C2-S1-VP', 'settingsFile': str(settings_file.relative_to(root)),
          'settingsSha256': sha(settings_file), 'voice': settings['voice'], 'rate': settings['rate'], 'profile': settings['profile'], 'fps': 30,
          'duration': timeline['total'], 'steps': len(steps), 'inputs': {str(p.relative_to(root)): sha(p) for p in [source, engine, generic / 'template.js', generic / 'render_fast.mjs', here / 'scene.js', here / 'script.json', here / 'timeline.json']},
          'movieSha256': sha(here / 'candidate.mp4'), 'scope': 'One actual confirmed defective geography movie only. Original source/media untouched; all7 say/cap pairs identical. No source engine edits, external APIs, user data or service termination.'}
(here / 'generation-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Generated corrected geography candidate:', timeline['total'], 'seconds; original movie unchanged')
