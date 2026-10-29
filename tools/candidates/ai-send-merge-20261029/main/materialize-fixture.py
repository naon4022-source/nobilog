from pathlib import Path
import json,hashlib,shutil
ROOT=Path.cwd();U=Path(__file__).resolve().parent;N=Path('tools/candidates/nonadmin-ai-reader-successor-20261029/main')
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
fixture=U/'future-view';fixture.mkdir(exist_ok=False)
virtual=load(U/'virtual-map.json');files=set(load(U/'dependencies.json'));generated=load(U/'fixture-generated-inputs.json')['files'];files.update(r['file']for r in generated)
files.update([str(N/'verify-main-integration.mjs'),str(N/'checked-successor.cjs'),str(N/'prepared.json'),str(N/'integration.json')])
# Mutable runtime outputs are written only inside this separate fixture.
writers={str(N/x)for x in ['source-current-result.json','library-result.json','route-result.json','previous-teaching.log','previous-vision.log','legacy-practice-integration.log','basic-index.log','basic-annotations.log']}
writers.update(['tools/candidates/textbook-vision-20261027/main/source-current-result.json','tools/candidates/textbook-ai-20261026/review/practice-integration-current-result.json'])
for folder,names in [('tools/candidates/real-api-trial-20261029',['status-replay-result.json','send-stage-result.json','save-idle-result.json','save-idle-browser-result.json']),('tools/candidates/math-history-toolbar-20261029',['result.json'])]:writers.update(folder+'/'+n for n in names)
for f in sorted(files):
 assert not Path(f).is_absolute() and '..' not in Path(f).parts,f
 if f in writers:continue
 src=ROOT/virtual.get(f,f);assert src.is_file(),f
 dst=fixture/f;dst.parent.mkdir(parents=True,exist_ok=True)
 # Python code resolves __file__, so copy it to retain the fixture root.
 if src.suffix=='.py':shutil.copyfile(src,dst)
 else:dst.symlink_to(src)
 assert sha(dst)==sha(src),f
for r in generated:assert sha(fixture/r['file'])==r['sha256']
(U/'fixture.json').write_text(json.dumps({'status':'isolated future source view only','fixture':str(fixture.relative_to(ROOT)),'files':len(files),'generatedBuildInputs':len(generated),'mainChanged':False},indent=2)+'\n')
print('Prepared private future fixture:',len(files),'public files; no canonical source writes.')
