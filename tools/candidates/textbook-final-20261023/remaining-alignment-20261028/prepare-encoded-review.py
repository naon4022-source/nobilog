"""Prepare contact sheets from SHA-pinned encoded samples, without approving them."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

for directory in sorted((HERE / 'movies-final').iterdir()):
    receipt = directory / 'technical-media-result.json'
    if not receipt.exists():
        continue
    data = json.loads(receipt.read_text())
    assert sha(directory / 'candidate.mp4') == data['movieSha256']
    output = HERE / 'actual-review' / directory.name
    if (output / 'index.json').exists():
        continue
    output.mkdir(exist_ok=True)
    sheets = []
    for offset in range(0, len(data['samples']), 6):
        batch = data['samples'][offset:offset + 6]
        sheet = Image.new('RGB', (1280, 1158), 'white')
        draw = ImageDraw.Draw(sheet)
        for index, row in enumerate(batch):
            source = ROOT / row['file']
            assert sha(source) == row['sha256']
            x, y = (index % 2) * 640, (index // 2) * 386
            draw.text((x + 8, y + 4), f"{directory.name} {row['time']:.3f}s", fill='black')
            with Image.open(source) as frame:
                sheet.paste(frame.resize((640, 360), Image.Resampling.LANCZOS), (x, y + 24))
        path = output / f'sheet-{offset // 6 + 1:02}.jpg'
        assert not path.exists(), 'Inspect any incomplete prior preparation before overwriting'
        sheet.save(path, quality=95)
        sheets.append(dict(file=path.relative_to(ROOT).as_posix(), sha256=sha(path), samples=batch))
    (output / 'index.json').write_text(json.dumps(dict(status='actual encoded samples prepared; direct review pending', id=directory.name, movieSha256=data['movieSha256'], sheets=sheets), ensure_ascii=False, indent=2) + '\n')
    print(directory.name, len(data['samples']), 'samples', len(sheets), 'sheets', flush=True)
