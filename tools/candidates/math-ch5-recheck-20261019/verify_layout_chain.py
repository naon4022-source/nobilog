"""Exact, content-preserving chapter-five layout delta; no arbitrary hash rebinding."""
from pathlib import Path
import copy
import hashlib
import json
import sys
import runpy

H = Path(__file__).resolve().parent
R = H.parents[2]
W = R / '教材整理/Claude_Codex共有/数学全体制作'
U = W / 'Claude原稿/M1-C5-S2'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def validate(integrated=True):
    out = H / 'layout-candidate/top'
    previous = H / 'layout-previous'
    manifest = load(out / 'candidate-result.json')
    baseline = previous / 'textbook-book-math1.json'
    assert sha(baseline) == manifest['bookBeforeSha256']
    assert manifest['bookBeforeSha256'] == load(H / 'answer-candidate-result.json')['bookAfterSha256']
    current = R / 'site-assets/textbook-book-math1.json' if integrated else out / 'textbook-book-math1.json'
    appendix = R / 'tools/candidates/math-appendix-recheck-20261021'
    later_appendix = integrated and sha(current) != manifest['bookAfterSha256']
    if later_appendix:
        current = runpy.run_path(str(appendix / 'verify_appendix_chain.py'))['validate']()
    assert sha(current) == manifest['bookAfterSha256'] == sha(out / 'textbook-book-math1.json')
    old = load(baseline)
    expected = copy.deepcopy(old)
    page = lambda pid: next(p for p in expected['pages'] if p.get('pid') == pid)
    practice = page('M1-P226-練習')
    image = next(b for b in practice['blocks'] if b.get('id') == 'M1-C5-S2-DP3')
    practice['blocks'].remove(image)
    page('M1-P225')['blocks'].insert(0, image)
    scene = {'t': 'media', 'kind': 'scene', 'id': 'M1-C5-S2-APPLY',
             'title': '模様を動かして比べる', 'src': '/textbook-book-math1-m1-c5-s2-apply.jpg'}
    page('M1-P227')['blocks'].insert(0, scene)
    rules = load(H / 'layout-candidate/annotation-compatibility.json')
    assert len(rules) == 17
    for rule in rules:
        matches = [b for b in page(rule['pid'])['blocks'] if b == rule['block']]
        assert len(matches) == 1
        matches[0].update(annotationAnchor=rule['anchor'], annotationQuote=rule['quote'])
    assert load(current) == expected, 'only diagram movement, one scene and exact marker compatibility allowed'
    assert len(expected['pages']) == 441
    source = U if integrated else out
    assert (source / '本文.md').read_bytes() == (previous / '本文.md').read_bytes()
    extra = load(previous / '本の追加.json')
    dp3 = next(m for m in extra['media'] if m['id'] == 'M1-C5-S2-DP3')
    assert dp3['pid'] == 'M1-P226-練習' and dp3['at'] == 'top'
    dp3['pid'] = 'M1-P225'
    extra['media'].append({'id': 'M1-C5-S2-APPLY', 'pid': 'M1-P227', 'kind': 'scene',
        'title': '模様を動かして比べる',
        'content': '既存本文M1-P227の市松模様と三角形のくり返しを、紙の形を動かして比べる中学生の場面。新しい設問・数値条件は追加しない。',
        'hide': '文字・数字・式・問題の答えを画像に入れない。',
        'purpose': '図形の移動を身近な模様へ結び付ける', 'at': 'top'})
    extra.setdefault('annotationCompatibility', []).extend(rules)
    assert load(source / '本の追加.json') == extra
    assert load(out / 'anchors-result.json')['anchors'] == 2724
    assert load(out / 'visibility/browser-result.json')['checks'] == 78
    if integrated:
        receipt = load(H / 'layout-integration.json')
        assert receipt['bookBeforeSha256'] == sha(baseline)
        assert receipt['bookAfterSha256'] == sha(current)
        assert sha(appendix / 'previous/build-textbook-book.py' if later_appendix else R / '教材整理/実装/build-textbook-book.py') == load(out / 'builder-change.json')['afterSha256']
        assert sha(W / 'メディア/M1-C5-S2-APPLY.png') == load(H / 'new-apply-image/generation-receipt.json')['sha256']
        assert sha(R / 'site-assets/textbook-book-math1-m1-c5-s2-apply.jpg') == sha(out / 'textbook-book-math1-m1-c5-s2-apply.jpg')
    return baseline


if __name__ == '__main__':
    validate('--candidate' not in sys.argv)
    print('Exact layout chain passed: 441 source pages, unchanged text/answers/numbers, 17 compatibility rules; current book tied to reviewed candidate')
