"""Check isolated explanation edits without importing author code or writing教材.

Run after the single whole verification finishes. This is preservation evidence,
not evidence of factual correctness, layout, audio or actual-video approval.
"""
from pathlib import Path
import ast
import hashlib
import json

ROOT = Path(__file__).resolve().parents[3]
BASE = Path(__file__).resolve().parent
FOLDERS = [
    'kokugo-reading-20261027', 'kokugo-intonation-20261027',
    'kokugo-shortcuts-20261027', 'kokugo-pos-20261027',
    'english-shortcuts-20261027',
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def unit(text):
    # Read data only: executing author modules could write generated assets.
    nodes = [n for n in ast.parse(text).body if isinstance(n, ast.Assign)
             and any(isinstance(t, ast.Name) and t.id == 'UNIT' for t in n.targets)]
    assert len(nodes) == 1, 'exactly one literal UNIT required'
    return ast.literal_eval(nodes[0].value)


def differences(a, b, at=()):
    assert type(a) is type(b), ('type changed', at)
    if isinstance(a, dict):
        assert a.keys() == b.keys(), ('keys changed', at)
        return [p for k in a for p in differences(a[k], b[k], at + (k,))]
    if isinstance(a, list):
        assert len(a) == len(b), ('list size changed', at)
        return [p for i, (x, y) in enumerate(zip(a, b))
                for p in differences(x, y, at + (i,))]
    return [] if a == b else [at]


def exact_edit(before, after, old, new, count):
    assert old and new and old != new
    assert before.count(old) == count
    assert before.replace(old, new) == after, 'unrelated source edit'


def main():
    checked = []
    for folder in FOLDERS:
        directory = BASE / folder
        manifest_path = directory / 'manifest.json'
        manifest = json.loads(manifest_path.read_text())
        for row in manifest['files']:
            relative = Path(row['file'])
            assert not relative.is_absolute() and '..' not in relative.parts
            assert relative.parts[0] == '\u6559\u6750\u6574\u7406'
            original = ROOT / relative
            prior = directory / 'before' / relative
            candidate = directory / 'output' / relative
            before_bytes, after_bytes = prior.read_bytes(), candidate.read_bytes()
            assert original.read_bytes() == before_bytes, 'original drift; rebase required'
            assert sha(before_bytes) == row['beforeSha256']
            assert sha(after_bytes) == row['afterSha256']
            old, new = row.get('old', manifest.get('old')), row.get('new', manifest.get('new'))
            before, after = before_bytes.decode(), after_bytes.decode()
            exact_edit(before, after, old, new, row['replacements'])
            # Reject arbitrary trailing code even if a semantic parser ignores it.
            try:
                exact_edit(before, after + '\n# unrelated\n', old, new, row['replacements'])
            except AssertionError:
                pass
            else:
                raise AssertionError('unrelated edit accepted')
            if relative.suffix == '.py':
                paths = differences(unit(before), unit(after))
                assert paths and all(len(p) == 4 and p[0] == 'lessons'
                                     and isinstance(p[1], int)
                                     and p[2] in ('easy', 'sum')
                                     and isinstance(p[3], int) for p in paths), paths
            else:
                a, b = json.loads(before), json.loads(after)
                paths = differences(a, b)
                assert len(paths) == 2
                assert {p[-1] for p in paths} == {'say', 'cap'}
                assert all(len(p) == 3 and p[0] == 'steps' for p in paths)
                assert paths[0][1] == paths[1][1]
                step = b['steps'][paths[0][1]]
                assert step['say'] == step['cap'], 'narration/caption differ'
            checked.append({'file': relative.as_posix(), 'candidate': candidate.relative_to(ROOT).as_posix(),
                            'beforeSha256': sha(before_bytes), 'afterSha256': sha(after_bytes),
                            'changedDataPaths': paths, 'manifestSha256': sha(manifest_path.read_bytes())})
    assert len(checked) == 20 and len({r['file'] for r in checked}) == 20
    assert sum(r['file'].endswith('.py') for r in checked) == 7
    result = {'status': 'passed', 'files': checked, 'explanationTopics': 7,
              'scope': 'Exact candidate edits; literal author data changed only in easy/sum; '
                       'questions/answers/IDs/counts/conditions retained. Scripts change a single '
                       'say/cap pair together. No main writes, media rendering or factual approval.'}
    (BASE / 'explanation-candidate-preservation-20261027.json').write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print('Explanation candidates:20 files /7 topics preserved; no main or media writes')


if __name__ == '__main__':
    main()
