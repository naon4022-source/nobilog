"""Preserve exact reviewed SVG typesetting when replaying historical generators."""
from pathlib import Path
import hashlib
import json

SOURCES = Path(__file__).resolve().parents[1] / '縦分数_20261023'


def final_svg(ident, generated):
    found = None
    for name in ['縦分数_20261023', '縦分数_2章_20261023', '縦分数_3章_20261023', '縦分数_4章_20261024', '縦分数_5章_20261024', '縦分数_6章_20261025']:
        directory = SOURCES.parent / name
        row = json.loads((directory / 'manifest.json').read_text())['items'].get(ident)
        if row is not None:
            if found is not None:
                raise ValueError(f'{ident}: duplicate reviewed layout identity')
            found = (directory, row)
    if found is None:
        return generated
    directory, row = found
    digest = hashlib.sha256(generated.encode()).hexdigest()
    if digest not in {row['beforeSha256'], row['afterSha256'], row.get('generatorBeforeSha256')}:
        raise ValueError(f'{ident}: original content changed; review the fraction layout before regenerating')
    final = (directory / row['file']).read_text()
    if hashlib.sha256(final.encode()).hexdigest() != row['afterSha256']:
        raise ValueError(f'{ident}: reviewed SVG source changed')
    return final
