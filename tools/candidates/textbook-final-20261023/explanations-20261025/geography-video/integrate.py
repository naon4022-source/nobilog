from pathlib import Path
import hashlib
import json
import os

here = Path(__file__).resolve().parent
root = here.parents[4]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
old = json.loads((here.parent / 'geography-original-frame.json').read_text())
generation = json.loads((here / 'generation-result.json').read_text())
media = json.loads((here / 'media-result.json').read_text())
review = json.loads((here / 'visual-review.json').read_text())
assert review['status'] == 'all27 actual encoded video samples directly viewed'
assert len(review['samples']) == 27
assert sha(here / 'candidate.mp4') == review['movieSha256'] == media['movieSha256'] == generation['movieSha256']
assert sha(root / old['source']) == old['sourceSha256']
assert sha(root / old['bookCopy']) == old['bookCopySha256'] == old['sourceSha256']
assert not (here / 'integration.json').exists(), 'Do not repeat an already completed integration'
share = root / '教材整理/Claude_Codex共有'
source = share / '地理全体制作/制作ソース/G-C2-S1-VP.json'
script = json.loads((here / 'script.json').read_text())
scene_js = source.with_name('G-C2-S1-VP-corrected.js')
assert not scene_js.exists(), 'Preserve any existing independently created scene source'
html = share / '教科動画/場面/G-C2-S1-VP.html'
timeline = share / '教科動画/時間割/G-C2-S1-VP.json'
engine = share / '数学全体制作/メディア/制作ソース/動画エンジン/engine.js'
template = share / '教科動画/template.js'
metadata = {'kind': 'VP', 'chip': '地理', 'title': '世界の気候と暮らし', 'steps': [{'role': 'pt', 'text': s['say']} for s in script['steps']]}
relative = lambda p: os.path.relpath(p, html.parent)
html_text = '<!doctype html><meta charset="utf-8"><style>body{margin:0}canvas{display:block}</style><canvas width="1280" height="720"></canvas>\n'
html_text += '<script src="' + relative(engine) + '"></script><script>window.META=' + json.dumps(metadata, ensure_ascii=False) + ';</script>'
html_text += '<script src="' + relative(template) + '"></script><script src="' + relative(scene_js) + '"></script>\n'
script['renderer'] = {'scene': str(scene_js.relative_to(root)), 'html': str(html.relative_to(root)),
                      'recipe': str((here / 'build.py').relative_to(root)),
                      'reproduction': 'Use the preserved before/source snapshot when reproducing this guarded one-time recipe; default generic make.py does not contain the corrected scene.'}
changes = [
    (source, (json.dumps(script, ensure_ascii=False, indent=2) + '\n').encode()),
    (scene_js, (here / 'scene.js').read_bytes()),
    (html, html_text.encode()),
    (timeline, (here / 'timeline.json').read_bytes()),
    (root / old['source'], (here / 'candidate.mp4').read_bytes()),
    (root / old['bookCopy'], (here / 'candidate.mp4').read_bytes())
]
rows = []
for file, after in changes:
    relative_file = str(file.relative_to(root))
    if file.exists():
        before = here / 'before' / relative_file
        assert not before.exists()
        before.parent.mkdir(parents=True, exist_ok=True)
        before.write_bytes(file.read_bytes())
        row = {'file': relative_file, 'beforeFile': str(before.relative_to(root)), 'beforeSha256': sha(before)}
    else:
        row = {'file': relative_file, 'beforeFile': None, 'beforeSha256': None}
    rows.append({**row, 'afterSha256': hashlib.sha256(after).hexdigest()})
for (file, after), row in zip(changes, rows):
    file.write_bytes(after)
    assert sha(file) == row['afterSha256']
result = {'status': 'integrated locally; actual book playback check pending', 'id': 'G-C2-S1-VP', 'files': rows,
          'candidateMovieSha256': media['movieSha256'], 'actualSceneVisualProofSha256': sha(here / 'visual-review.json'),
          'scope': 'Only confirmed defective geography VP script/scene/timeline/movie and its existing book copy. Other videos, shared engine/template/settings, book questions/answers and account data unchanged.',
          'publication': 'No publish, commit or deletion. Previous source/media retained in before/.',
          'reproductionInput': next(r['beforeFile'] for r in rows if r['file'] == str(source.relative_to(root)))}
(here / 'integration.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Corrected geography movie/script/scene integrated locally; original and book copy SHA match; playback verification pending')
