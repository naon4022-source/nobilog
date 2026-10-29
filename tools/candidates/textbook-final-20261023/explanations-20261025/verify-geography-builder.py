from pathlib import Path
import hashlib
import json
import runpy
import shutil
import sys
import tempfile

here = Path(__file__).resolve().parent
root = here.parents[3]
work_relative = Path('教材整理/Claude_Codex共有/地理全体制作')
source = root / work_relative
before = {str(p.relative_to(source)): hashlib.sha256(p.read_bytes()).hexdigest()
          for folder in ['原稿', '制作ソース'] for p in (source / folder).glob('*') if p.is_file()}
with tempfile.TemporaryDirectory(prefix='nobi-geo-source-') as temporary:
    isolated = Path(temporary)
    work = isolated / work_relative
    for folder in ['原稿', '制作ソース']:
        shutil.copytree(source / folder, work / folder)
    # The check-mode generator reads existing media presence; production media are never copied/written.
    (work / 'メディア').symlink_to(source / 'メディア', target_is_directory=True)
    out = isolated / 'site-assets'
    out.mkdir()
    shutil.copyfile(root / 'site-assets/textbook-book-geography.json', out / 'textbook-book-geography.json')
    module = runpy.run_path(str(root / '教材整理/実装/build-textbook-subject.py'))
    globals_ = module['build'].__globals__
    globals_['ROOT'] = isolated
    globals_['OUT'] = out
    previous = sys.argv
    try:
        sys.argv = ['isolated-source-check', 'geography', '--check']
        assert module['build']('geography'), 'Generated geography differs from current textbook'
    finally:
        sys.argv = previous
after = {str(p.relative_to(source)): hashlib.sha256(p.read_bytes()).hexdigest()
         for folder in ['原稿', '制作ソース'] for p in (source / folder).glob('*') if p.is_file()}
assert before == after
(here / 'geography-builder-result.json').write_text(json.dumps({
    'status': 'passed', 'checks': 2,
    'scope': 'Real geography builder in temporary source/output tree, check-mode media-presence symlink only; exact current generated book and unchanged original manuscripts/scripts.',
    'productionSourceWrites': 0
}, indent=2) + '\n')
print('Geography isolated builder: exact current book; production source/scripts unchanged')
