"""No credentials or network. Exercise the actual pinned preparation module."""
import json
import shutil
import tempfile
from pathlib import Path
import prepare

checks = 0


def check(value):
    global checks
    assert value
    checks += 1


def rejects(root):
    try:
        prepare.build(root)
    except ValueError:
        check(True)
        return
    raise AssertionError('changed fixed/source file was accepted')


plan = prepare.build()
settings = json.loads((prepare.ROOT / prepare.FIXED / '固定設定.json').read_text())
check(len(plan['videos']) == 75)
check(plan['stepCount'] == 453)
check(plan['uniqueRequestCount'] == 453)
check(plan['apiCalls'] == 0)
check(all(v['owner'] == 'Codex' and not v['id'].startswith(('M1-C6-', 'M1-C7-')) for v in plan['videos']))
check([v['id'] for v in plan['videos']] == [v['id'] for v in sorted(plan['videos'], key=prepare.order)])
check(plan['videos'][0]['id'].startswith('M1-C1-'))
for video in plan['videos']:
    source = json.loads((prepare.ROOT / video['script']).read_text())
    check(len(video['steps']) == len(source['steps']))
    for step, original in zip(video['steps'], source['steps']):
        body = plan['requests'][step['requestSha256']]
        check(body['voice'] == 'marin' and body['model'] == 'gpt-4o-mini-tts')
        check(body['instructions'] == settings['instructions'])
        check(body['input'] == original.get('yomi', original['say']))
        check(step['caption'] == original.get('cap', original['say']))
        check(set(body) == {'model', 'voice', 'instructions', 'input', 'response_format'} and body['response_format'] == 'wav')
        check(prepare.digest(prepare.encoded(body)) == step['requestSha256'])
with tempfile.TemporaryDirectory(prefix='nobi-marin-plan-') as name:
    root = Path(name)
    fixed = root / prepare.FIXED
    fixed.mkdir(parents=True)
    for file in prepare.EXPECTED:
        shutil.copyfile(prepare.ROOT / prepare.FIXED / file, fixed / file)
    for video in plan['videos']:
        target = root / video['script']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(prepare.ROOT / video['script'], target)
    check(prepare.build(root) == plan)
    for file in prepare.EXPECTED:
        target = fixed / file
        raw = target.read_bytes()
        target.write_bytes(raw + b'changed')
        rejects(root)
        target.write_bytes(raw)
    target = root / plan['videos'][0]['script']
    target.write_bytes(target.read_bytes() + b' ')
    rejects(root)
check(prepare.build() == plan)
print(f'Marin speech plan: {checks} checks passed; pinned voice/instructions/scripts, all 75 Codex jobs and 453 exact inputs, changed fixed/source rejected; no network or audio generation')
