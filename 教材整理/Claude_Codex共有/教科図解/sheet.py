# 図の一覧（点検用）python3 sheet.py 出力.png a.png b.png …（2列）
import sys
from PIL import Image
fs = sys.argv[2:]; cols = 2; rows = (len(fs) + 1) // 2
sh = Image.new('RGB', (cols * 964, rows * 544), '#888')
for k, f in enumerate(fs): sh.paste(Image.open(f), ((k % cols) * 964, (k // cols) * 544))
sh.save(sys.argv[1])
