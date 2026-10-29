"""Bind prior full AV/visual audits to the exact current media; do not decode unchanged videos again."""
from pathlib import Path
import hashlib, json, math

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
MEDIA = ROOT / '教材整理/Claude_Codex共有/数学全体制作/メディア'
SOURCE = MEDIA / '制作ソース'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
relative = lambda p: str(p.relative_to(ROOT))
progress = load(SOURCE / '69本_制作進捗.json')
items = [x for x in progress['items'] if x['id'].startswith('M1-C2-')]
assert len(items) == 13 and len({x['id'] for x in items}) == 13
old_path = MEDIA / '点検/20261018_章別再点検/M1-C2_再復号.json'
prior = load(old_path)
assert prior['status'] == 'passed'
previous = {x['id']: x for x in prior['results']}
confirmation = load(HERE / 'current-visual-confirmation.json')
assert confirmation['id'] == 'M1-C2-S1-V03' and confirmation['result'] == 'passed'
assert sha(ROOT / confirmation['sheet']) == confirmation['sheetSha256']
assert confirmation['samples'] == 19 and confirmation['newListeningReview'] is False
settings = load(SOURCE / '音声共有/設定.json')
assert settings == prior['voiceSettings']
assert (settings['engine'], settings['voice'], settings['rate'], settings['profile']) == ('say', 'Kyoko', 175, 'clear')
book_path = ROOT / 'site-assets/textbook-book-math1.json'
book = load(book_path)
requests = load(SOURCE / '依頼台帳_1件ずつ.json')
rows = {x['id']: x for x in requests}
def flatten(blocks):
    return [v for b in blocks for v in [b, *flatten(b.get('body', []))]]
blocks = [b for p in book['pages'] for b in flatten(p.get('blocks', []))]
results = []
for item in items:
    ident = item['id']
    video = MEDIA / (ident + '.mp4')
    assert sha(video) == item['sha256'] == rows[ident]['sha256'], ident
    for extension, value in item['sourceSha256'].items():
        assert sha(SOURCE / (ident + '.' + extension)) == value
    for name, value in item.get('dependencySha256', {}).items():
        path = (SOURCE / name).resolve()
        assert path.is_relative_to(SOURCE.resolve()) and sha(path) == value
    script = load(SOURCE / (ident + '.json'))
    timeline = load(SOURCE / (ident + '.timeline.json'))
    assert script['settings'] == '音声共有/設定.json'
    assert len(script['steps']) == len(timeline['steps'])
    for step, timing in zip(script['steps'], timeline['steps']):
        assert timing['say'] == timing['cap'] == step['say'] == step.get('cap', step['say'])
        assert step.get('voice', 'Kyoko') == 'Kyoko'
        assert timing['end'] - timing['start'] >= timing['speak'] > .2
    ref = [b for b in blocks if b.get('id') == ident]
    assert len(ref) == 1 and ref[0]['kind'] == 'video'
    expected = '/textbook-book-math1-' + ident.lower() + '.mp4'
    assert ref[0]['src'] == expected and sha(ROOT / 'site-assets' / expected[1:]) == item['sha256']
    audit_path = Path(item['shots']) / '実動画の点検.json'
    audit = load(audit_path)
    assert audit['sha256'] == item['sha256']
    assert audit['visualReview']['result'] == '全場面を目視確認済み'
    old = previous[ident]
    expected_samples = math.ceil(round(timeline['total'] * 30) / 45)
    if ident == 'M1-C2-S1-V03':
        assert audit['previousSha256'] == old['sha256']
        assert audit['decode'].startswith('all video/audio decoded with -xerror')
        assert audit['format'] == 'H264・1280x720・30fps・AAC'
        assert audit['frames'] == round(timeline['total'] * 30)
        assert audit['sampleFrames'] == expected_samples == len(audit['videoFrameProof'])
        assert [f['frame'] for f in audit['videoFrameProof']] == list(range(0, audit['frames'], 45))
        assert max(f['maxChannelRMS'] for f in audit['videoFrameProof']) < 12
        assert audit['audioPreservation']['sameAsPrevious'] is True
        assert audit['audioPreservation']['reencoded'] is False
        mean, peak = audit['meanDB'], audit['peakDB']
        evidence_path = audit_path
    else:
        assert old['sha256'] == item['sha256']
        assert old['decode'] == 'all video/audio decoded with -xerror' and old['fps'] == 30
        assert abs(old['frames'] - round(timeline['total'] * 30)) <= 1
        assert old['sampleFrames'] == expected_samples == old['allReviewedFramesMatchVideo']['frames']
        assert old['allReviewedFramesMatchVideo']['maxChannelRMS'] < 12
        mean, peak = old['meanDB'], old['peakDB']
        evidence_path = old_path
    assert abs(old['audioSeconds'] - timeline['total']) < .2
    assert -40 < mean < 0 and peak < 0
    for sheet in old['contactSheets'] if ident != 'M1-C2-S1-V03' else []:
        assert sha(ROOT / sheet['path']) == sheet['sha256']
    assert all(Path(name).is_file() for name in audit['contactSheets'])
    results.append({'id': ident, 'sha256': item['sha256'], 'audit': relative(evidence_path),
                    'auditSha256': sha(evidence_path), 'samples': expected_samples,
                    'audioSeconds': old['audioSeconds'], 'seconds': timeline['total'],
                    'settingsAndCaptionsMatch': True, 'sourceCopyReferenceAndRequestShaMatch': True,
                    'priorFullAVAndVisualReviewAppliesToCurrentBytes': True})

images = []
for item in [x for x in requests if x['id'].startswith('M1-C2-') and x['kind'] == '図解']:
    source = ROOT / item['file']
    assert source.is_relative_to(MEDIA) and source.suffix == '.svg'
    digest = sha(source)
    assert digest == item['sha256']
    refs = [b for b in blocks if b.get('id') == item['id']]
    assert len(refs) == 1 and sha(ROOT / 'site-assets' / refs[0]['src'].lstrip('/')) == digest
    images.append({'id': item['id'], 'sha256': digest})
import runpy
svg_predecessor=runpy.run_path(str(ROOT/'tools/candidates/textbook-final-20261023/reviewed_changes.py'))['svg_predecessor']
for item in load(HERE / 'svg-manifest.json'):
    assert sha(svg_predecessor(Path(item['file']),item['after'])) == item['after'] == sha(svg_predecessor(Path(item['copy']),item['after']))
    assert item['textPreserved'] is True
assert load(HERE / 'svg-geometry-review.json')['result'] == 'passed'
scene = load(HERE / 'image-integration.json')['newScene']
assert scene['visualReview']['status'] == 'passed'
work = MEDIA.parent
assert sha(work / scene['file']) == scene['sha256']
assert sha(ROOT / scene['bookFile']) == scene['bookSha256']
refs = [b for b in blocks if b.get('src') == '/' + Path(scene['bookFile']).name]
assert len(refs) == 1
request_scenes = []
for item in [x for x in requests if x['id'].startswith('M1-C2-') and x['kind'] == '場面の絵']:
    source = ROOT / item['file']
    assert source.is_relative_to(MEDIA.parent) and sha(source) == item['sha256']
    matched = [b for b in blocks if b.get('id') == item['id'] or str(b.get('src', '')).startswith('/textbook-book-math1-' + item['id'].lower() + '.')]
    assert len(matched) == 1
    copied_sha = sha(ROOT / 'site-assets' / matched[0]['src'].lstrip('/'))
    assert copied_sha == (scene['bookSha256'] if item['id'] == scene['slot'] else item['sha256'])
    request_scenes.append({'id': item['id'], 'sourceSha256': item['sha256'], 'bookSha256': copied_sha})
result = {'status': 'passed', 'videos': results, 'sampleFrames': sum(x['samples'] for x in results),
          'diagrams': images, 'requestScenes': request_scenes, 'newScene': {'slot': scene['slot'], 'originalSha': scene['sha256'], 'bookSha': scene['bookSha256']},
          'currentVisualRecheck': confirmation,
          'bookSha256': sha(book_path), 'scope': 'Current SHA correspondence to prior full AV decode and all-scene visual evidence; no new decode, listening, generation or real-user data.'}
(HERE / 'current-evidence.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Chapter 2 current bytes: 13 videos / ' + str(result['sampleFrames']) + ' reviewed scenes / ' + str(len(images)) + ' diagrams / one adopted scene match full AV, source, captions, copy/reference/request and visual evidence; no redundant regeneration or decode.')
