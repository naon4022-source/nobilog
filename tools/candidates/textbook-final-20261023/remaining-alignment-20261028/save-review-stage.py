from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
VOICE = HERE.parent / 'kokugo-intonation-20261027'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
images = []
for row in json.loads((HERE / 'figure-book-result.json').read_text())['results']:
    images.append(dict(kind='book-placement', file='figure-book-screens/' + row['screenshot'], id=row['id'], width=row['width']))
for row in json.loads((HERE / 'figure-zoom-result.json').read_text())['results']:
    images.append(dict(kind='settled-zoom', file='figure-zoom-screens/' + row['zoomScreenshot'], id=row['id'], width=row['width']))
    if row['width'] == 390:
        images.append(dict(kind='phone-right-edge', file=f"figure-zoom-screens/{row['id']}-390-right.png", id=row['id'], width=390))
for row in json.loads((HERE / 'integration-contexts/note-ui-result.json').read_text())['results']:
    images.append(dict(kind='old-note-ui', file='integration-contexts/note-ui-screens-attempt2/' + row['screenshot'], book=row['book'], width=row['width']))
assert len(images) == 60
for row in images:
    row['sha256'] = sha(HERE / row['file'])
visual = {
    'status': 'Directly reviewed60 screenshot cases; scoped findings recorded',
    'screenshots': images,
    'contactIndexes': [dict(file=p, sha256=sha(HERE / p)) for p in ['figure-page-review/index.json', 'figure-zoom-review/index.json']],
    'observations': [
        'Selected8 diagrams stay in page bounds at4 widths. Phone inline diagrams require zoom.',
        'Settled dialogs reviewed for8 diagrams at390/1440; all8 phone right-edge shots reviewed.',
        'First run could capture the dialog entry animation; followup waited for completion. Main UI unchanged.',
        'All21 changed-text notes verified at2 widths;4 source-update list screenshots reviewed.',
        'Existing worked-example How cute! matches a later confirmation; diagram repair alone does not certify all text answer exposure.',
    ],
    'limits': [
        'Physical-device gestures unverified.',
        'Desktop zoom may require vertical scrolling; bottom-edge interaction not part of this horizontal-panning test.',
        'Broader worked-example placement needs review before final book approval.',
        'Candidate only; no main integration or provider call/publication.',
    ],
}
proofs = ['figure-book-result.json', 'figure-zoom-result.json', 'integration-contexts/note-preservation-result.json', 'integration-contexts/note-ui-result.json', 'note-ui-attempt1-result.json', 'ui-visual-review.json', 'promotion-plan-preliminary.json']
destination = HERE / 'ui-visual-review.json'
assert not destination.exists()
destination.write_text(json.dumps(visual, ensure_ascii=False, indent=2) + '\n')
stage = {
    'status': 'Scoped figure and old-note checks complete; broader textbook work incomplete',
    'proofs': [dict(file=p, sha256=sha(HERE / p)) for p in proofs],
    'checks': dict(figure4width=281, settledZoomAndPhonePanning=161, oldNoteActualUI=189),
    'savedSyntheticNotes': 2129,
    'changedTextNotesAndDrafts': 21,
    'mainPromotionReady': False,
    'nativeSpeechRepair': {
        'proof': str((VOICE / 'narration-v3/native-api-attempt/audio-result.json').relative_to(ROOT)),
        'sha256': sha(VOICE / 'narration-v3/native-api-attempt/audio-result.json'),
        'all7ClipProof': str((VOICE / 'videos-caption-v3/K1-C2-S5-VP/audio-result.json').relative_to(ROOT)),
        'v3Seconds': 40.666,
        'status': '7scene preflight passed; v3 render running',
        'session': 85322,
    },
    'remaining': ['V3 movie and other9 referenced videos', 'Broader text answer exposure and vertical-pan review', 'Combined actual AI panel/note flow', 'Full7 terminal result, main integration, postchange whole verification'],
}
destination = HERE / 'review-stage-v2.json'
assert not destination.exists()
destination.write_text(json.dumps(stage, ensure_ascii=False, indent=2) + '\n')
print('Pinned60 screenshots and scoped figure/note/native-speech proofs; main promotion not ready')
