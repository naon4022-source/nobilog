"""Align explanatory dialogue/steps with reviewed movies, preserving every exercise."""
from pathlib import Path
import ast
import hashlib
import json
import runpy
import shutil
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
REL = Path('教材整理/Claude_Codex共有/国語全体制作')
DEST = HERE / 'book-alignment-v3'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
CHANGES = {
    'u01.py': {
        '「〜た」で終わる文をさがす（あったこと）。': '実際に起きた出来事を述べた文をさがす（体験）。',
        '「〜と思う」で終わる文をさがす（考え）。': '筆者の判断や意見を述べた文をさがす（考え）。',
    },
    'かいわ.py': {
        '文の終わりを見てね。「〜た」は体験、「〜と思う」「〜が大切だ」は考え。まとめ：体験（〜た）と考え（〜と思う）を分けると、筆者の言いたいことが見える！': '文末は手がかり。内容を読んで、起きた出来事と筆者の判断を分けよう。まとめ：体験が、どの考えを支えているかを結びつけるんだ。',
        'まず「〜た」で終わる文に線を引こう。それが体験。': 'まず、いつ・だれに・何が起きたかが書かれた文に線を引こう。',
        '次に「〜と思う」の文をさがすんだね。': '次に、筆者がどう考えているかを、文の内容から確かめるんだね。',
    },
}


def literal(text, name):
    tree = ast.parse(text)
    return next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign)
                and any(isinstance(t, ast.Name) and t.id == name for t in n.targets))


def differences(a, b, path=()):
    assert type(a) is type(b), path
    if isinstance(a, dict):
        assert a.keys() == b.keys(), path
        return sum((differences(a[k], b[k], path + (k,)) for k in a), [])
    if isinstance(a, (list, tuple)):
        assert len(a) == len(b), path
        return sum((differences(x, y, path + (i,)) for i, (x, y) in enumerate(zip(a, b))), [])
    return [] if a == b else [{'path': list(path), 'before': a, 'after': b}]


def main():
    assert not DEST.exists(), 'Preserve earlier results; never overwrite a completed stage'
    originals = {str(p.relative_to(ROOT)): sha(p) for name in ['原稿', '制作ソース']
                 for p in (ROOT / REL / name).glob('*') if p.is_file()}
    isolated = DEST / 'build'
    work = isolated / REL
    for name in ['原稿', '制作ソース']:
        shutil.copytree(ROOT / REL / name, work / name)
    (work / 'メディア').symlink_to(ROOT / REL / 'メディア', target_is_directory=True)
    previous_author = HERE / 'output' / REL / '原稿/u01.py'
    shutil.copy2(previous_author, work / '原稿/u01.py')
    out = isolated / 'site-assets'
    out.mkdir()
    previous_book = HERE / 'candidate-book/textbook-book-kokugo1.json'
    target = out / previous_book.name
    shutil.copy2(previous_book, target)
    module = runpy.run_path(str(ROOT / '教材整理/実装/build-textbook-subject.py'), run_name='alignment_library')
    build = module['build']
    build.__globals__['ROOT'] = isolated
    build.__globals__['OUT'] = out

    def captured_build():
        captured = {}
        def observe(frame, event, value):
            if frame.f_code is build.__code__ and event == 'return':
                captured['text'] = frame.f_locals.get('text')
        previous = sys.getprofile()
        sys.setprofile(observe)
        try:
            return build('kokugo1'), captured['text']
        finally:
            sys.setprofile(previous)

    old_argv = sys.argv[:]
    rows = []
    try:
        sys.argv = ['alignment-library', 'kokugo1', '--check']
        equal, text = captured_build()
        assert equal and text == previous_book.read_text(), 'Reproduce previous reviewed candidate first'
        for filename, replacements in CHANGES.items():
            source = work / '原稿' / filename
            before = source.read_text()
            after = before
            for old, new in replacements.items():
                assert after.count(old) == 1, (filename, old)
                after = after.replace(old, new)
            name = 'UNIT' if filename == 'u01.py' else 'TALK'
            diff = differences(literal(before, name), literal(after, name))
            expected = ([["lessons", 0, "ex", "steps", i] for i in [0, 1]]
                        if name == 'UNIT' else [['聞くということ', 'talk', 7, 1],
                                               ['聞くということ', 'talk2', 1, 1],
                                               ['聞くということ', 'talk2', 2, 1]])
            assert [d['path'] for d in diff] == expected, diff
            assert all(replacements[d['before']] == d['after'] for d in diff)
            output = DEST / 'output' / REL / '原稿' / filename
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(after)
            source.write_text(after)
            rows.append({'file': (REL / '原稿' / filename).as_posix(),
                         'beforeSha256': hashlib.sha256(before.encode()).hexdigest(),
                         'afterSha256': sha(output), 'changes': diff})
        equal, text = captured_build()
        assert not equal, 'Expected candidate differs from prior candidate'
        previous_data = json.loads(previous_book.read_text())
        data = json.loads(text)
        diff = differences(previous_data, data)
        replacements = {k: v for values in CHANGES.values() for k, v in values.items()}
        assert len(diff) == 5 and all(replacements[d['before']] == d['after'] for d in diff), diff
        book = DEST / previous_book.name
        book.write_text(text)
        target.write_text(text)
        equal, rebuilt = captured_build()
        assert equal and rebuilt == text, 'Exact candidate reproduction'
    finally:
        sys.argv = old_argv
    assert all(sha(ROOT / f) == h for f, h in originals.items()), 'Original source changed'
    receipt = {'status': 'candidate aligned; exercises preserved; main unchanged',
               'previousBookSha256': sha(previous_book), 'bookSha256': sha(book),
               'logicalPages': len(data['pages']), 'files': rows, 'bookChanges': diff,
               'originalSourcesUnchanged': originals,
               'retainedMovies': {id: sha(HERE / 'videos-caption-v2' / id / 'candidate.mp4')
                                  for id in ['K1-C1-S1-V01', 'K1-C1-S1-VP']},
               'remaining': ['actual reader layout/playback of aligned book', 'main integration and final whole verification'],
               'scope': 'Five explanatory strings only; all exercise questions/answers/values/IDs and metadata unchanged. Previous candidate and completed movies preserved.'}
    (DEST / 'result.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print('Aligned5 explanatory leaves; all exercises and original sources preserved')


if __name__ == '__main__':
    main()
