"""Exact appendix relocation and reviewed source/video chain; does not decode again."""
from pathlib import Path
import copy, hashlib, json
H=Path(__file__).resolve().parent;R=H.parents[2]
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def validate():
    out=H/'candidate';book=R/'site-assets/textbook-book-math1.json';baseline=H/'previous/textbook-book-math1.json'
    manifest=load(H/'book-candidate-result.json')
    assert sha(baseline)==manifest['bookBeforeSha256']
    assert sha(book)==manifest['bookAfterSha256']==sha(out/book.name)
    old=load(baseline);new=load(book)
    expected = copy.deepcopy(old)
    p = next(p for p in expected['pages'] if p.get('pid') == 'M1-P387')
    figure = next(b for b in p['blocks'] if b.get('src') == '/textbook-book-math1-m1-app3-fig07.svg')
    heading = next(b for b in p['blocks'] if b.get('t') == 'h3' and b.get('x') == '手順')
    steps = next(b for b in p['blocks'] if b.get('t') == 'ol')
    movie = next(b for b in p['blocks'] if b.get('id') == 'M1-APP3-V03')
    for b in [figure, heading, steps, movie]:
        p['blocks'].remove(b)
    q = next(i for i, b in enumerate(p['blocks']) if b.get('x', '').startswith('**問1**'))
    answer = p['blocks'][q + 1]
    assert answer['t'] == 'details' and answer['summary'] == '答え'
    answer['body'].extend([figure, heading, steps, movie])
    def walk(blocks):
        for block in blocks:
            yield block
            if block.get('t') == 'details':
                yield from walk(block.get('body', []))
    rules = load(out / 'annotation-compatibility.json')
    assert len(rules) == 9
    for rule in rules:
        matches = [b for b in walk(p['blocks']) if b == rule['block']]
        assert len(matches) == 1
        matches[0].update(annotationAnchor=rule['anchor'], annotationQuote=rule['quote'])
    assert expected == new, 'every other source page, original block and quantity must remain exact'
    assert len(new['pages']) == 441
    assert [a.get('pid') for a, b in zip(old['pages'], new['pages']) if a != b] == ['M1-P387']
    U=R/'教材整理/Claude_Codex共有/数学全体制作/Claude原稿/M1-APP3'
    for name in ['本文.md','本の追加.json']:assert sha(U/name)==sha(out/name)
    for name in ['answer-placement-candidate.json','annotation-support-candidate.json']:
        for item in load(out/name)['files']:
            assert item['afterSha256']==sha(H/item['candidate'])
            import runpy
            predecessor=runpy.run_path(str(R/'tools/candidates/textbook-final-20261023/reviewed_changes.py'))['before_zoom_file'](item['file'])
            later=R/'tools/candidates/vertical-fractions-20261021/textbook-book-change.json'   # 2026-10-21 Claude：縦の分数の後日の変更（記録した置きかえだけ）
            if later.exists() and load(later)['file']==item['file'] and sha(predecessor)==load(later)['afterSha256']:
                change=load(later);assert change['beforeSha256']==item['afterSha256'];text=(H/item['candidate']).read_text(encoding='utf-8')
                for a,b in change['replacements']:assert text.count(a)==1;text=text.replace(a,b)
                assert text.encode('utf-8')==predecessor.read_bytes()
            else:assert sha(predecessor)==item['afterSha256']
    movie=out/'M1-APP2-V01/M1-APP2-V01.mp4';audit=load(movie.parent/'actual-shots/実動画の点検.json')
    assert audit['visualReview']['result']=='passed' and audit['visualReview']['reviewedSamples']==32
    assert sha(movie)==audit['sha256']
    S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース';M=S.parent
    assert sha(M/movie.name)==sha(R/'site-assets/textbook-book-math1-m1-app2-v01.mp4')==audit['sha256']
    assert sha(S/'M1-APP2-V01.html')==sha(out/'M1-APP2-V01.html')
    assert next(x for x in load(S/'依頼台帳_1件ずつ.json') if x['id']=='M1-APP2-V01')['sha256']==audit['sha256']
    for report in ['candidate-markers-result.json','closed-answer-browser-result.json','all-media-browser-result.json','unchanged-av-result.json']:assert load(H/report)['status']=='passed'
    return baseline
if __name__=='__main__':
    validate();print('Appendix exact integration: only P387 answer placement, inherited markers and reviewed net correction; prior book preserved')
