from svgkit import *
import math
out=[]
s=S('駐車場の料金');s.heading('30分ごとに100円 → 階段の形');X,Y=chart(s,220,780,1100,580,0,120,0,400,[0,30,60,90,120],[0,100,200,300,400],'','円',32)
for k in range(4):
    a,b=30*k,30*(k+1);y=100*(k+1);s.line(X(a),Y(y),X(b),Y(y),BLUE,7)
    s.circle(X(a),Y(y),11,fill='white',stroke=BLUE,sw=4);s.circle(X(b),Y(y),11,fill=BLUE,stroke=BLUE,sw=4)
s.text(1360,320,'● ふくむ',36,BLUE,'start');s.text(1360,390,'○ ふくまない',36,BLUE,'start');s.text(1360,500,'x を決めると',32,INK,'start');s.text(1360,550,'y は1つ',32,INK,'start')
s.text(X(60),850,'止めた時間 x（分）',30);out.append(s.save('M1-C4-S1-D02'))
s=S('かみ合う歯車');s.heading('歯の数 × 回転数 は 同じ')
def gear(cx,cy,r,n,col):
    pts=[]
    for i in range(n*2):
        a=math.pi*2*i/(n*2);rr=r+16 if i%2==0 else r-6
        for d in (-0.35,0.35): pts.append((cx+rr*math.cos(a+d*math.pi/n),cy+rr*math.sin(a+d*math.pi/n)))
    s.poly(pts,fill=col,stroke=INK,sw=3);s.circle(cx,cy,r*0.25,fill='white',stroke=INK,sw=3)
gear(480,430,230,36,'#cfe3f6');gear(480+230+155+8,430,155,24,'#f6dcb8')
s.path('M 330 170 A 300 300 0 0 1 620 170',stroke=BLUE,sw=5);s.arrow(610,165,630,175,BLUE,5);s.path('M 960 270 A 190 190 0 0 0 790 270',stroke=ORANGE,sw=5);s.arrow(800,263,782,275,ORANGE,5)
s.text(400,760,'A：歯が多い → ゆっくり',34,BLUE,weight=800);s.text(960,700,'B：歯が少ない → 速い',34,ORANGE,weight=800)
s.rect(1110,300,440,220,fill='white',stroke=GREEN,sw=5);s.text(1330,380,'かみ合った歯の数',32,GREEN);s.text(1330,450,'A も B も同じ',38,GREEN,weight=800)
s.text(800,860,'歯の数 × 回転数 ＝ 一定 → 回転数は 歯の数に 反比例',34);out.append(s.save('M1-C4-S4-D02'))
s=S('記号の早見表');s.heading('図形の記号 早見表')
rows=[('垂直','AB ⊥ CD','垂直'),('平行','AB ∥ CD','平行'),('角','∠ABC','角 ABC'),('三角形','△ABC','三角形 ABC'),('距離','PH','垂線の長さ')]
for k,(t,sym,yomi) in enumerate(rows):
    x=40+k*310;s.card(x,170,290,600,t,[BLUE,ORANGE,GREEN,PURPLE,RED][k]);cx=x+145;cy=380
    if t=='垂直': s.line(cx-90,cy+40,cx+90,cy+40,INK,4);s.line(cx,cy-80,cx,cy+40,INK,4);right_mark(s,cx,cy+40,1,0,0,-1,22,INK)
    if t=='平行': s.line(cx-100,cy-40,cx+100,cy-40,INK,4);s.line(cx-100,cy+40,cx+100,cy+40,INK,4);s.arrow(cx-10,cy-40,cx+14,cy-40,INK,3,14);s.arrow(cx-10,cy+40,cx+14,cy+40,INK,3,14)
    if t=='角': B=(cx-80,cy+60);s.line(*B,cx+90,cy+60,INK,4);s.line(*B,cx+40,cy-80,INK,4);arc(s,*B,50,0,48,ORANGE,4);s.text(B[0]-20,B[1]+40,'B',30);s.text(cx+40,cy-90,'A',30);s.text(cx+100,cy+90,'C',30)
    if t=='三角形': s.poly([(cx,cy-90),(cx-100,cy+70),(cx+100,cy+70)],fill='#efe6fa',stroke=INK,sw=4)
    if t=='距離': s.line(cx-110,cy+60,cx+110,cy+60,INK,4);s.line(cx,cy-80,cx,cy+60,RED,6);dot(s,cx,cy-80,10,INK);right_mark(s,cx,cy+60,1,0,0,-1,20,INK);s.text(cx+20,cy-80,'P',30,INK,'start');s.text(cx+20,cy+100,'H',30,INK,'start');s.text(cx+120,cy+70,'ℓ',30,INK,'start')
    s.text(cx,580,sym,40,INK,weight=800);s.text(cx,660,yomi,30,DIM)
s.text(800,850,'角は 頂点の文字を まん中に書く',34,GREEN);out.append(s.save('M1-C5-S1-D02'))
print(len(out))
