"""ナレーションつきの教科書動画をつくる（Claude）。
使い方: python3 make_video.py 場面.html 台本.json 出力.mp4
台本.json = {"engine":"say"か"voicevox","voice":"Kyoko","rate":185,"speaker":3,"credit":"キャラ名（VOICEVOXの利用規約でクレジット表記が必要）","speed":1.0,"head":1.0,"tail":1.5,"gap":0.7,
             "steps":[{"say":"字幕の文","yomi":"読み上げ用のひらがな（省略時は say を読む）","cap":"字幕を変えるとき","hold":0.0}, ...]}
1文＝1ステップ。ステップの長さ＝読み上げの長さ＋gap＋hold。最初の head 秒と最後の tail 秒は止まった絵。"""
import json, subprocess, sys, wave, os, tempfile, pathlib
here = pathlib.Path(__file__).resolve().parent
FFMPEG = os.environ.get('FFMPEG', '/tmp/nobilog-media-tools/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1')
html, script_path, out = sys.argv[1:4]
shots = sys.argv[4] if len(sys.argv) > 4 else ''
sc = json.loads(pathlib.Path(script_path).read_text(encoding='utf-8'))
# 2026-10-04 追加：台本に "settings": "音声共有/設定.json"（台本ファイルからの相対パス）を書くと、
# その voice・rate・head・tail・gap・filter を既定値として使う（台本に同じ項目があれば台本が優先）。
if sc.get('settings'):
    base = json.loads((pathlib.Path(script_path).resolve().parent / sc['settings']).read_text(encoding='utf-8'))
    sc = {**{k: base[k] for k in ('engine', 'voice', 'rate', 'head', 'tail', 'gap', 'filter') if k in base}, **sc}
work = pathlib.Path(tempfile.mkdtemp(prefix='nobi-video-'))
t = sc.get('head', 1.0); steps = []; wavs = []
# 読み上げ：yomi（ひらがなの読み）があればそれを読む。字幕は say（漢字・数式）のまま。
# engine が "voicevox" なら、この Mac で動いている VOICEVOX（127.0.0.1:50021、外部通信なし）を使う。
import urllib.request, urllib.parse
def speak(textv, path, voice=None):
    if sc.get('engine') == 'voicevox':
        base = 'http://127.0.0.1:50021'; spk = str(sc.get('speaker', 3))
        q = urllib.request.urlopen(urllib.request.Request(base + '/audio_query?' + urllib.parse.urlencode({'text': textv, 'speaker': spk}), method='POST'), timeout=60).read()
        query = json.loads(q); query['speedScale'] = sc.get('speed', 1.0); query['outputSamplingRate'] = 24000; query['outputStereo'] = False
        query['prePhonemeLength'] = 0.1; query['postPhonemeLength'] = 0.1
        wav = urllib.request.urlopen(urllib.request.Request(base + '/synthesis?speaker=' + spk, data=json.dumps(query).encode(), headers={'Content-Type': 'application/json'}, method='POST'), timeout=120).read()
        path.write_bytes(wav)
    else:
        subprocess.run(['say', '-v', voice or sc.get('voice', 'Kyoko'), '-r', str(sc.get('rate', 185)), '-o', str(path), '--data-format=LEI16@24000', textv], check=True, timeout=60)
for k, st in enumerate(sc['steps']):
    w = work / f's{k:02d}.wav'
    speak(st.get('yomi', st['say']), w, st.get('voice'))   # 文ごとに声を変えるときは step に voice
    if sc.get('filter'):
        # 承認済みの音声補正（音声共有/設定.json の filter）を1文ずつかけ、補正後の長さで時間割を作る
        raw, w = w, work / f's{k:02d}_補正.wav'
        subprocess.run([FFMPEG, '-nostdin', '-y', '-i', str(raw), '-af', sc['filter'], '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(w)], check=True, capture_output=True)
        with wave.open(str(raw)) as f0, wave.open(str(w)) as f1:
            if abs(f0.getnframes() / f0.getframerate() - f1.getnframes() / f1.getframerate()) > 0.01: raise RuntimeError('補正の前後で音声の長さが変わった：' + st['say'])
    with wave.open(str(w)) as f: d = f.getnframes() / f.getframerate()
    # 読み上げが壊れて音が空のときは、無音の動画を作らずに止める（2026-10-04 に Mac の読み上げが止まった事故の対策）
    if d < 0.25 * max(1, len(st.get('yomi', st['say'])) / 8): raise RuntimeError(f'読み上げの音声が短すぎます（{d:.2f}秒）。Mac の読み上げが止まっていないか確かめてください：' + st['say'])
    end = t + d + sc.get('gap', 0.7) + st.get('hold', 0)
    steps.append({'start': round(t, 3), 'speak': round(d, 3), 'end': round(end, 3), 'say': st['say'], 'cap': st.get('cap', st['say'])})
    wavs.append((w, t)); t = end
# 最初のステップは0秒から（0〜head 秒は最初の絵のまま止まる）
total = round(t + sc.get('tail', 1.5), 3); steps[0]['start'] = 0.0
tl = {'total': total, 'head': sc.get('head', 1.0), 'steps': steps, 'credit': ('VOICEVOX:' + sc['credit']) if sc.get('engine') == 'voicevox' and sc.get('credit') else ''}
(work / 'timeline.json').write_text(json.dumps(tl, ensure_ascii=False), encoding='utf-8')
silent = work / 'video.mp4'
subprocess.run(['node', str(here / 'render.mjs'), html, str(work / 'timeline.json'), str(silent), FFMPEG, '30', shots], check=True)
args = [FFMPEG, '-y', '-i', str(silent)]
for w, _ in wavs: args += ['-i', str(w)]
flt = ''.join(f'[{k+1}:a]adelay={int(s*1000)}|{int(s*1000)}[a{k}];' for k, (_, s) in enumerate(wavs))
flt += ''.join(f'[a{k}]' for k in range(len(wavs))) + f'amix=inputs={len(wavs)}:normalize=0,apad[aout]'
args += ['-filter_complex', flt, '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-t', str(total), '-movflags', '+faststart', out]
subprocess.run(args, check=True, capture_output=True)
pathlib.Path(html).with_suffix('.timeline.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding='utf-8')
print('ok', out, 'seconds', total, 'steps', len(steps))
