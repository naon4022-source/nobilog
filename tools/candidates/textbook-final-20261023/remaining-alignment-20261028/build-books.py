"""Reproduce current books and derive combined candidates in an isolated source tree."""
from pathlib import Path
import ast
import hashlib
import json
import re
import runpy
import shutil
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
REL = Path('教材整理/Claude_Codex共有')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def get(value, path):
    for key in path:
        value = value[key]
    return value


def differences(a, b, path=()):
    assert type(a) is type(b), path
    if isinstance(a, dict):
        assert a.keys() == b.keys(), path
        return sum((differences(a[k], b[k], path + (k,)) for k in a), [])
    if isinstance(a, list):
        assert len(a) == len(b), path
        return sum((differences(x, y, path + (i,)) for i, (x, y) in enumerate(zip(a, b))), [])
    return [] if a == b else [{'path': list(path), 'before': a, 'after': b}]


def main():
    isolated = HERE / 'book-build'
    assert not isolated.exists(), 'Never overwrite completed source reproduction'
    manifest = json.loads((HERE / 'manifest.json').read_text())
    rows = manifest['authors'] + manifest['scripts']
    originals = {r['file']: sha(ROOT / r['file']) for r in rows}
    assert all(originals[r['file']] == r['beforeSha256'] for r in rows)
    for subject in ['国語全体制作', '英語全体制作']:
        work = isolated / REL / subject
        for folder in ['原稿', '制作ソース']:
            shutil.copytree(ROOT / REL / subject / folder, work / folder)
        (work / 'メディア').symlink_to(ROOT / REL / subject / 'メディア', target_is_directory=True)
    out = isolated / 'site-assets'
    out.mkdir()
    books = ['kokugo1', 'english1']
    for book in books:
        shutil.copy2(ROOT / 'site-assets' / ('textbook-book-' + book + '.json'), out)
    builder_file = ROOT / '教材整理/実装/build-textbook-subject.py'
    library = runpy.run_path(str(builder_file), run_name='combined_candidate_library')
    build = library['build']
    build.__globals__['ROOT'] = isolated
    build.__globals__['OUT'] = out
    faces = [n for n in ast.walk(ast.parse(builder_file.read_text())) if isinstance(n, ast.FunctionDef) and n.name == 'face']
    assert len(faces) == 1
    namespace = {'re': re}
    exec(compile(ast.Module(body=faces, type_ignores=[]), str(builder_file), 'exec'), namespace)
    face = namespace['face']
    old_argv = sys.argv[:]
    def capture(book):
        saved = {}
        def observe(frame, event, value):
            if frame.f_code is build.__code__ and event == 'return':
                saved['text'] = frame.f_locals.get('text')
        previous = sys.getprofile()
        sys.setprofile(observe)
        try:
            return build(book), saved['text']
        finally:
            sys.setprofile(previous)
    results = []
    try:
        sys.argv = ['combined-candidate', '--check']
        baseline = {}
        for book in books:
            matches, text = capture(book)
            actual = ROOT / 'site-assets' / ('textbook-book-' + book + '.json')
            assert matches and text == actual.read_text(), book + ' baseline must reproduce'
            baseline[book] = text
        for row in rows:
            candidate = HERE / 'output' / row['file']
            assert sha(candidate) == row['afterSha256']
            shutil.copy2(candidate, isolated / row['file'])
        pairs = [(c['before'], c['after']) for row in manifest['authors'] for c in row['changes']]
        for book in books:
            same, text = capture(book)
            assert not same, 'Expected combined explanation changes'
            old, new = json.loads(baseline[book]), json.loads(text)
            text_paths = []
            def replace(value, path=()):
                if isinstance(value, dict):
                    return {k: replace(v, path + (k,)) for k, v in value.items()}
                if isinstance(value, list):
                    return [replace(v, path + (i,)) for i, v in enumerate(value)]
                if isinstance(value, str):
                    updated = value
                    for before, after in pairs:
                        updated = updated.replace(before, after)
                    if updated != value:
                        text_paths.append(list(path))
                    return updated
                return value
            expected = replace(old)
            residual = differences(expected, new)
            pose_changes = []
            for change in residual:
                path = change['path']
                assert len(path) == 7 and path[0] == 'pages' and path[2] == 'blocks' and path[4] == 'lines' and path[6] == 1, change
                original_line, current_line = get(old, path[:-1]), get(new, path[:-1])
                expected_line = get(expected, path[:-1])
                assert original_line[0] == current_line[0] == 'のびー'
                assert original_line[2] != current_line[2] and expected_line[2] == current_line[2]
                assert face(original_line[0], original_line[2]) == original_line[1]
                assert face(current_line[0], current_line[2]) == current_line[1]
                expected_line[1] = current_line[1]
                pose_changes.append(change)
            assert expected == new and text_paths
            target = HERE / 'candidate-books' / ('textbook-book-' + book + '.json')
            target.parent.mkdir(exist_ok=True)
            target.write_text(text)
            (out / target.name).write_text(text)
            matches, reproduced = capture(book)
            assert matches and reproduced == text
            results.append({'book': book, 'beforeSha256': hashlib.sha256(baseline[book].encode()).hexdigest(),
                            'candidateSha256': sha(target), 'logicalPages': len(new['pages']),
                            'changedTextPaths': text_paths, 'derivedPoseChanges': pose_changes})
    finally:
        sys.argv = old_argv
    assert all(sha(ROOT / f) == h for f, h in originals.items())
    result = {'status': 'combined candidate books reproduced; main unchanged', 'books': results,
              'builderSha256': sha(builder_file), 'originalSourcesUnchanged': originals,
              'manifestSha256': sha(HERE / 'manifest.json'),
              'scope': 'Actual unmodified builder --check. Baseline and candidates reproduce. Exact approved explanation replacement only, plus original face-selection function on those changed dialogue lines. All other book content/page metadata/questions/answers/values retained. Figures,10 movies,layout/playback,AI contexts and main integration pending.'}
    (HERE / 'book-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps([{'book': r['book'], 'textChanges': len(r['changedTextPaths']), 'poses': len(r['derivedPoseChanges']), 'pages': r['logicalPages']} for r in results]))


if __name__ == '__main__':
    main()
