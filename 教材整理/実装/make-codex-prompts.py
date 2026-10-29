"""Codexへ送る「1件ずつの依頼プロンプト」を作る（Claude原稿の 本の追加.json・図の仕様.json・画像選定.md と、組んだページ番号から）。
出力：教材整理/Claude_Codex共有/数学全体制作/Codexへ_1件ずつの依頼プロンプト.md"""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '教材整理/Claude_Codex共有/数学全体制作'
DRAFT = WORK / 'Claude原稿'
placed = json.loads((WORK / 'メディアの置き場所.json').read_text(encoding='utf-8')) if (WORK / 'メディアの置き場所.json').exists() else {'media': {}}
book = json.loads((ROOT / 'site-assets/textbook-book-math1.json').read_text(encoding='utf-8'))

STYLE = ('明るく親しみやすい教科書の挿絵。やわらかい水彩とフラットな塗りの中間、輪郭は細め、色は青・緑・オレンジを基調に彩度ひかえめ。'
         '人物は日本の公立中学校の1年生（制服）、表情は自然で楽しそう。背景はすっきり。16:9、1600×900。'
         '画像の中に文字・数字・記号・ロゴ・値札を入れない。教科書やワークの挿絵をまねしない。')

def seconds(length):
    m = re.search(r'(\d+)', length or '')
    return int(m.group(1)) if m else 30

def storyboard(content, length, hide):
    # 2026-10-04 ユーザー指摘「カクカクで分からない」を受けて、秒数で区切る絵コンテをやめ、
    # 「ナレーション1文＝1ステップ」の台本にする（長さはナレーションで決まる）
    parts = [x.strip(' 。') for x in re.split(r'。', content) if x.strip(' 。')]
    secret = hide if hide and hide != '—' else ''
    lines = ['  - ステップ1（問いかけ）：題「{title}」で何を確かめるのかを、問いかけの1文で言う。画面には、これから使うものをすべて並べる']
    for i, p in enumerate(parts, 2):
        lines.append(f'  - ステップ{i}：動き「{p}」。ナレーションは、この動きで何が分かるかを「なぜ」もふくめて1〜2文で。動くものは1つずつ。1文で言い切れない動きは、さらに細かいステップに分けてよい')
    lines.append(f'  - ステップ{len(parts) + 2}（まとめ）：いちばん大事なきまりを1文で言い、画面に大きく残す' + (f'。ただし「{secret}」は言わない・見せない' if secret else ''))
    return lines

def where(mid, pid):
    pos = placed.get('media', {}).get(mid)
    if pos: return pos['spread'] + f'（p.{pos["page"]}）'
    return {'POINTS': '節の「ポイント」のページ', 'QUESTIONS': '章の「まとめの問題」の最初のページ', 'QUESTIONS-MID': '章の「まとめの問題」のとちゅう'}.get(pid, '原稿 ' + pid)

out = ['# Codexへ：教科書（数学1）の画像・動画　1件ずつの依頼プロンプト', '',
       '作ったファイルは `教材整理/Claude_Codex共有/数学全体制作/メディア/<ID>.<拡張子>` に保存し、`python3 教材整理/実装/build-textbook-book.py` を実行する。',
       '1件ごとのブロックを、そのまま画像生成・動画制作の指示として使ってよい。数式・数値は書いてあるとおりにし、生成AIの絵の中には数式を描かせない（数式は SVG や字幕で重ねる）。', '',
       '## 全件に共通の決まり',
       '- 動画：必ず `メディア/制作ソース/動画エンジン/` で作る（`make_video.py 場面.html 台本.json 出力.mp4`）。30コマ/秒・ナレーション（Kyoko）と同じ文の字幕・最初の1秒と最後の2秒は止まった絵・1本4MB以内。見本は Claude の `制作ソース/M1-C6-S2-V01.html` と `.json`。',
       '- 動画のわかりやすさの基準（全部守る）：①1文＝1ステップで、そのステップでは1つだけ動かす ②ナレーションで「何をしているか」と「なぜそうなるか」を言う ③主役の数・図は大きく（数式48px以上、どの文字も32px以上）、画面の中央に ④動いている所・大事な所はオレンジの印（丸・矢印）で示す ⑤ステップの終わりに少し止めて考える間をとる ⑥最後は「まとめ」で、いちばん大事なきまりを大きく残す ⑦ものが画面からはみ出さない・重ならない・字幕に隠れない。',
       '- 動画の点検：書き出したら1.5秒ごとのコマを並べた一覧画像を作って、全部のコマを目で確かめる（はみ出し・重なり・動きの順番・字幕と絵の一致・かくすものが出ていないか）。',
       '- 図解：svg・横長16:9（1600×900 相当）・文字は大きく（画面幅の 1/40 以上）・マイナスは「−」。色だけで区別せず、線の種類・模様・記号でも区別（白黒印刷で分かる）。',
       '- 場面の絵：jpg・1600×900。下の「絵のスタイル」に合わせる。',
       '- キャラクター「のびー」：🌱 の芽の子。丸い顔、頭にふたばの葉、緑系。問いかける役で、出すかどうかは任意。',
       f'- 絵のスタイル：{STYLE}', '']

count = {'video': 0, 'diagram': 0, 'scene': 0}
for f in sorted(DRAFT.glob('M1-*/本の追加.json')):
    data = json.loads(f.read_text(encoding='utf-8'))
    items = data.get('media', [])
    if not items: continue
    out += ['## ' + data.get('unitId', f.parent.name), '']
    for m in items:
        kind = m['kind']; count[kind] = count.get(kind, 0) + 1
        head = f"### {m['id']}｜" + {'video': '動画', 'scene': '場面の絵'}.get(kind, '図解') + f"｜{where(m['id'], m['pid'])}"
        out += [head, f"- 題：{m['title']}", f"- ねらい：{m.get('purpose', '')}"]
        if kind == 'video':
            out += ['- 形式：mp4・1280×720・30コマ/秒・ナレーション（音声）と同じ文の字幕つき・長さはナレーションに合わせる（目安40〜75秒）', '- 台本（1文＝1ステップ。動画エンジンの 台本.json の steps にそのまま書く）：'] + [x.replace('{title}', m['title']) for x in storyboard(m['content'], m.get('length'), m.get('hide'))]
            out += [f"- 内容の全体：{m['content']}"]
        elif kind == 'scene':
            out += ['- 画像生成プロンプト：', '```', f"{m['content']} {STYLE}", '```']
        else:
            out += ['- 形式：svg・16:9', f"- 構図と中身：{m['content']}", '- 仕上げ：要素は大きく、余白を広めに。強調したい所だけ太線または色＋記号。']
        out += [f"- かくすもの（画像・動画に出さない）：{m.get('hide', '—')}", f"- 保存するファイル：メディア/{m['id']}." + ('mp4' if kind == 'video' else 'jpg' if kind == 'scene' else 'svg'), '']

# 原稿の中の、まだ作られていない図・絵（図の仕様.json と 画像選定.md の条件）
out += ['## 原稿の中にある、まだ作られていない図・絵', '']
pending = []
for p in book['pages']:
    for b in p.get('blocks', []):
        if b.get('t') == 'fig' and not b.get('src'): pending.append((p.get('pid'), b))
specs = {}
for f in DRAFT.glob('M1-*/図の仕様.json'):
    for fig in json.loads(f.read_text(encoding='utf-8')).get('figures', []): specs[fig['slotId']] = fig
for f in sorted(DRAFT.glob('M1-*/本文.md')):
    unit = f.parent.name; text = f.read_text(encoding='utf-8')
    for m in re.finditer(r'［(図|絵)\s*([A-Za-z0-9-]+)[^：］]*(?:：(.+?))?］', text):
        slot = m.group(2)
        if not any(b.get('caption', '') and (m.group(3) or '').startswith(b['caption'][:8]) for _, b in pending): continue
        out.append(f'### {slot}｜' + ('場面の絵' if m.group(1) == '絵' else '図') + f'｜原稿 {unit}')
        if slot in specs:
            s = specs[slot]
            out += [f"- ねらい：{s.get('purpose', '')}", f"- 数学の中身：{s.get('confirmedConcept', '')}", f"- ラベル：{'、'.join(s.get('labels', []))}",
                    f"- 配置：{' / '.join(s.get('coordinates', []))}", f"- 数値の条件：{' / '.join(s.get('numericConditions', []))}",
                    f"- 4案で変えてはいけないこと：{' / '.join(s.get('mustRemainIdenticalAcrossCandidates', []))}", f"- 読み上げ用の説明：{s.get('altText', '')}",
                    f"- 保存するファイル：図候補/{slot}/{slot}-A.svg 〜 -D.svg（4案。Claudeが選ぶ）"]
        else:
            sel = (DRAFT / unit / '画像選定.md')
            block = ''
            if sel.exists():
                t = sel.read_text(encoding='utf-8'); i = t.find(slot)
                if i >= 0: block = t[i:t.find('\n### ', i + 1) if t.find('\n### ', i + 1) > 0 else len(t)]
            out += ['- 画像生成プロンプト：', '```', (re.sub(r'\s+', ' ', block)[:600] or (m.group(3) or '')) + ' ' + STYLE, '```',
                    f"- 保存するファイル：画像候補/{slot}-A.jpg 〜 -D.jpg（4案。Claudeが選ぶ）"]
        out.append('')
(WORK / 'Codexへ_1件ずつの依頼プロンプト.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print('prompts:', count, 'pending figures:', len(pending))
