"""Reuse exact-byte full AV and all-scene evidence; verify the current chapter."""
from pathlib import Path
import hashlib
import json
import math

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
MEDIA = ROOT / '教材整理/Claude_Codex共有/数学全体制作/メディア'
SOURCE = MEDIA / '制作ソース'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
ledger = load(SOURCE / '69本_制作進捗.json')
items = [x for x in ledger['items'] if x['id'].startswith('M1-C1-')]
assert len(items) == len({x['id'] for x in items}) == 21
prior_path = MEDIA / '点検/20261018_章別再点検/M1-C1_再復号.json'
prior = load(prior_path)
assert prior['status'] == 'passed'
old = {x['id']: x for x in prior['results']}
settings = load(SOURCE / '音声共有/設定.json')
assert settings == prior['voiceSettings']
assert (settings['engine'], settings['voice'], settings['rate'], settings['profile']) == ('say', 'Kyoko', 175, 'clear')
requests = {x['id']: x for x in load(SOURCE / '依頼台帳_1件ずつ.json')}
book_path = ROOT / 'site-assets/textbook-book-math1.json'
book = load(book_path)

def flatten(blocks):
    for block in blocks:
        yield block
        yield from flatten(block.get('body', []))

blocks = [b for p in book['pages'] for b in flatten(p.get('blocks', []))]
results = []
for item in items:
    ident = item['id']
    digest = sha(MEDIA / (ident + '.mp4'))
    assert digest == item['sha256'] == requests[ident]['sha256'] == old[ident]['sha256'], ident
    for extension, expected in item['sourceSha256'].items():
        assert sha(SOURCE / (ident + '.' + extension)) == expected, ident
    for name, expected in item.get('dependencySha256', {}).items():
        path = (SOURCE / name).resolve()
        assert path.is_relative_to(SOURCE.resolve()) and sha(path) == expected, ident
    script = load(SOURCE / (ident + '.json'))
    timeline = load(SOURCE / (ident + '.timeline.json'))
    assert script['settings'] == '音声共有/設定.json'
    assert len(script['steps']) == len(timeline['steps'])
    for step, timing in zip(script['steps'], timeline['steps']):
        assert timing['say'] == timing['cap'] == step['say'] == step.get('cap', step['say']), ident
        assert step.get('voice', 'Kyoko') == 'Kyoko'
        assert timing['end'] - timing['start'] >= timing['speak'] > .2
    refs = [b for b in blocks if b.get('id') == ident]
    expected_src = '/textbook-book-math1-' + ident.lower() + '.mp4'
    assert len(refs) == 1 and refs[0]['kind'] == 'video' and refs[0]['src'] == expected_src, ident
    assert sha(ROOT / 'site-assets' / expected_src[1:]) == digest
    audit = load(Path(item['shots']) / '実動画の点検.json')
    assert audit['sha256'] == digest and audit['visualReview']['result'] == '全場面を目視確認済み'
    evidence = old[ident]
    samples = math.ceil(round(timeline['total'] * 30) / 45)
    assert evidence['decode'] == 'all video/audio decoded with -xerror' and evidence['fps'] == 30
    assert abs(evidence['frames'] - round(timeline['total'] * 30)) <= 1
    assert evidence['sampleFrames'] == samples == evidence['allReviewedFramesMatchVideo']['frames']
    assert evidence['allReviewedFramesMatchVideo']['maxChannelRMS'] < 12
    assert abs(evidence['audioSeconds'] - timeline['total']) < .2
    assert -40 < evidence['meanDB'] < 0 and evidence['peakDB'] < 0
    for sheet in evidence['contactSheets']:
        assert sha(ROOT / sheet['path']) == sheet['sha256']
    results.append({'id': ident, 'sha256': digest, 'samples': samples, 'reference': expected_src,
                    'currentSourcesCaptionsAudioAndCopyMatch': True,
                    'priorFullAVAndAllSceneReviewBoundToCurrentBytes': True})

report = {'status': 'passed', 'chapter': 1, 'videos': results,
          'sampleFrames': sum(x['samples'] for x in results),
          'bookSha256': sha(book_path), 'priorEvidence': str(prior_path.relative_to(ROOT)),
          'priorEvidenceSha256': sha(prior_path),
          'scope': 'Exact-byte evidence reuse. No duplicate decode, generation, new listening or device claim.'}
(HERE / 'chapter1-current-evidence.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f"Chapter1: {len(results)} current videos / {report['sampleFrames']} reviewed scenes; exact source/request/copy, approved Kyoko, captions, audio length, 30fps and prior full AV match")
