"""Derive only changed DQ/DP and two English concept diagrams; main assets stay untouched."""
from pathlib import Path
import ast
import hashlib
import importlib.util
import json
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
DRAW = ROOT / '教材整理/Claude_Codex共有/教科図解'
sys.path.insert(0, str(DRAW))
import hints
import d01_english

sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
digest = lambda b: hashlib.sha256(b).hexdigest()


def unit(path):
    return next(ast.literal_eval(n.value) for n in ast.parse(path.read_text()).body
                if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'UNIT' for t in n.targets))


def main():
    out = HERE / 'figures'
    assert not out.exists(), 'Preserve completed figure derivation'
    out.mkdir()
    manifest = json.loads((HERE / 'manifest.json').read_text())
    authors = {r['file']: r for r in manifest['authors'] if not r['file'].endswith('かいわ.py')}
    topics = [
        ('国語全体制作', 'u02.py', 4, 'K1-C2-S5'),
        ('国語全体制作', 'u06.py', 0, 'K1-C6-S1'),
        ('国語全体制作', 'u07.py', 2, 'K1-C7-S3'),
        ('国語全体制作', 'u08.py', 3, 'K1-C8-S4'),
        ('英語全体制作', 'u02.py', 2, 'E1-L2-S3'),
        ('英語全体制作', 'u08.py', 1, 'E1-L8-S2'),
    ]
    results, unchanged = [], []
    def record(subject, ident, before, after):
        source = ROOT / '教材整理/Claude_Codex共有' / subject / 'メディア' / (ident + '.svg')
        current = source.read_bytes()
        if before == after:
            unchanged.append(ident)
            return
        for folder, data in [('before-render', before), ('candidate', after)]:
            target = out / folder / source.name
            target.parent.mkdir(exist_ok=True)
            target.write_bytes(data)
        results.append({'id': ident, 'sourceFigure': source.relative_to(ROOT).as_posix(), 'beforeSha256': digest(current),
                        'regeneratedBeforeSha256': digest(before), 'baselineReproduced': before == current,
                        'candidate': (out / 'candidate' / source.name).relative_to(ROOT).as_posix(), 'candidateSha256': digest(after)})
    for subject, filename, index, code in topics:
        relative = Path('教材整理/Claude_Codex共有') / subject / '原稿' / filename
        row = authors[relative.as_posix()]
        original, candidate = ROOT / relative, HERE / 'output' / relative
        assert sha(original) == row['beforeSha256'] and sha(candidate) == row['afterSha256']
        before, after = unit(original)['lessons'][index], unit(candidate)['lessons'][index]
        assert before['title'] == after['title'] and before['q'] == after['q'] and before['p'] == after['p']
        for suffix, function in [('DQ', hints.dq), ('DP', hints.dp)]:
            record(subject, code + '-' + suffix, function(code, before).encode(), function(code, after).encode())

    source = DRAW / 'd01_english.py'
    text = source.read_text()
    original_text = text
    changes = {
        'e2_3': [('一つの文に be動詞と一般動詞をいっしょに使わない。', 'この節の基本文では、like・playの前にam・are・isを足さない。')],
        'e8_2': [
            ('名詞があれば What、なければ How', 'What / How：強調する部分を見よう'),
            ('名詞がある？', '強調する部分は？'),
            ("label='ある'", "label='名詞のまとまり'"),
            ("label='ない'", "label='形容詞・副詞'"),
            ('How cute! / How kind!', 'How cute! / How kind she is!\\n後ろに主語＋動詞が続く形もある'),
        ],
    }
    for node in ast.parse(original_text).body:
        if not isinstance(node, ast.FunctionDef) or node.name not in changes:
            continue
        before = ast.get_source_segment(original_text, node)
        after = before
        for old, new in changes[node.name]:
            assert after.count(old) == 1, (node.name, old)
            after = after.replace(old, new)
        assert text.count(before) == 1
        text = text.replace(before, after)
    ast.parse(text)
    candidate_module = out / 'd01_english.py'
    candidate_module.write_text(text)
    spec = importlib.util.spec_from_file_location('candidate_english_explanation', candidate_module)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    for code in ['E1-L2-S3', 'E1-L8-S2']:
        record('英語全体制作', code + '-D01', d01_english.D(code).encode(), module.D(code).encode())
    result = {'status': 'candidate figures generated;layout/visibility not approved', 'items': results, 'unchangedSkipped': unchanged,
              'sourceModule': {'file': source.relative_to(ROOT).as_posix(), 'beforeSha256': sha(source), 'candidateSha256': sha(candidate_module), 'edits': changes},
              'hintGeneratorSha256': sha(DRAW / 'hints.py'), 'mainChanged': False,
              'remaining': ['Review baseline mismatch before any integration','Actual SVG text bounds and visual/answer hiding','Combined candidate-book playback/figure zoom','Main integration/AI image digest updates and final whole verification']}
    (out / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    assert all(r['baselineReproduced'] for r in results), 'Original figures do not reproduce;inspect before using candidate'
    print('Derived', len(results), 'changed figures;skipped', len(unchanged), 'unchanged;all baselines reproduce;main unchanged')


if __name__ == '__main__':
    main()
