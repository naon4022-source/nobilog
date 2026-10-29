from pathlib import Path
import hashlib
import json

here = Path(__file__).resolve().parent
root = here.parents[4]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
integration = json.loads((here / 'integration.json').read_text())
generation = json.loads((here / 'generation-result.json').read_text())
technical = json.loads((here / 'media-result.json').read_text())
visual = json.loads((here / 'visual-review.json').read_text())
assert integration['id'] == 'G-C2-S1-VP' and len(integration['files']) == 6
changed = {r['file']: r for r in integration['files']}
checks = 0
for row in integration['files']:
    assert sha(root / row['file']) == row['afterSha256']
    if row['beforeFile']:
        assert sha(root / row['beforeFile']) == row['beforeSha256']
    checks += 1
for file, digest in generation['inputs'].items():
    # Canonical script was intentionally promoted after rendering. Its preserved predecessor
    # is the original generation input; all other renderer/candidate sources remain exact.
    if file in changed:
        row = changed[file]
        assert row['beforeFile'] and row['beforeSha256'] == digest
        assert sha(root / row['beforeFile']) == digest
    else:
        assert sha(root / file) == digest
    checks += 1
assert sha(root / generation['settingsFile']) == generation['settingsSha256']
assert sha(here / 'candidate.mp4') == generation['movieSha256'] == technical['movieSha256'] == visual['movieSha256'] == integration['candidateMovieSha256']
assert sha(here / 'visual-review.json') == integration['actualSceneVisualProofSha256']
assert technical['fullAVDecode'] == 'passed' and technical['fps'] == 30 and technical['frames'] == 1150
assert technical['captions'] == 'all7 canonical say/cap pairs identical'
assert visual['status'] == 'all27 actual encoded video samples directly viewed' and len(visual['samples']) == 27
for file, digest in technical['outputs'].items():
    assert sha(root / file) == digest
    checks += 1
script_file = next(root / r['file'] for r in integration['files'] if r['file'].endswith('/G-C2-S1-VP.json') and '/制作ソース/' in r['file'])
script = json.loads(script_file.read_text())
renderer = script.pop('renderer')
assert script == json.loads((here / 'script.json').read_text())
assert sha(root / renderer['scene']) == sha(here / 'scene.js')
book = json.loads((root / 'site-assets/textbook-book-geography.json').read_text())
references = [b for p in book['pages'] for b in p.get('blocks', []) if b.get('id') == 'G-C2-S1-VP']
assert len(references) == 1 and references[0]['src'] == '/textbook-book-geography-g-c2-s1-vp.mp4'
assert sha(root / 'site-assets/textbook-book-geography-g-c2-s1-vp.mp4') == technical['movieSha256']
checks += 7
result = {'status': 'passed', 'checks': checks,
          'movieSha256': technical['movieSha256'], 'visualSamples': 27,
          'currentInputs': {r['file']: r['afterSha256'] for r in integration['files']},
          'scope': 'Current source/copy/reference exact SHA and preserved actual AV/30fps/audio/1.5s visual proof. The intentional script promotion is validated against its generation predecessor. No duplicate AV decode or media generation.'}
(here / 'current-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Current corrected geography media:', checks, 'checks passed; no duplicate AV decode')
