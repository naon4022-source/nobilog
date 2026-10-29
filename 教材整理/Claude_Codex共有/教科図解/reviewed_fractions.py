"""Preserve the explicitly reviewed science diagram when replaying hints."""
from pathlib import Path
import hashlib,json
DIRECTORY=Path(__file__).resolve().parents[1]/'理科全体制作/メディア/制作ソース/縦分数_20261025'
TARGET='S1-MATTER-S1-DQ'
def final_svg(ident,generated):
    if ident!=TARGET:
        return generated
    rows=json.loads((DIRECTORY/'manifest.json').read_text())['items']
    if set(rows)!={TARGET}:
        raise ValueError('unexpected science fraction registry')
    row=rows[TARGET]
    if row['file']!=TARGET+'.svg':
        raise ValueError('unexpected canonical SVG filename')
    digest=hashlib.sha256(generated.encode()).hexdigest()
    if digest not in {row['beforeSha256'],row['afterSha256']}:
        raise ValueError('science source changed; review the exact typesetting first')
    final=(DIRECTORY/row['file']).read_bytes()
    if hashlib.sha256(final).hexdigest()!=row['afterSha256']:
        raise ValueError('reviewed science SVG changed')
    return final.decode()
