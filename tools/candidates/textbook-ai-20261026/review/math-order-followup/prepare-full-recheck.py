from pathlib import Path
import datetime
import hashlib
import json

review = Path('tools/candidates/textbook-ai-20261026/review')
here = review / 'math-order-followup'
previous = json.loads((review / 'post-math-full-attempt1.json').read_text())
assert previous['observedExitCode'] == 1 and previous['inputDrift'] == []
missing = json.loads((here / 'missing-recheck-result.json').read_text())
assert missing['status'] == 'passed' and len(missing['results']) == 14
fix = json.loads((here / 'social-verifier-fix.json').read_text())
assert hashlib.sha256(Path(fix['file']).read_bytes()).hexdigest() == fix['afterSha256']
assert json.loads((here / 'bank-successor-result.json').read_text())['status'] == 'passed'
paths = set(previous['firstObservedInputSha256'])
paths.update(row['file'] for row in missing['results'])
paths.update([fix['file'], str(here / 'checked-bank-successor.mjs'), str(here / 'verify-bank-successor.mjs')])
report = {
    'status': 'prepared; not yet started',
    'preparedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'observedExitCode': None,
    'log': str(review / 'post-math-full-attempt2.log'),
    'firstObservedInputSha256': {
        file: hashlib.sha256(Path(file).read_bytes()).hexdigest() for file in sorted(paths)
    },
    'previousFailedFull': str(review / 'post-math-full-attempt1.json'),
    'priorFailures': '15: one strict historical bank comparison repaired;14 missing-entry targets rechecked unchanged with exit0. Missing-entry cause unproven; no retries/skips added to runner.',
    'scope': 'No application changes since full84081; verification/evidence correction only. Actual whole exit0 still required.',
}
target = review / 'post-math-full-attempt2.json'
assert not target.exists(), 'do not replace a previous run receipt'
target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print('Next standalone full input snapshot prepared; no command launched here.')
