from svgkit import *
import math,itertools
out=[]
# ---- 巻末の図（図の枠） ----
s=S('速さ・時間を式から導く');s.heading('1つの式から 2つの式を導く')
s.rect(450,160,700,120,fill='#cfe3f6',stroke=BLUE,sw=5);s.text(800,238,'道のり ＝ 速さ × 時間',50,BLUE,weight=800)
for x,t,n in ((420,'速さ ＝ 道のり ÷ 時間','両辺を 時間 でわる'),(1180,'時間 ＝ 道のり ÷ 速さ','両辺を 速さ でわる')):
    s.arrow(800,290,x,520,ORANGE,6);s.rect(x-320,540,640,110,fill='white',stroke=ORANGE,sw=5);s.text(x,612,t,44,INK,weight=800);s.text((800+x)/2+(-150 if x<800 else 150),400,n,32,ORANGE)
s.text(800,780,'覚える式は 1つだけ。あとは 等式の性質で 変形する',36);out.append(s.save('M1-APP1-FIG01'))
s=S('割合の2本の数直線');s.heading('もとにする量を 1 とみる');x0,x1=200,1400;sc=(x1-x0)/1.5
X=lambda v:x0+v*sc
for y,lab,vals,c in ((340,'量',[(0,'0'),(1,'40'),(1.3,'52')],BLUE),(620,'割合',[(0,'0'),(1,'1'),(1.3,'1.3')],ORANGE)):
    s.line(X(0),y,X(1.5),y,INK,4);s.text(X(0)-40,y+12,lab,36,c,'end')
    for v,t in vals: s.line(X(v),y-16,X(v),y+16,INK,4);s.text(X(v),y-30 if y<500 else y+56,t,40,c,weight=800) if not (y<500 and v>0) else s.text(X(v),y-30,t,40,c,weight=800)
for v in (1,1.3): s.line(X(v),360,X(v),600,DIM,3,'10 8')
s.text(X(1)-20,220,'もとにする量',32,BLUE,'end');s.text(X(1.3)+20,220,'くらべる量',32,BLUE,'start')
s.arrow(X(1)+30,480,X(1.3)-10,480,GREEN,6);s.text((X(1)+X(1.3))/2,460,'× 1.3',40,GREEN,weight=800)
s.text(800,800,'くらべる量 ＝ もとにする量 × 割合',40);out.append(s.save('M1-APP1-FIG02'))
s=S('小数と分数のわり算');s.heading('わり算の2つのコツ')
s.card(60,150,700,640,'小数のわり算',BLUE);s.text(410,320,'4.68 ÷ 1.2',54);s.arrow(410,360,410,450,BLUE,6);s.text(560,415,'どちらも 10倍',30,BLUE)
s.text(410,530,'46.8 ÷ 12',54);s.text(410,640,'＝ 3.9',54,BLUE,weight=800)
s.text(410,740,'小数点を 同じけただけ 右へ',32,ORANGE)
s.card(840,150,700,640,'分数のわり算',GREEN);s.frac(1000,360,'b','a',54);s.text(1080,375,'÷',54);s.frac(1160,360,'d','c',54)
s.arrow(1190,420,1190,500,GREEN,6);s.frac(1000,600,'b','a',54);s.text(1080,615,'×',54);s.frac(1160,600,'c','d',54);s.text(1300,615,'',10)
s.text(1190,740,'わる数を 逆数にして かける',32,GREEN);out.append(s.save('M1-APP1-FIG03'))
s=S('平均値・中央値・最頻値');s.heading('8人の読書時間（時間）');vals=[2,3,4,5,5,6,7,8];cw=130;x0=170
for i,v in enumerate(vals):
    x=x0+i*(cw+22);s.rect(x,560-v*45,cw,v*45,fill='#cfe3f6' if v!=5 else '#f6dcb8',stroke=INK,sw=3,rx=0);s.text(x+cw/2,610,str(v),40)
avg=sum(vals)/8;s.line(x0-30,560-avg*45,x0+8*(cw+22),560-avg*45,RED,5,'12 8');s.text(x0-30,560-avg*45-20,'平均値（ならした高さ）',30,RED,'start')
fx=x0+4*(cw+22)-11;s.line(fx,650,fx,760,GREEN,5);s.poly([(fx,650),(fx+90,675),(fx,700)],fill=GREEN,stroke=GREEN,sw=2);s.text(fx+110,690,'中央値（4番目と5番目の間）',30,GREEN,'start')
s.text(x0+3.5*(cw+22)+cw/2,170,'最頻値：いちばん多い値（色つき）',32,ORANGE);out.append(s.save('M1-APP1-FIG04'))
s=S('数直線でたし算');s.heading('(+3) ＋ (−5)');s.numline(150,1450,560,-5,5)
X=lambda v:800+v*130
s.path(f'M{X(0)} 530 Q{X(1.5)} 380 {X(3)} 530',stroke=BLUE,sw=6);s.arrow(X(3)-20,515,X(3),532,BLUE,6);s.text(X(1.5),400,'＋3：右へ 3',36,BLUE,weight=800)
s.path(f'M{X(3)} 640 Q{X(0.5)} 820 {X(-2)} 640',stroke=ORANGE,sw=6);s.arrow(X(-2)+20,656,X(-2),638,ORANGE,6);s.text(X(0.5),850,'−5：左へ 5',36,ORANGE,weight=800)
dot(s,X(-2),560,14,RED);s.text(X(-2),480,'−2',46,RED,weight=800);out.append(s.save('M1-APP2-FIG01'))
s=S('分配法則');s.heading('3 は かっこの中の 両方にかける')
s.text(800,500,'3 ( 2x − 4 )',90,INK,font_style='normal');s.path('M560 410 Q 650 250 770 410',stroke=BLUE,sw=6);s.arrow(760,395,772,415,BLUE,6);s.path('M560 410 Q 780 180 990 410',stroke=ORANGE,sw=6);s.arrow(980,395,992,415,ORANGE,6)
s.text(800,700,'＝ 3 × 2x ＋ 3 × (−4)',54);s.text(800,800,'＝ 6x − 12',56,BLUE,weight=800);out.append(s.save('M1-APP2-FIG02'))
s=S('天びんと等式の性質');s.heading('両方から 同じものを取っても つり合う')
def balance(cx,left,right,removed=0):
    s.poly([(cx-40,780),(cx+40,780),(cx,540)],fill='#d7dee8',stroke=INK,sw=3);s.line(cx-320,540,cx+320,540,INK,8)
    for side,items in ((-1,left),(1,right)):
        px=cx+side*200;s.line(px,540,px,640,INK,3);s.rect(px-160,640,320,16,fill=INK,stroke=INK,sw=2,rx=4)
        for j,it in enumerate(items):
            xx=px-150+j*60
            if it=='x': s.rect(xx,540,52,96,fill=SKY,stroke=INK,sw=3,rx=4);s.text(xx+26,600,'x',34,INK,font_style='italic')
            else:
                gone=removed and j>=len(items)-removed
                s.rect(xx,586,52,52,fill='white' if gone else '#f6dcb8',stroke=RED if gone else INK,sw=3,rx=4,dash='8 6' if gone else None);s.text(xx+26,624,'1',30,RED if gone else INK)
balance(400,['x','1','1','1'],['1','1','1','1','1'],0);s.text(400,840,'x ＋ 3 ＝ 5',40)
s.arrow(700,360,900,360,ORANGE,8);s.text(800,320,'両方から −3',36,ORANGE,weight=800)
balance(1200,['x','1','1','1'],['1','1','1','1','1'],3);s.text(1200,840,'x ＝ 2',40,BLUE,weight=800);s.text(1200,460,'点線の重りを 両方から取る',30,RED)
out.append(s.save('M1-APP2-FIG03'))
s=S('比例と反比例のグラフ');s.heading('y＝2x と y＝8/x');X,Y=s.axes(500,780,62,-1,9,-1,10,step=2) if False else (None,None)
X,Y=chart(s,260,800,960,640,0,8,0,10,[0,2,4,6,8],[0,2,4,6,8,10],'x','y',32)
plot(s,X,Y,lambda x:2*x,0,5,BLUE,6);plot(s,X,Y,lambda x:8/x,0.8,8,ORANGE,6)
dot(s,X(2),Y(4),14,RED);s.text(X(3.2),Y(5.6),'交わる点（座標は？）',32,RED,'start');s.line(X(2)+14,Y(4)-10,X(3.15),Y(5.5),RED,2)
s.text(X(3.6),Y(8.6),'y＝2x',38,BLUE,'end');s.text(X(6.5),Y(1.9),'y＝8/x',38,ORANGE);out.append(s.save('M1-APP2-FIG04'))
s=S('おうぎ形の3つの式');s.heading('半径 r・中心角 a° のおうぎ形');O=(380,640);R=330
arc(s,*O,R,0,65,INK,4,fill='#e4d4f5',sector=True);arc(s,*O,R,0,65,ORANGE,9);arc(s,*O,70,0,65,PURPLE,4);s.text(O[0]+100,O[1]-40,'a°',36,PURPLE);s.text(O[0]+R/2,O[1]+44,'r',40,INK,font_style='italic')
for k,(t,c) in enumerate((('弧 ＝ 2πr × a/360',ORANGE),('面積 ＝ πr² × a/360',PURPLE),('面積 ＝ ½ × 弧 × r',GREEN))):
    y=260+k*200;s.rect(860,y-60,640,100,fill='white',stroke=c,sw=5);s.text(1180,y+8,t,42,c,weight=800)
s.arrow(640,420,850,220,ORANGE,5);s.arrow(560,560,850,420,PURPLE,5);s.arrow(560,620,850,620,GREEN,5);out.append(s.save('M1-APP2-FIG05'))
s=S('立体の公式カード');s.heading('円柱・円錐・球の公式')
cylinder3(s,280,400,110,200);cone3(s,800,400,110,220);sphere3(s,1320,300,110)
for k,(t,v,a,c) in enumerate((('円柱','V ＝ πr²h','S ＝ 2πrh ＋ 2πr²',BLUE),('円錐','V ＝ ⅓πr²h','側面積 ＝ π × 母線 × r',PURPLE),('球','V ＝ ⁴⁄₃πr³','S ＝ 4πr²',GREEN))):
    x=60+k*520;s.card(x,470,440,340,t,c);s.text(x+220,640,v,44,c,weight=800);s.text(x+220,740,a,32)
out.append(s.save('M1-APP2-FIG06'))
s=S('度数分布表に列を足す');s.heading('列を 順に 足していく');cols=['階級','度数','階級値','階級値×度数','相対度数','累積相対度数'];cw=[200,150,170,260,210,280];x0=70;y0=260
for j,c in enumerate(cols):
    x=x0+sum(cw[:j]);fill=SKY if j<2 else ['#f6dcb8','#f6dcb8','#cdebd7','#e4d4f5'][j-2]
    s.rect(x,y0,cw[j],70,fill=fill,stroke=INK,sw=2,rx=0);s.text(x+cw[j]/2,y0+46,c,28)
    for i in range(5): s.rect(x,y0+70+i*62,cw[j],62,fill='white',stroke=INK,sw=2,rx=0)
    if j>=2: s.text(x+cw[j]/2,y0-30,f'足す{j-1}',30,ORANGE,weight=800);
for j in range(2,6):
    pass
s.text(800,720,'平均値：階級値×度数の合計 ÷ 度数の合計',32);s.text(800,780,'相対度数：度数 ÷ 度数の合計　累積：上から足していく',32);out.append(s.save('M1-APP2-FIG07'))
s=S('時差を数直線で');s.heading('日本を 0 とした時刻の線（時間）');X=lambda v:1450+v*65
s.line(X(-20),600,X(1),600,INK,4)
for v in range(-20,2):
    s.line(X(v),588,X(v),612,INK,2 if v%5 else 4)
    if v%5==0: s.text(X(v),660,('−' if v<0 else '')+str(abs(v)),34)
for k,(name,v,c) in enumerate((('日本',0,RED),('バンコク',-2,BLUE),('ニューデリー',-3.5,GREEN),('カイロ',-7,ORANGE),('ホノルル',-19,PURPLE))):
    h=[150,330,230,110,230][k];x=X(v);s.line(x,600,x,600-h,c,4);s.poly([(x,600-h),(x+70,600-h+22),(x,600-h+44)],fill=c,stroke=c,sw=2);(s.text(x-12,600-h+34,name,32,c,'end',weight=800) if name=='ニューデリー' else s.text(x,600-h-16,name,32,c,weight=800));dot(s,x,600,9,c)
s.text(800,800,'左ほど 時刻が おくれている（夏時間は考えない）',34);out.append(s.save('M1-APP3-FIG01'))
s=S('パン屋の4日間');s.heading('パン屋の記録（4日間）')
for k,(n,m) in enumerate(((None,18000),(200,21600),(200,23400),(240,26400))):
    x=60+k*380;s.card(x,190,350,480,f'{k+1}日目',[BLUE,ORANGE,GREEN,PURPLE][k]);s.text(x+175,330,'個数',32,DIM)
    if n: s.text(x+175,400,f'{n} 個',48,INK,weight=800)
    else: s.rect(x+85,350,180,70,fill='#f3f6fa',stroke=DIM,sw=3,dash='10 8');s.text(x+175,400,'？',44,DIM)
    s.text(x+175,500,'売り上げ',32,DIM);s.text(x+175,570,f'{m:,} 円',48,INK,weight=800)
s.text(800,770,'表にして くらべると 変化が見えてくる',36);out.append(s.save('M1-APP3-FIG02'))
s=S('料金のグラフ');s.heading('A 店と B 店の料金');X,Y=chart(s,220,780,1100,600,0,80,0,900,[0,20,40,60,80],[0,300,600,900],'枚','円',32)
plot(s,X,Y,lambda x:10*x,0,80,BLUE,6,ylim=(0,900));plot(s,X,Y,lambda x:300+4*x,0,80,ORANGE,6,dash='14 10')
dot(s,X(50),Y(500),14,RED);s.text(X(50)+20,Y(500)+60,'ここで 料金が同じ',32,RED,'start')
s.text(X(86),Y(860),'A 店',38,BLUE,'start');s.text(X(82),Y(620),'B 店',38,ORANGE,'start');dot(s,X(0),Y(300),10,ORANGE);s.text(X(0)+20,Y(300)+44,'300円から',30,ORANGE,'start');out.append(s.save('M1-APP3-FIG03'))
s=S('4つのおうぎ形を集める');s.heading('4つのかどの おうぎ形 → 1つの円');u=46;x0,y0=150,240;L=10*u
s.rect(x0,y0,L,L,fill='white',stroke=INK,sw=4,rx=0)
for (cx,cy,a0) in ((x0,y0,-90),(x0+L,y0,180),(x0+L,y0+L,90),(x0,y0+L,0)): arc(s,cx,cy,5*u,a0,a0+90,INK,3,fill='#f6dcb8',sector=True)
s.text(x0+L/2,y0+L+60,'1辺 10cm',36);s.text(x0-20,y0+5*u/2+10,'5cm',30,ORANGE,'end')
s.arrow(x0+L+60,y0+L/2,x0+L+260,y0+L/2,ORANGE,8);s.text(x0+L+160,y0+L/2-30,'回転して集める',30,ORANGE)
C=(1220,y0+L/2);R=5*u
for k in range(4): arc(s,*C,R,k*90,k*90+90,INK,3,fill='#f6dcb8',sector=True)
s.text(C[0],C[1]+R+60,'半径 5cm の円 1つ分',36);out.append(s.save('M1-APP3-FIG04'))
# 正多面体
phi=(1+5**.5)/2
V={'正四面体':[(1,1,1),(1,-1,-1),(-1,1,-1),(-1,-1,1)],'正六面体':[(x,y,z) for x in(-1,1) for y in(-1,1) for z in(-1,1)],
'正八面体':[(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)],
'正十二面体':[(x,y,z) for x in(-1,1) for y in(-1,1) for z in(-1,1)]+[p for a in(-1,1) for b in(-1,1) for p in((0,a/phi,b*phi),(a/phi,b*phi,0),(a*phi,0,b/phi))],
'正二十面体':[p for a in(-1,1) for b in(-1,1) for p in((0,a,b*phi),(a,b*phi,0),(b*phi,0,a))]}
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dotp(a,b):return sum(x*y for x,y in zip(a,b))
def hull(P):
    faces={}
    for i,j,k in itertools.combinations(range(len(P)),3):
        n=cross(sub(P[j],P[i]),sub(P[k],P[i]));l=dotp(n,n)**.5
        if l<1e-9: continue
        n=tuple(x/l for x in n);d=dotp(n,P[i]);ds=[dotp(n,p)-d for p in P]
        if all(x<1e-6 for x in ds) or all(x>-1e-6 for x in ds):
            if dotp(n,P[i])<0: n=tuple(-x for x in n);d=-d
            key=tuple(round(x,4) for x in n)
            faces[key]=sorted(set(m for m,p in enumerate(P) if abs(dotp(n,p)-d)<1e-6))
    res=[]
    for n,idx in faces.items():
        c=[sum(P[m][q] for m in idx)/len(idx) for q in range(3)];u_=sub(P[idx[0]],c);w=cross(n,u_)
        idx=sorted(idx,key=lambda m:math.atan2(dotp(sub(P[m],c),w),dotp(sub(P[m],c),u_)));res.append((n,idx))
    return res
def rot(p,ay,ax):
    x,y,z=p;c,s_=math.cos(ay),math.sin(ay);x,z=x*c+z*s_,-x*s_+z*c;c,s_=math.cos(ax),math.sin(ax);y,z=y*c-z*s_,y*s_+z*c;return(x,y,z)
s=S('5つの正多面体');s.heading('正多面体は 5種類だけ');tab=[]
for k,(name,P) in enumerate(V.items()):
    F=hull(P);E=set()
    for n,idx in F:
        for a,b in zip(idx,idx[1:]+idx[:1]): E.add(tuple(sorted((a,b))))
    tab.append((name,len(F),len(E),len(P)))
    m=max(dotp(p,p)**.5 for p in P);cx=170+k*315;cy=330;R=120
    Q=[rot(tuple(x/m for x in p),0.55,-0.42) for p in P];pr=lambda q:(cx+q[0]*R,cy-q[1]*R)
    back=set();front=set()
    for n,idx in F:
        nn=rot(n,0.55,-0.42);es=[tuple(sorted((a,b))) for a,b in zip(idx,idx[1:]+idx[:1])]
        (front if nn[2]>0 else back).update(es)
    for e in back-front: s.line(*pr(Q[e[0]]),*pr(Q[e[1]]),DIM,2,'8 6')
    for n,idx in F:
        nn=rot(n,0.55,-0.42)
        if nn[2]>0:
            lt=0.55+0.45*max(0,nn[2]*0.7+nn[1]*0.3);s.poly([pr(Q[m]) for m in idx],fill=f'rgb({int(120+100*lt)},{int(170+70*lt)},{int(210+40*lt)})',stroke=INK,sw=3)
    s.text(cx,cy+R+50,name,32,BLUE,weight=800)
assert [t[1:] for t in tab]==[(4,6,4),(6,12,8),(8,12,6),(12,30,20),(20,30,12)],tab
y0=560;cw=[200]+[260]*5;x0=70
for j,h in enumerate(['']+[t[0] for t in tab]): s.rect(x0+sum(cw[:j]),y0,cw[j],62,fill=SKY,stroke=INK,sw=2,rx=0);s.text(x0+sum(cw[:j])+cw[j]/2,y0+43,h,28)
for i,(lab,q) in enumerate((('面の数',1),('辺の数',2),('頂点の数',3))):
    for j in range(6):
        t=lab if j==0 else str(tab[j-1][q]);s.rect(x0+sum(cw[:j]),y0+62*(i+1),cw[j],62,fill='#f3f6fa' if j==0 else 'white',stroke=INK,sw=2,rx=0);s.text(x0+sum(cw[:j])+cw[j]/2,y0+62*(i+1)+43,t,32)
out.append(s.save('M1-APP3-FIG05'))
s=S('30年前と今の最高気温');s.heading('7月の最高気温（31日間）');X,Y=chart(s,220,760,1100,560,24,40,0,12,[24,26,28,30,32,34,36,38,40],[0,2,4,6,8,10,12],'℃','日',30)
xs=[25,27,29,31,33,35,37,39]
for d,c,dash,mk,lab in (([0,3,8,11,7,2,0,0],BLUE,'14 10','s','30年前'),([0,0,3,7,11,8,2,0],RED,None,'c','今')):
    assert sum(d)==31;pts=[(X(x),Y(v)) for x,v in zip(xs,d)];s.poly(pts,stroke=c,sw=6,dash=dash,close=False)
    for p in pts: (s.circle(*p,10,fill=c,stroke=c) if mk=='c' else s.rect(p[0]-10,p[1]-10,20,20,fill=c,stroke=c,sw=2,rx=0))
s.line(1360,300,1440,300,BLUE,6,'14 10');s.text(1460,312,'30年前',34,BLUE,'start');s.line(1360,370,1440,370,RED,6);s.text(1460,382,'今',34,RED,'start');s.text(1380,460,'学習用の',28,DIM,'start');s.text(1380,500,'架空のデータ',28,DIM,'start')
out.append(s.save('M1-APP3-FIG06'))
s=S('素因数分解で最大公約数と最小公倍数');s.heading('48 と 72 を 素因数に分ける')
row=lambda y,fs,lab:[ (s.text(400,y,lab,44,INK,'end'),[ (s.circle(470+i*110,y-14,44,fill='#f6dcb8' if f=='3' else '#cfe3f6',stroke=INK,sw=3),s.text(470+i*110,y,f,40)) for i,f in enumerate(fs)]) ]
row(300,['2','2','2','2','3','',],'48 ＝') if False else None
def ball(x,y,f):s.circle(x,y,44,fill='#f6dcb8' if f=='3' else '#cfe3f6',stroke=INK,sw=3);s.text(x,y+14,f,40)
s.text(330,320,'48 ＝',44,INK,'end');s.text(330,500,'72 ＝',44,INK,'end')
A=['2','2','2','2','3'];B=['2','2','2','3','3']
pos48=[420,540,660,900,1020];pos72=[420,540,660,1020,1140]
for x,f in zip(pos48,A): ball(x,306,f)
for x,f in zip(pos72,B): ball(x,486,f)
s.rect(366,240,348,320,fill='none',stroke=GREEN,sw=5,dash='14 10');s.rect(966,240,108,320,fill='none',stroke=GREEN,sw=5,dash='14 10');s.text(800,600,'',10)
s.text(540,610,'共通',30,GREEN);s.text(1020,610,'共通',30,GREEN)
s.rect(150,680,620,150,fill='white',stroke=GREEN,sw=5);s.text(460,740,'最大公約数：共通の部分',34,GREEN,weight=800);s.text(460,800,'2³ × 3 ＝ 24',40,INK,weight=800)
s.rect(830,680,620,150,fill='white',stroke=ORANGE,sw=5);s.text(1140,740,'最小公倍数：全部を1回ずつ',34,ORANGE,weight=800);s.text(1140,800,'2⁴ × 3² ＝ 144',40,INK,weight=800)
assert 2**3*3==24 and 2**4*9==144 and 2**4*3==48 and 2**3*9==72;out.append(s.save('M1-APP3-FIG07'))
# ---- 巻末の地図・チャレンジ ----
s=S('中学1年の数学の地図');s.heading('中学1年の数学の地図')
isl=[('数と式（1〜3章）','x を決めて 等しい関係',BLUE,(330,330)),('関数（4章）','ともなって変わる y＝ax・y＝a/x',ORANGE,(1170,330)),('図形（5・6章）','移動・作図・空間の見方',GREEN,(330,690)),('データ（7章）','代表値と相対度数で判断',PURPLE,(1170,690))]
for a,b in ((0,1),(0,2),(1,3),(2,3),(0,3)): s.line(*isl[a][3],*isl[b][3],'#c9a46a',12,'4 14')
for t,b,c,(x,y) in isl: s.ellipse(x,y,320,140,fill='white',stroke=c,sw=6);s.text(x,y-20,t,40,c,weight=800);s.text(x,y+40,b,28)
out.append(s.save('M1-APP2-DMAP'))
s=S('まちがえた計算をたどる');s.heading('逆向きに たどって「ある数」を見つける')
def box(x,y,t,c=INK,fill='white'):s.rect(x-110,y-55,220,110,fill=fill,stroke=c,sw=5);s.text(x,y+16,t,44,c,weight=800)
box(260,330,'ある数',BLUE,'#cfe3f6');box(800,330,'5');s.arrow(380,310,680,310,ORANGE,6);s.text(530,280,'＋(−3)（まちがい）',30,ORANGE)
s.arrow(680,370,380,370,GREEN,6);s.text(530,420,'−(−3) で もどる',30,GREEN)
box(260,640,'ある数',BLUE,'#cfe3f6');box(800,640,'？',RED);s.arrow(380,640,680,640,RED,6);s.text(530,610,'×(−3)（正しい計算）',30,RED)
s.text(1220,330,'① 逆にたどる',36,GREEN,'start');s.text(1220,640,'② やり直す',36,RED,'start');out.append(s.save('M1-APP2-C1-CH'))
s=S('石の並べ方');s.heading('1辺に n 個ずつ 正方形に並べる');n=6;u=90;x0,y0=360,270
for i in range(n):
    for j in range(n):
        if i in (0,n-1) or j in (0,n-1):
            x=x0+j*u;y=y0+i*u;corner=i in(0,n-1) and j in(0,n-1);s.circle(x,y,32,fill='#d7dee8',stroke=INK,sw=3)
            if corner: s.circle(x,y,42,stroke=RED,sw=4)
s.line(x0,y0-70,x0+(n-1)*u,y0-70,INK,3);s.text(x0+(n-1)*u/2,y0-84,'n 個',36,INK);s.text(1130,330,'◎ かどの石',36,RED,'start');s.text(1130,400,'2本の辺で',32,INK,'start');s.text(1130,450,'2回 数えている',32,INK,'start')
out.append(s.save('M1-APP2-C2-CH'))
print(len(out))
