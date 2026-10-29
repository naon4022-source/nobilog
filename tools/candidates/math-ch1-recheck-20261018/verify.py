"""既存動画を変更せず再復号する。元の目視記録・点検画像を上書きしない。"""
from pathlib import Path
from datetime import datetime, timezone, timedelta
import hashlib
import json
import re
import subprocess
import tempfile

root = Path(__file__).resolve().parents[3]
source = root / '教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
media = source.parent
assets = root / 'site-assets'
ffmpeg = next((source / '制作ツール/imageio_ffmpeg/binaries').glob('ffmpeg-macos-*'))
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
def source_file(name):
    path = (source / name).resolve()
    assert path.is_relative_to(source) and not any(part.startswith('.') for part in path.relative_to(source).parts)
    return path
settings = load(source / '音声共有/設定.json')
assert (settings['engine'], settings['voice'], settings['rate'], settings['profile']) == ('say', 'Kyoko', 175, 'clear')
items = [x for x in load(source / '69本_制作進捗.json')['items'] if x['id'].startswith('M1-C1-')]
assert len(items) == 21
book = load(assets / 'textbook-book-math1.json')
results = []
destination = media / '点検/20261018_章別再点検/M1-C1_再復号.json'
destination.parent.mkdir(parents=True, exist_ok=True)
comparison_dir = Path(tempfile.mkdtemp(prefix='nobi-math-ch1-frames-20261018-'))

def decode(video, audio_only=False):
    command = [str(ffmpeg), '-hide_banner', '-nostdin', '-xerror', '-i', str(video)]
    command += ['-map', '0:a:0', '-vn'] if audio_only else ['-map', '0:v:0', '-map', '0:a:0', '-af', 'volumedetect']
    command += ['-progress', 'pipe:1', '-nostats', '-f', 'null', '-']
    run = subprocess.run(command, capture_output=True, text=True)
    assert run.returncode == 0, video.name + ': ' + run.stderr[-800:]
    progress = dict(line.split('=', 1) for line in run.stdout.splitlines() if '=' in line)
    assert progress.get('progress') == 'end', video.name + ': incomplete decode'
    return run.stderr, progress

def compare_reviewed_frames(video, shots, ident, expected):
    stats = comparison_dir / (ident + '.psnr')
    filters = "[0:v]select='not(mod(n,45))',settb=1/30,format=gbrp[actual];[1:v]settb=1/30,format=gbrp[review];[actual][review]psnr=stats_file=" + str(stats) + ':shortest=1'
    run = subprocess.run([str(ffmpeg), '-hide_banner', '-nostdin', '-xerror', '-i', str(video), '-framerate', '2/3', '-pattern_type', 'glob', '-i', str(shots / 'f*.png'), '-lavfi', filters, '-an', '-fps_mode', 'vfr', '-f', 'null', '-'], capture_output=True, text=True)
    assert run.returncode == 0, ident + ': ' + run.stderr[-800:]
    lines = stats.read_text().splitlines()
    assert len(lines) == expected, (ident, len(lines), expected)
    errors = [float(value) for line in lines for value in re.findall(r'mse_[rgb]:([\d.]+)', line)]
    assert len(errors) == expected * 3 and max(errors) < 144, ident + ': reviewed frames differ from video'
    return {'frames': expected, 'maxChannelRMS': max(errors) ** .5, 'stats': str(stats)}

try:
    for item in items:
        ident = item['id']
        video = media / (ident + '.mp4')
        assert sha(video) == item['sha256'], ident + ': ledger SHA'
        for ext, expected in item['sourceSha256'].items():
            assert sha(source_file(ident + '.' + ext)) == expected, ident + ': source SHA'
        for name, expected in item.get('dependencySha256', {}).items():
            assert sha(source_file(name)) == expected, ident + ': dependency SHA'
        script = load(source / (ident + '.json'))
        timeline = load(source / (ident + '.timeline.json'))
        assert script['settings'] == '音声共有/設定.json'
        assert len(script['steps']) == len(timeline['steps'])
        assert script.get('voice', 'Kyoko') == 'Kyoko' and script.get('rate', 175) == 175
        for step, timing in zip(script['steps'], timeline['steps']):
            assert timing['say'] == timing['cap'] == step.get('cap', step['say']) == step['say']
            assert step.get('voice', 'Kyoko') == 'Kyoko'
            assert timing['speak'] > .2 and timing['end'] - timing['start'] >= timing['speak']
        expected_src = '/textbook-book-math1-' + ident.lower() + '.mp4'
        blocks = [b for p in book['pages'] for b in p.get('blocks', []) if b.get('id') == ident]
        assert len(blocks) == 1 and blocks[0]['kind'] == 'video' and blocks[0]['src'] == expected_src
        assert sha(assets / expected_src[1:]) == item['sha256'], ident + ': book copy SHA'
        shots = Path(item['shots']).resolve()
        assert shots.is_relative_to(root)
        audit = load(shots / '実動画の点検.json')
        assert audit['sha256'] == item['sha256']
        assert audit['visualReview']['result'] == '全場面を目視確認済み'
        frames = sorted(p.name for p in shots.glob('f*.png'))
        frame_count = round(timeline['total'] * 30)
        assert frames == ['f' + str(n).zfill(5) + '.png' for n in range(0, frame_count, 45)]
        sheets = []
        for name in audit['contactSheets']:
            path = Path(name).resolve()
            assert path.is_relative_to(root) and path.is_file()
            sheets.append({'path': str(path.relative_to(root)), 'sha256': sha(path)})
        log, progress = decode(video)
        assert all(value in log for value in ['Video: h264', 'Audio: aac', '1280x720', '30 fps'])
        header = log.split('Stream mapping:')[0]
        assert len(re.findall(r'Stream #0:\d+[^\n]*Video:', header)) == 1
        assert len(re.findall(r'Stream #0:\d+[^\n]*Audio:', header)) == 1
        assert abs(int(progress['frame']) - frame_count) <= 1
        mean = float(re.search(r'mean_volume: ([\d.-]+) dB', log)[1])
        peak = float(re.search(r'max_volume: ([\d.-]+) dB', log)[1])
        assert -40 < mean < 0 and peak < 0
        _, audio_progress = decode(video, audio_only=True)
        audio_seconds = int(audio_progress['out_time_us']) / 1000000
        assert abs(audio_seconds - timeline['total']) < .2, (ident, audio_seconds, timeline['total'])
        comparison = compare_reviewed_frames(video, shots, ident, len(frames))
        results.append({'id': ident, 'sha256': item['sha256'], 'decode': 'all video/audio decoded with -xerror', 'frames': int(progress['frame']), 'fps': 30, 'seconds': timeline['total'], 'audioSeconds': audio_seconds, 'meanDB': mean, 'peakDB': peak, 'captions': 'all steps equal script', 'sampleFrames': len(frames), 'allReviewedFramesMatchVideo': comparison, 'contactSheets': sheets, 'bookCopyAndReference': 'SHA matched', 'previousVisualReview': audit['visualReview']})
        print(ident + ': AV復号・音声長さ・字幕・30fps・本内参照SHA成功', flush=True)
except Exception as error:
    destination.write_text(json.dumps({'date': datetime.now(timezone(timedelta(hours=9))).isoformat(), 'status': 'failed', 'id': ident, 'error': str(error), 'results': results}, ensure_ascii=False, indent=2) + '\n')
    raise
destination.write_text(json.dumps({'date': datetime.now(timezone(timedelta(hours=9))).isoformat(), 'status': 'passed', 'scope': 'Technical re-decode; existing visual review retained. No new listening review, source generation or book playback in this command.', 'voiceSettings': settings, 'results': results}, ensure_ascii=False, indent=2) + '\n')
print('数学1章21本の再復号成功。元の点検・採用・制作進捗は未変更。', flush=True)
