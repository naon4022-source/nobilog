"""Prepare/apply the exact reviewed16-file teaching update plus3 verification connections."""
from pathlib import Path
from urllib.parse import urlparse, unquote
import hashlib
import json
import shutil
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = HERE / 'main'
RELBASE = BASE.relative_to(ROOT).as_posix() + '/'
VISION = 'tools/candidates/textbook-vision-20261027/main/'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
load = lambda p: json.loads(p.read_text())


def prepare():
    assert not BASE.exists(), 'Preserve completed preparation; never overwrite'
    plan = load(HERE / 'integration-contexts/promotion-plan.json')
    assert len(plan['files']) == 16
    for row in plan['files']:
        assert sha(ROOT / row['file']) == row['beforeSha256'], row['file']
        assert sha(ROOT / row['candidateFile']) == row['afterSha256'], row['candidateFile']
    BASE.mkdir()
    rows = []
    for item in plan['files']:
        row = dict(item, beforeFile=RELBASE + 'before/' + item['file'])
        backup = ROOT / row['beforeFile']
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / row['file'], backup)
        rows.append(row)

    def edit(file, changes):
        original = (ROOT / file).read_text()
        text = original
        edits = []
        for before, after in changes:
            assert before and text.count(before) == 1, (file, before)
            text = text.replace(before, after)
            edits.append({'before': before, 'after': after})
        backup = BASE / 'before' / file
        candidate = BASE / 'output' / file
        backup.parent.mkdir(parents=True, exist_ok=True)
        candidate.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / file, backup)
        candidate.write_text(text)
        rows.append({'file': file, 'beforeFile': backup.relative_to(ROOT).as_posix(),
                     'candidateFile': candidate.relative_to(ROOT).as_posix(),
                     'beforeSha256': sha(backup), 'afterSha256': sha(candidate), 'edits': edits})

    prior = VISION + 'checked-source.cjs'
    bootstrap = "// Reviewed teaching successor; the original vision assertions remain archived and executed.\nmodule.exports=require('../../textbook-final-20261023/kokugo-reading-20261027/main/checked-successor.cjs');\n"
    edit(prior, [((ROOT / prior).read_text(), bootstrap)])
    source = VISION + 'verify-main-source.mjs'
    edit(source, [
        ("same(before.size,8,'only eight exact existing files normalized, including two legacy runner readers')", "same(before.size,26,'exact teaching and original vision predecessors normalized; all original assertions retained')"),
        ("same(checkMainSource(sandbox,{assets:false}).size,8,'sparse code fixture validates approved successor; all media already checked once against main')", "same(checkMainSource(sandbox,{assets:false}).size,26,'sparse code fixture validates teaching successor; all media already checked once against main')"),
        ("tools\\/candidates|site-assets|cf-worker\\/src", "tools\\/candidates|site-assets|cf-worker\\/src|教材整理\\/Claude_Codex共有"),
        ("for(const file of ['index.html','cf-worker/src/textbook-vision-input.mjs','site-assets/textbook-ai.js'])", "for(const file of ['index.html','cf-worker/src/textbook-vision-input.mjs','site-assets/textbook-ai.js','site-assets/textbook-book-kokugo1.json','cf-worker/src/textbook-ai-context-manifest.mjs'])"),
        ("const originalPath='tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/checked-source.cjs'", "for(const file of ['site-assets/textbook-book-kokugo1-k1-c1-s1-dp.svg','site-assets/textbook-book-kokugo1-k1-c1-s1-v01.mp4']){\n const target=path.join(sandbox,file),saved=await readFile(target);await writeFile(target,Buffer.concat([saved,Buffer.from('\\nunauthorized media drift\\n')]));assert.throws(()=>checkMainSource(sandbox),/drift/);checks++;await writeFile(target,saved);\n}\nconst originalPath='tools/candidates/textbook-ai-20261026/review/practice-expansion-20261027/checked-source.cjs'"),
    ])
    runner = 'node "$PROJECT_DIR/' + VISION + 'verify-main-source.mjs" || fail=1'
    edit('.claude/verify/run.sh', [(runner, 'node "$PROJECT_DIR/' + RELBASE + 'verify-main-integration.mjs" || fail=1\n' + runner)])
    assert len(rows) == 19

    evidence = {}
    def freeze(file):
        p = Path(file)
        if not p.is_absolute():
            p = ROOT / p
        rel = p.relative_to(ROOT).as_posix()
        digest = sha(p)
        assert rel not in evidence or evidence[rel] == digest
        evidence[rel] = digest

    def proof(relative):
        p = HERE / relative
        freeze(p)
        return load(p)

    for r in proof('current-stage.json')['proofs']:
        freeze(HERE / r['file'])
    for r in proof('integration-contexts/stage-result.json')['proofs']:
        freeze(HERE / 'integration-contexts' / r['file'])
    visual = proof('visual-caption-v2-result.json')
    for sheet in visual['sheets']:
        freeze(sheet['file'])
        for frame in sheet['samples']:
            freeze(frame['file'])
    for ident in ['K1-C1-S1-V01', 'K1-C1-S1-VP']:
        report = proof('videos-caption-v2/' + ident + '/technical-media-result.json')
        for r in report['inputs'] + report['outputs']:
            freeze(r['file'])
    for name in ['reader-result.json', 'note-preservation-result.json', 'note-ui-result.json']:
        report = proof('integration-contexts/' + name)
        for r in report['inputs']:
            freeze(unquote(urlparse(r['url']).path) if 'url' in r else r['file'])
    for r in proof('book-alignment-v3/visual-review.json')['screens']:
        freeze(HERE / 'book-alignment-v3/playback-screens' / r['file'])
    for r in proof('integration-contexts/note-ui-result.json')['results']:
        freeze(HERE / 'integration-contexts/note-ui-screens' / r['screenshot'])
    for name in ['checked-successor-template.cjs', 'verify-main-integration-template.mjs', 'prepare-main.py']:
        freeze(HERE / name)
    full = ROOT / VISION / 'full5-result.json'
    previous = load(full)
    assert previous['status'] == 'passed' and previous['exitCode'] == 0 and not previous['frozenDrift']
    spec = {'status': 'reviewed exact teaching successor; not applied', 'files': rows,
            'frozenEvidence': [{'file': f, 'sha256': h} for f, h in sorted(evidence.items())],
            'priorGuardSha256': rows[16]['beforeSha256'],
            'previousFull': {'file': full.relative_to(ROOT).as_posix(), 'sha256': sha(full)},
            'scope': 'Only reviewed16 teaching/content/runtime files and3 verification connections. Existing mathematical media, auth, admin, other5 books, learning records and immutable prior proof files preserved. No publication.'}
    target = BASE / 'prepared.json'
    target.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + '\n')
    helper = (HERE / 'checked-successor-template.cjs').read_text()
    assert helper.count('__PREPARED_SHA256__') == 1
    (BASE / 'checked-successor.cjs').write_text(helper.replace('__PREPARED_SHA256__', sha(target)))
    shutil.copy2(HERE / 'verify-main-integration-template.mjs', BASE / 'verify-main-integration.mjs')
    receipt = {'status': 'reviewed exact teaching successor; progress separate', 'specSha256': sha(target),
               'guards': [{'file': p.relative_to(ROOT).as_posix(), 'sha256': sha(p)} for p in [BASE / 'checked-successor.cjs', BASE / 'verify-main-integration.mjs']]}
    (BASE / 'integration.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print('Prepared19 exact successors and', len(evidence), 'frozen evidence files; main unchanged')


def apply():
    assert not (BASE / 'applied.json').exists(), 'Already applied; do not apply twice'
    spec = load(BASE / 'prepared.json')
    # Check every target before any write, including the verifier connections.
    for r in spec['files']:
        assert sha(ROOT / r['file']) == r['beforeSha256'], r['file']
        assert sha(ROOT / r['beforeFile']) == r['beforeSha256'], r['beforeFile']
        assert sha(ROOT / r['candidateFile']) == r['afterSha256'], r['candidateFile']
    for r in spec['files']:
        (ROOT / r['file']).write_bytes((ROOT / r['candidateFile']).read_bytes())
    assert all(sha(ROOT / r['file']) == r['afterSha256'] for r in spec['files'])
    (BASE / 'applied.json').write_text(json.dumps({'status': 'applied locally; targeted/main/full checks pending', 'files': [{'file': r['file'], 'sha256': r['afterSha256']} for r in spec['files']], 'specSha256': sha(BASE / 'prepared.json'), 'publication': False}, ensure_ascii=False, indent=2) + '\n')
    print('Applied16 reviewed teaching successors and3 verification connections; all checks still pending')


if __name__ == '__main__':
    apply() if sys.argv[1:] == ['--apply'] else prepare()
