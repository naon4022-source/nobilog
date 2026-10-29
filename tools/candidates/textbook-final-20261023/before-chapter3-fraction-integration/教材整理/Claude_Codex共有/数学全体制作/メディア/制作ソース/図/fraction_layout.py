"""Keep reviewed fraction layouts when an older diagram generator is replayed."""
from pathlib import Path
import hashlib
import json

SOURCES = Path(__file__).resolve().parents[1] / '縦分数_20261023'


def final_svg(ident, generated):
    rows = json.loads((SOURCES / 'manifest.json').read_text())['items']
    chapter2 = SOURCES.parent / '縦分数_2章_20261023/manifest.json'
    rows.update(json.loads(chapter2.read_text())['items'])
    row = rows.get(ident)
    if row is None:
        return generated
    digest = hashlib.sha256(generated.encode()).hexdigest()
    if digest not in {row['beforeSha256'], row['afterSha256'], row.get('generatorBeforeSha256')}:
        raise ValueError(f'{ident}: original content changed; review the fraction layout before regenerating')
    directory = SOURCES.parent / '縦分数_2章_20261023' if ident.startswith('M1-C2-') else SOURCES
    final = (directory / row['file']).read_text()
    if hashlib.sha256(final.encode()).hexdigest() != row['afterSha256']:
        raise ValueError(f'{ident}: reviewed SVG source changed')
    return final
