from pathlib import Path
import hashlib
import json
from collections import Counter

here = Path(__file__).resolve().parent
root = here.parents[2]
index = json.loads((here / 'nonmath-video-review-index-20261025.json').read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
items = []
totals = Counter()
# Locate the existing source-layout folder through its reviewed scene HTML.
for row in index['items']:
    scene = root / row['sceneHtml']
    base = scene.parent.parent / '\u70b9\u691c'
    frames = sorted((base / row['id']).glob('s*.png'), key=lambda p: int(p.stem[1:]))
    totals[row['book']] += len(frames)
    items.append({'book': row['book'], 'id': row['id'], 'sourceStepCount': row.get('timelineSteps'),
                  'existingSourceLayoutPNGs': [{'file': str(p.relative_to(root)), 'sha256': sha(p)} for p in frames]})

geography = next(row for row in index['items'] if row['id'] == 'G-C2-S1-VP')
script = root / geography['script']
data = json.loads(script.read_text())
result = {
    'status': 'Existing source-layout evidence inventory; actual nonmath movie approval remains incomplete',
    'movies': len(items), 'withExistingSourceLayoutPNGs': sum(bool(row['existingSourceLayoutPNGs']) for row in items),
    'withoutInThisDirectory': [row['id'] for row in items if not row['existingSourceLayoutPNGs']],
    'totalExistingSourceLayoutPNGs': sum(totals.values()), 'countsByBook': dict(totals),
    'proofScope': 'Existing check.mjs uses a synthetic one-second-per-step source timeline at k+0.92. These are not every1.5s actual movie/AV/voice proofs.',
    'items': items,
    'directVisualReview': {
        'id': 'G-C2-S1-VP', 'scope': 'All six existing synthetic source-layout images directly viewed in this session; no new actual movie/audio review',
        'sourceScript': {'file': geography['script'], 'sha256': sha(script)},
        'frames': next(row['existingSourceLayoutPNGs'] for row in items if row['id'] == 'G-C2-S1-VP'),
        'visual': 'Six1280x720 images: title/cards/tip/end legible and within frame at sampled instants. Does not prove transitions/audio.',
        'contentFinding': {
            'step': 4, 'say': data['steps'][4]['say'],
            'status': 'Source statement needs correction review; not approved as a universal latitude sequence',
            'reason': 'Dry climates are classified using temperature and precipitation; latitude alone does not force all regions into this five-name sequence. Source PNGs also display it; current movie inclusion remains unverified.',
            'proposal': 'Explain that temperature generally decreases poleward and dryness also depends on precipitation; compare the source textbook before changing the approved wording.',
            'requiredBeforeChange': 'Confirm source textbook, specific wording permission and actual affected assets. No automatic regeneration from source-only findings.',
            'primaryReference': 'https://hosho.ees.hokudai.ac.jp/tsuyu/top/dct/climate-j.html',
            'referenceScope': 'Original university teaching material: temperature/precipitation inputs and dry-climate criterion; directly opened and inspected.'
        }
    },
    'noProductionEdits': True, 'newMovieGenerations': 0, 'newAVDecodes': 0,
    'whole8305': 'Running unchanged. Inventory writes only this standalone evidence file, not runtime inputs.',
    'recordingAttempt': 'First inline Python command failed before writing due to stdin UTF-8 parsing. Replaced by this ASCII source script; no production change occurred.'
}
(here / 'nonmath-existing-scene-evidence-20261025.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(f"Existing source evidence: {result['withExistingSourceLayoutPNGs']} sets / {result['totalExistingSourceLayoutPNGs']} PNGs; actual AV approval incomplete")
