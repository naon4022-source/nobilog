#!/usr/bin/env python3
"""教科書の本文・あらすじ・会話（しくみの会話・例題の会話）を読み上げる音声と「どの文字を何秒に読むか」の表をつくる（Claude・2026-10-06）。
  python3 make_yomi.py kokugo1 [K1-C5-S5 ...]   → <教科>全体制作/メディア/YOMI-<節>.mp3 と .json
声：Kyoko・速さ175・承認済みの補正（音声共有/設定.json）。読点・句点ごとに区切って読み、区切りごとの時間を記録する。
教科書の画面（site-assets/textbook-book.js）は、この表と再生中の時間から、いま読んでいる文字の位置を計算して線をなめらかに伸ばす。
ルビ（漢字《よみ》）はよみで読む。英語の本の英文は Samantha（make.py と同じ分け方）。古文などの発音は 原稿/読み方.py の READ で声だけを直す（句読点の並びは同じ）。"""
import json, re, sys, wave, subprocess, tempfile, pathlib, runpy, time, importlib.util, hashlib
HERE = pathlib.Path(__file__).resolve().parent; SHARE = HERE.parent; ROOT = SHARE.parents[1]
sp = importlib.util.spec_from_file_location('mk', SHARE / '教科動画' / 'make.py'); MK = importlib.util.module_from_spec(sp)
_argv = sys.argv; sys.argv = ['make.py']; sp.loader.exec_module(MK); sys.argv = _argv
SET = json.loads((SHARE / '数学全体制作/メディア/制作ソース/音声共有/設定.json').read_text(encoding='utf-8'))
RATE = SET['rate']; SR = 24000
DIRS = {'kokugo1': '国語全体制作', 'english1': '英語全体制作', 'science1': '理科全体制作', 'geography': '地理全体制作', 'history': '歴史全体制作'}
RUBY = re.compile(r'(?:｜([^｜《》]+)|([㐀-鿿々〆ヵヶ]+))《([^》]+)》')
def plain(s): return re.sub(r'\*\*([^*]+)\*\*|`([^`]+)`', lambda m: m.group(1) or m.group(2), s)   # 太字・記号の印（画面には出ない）
def base(s): return RUBY.sub(lambda m: m.group(1) or m.group(2), plain(s))   # 画面に出る字（ルビの読みを除く）
def spoken(s): return RUBY.sub(lambda m: m.group(3), plain(s))                # 声に出す字（ルビは読み）
def pieces(s): return [p for p in re.split(r'(?<=[、。！？])(?![」』])|(?<=[」』])', s) if p]
def pause(seg): return .4 if re.search(r'[。！？」』]$', seg) else (.14 if seg.endswith('、') else .08)

def say(text, path, voice='Kyoko'):
    cmd = ['say', '-v', voice, '-r', str(RATE if voice == 'Kyoko' else MK.EN_RATE), '-o', str(path), f'--data-format=LEI16@{SR}', text]
    try: subprocess.run(cmd, check=True, timeout=25)
    except subprocess.TimeoutExpired:   # 読み上げの部品が固まったら立ち上げ直して1回だけやり直す
        for n in ('KonaSynthesizer', 'SiriAUSP', 'MauiAUSP'): subprocess.run(['pkill', '-f', n], capture_output=True)
        time.sleep(3); subprocess.run(cmd, check=True, timeout=60)
    with wave.open(str(path)) as f: return f.readframes(f.getnframes())

def voice_text(s, english=False):
    """声に出す区切り [(声, 文), ...]"""
    s = s.replace('＝（イコール）', 'イコール').replace('【訳】', 'やく。').replace('（', '、').replace('）', '、')
    if english: return [(v, x) for v, x in MK.segments(s, True)]
    t = MK.yomi_ja(s, False)
    return [('Kyoko', t)] if re.search(r'[ぁ-んァ-ヶ一-龠A-Za-z0-9]', t) else []

def blocks(book):
    d = json.loads((ROOT / 'site-assets' / f'textbook-book-{book}.json').read_text(encoding='utf-8'))
    out = []
    for p in d['pages']:
        for b in p.get('blocks', []):
            if b.get('rid'): out.append((b['rid'], b['x']))
            if b.get('t') == 'talk':   # 会話は1行ずつ（名前は読まず、せりふだけ）
                for rid, line in zip(b.get('rids') or [], b.get('lines') or []): out.append((rid, line[2]))
                continue
            for rid, x in zip(b.get('rids') or [], b.get('items') or []): out.append((rid, x['x'] if isinstance(x, dict) else x))
    return out

def sig(items, READ):   # 読む文（と読み方の指定）が同じなら、作り直さなくてよい
    return hashlib.sha256(json.dumps([[r, x, READ.get(x)] for r, x in items], ensure_ascii=False).encode()).hexdigest()[:16]

def make(book, code, items, READ):
    media = SHARE / DIRS[book] / 'メディア'; work = pathlib.Path(tempfile.mkdtemp(prefix='nobi-yomi-'))
    frames = b'\0\0' * int(SR * .3); t = .3; table = {}
    for rid, src in items:
        over = READ.get(src)
        sp_src, sp_over = pieces(src), (pieces(over) if over else None)
        if sp_over and len(sp_over) != len(sp_src): sp_src, sp_over = [src], [over]   # 区切りが合わないときは段落まるごと
        segs, pos, t0 = [], 0, t
        for k, seg in enumerate(sp_src):
            n = len(base(seg)); parts = voice_text(sp_over[k] if sp_over else spoken(seg), book == 'english1')
            a = t
            for j, (voice, txt) in enumerate(parts):
                fr = say(txt, work / f'{rid}_{k}_{j}.wav', voice); frames += fr; t += len(fr) / 2 / SR
                if j < len(parts) - 1: frames += b'\0\0' * int(SR * .06); t += .06
            segs.append([pos, pos + n, round(a, 3), round(t, 3)]); pos += n
            gap = pause(seg); frames += b'\0\0' * int(SR * gap); t += gap
        frames += b'\0\0' * int(SR * .35); t += .35
        table[rid] = {'t0': round(t0, 3), 't1': round(segs[-1][3], 3), 'n': pos, 'segs': segs}
    raw = work / 'raw.wav'
    with wave.open(str(raw), 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(frames)
    m4a = media / f'YOMI-{code}.mp3'   # MP3：どのブラウザでも再生できる（AACの.m4aは再生できないブラウザがあった・2026-10-07）
    subprocess.run([MK.FFMPEG, '-nostdin', '-y', '-i', str(raw), '-af', SET['filter'], '-ar', str(SR), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', str(m4a)],
                   check=True, capture_output=True, stdin=subprocess.DEVNULL, timeout=600)
    (media / f'YOMI-{code}.json').write_text(json.dumps({'audio': f'/textbook-yomi-{code.lower()}.mp3', 'duration': round(t, 3), 'sig': sig(items, READ), 'blocks': table}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    return t

if __name__ == '__main__':
    book, only = sys.argv[1], set(sys.argv[2:])
    rp = SHARE / DIRS[book] / '原稿' / '読み方.py'; READ = runpy.run_path(str(rp))['READ'] if rp.exists() else {}
    groups = {}
    for rid, x in blocks(book): groups.setdefault(rid.rsplit('-', 1)[0], []).append((rid, x))
    for code, items in groups.items():
        if only and code not in only: continue
        old = SHARE / DIRS[book] / 'メディア' / f'YOMI-{code}.json'
        if not only and old.exists() and json.loads(old.read_text(encoding='utf-8')).get('sig') == sig(items, READ) and old.with_suffix('.mp3').exists():
            print('same', code, flush=True); continue
        try: print('ok', code, len(items), round(make(book, code, items, READ), 1), 's', flush=True)
        except Exception as e: print('NG', code, str(e)[:200], flush=True)
