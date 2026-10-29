"""Run the required whole suite once; freeze scoped source/evidence and record terminal state."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


assert not (HERE / 'full11-result.json').exists() and not (HERE / 'full11.log').exists(), 'Never rerun or overwrite completed whole verification'
running = subprocess.run(['pgrep', '-f', r'^bash (/Users/shimizunaotomoo/Desktop/my-app/)?\.claude/verify/run\.sh$'], capture_output=True, text=True)
assert running.returncode == 1, 'A whole verification is already active or its exclusivity could not be checked'
files = json.loads((HERE / 'full11-dependencies.json').read_text())
files = sorted(set(files + [Path(__file__).relative_to(ROOT).as_posix()]))
inputs = [{'file': file, 'sha256': sha(ROOT / file)} for file in files]
(HERE / 'full11-inputs.json').write_text(json.dumps(inputs, ensure_ascii=False, indent=2) + '\n')
log = HERE / 'full11.log'
with log.open('w') as output:
    process = subprocess.Popen(['bash', '.claude/verify/run.sh'], cwd=ROOT, stdout=output, stderr=subprocess.STDOUT)
    state = {'pid': process.pid, 'wrapperPid': os.getpid(), 'status': 'running', 'command': 'bash .claude/verify/run.sh', 'log': log.relative_to(ROOT).as_posix(), 'fixedInputs': len(inputs)}
    (HERE / 'full11-process.json').write_text(json.dumps(state, indent=2) + '\n')
    print('Single whole verification started; pid', process.pid, '; fixed inputs', len(inputs), flush=True)
    code = process.wait()
drift = [r['file'] for r in inputs if sha(ROOT / r['file']) != r['sha256']]
ending = log.read_text().rstrip().endswith('✅ ぜんぶ通過')
result = {'status': 'passed' if code == 0 and ending and not drift else 'failed', 'exitCode': code,
          'command': 'bash .claude/verify/run.sh', 'log': log.relative_to(ROOT).as_posix(), 'logSha256': sha(log),
          'frozenDrift': drift, 'inputs': inputs, 'terminalSuccessMarker': ending,
          'scope': 'Required whole suite after exact77 teaching/AI96/AI-send local integration, current75 math and M05/M06 metadata alignment. Scoped source/evidence inputs unchanged; not whole-project completion or publication.'}
(HERE / 'full11-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
state.update(status='finished', exitCode=code, result=result['status'])
(HERE / 'full11-process.json').write_text(json.dumps(state, indent=2) + '\n')
print('Whole verification terminal:', result['status'], '; exit', code, '; drift', len(drift), flush=True)
sys.exit(0 if result['status'] == 'passed' else 1)
