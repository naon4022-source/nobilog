from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[2]/'site-assets'
for size,name in [(192,'admin-icon-192.png'),(512,'admin-icon-512.png'),(180,'admin-apple-touch-icon.png'),(64,'admin-favicon-64.png')]:
 scale=4
 im=Image.new('RGB',(512*scale,512*scale),'#eff6ee');d=ImageDraw.Draw(im)
 def ellipse(box,fill):d.ellipse(tuple(int(v*scale) for v in box),fill=fill)
 def polygon(points,fill):d.polygon([(int(x*scale),int(y*scale))for x,y in points],fill=fill)
 ellipse((84,419,428,460),'#c8ddc4')
 polygon([(225,244),(285,244),(282,436),(226,436)],'#91623f')
 polygon([(237,247),(256,247),(255,436),(237,436)],'#b77d50')
 polygon([(244,322),(170,269),(159,287),(240,359)],'#91623f')
 polygon([(267,306),(331,262),(343,280),(271,341)],'#91623f')
 ellipse((105,136,302,332),'#296344');ellipse((211,133,412,337),'#256344');ellipse((154,62,362,264),'#397c4d');ellipse((116,112,287,286),'#488b54');ellipse((247,94,386,264),'#397c4d');ellipse((187,88,297,190),'#5c9b60');ellipse((119,177,224,282),'#559459')
 im.resize((size,size),Image.Resampling.LANCZOS).save(root/name)
