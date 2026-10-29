"""Record source-only subscription evidence; never reads credentials or records."""
from pathlib import Path
import hashlib
import json

H = Path(__file__).resolve().parent
R = H.parents[2]
sources = [
    'cf-worker/src/plans.mjs',
    'cf-worker/src/subscription-credits.mjs',
    'cf-worker/src/learning-assistant.mjs',
    'cf-worker/src/openai-note-recovery.mjs',
    'cf-worker/src/openai-note-jobs.mjs',
    'cf-worker/src/openai-note-route.mjs',
    'cf-worker/src/openai-tutor-service.mjs',
    'cf-worker/src/openai-image-service.mjs',
    'cf-worker/src/openai-avatar-service.mjs',
    'cf-worker/src/openai-avatar-transport.mjs',
    'site-assets/note-analysis.js',
    'site-assets/note-analysis-api.js',
    'site-assets/subscription-ui.js',
    'site-assets/plans-guide.js',
]
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
log = Path('/tmp/nobi-google-settings-full-retry-20261021.log')
text = log.read_text(encoding='utf-8')
proof = json.loads((R / 'tools/releases/google-entry-20261021/full-verification.json').read_text())
assert text.rstrip().endswith('✅ ぜんぶ通過')
assert proof['observedExitCode'] == 0
assert proof['logSha256'] == sha(log)
assert proof['inputs']['.claude/verify/run.sh'] == sha(R / '.claude/verify/run.sh')
expected = [
    'Confirmed subscription terms: 150', 'Subscription terms UI: 75',
    'Unsent AI reservation release: 352', 'Avatar unsent service: 25',
    'Subscription daily-v2: 58', 'learning notes: 23',
    'Extended note service: 115', 'Note recovery: 161',
    'Note recovery browser: 29', 'AI limit notice: 89',
    'Subscription price: 419', 'Subscription cached catalogue: 18',
]
for marker in expected:
    assert marker in text, marker
data = {
    'status': 'current local source and existing full-success evidence recorded',
    'date': '2026-10-21', 'fullSession': 4119, 'observedFullExitCode': 0,
    'fullProof': str((R / 'tools/releases/google-entry-20261021/full-verification.json').relative_to(R)),
    'fullLogSha256': sha(log),
    'sources': {name: sha(R / name) for name in sources},
    'evidenceLines': [line for line in text.splitlines() if any(m in line for m in expected)],
    'claudeReportPresent': (R / 'Claude作業/20261018_サブスクAI機能確認').exists(),
    'scope': 'source hashes and existing synthetic-test evidence; no new provider, payment, real-account or live-data operation',
    'holds': [
        {'id': 'AI-LIVE', 'reason': 'actual provider responses and image quality unverified; real Gemini prohibited',
         'needs': 'approved provider contract and age/consent scope, safe authorized trial and actual response evidence'},
        {'id': 'AI-COST', 'reason': 'counting/photo/icon exact cost basis absent; conservative reservations retained',
         'needs': 'applicable pricing and usage/billing breakdown; no invented zero-cost counting or automatic release'},
        {'id': 'PLAN-POLICY', 'reason': 'retention/refund/proration/withdrawal conditions not confirmed',
         'needs': 'data-specific retention periods and approved commercial policy; preserve existing learning records'},
        {'id': 'AI-CONSENT', 'reason': 'existing text-only privacy wording differs from local image routes',
         'needs': 'effective date and explanation/reconsent policy for selected images and generated candidates'},
        {'id': 'CLAUDE-REPORT', 'reason': 'assigned independent feature-check artifact not found at designated location',
         'needs': 'Claude report with source SHA and real isolated UI evidence; do not fabricate or duplicate its report'},
    ],
    'entireSubscriptionComplete': False,
    'appSourcesChanged': False,
}
(H / 'current-evidence.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Subscription evidence recorded: 14 source hashes, 12 existing full-suite sections, 5 explicit holds; no live operations')
