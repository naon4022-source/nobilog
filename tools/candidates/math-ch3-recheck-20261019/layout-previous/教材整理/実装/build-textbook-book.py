"""Claude原稿（Markdown）から、教科書画面用の本データを作る。
出力：site-assets/textbook-books.json（本棚）、site-assets/textbook-book-math1.json（数学1年の全ページ）、
      採用済みの図・絵（site-assets/textbook-book-math1-*.svg/jpg）。
原稿・制作台帳・選定記録は読むだけで、変更しない。"""
import json, re, shutil, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '教材整理/Claude_Codex共有/数学全体制作'
DRAFT = WORK / 'Claude原稿'
OUT = ROOT / 'site-assets'
BOOK = 'math1'

CHAPTERS = [
    ('C1', '1章', '正の数・負の数'), ('C2', '2章', '文字の式'), ('C3', '3章', '方程式'),
    ('C4', '4章', '変化と対応'), ('C5', '5章', '平面図形'), ('C6', '6章', '空間図形'), ('C7', '7章', 'データの活用'),
]
TAGS = {'しくみ': 'しくみ', '解き方': '解き方', '例題': '例題', 'つまずきと確認': '確認', 'いかそう': 'つかってみよう'}

ledger = json.loads((WORK / '制作台帳.json').read_text(encoding='utf-8'))
unit_title = {u['id']: u['title'] for u in ledger['units']}
selected = {}
for slot in ledger['imageSlots']:
    if slot.get('selected'):
        cand = next(c for c in slot['candidates'] if c['id'] == slot['selected'])
        selected[slot['id']] = WORK / cand['file']
# 制作台帳への反映（Codex）より先に、Claudeの選定記録で「採用」になったものも使う
import glob as _glob
for _path in _glob.glob(str(WORK / '選定記録' / '*.json')):
    for _c in json.loads(Path(_path).read_text(encoding='utf-8')).get('choices', []):
        if str(_c.get('decision') or '').startswith('採用') and _c.get('candidateId') and _c['slotId'] not in selected:
            _slot = next((s for s in ledger['imageSlots'] if s['id'] == _c['slotId']), None)
            _cand = _slot and next((c for c in _slot['candidates'] if c['id'] == _c['candidateId'] and c.get('file')), None)
            if _cand and (WORK / _cand['file']).exists(): selected[_c['slotId']] = WORK / _cand['file']

def section_name(unit):
    t = unit_title.get(unit, '')
    m = re.match(r'(\d+)章(\d+)節\s*(.+)', t)
    return (m.group(2) + '節', m.group(3)) if m else ('', t)

# ---- 文字の整形（制作メモを外す） ----
def clean(text):
    text = re.sub(r'〔参考：[^〕]*〕', '', text)
    text = re.sub(r'[（(]\s*教科書\s*p[^）)]*[）)]', '', text)
    text = re.sub(r'[（(]\s*ワーク\s*p[^）)]*[）)]', '', text)
    text = re.sub(r'（[^）]*(?:P\d{3}|M1-P)[^）]*）', '', text)
    text = re.sub(r'\s*（M1-[^）]*）', '', text)
    # 図の番号は生徒向けの言い方にする
    text = re.sub(r'・FIG\d+', '', text)
    text = re.sub(r'（FIG\d+）', '（図）', text)
    text = re.sub(r'FIG\d+\s*の', '図の', text)
    text = re.sub(r'FIG\d+', '図', text)
    text = re.sub(r'例題(\d+)-(基本|標準|応用)', r'例題\1（\2）', text)
    # 「（図）」はどの図か分かりにくいので、生徒向けの言い方にする
    text = text.replace('図で見ると（図）', '上の図で見ると').replace('図（図）', '上の図')
    text = re.sub(r'(例題\d+（(?:基本|標準|応用)）)（図）', r'\1', text)
    text = text.replace('（図）', '（上の図）')
    return text.strip().rstrip('　').strip()

FIG = re.compile(r'^［(図|絵)\s*([A-Za-z0-9-]+)[^：］]*(?:：(.+?))?］\s*$')
copied = {}
def figure(kind, slot, caption):
    src = selected.get(slot)
    # 採用候補がまだないときは、メディア/<枠ID>.svg（Claude・Codex が作った正確な図）を使う
    if not src and (WORK / 'メディア' / (slot + '.svg')).exists(): src = WORK / 'メディア' / (slot + '.svg')
    out = None
    if src and src.exists() and '--check' in __import__('sys').argv:
        out = copied.setdefault(slot, 'textbook-book-' + BOOK + '-' + slot.lower() + ('.svg' if src.suffix.lower() == '.svg' else '.jpg'))
    elif src and src.exists():
        if slot not in copied:
            name = 'textbook-book-' + BOOK + '-' + slot.lower()
            if src.suffix.lower() == '.svg':
                out = name + '.svg'; shutil.copyfile(src, OUT / out)
            else:
                out = name + '.jpg'; im = Image.open(src).convert('RGB'); im.thumbnail((1400, 1400)); im.save(OUT / out, quality=82, optimize=True)
            copied[slot] = out
        out = copied[slot]
    caption = re.sub(r'（[^）]*）', '', clean(caption or ''))
    block = {'t': 'fig', 'kind': 'scene' if kind == '絵' else 'diagram', 'src': ('/' + out) if out else None, 'caption': caption}
    compatibility = next((s.get('annotationCompatibility') for s in ledger['imageSlots'] if s['id'] == slot), None)
    if (isinstance(compatibility, dict) and compatibility.get('quote') == caption
            and compatibility.get('kind') == block['kind']
            and isinstance(compatibility.get('anchor'), str)
            and re.fullmatch(r'[a-f0-9]{64}', compatibility['anchor'])):
        block.update(annotationAnchor=compatibility['anchor'], annotationQuote=compatibility['quote'])
    return block

def parse_blocks(lines, in_answer=False):
    blocks, para, i = [], [], 0
    def flush():
        if para: blocks.append({'t': 'p', 'x': clean(' '.join(para))}); para.clear()
    while i < len(lines):
        line = lines[i].rstrip()
        s = line.strip()
        if not s or s == '---':
            flush(); i += 1; continue
        m = FIG.match(s)
        if m:
            flush()
            # An authored answer figure reuses its media identity and specification.
            authored = next((item for ex in extras.values() for item in ex.get('media', []) if item['id'] == m.group(2)), None) if in_answer else None
            blocks.append(media_block(authored) if authored else figure(m.group(1), m.group(2), m.group(3))); i += 1; continue
        if s.startswith('<details>'):
            flush(); buf = [s]
            while '</details>' not in buf[-1] and i + 1 < len(lines):
                i += 1; buf.append(lines[i].rstrip())
            raw = '\n'.join(buf)
            mm = re.match(r'<details><summary>(.*?)</summary>(.*)</details>', raw, re.S)
            body = parse_blocks(mm.group(2).strip().split('\n'), in_answer=True) if mm else []
            blocks.append({'t': 'details', 'summary': clean(mm.group(1)) if mm else '答え', 'body': body}); i += 1; continue
        if s.startswith('#### '):
            flush(); blocks.append({'t': 'h4', 'x': clean(s[5:])}); i += 1; continue
        if s.startswith('### '):
            flush(); blocks.append({'t': 'h3', 'x': clean(s[4:])}); i += 1; continue
        if s.startswith('|'):
            flush(); rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = lines[i].strip()
                if not re.fullmatch(r'\|[\s:|-]+\|?', row):
                    rows.append([clean(c) for c in row.strip('|').split('|')])
                i += 1
            blocks.append({'t': 'table', 'rows': rows}); continue
        if s.startswith('> '):
            flush(); blocks.append({'t': 'note', 'x': clean(s[2:])}); i += 1; continue
        if re.match(r'^(\s*)([-*]|\d+\.)\s', line):
            flush(); items = []; ordered = bool(re.match(r'^\s*\d+\.', line))
            while i < len(lines) and re.match(r'^(\s*)([-*]|\d+\.)\s', lines[i]):
                mm = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', lines[i].rstrip())
                items.append({'level': min(2, len(mm.group(1)) // 2), 'x': clean(mm.group(3))}); i += 1
            blocks.append({'t': 'ol' if ordered else 'ul', 'items': items}); continue
        para.append(s); i += 1
    flush()
    return [b for b in blocks if not (b['t'] == 'p' and not b['x'])]

HEAD = re.compile(r'^## (?:追加提案 )?(M1-P(\d+)([a-z]?))｜(.*)$')
def read_pages(unit):
    path = DRAFT / unit / '本文.md'
    if not path.exists(): return []
    pages, cur = [], None
    for line in path.read_text(encoding='utf-8').split('\n'):
        m = HEAD.match(line)
        if m:
            cur = {'pid': m.group(1), 'key': (int(m.group(2)), m.group(3)), 'head': m.group(4), 'lines': []}; pages.append(cur)
        elif cur is not None and not line.startswith('# '):
            cur['lines'].append(line)
    out = []
    for p in sorted(pages, key=lambda p: p['key']):
        head = re.sub(r'[　\s]*(?:（\s*教科書.*|〔参考.*)$', '', p['head']).strip()
        topic, tag = head, ''
        if '／' in head:
            base, last = head.rsplit('／', 1)
            if last in TAGS: topic, tag = base, TAGS[last]
        if head.startswith('身近な導入'): topic, tag = '', 'はじめに'
        elif head.startswith('別の場面へ使う'): topic, tag = '', 'つかってみよう'
        elif head.startswith('全体のつながり'): topic, tag = '', 'ふりかえり'
        elif head.startswith('解法のつながり'):
            topic = re.sub(r'^解法のつながり・理由を解説しながら振り返る[（(]\d[)）]', '', head).strip(); tag = '章のまとめ'
        elif head.startswith('生活と学習内容を結ぶ章の導入') or head == '章の導入': topic, tag = '', '章のとびら'
        topic = re.sub(r'（[^）]*）', '', topic).replace('／', '・').strip()
        out.append({'pid': p['pid'], 'tag': tag, 'topic': topic, 'blocks': parse_blocks(p['lines'])})
    return out

def md_page(path):
    lines = path.read_text(encoding='utf-8').split('\n')
    return parse_blocks([l if not l.startswith('## ') else '### ' + l[3:] for l in lines if not l.startswith('# ')])

def question_pages(unit):
    path = DRAFT / unit / '確認問題.md'
    if not path.exists(): return []
    blocks = parse_blocks([l for l in path.read_text(encoding='utf-8').split('\n') if not l.startswith('# ') and not l.startswith('答えは')])
    # 区切らずに1つにして、画面で組むときにページへ流しこむ（空白を残さない）
    return [blocks] if blocks else []

# ---- 本の追加（めあて・まとめ・画像/動画の枠） ----
MEDIA_DIR = WORK / 'メディア'
extras = {}
for _f in sorted(DRAFT.glob('*/本の追加.json')):
    extras[_f.parent.name] = json.loads(_f.read_text(encoding='utf-8'))
def media_block(m):
    src = None
    for ext in ('mp4', 'webm', 'jpg', 'png', 'svg'):
        f = MEDIA_DIR / (m['id'] + '.' + ext)
        if f.exists() and '--check' not in sys.argv:
            out = 'textbook-book-' + BOOK + '-' + m['id'].lower() + '.' + ('jpg' if ext == 'png' else ext)
            if ext == 'png':
                im = Image.open(f).convert('RGB'); im.thumbnail((1400, 1400)); im.save(OUT / out, quality=82, optimize=True)
            else:
                shutil.copyfile(f, OUT / out)
            src = '/' + out; break
        elif f.exists():
            src = '/textbook-book-' + BOOK + '-' + m['id'].lower() + '.' + ('jpg' if ext == 'png' else ext); break
    return {'t': 'media', 'kind': m['kind'], 'id': m['id'], 'title': m['title'], 'src': src}
def contains_media(blocks, slot):
    return any((b.get('t') == 'media' and b.get('id') == slot) or contains_media(b.get('body', []), slot) for b in blocks)

def apply_extras(unit, page):
    ex = extras.get(unit)
    if not ex: return
    pid = page.get('pid')
    for g in ex.get('goals', []):
        if g['pid'] == pid: page['blocks'].insert(0, {'t': 'goal', 'x': g['x']})
    for h in ex.get('hooks', []):
        if h['pid'] == pid: page['blocks'].insert(0, {'t': 'hook', 'x': h['x']})
    for m in ex.get('media', []):
        # A figure explicitly placed inside an answer must not also appear outside it.
        if contains_media(page['blocks'], m['id']): continue
        if m['pid'] == pid or (m['pid'] == 'POINTS' and page.get('kind') == 'points'):
            # "at": "top" の枠は、めあて・吹き出しのすぐ後ろ（ページの最初のほう）に置く
            if m.get('at') == 'top': page['blocks'].insert(next((i for i, b in enumerate(page['blocks']) if b.get('t') not in ('goal', 'hook')), len(page['blocks'])), media_block(m))
            else: page['blocks'].append(media_block(m))
    for sm in ex.get('summaries', []):
        if sm['pid'] == pid: page['blocks'].append({'t': 'summary', 'items': sm['items']})

def read_practice(unit):
    path = DRAFT / unit / '練習問題.md'
    if not path.exists(): return {}
    out, cur = {}, None
    for line in path.read_text(encoding='utf-8').split('\n'):
        m = re.match(r'^## (M1-P\d+[a-d]?)\s*$', line)
        if m: cur = m.group(1); out[cur] = []; continue
        if cur and not line.startswith('# '): out[cur].append(line)
    return {k: parse_blocks(v) for k, v in out.items()}

# ---- 本を組み立てる ----
pages = [{'kind': 'cover'}, {'kind': 'toc'}, {'kind': 'guide'}]
toc = []
for cid, cnum, ctitle in CHAPTERS:
    open_unit = 'M1-' + cid + '-OPEN'
    sections = [u['id'] for u in ledger['units'] if u['id'].startswith('M1-' + cid + '-')]
    written = (DRAFT / open_unit / '本文.md').exists()
    chap = {'chapter': cnum, 'title': ctitle, 'page': None, 'sections': []}
    toc.append(chap)
    if not written:
        chap['page'] = len(pages) + 1
        prep = {'kind': 'preparing', 'chapter': cnum + ' ' + ctitle, 'sections': [section_name(u)[0] + ' ' + section_name(u)[1] for u in sections]}
        if open_unit + '-SCENE' in selected: prep['scene'] = figure('絵', open_unit + '-SCENE', '')
        pages.append(prep)
        chap['preparing'] = True
        for u in sections: chap['sections'].append({'title': ' '.join(section_name(u)), 'page': None})
        continue
    for p in read_pages(open_unit):
        if chap['page'] is None: chap['page'] = len(pages) + 1
        pages.append({'kind': 'chapter-open', 'chapter': cnum, 'chapterTitle': ctitle, **p})
    for u in sections:
        num, title = section_name(u)
        unit_pages = read_pages(u)
        entry = {'title': num + ' ' + title, 'page': len(pages) + 1 if unit_pages else None}
        chap['sections'].append(entry)
        practice = read_practice(u)
        for p in unit_pages:
            page = {'kind': 'content', 'chapter': cnum + ' ' + ctitle, 'section': num, 'sectionTitle': title, **p}
            apply_extras(u, page); pages.append(page)
            if p['pid'] in practice:
                # 確認のあとに練習。まとめは練習の最後へ移す
                summary = [b for b in page['blocks'] if b.get('t') == 'summary']
                page['blocks'] = [b for b in page['blocks'] if b.get('t') != 'summary']
                # 練習ページの図（pid が「M1-P168-練習」の枠）は、まとめの前に置く
                pm = [m for m in extras.get(u, {}).get('media', []) if m['pid'] == p['pid'] + '-練習']
                top = [media_block(m) for m in pm if m.get('at') == 'top']; pmedia = [media_block(m) for m in pm if m.get('at') != 'top']
                pages.append({'kind': 'content', 'chapter': cnum + ' ' + ctitle, 'section': num, 'sectionTitle': title, 'pid': p['pid'] + '-練習', 'tag': '練習', 'topic': p['topic'] + ' の練習', 'blocks': top + practice[p['pid']] + pmedia + summary})
        point = DRAFT / u / 'ポイント.md'
        if unit_pages and point.exists():
            page = {'kind': 'points', 'chapter': cnum + ' ' + ctitle, 'section': num, 'sectionTitle': title, 'tag': 'ポイント', 'topic': 'ポイントとかんたんにやる方法', 'blocks': md_page(point)}
            apply_extras(u, page); pages.append(page)
    review = 'M1-' + cid + '-REVIEW'
    rp = read_pages(review)
    if rp:
        chap['sections'].append({'title': '章のまとめ', 'page': len(pages) + 1})
        for p in rp:
            page = {'kind': 'content', 'chapter': cnum + ' ' + ctitle, 'section': '章末', 'sectionTitle': '章のまとめ', **p}
            apply_extras(review, page); pages.append(page)
        # まとめの問題の図：「QUESTIONS」は最初、「QUESTIONS-MID」は問題の流れのまん中に置く
        qmedia = lambda pid: [media_block(m) for m in extras.get(review, {}).get('media', []) if m['pid'] == pid]
        for n, chunk in enumerate(question_pages(review)):
            if n == 0:
                # 「QUESTIONS-MID」が2つ以上あるときは、問題の流れを等分した位置に1つずつ置く
                mids, out, prev = qmedia('QUESTIONS-MID'), qmedia('QUESTIONS'), 0
                for k, mb in enumerate(mids, 1):
                    cut = len(chunk) * k // (len(mids) + 1)
                    while cut < len(chunk) and chunk[cut].get('t') == 'details': cut += 1
                    out += chunk[prev:cut] + [mb]; prev = cut
                chunk = out + chunk[prev:]
            pages.append({'kind': 'content', 'chapter': cnum + ' ' + ctitle, 'section': '章末', 'sectionTitle': '章のまとめ', 'tag': 'まとめの問題', 'topic': 'まとめの問題' + ('（つづき）' if n else ''), 'blocks': chunk})
# ---- 巻末（数学広場・学びをふりかえろう・力をつけよう・学びをいかそう）。原稿があるものだけ入れる ----
APPENDIX = [('M1-PLAZA', '広場', '数学広場の歩き方'), ('M1-APP1', '復習', '学びをふりかえろう'), ('M1-APP2', '力だめし', '力をつけよう'), ('M1-APP3', '活用', '学びをいかそう')]
if any(read_pages(u) for u, _, _ in APPENDIX):
    chap = {'chapter': '巻末', 'title': '数学広場', 'page': None, 'sections': []}
    toc.append(chap)
    for u, sec, title in APPENDIX:
        unit_pages = read_pages(u)
        if not unit_pages: continue
        if chap['page'] is None: chap['page'] = len(pages) + 1
        chap['sections'].append({'title': title, 'page': len(pages) + 1})
        practice = read_practice(u)
        for p in unit_pages:
            page = {'kind': 'content', 'chapter': '巻末', 'section': sec, 'sectionTitle': title, **p}
            apply_extras(u, page); pages.append(page)
            if p['pid'] in practice:
                summary = [b for b in page['blocks'] if b.get('t') == 'summary']
                page['blocks'] = [b for b in page['blocks'] if b.get('t') != 'summary']
                pm = [m for m in extras.get(u, {}).get('media', []) if m['pid'] == p['pid'] + '-練習']
                top = [media_block(m) for m in pm if m.get('at') == 'top']; pmedia = [media_block(m) for m in pm if m.get('at') != 'top']
                pages.append({'kind': 'content', 'chapter': '巻末', 'section': sec, 'sectionTitle': title, 'pid': p['pid'] + '-練習', 'tag': '練習', 'topic': p['topic'] + ' の練習', 'blocks': top + practice[p['pid']] + pmedia + summary})
pages.append({'kind': 'end'})
for n, p in enumerate(pages, 1): p['n'] = n
# 原稿の中の「P149」などは、この本の実際のページ番号に置きかえる（見つからないものは外す）
page_of = {p['pid']: p['n'] for p in pages if p.get('pid')}
def link(text):
    def sub(m):
        n = page_of.get('M1-P' + m.group(1))
        # 画面で組んだ実際のページ番号に置きかえるための目印（textbook-book.js が p.○ にする）
        return '⟦L' + str(n) + '⟧' if n else ''
    return re.sub(r'(?<![A-Za-z0-9-])P(\d{3}[a-d]?)\b', sub, text)
def relink(x):
    if isinstance(x, dict):
        for k, v in x.items():
            if k in ('x', 'caption', 'summary', 'topic') and isinstance(v, str): x[k] = link(v)
            else: relink(v)
    elif isinstance(x, list):
        for v in x: relink(v)
relink(pages)
# 空白を埋める豆知識・クイズ（節ごと。画面で組むとき、ページの下に空きがあれば入る）
fillers = {}
for unit, ex in extras.items():
    if ex.get('fillers') and unit in [u for u, _, _ in APPENDIX]:
        fillers['巻末|' + next(sec for u, sec, _ in APPENDIX if u == unit)] = ex['fillers']; continue
    m = re.match(r'M1-(C\d)-(S\d|REVIEW|OPEN)$', unit)
    if not m or not ex.get('fillers'): continue
    if m.group(2) == 'OPEN':
        fillers[next(c[1] for c in CHAPTERS if c[0] == m.group(1)) + '|扉'] = ex['fillers']; continue
    cnum = next(c[1] + ' ' + c[2] for c in CHAPTERS if c[0] == m.group(1))
    fillers[cnum + '|' + ('章末' if m.group(2) == 'REVIEW' else section_name(unit)[0])] = ex['fillers']
_common = DRAFT / '共通_本の追加.json'
if _common.exists(): fillers['共通'] = json.loads(_common.read_text(encoding='utf-8')).get('fillers', [])
book = {'id': BOOK, 'subject': '数学', 'grade': '中学1年', 'title': '数学 1', 'pageCount': len(pages), 'toc': toc, 'fillers': fillers, 'pages': pages}
import sys
data = json.dumps(book, ensure_ascii=False, separators=(',', ':'))
if '--check' in sys.argv:
    # 検証用：ファイルは書きかえず、原稿から作った内容と同じかだけを見る（ちがえば警告）
    current = (OUT / ('textbook-book-' + BOOK + '.json')).read_text(encoding='utf-8') if (OUT / ('textbook-book-' + BOOK + '.json')).exists() else ''
    print('Textbook book data: up to date with the drafts' if current == data else '⚠️ 教科書データが原稿より古い：python3 教材整理/実装/build-textbook-book.py を実行してください')
    sys.exit(0)
(OUT / ('textbook-book-' + BOOK + '.json')).write_text(data, encoding='utf-8')
shelf = {'books': [
    {'id': 'kokugo1', 'code': '国', 'subject': '国語', 'title': '国語 1', 'grade': '中学1年', 'color': '#b2453a', 'status': 'preparing'},
    {'id': 'math1', 'code': '数', 'subject': '数学', 'title': '数学 1', 'grade': '中学1年', 'color': '#1f5fa8', 'status': 'ready', 'data': '/textbook-book-math1.json', 'pageCount': len(pages)},
    {'id': 'english1', 'code': '英', 'subject': '英語', 'title': '英語 1', 'grade': '中学1年', 'color': '#2c7a4b', 'status': 'preparing'},
    {'id': 'science1', 'code': '理', 'subject': '理科', 'title': '理科 1', 'grade': '中学1年', 'color': '#6a4aa0', 'status': 'preparing'},
    {'id': 'geography', 'code': '地', 'subject': '社会', 'title': '社会 地理', 'grade': '中学', 'color': '#b7791f', 'status': 'preparing'},
    {'id': 'history', 'code': '歴', 'subject': '社会', 'title': '社会 歴史', 'grade': '中学', 'color': '#8a5a2b', 'status': 'preparing'},
    {'id': 'health', 'code': '保', 'subject': '保健体育', 'title': '保健体育', 'grade': '中学', 'color': '#c2577a', 'status': 'preparing'},
]}
def keep_other_books(shelf, out_dir):
    # 数学だけを組み直しても、作成済みの他教科を「準備中」に戻さない。
    # 参照先は固定の本IDから作り、実際に表示できるページがあるか確かめる。
    for item in shelf['books']:
        if item['id'] == 'math1': continue
        filename = 'textbook-book-' + item['id'] + '.json'
        try:
            other = json.loads((out_dir / filename).read_text(encoding='utf-8'))
        except (OSError, ValueError):
            continue
        if not isinstance(other, dict): continue
        pages = other.get('pages')
        if (other.get('id') == item['id'] and isinstance(pages, list) and pages
                and type(other.get('pageCount')) is int and other.get('pageCount') == len(pages)
                and all(isinstance(page, dict) and type(page.get('n')) is int and page.get('n') == n for n, page in enumerate(pages, 1))):
            item.update(status='ready', data='/' + filename, pageCount=len(pages))
    return shelf

keep_other_books(shelf, OUT)
(OUT / 'textbook-books.json').write_text(json.dumps(shelf, ensure_ascii=False, indent=1), encoding='utf-8')
if '--check' not in sys.argv:
    placed_path = WORK / 'メディアの置き場所.json'
    placed = json.loads(placed_path.read_text(encoding='utf-8')) if placed_path.exists() else {'media': {}}
    lines = ['# Codexへ：教科書（数学1）の画像・動画の依頼（Claude記入・自動生成）', '',
             f'このファイルは `python3 教材整理/実装/build-textbook-book.py` で作り直される。見開きコード（例：数12-13）は {placed.get("generatedAt", "未計測")} 時点の組み上がり（全{placed.get("pages", "?")}ページ）で、原稿が増えると動くことがある。最新は `node 教材整理/実装/media-pages.mjs` を実行してから作り直す。', '',
             '## Codexに最初に貼る指示（コピーして使う）', '', '```',
             'あなたはのびログの教科書（中1数学）の画像・動画担当です。',
             '教材整理/Claude_Codex共有/数学全体制作/Codexへ_画像と動画の依頼.md の項目を、上から順に作ってください。',
             '1件ごとに「見せること」を1つずつ満たし、「かくすもの」に書いた答えは画像・動画に出さないこと。',
             '教科書・ワークの写真の図や問題・人物・レイアウトをまねしないこと（数学の内容だけを使う）。',
             '完成したファイルは 教材整理/Claude_Codex共有/数学全体制作/メディア/<ID>.<拡張子> に保存する（例：M1-C1-S2-V03.mp4、M1-C2-S1-D02.svg）。',
             '保存したら python3 教材整理/実装/build-textbook-book.py を実行すると、本の画面の「準備中」の枠が自動で差しかわる。',
             '作ったものの一覧・作り方（プロンプトやスクリプト）・自分で確かめたこと（数値・ラベル・答えが出ていないこと・白黒での見え方）を、メディア/作成記録.md に書く。',
             'Claudeが内容を確認して採用を決める。本番・確認版への公開はしない。',
             '```', '',
             '## 全体のデザインの決まり',
             '- 対象は中学1年生。明るく、楽しく、すっきり。1枚（1本）で伝えることは1つ。',
             '- 色：本の色（青 #1f5fa8）を基本に、ページの種類の色（はじめに=オレンジ、しくみ=青、解き方=緑、例題=赤、確認=紫、練習=深緑、ポイント=黄）と合わせる。白黒で印刷しても、線の種類・模様・記号で区別できること。',
             '- 文字：図の中の文字は大きく（スマホで読める大きさ）、数式は − （マイナス記号 U+2212）を使う。',
             '- キャラクター「のびー」（🌱の芽の子）を出してよい。丸い顔、ふたばの葉、緑系。教えすぎず、問いかける役。',
             '- 動画：mp4（H.264）、1280×720、各項目の長さ、1本3MB以内が目安。音なしでも分かるように、画面に短い日本語の字幕。最初と最後の1秒は止まった絵。ナレーションを入れる場合は字幕と同じ内容。',
             '- 動画の作り方の例：SVG や HTML の図をアニメーションさせて、ブラウザで録画→ffmpeg で mp4 にする。数値・式は Claude の原稿どおりにし、生成AIの絵の中に数式を描かせない。',
             '- 図解：数学の図は svg（正確な図）。場面の絵は jpg（1600×900）。',
             '- 「場面の絵」は文字・数字・値札なし。人物は中学生。', '']
    for unit in sorted(extras):
        items = extras[unit].get('media', [])
        if not items: continue
        lines += ['## ' + unit, '']
        for m in items:
            pos = placed.get('media', {}).get(m['id'])
            where = (pos['spread'] + f'（p.{pos["page"]}）') if pos else {'POINTS': 'ポイントのページ', 'QUESTIONS': '章のまとめの問題の最初のページ', 'QUESTIONS-MID': '章のまとめの問題のとちゅう'}.get(m['pid'], '原稿 ' + m['pid'])
            done = next((e for e in ('mp4', 'webm', 'jpg', 'png', 'svg') if (MEDIA_DIR / (m['id'] + '.' + e)).exists()), None)
            kind = {'video': '動画', 'scene': '場面の絵'}.get(m['kind'], '図解')
            ext = 'mp4' if m['kind'] == 'video' else ('jpg' if m['kind'] == 'scene' else 'svg')
            lines += ['### ' + m['id'] + '（' + kind + '）' + ('　✅受け取り済み' if done else ''),
                      '- 置く場所：' + where, '- 題：' + m['title'], '- ねらい：' + m.get('purpose', ''), '- 見せること：' + m['content']]
            if m.get('length'): lines.append('- 長さ：' + m['length'])
            lines += ['- かくすもの：' + m.get('hide', '—'), '- ファイル名：メディア/' + m['id'] + '.' + ext, '']
    # 原稿の中にある、まだ作られていない図・絵（図の仕様.json・画像選定.md の条件で作る）
    lines += ['## 原稿にある未制作の図・絵（条件は各原稿フォルダの 図の仕様.json・画像選定.md）', '']
    for p in pages:
        for b in p.get('blocks', []):
            if b.get('t') == 'fig' and not b.get('src'):
                lines.append('- ' + (p.get('pid') or '') + '：' + ('場面の絵' if b.get('kind') == 'scene' else '図') + '「' + b.get('caption', '') + '」')
    (WORK / 'Codexへ_画像と動画の依頼.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('textbook book:', len(pages), 'pages,', len(copied), 'images,', sum(1 for p in pages if p['kind'] == 'points'), 'point pages')
