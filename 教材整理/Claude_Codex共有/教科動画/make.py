#!/usr/bin/env python3
"""5冊の教科書動画をつくる（Claude・2026-10-05）。
  python3 make.py 英語全体制作/制作ソース/E1-L1-S1-V01.json [...]   → <教科>全体制作/メディア/<ID>.mp4
  --check：動画は作らず、場面ごとの絵（点検用PNG）と「入りきらない」の警告だけを出す。
台本（制作ソース/<ID>.json）は build-textbook-subject.py が書くので、ここでは読むだけ。
読み上げは Kyoko（速め 205）。英語の本の英文だけ Samantha。承認済みの音声補正（音声共有/設定.json の filter）を使う。
共有の動画エンジン（engine.js・render.mjs）は読みこむだけで変更しない。"""
import json, re, sys, os, wave, subprocess, tempfile, pathlib
HERE = pathlib.Path(__file__).resolve().parent
SHARE = HERE.parent
ENGINE = SHARE / '数学全体制作/メディア/制作ソース/動画エンジン'
FFMPEG = os.environ.get('FFMPEG', str(SHARE / '数学全体制作/メディア/制作ソース/制作ツール/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'))
BASE = json.loads((SHARE / '数学全体制作/メディア/制作ソース/音声共有/設定.json').read_text(encoding='utf-8'))
JA_RATE, EN_RATE, GAP, HOLD, HEAD, TAIL = 205, 170, 0.28, 0.35, 0.6, 1.3
SUBJ = {'国語全体制作': '国語', '英語全体制作': '英語', '理科全体制作': '理科', '地理全体制作': '地理', '歴史全体制作': '歴史'}

def roles(steps, vp):
    out = []
    for k, s in enumerate(steps):
        t = s['say']
        if vp:
            r = 'title' if k == 0 else 'tip' if t.startswith('かんたんにやるコツ') else 'caution' if t.startswith('気をつけて') else 'end' if t.startswith('これでばっちり') else 'pt'
        else:
            r = 'intro' if k == 0 else 'problem' if t.startswith('問題はこれ') else 'answer' if t.startswith('答え') else 'point' if t.startswith('ポイントは') else 'step'
        out.append(r)
    return out

def display(t, r):
    t = t.replace('**', '')
    for pre in {'problem': ['問題はこれ。'], 'answer': ['答えは、', '答え：'], 'point': ['ポイントは、'], 'tip': ['かんたんにやるコツ。'], 'caution': ['気をつけて！'], 'title': ['1分でわかる、']}.get(r, []):
        if t.startswith(pre): t = t[len(pre):]
    if r == 'title': t = t.rstrip('。')
    return t.strip()

KANJI_NUM = dict(zip('〇一二三四五六七八九', '0123456789'))
WORDS = [('g/cm³', 'グラム毎立方センチメートル'), ('km/s', 'キロメートル毎秒'), ('m/s', 'メートル毎秒'), ('cm³', '立方センチメートル'),
         ('P波', 'ピーは'), ('S波', 'エスは'), ('5W1H', 'ごダブリューいちエイチ'), ('SDGs', 'エスディージーズ'), ('ASEAN', 'アセアン'),
         ('ICT', 'アイシーティー'), ('EU', 'イーユー'), ('Plus', 'プラス'), ('Minus', 'マイナス'), ('Interesting', 'インタレスティング'),
         ('au → ô', 'エーユーは、オー'), ('⻌', 'しんにょう'), ('□', 'しかく')]
# 読みまちがえやすい言葉は、ひらがなで読ませる（画面の文字はそのまま）。長い言葉から先に置きかえる
READ = [('五七五七七', 'ごしちごしちしち'), ('五七五', 'ごしちご'), ('歴史的仮名遣い', 'れきしてきかなづかい'), ('万葉仮名', 'まんようがな'),
        ('湯桶読み', 'ゆとうよみ'), ('重箱読み', 'じゅうばこよみ'), ('体言止め', 'たいげんどめ'), ('切れ字', 'きれじ'), ('季語', 'きご'),
        ('返り点', 'かえりてん'), ('レ点', 'れてん'), ('双括型', 'そうかつがた'), ('頭括型', 'とうかつがた'), ('尾括型', 'びかつがた'),
        ('奥付', 'おくづけ'), ('腐葉土', 'ふようど'), ('隠喩', 'いんゆ'), ('直喩', 'ちょくゆ'), ('係り結び', 'かかりむすび'),
        ('今は昔', 'いまはむかし'), ('一品', 'いっぴん'), ('一言', 'ひとこと'), ('画数', 'かくすう'), ('訓読', 'くんどく'), ('蜘蛛', 'くも')]
def yomi_ja(t, english_book):
    t = t.replace('**', '')
    for a, b in READ: t = t.replace(a, b)
    t = re.sub(r'[〇一二三四五六七八九]{4}(?=年)', lambda m: ''.join(KANJI_NUM[c] for c in m.group()), t)
    t = t.replace('〇', 'まる')
    if not english_book:
        for a, b in WORDS: t = t.replace(a, b)
        t = re.sub(r'(?<![A-Za-z])cm(?![A-Za-z])', 'センチメートル', t); t = re.sub(r'(?<![A-Za-z])km(?![A-Za-z])', 'キロメートル', t)
        t = re.sub(r'(?<=[0-9 ])m(?![A-Za-z])|(?<=・)m(?![A-Za-z])|(?<= )m(?= )', 'メートル', t); t = re.sub(r'(?<![A-Za-z])m(?= は| →)', 'メートル', t)
        t = re.sub(r'(?<=[0-9 ])g(?![A-Za-z])', 'グラム', t); t = re.sub(r'(?<=[0-9])N|(?<=単位は)N', 'ニュートン', t)
        t = re.sub(r'(?<![A-Za-z])A(?![A-Za-z])', 'エー', t); t = re.sub(r'(?<![A-Za-z])B(?![A-Za-z])', 'ビー', t)
    t = t.replace('℃', 'ど').replace('°', 'ど').replace('％', 'パーセント').replace('%', 'パーセント')
    t = re.sub(r'(?<=[0-9])\s*〜\s*(?=[0-9])', 'から', t).replace('〜', 'なになに')
    t = re.sub(r'なになに\s*[.?!]', 'なになに', t).replace('□', 'しかく')
    t = re.sub(r'\?(?![A-Za-z])', 'クエスチョンマーク', t) if english_book else t
    t = re.sub(r'!(?![A-Za-z])', 'びっくりマーク', t) if english_book else t
    t = re.sub(r'(?<=[\u3040-\u30ff\u4e00-\u9fff])\.', '', t)
    t = re.sub(r'(?<=[0-9A-Za-z³²度])\s*＝\s*(?=[0-9])', 'イコール', t).replace('＝', 'は')
    t = re.sub(r'(?<=[0-9])\s*[−－]\s*(?=[0-9])', 'ひく', t)
    t = re.sub(r'(?<=[0-9])\s*＋\s*(?=[0-9])', 'たす', t)
    t = t.replace('÷', 'わる').replace('×', 'かける')
    t = re.sub(r'[①-⑨]', lambda m: str(ord(m.group()) - 0x245F) + '、', t)
    for ch in '→／/：:…—＞＋−（）()「」『』＜':
        t = t.replace(ch, '、' if ch not in '（）()「」『』' else ' ')
    t = re.sub(r'[、\s]*、[、\s]*', '、', t).strip('、 ')
    return t

EN_RUN = re.compile(r"[A-Za-z][A-Za-z0-9'’]*(?:[ ,.!?]+[A-Za-z0-9'’]+)*[.!?]?")
def segments(say, english_book):
    """読み上げの区切り：[(声, 文), ...]。英語の本の英文は Samantha、それ以外は Kyoko"""
    if not english_book: return [('Kyoko', yomi_ja(say, False))]
    out, pos = [], 0
    for m in EN_RUN.finditer(say):
        if m.start() > pos: out.append(('Kyoko', yomi_ja(say[pos:m.start()], True)))
        out.append(('Samantha', m.group().replace('’', "'"))); pos = m.end()
    if pos < len(say): out.append(('Kyoko', yomi_ja(say[pos:], True)))
    return [(v, x) for v, x in out if re.search(r'[A-Za-z0-9ぁ-ゖァ-ヺー一-鿿]', x)]   # 「・」など記号だけの区切りは読まない

def tts(segs, work, k):
    frames = b''
    for j, (voice, txt) in enumerate(segs):
        a = work / f's{k:02d}_{j}.wav'
        subprocess.run(['say', '-v', voice, '-r', str(JA_RATE if voice == 'Kyoko' else EN_RATE), '-o', str(a), '--data-format=LEI16@24000', txt], check=True, timeout=25)
        with wave.open(str(a)) as f: fr = f.readframes(f.getnframes())
        if len(fr) < 2 * 24000 * max(0.04, 0.012 * len(txt)): raise RuntimeError(f'読み上げの音声が短すぎます：{voice} {txt}')   # 空の音声（読み上げの故障）だけを止める
        frames += fr + (b'\0\0' * int(24000 * 0.06) if j < len(segs) - 1 else b'')
    raw = work / f's{k:02d}.wav'
    with wave.open(str(raw), 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(24000); f.writeframes(frames)
    w = work / f's{k:02d}_補正.wav'
    subprocess.run([FFMPEG, '-nostdin', '-y', '-i', str(raw), '-af', BASE['filter'], '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(w)], check=True, capture_output=True)
    with wave.open(str(w)) as f: return w, f.getnframes() / f.getframerate()

def scene_html(sp, d, rs, vp):
    subj = SUBJ[sp.parent.parent.name]
    title = re.sub(r'^1分でわかる この節：', '', d['title'])
    meta = {'kind': 'VP' if vp else 'V', 'chip': subj if vp else subj + '・例題', 'title': title,
            'steps': [{'role': r, 'text': display(s['say'], r)} for s, r in zip(d['steps'], rs)]}
    h = HERE / '場面' / (sp.stem + '.html'); h.parent.mkdir(exist_ok=True)
    rel = os.path.relpath(ENGINE / 'engine.js', h.parent)
    h.write_text('<!doctype html><meta charset="utf-8"><style>body{margin:0}canvas{display:block}</style><canvas width="1280" height="720"></canvas>\n'
                 f'<script src="{rel}"></script><script>window.META={json.dumps(meta, ensure_ascii=False)};</script><script src="../template.js"></script>\n', encoding='utf-8')
    return h

def make(sp, check=False):
    sp = pathlib.Path(sp).resolve(); d = json.loads(sp.read_text(encoding='utf-8')); vp = sp.stem.endswith('-VP')
    english = sp.parent.parent.name == '英語全体制作'; rs = roles(d['steps'], vp)
    need = {'title', 'end'} if vp else {'intro', 'problem', 'answer', 'point'}
    if not need <= set(rs): raise RuntimeError(f'{sp.stem}: 台本の形がちがう {rs}')
    html = scene_html(sp, d, rs, vp)
    work = pathlib.Path(tempfile.mkdtemp(prefix='nobi-subj-'))
    if check:  # 点検：各ステップを1秒ずつにした時間割で、ステップの終わりの絵を撮る
        steps = [{'start': float(k), 'end': float(k + 1), 'say': s['say']} for k, s in enumerate(d['steps'])]
        tl = {'total': float(len(steps)), 'head': 0, 'steps': steps, 'credit': ''}
    else:
        t, steps, wavs = HEAD, [], []
        for k, s in enumerate(d['steps']):
            segs = segments(s.get('read') or s['say'], english); w, dur = tts(segs, work, k)   # read＝読み上げだけを変えたいとき（画面の字は say のまま）
            end = t + dur + GAP + HOLD
            steps.append({'start': round(t, 3), 'speak': round(dur, 3), 'end': round(end, 3), 'say': s['say'], 'yomi': ' / '.join(f'{v}:{x}' for v, x in segs)})
            wavs.append((w, t)); t = end
        steps[0]['start'] = 0.0
        tl = {'total': round(t + TAIL, 3), 'head': HEAD, 'steps': steps, 'credit': ''}
    (work / 'timeline.json').write_text(json.dumps(tl, ensure_ascii=False), encoding='utf-8')
    if check:
        r = subprocess.run(['node', str(HERE / 'check.mjs'), str(html), str(work / 'timeline.json'), str(HERE / '点検' / sp.stem)], capture_output=True, text=True)
        print(sp.stem, r.stdout.strip() or r.stderr[-400:]); return r.returncode == 0
    media = sp.parent.parent / 'メディア'; media.mkdir(exist_ok=True); out = media / (sp.stem + '.mp4')
    silent = work / 'video.mp4'
    subprocess.run(['node', str(HERE / 'render_fast.mjs'), str(html), str(work / 'timeline.json'), str(silent), FFMPEG, '30', ''], check=True, capture_output=True, stdin=subprocess.DEVNULL, timeout=1200)
    args = [FFMPEG, '-nostdin', '-y', '-i', str(silent)]
    for w, _ in wavs: args += ['-i', str(w)]
    flt = ''.join(f'[{k+1}:a]adelay={int(s*1000)}|{int(s*1000)}[a{k}];' for k, (_, s) in enumerate(wavs))
    flt += ''.join(f'[a{k}]' for k in range(len(wavs))) + f'amix=inputs={len(wavs)}:normalize=0:duration=longest,apad=whole_dur={tl["total"]}[aout]'
    args += ['-filter_complex', flt, '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-t', str(tl['total']), '-movflags', '+faststart', str(out)]
    subprocess.run(args, check=True, capture_output=True, stdin=subprocess.DEVNULL, timeout=300)
    (HERE / '時間割').mkdir(exist_ok=True); (HERE / '時間割' / (sp.stem + '.json')).write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding='utf-8')
    print('ok', sp.stem, tl['total'], 's', round(out.stat().st_size / 1e6, 2), 'MB'); return True

if __name__ == '__main__':
    check = '--check' in sys.argv
    ok = True
    for a in [x for x in sys.argv[1:] if not x.startswith('--')]:
        try: ok = make(a, check) and ok
        except Exception as e: print('NG', a, e); ok = False
    sys.exit(0 if ok else 1)
