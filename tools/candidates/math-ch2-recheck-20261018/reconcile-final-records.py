"""Reconcile recorded positions/SHA with the already verified local book. No media or answers change."""
from pathlib import Path
import hashlib, json, sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
WORK = ROOT / '教材整理/Claude_Codex共有/数学全体制作'
SOURCE = WORK / 'メディア/制作ソース'
PREVIOUS = HERE / 'answer-rows-20261019/previous'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
write = lambda p, d: p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
book_path = ROOT / 'site-assets/textbook-book-math1.json'
book_hash = sha(book_path)
evidence = load(HERE / 'current-evidence.json')
assert evidence['status'] == 'passed' and evidence['bookSha256'] == book_hash
playback_file = WORK / 'メディア/点検/20261018_配置修正後/本内再生/M1-C2-.json'
playback = load(playback_file)
assert playback['status'] == '成功' and len(playback['items']) == 13 and len(playback['results']) == 52
assert {x['id']: x['sha256'] for x in playback['items']} == {x['id']: x['sha256'] for x in evidence['videos']}
placed = load(WORK / 'メディアの置き場所.json')
assert placed['pages'] == 652 and placed['media']['M1-C2-S2-APPLY']['page'] == 203
assert all(0 < p['page'] <= placed['pages'] for p in placed['media'].values())

requests_path = SOURCE / '依頼台帳_1件ずつ.json'
requests = load(requests_path)
before = load(PREVIOUS / requests_path.name)
assert [x['id'] for x in requests] == [x['id'] for x in before]
changed = []
for item in requests:
    position = placed['media'].get(item['id'])
    if position:
        location = position['spread'] + f'（p.{position["page"]}）'
        if item['location'] != location:
            changed.append({'id': item['id'], 'before': item['location'], 'after': location})
            item['location'] = location
    if item['id'].startswith('M1-C2-'):
        item['latestLocalRecheck'] = {'date': '2026-10-19', 'report': 'AI連絡/数学2章_反映と検証結果_20261019.md',
            'evidence': 'tools/candidates/math-ch2-recheck-20261018/current-evidence.json',
            'status': 'individual checks passed; full verification pending', 'published': False}
    if item['id'] == 'M1-C2-S2-APPLY':
        item['scope'] = 'main'
        item['state'] = '1枚だけ生成した候補を本の既存枠へ反映。条件目視・本内4幅・参照SHA成功／変更後全体検証待ち。Claude確認は別。'
for a, b in zip(before, requests):
    for key in ['id', 'order', 'kind', 'spec', 'sha256', 'file']:
        assert a.get(key) == b.get(key), (a['id'], key)
write(requests_path, requests)

ledger_path = WORK / '制作台帳.json'
ledger = load(ledger_path)
draft_changes = []
for unit in ledger['assembledBook']['units']:
    digest = sha(ROOT / unit['draftFile'])
    if digest != unit['draftSha256']:
        draft_changes.append({'id': unit['id'], 'before': unit['draftSha256'], 'after': digest})
        unit['draftSha256'] = digest
assert {x['id'] for x in draft_changes} <= {'M1-C1-S2', 'M1-C2-S1', 'M1-C2-S2'}
ledger['assembledBook']['bookSha256'] = book_hash
ledger['changeHistory'].append({'date': '2026-10-19',
    'changes': '2章の確認3-2と確認1-1に重なる比較表2行を各閉じた解説へ移動。全ての文章・数値・答えと他ページを保持。1章の既反映原稿1件と今回の2章原稿2件の旧SHAを現物へ照合更新。媒体の再生成なし。個別確認成功、変更後全体は別途。',
    'record': 'AI連絡/数学2章_反映と検証結果_20261019.md'})
write(ledger_path, ledger)

progress_path = SOURCE / '69本_制作進捗.json'
progress = load(progress_path)
for item in progress['items']:
    if not item['id'].startswith('M1-C2-'): continue
    old = item.get('bookVerification')
    if old and old not in item.setdefault('bookVerificationHistory', []):
        item['bookVerificationHistory'].append(old)
    item['bookVerification'] = {'date': '2026-10-19', 'report': str(playback_file.relative_to(ROOT)),
        'viewports': [390, 820, 1180, 1440], 'checks': '13本×4幅の実再生・終盤シーク・収まりと原動画／本内コピー／参照SHA。耳での確認とClaude採用は別。'}
progress['verification']['chapter2Recheck'] = {'date': '2026-10-19', 'videos': 13, 'reviewedSamples': 273,
    'currentShaEvidence': 'tools/candidates/math-ch2-recheck-20261018/current-evidence.json',
    'playback': str(playback_file.relative_to(ROOT)), 'fullSuite': 'pending after current edits',
    'remainingRecheck': ['C3', 'C4', 'C5', 'APP'], 'notAFull75VideoCompletionClaim': True}
write(progress_path, progress)

# Generate only the derived request document from the real builder's own code.
# --check suppresses all existing image conversions and video copies.
builder = ROOT / '教材整理/実装/build-textbook-book.py'
text = builder.read_text()
namespace = {'__file__': str(builder), '__name__': '__main__'}
argv = sys.argv
try:
    sys.argv = [str(builder), '--check']
    try: exec(compile(text, str(builder), 'exec'), namespace)
    except SystemExit as error: assert error.code == 0
    assert namespace['data'] == book_path.read_text()
    marker = "if '--check' not in sys.argv:\n    placed_path ="
    assert text.count(marker) == 1
    sys.argv = [str(builder)]
    exec(compile(text[text.index(marker):], str(builder), 'exec'), namespace)
finally:
    sys.argv = argv
assert sha(book_path) == book_hash
result = {'status': 'reconciled; full verification pending', 'physicalPages': placed['pages'],
    'mappedMedia': len(placed['media']), 'positionChanges': changed,
    'draftShaChanges': draft_changes, 'bookSha256': book_hash,
    'videosReplayed': 13, 'playbacks': 52, 'mediaRegenerated': 0, 'published': False,
    'oldCollectorResult': 'final-media-placements.json (279 extra-media entries); new map includes 123 authored inline images as well',
    'noSubjectContentReviewFlagsChanged': True}
write(HERE / 'final-record-reconciliation.json', result)
print(f'Reconciled {len(changed)} request positions, {len(draft_changes)} draft SHA entries, 13 video playback records; {len(placed["media"])} unique media positions. Existing artwork/video bytes unchanged; full verification remains pending.')
