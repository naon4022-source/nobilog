"""One AV pass per unchanged movie, binding all reviewed 1.5s scenes to video."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
from PIL import Image, ImageChops, ImageStat

H = Path(__file__).resolve().parent
R = H.parents[2]
W = R / '教材整理/Claude_Codex共有/数学全体制作'
M = W / 'メディア'
S = M / '制作ソース'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
ffmpeg = next((S / '制作ツール/imageio_ffmpeg/binaries').glob('ffmpeg-macos-*'))
inventory = load(H / 'inventory.json')
assert not (H / 'unchanged-av-result.json').exists(), 'inspect existing success instead of repeating'
results = []
for item in inventory['items']:
    if item['id'] == 'M1-APP2-V01':
        continue  # Its corrected candidate gets the same complete audit separately.
    ident = item['id']
    movie = R / item['file']
    assert sha(movie) == item['sha256'] == sha(R / item['copy'])
    assert sha(S / (ident + '.json')) == item['scriptSha256']
    assert sha(S / (ident + '.timeline.json')) == item['timelineSha256']
    assert sha(R / item['contactSheet']) == item['contactSheetSha256']
    out = H / 'original-av' / ident
    out.mkdir(parents=True, exist_ok=True)
    shots = out / 'actual-shots'
    shots.mkdir(exist_ok=True)
    command = [str(ffmpeg), '-hide_banner', '-nostdin', '-y', '-xerror', '-i', str(movie),
               '-map', '0:v:0', '-vf', "showinfo,select='not(mod(n,45))'", '-fps_mode', 'vfr',
               '-enc_time_base', '1:30', '-frame_pts', '1', str(shots / 'f%05d.png'),
               '-map', '0:a:0', '-af', 'ashowinfo,volumedetect', '-f', 'null', '-',
               '-progress', 'pipe:1', '-nostats']
    result = subprocess.run(command, capture_output=True, text=True)
    (out / 'full-av-decode.log').write_text(result.stderr + '\n' + result.stdout)
    assert result.returncode == 0 and 'progress=end' in result.stdout, ident + ': incomplete AV decode'
    log = result.stderr
    assert all(x in log for x in ['Video: h264', 'Audio: aac', '1280x720', '30 fps'])
    expected = round(item['seconds'] * 30)
    frames = [int(x) for x in re.findall(r'Parsed_showinfo_\d+[^\n]*\bn:\s*(\d+)\s', log)]
    assert frames == list(range(expected))
    audio = [x for x in log.splitlines() if 'Parsed_ashowinfo_' in x and 'nb_samples:' in x]
    rates = {int(re.search(r'\brate:(\d+)', x)[1]) for x in audio}
    assert len(rates) == 1
    seconds = sum(int(re.search(r'\bnb_samples:(\d+)', x)[1]) for x in audio) / next(iter(rates))
    assert abs(seconds - item['seconds']) < .2
    mean = float(re.search(r'mean_volume: ([\d.-]+) dB', log)[1])
    peak = float(re.search(r'max_volume: ([\d.-]+) dB', log)[1])
    assert -40 < mean < 0 and peak < 0
    pngs = sorted(shots.glob('f*.png'))
    assert [p.name for p in pngs] == ['f' + str(n).zfill(5) + '.png' for n in range(0, expected, 45)]
    assert len(pngs) == item['expectedSamples']
    proof = []
    with Image.open(R / item['contactSheet']) as sheet:
        assert sheet.size == (1536, 236 * ((len(pngs) + 3) // 4))
        for index, png in enumerate(pngs):
            reference = M / ('点検/' + ident + '_承認音声') / png.name
            with Image.open(reference) as old, Image.open(png) as actual:
                assert old.size == actual.size == (1280, 720)
                rms = max(ImageStat.Stat(ImageChops.difference(old.convert('RGB'), actual.convert('RGB'))).rms)
                tile = sheet.crop(((index % 4) * 384, (index // 4) * 236,
                                   (index % 4 + 1) * 384, (index // 4) * 236 + 216)).convert('RGB')
                sheet_rms = max(ImageStat.Stat(ImageChops.difference(old.convert('RGB').resize((384, 216)), tile)).rms)
                assert rms < 12 and sheet_rms < 12, (ident, png.name, rms, sheet_rms)
            proof.append({'frame': int(png.stem[1:]), 'maxChannelRMS': rms, 'reviewedSheetRMS': sheet_rms})
    results.append({'id': ident, 'sha256': item['sha256'], 'frames': expected, 'fps': 30,
                    'sampleFrames': len(pngs), 'audioSeconds': seconds, 'meanDB': mean, 'peakDB': peak,
                    'decode': 'all AV decoded with -xerror in one pass', 'videoFrameProof': proof,
                    'log': str((out / 'full-av-decode.log').relative_to(R)),
                    'logSha256': sha(out / 'full-av-decode.log')})
    print(ident + ': complete AV, 30fps, audio length and all reviewed scenes bound', flush=True)
(H / 'unchanged-av-result.json').write_text(json.dumps({'status': 'passed', 'results': results,
    'unchangedMovies': 5, 'newVideoGenerations': 0, 'audioGenerations': 0,
    'scope': 'five originals; corrected APP2 is audited separately'}, ensure_ascii=False, indent=2) + '\n')
