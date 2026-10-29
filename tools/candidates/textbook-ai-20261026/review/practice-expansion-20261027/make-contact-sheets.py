import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
questions = json.loads((HERE / 'data.json').read_text())['questions']
output = HERE / 'reviewed-screens'
output.mkdir(exist_ok=True)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 14)
except OSError:
    font = ImageFont.load_default()
sheets = []
for batch in range(8):
    group = questions[batch * 6:(batch + 1) * 6]
    paths = [HERE / 'practice-screens' / ('all-390-' + q['id'] + '.png') for q in group]
    shots = [Image.open(path).convert('RGB') for path in paths]
    width = max(shot.width for shot in shots)
    height = max(shot.height for shot in shots) + 28
    sheet = Image.new('RGB', (3 * (width + 12) + 12, 2 * (height + 12) + 12), '#d8e5df')
    draw = ImageDraw.Draw(sheet)
    for index, (question, shot) in enumerate(zip(group, shots)):
        x = 12 + index % 3 * (width + 12)
        y = 12 + index // 3 * (height + 12)
        draw.text((x, y), question['id'], font=font, fill='#12362c')
        sheet.paste(shot, (x, y + 28))
    target = output / ('phone-' + str(batch + 1) + '.png')
    sheet.save(target)
    sheets.append({'file': str(target.relative_to(ROOT)), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                   'screens': [{'file': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'id': question['id']}
                               for path, question in zip(paths, group)]})
(output / 'contact-sheets.json').write_text(json.dumps({'scope': '48 phone views grouped without resizing or cropping; direct review pending', 'sheets': sheets}, indent=2) + '\n')
print('Eight unscaled sheets refreshed;48 current phone images, no source image changes.')
