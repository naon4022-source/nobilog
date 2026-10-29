from svgkit import *
out=[]
# ---- 3章2節の図の枠 ----
s=S('過不足の線分図');s.heading('配り方を変えても、全体は同じ')
x0,u=200,10;W6=6*12*u*0+0
L=870;R6=L-150   # 全体の右端は x0+L
s.rect(x0,300,R6,90,fill=SKY,stroke=INK,sw=4,rx=4);s.rect(x0+R6,300,150,90,fill='#f6dcb8',stroke=INK,sw=4,rx=4);s.text(x0+R6/2,360,'6枚ずつ配った分 6x',40);s.text(x0+R6+75,360,'余り 15',38)
s.rect(x0,480,L+90,90,fill=SKY,stroke=INK,sw=4,rx=4);s.rect(x0+L,480,90,90,fill='white',stroke=RED,sw=4,rx=4,dash='12 8');s.text(x0+L/2,540,'8枚ずつ配る分 8x',40);s.text(x0+L+45,620,'足りない 9',38,RED)
s.line(x0+L,250,x0+L,600,BLUE,4,'14 10');s.line(x0,250,x0,600,BLUE,4,'14 10')
s.path(f'M{x0} 250 Q{x0} 220 {x0+30} 220 L{x0+L/2-30} 220 L{x0+L/2} 190 L{x0+L/2+30} 220 L{x0+L-30} 220 Q{x0+L} 220 {x0+L} 250',stroke=BLUE,sw=5);s.text(x0+L/2,175,'折り紙の全体',44,BLUE,weight=800)
s.text(1300,380,'6x ＋ 15',48);s.text(1300,450,'＝',48);s.text(1300,520,'8x − 9',48);s.text(800,760,'全体の右端が上下でそろう → 等しい関係',42,ORANGE);out.append(s.save('M1-C3-S2-FIG01'))
s=S('追いつく問題の表と線分図');s.heading('追いつく問題：表と線分図')
cols=['','速さ（m/分）','時間（分）','道のり（m）'];rows=[['妹','60','15＋x','60(15＋x)'],['姉','150','x','150x']]
for i,t in enumerate(cols): s.rect(150+i*330,150,330,80,fill=BLUE if i else PALE,stroke=INK,sw=2,rx=0);s.text(315+i*330,205,t,36,'white' if i else INK)
for r,row in enumerate(rows):
    for i,t in enumerate(row): s.rect(150+i*330,230+r*80,330,80,fill='white',stroke=INK,sw=2,rx=0);s.text(315+i*330,285+r*80,t,40,[PURPLE,GREEN][r] if i in (0,3) else INK)
y1,y2=530,660;s.text(110,y1+12,'妹',40,PURPLE,'end');s.text(110,y2+12,'姉',40,GREEN,'end');s.line(150,y1,1350,y1,PURPLE,10);s.line(150+400,y2,1350,y2,GREEN,10);s.line(150,y2,550,y2,GREEN,4,'10 10')
s.line(150,480,150,720,INK,3);s.text(150,760,'家',40);s.line(1350,480,1350,720,ORANGE,4,'12 8');s.text(1350,760,'追いついた地点',38,ORANGE)
s.text(350,y1-20,'先に 60×15＝900m',32,PURPLE);s.text(950,y2+60,'姉の道のり ＝ 妹の道のり',36,ORANGE);out.append(s.save('M1-C3-S2-FIG02'))
s=S('2：7の帯');s.heading('白：青 ＝ 2：7（全体 180g）');x0,w=170,140
s.add('<defs><pattern id="c3-blue-hatch" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#8ec1ec"/><path d="M-5 5 L5 -5 M0 20 L20 0 M15 25 L25 15" stroke="#1f5fa8" stroke-width="3" stroke-opacity=".45"/></pattern></defs>')
for k in range(9):
    s.rect(x0+k*w,300,w,130,fill='white' if k<2 else 'url(#c3-blue-hatch)',stroke=INK,sw=4,rx=0)
s.text(x0+w,380,'白',44);s.text(x0+2*w+3.5*w,380,'青',44,BLUE)
for (a,b,t,c,y) in [(0,2,'2',INK,270),(2,9,'7',BLUE,270),(0,9,'全体 9 ＝ 180g',ORANGE,520)]:
    xa,xb=x0+a*w,x0+b*w;yy=y if y<400 else 460;s.path(f'M{xa} {yy+(-10 if y<400 else 10)} L{xa} {yy} L{xb} {yy} L{xb} {yy+(-10 if y<400 else 10)}',stroke=c,sw=4) if False else None
s.path(f'M{x0} 280 L{x0} 260 L{x0+2*w} 260 L{x0+2*w} 280',stroke=INK,sw=4);s.text(x0+w,240,'2',44)
s.path(f'M{x0+2*w} 280 L{x0+2*w} 260 L{x0+9*w} 260 L{x0+9*w} 280',stroke=BLUE,sw=4);s.text(x0+5.5*w,240,'7',44,BLUE)
s.path(f'M{x0} 450 L{x0} 470 L{x0+9*w} 470 L{x0+9*w} 450',stroke=ORANGE,sw=5);s.text(x0+4.5*w,530,'全体 9ます ＝ 180g',46,ORANGE,weight=800)
s.text(800,680,'白：全体 ＝ 2：9 とも読める',44);s.text(800,770,'ますの幅はどれも同じ',38,DIM);out.append(s.save('M1-C3-S2-FIG03'))
# ---- 4章1節 ----
s=S('変域を数直線で');s.heading('変域 2≦x＜7');X=s.numline(160,1440,380,0,10,1)
s.line(X(2),380,X(7),380,ORANGE,14);s.circle(X(2),380,18,fill=ORANGE,stroke=ORANGE);s.circle(X(7),380,18,fill='white',stroke=ORANGE,sw=6)
s.text(X(2),300,'2 をふくむ',38,ORANGE);s.text(X(7),300,'7 はふくまない',38,ORANGE)
s.rect(220,560,520,170,fill='white',stroke=INK,sw=3);s.circle(300,645,18,fill=INK);s.text(340,660,'以上・以下（ふくむ）',38,INK,'start')
s.rect(860,560,520,170,fill='white',stroke=INK,sw=3);s.circle(940,645,18,fill='white',stroke=INK,sw=5);s.text(980,660,'より大きい・未満',38,INK,'start');out.append(s.save('M1-C4-S1-D01'))
s=S('この節の地図');s.heading('関数の地図')
s.card(80,160,440,300,'変数',BLUE);s.lines(300,320,['いろいろな値を','とる文字 x、y'],38)
s.card(580,160,440,300,'関数',ORANGE);s.lines(800,300,['x を決めると','y が1つに決まる'],38)
s.card(1080,160,440,300,'変域',GREEN);s.lines(1300,300,['変数のとる','値の範囲','（不等号で表す）'],36,gap=50)
s.rect(180,540,560,200,fill='#edf5ef',stroke=GREEN,sw=4);s.text(460,610,'○ 関数',42,GREEN);s.text(460,680,'正方形の1辺 → 周の長さ',36)
s.rect(860,540,560,200,fill='white',stroke=RED,sw=4,dash='12 8');s.text(1140,610,'✗ 関数ではない',42,RED);s.text(1140,680,'身長 → 体重',36);out.append(s.save('M1-C4-S1-DMAP'))
s=S('ろうそくが短くなる');s.heading('時間がたつと 短くなる')
for k,mn in enumerate([0,5,10,15,20]):
    x=230+k*285;h=300*(1-mn/20);y0=520
    if h>0: s.rect(x-35,y0-h,70,h,fill='#fff3d6',stroke=INK,sw=4,rx=6);s.path(f'M{x} {y0-h-50} Q{x+22} {y0-h-20} {x} {y0-h-4} Q{x-22} {y0-h-20} {x} {y0-h-50}Z',fill=ORANGE,stroke=ORANGE,sw=2)
    else: s.text(x,y0-20,'燃えつきた',34,DIM)
    s.text(x,575,f'{mn}分',40)
s.text(230,175,'30cm',40,INK);X=s.numline(230,1370,720,0,20,5,labels=False)
for v in (0,5,10,15,20): s.text(X(v),780,str(v),36)
s.circle(X(0),720,16,fill=ORANGE,stroke=ORANGE);s.circle(X(20),720,16,fill=ORANGE,stroke=ORANGE);s.line(X(0),720,X(20),720,ORANGE,10);s.text(1450,730,'（分）',34,INK,'start');out.append(s.save('M1-C4-S1-DP1'))
# ---- 4章2節 ----
s=S('負の数の比例');s.heading('1時間に 2℃ずつ下がる')
xs=[-3,-2,-1,0,1,2,3]
for i,v in enumerate(xs):
    s.rect(330+i*150,170,150,80,fill=PALE,stroke=INK,sw=2,rx=0);s.text(405+i*150,225,('−' if v<0 else '')+str(abs(v)),40)
    yv=-2*v;s.rect(330+i*150,250,150,80,fill='white',stroke=INK,sw=2,rx=0);s.text(405+i*150,305,('−' if yv<0 else '')+str(abs(yv)),40,BLUE)
s.rect(150,170,180,80,fill=BLUE,stroke=INK,sw=2,rx=0);s.text(240,225,'x（時間）',32,'white');s.rect(150,250,180,80,fill=BLUE,stroke=INK,sw=2,rx=0);s.text(240,305,'y（℃）',32,'white')
X=s.numline(405,1305,500,-3,3,1)
for i,v in enumerate(xs): s.line(405+i*150,340,X(v),480,DIM,2,'6 6')
s.text(X(-2),630,'← 過去',40,PURPLE);s.text(X(0),630,'今',42,BLUE,weight=800);s.text(X(2),630,'未来 →',40,GREEN)
s.text(800,720,'3時間前（x＝−3）は、今より 6℃ 高かった',42,ORANGE);out.append(s.save('M1-C4-S2-D01'))
s=S('座標平面の4つの部分');s.heading('4つの部分と 符号');X,Y=s.axes(800,470,62,-5,5,-5,5,grid=True,labels=False)
for (qx,qy,t,c) in [(2.7,2.7,'（＋，＋）',BLUE),(-2.7,2.7,'（−，＋）',GREEN),(-2.7,-2.7,'（−，−）',PURPLE),(2.7,-2.7,'（＋，−）',ORANGE)]:
    s.rect(X(qx)-150,Y(qy)-50,300,90,fill='white',stroke=c,sw=4);s.text(X(qx),Y(qy)+14,t,44,c,weight=800)
s.text(1280,300,'x 座標，y 座標',36,INK,'middle');out.append(s.save('M1-C4-S2-D02'))
s=S('傾きくらべ');s.heading('a の値と グラフの傾き');X,Y=s.axes(620,480,64,-5,5,-5,5,labels=False)
for a,lab,c in [(3,'y＝3x',RED),(1,'y＝x',ORANGE),(1/3,'y＝⅓x',GREEN),(-1,'y＝−x',PURPLE),(-3,'y＝−3x',BLUE)]:
    plot(s,X,Y,lambda x,a=a:a*x,-5,5,c,6,ylim=(-5,5))
    xe=min(5,5/abs(a));ye=a*xe;s.text(X(xe)+(14 if abs(a)<2 else 10),Y(ye)+(10 if abs(a)<2 else -6),lab,36,c,'start')
s.rect(1080,520,480,220,fill='white',stroke=INK,sw=3);s.lines(1320,580,['a＞0 → 右上がり','a＜0 → 右下がり','|a| が大きいほど 急'],34,gap=60);out.append(s.save('M1-C4-S2-D03'))
s=S('この節の地図');s.heading('比例の 3つの顔')
s.card(70,170,440,360,'表',BLUE);
for i in range(4): s.rect(110,260+i*60,180,60,fill=PALE,stroke=INK,sw=2,rx=0);s.rect(290,260+i*60,180,60,fill='white',stroke=INK,sw=2,rx=0);s.text(200,302+i*60,str(i+1),34);s.text(380,302+i*60,str(16*(i+1)),34,BLUE)
s.card(580,170,440,360,'式',ORANGE);s.text(800,370,'y ＝ ax',64,ORANGE,weight=800);s.text(800,450,'a：比例定数',36)
s.card(1090,170,440,360,'グラフ',GREEN);s.line(1150,480,1480,480,INK,3);s.line(1170,500,1170,260,INK,3);s.line(1170,480,1450,280,GREEN,6);s.text(1300,520,'原点を通る直線',32,GREEN)
for x1,x2 in ((515,575),(1025,1085)): s.arrow(x1,350,x2,350,INK,5);s.arrow(x2,380,x1,380,INK,5)
s.text(800,650,'x が2倍・3倍 → y も2倍・3倍、y÷x ＝ a',42);s.text(800,740,'表・式・グラフのどれからでも、ほかの2つが作れる',38,ORANGE);out.append(s.save('M1-C4-S2-DMAP'))
s=S('原点と1点で直線を引く');s.heading('原点ともう1点を 結ぶ');X,Y=s.axes(800,450,52,-7,7,-7,6,step=2)
plot(s,X,Y,lambda x:1.5*x,-4.6,4,BLUE,6);dot(s,X(0),Y(0),12,INK);dot(s,X(-4),Y(-6),14,ORANGE);s.text(X(-4)+24,Y(-6)+12,'(−4, −6)',38,ORANGE,'start');s.circle(X(2),Y(3),16,fill='white',stroke=GREEN,sw=6);s.text(X(2)+26,Y(3)+12,'(2, 3) も通る？',38,GREEN,'start');out.append(s.save('M1-C4-S2-DP1'))
s=S('三角形の面積と高さ');s.heading('高さを 2倍・3倍にすると');u=56
for k,h in enumerate([1,2,3]):
    x0=150+k*470;y0=560
    for i in range(7):
        for j in range(4): s.rect(x0+i*u,y0-(j+1)*u,u,u,fill='none',stroke='#d5dee9',sw=2,rx=0)
    s.poly([(x0,y0),(x0+6*u,y0),(x0+2*u,y0-h*u)],fill=SKY,stroke=INK,sw=4);s.text(x0+3*u,y0+50,'底辺 6cm',36);s.text(x0+3*u,y0-4.6*u,f'高さ {h}cm',40,ORANGE,weight=800)
s.text(800,740,'面積も 2倍・3倍 になるか、ます目を数えて確かめよう',40);out.append(s.save('M1-C4-S2-DP2'))
s=S('座標で三角形をつくる');s.heading('座標から 辺の長さを読む');X,Y=s.axes(780,450,60,-5,5,-5,5,labels=False)
P={'A':(-2,1),'B':(3,1),'C':(3,-3)};s.poly([(X(x),Y(y)) for x,y in P.values()],fill='#f6dcb8',stroke=ORANGE,sw=6)
for n,(x,y) in P.items(): dot(s,X(x),Y(y),11,ORANGE);s.text(X(x)+(-30 if n=='A' else 30),Y(y)+(-18 if y>0 else 40),f'{n}({x}, {y})'.replace('(-','(−').replace(', -',', −'),36,INK,'middle')
out.append(s.save('M1-C4-S2-DP3'))
s=S('表・式・グラフは同じことを言っている');s.heading('階段の高さ（1段16cm）')
for i in range(5): s.rect(90,200+i*80,150,80,fill=PALE,stroke=INK,sw=2,rx=0);s.rect(240,200+i*80,170,80,fill='white',stroke=INK,sw=2,rx=0);s.text(165,255+i*80,str(i+1),38);s.text(325,255+i*80,str(16*(i+1)),38,BLUE)
s.text(165,180,'段数 x',30);s.text(325,180,'高さ y',30);s.rect(560,330,420,140,fill='#fff7ec',stroke=ORANGE,sw=5);s.text(770,420,'y ＝ 16x',60,ORANGE,weight=800)
X=lambda v:1080+v*80;Y=lambda v:620-v*5.2;s.line(1060,620,1520,620,INK,3);s.line(1080,640,1080,180,INK,3);s.line(X(0),Y(0),X(5.4),Y(16*5.4),DIM,3,'10 8')
for k in range(1,6): dot(s,X(k),Y(16*k),11,GREEN)
s.text(1300,680,'段数のところだけ点',32,GREEN)
for x1,x2 in ((420,550),(990,1060)): s.arrow(x1,390,x2,390,INK,5);s.arrow(x2,420,x1,420,INK,5)
out.append(s.save('M1-C4-S2-D04'))
# ---- 4章3節 ----
s=S('xyが一定の長方形');s.heading('面積 18 の長方形');u=24;x0=120
for (w,h) in [(1,18),(2,9),(3,6),(6,3)]:
    s.rect(x0,560-h*u,w*u*2.4,h*u,fill=SKY,stroke=INK,sw=4,rx=2) if False else s.rect(x0,560-h*u,w*u*3,h*u,fill=SKY,stroke=INK,sw=4,rx=2)
    s.text(x0+w*u*1.5,600,f'横{w}',36);s.text(x0+w*u*3+14,560-h*u/2+12,f'縦{h}',36,INK,'start');s.text(x0+w*u*1.5,650,f'{w}×{h}＝18',34,ORANGE);x0+=w*u*3+130
s.text(800,770,'形はちがっても、横×縦 はいつも 18',44,BLUE);out.append(s.save('M1-C4-S3-D01'))
s=S('aの符号と位置');s.heading('a の符号で 曲線の場所が決まる')
for k,(a,c) in enumerate([(6,BLUE),(-6,ORANGE)]):
    X,Y=s.axes(430+k*740,470,36,-7,7,-7,7,grid=False,labels=False)
    plot(s,X,Y,lambda x,a=a:a/x,0.86,7,c,6);plot(s,X,Y,lambda x,a=a:a/x,-7,-0.86,c,6)
    s.text(430+k*740+(-150 if a>0 else 150),260,f'y ＝ {"" if a>0 else "−"}6/x',46,c,weight=800);s.text(430+k*740,790,'右上・左下' if a>0 else '左上・右下',42,c)
out.append(s.save('M1-C4-S3-D02'))
s=S('この節の地図');s.heading('比例と反比例をくらべる')
hd=['','比例 y＝ax','反比例 y＝a/x'];rw=[['x が2倍','y も2倍','y は½倍'],['一定のもの','y÷x ＝ a','x×y ＝ a'],['グラフ','原点を通る直線','双曲線']]
for i,t in enumerate(hd): s.rect(150+i*440 if i else 150,160,440 if i else 0,0,fill='none',stroke='none') if False else None
for i,t in enumerate(hd):
    w=[340,520,520][i];x=[150,490,1010][i];s.rect(x,160,w,100,fill=[PALE,BLUE,ORANGE][i],stroke=INK,sw=2,rx=0);s.text(x+w/2,225,t,40,'white' if i else INK)
for r,row in enumerate(rw):
    for i,t in enumerate(row): w=[340,520,520][i];x=[150,490,1010][i];s.rect(x,260+r*140,w,140,fill='white',stroke=INK,sw=2,rx=0);s.text(x+w/2,345+r*140,t,40)
out.append(s.save('M1-C4-S3-DMAP'))
s=S('リボンを等分する');s.heading('60cm のリボンを 等分する');L=1200
for k,n in enumerate([2,3,4]):
    y=200+k*170;s.text(150,y+55,f'{n}等分',40,BLUE,'end') if False else s.text(160,y+55,f'{n}等分',40,BLUE,'start')
    for j in range(n): s.rect(300+j*L/n,y,L/n,80,fill=[SKY,'#f6dcb8','#cdebd7'][k] if j==0 else 'white',stroke=INK,sw=4,rx=4)
    s.path(f'M300 {y+100} L300 {y+120} L{300+L/n} {y+120} L{300+L/n} {y+100}',stroke=ORANGE,sw=4);s.text(300+L/n/2,y+160,'1本分',34,ORANGE)
s.text(800,770,'等分する数がふえると、1本分は短くなる',42);out.append(s.save('M1-C4-S3-DP1'))
# ---- 4章4節 ----
s=S('人数と時間の反比例');s.heading('人数がふえると、時間はへる')
def person(x,y,c=BLUE): s.circle(x,y,14,fill=c,stroke=c);s.path(f'M{x-18} {y+46} Q{x} {y+12} {x+18} {y+46}Z',fill=c,stroke=c,sw=2)
for k,(n,h) in enumerate([(1,12),(2,6),(3,4),(4,3),(6,2),(12,1)]):
    x=140+k*250;s.rect(x-110,150,220,560,fill='white',stroke='#c9d6e8',sw=3)
    for j in range(n): person(x-90+(j%4)*60+ (0 if n>=4 else (4-n)*30) ,190+(j//4)*70)
    s.text(x,450,f'{n}人',44,BLUE,weight=800);s.circle(x,560,60,fill='#fff7ec',stroke=ORANGE,sw=4);s.path(f'M{x} 560 L{x} 512 M{x} 560 L{x+34} 575',stroke=ORANGE,sw=5);s.text(x,670,f'{h}時間',42,ORANGE,weight=800)
s.text(800,800,'人数 × 時間 ＝ 12 がいつも同じ',44);out.append(s.save('M1-C4-S4-D01'))
s=S('この節の地図');s.heading('何が一定か で 仕分ける')
s.card(80,160,690,560,'比例 y＝ax',BLUE);s.lines(425,310,['1あたりが一定','・紙 1枚の重さ','・歩く速さ（道のり）','・1冊の値段（代金）'],38,gap=80)
s.card(830,160,690,560,'反比例 y＝a/x',ORANGE);s.lines(1175,310,['全体の量が一定','・同じ道のりの速さと時間','・仕事の人数と時間','・かみ合う歯車'],38,gap=80);out.append(s.save('M1-C4-S4-DMAP'))
s=S('2人の間がはなれていく');s.heading('1分ごとの 2人の位置')
for k,(n,v,c) in enumerate([('A（分速90m）',90,BLUE),('B（分速70m）',70,ORANGE)]):
    y=300+k*230;s.text(80,y-75,n,38,c,'start');s.line(120,y,1500,y,INK,4);s.text(120,y+50,'0',34)
    for m in range(0,7): x=120+v*m*2.6;s.circle(x,y,14,fill=c,stroke=c);s.text(x,y-24,f'{m}分',28,c) if m else None
for m in (2,4,6): x1=120+90*m*2.6;x2=120+70*m*2.6;s.line(x2,560,x1,560,GREEN,6);s.text((x1+x2)/2,600,f'{20*m}m',34,GREEN)
s.text(800,720,'1分で 90−70＝20m ずつ はなれていく',42,ORANGE);out.append(s.save('M1-C4-S4-DP1'))
# ---- 4章 章末 ----
s=S('比例と反比例の見分け方');s.heading('比例？ 反比例？ 見分ける順番')
for k,(a,b,c2,col) in enumerate([('y÷x が一定','比例 y＝ax','原点を通る直線',BLUE),('x×y が一定','反比例 y＝a/x','双曲線',ORANGE)]):
    x=120+k*720;
    for j,t in enumerate([a,b,c2]): s.rect(x,170+j*200,640,130,fill='white' if j!=1 else '#fff7ec',stroke=col,sw=5);s.text(x+320,250+j*200,t,46,col if j==1 else INK,weight=800)
    s.arrow(x+320,305,x+320,365,col,6);s.arrow(x+320,505,x+320,565,col,6)
out.append(s.save('M1-C4-REVIEW-E01'))
s=S('双曲線上の2点');s.heading('y＝a/x 上の 2点');X,Y=s.axes(800,450,30,-12,12,-11,11,grid=False,labels=False)
plot(s,X,Y,lambda x:18/x,1.65,12,BLUE,6);plot(s,X,Y,lambda x:18/x,-12,-1.65,BLUE,6);dot(s,X(2),Y(9),14,ORANGE);s.text(X(2)+24,Y(9)+12,'(2, 9)',40,ORANGE,'start')
dot(s,X(-3),Y(-6),14,GREEN);s.text(X(-3)-24,Y(-6)+12,'(?, −6)',40,GREEN,'end');s.line(X(-3),Y(-6),X(0),Y(-6),DIM,3,'8 8');s.text(X(0)+12,Y(-6)+12,'−6',34,INK,'start');s.text(1300,180,'y ＝ a/x',44,BLUE);out.append(s.save('M1-APP2-C4-CH'))
# ---- 4章の図の枠 ----
s=S('関数の箱');s.heading('関数は「入れると1つ出る箱」')
for k,(lab,inp,outs,ok) in enumerate([('関数の箱','x＝3',['y＝12'],True),('関数ではない箱','x＝13',['y＝？','y＝？','y＝？'],False)]):
    y=170+k*330;c=GREEN if ok else RED;s.rect(560,y,480,240,fill='white',stroke=c,sw=6,dash=None if ok else '14 8');s.text(800,y+110,lab,46,c,weight=800);s.text(800,y+170,'正方形の1辺→周' if ok else '年れい→身長',34)
    s.rect(160,y+80,240,90,fill=PALE,stroke=BLUE,sw=4);s.text(280,y+140,inp,44,BLUE);s.arrow(410,y+125,550,y+125,BLUE,6)
    for j,o in enumerate(outs):
        yy=y+125+(j-(len(outs)-1)/2)*95;s.arrow(1050,y+125,1180,yy,c,5);s.rect(1190,yy-40,240,80,fill='#edf5ef' if ok else '#fdecea',stroke=c,sw=4);s.text(1310,yy+14,o,40,c)
out.append(s.save('M1-C4-S1-FIG01'))
s=S('階段の比例');s.heading('段数 x と 高さ y');xs=[1,2,3,4,5]
s.rect(160,300,200,100,fill=BLUE,stroke=INK,sw=2,rx=0);s.text(260,365,'段数 x',38,'white');s.rect(160,400,200,100,fill=BLUE,stroke=INK,sw=2,rx=0);s.text(260,465,'高さ y',38,'white')
for i,v in enumerate(xs): s.rect(360+i*180,300,180,100,fill=PALE,stroke=INK,sw=2,rx=0);s.text(450+i*180,365,str(v),44);s.rect(360+i*180,400,180,100,fill='white',stroke=INK,sw=2,rx=0);s.text(450+i*180,465,str(16*v),44,BLUE)
for (a,b,t,yy) in [(0,1,'×2',270),(0,2,'×3',200)]:
    xa,xb=450+a*180,450+b*180;s.path(f'M{xa} 295 Q{(xa+xb)/2} {yy-30} {xb} 295',stroke=ORANGE,sw=5);s.text((xa+xb)/2,yy-30,t,40,ORANGE)
    s.path(f'M{xa} 505 Q{(xa+xb)/2} {800-yy+30} {xb} 505',stroke=ORANGE,sw=5);s.text((xa+xb)/2,800-yy+70,t,40,ORANGE)
s.rect(1300,300,200,200,fill='#fff7ec',stroke=ORANGE,sw=4);s.text(1400,370,'y÷x',40);s.text(1400,440,'＝ 16',46,ORANGE,weight=800);out.append(s.save('M1-C4-S2-FIG01'))
s=S('座標の点のとり方');s.heading('座標 (x, y) の 点のとり方');X,Y=s.axes(800,460,60,-5,5,-5,5,step=2)
s.arrow(X(0),Y(0)-2,X(4),Y(0)-2,BLUE,7);s.arrow(X(4),Y(0),X(4),Y(3),BLUE,7);dot(s,X(4),Y(3),14,BLUE);s.text(X(4)+24,Y(3)-10,'P(4, 3)',44,BLUE,'start');s.text(X(2),Y(0)-24,'右へ4',34,BLUE)
s.arrow(X(0),Y(0)+2,X(-2),Y(0)+2,ORANGE,7);s.arrow(X(-2),Y(0),X(-2),Y(-3),ORANGE,7);dot(s,X(-2),Y(-3),14,ORANGE);s.text(X(-2)-24,Y(-3)+40,'Q(−2, −3)',44,ORANGE,'end');s.text(X(-1),Y(0)-24,'左へ2',34,ORANGE)
out.append(s.save('M1-C4-S2-FIG02'))
s=S('比例のグラフ');s.heading('比例のグラフは 原点を通る直線');X,Y=s.axes(800,460,60,-5,5,-5,5,step=2)
plot(s,X,Y,lambda x:2*x,-2.6,2.6,BLUE,7);plot(s,X,Y,lambda x:-2*x/3,-5,5,ORANGE,7)
for (x,y,c) in [(1,2,BLUE),(2,4,BLUE),(3,-2,ORANGE),(-3,2,ORANGE)]: dot(s,X(x),Y(y),11,c)
s.text(X(2.6)+10,Y(5.2)+40,'y＝2x',42,BLUE,'start');s.text(X(5)-10,Y(-3.33)+50,'y＝−⅔x',42,ORANGE,'end');s.circle(X(0),Y(0),26,stroke=RED,sw=5);s.text(X(0)+40,Y(0)-30,'原点',36,RED,'start');out.append(s.save('M1-C4-S2-FIG03'))
s=S('クッキーの分け方');s.heading('クッキー24個を 分ける')
xs=[1,2,3,4,6];s.rect(160,300,200,100,fill=ORANGE,stroke=INK,sw=2,rx=0);s.text(260,365,'人数 x',38,'white');s.rect(160,400,200,100,fill=ORANGE,stroke=INK,sw=2,rx=0);s.text(260,465,'1人分 y',36,'white')
for i,v in enumerate(xs): s.rect(360+i*180,300,180,100,fill=PALE,stroke=INK,sw=2,rx=0);s.text(450+i*180,365,str(v),44);s.rect(360+i*180,400,180,100,fill='white',stroke=INK,sw=2,rx=0);s.text(450+i*180,465,str(24//v),44,ORANGE)
for (a,b,t,t2,yy) in [(0,1,'×2','×½',270),(0,2,'×3','×⅓',200)]:
    xa,xb=450+a*180,450+b*180;s.path(f'M{xa} 295 Q{(xa+xb)/2} {yy-30} {xb} 295',stroke=BLUE,sw=5);s.text((xa+xb)/2,yy-30,t,40,BLUE)
    s.path(f'M{xa} 505 Q{(xa+xb)/2} {800-yy+30} {xb} 505',stroke=ORANGE,sw=5);s.text((xa+xb)/2,800-yy+70,t2,40,ORANGE)
s.rect(1300,300,200,200,fill='#fff7ec',stroke=ORANGE,sw=4);s.text(1400,370,'x×y',40);s.text(1400,440,'＝ 24',46,ORANGE,weight=800);out.append(s.save('M1-C4-S3-FIG01'))
s=S('反比例のグラフ');s.heading('y＝12/x のグラフ（双曲線）');X,Y=s.axes(800,460,28,-13,13,-13,13,grid=False,labels=False)
plot(s,X,Y,lambda x:12/x,0.93,13,BLUE,6);plot(s,X,Y,lambda x:12/x,-13,-0.93,BLUE,6)
for x in (1,2,3,4,6,12):
    for sg in (1,-1): dot(s,X(sg*x),Y(sg*12/x),9,ORANGE)
for x,y in ((1,12),(2,6),(3,4),(6,2),(12,1)): s.text(X(x)+14,Y(y)-10,f'({x},{y})',30,ORANGE,'start')
s.text(1300,700,'軸に近づくが、交わらない',38,RED);out.append(s.save('M1-C4-S3-FIG02'))
import math
s=S('かみ合う歯車');s.heading('かみ合う歯車：動く歯の数は同じ')
def gear(cx,cy,r,n,col):
    pts=[]
    for k in range(n*4):
        a=2*math.pi*k/(n*4);rr=r+(14 if k%4 in (1,2) else -14);pts.append((cx+rr*math.cos(a),cy+rr*math.sin(a)))
    s.poly(pts,fill=col,stroke=INK,sw=3);s.circle(cx,cy,16,fill='white',stroke=INK,sw=3)
gear(560,430,230,24,SKY);gear(560+230+115+8,430,115,12,'#f6dcb8')
s.text(330,170,'歯の数 24',40,BLUE);s.arrow(380,190,430,250,BLUE,6);s.text(560,720,'1分間に 10回転',40,BLUE)
s.text(905,250,'歯の数 x',40,ORANGE);s.text(1000,720,'1分間に y 回転',40,ORANGE)
s.rect(1150,330,380,200,fill='#fff7ec',stroke=ORANGE,sw=4);s.lines(1340,400,['24 × 10','＝ x × y'],44,gap=70);out.append(s.save('M1-C4-S3-FIG03'))
s=S('2人の道のりのグラフ');s.heading('時間と道のり（1200m のゴール）')
X=lambda v:180+v*70;Y=lambda v:690-v*0.42
s.line(170,690,1360,690,INK,3);s.line(180,700,180,100,INK,3)
for v in range(0,17,2): s.text(X(v),735,str(v),32)
for v in (300,600,900,1200): s.text(165,Y(v)+10,str(v),30,INK,'end');s.line(180,Y(v),1340,Y(v),'#d5dee9',2)
s.text(1380,735,'分',32,INK,'start');s.text(200,120,'(m)',30,INK,'start')
s.line(X(0),Y(0),X(12),Y(1200),BLUE,7);s.line(X(0),Y(0),X(15),Y(1200),ORANGE,7)
s.text(X(12)-20,Y(1200)-20,'A y＝100x',40,BLUE,'end');s.text(X(15)+12,Y(1200)+44,'B y＝80x',40,ORANGE,'start')
s.line(X(6),Y(600),X(6),Y(480),GREEN,6);s.arrow(X(6)+40,Y(540),X(6)+8,Y(540),GREEN,5);s.text(X(6)+50,Y(540)+12,'6分後の差',34,GREEN,'start');s.line(X(6),Y(0),X(6),Y(480),DIM,2,'8 8');out.append(s.save('M1-C4-S4-FIG01'))
print(len(out))
