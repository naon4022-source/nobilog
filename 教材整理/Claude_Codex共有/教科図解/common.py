"""教科書データの読み出し（Claude）。build-textbook-subject.py と同じ順番・同じIDで節を回す。"""
import runpy, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[3]
BUILD = runpy.run_path(str(ROOT / '教材整理/実装/build-textbook-subject.py'), run_name='lib')
SUBJECTS = BUILD['SUBJECTS']; soft = BUILD['soft']
SHARE = ROOT / '教材整理/Claude_Codex共有'
def lessons(book):
    S = SUBJECTS[book]; SRC = SHARE / S['dir'] / '原稿'
    units = [runpy.run_path(str(f))['UNIT'] for f in sorted(SRC.glob('u*.py'))]
    for ui, U in enumerate(units, 1):
        app = U.get('appendix'); ccode = f"{S['code']}-{U.get('code') or ('APP' if app else 'C%d' % ui)}"
        for si, L in enumerate(U['lessons'], 1):
            yield f'{ccode}-S{si}', U, L
def media(book): p = SHARE / SUBJECTS[book]['dir'] / 'メディア'; p.mkdir(exist_ok=True); return p
SPLIT = re.compile(r'[、。・→／/（）()「」『』：:　\s,，＝=]+')
def answer_tokens(qs):
    toks = set()
    for q in qs:
        a = q[1] if isinstance(q[1], str) else ' '.join(q[1])
        a = a.replace('**', '')
        for t in SPLIT.split(a):
            t = t.strip('.。!?！？')
            if len(t) >= 2 and not re.fullmatch(r'[ぁ-ん]{1,3}', t): toks.add(t)
    return sorted(toks, key=len, reverse=True)
class Masker:
    """答えになる言葉を、図の中で最初に出てくる1か所だけ（？）にする（全部かくすと読めなくなるため）"""
    def __init__(self, toks): self.toks = toks; self.used = set()
    def __call__(self, s):
        s = s.replace('**', '')
        for t in self.toks:
            if t in self.used or t not in s: continue
            if any(t in u for u in self.used): continue   # 長い答えの一部は、もうかくした
            s = s.replace(t, '（？）', 1); self.used.add(t)
        return re.sub(r'(（？）)+', '（？）', s)
def mask(s, toks): return s.replace('**', '')
