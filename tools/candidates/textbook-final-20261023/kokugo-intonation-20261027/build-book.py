"""Capture the real book builder in a durable isolated tree; original files stay unchanged."""
from pathlib import Path
import hashlib
import json
import runpy
import shutil
import sys

sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
RELATIVE=Path('\u6559\u6750\u6574\u7406/Claude_Codex\u5171\u6709/\u56fd\u8a9e\u5168\u4f53\u5236\u4f5c')
SOURCE=ROOT/RELATIVE
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    isolated=HERE/'book-build-attempt2';assert not isolated.exists(), 'Do not overwrite a completed build'
    before={str(p.relative_to(ROOT)):sha(p) for name in ['\u539f\u7a3f','\u5236\u4f5c\u30bd\u30fc\u30b9'] for p in (SOURCE/name).glob('*') if p.is_file()}
    work=isolated/RELATIVE
    for name in ['\u539f\u7a3f','\u5236\u4f5c\u30bd\u30fc\u30b9']:shutil.copytree(SOURCE/name,work/name)
    (work/'\u30e1\u30c7\u30a3\u30a2').symlink_to(SOURCE/'\u30e1\u30c7\u30a3\u30a2',target_is_directory=True)
    out=isolated/'site-assets';out.mkdir()
    target=out/'textbook-book-kokugo1.json';original=ROOT/'site-assets/textbook-book-kokugo1.json'
    shutil.copy2(original,target)
    module=runpy.run_path(str(ROOT/'\u6559\u6750\u6574\u7406/\u5b9f\u88c5/build-textbook-subject.py'),run_name='isolated_library')
    function=module['build'];function.__globals__['ROOT']=isolated;function.__globals__['OUT']=out
    old_argv=sys.argv[:]
    def build():
        captured={}
        def observe(frame,event,value):
            if frame.f_code is function.__code__ and event=='return':captured['text']=frame.f_locals.get('text')
        previous=sys.getprofile();sys.setprofile(observe)
        try:return function('kokugo1'),captured
        finally:sys.setprofile(previous)
    try:
        sys.argv=['isolated-book','kokugo1','--check']
        baseline,base=build();assert baseline and base['text']==original.read_text()
        manifest=json.loads((HERE/'alignment-v2/manifest.json').read_text())
        row=next(r for r in manifest['files'] if r['file'].endswith('.py'))
        candidate=HERE/'alignment-v2/output'/row['file'];assert sha(candidate)==row['afterSha256']
        shutil.copy2(candidate,isolated/row['file'])
        for extra in manifest['files'][1:]:
            extra_file=HERE/'alignment-v2/output'/extra['file'];assert sha(extra_file)==extra['afterSha256'];shutil.copy2(extra_file,isolated/extra['file'])
        equal,captured=build()
        assert equal is False and captured['text'], 'Changed explanation should differ from baseline'
        new=json.loads(captured['text']);old=json.loads(base['text']);changed=[]
        def expected(value,path=()):
            if isinstance(value,dict):return {k:expected(v,path+(k,)) for k,v in value.items()}
            if isinstance(value,list):return [expected(v,path+(i,)) for i,v in enumerate(value)]
            if isinstance(value,str):
                text=value
                for replacement in manifest['replacements']:text=text.replace(replacement['old'],replacement['new'])
                if text!=value:changed.append(path)
                return text
            return value
        converted=expected(old)
        # The original builder selects a pointing Nobi for dialogue containing 'たとえば'.
        # Permit only this deterministic pose change on the exact revised sentence.
        old_line=old['pages'][63]['blocks'][1]['lines'][3]
        new_line=new['pages'][63]['blocks'][1]['lines'][3]
        assert old_line[1]=='nobi-normal' and new_line[1]=='nobi-point'
        assert old_line[2]==manifest['replacements'][-1]['old'] and new_line[2]==manifest['replacements'][-1]['new']
        converted['pages'][63]['blocks'][1]['lines'][3][1]='nobi-point'
        assert converted==new and len(changed)==4, 'Unrelated book content or metadata changed'
        destination=HERE/'candidate-book';destination.mkdir();book=destination/'textbook-book-kokugo1.json';book.write_text(captured['text'])
        target.write_text(captured['text'])
        matches,_=build();assert matches, 'Candidate must reproduce from exact changed author data'
    finally:sys.argv=old_argv
    assert all(sha(ROOT/f)==h for f,h in before.items())
    receipt={'status':'isolated candidate book reproduced; main unchanged','book':book.relative_to(ROOT).as_posix(),'beforeSha256':sha(original),'candidateSha256':sha(book),'changedTextPaths':changed,'derivedPoseChange':{'path':['pages',63,'blocks',1,'lines',3,1],'before':'nobi-normal','after':'nobi-point','reason':'Original builder selects pointing pose for the revised example sentence containing たとえば'},'logicalPages':len(new['pages']),'sourceAuthorCandidateSha256':row['afterSha256'],'originalSourcesUnchanged':before,'scope':'Actual unmodified builder in --check mode. Baseline and final candidate reproduce. Four explanation strings and exactly one automatically derived dialogue pose differ; all other book content and metadata preserved. No production media copy/write. Video playback, context/catalog regeneration and main integration pending.'}
    (HERE/'book-result.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    print('Candidate book preserved:',len(changed),'text paths;',len(new['pages']),'logical pages; no main edits')


if __name__=='__main__':main()
