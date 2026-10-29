#!/usr/bin/env python3
# 国語・英語・理科・社会（地理・歴史）の教科書データを作る（Claude作・2026-10-04）。
#   python3 教材整理/実装/build-textbook-subject.py kokugo1   （english1 / science1 / geography / history / all）
#   --check を付けると、原稿と本データが一致するかだけを確かめる。
# 原稿：教材整理/Claude_Codex共有/<教科>全体制作/原稿/u01.py … （1単元＝1ファイル、UNIT 辞書）
# 画像（絵・図解）は ChatGPT Images、動画は Claude が作る。いまは「準備中」の枠だけを置き、
# 依頼一覧（プロンプトつき）を <教科>全体制作/画像の依頼_ChatGPT_Images.md と 動画の担当_Claude.md に書き出す。
# 教科書・ワークの本文は写さない。単元名・ページ・学び方を示し、説明と問題は自作する。
import json, re, runpy, shutil, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'site-assets'
SUBJECTS = {
 'kokugo1':   {'dir': '国語全体制作', 'code': 'K1', 'subject': '国語', 'title': '国語 1', 'grade': '中学1年', 'key': '読み方・しくみ'},
 'english1':  {'dir': '英語全体制作', 'code': 'E1', 'subject': '英語', 'title': '英語 1', 'grade': '中学1年', 'key': 'しくみ'},
 'science1':  {'dir': '理科全体制作', 'code': 'S1', 'subject': '理科', 'title': '理科 1', 'grade': '中学1年', 'key': 'しくみ'},
 'geography': {'dir': '地理全体制作', 'code': 'G',  'subject': '社会', 'title': '社会 地理', 'grade': '中学', 'key': 'しくみ'},
 'history':   {'dir': '歴史全体制作', 'code': 'H',  'subject': '社会', 'title': '社会 歴史', 'grade': '中学', 'key': 'しくみ'},
}
STYLE = ('中学生向け教科書のやさしいイラスト。明るくやわらかい色、太めの線、白い背景、日本の中学校の雰囲気。'
         '文字・ロゴ・実在の人物や作品のキャラクターは入れない。横長 16:9。')

# 問いの言い方を、命令から「〜しよう」へやわらかくする
SOFT = [('答えなさい。', '答えよう。'), ('書きなさい。', '書いてみよう。'), ('選びなさい。', '選ぼう。'), ('直しなさい。', '直してみよう。'),
        ('説明しなさい。', '説明してみよう。'), ('区切りなさい。', '区切ってみよう。'), ('まとめなさい。', 'まとめてみよう。'),
        ('作りなさい。', '作ってみよう。'), ('ぬき出しなさい。', 'ぬき出してみよう。'), ('分けなさい。', '分けてみよう。'),
        ('表しなさい。', '表してみよう。'), ('考えなさい。', '考えてみよう。'), ('求めなさい。', '求めてみよう。'),
        ('訳しなさい。', '訳してみよう。'), ('並べかえなさい。', '並べかえてみよう。'), ('入れなさい。', '入れてみよう。'),
        ('書きかえなさい。', '書きかえてみよう。'), ('読みなさい。', '読んでみよう。'), ('挙げなさい。', '挙げてみよう。'), ('しなさい。', 'してみよう。')]
def soft(x):
    if not isinstance(x, str): return x
    for a, b in SOFT: x = x.replace(a, b)
    return x

def build(book_id):
    S = SUBJECTS[book_id]; WORK = ROOT / '教材整理/Claude_Codex共有' / S['dir']; SRC = WORK / '原稿'
    units = [runpy.run_path(str(f))['UNIT'] for f in sorted(SRC.glob('u*.py'))]
    HITO = runpy.run_path(str(SRC / 'ひとこと.py'))['HITOKOTO'] if (SRC / 'ひとこと.py').exists() else {}
    FUN = runpy.run_path(str(SRC / 'おもしろ.py'))['FUN'] if (SRC / 'おもしろ.py').exists() else {}
    TALK = runpy.run_path(str(SRC / 'かいわ.py'))['TALK'] if (SRC / 'かいわ.py').exists() else {}   # 2026-10-06 わかりやすく・増やした会話
    # 2026-10-06：作品の「内容」（自分の言葉のまとめ）と、著作権の切れた作品の「本文」（ユーザー指示「文章を書いて」）
    HON = runpy.run_path(str(SRC / '本文.py'))['HONBUN'] if (SRC / '本文.py').exists() else {}
    LINKS = runpy.run_path(str(SRC / '動画リンク.py'))['LINKS'] if (SRC / '動画リンク.py').exists() else {}
    # 2026-10-05：理科・地理・歴史は NHK for School の番組・クリップを動画の枠にのせる（ユーザー指示）。対応は 原稿/NHK動画.py
    NHK = runpy.run_path(str(SRC / 'NHK動画.py'))['NHK'] if (SRC / 'NHK動画.py').exists() else None
    SCRIPTS = WORK / '制作ソース'
    ids, imgs, vids = set(), [], []
    YOMI = {}   # 節のコード → 読み上げの表（本文の音声）
    def uid(x):
        assert x not in ids, x
        ids.add(x); return x
    def li(items): return [{'level': 0, 'x': soft(x)} for x in items]
    def ans(summary, text): return {'t': 'details', 'summary': summary, 'body': [{'t': 'p', 'x': soft(t)} for t in (text if isinstance(text, list) else [text])]}
    def qblocks(label, qs):
        out = []
        for k, q in enumerate(qs, 1):
            out.append({'t': 'p', 'x': f'**{label}{k}**　{soft(q[0])}'})
            if len(q) > 2 and q[2]: out.append(ans('ヒント', q[2]))
            out.append(ans('答え', q[1]))
        return out
    CUR = {}
    def ctx():
        L = CUR.get('L'); U = CUR.get('U')
        if not L: return f"教科：{S['title']}（中学生）。単元：{U['title'] if U else ''}。"
        pts = '／'.join(x for _, items in L['keys'][:2] for x in items[:2])
        return f"教科：{S['title']}（{S['grade']}）。単元：{CUR['chap']}「{L['title']}」。学習のめあて：{L['goal']} 大事なこと：{pts}"
    def scene(i, cap, where):
        pr = (f"【ChatGPT Images への依頼】{S['title']}の教科書にのせる、場面のイラストを1枚作ってください。\n"
              f"■場面：{cap}\n■この絵で伝えたいこと：{ctx()}\n"
              "■登場人物：日本の中学1年生（男女2〜3人。制服かジャージ。表情ゆたかで、少しユーモラス）。必要なら先生や家族。実在の人物・有名キャラクターに似せない。\n"
              "■構図：横長16:9。主役の動きが一目でわかるように中央に。背景は場面がわかる程度にシンプルに。\n"
              "■タッチ：明るくやわらかい色、太めの線のやさしい手描き風イラスト。読んでいてクスッと笑える小さな遊び心（表情・小物）を1つ入れる。\n"
              "■入れないもの：文字・数字・ロゴ・吹き出しの中の文字・教科書の本文。暴力的・こわい表現。")
        imgs.append((i, '絵', cap, where, pr))
        png = WORK / 'メディア' / (i + '.png')
        out = f'textbook-book-{book_id}-{i.lower()}.png'
        if png.exists() and '--check' not in sys.argv: shutil.copyfile(png, OUT / out)
        return {'t': 'fig', 'kind': 'scene', 'id': uid(i), 'src': '/' + out if png.exists() else None, 'caption': cap, 'maker': 'ChatGPT Images', 'prompt': pr}
    def diagram(i, title, where):
        L = CUR.get('L'); items = [x for _, it in (L['keys'] if L else []) for x in it][:6]
        pr = (f"【ChatGPT Images への依頼】{S['title']}の教科書にのせる「図解」を1枚作ってください。\n"
              f"■図のテーマ：{title}\n■この図で伝えたいこと：{ctx()}\n"
              + ("■図に表す中身（この関係を形・矢印・色分けで表す）：" + '／'.join(items) + "\n" if items else "")
              + "■かき方：白い背景、横長16:9。色は3〜4色まで。太い線・大きな矢印・はっきりした区切りで、ぱっと見て関係がわかる図解にする。かわいいアイコンや小さなキャラクター（芽の形のマスコット）を1つ添えて楽しく。\n"
              "■文字：図の中の文字は入れない（日本語の文字はくずれやすいため。名前やラベルは教科書の本文側にある）。数や向き・順番は上の中身のとおりに正確に。\n"
              "■入れないもの：まちがった情報、問題の答え、ロゴ、実在の人物。")
        svg = WORK / 'メディア' / (i + '.svg')
        if svg.exists():
            # Claude が作った図解（教科図解/）があれば本に入れる（2026-10-06）
            out = f'textbook-book-{book_id}-{i.lower()}.svg'
            if '--check' not in sys.argv: shutil.copyfile(svg, OUT / out)
            return {'t': 'media', 'kind': 'diagram', 'id': uid(i), 'title': title, 'src': '/' + out, 'maker': 'Claude', 'zoom': True}
        imgs.append((i, '図解', title, where, pr))
        return {'t': 'media', 'kind': 'diagram', 'id': uid(i), 'title': title, 'src': None, 'maker': 'ChatGPT Images', 'prompt': pr}
    def talk_block(lines, rid=None):   # rid：読み上げ用のIDの頭（例 K1-C1-S1-T）。1行ずつ番号をつける
        def face(w, x):
            if w != 'のびー': return {'ソラ': '🧒', 'ミオ': '👧', '先生': '🧑‍🏫'}.get(w, '🙂')
            if re.match(r'(正解|そのとおり|ばっちり|いいね|最高|いい表現|いい発見|いいところ|よく気づ|いい調子|いい判断|いい読み方|いい目|まさにそれ|それそれ)', x): return 'nobi-joy'
            if re.match(r'(ひっかか|ざんねん|ちょっと待って|それが落とし穴|ひっかけ|……)', x): return 'nobi-surprise'
            if 'たとえば' in x or re.match(r'(まず|見て|最後の|先に|一字ずつ|手をたたき)', x): return 'nobi-point'
            if x.endswith('？'): return 'nobi-think'
            if x.startswith('そう') or x.startswith('ある'): return 'nobi-wave'
            return 'nobi-normal'
        out = {'t': 'talk', 'lines': [[w, face(w, x), x] for w, x in lines]}
        if rid: out['rids'] = [f'{rid}{k:02d}' for k in range(1, len(lines) + 1)]
        return out
    def video(i, title, where, lines=None, links=None):
        L = CUR.get('L'); lines = lines or []
        # 2026-10-06：動画はNHK（NHK for School・高校講座）を優先し、合うものがない枠は Claude が作った動画にする（ユーザー指示）
        ext = (NHK or {}).get(L['title'], {}).get('VP' if i.endswith('-VP') else 'V01') if L else None
        if ext:
            srcs = '・'.join(dict.fromkeys(x['source'] for x in ext))
            return {'t': 'media', 'kind': 'video', 'id': uid(i), 'title': srcs + 'で見る：' + L['title'], 'src': None, 'ext': srcs, 'links': ext}
        script = [f"【Claude が作る動画】{title}（{where}）", "形式：動画エンジン（Kyoko・音声共有/設定.json の承認済み設定・30fps・1文1ステップ・字幕つき）。長さ60〜90秒。", "めあて：" + (L['goal'] if L else '')]
        steps = []
        for k, (screen, say) in enumerate(lines, 1):
            script.append(f"場面{k}　画面：{screen}　／　ナレーション：「{say}」"); steps.append({'say': say, 'cap': say, 'screen': screen, 'hold': 0.6})
        script.append("点検：数・ラベル・答えのかくし方を確かめ、1.5秒ごとのコマを目で見る。読み方は台本の say を使い、まちがえやすい読みは yomi で直す。")
        mp4 = WORK / 'メディア' / (i + '.mp4')
        if steps and (not mp4.exists() or '--scripts' in sys.argv):   # --scripts：動画があっても台本を書き直す
            SCRIPTS.mkdir(parents=True, exist_ok=True)
            try:   # 台本に手で足した読み方（read）は消さずに残す（2026-10-06）
                old = {x['say']: x['read'] for x in json.loads((SCRIPTS / f'{i}.json').read_text(encoding='utf-8'))['steps'] if x.get('read')}
                for x in steps:
                    if x['say'] in old: x['read'] = old[x['say']]
            except (OSError, ValueError, KeyError): pass
            (SCRIPTS / f'{i}.json').write_text(json.dumps({'settings': '音声共有/設定.json', 'title': title, 'where': where, 'steps': steps}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        if mp4.exists():
            # Claude が作った動画（教科動画/make.py）があれば本に入れる
            out = f'textbook-book-{book_id}-{i.lower()}.mp4'
            if '--check' not in sys.argv: shutil.copyfile(mp4, OUT / out)
            vids.append((i, title, where))
            d = {'t': 'media', 'kind': 'video', 'id': uid(i), 'title': title, 'src': '/' + out}
            if links: d['links'] = links
            return d
        vids.append((i, title, where))
        d = {'t': 'media', 'kind': 'video', 'id': uid(i), 'title': title, 'src': None, 'maker': 'Claude', 'script': script}
        if links: d['links'] = links
        return d

    pages = [{'kind': 'cover'}, {'kind': 'toc'}, {'kind': 'guide', 'rows': [
        ['はじめに', 'これから学ぶことを、身近な場面から考えるよ'],
        [S['key'], 'ひとことで言うと？ から始めて、大事なきまりを例といっしょに見ていくよ'],
        ['例題', '短い例で、考える順番をいっしょにたどろう'],
        ['確認', '自分で答えてみて、答えと解説で確かめよう'],
        ['練習', 'ワークと同じ形の問題だよ。★はテストによく出る形'],
        ['ポイント', 'その節の大事なことと、かんたんにやる方法のまとめ'],
        ['動画・図・絵', 'まだのものは枠だけ。できしだい入るよ']]}]
    toc, fillers = [], {}
    for ui, U in enumerate(units, 1):
        app = U.get('appendix')
        cnum = '巻末' if app else U.get('label') or f'{ui}章'
        chap_name = U['title'] if app else cnum + ' ' + U['title']
        chap = {'chapter': cnum, 'title': U['title'], 'page': len(pages) + 1, 'sections': []}
        toc.append(chap)
        ccode = f"{S['code']}-{U.get('code') or ('APP' if app else 'C%d' % ui)}"
        CUR.update({'L': None, 'U': U, 'chap': chap_name})
        if not app:
            blocks = [scene(ccode + '-OPEN', U.get('scene', U['title'] + 'の章のとびらの絵'), f'{cnum}のとびら'), {'t': 'h3', 'x': U['open_h']}, {'t': 'ul', 'items': li(U['open'])},
                      {'t': 'h3', 'x': 'この章で学ぶこと'}, {'t': 'p', 'x': '／'.join(L['title'] for L in U['lessons'])}]
            pages.append({'kind': 'chapter-open', 'chapter': cnum, 'chapterTitle': U['title'], 'tag': '章のとびら', 'topic': '', 'blocks': blocks})
        for si, L in enumerate(U['lessons'], 1):
            sec = U.get('sec', '巻末') if app else f'{si}節'
            where = f"{chap_name} {sec} {L['title']}"
            base = {'kind': 'content', 'chapter': chap_name, 'section': sec, 'sectionTitle': L['title']}
            code = f'{ccode}-S{si}'
            CUR.update({'L': L, 'U': U, 'chap': chap_name})
            chap['sections'].append({'title': L['title'] if app else sec + ' ' + L['title'], 'page': len(pages) + 1})
            b = [{'t': 'hook', 'x': L['hook']}, {'t': 'goal', 'x': soft(L['goal'])}, scene(code + '-SCENE', L.get('scene') or ('「' + L['title'] + '」の場面'), where + '（はじめに）'),
                 {'t': 'h3', 'x': '教科書・ワークのどこ？'}, {'t': 'ul', 'items': li(L['where'])}, {'t': 'h3', 'x': L.get('intro_h', 'ここで考えること')}, {'t': 'ul', 'items': li(L['intro'])}]
            pages.append({**base, 'tag': 'はじめに', 'topic': '', 'blocks': b})
            yj = WORK / 'メディア' / f'YOMI-{code}.json'
            if yj.exists() and (WORK / 'メディア' / f'YOMI-{code}.mp3').exists():
                # 読み上げの音声と、どの文字を何秒に読むかの表（本文・あらすじ・会話）（Claude_Codex共有/読み上げ/make_yomi.py が作る）
                for ext in ('json', 'mp3'):
                    if '--check' not in sys.argv: shutil.copyfile(WORK / 'メディア' / f'YOMI-{code}.{ext}', OUT / f'textbook-yomi-{code.lower()}.{ext}')
                YOMI[code] = f'/textbook-yomi-{code.lower()}.json'
            HB = HON.get(L['title'])
            if HB:
                b = []
                if HB.get('naiyou'): b += [{'t': 'h3', 'x': 'どんな内容？'}, {'t': 'ol', 'items': li(HB['naiyou']), 'rids': [f'{code}-N{k:02d}' for k in range(1, len(HB['naiyou']) + 1)]}]   # rids：読み上げ用
                if HB.get('honbun'):
                    hid = [0]
                    b.append({'t': 'h3', 'x': '本文'})
                    for kind, x in HB['honbun']:
                        if kind == 'h': b.append({'t': 'h3', 'x': x}); continue
                        # 長い段落は文の切れ目（。」の後）で分け、ページの下まで文章が入るようにする（2つめからは字下げなし）
                        parts, cur = [], ''
                        for piece in re.split(r'(?<=。)(?!」)|(?<=。」)', x):
                            if len(cur) + len(piece) > 180 and cur: parts.append(cur); cur = ''
                            cur += piece
                        if cur: parts.append(cur)
                        for k, part in enumerate(parts):
                            hid[0] += 1   # 読み上げ用の段落ID（教科書の本文を声で読むときに、どこを読んでいるかを合わせる）
                            b.append({'t': 'p', 'x': part, 'hon': True if k == 0 else 'cont', 'rid': f'{code}-H{hid[0]:02d}'})
                b.append({'t': 'note', 'x': '出典・確かめ方：' + HB['src']})
                pages.append({**base, 'tag': '本文' if HB.get('honbun') else '内容', 'topic': L['title'], 'blocks': b})
            b = []
            e1 = L.get('easy1') or HITO.get(L['title'])
            if e1: b.append({'t': 'hook', 'x': 'ひとことで言うと… ' + e1})
            F = FUN.get(L['title'], {})
            tk = (TALK.get(L['title']) or {}).get('talk') or F.get('talk')
            if tk: b.append(talk_block(tk, f'{code}-T'))
            for h, items in L['keys']:
                b += [{'t': 'h3', 'x': h}, {'t': 'ul', 'items': li(items)}]
                if h == L['keys'][0][0]:
                    b.append(diagram(code + '-D01', L.get('diagram') or (L['title'] + 'の要点の図'), where + '（しくみ）'))
            if L.get('table'): b.append({'t': 'table', 'rows': L['table']})
            if F.get('tatoe'): b.append({'t': 'extra', 'kind': 'たとえ話', 'title': F['tatoe'][0], 'x': F['tatoe'][1], 'answer': None})
            if F.get('trivia'): b.append({'t': 'extra', 'kind': '豆知識', 'title': F['trivia'][0], 'x': F['trivia'][1], 'answer': None})
            pages.append({**base, 'tag': L.get('key_tag', S['key'] if S['key'] != '読み方・しくみ' else ('読み方' if L['area'] in ('読む', '古典', '詩') else 'しくみ')), 'topic': L.get('key_topic', L['title']), 'blocks': b})
            E_ = L['ex']; b = [{'t': 'h3', 'x': '例題　' + E_['h']}]
            t2 = (TALK.get(L['title']) or {}).get('talk2')
            if t2: b.append(talk_block(t2, f'{code}-U'))   # 解く前の「考える順番」の相談
            if E_.get('text'): b.append({'t': 'note', 'x': E_['text']})
            ex_lines = [('のびーが登場し、今日の問題を出す', 'きょうは「' + L['title'] + '」の例題だよ。いっしょに考えよう！')]
            if E_.get('text'):
                # 動画では出典メモ（自作）は出さず、文の途中で切らない（長い本文は120字までの文の切れ目まで）（2026-10-06）
                pt = re.sub(r'^[（(]自作[）)]\s*', '', re.sub(r'\s+', ' ', E_['text']).strip())
                if len(pt) > 120:
                    cut = max(pt.rfind(c, 0, 121) for c in '。．.!?！？')
                    pt = pt[:cut + 1] if cut > 20 else pt[:120]
                ex_lines.append(('問題文を大きく表示する', '問題はこれ。' + pt))
            ex_lines += [('手順' + str(k) + 'のところを光らせ、矢印で動かす', s) for k, s in enumerate(E_['steps'], 1)]
            ex_lines += [('答えをふわっと出して丸で囲む', '答えは、' + ('　'.join(E_['ans']) if isinstance(E_['ans'], list) else E_['ans'])),
                         ('まとめのカードを出す', 'ポイントは、' + (L['easy'][0] if L.get('easy') else L['sum'][0]))]
            b += [x for x in [{'t': 'ol', 'items': li(E_['steps'])}, ans('答え', E_['ans']), video(code + '-V01', L.get('video') or (L['title'] + 'の例題'), where + '（例題）', ex_lines, LINKS.get(L['title']))] if x]
            pages.append({**base, 'tag': '例題', 'topic': L['title'], 'blocks': b})
            pages.append({**base, 'tag': '確認', 'topic': L['title'], 'blocks': [diagram(code + '-DQ', '確認問題を解く手がかり：' + L['title'], where + '（確認）')] + qblocks('確認', L['q'])})
            pages.append({**base, 'tag': '練習', 'topic': L['title'] + ' の練習', 'blocks': [diagram(code + '-DP', L.get('fig') or ('練習問題の手がかり：' + L['title']), where + '（練習）')] + qblocks('練習', L['p'])})
            pb = [{'t': 'h3', 'x': 'この節のポイント'}, {'t': 'ul', 'items': li(L['sum'])}, {'t': 'h3', 'x': 'かんたんにやる方法'}, {'t': 'ol', 'items': li(L['easy'])}]
            if L.get('miss'): pb += [{'t': 'h3', 'x': 'よくあるミス'}, {'t': 'ul', 'items': li(L['miss'])}]
            vp_lines = [('タイトル「1分でわかる」と節の名前', '1分でわかる、' + L['title'] + '。')]
            vp_lines += [('ポイント' + str(k) + 'をカードで出す', x) for k, x in enumerate(L['sum'][:4], 1)]
            vp_lines += [('「かんたんにやる方法」をのびーが指さす', 'かんたんにやるコツ。' + L['easy'][0])] if L.get('easy') else []
            vp_lines += [('×印つきでまちがい例を出し、正しい形に直す', '気をつけて！' + L['miss'][0])] if L.get('miss') else []
            vp_lines.append(('のびーが手をふる', 'これでばっちり。練習問題にチャレンジしよう！'))
            vb = video(code + '-VP', '1分でわかる この節：' + L['title'], where + '（ポイント）', vp_lines)
            if vb: pb.append(vb)
            pages.append({'kind': 'points', 'chapter': chap_name, 'section': sec, 'sectionTitle': L['title'], 'tag': 'ポイント', 'topic': 'ポイントとかんたんにやる方法', 'blocks': pb})
    pages.append({'kind': 'end'})
    for i, p in enumerate(pages, 1): p['n'] = i
    for p in pages:
        for bl in p.get('blocks', []):
            if 'x' in bl: assert isinstance(bl['x'], str) and bl['x'].strip(), (p.get('topic'), bl)
    book = {'id': book_id, 'subject': S['subject'], 'grade': S['grade'], 'title': S['title'], 'pageCount': len(pages), 'toc': toc, 'fillers': fillers, 'pages': pages}
    if YOMI: book['yomi'] = YOMI
    text = json.dumps(book, ensure_ascii=False, separators=(',', ':'))
    target = OUT / f'textbook-book-{book_id}.json'
    if '--check' in sys.argv:
        ok = target.exists() and target.read_text(encoding='utf-8') == text
        print(S['title'] + '：' + ('原稿と一致' if ok else '原稿より古い')); return ok
    target.write_text(text, encoding='utf-8')
    shelf_p = OUT / 'textbook-books.json'; shelf = json.loads(shelf_p.read_text(encoding='utf-8'))
    for bk in shelf['books']:
        if bk['id'] == book_id: bk.update({'status': 'ready', 'data': f'/textbook-book-{book_id}.json', 'pageCount': len(pages)})
    shelf_p.write_text(json.dumps(shelf, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    L1 = ['# 画像の依頼（ChatGPT Images）', '', f"{S['title']}の絵と図解 {len(imgs)}枚。1枚ずつ、下のプロンプトをそのまま ChatGPT Images に貼って作る。",
          f"できた画像は `{S['dir']}/メディア/<ID>.png` に保存する（ID は見出しの番号）。教科書の各枠の「プロンプト」ボタンにも同じ文が入っている。", '']
    for i, k, c, w, pr in imgs: L1 += [f'## {i}（{k}）', f'- どこ：{w}', '', '```', pr, '```', '']
    (WORK / '画像の依頼_ChatGPT_Images.md').write_text('\n'.join(L1) + '\n', encoding='utf-8')
    L2 = ['# 動画の担当（Claude）', '', f"{S['title']}の動画 {len(vids)}本。Claude が動画エンジン（Kyoko・承認済み設定・30fps）で作る。保存先 `{S['dir']}/メディア/<ID>.mp4`。",
          f"台本（1文1ステップ・画面の指示つき）は `{S['dir']}/制作ソース/<ID>.json`。場面.html は 数学全体制作/メディア/制作ソース/動画エンジン の部品で作る。教科書の各枠の「台本」ボタンにも同じ内容が入っている。", '', '| ID | 題 | どこ |', '|---|---|---|']
    L2 += [f'| {i} | {t} | {w} |' for i, t, w in vids]
    (WORK / '動画の担当_Claude.md').write_text('\n'.join(L2) + '\n', encoding='utf-8')
    nq = text.count('**確認') + text.count('**練習')
    print(f"{S['title']}：{len(units)}章、{sum(len(U['lessons']) for U in units)}節、{len(pages)}ページ、問題{nq}、枠：画像{len(imgs)}（ChatGPT Images）・動画{len(vids)}（Claude）")
    return True

if __name__ == '__main__':
    arg = next((a for a in sys.argv[1:] if not a.startswith('--')), 'all')
    todo = [k for k in SUBJECTS if (WORK := ROOT / '教材整理/Claude_Codex共有' / SUBJECTS[k]['dir'] / '原稿').exists() and any(WORK.glob('u*.py'))] if arg == 'all' else [arg]
    ok = all([build(k) for k in todo])
    sys.exit(0 if ok else 1)
