from svgkit import *
import math
out=[]
A=[4.2,5.8,6.1,6.5,7.0,7.3,7.4,7.8,8.1,8.2,8.5,8.6,8.9,9.0,9.4,9.7,10.2,10.8,11.5,12.6]
def cnt(lo,hi,w): return [sum(1 for v in A if a<=v<a+w) for a in [lo+k*w for k in range(int((hi-lo)/w))]]
assert cnt(4,14,2)==[2,6,8,3,1] and round(sum(A)/20,2)==8.38
s=S('階級の幅を変えると');s.heading('同じデータ・階級の幅だけちがう')
for k,(w,hi,ym) in enumerate([(1,13,5),(2,14,8),(4,16,12)]):
    x0=110+k*510;f=cnt(4,hi,w);assert sum(f)==20
    X,Y=chart(s,x0,700,380,440,4,hi,0,ym,list(range(4,hi+1,w if w>1 else 2)),list(range(0,ym+1,ym//4 if ym>=8 else 1)),'m','回',26)
    hist(s,X,Y,list(range(4,hi+1,w)),f,[ '#cfe3f6',SKY,'#5f9fd8'][k]);s.text(x0+190,800,f'幅 {w}m',40,BLUE,weight=800)
s.text(800,860,'幅が せまい → でこぼこ　　幅が 広い → おおまか',34);out.append(s.save('M1-C7-S1-D01'))
s=S('相対度数でくらべる');s.heading('人数（回数）がちがうときは 相対度数');Af=[2,6,8,3,1];Bf=[1,4,8,9,3]
for k,(t,a,b,ym,yt,fy) in enumerate([('縦軸＝度数',Af,Bf,10,[0,2,4,6,8,10],str),('縦軸＝相対度数',[v/20 for v in Af],[v/25 for v in Bf],0.5,[0,.1,.2,.3,.4,.5],lambda v:'0' if v==0 else f'{v:.1f}')]):
    x0=150+k*760;X,Y=chart(s,x0,720,560,480,2,16,0,ym,[2,4,6,8,10,12,14,16],yt,'m','',26,fy=fy)
    xs=[3,5,7,9,11,13,15]
    for d,col,dash,mk in ((a,BLUE,None,'c'),(b,ORANGE,'14 10','s')):
        pts=[(X(x),Y(v)) for x,v in zip(xs,[0]+list(d)+[0])];s.poly(pts,stroke=col,sw=6,dash=dash,close=False)
        for p in pts: (s.circle(*p,9,fill=col,stroke=col) if mk=='c' else s.rect(p[0]-9,p[1]-9,18,18,fill=col,stroke=col,sw=2,rx=0))
    s.text(x0+280,140,t,40,BLUE if k==0 else GREEN,weight=800)
s.line(560,830,640,830,BLUE,6);s.text(660,842,'A（20回）',32,BLUE,'start');s.line(900,830,980,830,ORANGE,6,'14 10');s.text(1000,842,'B（25回）',32,ORANGE,'start');out.append(s.save('M1-C7-S1-D02'))
def table(s,x,y,cols,rows,cw,rh=62,size=32,head=SKY):
    for j,c in enumerate(cols): s.rect(x+sum(cw[:j]),y,cw[j],rh,fill=head,stroke=INK,sw=2,rx=0);s.text(x+sum(cw[:j])+cw[j]/2,y+rh/2+11,c,size-2)
    for i,r in enumerate(rows):
        for j,c in enumerate(r):
            fill='#fff7ec' if i==len(rows)-1 and r[0]=='合計' else 'white';s.rect(x+sum(cw[:j]),y+(i+1)*rh,cw[j],rh,fill=fill,stroke=INK,sw=2,rx=0);s.text(x+sum(cw[:j])+cw[j]/2,y+(i+1)*rh+rh/2+11,c,size)
s=S('階級値×度数の表');s.heading('階級値 × 度数 → 合計 ÷ 度数の合計');cls=['4以上6未満','6〜8','8〜10','10〜12','12〜14'];cv=[5,7,9,11,13]
rows=[[c,str(f),str(v),str(f*v)] for c,f,v in zip(cls,Af,cv)]+[['合計','20','','170']];assert sum(f*v for f,v in zip(Af,cv))==170
table(s,140,150,['距離（m）','度数','階級値','階級値×度数'],rows,[280,160,180,280])
s.rect(760,150,280,62*7,fill='none',stroke=ORANGE,sw=6,rx=8);s.arrow(1050,150+62*6+31,1230,150+62*6+31,ORANGE,6);s.text(1390,560,'170 ÷ 20',44,ORANGE,weight=800);s.text(1390,630,'＝ 8.5（m）',44,ORANGE,weight=800)
s.text(800,780,'度数分布表から求める平均値（もとのデータの平均 8.38 とは少しずれる）',30);out.append(s.save('M1-C7-S1-D03'))
s=S('この節の地図');s.heading('データの活用の地図')
s.card(70,170,440,560,'集める',BLUE);s.lines(290,330,['調べたいことを','決めて','データを集める'],34,gap=64)
s.card(580,170,440,560,'整理する',ORANGE);s.lines(800,320,['度数分布表','ヒストグラム','度数分布多角形','相対度数・累積'],34,gap=70)
s.card(1090,170,440,560,'読みとる',GREEN);s.lines(1310,320,['代表値','平均値・中央値・最頻値','範囲','→ 判断・説明'],32,gap=70)
s.arrow(515,450,575,450,INK,6);s.arrow(1025,450,1085,450,INK,6);out.append(s.save('M1-C7-S1-DMAP'))
s=S('境目の値はどっち？');s.heading('155 は どちらの階級？');X=lambda v:200+(v-148)*100
s.line(X(148),560,X(162),560,INK,4);[ (s.line(X(v),548,X(v),572,INK,3),s.text(X(v),620,str(v),36)) for v in range(148,163,1) if v%1==0 and v in (150,155,160)]
for v in range(148,163): s.line(X(v),552,X(v),568,INK,2)
s.rect(X(150),380,X(155)-X(150),60,fill='#cfe3f6',stroke=BLUE,sw=4,rx=8);s.text((X(150)+X(155))/2,422,'150 以上 155 未満',32,BLUE)
s.rect(X(155),460,X(160)-X(155),60,fill='#f6dcb8',stroke=ORANGE,sw=4,rx=8);s.text((X(155)+X(160))/2,502,'155 以上 160 未満',32,ORANGE)
s.circle(X(155),410,14,fill='white',stroke=BLUE,sw=5);s.circle(X(155),490,14,fill=ORANGE,stroke=ORANGE,sw=5);s.circle(X(150),410,14,fill=BLUE,stroke=BLUE,sw=5);s.circle(X(160),490,14,fill='white',stroke=ORANGE,sw=5)
s.text(800,720,'●：その数をふくむ　　○：その数をふくまない',38);out.append(s.save('M1-C7-S1-DP1'))
s=S('中央値の見つけ方');s.heading('8個なら まん中の2つの平均');x0=150;cw=140
for k in range(8):
    x=x0+k*(cw+30);s.rect(x,330,cw,180,fill='#cfe3f6' if k in (3,4) else 'white',stroke=ORANGE if k in (3,4) else INK,sw=6 if k in (3,4) else 3);s.text(x+cw/2,445,'?',70,DIM);s.text(x+cw/2,560,f'{k+1}番目',30)
fx=x0+4*(cw+30)-15;s.line(fx,330,fx,170,RED,5);s.poly([(fx,170),(fx+110,200),(fx,230)],fill=RED,stroke=RED,sw=2);s.text(fx+130,215,'まん中',36,RED,'start')
s.path(f'M{x0+3*(cw+30)+cw/2} 600 Q{fx} 700 {x0+4*(cw+30)+cw/2} 600',stroke=ORANGE,sw=5);s.text(fx,760,'4番目と5番目の平均',40,ORANGE,weight=800);s.text(800,840,'小さい順に ならべてから',34);out.append(s.save('M1-C7-S1-DP2'))
s=S('平均が同じで散らばりがちがう');s.heading('どちらも 平均 3.0');L=[1,3,6,3,1];R=[6,2,0,2,6]
assert sum((i+1)*v for i,v in enumerate(L))/sum(L)==3 and sum((i+1)*v for i,v in enumerate(R))/sum(R)==3
for k,(d,t) in enumerate(((L,'まん中に集まる山'),(R,'両はしに分かれる谷'))):
    x0=150+k*760;X,Y=chart(s,x0,700,560,460,0.5,5.5,0,7,[1,2,3,4,5],[0,2,4,6],'点','人',30,fx=lambda v:str(int(v)))
    hist(s,X,Y,[0.5,1.5,2.5,3.5,4.5,5.5],d,[SKY,'#f6dcb8'][k]);s.line(X(3),Y(0),X(3),Y(7.2),RED,5,'12 8');s.text(X(3),Y(7.2)-14,'平均 3.0',32,RED);s.text(x0+280,800,t,38,[BLUE,ORANGE][k],weight=800)
out.append(s.save('M1-C7-S1-DP3'))
s=S('予想される回数');s.heading('当たる確率 0.07 → 300回で およそ 21回');u=40;x0=240;y0=170
import random;random.seed(7);hit=set(random.sample(range(300),21))
for i in range(300):
    r,c=divmod(i,20);x=x0+c*u;y=y0+r*u;s.rect(x,y,u-4,u-4,fill=ORANGE if i in hit else 'white',stroke='#9fb3c8',sw=2,rx=4)
    if i in hit: s.text(x+u/2-2,y+u/2+8,'★',22,'white')
s.text(1240,330,'300 マス',40,INK,'start');s.text(1240,410,'★ 21 マス',40,ORANGE,'start',weight=800);s.text(1240,520,'300 × 0.07',40,INK,'start');s.text(1240,590,'＝ 21',44,ORANGE,'start',weight=800)
out.append(s.save('M1-C7-S2-D01'))
s=S('この節の地図');s.heading('データから 確率へ')
for k,(t,b,c) in enumerate([('実験・データ','何回もやってみる',BLUE),('相対度数','その回数 ÷ 全体',ORANGE),('確率','ふやすと近づく値',GREEN),('予想・判断','確率 × 回数',PURPLE)]):
    x=50+k*390;s.card(x,250,350,360,t,c);s.text(x+175,450,b,30)
    if k<3: s.arrow(x+355,430,x+385,430,INK,6)
out.append(s.save('M1-C7-S2-DMAP'))
s=S('少ない回数のばらつき');s.heading('回数が少ないと ばらつきが大きい')
v60=[0.25,0.10,0.20,0.13,0.27];v6k=[0.168,0.164,0.170,0.165,0.167]
for k,(t,vals,c) in enumerate((('60回ずつ 5回',v60,ORANGE),('6000回ずつ 5回',v6k,BLUE))):
    x0=140+k*740;base=760;s.text(x0+290,170,t,40,c,weight=800)
    for i,v in enumerate(vals): s.rect(x0+i*115,base-v*1600,80,v*1600,fill=c,stroke=INK,sw=2,rx=0)
    s.line(x0-20,base-1/6*1600,x0+580,base-1/6*1600,RED,4,'12 8');s.line(x0-20,base,x0+580,base,INK,3)
s.text(800,840,'赤い点線：たくさん投げたときに近づく値',32,RED);out.append(s.save('M1-C7-S2-DP1'))
s=S('問題解決の4ステップ');s.heading('データで 問題を解決する 4ステップ')
for k,(t,b,c) in enumerate([('調べたいことを決める','問い',BLUE),('データを集める','表',ORANGE),('整理する','グラフ・代表値',GREEN),('結論を出す','相対度数・確率',PURPLE)]):
    x=50+k*390;s.card(x,230,350,400,f'{k+1}',c);s.lines(x+175,380,{'調べたいことを決める':['調べたいことを','決める']}.get(t,[t]),34,gap=56);s.rect(x+40,520,270,60,fill='#f3f6fa',stroke=c,sw=3);s.text(x+175,561,b,28,c)
    if k<3: s.arrow(x+355,430,x+385,430,INK,6)
out.append(s.save('M1-C7-REVIEW-E01'))
s=S('階級値×度数の計算表');s.heading('表に 2列 たして 平均値へ')
table(s,160,170,['階級','度数','階級値','階級値×度数'],[['','','','']]*5+[['合計','','','']],[260,160,180,280],rh=70)
s.rect(580,170,460,70*7,fill='none',stroke=ORANGE,sw=6,rx=8);s.text(810,150,'たす列',32,ORANGE)
s.arrow(1040,170+70*6+35,1260,170+70*6+35,ORANGE,6);s.text(1400,560,'÷ 度数の合計',38,ORANGE,weight=800);s.text(1400,630,'＝ 平均値',38,ORANGE,weight=800);out.append(s.save('M1-C7-REVIEW-E02'))
s=S('平均と合計');s.heading('6人目が入ると 平均が上がる');sc=[60,75,70,80,65];assert sum(sc)/5==70
X0,BY=200,760;k_=6
for i,v in enumerate(sc): s.rect(X0+i*150,BY-v*k_,100,v*k_,fill=SKY,stroke=INK,sw=3,rx=0);s.text(X0+i*150+50,BY+40,f'{i+1}人目',28)
s.rect(X0+5*150,BY-560,100,560,fill='none',stroke=ORANGE,sw=4,rx=0,dash='14 10');s.text(X0+5*150+50,BY-260,'?',80,ORANGE,weight=900);s.text(X0+5*150+50,BY+40,'6人目',28,ORANGE)
s.line(X0-30,BY-70*k_,X0+5*150-20,BY-70*k_,BLUE,5,'12 8');s.text(X0-40,BY-70*k_+10,'70',34,BLUE,'end')
s.line(X0-30,BY-72*k_-60,X0+6*150,BY-72*k_-60,RED,5,'4 0') if False else None
s.line(X0-30,BY-72*k_,X0+6*150-30,BY-72*k_,RED,5);s.text(X0+6*150-20,BY-72*k_+10,'72',34,RED,'start');s.text(1240,320,'5人の平均 70点',40,BLUE,'start',weight=800);s.text(1240,400,'6人の平均 72点',40,RED,'start',weight=800);s.arrow(1300,420,1300,520,INK,5) if False else None
s.text(1240,500,'合計は どう変わる？',36,INK,'start');out.append(s.save('M1-APP2-C7-CH'))
# ---- 7章 図の枠 ----
s=S('度数分布表とヒストグラム');s.heading('紙飛行機 A の記録（20回）')
table(s,90,170,['距離（m）','度数（回）'],[[c,str(f)] for c,f in zip(cls,Af)]+[['合計','20']],[280,200])
X,Y=chart(s,760,740,700,520,4,14,0,10,[4,6,8,10,12,14],[0,2,4,6,8,10],'','',30);hist(s,X,Y,[4,6,8,10,12,14],Af)
for a,f in zip([4,6,8,10,12],Af): s.text((X(a)+X(a+2))/2,Y(f)-14,str(f),30,BLUE)
s.text(1110,830,'距離（m）',30);s.text(760,190,'度数（回）',30);out.append(s.save('M1-C7-S1-FIG01'))
s=S('相対度数の度数分布多角形');s.heading('相対度数で重ねる');X,Y=chart(s,200,760,1100,560,2,16,0,0.5,[2,4,6,8,10,12,14,16],[0,.1,.2,.3,.4,.5],'','相対度数',30,fy=lambda v:'0' if v==0 else f'{v:.2f}')
xs=[3,5,7,9,11,13,15]
for d,col,dash,mk in (([0,.10,.30,.40,.15,.05,0],BLUE,None,'c'),([0,.04,.16,.32,.36,.12,0],ORANGE,'14 10','s')):
    pts=[(X(x),Y(v)) for x,v in zip(xs,d)];s.poly(pts,stroke=col,sw=6,dash=dash,close=False)
    for p in pts: (s.circle(*p,10,fill=col,stroke=col) if mk=='c' else s.rect(p[0]-10,p[1]-10,20,20,fill=col,stroke=col,sw=2,rx=0))
s.text(750,840,'距離（m）',30);s.line(1340,300,1420,300,BLUE,6);s.circle(1380,300,10,fill=BLUE,stroke=BLUE);s.text(1440,312,'A',38,BLUE,'start',weight=800);s.line(1340,370,1420,370,ORANGE,6,'14 10');s.rect(1370,360,20,20,fill=ORANGE,stroke=ORANGE,sw=2,rx=0);s.text(1440,382,'B',38,ORANGE,'start',weight=800)
out.append(s.save('M1-C7-S1-FIG02'))
s=S('平均値が同じで散らばりがちがう');s.heading('平均値は同じ・散らばりがちがう')
U=[0]*8+[2,6,6,2]+[0]*8;D=[0,0]+[1,1,2,1,2,1,1,2,2,1,1,2,1,2,1,1]+[0,0]
cvs=[2.5+5*i for i in range(20)];assert sum(c*f for c,f in zip(cvs,U))/sum(U)==50 and sum(c*f for c,f in zip(cvs,D))/sum(D)==50
for k,(d,y0) in enumerate(((U,420),(D,780))):
    X,Y=chart(s,220,y0,1100,250,0,100,0,8,list(range(0,101,10)),[0,4,8],'点' if k else '','',26,grid=False);hist(s,X,Y,list(range(0,101,5)),d,[SKY,'#f6dcb8'][k])
    lo=min(i for i,f in enumerate(d) if f)*5;hi=(max(i for i,f in enumerate(d) if f)+1)*5;yy=y0+72
    s.arrow(X(lo)+4,yy,X(hi)-4,yy,GREEN,5);s.arrow(X(hi)-4,yy,X(lo)+4,yy,GREEN,5);s.text(X(hi)+20,yy+10,f'範囲 {hi-lo}',30,GREEN,'start')
s.line(220+550,120+60,220+550,790,RED,5,'12 8');s.text(220+550+14,170,'平均値 50',34,RED,'start');out.append(s.save('M1-C7-S1-FIG03'))
s=S('表計算ソフトの関数');s.heading('関数で 代表値を求める');x0,y0,rh=90,150,64
s.rect(x0,y0,500,rh,fill='#e3e9f1',stroke=INK,sw=2,rx=0);s.text(x0+250,y0+44,'A の記録（m）',30)
for i,v in enumerate(A):
    c,r=divmod(i,10);s.rect(x0+c*250,y0+rh+r*58,250,58,fill='white',stroke='#9fb3c8',sw=2,rx=0);s.text(x0+c*250+125,y0+rh+r*58+41,f'{v}',30)
F=[('=MAX(…)','12.6'),('=MIN(…)','4.2'),('=AVERAGE(…)','8.38'),('=MEDIAN(…)','8.35'),('=MODE(…)','求まらない')]
assert max(A)==12.6 and min(A)==4.2 and round((A[9]+A[10])/2,2)==8.35
for i,(f,v) in enumerate(F):
    y=y0+i*130;s.rect(720,y,440,90,fill='#f3f6fa',stroke=BLUE,sw=3,rx=8);s.text(740,y+58,f,36,BLUE,'start');s.arrow(1170,y+45,1250,y+45,INK,5);s.text(1270,y+58,v,40,ORANGE if i<4 else DIM,'start',weight=800)
s.text(1100,830,'同じ値が1つもないので 最頻値は決まらない',30,DIM);out.append(s.save('M1-C7-S1-FIG04'))
s=S('相対度数が近づく');s.heading('回数をふやすと 0.21 に近づく');X,Y=chart(s,220,760,1100,560,0,2000,0.15,0.30,[0,500,1000,1500,2000],[0.15,0.20,0.25,0.30],'','上向きの相対度数',30,fy=lambda v:f'{v:.2f}')
pts=[(X(n),Y(v)) for n,v in [(100,.22),(200,.205),(500,.216),(1000,.214),(2000,.213)]];s.line(X(0),Y(.21),X(2000),Y(.21),RED,4,'12 8');s.text(X(2000)+20,Y(.21)+10,'0.21',34,RED,'start')
s.poly(pts,stroke=BLUE,sw=6,close=False);[dot(s,*p,11,BLUE) for p in pts];s.text(X(1000),840,'投げた回数（回）',30);out.append(s.save('M1-C7-S2-FIG01'))
s=S('降水確率30%');s.heading('降水確率 30% ＝ 100回のうち およそ30回');u=62;x0=200;y0=170
random.seed(3);rain=set(random.sample(range(100),30))
for i in range(100):
    r,c=divmod(i,10);x=x0+c*u;y=y0+r*u;s.rect(x,y,u-6,u-6,fill='#5f9fd8' if i in rain else 'white',stroke='#9fb3c8',sw=2,rx=6)
    if i in rain: s.text(x+u/2-3,y+u/2+9,'☂',30,'white')
s.text(1100,330,'同じような予報',38,INK,'start');s.text(1100,390,'100回',44,INK,'start',weight=800);s.text(1100,500,'☂ 雨が降る',38,BLUE,'start');s.text(1100,560,'およそ30回',44,BLUE,'start',weight=800);out.append(s.save('M1-C7-S2-FIG02'))
print(len(out))
