from svgkit import *
import math
out=[]
s=S('点と直線の距離');s.heading('いちばん短いのは 垂線');px,py=760,200;ly=620
s.line(150,ly,1450,ly,INK,5);s.text(1470,ly+14,'ℓ',48,INK,'start',font_style='italic')
for x,c in ((380,DIM),(560,DIM),(1060,DIM),(1250,DIM)): s.line(px,py,x,ly,c,4,'10 8');s.circle(x,ly,8,fill=DIM,stroke=DIM)
s.line(px,py,px,ly,ORANGE,8);right_mark(s,px,ly,1,0,0,-1,30,ORANGE);label_pt(s,px,py,'P',0,-26,46,INK);s.text(px+30,ly+60,'H',46,ORANGE,'start')
arc(s,px,py,ly-py,-90-40,-90+40,BLUE,4,'14 10');s.text(1050,250,'コンパスで PH の長さを',36,BLUE,'start');s.text(1050,300,'うつすと、ほかの線分は',36,BLUE,'start');s.text(1050,350,'みな長い',36,BLUE,'start')
s.text(800,800,'点 P と直線 ℓ の距離 ＝ 垂線 PH の長さ',44,ORANGE);out.append(s.save('M1-C5-S1-D01'))
s=S('この節の地図');s.heading('直線と図形の ことばと記号')
items=[('直線 AB','両方向にかぎりなく','line'),('線分 AB','両端がある','seg'),('半直線 AB','A から B の方へ','ray'),('∠ABC','頂点 B がまん中','ang'),('AB ⊥ CD','垂直','perp'),('AB ∥ CD','平行','par'),('距離','垂線の長さ','dist'),('△ABC','三角形','tri')]
for k,(a,b,kind) in enumerate(items):
    x=60+(k%4)*380;y=150+(k//4)*330;s.rect(x,y,350,300,fill='white',stroke=BLUE,sw=4);s.text(x+175,y+60,a,42,BLUE,weight=800);s.text(x+175,y+270,b,32)
    cx,cy=x+175,y+160
    if kind=='line': s.line(cx-140,cy,cx+140,cy,INK,5);[s.circle(cx+d,cy,8,fill=INK) for d in (-60,60)]
    if kind=='seg': s.line(cx-90,cy,cx+90,cy,INK,5);[s.circle(cx+d,cy,10,fill=INK) for d in (-90,90)]
    if kind=='ray': s.line(cx-90,cy,cx+140,cy,INK,5);s.circle(cx-90,cy,10,fill=INK)
    if kind=='ang': s.line(cx-110,cy+50,cx+110,cy+50,INK,5);s.line(cx-110,cy+50,cx+60,cy-60,INK,5);arc(s,cx-110,cy+50,60,0,33,ORANGE,5)
    if kind=='perp': s.line(cx-120,cy+50,cx+120,cy+50,INK,5);s.line(cx,cy+50,cx,cy-70,INK,5);right_mark(s,cx,cy+50,1,0,0,-1,24,ORANGE)
    if kind=='par': s.line(cx-130,cy-25,cx+130,cy-25,INK,5);s.line(cx-130,cy+40,cx+130,cy+40,INK,5)
    if kind=='dist': s.line(cx-130,cy+50,cx+130,cy+50,INK,5);s.circle(cx,cy-60,9,fill=INK);s.line(cx,cy-60,cx,cy+50,ORANGE,6);right_mark(s,cx,cy+50,1,0,0,-1,22,ORANGE)
    if kind=='tri': s.poly([(cx-100,cy+55),(cx+110,cy+55),(cx-20,cy-70)],fill=PALE,stroke=INK,sw=5)
out.append(s.save('M1-C5-S1-DMAP'))
s=S('一直線と角の和');s.heading('一直線の角は 180°');O=(800,600)
s.line(180,600,1420,600,INK,6);label_pt(s,180,600,'A',0,60,44);label_pt(s,1420,600,'B',0,60,44);label_pt(s,800,600,'O',0,60,44)
C=P(800,600,420,140);D=P(800,600,420,50);s.line(800,600,*C,INK,6);s.line(800,600,*D,INK,6);s.text(C[0]-20,C[1]-20,'C',44);s.text(D[0]+20,D[1]-20,'D',44)
arc(s,800,600,120,140,180,BLUE,8);arc(s,800,600,150,50,140,ORANGE,8);arc(s,800,600,120,0,50,GREEN,8)
s.text(620,540,'∠AOC',36,BLUE);s.text(800,410,'∠COD',36,ORANGE);s.text(990,550,'∠DOB',36,GREEN)
s.text(800,770,'∠AOC ＋ ∠COD ＋ ∠DOB ＝ 180°',46,INK,weight=800);out.append(s.save('M1-C5-S1-DP1'))
# ---- 2節 ----
s=S('対称移動の性質');s.heading('対称の軸 ℓ で折り返す');lx=800
s.line(lx,140,lx,800,ORANGE,5,'16 10');s.text(lx+20,180,'ℓ',48,ORANGE,'start',font_style='italic')
A=(470,250);B=(330,560);Cc=(620,620);tri=[A,B,Cc];tri2=[(2*lx-x,y) for x,y in tri]
s.poly(tri,fill=SKY,stroke=INK,sw=5);s.poly(tri2,fill='#f6dcb8',stroke=INK,sw=5)
for (x,y),n in zip(tri,'ABC'):
    x2=2*lx-x;s.line(x,y,x2,y,DIM,3,'8 8');tick(s,x,y,lx,y,1,RED);tick(s,lx,y,x2,y,1,RED);right_mark(s,lx,y,1,0,0,-1,22,INK)
    s.text(x-28,y+12,n,42,INK,'end');s.text(x2+28,y+12,n+"′",42,INK,'start')
s.text(800,860,'対応する点を結ぶ線分は、ℓ と垂直に交わり、ℓ で2等分される',36);out.append(s.save('M1-C5-S2-D01'))
s=S('角の二等分線のしくみ');s.heading('作図の中に ひし形がある');O=(220,640);ang=50
X=P(*O,1150,0);Y=P(*O,720,ang);s.line(*O,*X,INK,5);s.line(*O,*Y,INK,5);s.text(O[0]-20,O[1]+50,'O',44);s.text(X[0],X[1]+50,'X',44);s.text(Y[0]+10,Y[1]-10,'Y',44)
r=420;Pp=P(*O,r,0);Q=P(*O,r,ang);d=r*math.cos(math.radians(ang/2));R=P(*O,2*d,ang/2)
arc(s,*O,r,-6,ang+6,BLUE,3,'10 8');arc(s,*P(*O,r,0),r,ang+70,ang+100,BLUE,3);arc(s,*P(*O,r,ang),r,-25,5,BLUE,3);s.poly([O,Pp,R,Q],stroke=ORANGE,sw=5,dash='14 10')
s.line(*O,*P(*O,1050,ang/2),GREEN,7);[label_pt(s,*pt,n,dx,dy,40,c) for pt,n,dx,dy,c in ((Pp,'P',0,52,BLUE),(Q,'Q',-30,-20,BLUE),(R,'R',28,-14,GREEN))]
tick(s,*O,*Pp,1,RED);tick(s,*O,*Q,1,RED);tick(s,*Pp,*R,1,RED);tick(s,*Q,*R,1,RED)
s.text(1150,820,'OR はひし形 OPRQ の対角線 → 角を2等分',38,GREEN);out.append(s.save('M1-C5-S2-D02'))
s=S('作図できる角の木');s.heading('作図できる角の木')
nodes={'90°':(330,620),'45°':(330,400),'60°':(800,620),'30°':(800,430),'15°':(800,240)}
s.rect(180,700,770,80,fill='#e9dfcf',stroke='none',rx=20);s.text(565,755,'垂線 → 90°　　正三角形 → 60°',38)
for a,b in (('90°','45°'),('60°','30°'),('30°','15°')): s.line(*nodes[a],*nodes[b],'#8a6a3a',14)
s.line(330,700,330,620,'#8a6a3a',16);s.line(800,700,800,620,'#8a6a3a',16)
for n,(x,y) in nodes.items(): s.circle(x,y,62,fill='#cdebd7',stroke=GREEN,sw=5);s.text(x,y+16,n,44,GREEN,weight=800)
s.text(420,520,'二等分',32,'#8a6a3a','start');s.text(890,535,'二等分',32,'#8a6a3a','start');s.text(890,345,'二等分',32,'#8a6a3a','start')
s.text(1280,180,'たし算で できる角',38,ORANGE)
for k,(t,f,c) in enumerate([('135°','90°＋45°',ORANGE),('105°','60°＋45°',RED),('75°','60°＋15°',PURPLE)]): y=300+k*170;s.circle(1180,y,66,fill='#fff1df',stroke=c,sw=5);s.text(1180,y+16,t,42,c,weight=800);s.text(1270,y+14,'＝ '+f,38,c,'start')
out.append(s.save('M1-C5-S2-D03'))
s=S('この節の地図');s.heading('移動と作図の地図')
s.card(60,150,700,330,'3つの移動',BLUE);s.lines(410,280,['平行移動：ずらす','回転移動：まわす','対称移動：折り返す'],38,gap=58)
s.card(840,150,700,330,'3つの基本の作図',ORANGE);s.lines(1190,280,['垂直二等分線','角の二等分線','垂線'],40,gap=58)
s.rect(420,560,760,220,fill='#fff7ec',stroke=ORANGE,sw=5);s.text(800,640,'理由はぜんぶ ひし形',48,ORANGE,weight=800);s.text(800,710,'対角線は 垂直に2等分し合い、角を2等分する',34)
s.arrow(1190,490,1000,550,ORANGE,6);s.text(800,850,'形と大きさを変えずに動かす ／ 定規とコンパスだけでかく',36);out.append(s.save('M1-C5-S2-DMAP'))
s=S('線分を2回半分にする');s.heading('中点の中点をとる');A=(200,520);B=(1400,520);M=(800,520);N=(1100,520)
s.line(*A,*B,INK,6)
for cx,r,c,mid in ((200,650,BLUE,800),(1400,650,BLUE,800),(800,380,ORANGE,1100),(1400,380,ORANGE,1100)):
    d=abs(mid-cx);h=math.sqrt(r*r-d*d);a=math.degrees(math.atan2(h,mid-cx));arc(s,cx,520,r,a-9,a+9,c,3);arc(s,cx,520,r,-a-9,-a+9,c,3)
s.line(800,230,800,810,BLUE,4,'14 10');s.line(1100,250,1100,790,ORANGE,4,'14 10')
for pt,n,c in ((A,'A',INK),(B,'B',INK),(M,'M',BLUE),(N,'N',ORANGE)): label_pt(s,*pt,n,(26 if n in 'MN' else 0),64,44,c)
s.text(220,470,'AB ＝ 12cm',40,INK,'start');s.text(800,860,'1回目：AB の中点 M　2回目：MB の中点 N',38);out.append(s.save('M1-C5-S2-DP1'))
def flag(s,x,y,flip=1,col=BLUE): s.line(x,y,x,y-200,INK,6);s.poly([(x,y-200),(x+flip*140,y-160),(x,y-120)],fill=col,stroke=INK,sw=4)
s=S('2回折り返すと平行移動');s.heading('ℓ で折り返し、m で折り返す');l1,m1=640,1020
s.line(l1,140,l1,760,ORANGE,5,'14 10');s.line(m1,140,m1,760,GREEN,5,'14 10');s.text(l1+14,180,'ℓ',46,ORANGE,'start',font_style='italic');s.text(m1+14,180,'m',46,GREEN,'start',font_style='italic')
x1=380;flag(s,x1,560,1,BLUE);x2=2*l1-x1;flag(s,x2,560,-1,'#f6dcb8');x3=2*m1-x2;flag(s,x3,560,1,BLUE)
s.text(x1,620,'①',44);s.text(x2,620,'②',44);s.text(x3,620,'③',44);s.arrow(x1,700,x3,700,RED,7);s.text((x1+x3)/2,760,'①→③ は 同じ向きに ずれただけ（平行移動）',36,RED)
out.append(s.save('M1-C5-S2-DP2'))
s=S('三角形の高さ');s.heading('頂点から 底辺に垂線をおろす')
A=(400,220);B=(140,620);Cc=(700,620);H=(400,620);s.poly([A,B,Cc],fill=SKY,stroke=INK,sw=5);s.line(*A,*H,ORANGE,6,'12 8');right_mark(s,*H,1,0,0,-1,26,ORANGE)
for pt,n,dx,dy in ((A,'A',0,-24),(B,'B',-24,40),(Cc,'C',24,40),(H,'H',0,60)): s.text(pt[0]+dx,pt[1]+dy,n,42)
A2=(940,250);B2=(1150,620);C2=(1450,620);H2=(940,620);s.line(900,620,1500,620,INK,3,'10 8') if False else None
s.line(900,620,1150,620,INK,4,'12 8');s.poly([A2,B2,C2],fill='#f6dcb8',stroke=INK,sw=5);s.line(*A2,*H2,ORANGE,6,'12 8');right_mark(s,*H2,1,0,0,-1,26,ORANGE)
for pt,n,dx,dy in ((A2,'A',0,-24),(B2,'B',0,48),(C2,'C',24,40),(H2,'H',0,60)): s.text(pt[0]+dx,pt[1]+dy,n,42)
s.text(420,760,'ふつうの三角形',38);s.text(1200,760,'鈍角三角形：辺 BC を延長',38);out.append(s.save('M1-C5-S2-DP3'))
# ---- 3節 ----
def short_path(s,showQ):
    ly=560;s.line(120,ly,1480,ly,INK,5);s.text(1500,ly+14,'ℓ',46,INK,'start',font_style='italic')
    A=(330,250);B=(1150,350);B2=(1150,770);Pp=(A[0]+(B2[0]-A[0])*(ly-A[1])/(B2[1]-A[1]),ly)
    label_pt(s,*A,'A',0,-26,44);label_pt(s,*B,'B',0,-26,44);label_pt(s,*B2,"B′",40,10,44,ORANGE);s.line(*B,*B2,DIM,3,'8 8')
    s.line(*A,*Pp,BLUE,7);s.line(*Pp,*B,BLUE,7,'4 0');s.line(*Pp,*B2,BLUE,4,'12 8');label_pt(s,*Pp,'P',-10,60,44,BLUE)
    if showQ: Q=(560,ly);s.line(*A,*Q,RED,5);s.line(*Q,*B2,RED,5,'12 8');label_pt(s,*Q,'Q',0,60,44,RED)
    return A,B2,Pp
s=S('ほかの点では長くなる');s.heading('Q を通ると 折れ線になる');short_path(s,True)
s.text(800,860,'A→P→B′ は まっすぐ、A→Q→B′ は折れ線で長い',38);out.append(s.save('M1-C5-S3-D01'))
s=S('この節の地図');s.heading('条件 → 使う作図')
rows=[('2点から等しい','垂直二等分線',BLUE),('2本の線から等しい','角の二等分線',ORANGE),('いちばん近い・直角','垂線',GREEN),('直線に寄るいちばん短い道','対称移動 → 線分',PURPLE)]
for k,(a,b,c) in enumerate(rows):
    y=160+k*165;s.rect(100,y,640,125,fill='white',stroke=c,sw=5);s.text(420,y+78,a,40);s.arrow(760,y+62,880,y+62,c,7);s.rect(900,y,600,125,fill=PALE,stroke=c,sw=5);s.text(1200,y+78,b,42,c,weight=800)
s.text(800,850,'条件が2つなら、2本の作図の交点',38,RED);out.append(s.save('M1-C5-S3-DMAP'))
s=S('方眼で B′ をとる');s.heading('B と 同じます目だけ 反対側へ');u=70;ox,oy=200,450
for i in range(17):
    s.line(ox+i*u,170,ox+i*u,800,'#d5dee9',2)
for j in range(10): s.line(ox,170+j*u,ox+16*u,170+j*u,'#d5dee9',2)
s.line(ox-20,oy,ox+16*u+20,oy,INK,6);s.text(ox+16*u+30,oy+14,'ℓ',46,INK,'start',font_style='italic')
A=(ox+3*u,oy-2*u);B=(ox+12*u,oy-4*u);B2=(ox+12*u,oy+4*u);label_pt(s,*A,'A',-30,-10,44);label_pt(s,*B,'B',34,-10,44);label_pt(s,*B2,"B′",54,16,44,ORANGE)
s.arrow(B[0]+0,B[1]+14,B[0],oy-4,ORANGE,6);s.arrow(B[0],oy+4,B2[0],B2[1]-14,ORANGE,6);s.text(B[0]+30,oy-2*u,'4ます',36,ORANGE,'start');s.text(B[0]+30,oy+2*u+10,'4ます',36,ORANGE,'start')
out.append(s.save('M1-C5-S3-DP1'))
# ---- 4節 ----
s=S('弦の垂直二等分線は中心を通る');s.heading('弦の垂直二等分線は 中心を通る');O=(800,480);r=290
s.circle(*O,r,stroke=INK,sw=5);A=P(*O,r,160);B=P(*O,r,250);Cc=P(*O,r,330)
s.line(*A,*B,BLUE,6);s.line(*B,*Cc,ORANGE,6)
for (p,q,c) in ((A,B,BLUE),(B,Cc,ORANGE)):
    m=((p[0]+q[0])/2,(p[1]+q[1])/2);dx,dy=O[0]-m[0],O[1]-m[1];L=math.hypot(dx,dy);ux,uy=dx/L,dy/L
    s.line(m[0]-ux*80,m[1]-uy*80,m[0]+ux*(L+150),m[1]+uy*(L+150),c,4,'14 10');tick(s,*p,*m,1,c);tick(s,*m,*q,1,c)
for p,n,a in ((A,'A',160),(B,'B',250),(Cc,'C',330)): q=P(*O,r+40,a);s.text(q[0],q[1]+14,n,42)
label_pt(s,*O,'O',36,-12,44,RED);s.text(1300,800,'2本の交点が 円の中心',38,RED);out.append(s.save('M1-C5-S4-D01'))
s=S('円のa/360');s.heading('おうぎ形は 円の a/360');O=(480,470);r=290
s.circle(*O,r,stroke=INK,sw=4)
for k in range(36): p=P(*O,r,k*10);q=P(*O,r-(26 if k%9==0 else 14),k*10);s.line(*p,*q,INK,3)
arc(s,*O,r,90,140,ORANGE,6,fill='#f6dcb8',sector=True);s.text(*P(*O,90,115),'a°',40,ORANGE)
s.card(860,190,680,560,'円の a/360 倍',ORANGE);s.lines(1200,340,['弧の長さ','＝ 2πr × a/360','','面積','＝ πr² × a/360'],40,gap=64);out.append(s.save('M1-C5-S4-D02'))
s=S('この節の地図');s.heading('円とおうぎ形の地図')
s.card(60,150,700,600,'ことば',BLUE);s.lines(410,290,['弧：円周の一部','弦：弧の両はしを結ぶ線分','中心角：2つの半径の角','接線：1点で接する直線','（接点を通る半径に垂直）'],34,gap=78)
s.card(840,150,700,600,'公式',ORANGE);s.lines(1190,290,['円周 ℓ＝2πr','面積 S＝πr²','おうぎ形は 円の a/360','面積 ＝ ½ × 弧 × r'],40,gap=95);out.append(s.save('M1-C5-S4-DMAP'))
s=S('外の点からの接線');s.heading('接線は 半径に垂直');O=(500,500);r=220;Pp=(1300,500)
s.circle(*O,r,stroke=INK,sw=5);d=Pp[0]-O[0];a=math.degrees(math.acos(r/d));A=P(*O,r,a)
s.line(*Pp,*(Pp[0]+(A[0]-Pp[0])*1.35,Pp[1]+(A[1]-Pp[1])*1.35),BLUE,6);s.line(*O,*A,INK,5);s.line(*O,*Pp,DIM,3,'10 8')
ux,uy=(Pp[0]-A[0]),(Pp[1]-A[1]);L=math.hypot(ux,uy);vx,vy=(O[0]-A[0]),(O[1]-A[1]);M=math.hypot(vx,vy);right_mark(s,*A,ux/L,uy/L,vx/M,vy/M,28,ORANGE)
ang=math.degrees(math.atan2(-(A[1]-Pp[1]),A[0]-Pp[0]));arc(s,*Pp,90,ang,180,RED,6)
label_pt(s,*O,'O',-30,10,44);label_pt(s,*A,'A',0,-26,44);label_pt(s,*Pp,'P',34,12,44);s.text(800,830,'接点 A で、半径 OA と接線は 直角',40);out.append(s.save('M1-C5-S4-DP1'))
s=S('おうぎ形のまわり');s.heading('まわり ＝ 弧 ＋ 半径2本');O=(560,680);r=440
arc(s,*O,r,0,90,ORANGE,10,fill='#fff1df',sector=False);s.path(f'M{O[0]} {O[1]} L{O[0]+r} {O[1]} A{r} {r} 0 0 0 {O[0]} {O[1]-r} Z',fill='#fff7ec',stroke='none')
arc(s,*O,r,0,90,ORANGE,10);s.line(*O,O[0]+r,O[1],BLUE,10,'22 12');s.line(*O,O[0],O[1]-r,BLUE,10,'22 12');right_mark(s,*O,1,0,0,-1,34,INK)
s.line(1120,300,1240,300,ORANGE,10);s.text(1260,314,'弧（実線）',40,ORANGE,'start');s.line(1120,400,1240,400,BLUE,10,'22 12');s.text(1260,414,'半径（点線）',40,BLUE,'start')
out.append(s.save('M1-C5-S4-DP2'))
# ---- 章末 ----
s=S('条件から作図を選ぶ早見表');s.heading('条件から 作図をえらぶ')
rows=[('2点から等しい','垂直二等分線'),('2本の線から等しい','角の二等分線'),('直角・いちばん近い','垂線'),('直線に寄るいちばん短い道','対称移動して線分'),('円の中心','弦の垂直二等分線を2本'),('接線','接点を通る半径の垂線')]
for k,(a,b) in enumerate(rows):
    y=140+k*115;s.rect(120,y,620,95,fill='white',stroke=BLUE,sw=4);s.text(430,y+62,a,36);s.arrow(750,y+47,850,y+47,ORANGE,6);s.rect(860,y,620,95,fill='#fff7ec',stroke=ORANGE,sw=4);s.text(1170,y+62,b,38,ORANGE,weight=800)
out.append(s.save('M1-C5-REVIEW-E01'))
s=S('作図できる角の早見図');s.heading('作図できる角')
for k,(a,how) in enumerate([(90,'垂線'),(60,'正三角形'),(45,'90°を二等分'),(30,'60°を二等分'),(15,'30°を二等分')]):
    cx=170+k*310;cy=520;arc(s,cx-100,cy,200,0,a,BLUE,4,fill=PALE,sector=True);s.text(cx,cy+70,f'{a}°',52,BLUE,weight=800);s.text(cx,cy+130,how,32)
out.append(s.save('M1-C5-REVIEW-E02'))
s=S('正方形とおうぎ形');s.heading('正方形 − おうぎ形');x0,y0,u=520,170,600
s.add(f'<defs><pattern id="h" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="24" stroke="{ORANGE}" stroke-width="6"/></pattern></defs>')
s.rect(x0,y0,u,u,fill='url(#h)',stroke=INK,sw=5,rx=0);s.path(f'M{x0} {y0+u} L{x0+u} {y0+u} A{u} {u} 0 0 0 {x0} {y0} Z',fill=SKY,stroke=INK,sw=5)
s.text(x0+u/2,y0+u+60,'4cm',40);s.text(x0-24,y0+u/2,'4cm',40,INK,'end');s.circle(x0,y0+u,10,fill=INK);s.text(1220,400,'斜線の部分の面積',40,ORANGE,'start');s.text(1220,460,'＝ 正方形 − おうぎ形',38,INK,'start')
out.append(s.save('M1-APP2-C5-CH'))
# ---- 5章の図の枠 ----
s=S('直線・線分・半直線');s.heading('端が あるか ないか')
for k,(n,kind) in enumerate([('直線 AB','line'),('線分 AB','seg'),('半直線 AB','ray')]):
    y=230+k*190;s.text(120,y+14,n,44,BLUE,'start',weight=800);A=(560,y);B=(1000,y)
    x0=420 if kind=='line' else 560;x1=1500 if kind!='seg' else 1000
    s.line(x0,y,x1,y,INK,7)
    if kind!='seg': s.arrow(x1-10,y,x1+20,y,INK,7,24)
    if kind=='line': s.arrow(x0+10,y,x0-20,y,INK,7,24)
    for pt,nm in ((A,'A'),(B,'B')): s.circle(*pt,12,fill=INK if (kind!='line') or True else 'white',stroke=INK);s.text(pt[0],y+56,nm,40)
s.text(800,820,'直線は両方向、半直線は B の方向だけ、かぎりなくのびる',38);out.append(s.save('M1-C5-S1-FIG01'))
s=S('平行な2直線の距離');s.heading('どこではかっても 同じ長さ');s.line(150,280,1450,280,INK,6);s.line(150,620,1450,620,INK,6);s.text(1470,294,'ℓ',46,INK,'start',font_style='italic');s.text(1470,634,'m',46,INK,'start',font_style='italic')
for x in (400,800,1200): s.line(x,280,x,620,ORANGE,6);right_mark(s,x,620,1,0,0,-1,24,ORANGE);tick(s,x,280,x,620,2,RED);s.circle(x,280,10,fill=INK)
s.text(800,760,'3本の垂線は 同じ長さ ＝ 平行な2直線の距離',40);out.append(s.save('M1-C5-S1-FIG02'))
s=S('3つの移動');s.heading('ずらす・まわす・折り返す');u=34
T=[(1,1),(4,1),(1,4)]
for k,(name,c) in enumerate([('平行移動',BLUE),('回転移動',ORANGE),('対称移動',GREEN)]):
    gx,gy=70+k*510,200
    for i in range(14):
        s.line(gx+i*u,gy,gx+i*u,gy+13*u,'#d5dee9',2)
    for j in range(14): s.line(gx,gy+j*u,gx+13*u,gy+j*u,'#d5dee9',2)
    m=lambda p:(gx+p[0]*u,gy+13*u-p[1]*u)
    if k==0: T2=[(x+6,y+1) for x,y in T]
    if k==1: cx,cy=6,6;T2=[(cx-(y-cy),cy+(x-cx)) for x,y in T];s.circle(*m((cx,cy)),9,fill=RED,stroke=RED);s.text(m((cx,cy))[0]+14,m((cx,cy))[1]-12,'O',34,RED,'start')
    if k==2: T2=[(12-x,y) for x,y in T];s.line(*m((6,0)),*m((6,13)),GREEN,4,'12 8');s.text(m((6,13))[0]+10,m((6,13))[1]+40,'ℓ',38,GREEN,'start')
    s.poly([m(p) for p in T],fill=SKY,stroke=INK,sw=4);s.poly([m(p) for p in T2],fill='#f6dcb8',stroke=INK,sw=4)
    for a,b in zip(T,T2): s.line(*m(a),*m(b),c,3,'8 6')
    s.text(gx+6.5*u,gy+13*u+60,name,44,c,weight=800)
out.append(s.save('M1-C5-S2-FIG01'))
s=S('垂直二等分線の作図');s.heading('同じ半径の円 → 交点を結ぶ');A=(480,500);B=(1120,500);r=430
s.line(*A,*B,INK,6);h=math.sqrt(r*r-320*320);Pp=(800,500-h);Q=(800,500+h)
for c,sg in ((A,1),(B,-1)):
    a=math.degrees(math.atan2(h,320*sg));arc(s,*c,r,a-14,a+14,BLUE,3);arc(s,*c,r,-a-14,-a+14,BLUE,3)
s.poly([A,Pp,B,Q],stroke=ORANGE,sw=4,dash='14 10');s.line(800,Pp[1]-60,800,Q[1]+60,GREEN,6)
for pt,n,dx,dy in ((A,'A',-30,12),(B,'B',30,12),(Pp,'P',30,-10),(Q,'Q',30,30),((800,500),'M',34,50)): label_pt(s,*pt,n,dx,dy,42)
for p,q in ((A,Pp),(Pp,B),(B,Q),(Q,A)): tick(s,*p,*q,1,RED)
right_mark(s,800,500,1,0,0,-1,24,GREEN);s.text(1270,250,'ひし形 APBQ',40,ORANGE,'start');out.append(s.save('M1-C5-S2-FIG02'))
s=S('垂線の作図');s.heading('垂線の作図（2通り）')
for k in range(2):
    ox=420+k*760;y=560;s.line(ox-330,y,ox+330,y,INK,5);s.text(ox-330,y+50,'X',40);s.text(ox+330,y+50,'Y',40)
    if k==0:
        Pp=(ox,y);A=(ox-200,y);B=(ox+200,y);R=(ox,y-300);s.poly([Pp,A,R,B],stroke=ORANGE,sw=3,dash='12 8') if False else None
        arc(s,*Pp,200,160,200,BLUE,3);arc(s,*Pp,200,-20,20,BLUE,3);s.line(ox,y-380,ox,y+60,GREEN,6);right_mark(s,ox,y,1,0,0,-1,24,GREEN)
        for pt,n in ((Pp,'P'),(A,'A'),(B,'B')): label_pt(s,*pt,n,0,56,38)
        arc(s,*A,360,40,62,BLUE,3);arc(s,*B,360,118,140,BLUE,3);s.text(ox,140,'直線上の点 P',40,BLUE)
    else:
        Pp=(ox,y-260);r=330;h=math.sqrt(r*r-260*260);A=(ox-h,y);B=(ox+h,y);Q=(ox,y+260)
        arc(s,*Pp,r,-90-45,-90+45,BLUE,3);arc(s,*A,r,-60,-30,BLUE,3);arc(s,*B,r,210,240,BLUE,3)
        s.poly([Pp,A,Q,B],stroke=ORANGE,sw=4,dash='12 8');s.line(ox,Pp[1]-60,ox,Q[1]+40,GREEN,6);right_mark(s,ox,y,1,0,0,-1,24,GREEN)
        for pt,n,dx,dy in ((Pp,'P',30,-10),(A,'A',-20,50),(B,'B',20,50),(Q,'Q',30,20)): label_pt(s,*pt,n,dx,dy,38)
        s.text(ox,140,'直線の外の点 P',40,BLUE)
out.append(s.save('M1-C5-S2-FIG03'))
s=S('模様と移動');s.heading('もとの図形を 動かして 模様をつくる');u=80
for i in range(6):
    for j in range(6): s.rect(100+i*u,200+j*u,u,u,fill=INK if (i+j)%2 else 'white',stroke=INK,sw=2,rx=0)
s.rect(100,200,2*u,u,fill='none',stroke=ORANGE,sw=8,rx=0);s.arrow(100+2*u,240,100+4*u-10,240,ORANGE,6);s.text(340,720,'市松模様：平行移動',38,ORANGE)
h=u*math.sqrt(3)/2*1.2;w=u*1.2
for r in range(4):
    for c in range(6):
        x=840+c*w/1+(r%2)*w/2;y=200+r*h;up=[(x,y+h),(x+w,y+h),(x+w/2,y)];s.poly(up,fill=SKY,stroke=INK,sw=3)
        if c<5: dn=[(x+w/2,y),(x+w*1.5,y),(x+w,y+h)];s.poly(dn,fill='#f6dcb8',stroke=INK,sw=3)
s.text(1200,720,'三角形：回転・対称・平行移動',38,BLUE);out.append(s.save('M1-C5-S2-FIG04'))
s=S('いちばん短い道');s.heading('B を折り返して、A と結ぶ');A,B2,Pp=short_path(s,False)
s.text(800,860,'PB ＝ PB′ だから、A→P→B ＝ A→P→B′（線分）',38);out.append(s.save('M1-C5-S3-FIG01'))
s=S('かべ当て');s.heading('的を折り返して まっすぐねらう');ly=560;s.rect(100,ly,1400,30,fill='#c9b79a',stroke=INK,sw=3,rx=0);s.text(1520,ly+24,'かべ ℓ',40,INK,'start')
S0=(330,250);T=(1150,330);T2=(1150,2*ly-330);Pp=(S0[0]+(T2[0]-S0[0])*(ly-S0[1])/(T2[1]-S0[1]),ly)
s.line(*S0,*Pp,BLUE,7);s.line(*Pp,*T,BLUE,7);s.arrow(Pp[0]+(T[0]-Pp[0])*0.6-1,Pp[1]+(T[1]-Pp[1])*0.6,Pp[0]+(T[0]-Pp[0])*0.62,Pp[1]+(T[1]-Pp[1])*0.62,BLUE,7)
s.line(*Pp,*T2,BLUE,4,'12 8');s.line(*T,*T2,DIM,3,'8 8');s.circle(*T,26,fill='white',stroke=RED,sw=6);s.circle(*T,10,fill=RED,stroke=RED);s.circle(*S0,18,fill=ORANGE,stroke=INK)
s.text(S0[0],S0[1]-34,'打つ点',38);s.text(T[0],T[1]-44,'的 T',38,RED);s.text(T2[0]+40,T2[1],"T′",40,ORANGE,'start');out.append(s.save('M1-C5-S3-FIG02'))
s=S('円のことば');s.heading('円のことば');O=(640,480);r=280
arc(s,*O,r,30,95,ORANGE,1,fill='#fff1df',sector=True);s.circle(*O,r,stroke=INK,sw=5);arc(s,*O,r,30,95,ORANGE,10)
A=P(*O,r,30);B=P(*O,r,95);s.line(*A,*B,BLUE,5);s.line(*O,*A,INK,4);s.line(*O,*B,INK,4);arc(s,*O,60,30,95,PURPLE,5)
T=P(*O,r,-60);s.line(*O,*T,INK,4);tx,ty=math.cos(math.radians(30)),math.sin(math.radians(30));s.line(T[0]-tx*260,T[1]-ty*260,T[0]+tx*260,T[1]+ty*260,GREEN,6)
right_mark(s,*T,tx,ty,-math.cos(math.radians(-60)),math.sin(math.radians(-60)),26,GREEN)
label_pt(s,*O,'O',-30,10,42);s.text(A[0]+30,A[1]-10,'A',42,INK,'start');s.text(B[0]-10,B[1]-26,'B',42);s.text(T[0]-30,T[1]+44,'T',42)
for t,c,y in (('弧 AB',ORANGE,240),('弦 AB',BLUE,310),('中心角 ∠AOB',PURPLE,380),('おうぎ形 OAB',ORANGE,450),('接線（OT に垂直）',GREEN,520)): s.text(1100,y,t,40,c,'start',weight=800)
out.append(s.save('M1-C5-S4-FIG01'))
s=S('円とおうぎ形');s.heading('おうぎ形は 円の a/360');s.circle(330,470,230,fill=PALE,stroke=INK,sw=5);s.text(330,780,'半径 r の円（360°）',38)
arc(s,1180,620,340,60,120,ORANGE,5,fill='#f6dcb8',sector=True);arc(s,1180,620,70,60,120,ORANGE,5);s.text(1180,520,'a°',40,ORANGE);s.text(1180,780,'中心角 a° のおうぎ形',38)
for k in range(36): p=P(330,470,230,k*10);q=P(330,470,212,k*10);s.line(*p,*q,INK,2)
s.text(660,490,'×',56);s.text(800,490,'a/360',52,ORANGE,weight=800);s.arrow(890,470,960,470,ORANGE,6);out.append(s.save('M1-C5-S4-FIG02'))
s=S('半円の花だん');s.heading('まわり ＝ 弧 ＋ 直径');O=(800,640);r=420
s.path(f'M{O[0]-r} {O[1]} A{r} {r} 0 0 1 {O[0]+r} {O[1]} Z',fill='#cdebd7',stroke='none');arc(s,*O,r,0,180,GREEN,10);s.line(O[0]-r,O[1],O[0]+r,O[1],ORANGE,10,'22 12')
s.line(*O,*P(*O,r,40),INK,4);s.text(*P(*O,r*0.55,52),'5m',42);s.circle(*O,9,fill=INK);s.text(1300,300,'弧（実線）',40,GREEN,'start');s.text(1300,700,'直径（点線）',40,ORANGE,'start');out.append(s.save('M1-C5-S4-FIG03'))
print(len(out))
