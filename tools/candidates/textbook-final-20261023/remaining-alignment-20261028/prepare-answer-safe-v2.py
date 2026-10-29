"""Replace only teaching examples that disclose unchanged later exercise answers."""
from pathlib import Path
import copy
import hashlib
import json
import runpy
import shutil

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = HERE / 'answer-safe-v2'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
helper = runpy.run_path(str(HERE / 'prepare.py'), run_name='answer_safe_helpers')
value, differences, replace_literal = (helper[n] for n in ['value', 'differences', 'replace_literal'])


def main():
    assert not OUT.exists(), 'Keep previous successful and partial attempts intact'
    OUT.mkdir()
    old = json.loads((HERE / 'manifest.json').read_text())
    plan = json.loads((HERE / 'promotion-plan-media64.json').read_text())
    picks = {r['file']: r for r in plan['files'] if r['kind'] == 'author-or-script'}
    assert len(picks) == 19
    edits = {
        '国語全体制作/原稿/u08.py': [
            ('自立語・活用しない：**名詞**（主語になる）、**副詞**（主に用言をくわしくする：ゆっくり）、**連体詞**（体言だけをくわしくする：この・大きな）、**接続詞**（だから・しかし）、**感動詞**（はい・ああ）。',
             '自立語・活用しない：**名詞**（主語になる）、**副詞**（主に用言をくわしくする：ゆっくり）、**連体詞**（体言だけをくわしくする：この・小さな）、**接続詞**（だから・しかし）、**感動詞**（はい・ああ）。'),
            ('「この・その・大きな」は連体詞（名詞の前だけにくる）。', '「この・その・小さな」は連体詞（名詞の前だけにくる）。'),
            ('「大きな」を形容詞と答える（正しくは連体詞）。', '例題の「小さな」を形容詞と答える（正しくは連体詞）。'),
        ],
        '国語全体制作/原稿/かいわ.py': [
            ('「大きな」と「大きい」がちがうのはなんで？', '例題の「小さな」と、「白い」は同じ品詞？'),
            ('「大きい」は形が変わる形容詞、「大きな」は変わらない連体詞。ひっかけ問題の常連だよ！ まとめ：「自立？→活用？→はたらき？」の三段で分けよう。',
             '「白い」は「白く」のように形が変わる形容詞。「小さな」は変わらない連体詞だよ。まとめ：「自立？→活用？→はたらき？」の三段で分けよう。'),
        ],
        '英語全体制作/原稿/u08.py': [
            ('例：How cute! / How kind!', '例：How cold! / How kind!'),
        ],
        '英語全体制作/原稿/かいわ.py': [
            ('「なんてかわいいの！」は？', '例題の「なんて寒いの！」は？'),
            ('How cute! かわいさを表す形容詞cuteをHowで強めているんだ。', 'How cold! 寒さを表す形容詞coldをHowで強めているんだ。'),
        ],
    }
    author_rows, script_rows, changes = [], [], []
    for group, target in [('authors', author_rows), ('scripts', script_rows)]:
        for prior in old[group]:
            row = copy.deepcopy(prior)
            selected = picks[row['file']]
            source = Path(selected['candidate'])
            assert sha(source) == selected['afterSha256']
            assert sha(ROOT / row['file']) == row['beforeSha256']
            text = source.read_text()
            relative = row['file'].split('教材整理/Claude_Codex共有/')[1]
            before = text
            for original, replacement in edits.get(relative, []):
                text = replace_literal(text, original, replacement)
            if group == 'authors':
                name = 'TALK' if relative.endswith('/かいわ.py') else 'UNIT'
                original_value = value((ROOT / row['file']).read_text(), name)
                prior_value, current = value(before, name), value(text, name)
                delta = differences(prior_value, current)
                assert len(delta) == len(edits.get(relative, [])), relative
                if name == 'UNIT':
                    for a, b in zip(prior_value['lessons'], current['lessons']):
                        for field in ['q', 'p', 'ex']:
                            assert a[field] == b[field], (relative, field)
                else:
                    for title, item in prior_value.items():
                        assert item.get('talk2') == current[title].get('talk2'), title
                row['changes'] = differences(original_value, current)
                changes += [dict(file=row['file'], **c) for c in delta]
            row['afterSha256'] = hashlib.sha256(text.encode()).hexdigest()
            destination = OUT / 'output' / row['file']
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(text)
            target.append(row)
    assert len(changes) == 8
    manifest = dict(status='answer-safe explanation successor; questions/answers/numbers unchanged; main untouched', authors=author_rows, scripts=script_rows,
                    changesFromPriorCandidate=changes, priorManifestSha256=sha(HERE / 'manifest.json'),
                    authorization='User authorized corrections to all confusing/incorrect explanations; exercise statements, answers, values and worked examples are preserved.',
                    scope='Four teaching source files only, 8 explanation leaves. Existing worked examples 小さな/白い and How cold replace direct later-exercise examples. No movie/audio regeneration.')
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    build = runpy.run_path(str(HERE / 'build-books.py'), run_name='answer_safe_book_library')['main']
    build.__globals__['HERE'] = OUT
    build()
    print('8 explanation leaves changed; 19 source candidates preserved; books reproduced')


if __name__ == '__main__':
    main()
