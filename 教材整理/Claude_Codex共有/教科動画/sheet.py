# 点検用PNGを1枚の一覧にする（Claude）。python3 sheet.py ID 出力.png
import sys, pathlib
from PIL import Image
d = pathlib.Path(__file__).parent / '点検' / sys.argv[1]
fs = sorted(d.glob('s*.png'), key=lambda p: int(p.stem[1:]))
ims = [Image.open(f).resize((640, 360)) for f in fs]
cols = 2; rows = (len(ims) + 1) // 2
sh = Image.new('RGB', (cols * 644, rows * 364), 'white')
for k, im in enumerate(ims): sh.paste(im, ((k % cols) * 644, (k // cols) * 364))
sh.save(sys.argv[2])
