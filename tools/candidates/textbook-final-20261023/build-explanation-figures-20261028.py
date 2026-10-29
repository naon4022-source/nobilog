"""Render only the three affected DP figures into this isolated candidate folder."""
from pathlib import Path
import ast
import hashlib
import json
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
SOURCE = ROOT / '\u6559\u6750\u6574\u7406/Claude_Codex\u5171\u6709/\u6559\u79d1\u56f3\u89e3'
sys.path.insert(0, str(SOURCE))
from hints import dp


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_unit(path):
    nodes = [n for n in ast.parse(path.read_text()).body if isinstance(n, ast.Assign)
             and any(isinstance(t, ast.Name) and t.id == 'UNIT' for t in n.targets)]
    assert len(nodes) == 1
    return ast.literal_eval(nodes[0].value)


def main():
    impact = json.loads((HERE / 'explanation-derived-impact-20261028.json').read_text())
    folders = ['kokugo-reading-20261027', 'kokugo-intonation-20261027',
               'kokugo-shortcuts-20261027', 'kokugo-pos-20261027',
               'english-shortcuts-20261027']
    authors = {}
    for folder in folders:
        directory = HERE / folder
        for row in json.loads((directory / 'manifest.json').read_text())['files']:
            if row['file'].endswith('.py'):
                assert row['file'] not in authors
                authors[row['file']] = (directory / 'output' / row['file'], row)
    out = HERE / 'explanation-figures-20261028'
    out.mkdir(exist_ok=False)
    rows = []
    for topic in impact['topics']:
        if not topic['affectedDP']:
            continue
        original = ROOT / topic['author']
        candidate, record = authors[topic['author']]
        assert sha(original.read_bytes()) == record['beforeSha256']
        assert sha(candidate.read_bytes()) == record['afterSha256']
        before = read_unit(original)
        after = read_unit(candidate)
        matches = [i for i, lesson in enumerate(before['lessons'])
                   if lesson['title'] == topic['title']]
        assert len(matches) == 1
        index = matches[0]
        assert before['lessons'][index]['p'] == after['lessons'][index]['p']
        assert before['lessons'][index]['ex'] == after['lessons'][index]['ex']
        old_svg = dp(topic['unit'], before['lessons'][index]).encode()
        new_svg = dp(topic['unit'], after['lessons'][index]).encode()
        figure = original.parent.parent / '\u30e1\u30c7\u30a3\u30a2' / (topic['affectedDP'] + '.svg')
        current = figure.read_bytes()
        for sub, data in [('before-render', old_svg), ('candidate', new_svg)]:
            destination = out / sub / figure.name
            destination.parent.mkdir(exist_ok=True)
            destination.write_bytes(data)
        rows.append({'id': topic['affectedDP'], 'sourceFigure': figure.relative_to(ROOT).as_posix(),
                     'currentSha256': sha(current), 'beforeRenderSha256': sha(old_svg),
                     'baselineReproduced': current == old_svg, 'candidateSha256': sha(new_svg),
                     'candidate': (out / 'candidate' / figure.name).relative_to(ROOT).as_posix(),
                     'authorCandidateSha256': record['afterSha256']})
    assert len(rows) == 3
    result = {'status': 'isolated render only; layout and answer visibility not approved',
              'items': rows, 'generatorSha256': sha((SOURCE / 'hints.py').read_bytes()),
              'noMainWrites': True, 'newMovieGenerations': 0,
              'next': 'After full5 terminal, inspect source/candidate SVG differences and rendered '
                      'text bounds. A baseline mismatch requires review, not a silent replacement.'}
    (out / 'render-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print('Rendered3 isolated SVG candidates; baseline matches', sum(r['baselineReproduced'] for r in rows))


if __name__ == '__main__':
    main()
