"""Apply the verified historical source adapter after full6 is terminal; preserve every old assertion."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

HERE = Path(__file__).resolve().parent
MAIN = HERE.parent
ROOT = MAIN.parents[4]
BASE = MAIN.relative_to(ROOT).as_posix() + '/'
VISION = 'tools/candidates/textbook-vision-20261027/main/'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads(p.read_text())


def main():
    assert not (HERE / 'applied.json').exists(), 'Never apply twice'
    terminal = load(MAIN / 'full6-result.json')
    assert terminal['exitCode'] == 1 and terminal['status'] == 'failed' and not terminal['frozenDrift']
    assert sha(MAIN / 'full6.log') == terminal['logSha256']
    assert subprocess.run(['pgrep', '-f', r'^bash (/Users/shimizunaotomoo/Desktop/my-app/)?\.claude/verify/run\.sh$'], capture_output=True).returncode == 1
    proof, candidate = load(HERE / 'result.json'), load(HERE / 'candidate.json')
    assert proof['checks'] == 41 and proof['observedExitCode'] == 0
    source = ROOT / candidate['file']
    canonical = HERE / 'canonical-verify-contexts.mjs'
    assert sha(source) == candidate['beforeSha256'] and sha(canonical) == candidate['canonicalCandidateSha256']
    spec = load(MAIN / 'prepared.json')
    old_spec_sha = sha(MAIN / 'prepared.json')
    assert len(spec['files']) == 19
    assert all(sha(ROOT / r['file']) == r['afterSha256'] and sha(ROOT / r['candidateFile']) == r['afterSha256'] for r in spec['files'])
    receipt = load(MAIN / 'integration.json')
    assert receipt['specSha256'] == old_spec_sha
    assert all(sha(ROOT / r['file']) == r['sha256'] for r in receipt['guards'])
    archive = HERE / 'before-repair'
    archive.mkdir()
    for name in ['prepared.json', 'checked-successor.cjs', 'verify-main-integration.mjs', 'integration.json', 'applied.json']:
        shutil.copy2(MAIN / name, archive / name)
    legacy_file = VISION + 'verify-main-source.mjs'
    legacy_row = next(r for r in spec['files'] if r['file'] == legacy_file)
    shutil.copy2(ROOT / legacy_file, archive / 'legacy-verify-main-source.mjs')
    before = ROOT / (BASE + 'before/' + candidate['file'])
    assert not before.exists()
    before.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, before)
    spec['files'].append({'file': candidate['file'], 'beforeFile': before.relative_to(ROOT).as_posix(),
                          'candidateFile': canonical.relative_to(ROOT).as_posix(), 'beforeSha256': sha(before),
                          'afterSha256': sha(canonical), 'edits': [candidate['delta']]})

    text = (ROOT / legacy_file).read_text()
    edits = [
        ('same(before.size,26,', 'same(before.size,27,'),
        ('same(checkMainSource(sandbox,{assets:false}).size,26,', 'same(checkMainSource(sandbox,{assets:false}).size,27,'),
        ("'cf-worker/src/textbook-ai-context-manifest.mjs'])", "'cf-worker/src/textbook-ai-context-manifest.mjs','tools/candidates/textbook-ai-20261025/verify-contexts.mjs'])"),
    ]
    for old, new in edits:
        assert text.count(old) == 1
        text = text.replace(old, new)
        legacy_row['edits'].append({'before': old, 'after': new})
    successor = HERE / 'legacy-verify-main-source.mjs'
    successor.write_text(text)
    legacy_row['candidateFile'] = successor.relative_to(ROOT).as_posix()
    legacy_row['afterSha256'] = sha(successor)

    helper = (MAIN / 'checked-successor.cjs').read_text()
    old = 'spec.files.length!==19||new Set(spec.files.map(r=>r.file)).size!==19'
    assert helper.count(old) == 1
    helper = helper.replace(old, 'spec.files.length!==20||new Set(spec.files.map(r=>r.file)).size!==20')
    assert helper.count('if(result.size!==26)') == 1
    helper = helper.replace('if(result.size!==26)', 'if(result.size!==27)')
    main_verifier = (MAIN / 'verify-main-integration.mjs').read_text()
    old = "equal(before.size,26,'19 exact successors plus8 original vision predecessors with one runner overlap')"
    assert main_verifier.count(old) == 1
    main_verifier = main_verifier.replace(old, "equal(before.size,27,'20 exact successors plus8 original vision predecessors with one runner overlap')")
    assert main_verifier.count('Current main19-file') == 1
    main_verifier = main_verifier.replace('Current main19-file', 'Current main20-file')
    spec['status'] = 'reviewed exact teaching/source-identity successor; current progress recorded separately'
    for p in [HERE / 'candidate.json', canonical, HERE / 'verify-candidate.mjs', HERE / 'candidate.log',
              HERE / 'result.json', Path(__file__), MAIN / 'full6-result.json', MAIN / 'full6.log']:
        rel = p.relative_to(ROOT).as_posix()
        assert rel not in {r['file'] for r in spec['frozenEvidence']}
        spec['frozenEvidence'].append({'file': rel, 'sha256': sha(p)})
    spec['frozenEvidence'].sort(key=lambda r: r['file'])
    # All prior source/AV/runtime evidence is retained; only the historical identity reader is added.
    (MAIN / 'prepared.json').write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n')
    new_spec_sha = sha(MAIN / 'prepared.json')
    assert helper.count(old_spec_sha) == 1
    (MAIN / 'checked-successor.cjs').write_text(helper.replace(old_spec_sha, new_spec_sha))
    (MAIN / 'verify-main-integration.mjs').write_text(main_verifier)
    source.write_bytes(canonical.read_bytes())
    (ROOT / legacy_file).write_bytes(successor.read_bytes())
    receipt['specSha256'] = new_spec_sha
    for r in receipt['guards']:
        r['sha256'] = sha(ROOT / r['file'])
    (MAIN / 'integration.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    applied = load(MAIN / 'applied.json')
    applied.update(status='teaching and source-identity successor applied; related/full checks pending', specSha256=new_spec_sha,
                   files=[{'file': r['file'], 'sha256': r['afterSha256']} for r in spec['files']])
    (MAIN / 'applied.json').write_text(json.dumps(applied, ensure_ascii=False, indent=2) + '\n')
    assert all(sha(ROOT / r['file']) == r['afterSha256'] for r in spec['files'])
    record = {'status': 'canonical historical identity adapter applied; verification pending', 'oldSpecSha256': old_spec_sha,
              'newSpecSha256': new_spec_sha, 'files': 20, 'normalizedEntries': 27, 'archive': 'before-repair',
              'failedFull': {'file': '../full6-result.json', 'sha256': sha(MAIN / 'full6-result.json')},
              'scope': 'No teaching/runtime content changed. Original41 assertions retained; legacy source fixture adds mutation rejection for the identity verifier. Only exact predecessor bytes exposed after full successor validation.',
              'publication': False}
    (HERE / 'applied.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
    print('Applied exact source-identity adapter;20-file/27-entry guard;teaching files unchanged')


if __name__ == '__main__':
    main()
