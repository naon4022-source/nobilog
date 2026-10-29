"""Prepare chapter2 explanatory alignment and reuse approved tools without main edits."""
from pathlib import Path
import ast
import hashlib
import json
import shutil

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PRIOR = HERE.parent / 'kokugo-reading-20261027'
REL = Path('教材整理/Claude_Codex共有/国語全体制作/原稿')
DEST = HERE / 'alignment-v2'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads(p.read_text())


def literal(text, name):
    return next(ast.literal_eval(n.value) for n in ast.parse(text).body if isinstance(n, ast.Assign)
                and any(isinstance(t, ast.Name) and t.id == name for t in n.targets))


def diff(a, b, path=()):
    assert type(a) is type(b)
    if isinstance(a, dict):
        assert a.keys() == b.keys()
        return sum((diff(a[k], b[k], path + (k,)) for k in a), [])
    if isinstance(a, (list, tuple)):
        assert len(a) == len(b)
        return sum((diff(x, y, path + (i,)) for i, (x, y) in enumerate(zip(a, b))), [])
    return [] if a == b else [{'path': list(path), 'before': a, 'after': b}]


def main():
    assert not DEST.exists(), 'Preserve completed preparation'
    DEST.mkdir()
    base = load(HERE / 'manifest.json')
    replacements = [
        {'old': base['old'], 'new': base['new']},
        {'old': '**イントネーション**：文の終わりの上げ下げ。「行く？」（上がる＝質問）と「行く。」（下がる）。',
         'new': '**イントネーション**：文全体の音の高低の変化。たとえば「行く？」の文末を上げ、質問の気持ちを表す。'},
        {'old': '質問かどうかは、文の終わりが上がるかで判断する。',
         'new': '文末の上げ下げを手がかりにし、文の内容や前後の話も確かめる。'},
        {'old': 'それはイントネーション！ 文の最後を上げると質問になる。',
         'new': 'たとえば「いく？」は、文末を上げて質問の気持ちを表せるね。文全体の音の高低の変化が、イントネーションなんだ。'},
    ]
    files = []
    for name, variable, edits, expected in [
        ('u02.py', 'UNIT', replacements[:3], [['lessons', 4, 'keys', 2, 1, 1], ['lessons', 4, 'sum', 2], ['lessons', 4, 'easy', 2]]),
        ('かいわ.py', 'TALK', replacements[3:], [['構成を考えて話す・日本語の音声', 'talk', 3, 1]]),
    ]:
        source = ROOT / REL / name
        before = source.read_text()
        after = before
        for r in edits:
            assert after.count(r['old']) == 1
            after = after.replace(r['old'], r['new'])
        changes = diff(literal(before, variable), literal(after, variable))
        # The dialogue's speaker tuple index is checked from the actual source below.
        if variable == 'TALK':
            assert len(changes) == 1 and changes[0]['path'][0] == expected[0][0] and changes[0]['path'][1] == 'talk' and changes[0]['path'][-1] == 1
        else:
            assert [r['path'] for r in changes] == expected, changes
        output = DEST / 'output' / REL / name
        backup = DEST / 'before' / REL / name
        output.parent.mkdir(parents=True, exist_ok=True)
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, backup)
        output.write_text(after)
        files.append({'file': (REL / name).as_posix(), 'beforeSha256': sha(source), 'afterSha256': sha(output), 'changes': changes})
    manifest = {'status': 'aligned explanation candidate only; main unchanged', 'files': files,
                'replacements': replacements, 'primarySource': base['source'],
                'scope': 'Four explanatory leaves only; full UNIT/TALK AST comparison preserves all other fields, exercises, answers, values and IDs. Previous chapter1 current dialogue retained.'}
    (DEST / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

    derived = []
    def clone(name, edits):
        source = PRIOR / name
        text = source.read_text()
        for before, after in edits:
            assert text.count(before) == 1, (name, before)
            text = text.replace(before, after)
        target = HERE / name
        assert not target.exists(), name
        target.write_text(text)
        derived.append({'file': name, 'source': source.relative_to(ROOT).as_posix(), 'sourceSha256': sha(source), 'sha256': sha(target), 'edits': [{'before': a, 'after': b} for a, b in edits]})

    clone('build-videos.py', [
        ("{'K1-C1-S1-V01','K1-C1-S1-VP'}", "{'K1-C2-S5-VP'}"),
        ('Build two isolated chapter1 corrections', 'Build the isolated chapter2 intonation correction'),
        ('two candidates generated; main unchanged', 'one candidate generated; main unchanged'),
    ])
    clone('scene.js', [("point:'文末だけで決めない'", "point:'この節のポイント'")])
    clone('verify-media.py', [
        ('these two candidates', 'this chapter2 candidate'),
        ("['K1-C1-S1-V01','K1-C1-S1-VP']", "['K1-C2-S5-VP']"),
        ("{'K1-C1-S1-V01','K1-C1-S1-VP'}", "{'K1-C2-S5-VP'}"),
    ])
    clone('verify-scene.mjs', [
        ("['K1-C1-S1-V01','K1-C1-S1-VP']", "['K1-C2-S5-VP']"),
        ('15 logical scene screenshots', 'all logical scene screenshots'),
        ('Chapter1 scene preflight:2 scenesets', 'Chapter2 scene preflight:1 sceneset'),
    ])
    # The real book builder remains unchanged; this wrapper also applies the dialogue candidate.
    clone('build-book.py', [
        ("(HERE/'manifest.json')", "(HERE/'alignment-v2/manifest.json')"),
        ("candidate=HERE/'output'/row['file']", "candidate=HERE/'alignment-v2/output'/row['file']"),
        ("shutil.copy2(candidate,isolated/row['file'])", "shutil.copy2(candidate,isolated/row['file'])\n        for extra in manifest['files'][1:]:\n            extra_file=HERE/'alignment-v2/output'/extra['file'];assert sha(extra_file)==extra['afterSha256'];shutil.copy2(extra_file,isolated/extra['file'])"),
        ("text=value.replace(manifest['old'],manifest['new'])", "text=value\n                for replacement in manifest['replacements']:text=text.replace(replacement['old'],replacement['new'])"),
    ])
    (DEST / 'tools.json').write_text(json.dumps({'status': 'scoped tool derivatives prepared; scene refinement/validation pending', 'files': derived, 'mainChanged': False}, ensure_ascii=False, indent=2) + '\n')
    print('Prepared4 aligned explanation leaves and5 scoped tool derivatives; no main edits')


if __name__ == '__main__':
    main()
