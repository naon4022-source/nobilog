"""Prepare only the nine referenced unfinished movies' speech, with strict reusable clip receipts."""
from pathlib import Path
import audioop
import hashlib
import json
import runpy
import subprocess
import wave

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PRIOR = HERE.parent / 'kokugo-intonation-20261027'
LIB = runpy.run_path(str(PRIOR / 'build-videos-v3.py'), run_name='remaining_audio_library')
GENERIC = runpy.run_path(str(LIB['GENERIC'] / 'make.py'), run_name='speech_reading_library')
SETTINGS = json.loads(LIB['SETTINGS_FILE'].read_text())
assert (SETTINGS['voice'], SETTINGS['rate'], SETTINGS['profile']) == ('Kyoko', 175, 'clear')
NATIVE = PRIOR / 'narration-v3/native-speech.js'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
settings_sha, native_sha = sha(LIB['SETTINGS_FILE']), sha(NATIVE)
manifest = json.loads((HERE / 'manifest.json').read_text())
clarity = {row['file']: row for row in json.loads((HERE / 'narration-clarity-v2/manifest.json').read_text())['files']}
ids = set(json.loads((HERE / 'source-preservation-result.json').read_text())['currentlyReferencedVideos']) - {'K1-C2-S5-VP'}
assert len(ids) == 9 and 'E1-L2-S3-VP' not in ids
all_results = []


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


for original in manifest['scripts']:
    ident = Path(original['file']).stem
    if ident not in ids:
        continue
    successor = clarity.get(original['file'])
    source = HERE / ('narration-clarity-v2/output' if successor else 'output') / original['file']
    source_sha = successor['afterSha256'] if successor else original['afterSha256']
    assert sha(source) == source_sha and sha(ROOT / original['file']) == original['beforeSha256']
    data = json.loads(source.read_text())
    assert all(s['say'] == s['cap'] and not s.get('read') for s in data['steps'])
    directory = HERE / 'audio-candidates' / ident
    directory.mkdir(parents=True, exist_ok=True)
    audio = directory / 'audio'
    audio.mkdir(exist_ok=True)
    marker = directory / 'input.json'
    expected = dict(sourceSha256=source_sha, settingsSha256=settings_sha, nativeHelperSha256=native_sha,
                    yomiModuleSha256=sha(LIB['GENERIC'] / 'make.py'), voice='Kyoko', rate=175)
    if marker.exists():
        assert json.loads(marker.read_text()) == expected, 'Do not reuse clips with changed inputs'
    else:
        write(marker, expected)
    if (directory / 'prepared.json').exists():
        completed = json.loads((directory / 'prepared.json').read_text())
        assert completed['inputs'] == expected
        for clip in completed['clips']:
            for item in clip['outputs']:
                assert sha(directory / item['file']) == item['sha256']
        all_results.append(completed)
        print(ident, 'existing exact speech candidate reused', flush=True)
        continue
    timeline, clips, at = [], [], SETTINGS['head']
    for scene, step in enumerate(data['steps']):
        parts = LIB['chunks'](step['say'])
        assert ''.join(parts) == step['say']
        scene_start, first = (0 if scene == 0 else at), len(timeline)
        for part_index, part in enumerate(parts):
            assert len(part) <= 54
            reading = GENERIC['yomi_ja'](part, False)
            stem = f'{scene:02}-{part_index:02}'
            aiff, raw, clear = [audio / (stem + suffix) for suffix in ('.aiff', '.wav', '-clear.wav')]
            receipt = audio / (stem + '-result.json')
            if receipt.exists():
                clip = json.loads(receipt.read_text())
                assert clip['say'] == clip['cap'] == part and clip['yomi'] == reading and clip['inputs'] == expected
                for item in clip['outputs']:
                    assert sha(directory / item['file']) == item['sha256']
            else:
                assert not any(p.exists() for p in [aiff, raw, clear]), 'Partial failed synthesis retained; investigate before retry'
                native = subprocess.run(['/usr/bin/osascript', '-l', 'JavaScript', str(NATIVE), str(aiff), reading], capture_output=True, text=True, timeout=210)
                (audio / (stem + '-native.log')).write_text(native.stdout + native.stderr)
                native.check_returncode()
                voice = json.loads(native.stdout)
                assert voice['voice'] == 'com.apple.voice.compact.ja-JP.Kyoko' and voice['rate'] == 175
                for start, finish, filters in [(aiff, raw, []), (raw, clear, ['-af', SETTINGS['filter']])]:
                    subprocess.run([str(LIB['FFMPEG']), '-nostdin', '-v', 'error', '-i', str(start), *filters, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(finish)], check=True, capture_output=True, timeout=60)
                with wave.open(str(clear)) as stream:
                    assert (stream.getframerate(), stream.getnchannels(), stream.getsampwidth()) == (24000, 1, 2)
                    pcm = stream.readframes(stream.getnframes())
                seconds = len(pcm) / 48000
                assert seconds >= max(.1, len(reading) * .025) and audioop.rms(pcm, 2) > 5
                clip = dict(status='valid speech clip; listening not claimed', say=part, cap=part, yomi=reading,
                            seconds=seconds, rms=audioop.rms(pcm, 2), inputs=expected,
                            outputs=[dict(file=p.relative_to(directory).as_posix(), sha256=sha(p)) for p in [aiff, raw, clear]])
                write(receipt, clip)
            duration = clip['seconds']
            gap = SETTINGS['gap'] + step.get('hold', .35) if part_index == len(parts) - 1 else .06
            end = at + duration + gap
            timeline.append(dict(start=round(at, 3), speak=round(duration, 3), end=round(end, 3), say=part, cap=part,
                                 yomi=reading, sceneIndex=scene, sceneStart=round(scene_start, 3)))
            clips.append(clip)
            at = end
            print(ident, stem, 'speech validated', round(duration, 3), 'seconds', flush=True)
        for chunk in timeline[first:]:
            chunk['sceneEnd'] = round(at, 3)
    timeline[0]['start'] = 0
    total = round(at + SETTINGS['tail'], 3)
    write(directory / 'script.json', data)
    write(directory / 'timeline.json', dict(total=total, head=SETTINGS['head'], steps=timeline, credit=''))
    result = dict(status='speech prepared; movie/scene/AV/visual/book approval pending', id=ident, inputs=expected,
                  seconds=total, logicalScenes=len(data['steps']), captionChunks=len(timeline), clips=clips,
                  roles=GENERIC['roles'](data['steps'], ident.endswith('-VP')))
    write(directory / 'prepared.json', result)
    all_results.append(result)
    print(ident, 'all speech prepared;', total, 'seconds', flush=True)

assert {r['id'] for r in all_results} == ids
assert sha(LIB['SETTINGS_FILE']) == settings_sha and sha(NATIVE) == native_sha
write(HERE / 'audio-candidates/result.json', dict(status='nine speech candidates prepared; movies not produced',
      items=[dict(id=r['id'], seconds=r['seconds'], logicalScenes=r['logicalScenes'], captionChunks=r['captionChunks']) for r in all_results],
      scope='Native local Kyoko175 and unchanged approved filter. Complete clip receipts reused, no duplicate successful synthesis. No main/voice setting/service change, API/provider/user audio or video placeholders.'))
print('Nine referenced speech candidates complete; no movie completion claim', flush=True)
