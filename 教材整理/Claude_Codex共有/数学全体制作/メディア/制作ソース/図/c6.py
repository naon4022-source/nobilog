from svgkit import *
import math
out=[]
s=S('投影図から立体を当てる');s.heading('投影図 → 見取図')
for k,(name,el,pl) in enumerate([('円柱','rect','circle'),('円錐','tri','circle'),('正四角錐','tri','sqx')]):
    x=80+k*510;s.rect(x,140,460,640,fill='white',stroke='#c9d6e8',sw=3)
    cx=x+120;s.text(cx,195,'立面図',30);s.line(x+20,390,x+220,390,DIM,2,'8 6');s.text(cx,430,'平面図',30)
    if el=='rect': s.rect(cx-60,220,120,150,fill='none',stroke=INK,sw=4,rx=0)
    else: s.poly([(cx-65,370),(cx+65,370),(cx,220)],stroke=INK,sw=4)
    if pl=='circle': s.circle(cx,540,65,stroke=INK,sw=4);(s.circle(cx,540,6,fill=INK) if el=='tri' else None)
    else: s.rect(cx-65,475,130,130,fill='none',stroke=INK,sw=4,rx=0);s.line(cx-65,475,cx+65,605,INK,3);s.line(cx+65,475,cx-65,605,INK,3)
    s.arrow(x+235,430,x+275,430,ORANGE,6);vx=x+360
    if name=='円柱': cylinder3(s,vx,560,70,240)
    if name=='円錐': cone3(s,vx,560,80,280)
    if name=='正四角錐':
        pr=oblique(vx-70,560,140);pts=[pr(0,0,0),pr(1,0,0),pr(1,0,1),pr(0,0,1)];ap=pr(.5,1.9,.5)
        s.poly([pts[0],pts[1],ap],fill='#f6dcb8',stroke=INK,sw=4);s.poly([pts[1],pts[2],ap],fill='#f2c48d',stroke=INK,sw=4);s.line(*pts[2],*pts[3],INK,3,'8 6');s.line(*pts[3],*pts[0],INK,3,'8 6');s.line(*pts[3],*ap,INK,3,'8 6')
    s.text(x+230,740,name,44,BLUE,weight=800)
out.append(s.save('M1-C6-S1-D01'))
s=S('立方体の展開図いろいろ');s.heading('向かい合う面に 同じ記号');u=78
nets=[[(1,0),(0,1),(1,1),(2,1),(3,1),(1,2)],[(0,0),(0,1),(1,1),(2,1),(3,1),(3,2)],[(1,0),(0,1),(1,1),(2,1),(2,2),(3,2)],[(0,0),(1,0),(1,1),(2,1),(2,2),(3,2)]]
def opp(net):
    # 面の向かい合わせを、展開図を転がして求める（立方体の6面を追う）
    import itertools
    pos={net[0]:'D'}  # 下
    from collections import deque
    # 方向ごとに転がしたときの面の対応
    roll={'R':{'D':'R','R':'U','U':'L','L':'D','F':'F','B':'B'},'L':{'D':'L','L':'U','U':'R','R':'D','F':'F','B':'B'},'Dn':{'D':'F','F':'U','U':'B','B':'D','L':'L','R':'R'},'Up':{'D':'B','B':'U','U':'F','F':'D','L':'L','R':'R'}}
    state={net[0]:{'D':'D','U':'U','L':'L','R':'R','F':'F','B':'B'}};q=deque([net[0]]);face={}
    face[net[0]]='D'
    while q:
        c=q.popleft()
        for d,(dx,dy) in (('R',(1,0)),('L',(-1,0)),('Dn',(0,1)),('Up',(0,-1))):
            n=(c[0]+dx,c[1]+dy)
            if n in net and n not in state:
                st={k:roll[d][v] for k,v in state[c].items()}  # 各ラベルが今どこにあるか
                state[n]=st;inv={v:k for k,v in st.items()};face[n]=inv['D'];q.append(n)
    return face
marks={'D':'●','U':'●','L':'▲','R':'▲','F':'■','B':'■'};cols={'D':BLUE,'U':BLUE,'L':ORANGE,'R':ORANGE,'F':GREEN,'B':GREEN}
pair={'D':'U','U':'D','L':'R','R':'L','F':'B','B':'F'}
for k,net in enumerate(nets):
    ox=90+(k%2)*760;oy=150+(k//2)*360;f=opp(net)
    for c in net:
        x=ox+c[0]*u;y=oy+c[1]*u;lab=f[c];s.rect(x,y,u,u,fill='white',stroke=INK,sw=3,rx=0);s.text(x+u/2,y+u/2+16,marks[lab],44,cols[lab])
out.append(s.save('M1-C6-S1-D02'))
s=S('三脚はぐらつかない');s.heading('3点で 平面が1つに決まる')
s.path('M60 640 Q300 600 500 650 T950 630 T1540 650',stroke='#8a6a3a',sw=6);
def leg(x1,y1,x2,y2): s.line(x1,y1,x2,y2,INK,6)
tp=(330,300);[leg(*tp,x,y) for x,y in ((200,628),(330,650),(470,642))];s.poly([(260,300),(400,300),(380,260),(280,260)],fill=SKY,stroke=INK,sw=4)
s.rect(900,380,420,40,fill='#f6dcb8',stroke=INK,sw=4,rx=4);[leg(x,420,x,y) for x,y in ((920,640),(1300,640))];leg(1000,420,1000,560);leg(1220,420,1220,600)
s.text(330,750,'三脚：ぐらつかない',40,GREEN,weight=800);s.text(1110,750,'4本足：ぐらつくことがある',40,RED,weight=800);s.text(1000,600,'すきま',30,RED)
s.text(800,840,'1つの直線上にない3点をふくむ平面は 1つだけ',38);out.append(s.save('M1-C6-S1-D03'))
s=S('回転体の切り口');s.heading('円錐を切る 2つの切り方')
cone3(s,380,620,170,400,fill='#e4d4f5');s.poly([(380,220),(210,620),(550,620)],fill='#f6dcb8',stroke=ORANGE,sw=5);s.line(380,180,380,680,INK,3,'10 8');s.text(380,760,'軸をふくむ平面 → 二等辺三角形',36,ORANGE)
cone3(s,1180,620,170,400,fill='#e4d4f5');s.ellipse(1180,470,170*0.375,170*0.375*0.32,fill='#f6dcb8',stroke=ORANGE,sw=5);s.line(1180,180,1180,680,INK,3,'10 8');s.text(1180,760,'軸に垂直な平面 → 円',36,ORANGE)
out.append(s.save('M1-C6-S1-D04'))
s=S('この節の地図');s.heading('立体の地図')
s.card(60,150,480,600,'立体の仲間',BLUE);s.lines(300,280,['柱：角柱・円柱','錐：角錐・円錐','球','','多面体：平面だけ','正多面体：5種類'],36,gap=68)
s.card(570,150,460,600,'表し方',ORANGE);s.lines(800,290,['見取図','展開図','投影図','（立面図＋平面図）'],38,gap=80)
s.card(1060,150,480,600,'位置関係',GREEN);s.lines(1300,280,['2直線：','交わる・平行・ねじれ','直線と平面：','交わる・平行（垂直）','回転体・母線'],34,gap=72);out.append(s.save('M1-C6-S1-DMAP'))
s=S('正八面体の頂点と辺');s.heading('正八面体');cx,cy,R=800,470,280
top=(cx,cy-300);bot=(cx,cy+300);sq=[(cx-R,cy),(cx-60,cy+90),(cx+R,cy),(cx+60,cy-90)]
front=[sq[0],sq[1],sq[2]];s.poly([top,sq[0],sq[1]],fill='#cdebd7',stroke='none');s.poly([top,sq[1],sq[2]],fill='#9bd3a8',stroke='none');s.poly([bot,sq[0],sq[1]],fill='#9bd3a8',stroke='none');s.poly([bot,sq[1],sq[2]],fill='#7cc192',stroke='none')
for a,b in ((top,sq[0]),(top,sq[1]),(top,sq[2]),(bot,sq[0]),(bot,sq[1]),(bot,sq[2]),(sq[0],sq[1]),(sq[1],sq[2])): s.line(*a,*b,INK,5)
for a,b in ((top,sq[3]),(bot,sq[3]),(sq[2],sq[3]),(sq[3],sq[0])): s.line(*a,*b,INK,3,'10 8')
for p in [top,bot]+sq: s.circle(*p,12,fill=INK,stroke=INK)
s.text(1250,300,'実線：見える辺',36,INK,'start');s.text(1250,360,'点線：見えない辺',36,INK,'start');out.append(s.save('M1-C6-S1-DP1'))
s=S('円錐の展開図と中心角');s.heading('おうぎ形の弧 ＝ 底面の円周');O=(640,180);R=440
arc(s,*O,R,-135,-45,INK,4,fill='#e4d4f5',sector=True);arc(s,*O,R,-135,-45,ORANGE,10);s.text(O[0]-200,O[1]+180,'母線 16cm',40,INK,'end');arc(s,*O,70,-135,-45,PURPLE,5);s.text(O[0],O[1]+120,'90°',40,PURPLE)
s.circle(1250,560,110,fill='#f6dcb8',stroke=ORANGE,sw=10);s.text(1250,575,'底面',38);s.text(1250,730,'円周',36,ORANGE)
s.text(O[0],O[1]+R+80,'弧',36,ORANGE);s.text(800,850,'弧の長さ ＝ 底面の円周',40,ORANGE);out.append(s.save('M1-C6-S1-DP2'))
s=S('辺CGから見た位置関係');s.heading('辺 CG に注目');p=cuboid(s,430,640,150,4.2,2.6,3.2,lw=3)
s.line(*p['C'],*p['G'],ORANGE,12);s.text(1300,300,'辺 CG',48,ORANGE,'start',weight=800);s.text(1300,380,'交わる？',36,INK,'start');s.text(1300,440,'平行？',36,INK,'start');s.text(1300,500,'ねじれ？',36,INK,'start');out.append(s.save('M1-C6-S1-DP3'))
s=S('横の辺を軸に回す');s.heading('横の辺を 軸にして回す');x0,y0=280,520;W,H=700,280
s.line(150,y0,1200,y0,INK,4,'14 10');s.text(1220,y0+14,'ℓ',44,INK,'start',font_style='italic')
s.rect(x0,y0-H,W,H,fill='#f6dcb8',stroke=ORANGE,sw=6,rx=0)
s.ellipse(x0,y0,H*0.35,H,stroke=BLUE,sw=3,dash='12 8');s.ellipse(x0+W,y0,H*0.35,H,stroke=BLUE,sw=3,dash='12 8');s.line(x0,y0+H,x0+W,y0+H,BLUE,3,'12 8');s.line(x0,y0-H,x0+W,y0-H,BLUE,3,'12 8')
s.path(f'M{x0+W+120} {y0-160} A60 160 0 1 1 {x0+W+120} {y0+160}',stroke=ORANGE,sw=6);s.arrow(x0+W+130,y0+150,x0+W+110,y0+165,ORANGE,6)
s.text(x0+W/2,y0-H-30,'横',40);s.text(x0-30,y0-H/2,'縦',40,INK,'end');s.text(1350,300,'できる立体は？',40,BLUE,'middle');out.append(s.save('M1-C6-S1-DP4'))
s=S('球は円柱の2/3');s.heading('球は ちょうど入る円柱の ⅔');cylinder3(s,380,700,200,400,fill='#d8e6f5');sphere3(s,380,500,198)
for k,(t,v,c) in enumerate([('円柱',3,BLUE),('球',2,GREEN)]): y=330+k*170;s.text(800,y+44,t,44,c,'end');s.rect(830,y,v*200,80,fill=c,stroke=INK,sw=3,rx=6)
s.text(1130,640,'円柱 2πr³ の ⅔ ＝ ⁴⁄₃πr³',40,INK);out.append(s.save('M1-C6-S2-D01'))
s=S('正四角錐の展開図');s.heading('正四角錐の展開図');c=(800,470);a=170;h=230
s.rect(c[0]-a,c[1]-a,2*a,2*a,fill='#f6dcb8',stroke=INK,sw=4,rx=0)
for dx,dy in ((0,-1),(1,0),(0,1),(-1,0)):
    m=(c[0]+dx*a,c[1]+dy*a);tip=(c[0]+dx*(a+h),c[1]+dy*(a+h));nx,ny=-dy,dx;s.poly([(m[0]+nx*a,m[1]+ny*a),(m[0]-nx*a,m[1]-ny*a),tip],fill=SKY,stroke=INK,sw=4)
s.line(c[0],c[1]-a,c[0],c[1]-a-h,ORANGE,5,'12 8');right_mark(s,c[0],c[1]-a,1,0,0,-1,22,ORANGE);s.line(c[0]+10,c[1]-a-h/2,c[0]+200,c[1]-a-h/2-60,ORANGE,2);s.text(c[0]+210,c[1]-a-h/2-50,'三角形の高さ',34,ORANGE,'start')
s.text(1350,470,'底面 1つ',40,INK);s.text(1350,540,'＋ 側面 4つ',40,BLUE);out.append(s.save('M1-C6-S2-D02'))
s=S('球の表面積は円4つ分');s.heading('球の表面積 ＝ 半径 r の円 4つ分');sphere3(s,320,470,200)
s.text(620,490,'＝',70)
for k in range(4): s.circle(800+(k%2)*230+100,330+(k//2)*230,100,fill='#f4b6c2',stroke=INK,sw=4);s.text(800+(k%2)*230+100,345+(k//2)*230,'πr²',40)
s.text(1400,490,'4πr²',56,RED,weight=800);out.append(s.save('M1-C6-S2-D03'))
s=S('この節の地図');s.heading('体積と表面積の公式')
for k,(t,v,a,col) in enumerate([('柱','V ＝ Sh','側面積＋底面積×2',BLUE),('錐','V ＝ ⅓Sh','側面積＋底面積',PURPLE),('球','V ＝ ⁴⁄₃πr³','S ＝ 4πr²',GREEN)]):
    x=70+k*500;s.card(x,150,460,520,t,col);s.text(x+230,300,'体積',34,INK);s.text(x+230,380,v,48,col,weight=800);s.text(x+230,500,'表面積',34);s.text(x+230,580,a,34,col,weight=800)
s.text(1050+0,720,'円錐の側面積 πℓr',34,PURPLE) if False else s.text(800,760,'円錐の側面積 ＝ π × 母線 × 半径',40,PURPLE,weight=800)
out.append(s.save('M1-C6-S2-DMAP'))
s=S('球と同じ体積の円柱');s.heading('同じ体積になる 円柱の高さは？');sphere3(s,420,460,210);s.text(420,760,'半径 3cm の球',40)
cylinder3(s,1150,640,210,260,fill='#d8e6f5');s.text(1150,520,'？',90,ORANGE,weight=900);s.line(1400,380,1400,640,ORANGE,4);s.text(1420,520,'高さ',36,ORANGE,'start');s.text(1150,760,'底面の半径 3cm の円柱',40);out.append(s.save('M1-C6-S2-DP1'))
s=S('正四角錐の展開図の高さ');s.heading('側面の三角形の高さ');c=(800,470);a=130;h=260
s.rect(c[0]-a,c[1]-a,2*a,2*a,fill='#f6dcb8',stroke=INK,sw=4,rx=0)
for dx,dy in ((0,-1),(1,0),(0,1),(-1,0)):
    m=(c[0]+dx*a,c[1]+dy*a);tip=(c[0]+dx*(a+h),c[1]+dy*(a+h));nx,ny=-dy,dx;s.poly([(m[0]+nx*a,m[1]+ny*a),(m[0]-nx*a,m[1]-ny*a),tip],fill=SKY,stroke=INK,sw=4)
s.line(c[0]+a,c[1],c[0]+a+h,c[1],ORANGE,6,'12 8');right_mark(s,c[0]+a,c[1],1,0,0,-1,22,ORANGE);s.rect(c[0]+a+h/2-50,c[1]-66,100,48,fill='white',stroke='none',rx=6);s.text(c[0]+a+h/2,c[1]-28,'10cm',38,ORANGE,weight=800);s.text(c[0],c[1]+a+50,'6cm',36) if False else s.text(c[0],c[1]+14,'6cm',38)
out.append(s.save('M1-C6-S2-DP2'))
s=S('半球の表面');s.heading('半球の表面 ＝ 曲面 ＋ 切り口の円')
s.add(f'<defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="3" fill="{ORANGE}"/></pattern><pattern id="hatch" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" stroke="{BLUE}" stroke-width="5"/></pattern></defs>')
cx,cy,r=560,560,320;s.path(f'M{cx-r} {cy} A{r} {r} 0 0 1 {cx+r} {cy} A{r} {r*0.3} 0 0 1 {cx-r} {cy}Z',fill='url(#hatch)',stroke=INK,sw=5);s.ellipse(cx,cy,r,r*0.3,fill='url(#dots)',stroke=INK,sw=5)
s.rect(1080,300,60,60,fill='url(#hatch)',stroke=INK,sw=3,rx=0);s.text(1160,345,'曲面（球の半分）',38,BLUE,'start');s.rect(1080,420,60,60,fill='url(#dots)',stroke=INK,sw=3,rx=0);s.text(1160,465,'切り口の円',38,ORANGE,'start');out.append(s.save('M1-C6-S2-DP3'))
s=S('立方体の上の近道');s.heading('2つの面を開いて まっすぐ');u=280;x0,y0=380,200
s.rect(x0,y0,u,u,fill='#e6eef8',stroke=INK,sw=4,rx=0);s.rect(x0+u,y0,u,u,fill='#d8e6f5',stroke=INK,sw=4,rx=0)
A=(x0,y0);G=(x0+2*u,y0+u);M=(x0+u,y0+u/2);s.line(*A,*G,ORANGE,7);label_pt(s,*A,'A',-30,-10,44);label_pt(s,*G,'G',30,40,44);label_pt(s,*M,'',0,0,44,ORANGE)
s.text(x0+u,y0-24,'B',44);s.text(x0+u,y0+u+50,'F',44);s.text(M[0]+30,M[1]-16,'BF の中点',36,ORANGE,'start');s.text(x0+u/2,y0+u+60,'面 ABFE',36);s.text(x0+1.5*u,y0+u+60,'面 BCGF',36)
s.text(800,820,'通る面を となり合わせに開いて、線分で結ぶ',40);out.append(s.save('M1-C6-S3-D01'))
s=S('この節の地図');s.heading('空間図形の利用 3つの考え方')
for k,(t,b,c) in enumerate([('表面の最短','展開図の上の線分',BLUE),('水の高さ','体積 ÷ 底面積',GREEN),('体積の比','円柱：球：円錐＝3：2：1',ORANGE)]):
    x=70+k*500;s.card(x,200,460,420,t,c);s.text(x+230,430,b,34,INK)
out.append(s.save('M1-C6-S3-DMAP'))
s=S('錐から柱へ水を移す');s.heading('円錐の水を 円柱へ');cone3(s,400,580,150,330,fill='#8ec1ec',down=True);s.text(400,660,'円錐の容器',38);s.text(400,170,'半径 4cm',34);s.line(580,250,580,580,INK,3);s.text(600,430,'高さ 6cm',34,INK,'start')
s.arrow(700,330,920,450,BLUE,8);cylinder3(s,1150,700,150,330,fill='#eef3f9',water=0.33);s.text(1150,560,'？',80,ORANGE,weight=900);s.text(1150,790,'円柱の容器（同じ半径）',38)
out.append(s.save('M1-C6-S3-DP1'))
s=S('体積と表面積の公式カード');s.heading('体積・表面積 早見表')
for k,(t,v,a,col) in enumerate([('柱','V ＝ Sh','側面積 ＋ 底面積×2',BLUE),('錐','V ＝ ⅓Sh','側面積 ＋ 底面積',PURPLE),('球','V ＝ ⁴⁄₃πr³','S ＝ 4πr²',GREEN)]):
    x=70+k*500;s.card(x,150,460,560,t,col);s.text(x+230,310,'体積',34);s.text(x+230,390,v,48,col,weight=800);s.text(x+230,500,'表面積',34);s.text(x+230,580,a,34,col,weight=800)
s.rect(400,740,800,90,fill='#fff7ec',stroke=PURPLE,sw=5);s.text(800,800,'円錐の側面積 ＝ π × 母線 × 半径',40,PURPLE,weight=800);out.append(s.save('M1-C6-REVIEW-E01'))
s=S('直方体の辺の位置関係');s.heading('辺 AB と ほかの辺');p=cuboid(s,360,660,150,4.4,2.6,3.2,lw=2,hidden=False,col=DIM)
s.line(*p['A'],*p['B'],INK,10)
for e in ('AD','AE','BC','BF'): s.line(*p[e[0]],*p[e[1]],RED,7)
for e in ('DC','EF','HG'): s.line(*p[e[0]],*p[e[1]],BLUE,7,'2 0') if True else None
for e in ('CG','DH','HE','FG'): s.line(*p[e[0]],*p[e[1]],ORANGE,7,'14 10')
for k,(t,c,d) in enumerate([('交わる',RED,None),('平行',BLUE,None),('ねじれの位置',ORANGE,'14 10')]): y=280+k*90;s.line(1180,y,1270,y,c,8,d);s.text(1290,y+14,t,40,c,'start',weight=800)
out.append(s.save('M1-C6-REVIEW-E02'))
s=S('円柱と円錐の容器');s.heading('円錐で くんで 円柱へ');cone3(s,420,570,150,330,fill='#8ec1ec',down=True);s.arrow(640,320,900,420,BLUE,8);cylinder3(s,1150,700,150,330,fill='#eef3f9')
s.text(420,620,'円錐（同じ底面・高さ）',36);s.text(1150,790,'円柱',36);s.text(1150,300,'何杯で いっぱい？',40,ORANGE,weight=800);out.append(s.save('M1-APP2-C6-CH'))
# ---- 6章の図の枠 ----
s=S('錐と柱');s.heading('錐と柱');
cone3(s,230,560,110,300);s.text(230,665,'円錐',36)
pr=oblique(380,560,130);b=[pr(0,0,0),pr(1.5,0,0),pr(.6,0,1.3)];ap=pr(.7,2.3,.4);s.poly([b[0],b[1],ap],fill='#f6dcb8',stroke=INK,sw=4);s.poly([b[1],b[2],ap],fill='#f2c48d',stroke=INK,sw=4);s.line(*b[2],*b[0],INK,3,'8 6');s.text(500,665,'三角錐',36)
pr=oblique(660,560,120);q=[pr(0,0,0),pr(1.6,0,0),pr(1.6,0,1.6),pr(0,0,1.6)];ap=pr(.8,2.5,.8);s.poly([q[0],q[1],ap],fill='#f6dcb8',stroke=INK,sw=4);s.poly([q[1],q[2],ap],fill='#f2c48d',stroke=INK,sw=4);s.line(*q[2],*q[3],INK,3,'8 6');s.line(*q[3],*q[0],INK,3,'8 6');s.line(*q[3],*ap,INK,3,'8 6');s.text(800,665,'四角錐',36)
s.text(*ap,'',10);s.text(ap[0]+30,ap[1],'頂点',32,RED,'start');s.text(q[1][0]-20,q[1][1]-120,'側面',32,BLUE,'end');s.text(q[0][0]+90,q[0][1]+34,'底面',30,GREEN)
pr=oblique(1020,560,130);t=[pr(0,0,0),pr(1.4,0,0),pr(.5,0,1.2)];tt=[pr(0,2,0),pr(1.4,2,0),pr(.5,2,1.2)];s.poly([t[0],t[1],tt[1],tt[0]],fill=SKY,stroke=INK,sw=4);s.poly([t[1],t[2],tt[2],tt[1]],fill='#a9cff0',stroke=INK,sw=4);s.poly(tt,fill='#cfe3f6',stroke=INK,sw=4);s.line(*t[2],*t[0],INK,3,'8 6');s.text(1130,665,'三角柱',36)
cylinder3(s,1430,560,90,260);s.text(1430,665,'円柱',36)
s.text(500,750,'錐：底面は1つ、側面は1つの頂点に集まる',38,BLUE);s.text(1280,750,'柱：底面が2つ',38,GREEN);out.append(s.save('M1-C6-S1-FIG01'))
s=S('展開図');s.heading('展開図：重なる辺に 同じ記号');
u=70;x,y=120,150
s.rect(x,y+u,3*u*1.2,u*1.6,fill=SKY,stroke=INK,sw=3,rx=0);[s.line(x+k*u*1.2,y+u,x+k*u*1.2,y+u+u*1.6,INK,3) for k in (1,2)]
s.poly([(x,y+u),(x+u*1.2,y+u),(x+u*.6,y)],fill='#f6dcb8',stroke=INK,sw=3);s.poly([(x,y+u+u*1.6),(x+u*1.2,y+u+u*1.6),(x+u*.6,y+2*u+u*1.6)],fill='#f6dcb8',stroke=INK,sw=3);s.text(x+u*3.6+40,y+u*2.4,'三角柱',36,INK,'start')
cx,cy=1100,300;a=80;s.rect(cx-a,cy-a,2*a,2*a,fill='#f6dcb8',stroke=INK,sw=3,rx=0)
for dx,dy in ((0,-1),(1,0),(0,1),(-1,0)): m=(cx+dx*a,cy+dy*a);tip=(cx+dx*(a+120),cy+dy*(a+120));nx,ny=-dy,dx;s.poly([(m[0]+nx*a,m[1]+ny*a),(m[0]-nx*a,m[1]-ny*a),tip],fill=SKY,stroke=INK,sw=3)
s.text(cx+330,cy+20,'四角錐',36)
netCx,netCy=150,570;w=2*math.pi*42;s.rect(netCx,netCy,w,110,fill=SKY,stroke=INK,sw=3,rx=0);s.circle(netCx+w/2,netCy-42,42,fill='#f6dcb8',stroke=INK,sw=3);s.circle(netCx+w/2,netCy+152,42,fill='#f6dcb8',stroke=INK,sw=3);s.line(netCx,netCy+110,netCx+w,netCy+110,ORANGE,7);s.text(netCx+w+40,netCy+70,'円柱：横＝円周',34,ORANGE,'start')
O=(1050,520);arc(s,*O,260,-120,-60,INK,3,fill='#e4d4f5',sector=True);arc(s,*O,260,-120,-60,ORANGE,7);s.circle(O[0],O[1]+260+44,44,fill='#f6dcb8',stroke=ORANGE,sw=7);s.text(O[0]+220,O[1]+200,'円錐：弧＝円周',34,ORANGE,'start')
out.append(s.save('M1-C6-S1-FIG02'))
s=S('辺ABとの位置関係');s.heading('辺 AB との位置関係');p=cuboid(s,360,660,150,4.4,2.6,3.2,lw=2,hidden=False,col=DIM);s.line(*p['A'],*p['B'],INK,10)
for e in ('AD','AE','BC','BF'): s.line(*p[e[0]],*p[e[1]],RED,10)
for e in ('DC','EF','HG'): s.line(*p[e[0]],*p[e[1]],BLUE,12);s.line(*p[e[0]],*p[e[1]],'white',4)
for e in ('CG','DH','HE','FG'): s.line(*p[e[0]],*p[e[1]],ORANGE,7,'14 10')
for k,(t,c,d,w) in enumerate([('交わる（太線）',RED,None,10),('平行（二重線）',BLUE,None,12),('ねじれ（点線）',ORANGE,'14 10',7)]):
    y=280+k*90;s.line(1150,y,1240,y,c,w,d);(s.line(1150,y,1240,y,'white',4) if k==1 else None);s.text(1260,y+14,t,36,c,'start',weight=800)
out.append(s.save('M1-C6-S1-FIG03'))
s=S('面が動いてできる立体');s.heading('面を回す・面を動かす');x0,y0=180,560
s.line(x0,140,x0,700,INK,3,'12 8');s.rect(x0,y0-300,200,300,fill='#f6dcb8',stroke=ORANGE,sw=5,rx=0);s.ellipse(x0,y0,200,60,stroke=BLUE,sw=3,dash='10 8');s.ellipse(x0,y0-300,200,60,stroke=BLUE,sw=3,dash='10 8');s.line(x0-200,y0-300,x0-200,y0,BLUE,3,'10 8');s.line(x0+200,y0-300,x0+200,y0,BLUE,3,'10 8')
s.text(x0+40,740,'長方形を回す → 円柱',36,BLUE)
pr=oblique(980,620,150);T=[pr(0,0,0),pr(1.6,0,0),pr(.6,1.4,0)]
for k in range(4):
    d=k*0.7;Q=[pr(x,y,d) for x,y,_ in [(0,0,0),(1.6,0,0),(.6,1.4,0)]];s.poly(Q,fill='#f6dcb8' if k==0 else 'none',stroke=ORANGE if k==0 else DIM,sw=4 if k==0 else 3,dash=None if k==0 else '10 8')
s.arrow(*pr(1.8,.2,0),*pr(1.8,.2,2.1),GREEN,6);s.text(1180,740,'三角形を平行移動 → 三角柱',36,GREEN);out.append(s.save('M1-C6-S1-FIG04'))
s=S('見取図・展開図・投影図');s.heading('同じ三角柱を 3通りで')
pr=oblique(150,560,120);t=[pr(0,0,0),pr(1.6,0,0),pr(.6,0,1.4)];tt=[pr(0,2,0),pr(1.6,2,0),pr(.6,2,1.4)];s.poly([t[0],t[1],tt[1],tt[0]],fill=SKY,stroke=INK,sw=4);s.poly([t[1],t[2],tt[2],tt[1]],fill='#a9cff0',stroke=INK,sw=4);s.poly(tt,fill='#cfe3f6',stroke=INK,sw=4);s.line(*t[2],*t[0],INK,3,'8 6')
s.text(290,640,'見取図',40,BLUE,weight=800);s.text(290,700,'形の全体がわかる',30)
u=70;x=560;y=250;s.rect(x,y+u,3*u,u*3,fill=SKY,stroke=INK,sw=3,rx=0);[s.line(x+k*u,y+u,x+k*u,y+4*u,INK,3) for k in (1,2)];s.poly([(x,y+u),(x+u,y+u),(x+u/2,y+u-60)],fill='#f6dcb8',stroke=INK,sw=3);s.poly([(x,y+4*u),(x+u,y+4*u),(x+u/2,y+4*u+60)],fill='#f6dcb8',stroke=INK,sw=3)
s.text(670,640,'展開図',40,BLUE,weight=800);s.text(670,700,'面の形と大きさ',30)
x=1080;s.rect(x,200,200,150,fill='none',stroke=INK,sw=4,rx=0);s.text(x+330,290,'立面図',30,INK,'start');s.text(x+330,500,'平面図',30,INK,'start');s.line(x,380,x+300,380,DIM,2,'8 6');s.poly([(x,420),(x+200,420),(x+80,560)],stroke=INK,sw=4)
s.text(1200,640,'投影図',40,BLUE,weight=800);s.text(1200,700,'真正面・真上の形',30);out.append(s.save('M1-C6-S1-FIG05'))
s=S('円錐3杯で円柱いっぱい');s.heading('円錐 3杯 ＝ 円柱 1杯')
for k in range(3): cylinder3(s,260+k*540,640,140,320,fill='#eef3f9',water=(k+1)/3);s.text(260+k*540,740,f'{k+1}杯目',40,ORANGE,weight=800)
out.append(s.save('M1-C6-S2-FIG01'))
s=S('柱の展開図');s.heading('側面は 1枚の長方形');x,y,u=110,330,60
for k,w in enumerate([3,2,3,2]): s.rect(x+sum([3,2,3,2][:k])*u,y,w*u,4*u,fill=SKY,stroke=INK,sw=3,rx=0)
s.rect(x,y-2*u,3*u,2*u,fill='#f6dcb8',stroke=INK,sw=3,rx=0);s.rect(x,y+4*u,3*u,2*u,fill='#f6dcb8',stroke=INK,sw=3,rx=0);s.line(x,y+4*u,x+10*u,y+4*u,ORANGE,7);s.text(x+5*u,y+4*u+180,'横 ＝ 底面のまわり',36,ORANGE)
w=2*math.pi*70;cx=980;s.rect(cx,y,w,4*u,fill=SKY,stroke=INK,sw=3,rx=0);s.circle(cx+w/2,y-70,70,fill='#f6dcb8',stroke=INK,sw=3);s.circle(cx+w/2,y+4*u+70,70,fill='#f6dcb8',stroke=INK,sw=3);s.line(cx,y+4*u,cx+w,y+4*u,ORANGE,7);s.text(cx+w/2,y+4*u+180,'横 ＝ 2πr',36,ORANGE)
s.text(310,170,'直方体',36);s.text(1200,170,'円柱',36);out.append(s.save('M1-C6-S2-FIG02'))
s=S('円錐の展開図');s.heading('おうぎ形の弧 ＝ 底面の円周');O=(600,170);R=420;th=120
arc(s,*O,R,-90-th/2,-90+th/2,INK,4,fill='#e4d4f5',sector=True);arc(s,*O,R,-90-th/2,-90+th/2,ORANGE,10);s.text(O[0]-300,O[1]+110,'ℓ（母線）',40,INK,'end')
s.circle(1200,560,140,fill='#f6dcb8',stroke=ORANGE,sw=10);s.line(1200,560,1340,560,INK,3);s.text(1270,545,'r',40);s.text(1200,760,'円周 2πr',38,ORANGE);s.text(O[0],O[1]+R+70,'弧 ＝ 2πr',38,ORANGE);out.append(s.save('M1-C6-S2-FIG03'))
s=S('紙コップの水');s.heading('円錐のコップから 円柱のコップへ');cone3(s,400,590,170,330,fill='#8ec1ec',down=True);s.text(400,660,'半径 6cm・高さ 9cm',36)
s.arrow(640,330,900,450,BLUE,8);cylinder3(s,1150,700,170,330,fill='#eef3f9',water=0.33);s.text(1150,560,'？',80,ORANGE,weight=900);s.text(1150,410,'水面の高さは？',38,ORANGE);s.text(1150,790,'同じ半径 6cm',36);out.append(s.save('M1-C6-S2-FIG04'))
s=S('ひもの最短');s.heading('中心角 60° → 正三角形');O=(800,140);R=560
arc(s,*O,R,-120,-60,INK,4,fill='#d8e6f5',sector=True);A=P(*O,R,-120);B=P(*O,R,-60);s.line(*A,*B,ORANGE,8);arc(s,*O,80,-120,-60,ORANGE,5);s.text(O[0],O[1]+130,'60°',40,ORANGE)
for p,q in ((O,A),(O,B),(A,B)): tick(s,*p,*q,1,RED)
label_pt(s,*O,'O',0,-20,40);s.text(A[0]-30,A[1]+20,'A',42,INK,'end');s.text(B[0]+30,B[1]+20,"A′",42,INK,'start');out.append(s.save('M1-C6-S3-FIG01'))
s=S('円柱・球・円錐の体積比');s.heading('体積の比 3：2：1');cylinder3(s,250,560,140,280);sphere3(s,600,420,140);cone3(s,950,560,140,280)
for k,(t,v,c) in enumerate([('円柱',3,BLUE),('球',2,GREEN),('円錐',1,PURPLE)]): y=280+k*120;s.text(1180,y+44,t,40,c,'start');s.rect(1290,y,v*80,70,fill=c,stroke=INK,sw=3,rx=6);s.text(1290+v*80+20,y+50,str(v),44,c,'start',weight=800)
s.text(600,720,'半径 3cm、高さ 6cm',38);out.append(s.save('M1-C6-S3-FIG02'))
print(len(out))
