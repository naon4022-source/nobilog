"""Align remaining explanation sources without editing main or previously approved candidates."""
from pathlib import Path
import ast
import hashlib
import json

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
T = HERE.parent
SHARE = Path('教材整理/Claude_Codex共有')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads(p.read_text())


def value(text, name):
    tree = ast.parse(text)
    result = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign)
                  and any(isinstance(t, ast.Name) and t.id == name for t in n.targets))
    # Later chapters are literal TALK.update({...}) blocks in the real source.
    for node in tree.body:
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
            call = node.value
            if isinstance(call.func, ast.Attribute) and isinstance(call.func.value, ast.Name) and call.func.value.id == name and call.func.attr == 'update':
                assert len(call.args) == 1 and not call.keywords
                result.update(ast.literal_eval(call.args[0]))
    return result


def differences(a, b, path=()):
    assert type(a) is type(b), path
    if isinstance(a, dict):
        assert a.keys() == b.keys(), path
        return sum((differences(a[k], b[k], path + (k,)) for k in a), [])
    if isinstance(a, (list, tuple)):
        assert len(a) == len(b), path
        return sum((differences(x, y, path + (i,)) for i, (x, y) in enumerate(zip(a, b))), [])
    return [] if a == b else [{'path': list(path), 'before': a, 'after': b}]


def replace_literal(text, old, new):
    nodes = [n for n in ast.walk(ast.parse(text)) if isinstance(n, ast.Constant) and n.value == old]
    assert len(nodes) == 1, old
    node = nodes[0]
    lines = text.encode().splitlines(keepends=True)
    start = sum(map(len, lines[:node.lineno - 1])) + node.col_offset
    end = sum(map(len, lines[:node.end_lineno - 1])) + node.end_col_offset
    data = text.encode()
    assert ast.literal_eval(data[start:end].decode()) == old
    return (data[:start] + repr(new).encode() + data[end:]).decode()


def main():
    assert not (HERE / 'manifest.json').exists(), 'Never overwrite a completed candidate'
    edits = {}
    def add(file, old, new):
        assert old != new
        edits.setdefault(file, []).append((old, new))

    for folder in ['kokugo-shortcuts-20261027', 'kokugo-pos-20261027', 'english-shortcuts-20261027']:
        for row in load(T / folder / 'manifest.json')['files']:
            if row['file'].endswith('.py'):
                document = load(T / folder / 'manifest.json')
                add(row['file'], row.get('old', document.get('old')), row.get('new', document.get('new')))
    intonation = load(T / 'kokugo-intonation-20261027/alignment-v2/manifest.json')
    for row in intonation['files']:
        for change in row['changes']:
            add(row['file'], change['before'], change['after'])

    jp_talk = str(SHARE / '国語全体制作/原稿/かいわ.py')
    source = (ROOT / jp_talk).read_text()
    talk = value(source, 'TALK')
    matches = [text for section in talk.values() for _, text in section.get('talk', []) if 'まとめ：一字で意味が通じたら' in text]
    assert len(matches) == 1
    old = matches[0]
    add(jp_talk, old, old.replace('まとめ：一字で意味が通じたら訓、通じなければ音。', 'まとめ：意味が通じるかだけで決めず、辞典で音と訓を確かめよう。'))
    add(jp_talk, '言い切りの形にしてみて。ウ段で終われば動詞、「い」なら形容詞、「だ」なら形容動詞。',
        'まず活用する自立語かを確かめてから、言い切りの形を見よう。動詞はウ段、形容詞は「い」、形容動詞は「だ」で終わるよ。')

    en2 = str(SHARE / '英語全体制作/原稿/u02.py')
    add(en2, '英語の文には「be動詞の文」と「一般動詞の文」の二種類がある。どちらか一つだけを使うのがルールだよ。',
        'この節の基本文では、be動詞の文と一般動詞の文を分けて考えよう。疑問文や否定文の作り方も違うよ。')
    add(en2, '一つの文に be動詞と一般動詞をいっしょに使わない。', 'この節の基本文では、like・playの前にam・are・isを足さない。')
    add(en2, 'be動詞と一般動詞は、疑問文・否定文の作り方がちがう。いっしょに使わない。', 'この節の基本文では、be動詞と一般動詞の文を分けて、疑問文・否定文を作る。')
    add(en2, '1・2・3日だけ特別（first・second・third）。あとは th をつける。',
        '日付はthだけではない。例題の23日はtwenty-third（23rd）。正しいつづりと読み方を確かめよう。')

    en8 = str(SHARE / '英語全体制作/原稿/u08.py')
    add(en8, '後ろに名詞があれば What、形容詞だけなら How。これだけで使い分けられるよ。',
        'この節では、名詞のまとまりはWhat、形容詞や副詞はHowで強める。強調する部分を見よう。')
    add(en8, '名詞があれば What、なければ How を選ぶ分かれ道の図', 'Whatで強める名詞のまとまりと、Howで強める形容詞・副詞を比べる図')
    add(en8, 'How ＋ 形容詞（副詞）!', 'How ＋ 形容詞（副詞）! （後ろに主語＋動詞を続ける形もある）')
    add(en8, '名詞があるか確かめる：①apple あり、②なし。', '強調するまとまりを確かめる：①big apple、②cold。')
    add(en8, '名詞あり→ What a 〜!、なし→ How 〜!', 'この例では、①はWhat a＋形容詞＋名詞、②はHow＋形容詞の形にする。')

    en_talk = str(SHARE / '英語全体制作/原稿/かいわ.py')
    et = value((ROOT / en_talk).read_text(), 'TALK')
    when = et['When 〜? と be動詞・一般動詞の整理']['talk']
    old = next(text for _, text in when if text.startswith('1つの文には'))
    add(en_talk, old, old.replace('1つの文には、どちらか1つだけ。', 'この節の基本文では、like・playの前にam・are・isを足さないよ。'))
    old = next(text for _, text in when if '1つの文に動詞の種類は1つ！' in text)
    add(en_talk, old, old.replace('1つの文に動詞の種類は1つ！', 'この節のbe動詞と一般動詞の文を、分けて練習しよう！'))
    for old, new in [
        ('What a big dog! 名詞があるときは What を使うよ。', 'What a big dog! big dogという名詞のまとまりをWhatで強めているよ。'),
        ('How cute! 形容詞だけのときは How を使うんだ。', 'How cute! かわいさを表す形容詞cuteをHowで強めているんだ。'),
        ('うん！ まとめ：後ろに名詞があれば What、形容詞だけなら How。最後は「!」！', 'うん！ まとめ：強調する部分を見よう。この節では名詞のまとまりはWhat、形容詞・副詞はHow。最後は「!」！'),
        ('まず、それぞれに名詞があるかどうか確かめよう。', 'まず、何を強調するのか確かめよう。①はbig appleというまとまり、②はcoldだね。'),
        ('そう。名詞があれば What、なければ How。最後に「!」をつけよう。', 'そう。この例では①はWhat a＋形容詞＋名詞、②はHow＋形容詞の形を使う。最後に「!」をつけよう。'),
    ]:
        add(en_talk, old, new)

    results = []
    all_pairs = [pair for pairs in edits.values() for pair in pairs]
    for file, pairs in edits.items():
        original = ROOT / file
        before = original.read_text()
        after = before
        for old, new in pairs:
            after = replace_literal(after, old, new)
        name = 'TALK' if file.endswith('かいわ.py') else 'UNIT'
        changes = differences(value(before, name), value(after, name))
        assert len(changes) == len(pairs)
        for change in changes:
            path = change['path']
            if name == 'UNIT':
                assert path[0] == 'lessons' and path[2] in ['easy', 'easy1', 'sum', 'keys', 'diagram', 'ex']
                if path[2] == 'ex':
                    assert path[3] == 'steps'
            else:
                assert path[1] in ['talk', 'talk2'] and path[-1] == 1
        backup, output = HERE / 'before' / file, HERE / 'output' / file
        backup.parent.mkdir(parents=True, exist_ok=True)
        output.parent.mkdir(parents=True, exist_ok=True)
        backup.write_text(before)
        output.write_text(after)
        results.append({'file': file, 'beforeSha256': sha(original), 'afterSha256': sha(output), 'changes': changes})

    # Update paired narration/captions in candidate scripts; never touch problem/answer steps.
    scripts = []
    for folder in ['kokugo-intonation-20261027', 'kokugo-shortcuts-20261027', 'kokugo-pos-20261027', 'english-shortcuts-20261027']:
        for row in load(T / folder / 'manifest.json')['files']:
            if not row['file'].endswith('.json'):
                continue
            original = ROOT / row['file']
            data = load(original)
            changed = json.loads(json.dumps(data))
            indices = []
            for i, step in enumerate(changed['steps']):
                assert step['say'] == step['cap']
                text = step['say']
                for old, new in all_pairs:
                    text = text.replace(old, new)
                if text != step['say']:
                    assert not step['say'].startswith(('問題はこれ', '答え'))
                    step['say'] = step['cap'] = text
                    indices.append(i)
            assert indices, row['file']
            output = HERE / 'output' / row['file']
            backup = HERE / 'before' / row['file']
            output.parent.mkdir(parents=True, exist_ok=True)
            backup.parent.mkdir(parents=True, exist_ok=True)
            backup.write_bytes(original.read_bytes())
            output.write_text(json.dumps(changed, ensure_ascii=False, indent=1) + '\n')
            for c in differences(data, changed):
                assert c['path'][0] == 'steps' and c['path'][-1] in ['say', 'cap']
            scripts.append({'file': row['file'], 'beforeSha256': sha(original), 'afterSha256': sha(output), 'changedSteps': indices})
    assert len(scripts) == 11
    assert all(sha(ROOT / r['file']) == r['beforeSha256'] for r in results + scripts)
    references = [
        {'url': 'https://dictionary.cambridge.org/us/grammar/british-grammar/exclamations.', 'status': 'directly read', 'supports': 'What+noun phrase;How+adjective/adverb may be followed by subject+verb. Previous403 hold resolved for these basic forms.'},
        {'url': 'https://assets.cambridge.org/97805217/49237/excerpt/9780521749237_excerpt.pdf', 'status': 'directly read;page1', 'supports': 'Ordinal examples21st22nd23rd refute the only1/2/3-exceptions shortcut. Existing lesson23rd example preserved.'},
        {'url': 'https://dictionary.cambridge.org/grammar/british-grammar/number', 'status': '403;not directly read;not relied on'},
    ]
    receipt = {'status': 'aligned independent source candidates; main/media unchanged', 'authors': results, 'scripts': scripts,
               'counts': {'authorFiles': len(results), 'explanationLeaves': sum(len(r['changes']) for r in results), 'scriptFiles': len(scripts), 'pairedStepChanges': sum(len(r['changedSteps']) for r in scripts)},
               'references': references, 'scope': 'Remaining6 explanation topics only. Whole UNIT/TALK/JSON comparison preserves all questions,answers,values,IDs and conditions; only explanatory fields and paired say/cap change. Existing chapter1 main corrections retained in base dialogue. Candidate2 audio may be reused only if exact source/timing matches.',
               'remaining': ['semantic/visual source review of expanded candidates', 'regenerate combined books and only affected diagrams', 'render/review currently referenced remaining10 videos;do not render unreferenced E1-L2-S3-VP', 'main integration/context/catalog and final whole verification'], 'globalCompletionPercent': None}
    (HERE / 'manifest.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(receipt['counts'], ensure_ascii=False))


if __name__ == '__main__':
    main()
