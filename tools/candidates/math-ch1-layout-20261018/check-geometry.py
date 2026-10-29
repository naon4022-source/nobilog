"""Check measured SVG geometry, not guessed string lengths. No shared data writes."""
import json, pathlib, sys, xml.etree.ElementTree as ET

here = pathlib.Path(__file__).resolve().parent
extra = '--handed-off' in sys.argv
prefix = 'handed-off-' if extra else ''
before = json.loads((here / (prefix+'before/geometry.json')).read_text())
after = json.loads((here / (prefix+'candidate/geometry.json')).read_text())
assert len(after) == len(before) == (2 if extra else 18)
results = []
for old, new in zip(before, after):
    assert old['id'] == new['id']
    assert [t['text'] for t in old['texts']] == [t['text'] for t in new['texts']]
    for side in ('previous', 'svg'):
        tree = ET.parse(here / side / (new['id'] + '.svg'))
        assert tree.getroot().get('viewBox') == '0 0 1600 900'
    texts = {t['text']: t for t in new['texts']}
    if new['id'] == 'M1-C1-S2-D07':
        rects = [r['box'] for r in new['rects'] if r['attrs'].get('stroke') in ('#1f5fa8', '#397052')]
        ranges = [('(−3)²', 0, 4), ('(−3)×(−3)', 0, 9), ('−3²', 1, 3), ('−(3×3)', 1, 6)]
        for r, (value, start, end) in zip(rects, ranges):
            for char in texts[value]['chars'][start:end]:
                assert char['x'] > r['x'] + 7 and char['x'] + char['width'] < r['x'] + r['width'] - 7
                assert char['y'] > r['y'] + 7 and char['y'] + char['height'] < r['y'] + r['height'] - 7
        assert texts['(−3)²']['chars'][4]['x'] > rects[0]['x'] + rects[0]['width'] + 10
        for i, value in [(2, '−3²'), (3, '−(3×3)')]:
            minus = texts[value]['chars'][0]
            assert minus['x'] + minus['width'] < rects[i]['x'] - 10
        results.append({'id': new['id'], 'result': '4 intended ranges inside frames; exponent/leading minuses outside, visible and separate'})
    elif new['id'] == 'M1-C1-S2-E02':
        label = texts['① ( )']['box']
        outer = next(r['box'] for r in new['rects'] if r['attrs'].get('stroke') == '#1f5fa8')
        inner = next(r['box'] for r in new['rects'] if r['attrs'].get('stroke') == '#397052')
        assert label['y'] > outer['y'] + 8
        assert label['y'] + label['height'] < inner['y'] - 8
        assert inner['y'] + inner['height'] < outer['y'] + outer['height'] - 8
        assert [t['text'] for t in old['texts']] == [t['text'] for t in new['texts']]
        results.append({'id': new['id'], 'result': 'inner-box label clear of both box borders; no answer added'})
    elif new['id'] == 'M1-C1-S3-DMAP':
        b = texts['＋と−を合わせる']['box']
        assert b['x'] + b['width'] < 1090 - 30
        results.append({'id': new['id'], 'result': 'label clear of unchanged vertical arrow'})
    else:
        ellipse = new['ellipses'][0]['attrs']
        cx, cy, rx, ry = [float(ellipse[k]) for k in ('cx', 'cy', 'rx', 'ry')]
        for text in new['texts']:
            b = text['box']
            if b['x'] < 775 and 320 < b['y'] < 500:
                # Full glyph boxes, including corners, remain well inside the red ellipse.
                for x in (b['x'], b['x'] + b['width']):
                    for y in (b['y'], b['y'] + b['height']):
                        assert ((x-cx)/rx)**2 + ((y-cy)/ry)**2 < .85, new['id']
        results.append({'id': new['id'], 'result': 'unchanged wrong-answer glyph boxes inside red ellipse with margin'})
(here / (prefix+'geometry-result.json')).write_text(json.dumps({'status': 'passed', 'items': results}, ensure_ascii=False, indent=2) + '\n')
print(str(len(after))+' diagrams: identical text/formulas/numbers; intended frame ranges and measured glyph clearances passed. Visual review remains separate.')
