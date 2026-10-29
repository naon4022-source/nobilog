"""Adopt one reviewed scene and existing diagram placement locally, once."""
from pathlib import Path
import json
import hashlib
import shutil
from verify_layout_chain import validate

H = Path(__file__).resolve().parent
R = H.parents[2]
W = R / '教材整理/Claude_Codex共有/数学全体制作'
U = W / 'Claude原稿/M1-C5-S2'
out = H / 'layout-candidate/top'
previous = H / 'layout-previous'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert not (H / 'layout-integration.json').exists(), 'already applied; do not reapply'
validate(False)
layout = load(out / 'layout-measurement.json')
assert len(layout['checkedSpreads']) == 58 and layout['total'] == 652
assert not any(layout[k] for k in ['pictureless', 'overflows', 'brokenImages', 'errors'])
assert load(out / 'visibility/browser-result.json')['passed']
change = load(out / 'builder-change.json')
builder = R / '教材整理/実装/build-textbook-book.py'
assert sha(builder) == change['beforeSha256']
assert sha(out / builder.name) == change['afterSha256']
book = R / 'site-assets/textbook-book-math1.json'
assert sha(book) == sha(previous / book.name)
for p in [U / '本文.md', U / '本の追加.json', W / '制作台帳.json']:
    assert p.read_bytes() == (previous / p.name).read_bytes(), 'source drift: ' + p.name
art = load(H / 'new-apply-image/generation-receipt.json')
image = R / art['workspaceFile']
assert sha(image) == art['sha256'] and art['generationCount'] == 1
adopted = W / 'メディア/M1-C5-S2-APPLY.png'
assert not adopted.exists()
shutil.copy2(builder, previous / builder.name)
for source, target in [(out / builder.name, builder), (out / '本の追加.json', U / '本の追加.json'),
    (out / '制作台帳.json', W / '制作台帳.json'), (out / book.name, book), (image, adopted),
    (out / 'textbook-book-math1-m1-c5-s2-apply.jpg', R / 'site-assets/textbook-book-math1-m1-c5-s2-apply.jpg')]:
    shutil.copy2(source, target)
receipt = {'date': '2026-10-21', 'scope': 'local only; one pre-generated scene, existing DP3 movement, exact marker compatibility',
    'bookBeforeSha256': sha(previous / book.name), 'bookAfterSha256': sha(book),
    'newImagesGenerated': 0, 'newImageSlotsAdopted': 1, 'videosChanged': 0,
    'textUnchanged': True, 'postIntegrationChecks': 'pending', 'postFullSuite': 'pending'}
(H / 'layout-integration.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
validate(True)
print('Reviewed chapter-five layout adopted locally once; 0 new generations, 0 video changes; integrated/full checks pending')
