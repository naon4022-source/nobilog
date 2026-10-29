from svgkit import *
def balance(s,cx,cy,L,R,tilt=0,scale=1,qmark=False):
    k=scale;s.poly([(cx,cy),(cx-40*k,cy+120*k),(cx+40*k,cy+120*k)],fill='#cfd8e3',stroke=INK,sw=4)
    dy=tilt*40*k;s.line(cx-180*k,cy+dy,cx+180*k,cy-dy,INK,8)
    for side,lab in ((-1,L),(1,R)):
        x=cx+side*180*k;y=cy-side*dy;s.line(x,y,x-50*k,y+70*k,INK,3);s.line(x,y,x+50*k,y+70*k,INK,3);s.path(f'M{x-80*k} {y+70*k} Q{x} {y+110*k} {x+80*k} {y+70*k}Z',fill=PALE,stroke=INK,sw=4)
        s.text(x,y+130*k,lab,40,INK)
    if qmark: s.text(cx,cy-30*k,'？',int(56*k),ORANGE,weight=900)
    return s
out=[]
# ---- 3章1節 ----
s=S('左辺と右辺を比べるはかり');s.heading('5−x と 3x＋13 を くらべる')
for k,v in enumerate(['x＝−2','x＝0','x＝2']):
    cx=290+k*510;balance(s,cx,330,'5−x','3x＋13',0,0.82,qmark=True);s.text(cx,240,v,48,BLUE,weight=800)
    s.text(cx,560,'左辺 ＝ □',40);s.text(cx,620,'右辺 ＝ □',40)
s.text(800,720,'つり合う（左辺＝右辺）x が、方程式の解',44,ORANGE);s.text(800,800,'□ に数を入れて、たしかめよう',40);out.append(s.save('M1-C3-S1-D01'))
s=S('反対の計算の早見表');s.heading('反対の計算で x を ひとりにする')
rows=[('x−8＝−3','−8','両辺に ＋8'),('x＋15＝6','＋15','両辺に −15'),('x/6＝−2','÷6','両辺に ×6'),('−9x＝63','×(−9)','両辺を ÷(−9)')]
s.rect(80,150,1440,90,fill=BLUE,stroke='none',rx=16)
for x,t in ((300,'方程式'),(700,'x についている計算'),(1080,'反対の計算'),(1380,'答え')): s.text(x,210,t,40,'white',weight=800)
for k,(a,b,c) in enumerate(rows):
    y=255+k*140;s.rect(80,y,1440,125,fill='white',stroke='#c9d6e8',sw=3,rx=14);s.text(300,y+80,a,46);s.text(700,y+80,b,46,RED);s.text(1080,y+80,c,44,GREEN);s.rect(1290,y+25,180,75,fill=PALE,stroke=DIM,sw=3,rx=12,dash='10 8');s.text(1380,y+80,'x＝',40,DIM)
out.append(s.save('M1-C3-S1-D02'))
s=S('移項と等式の性質の対応');s.heading('5x−7＝18 を 2つの方法で')
s.card(90,140,680,560,'等式の性質',BLUE);s.card(830,140,680,560,'移項',ORANGE)
L=['5x−7＝18','5x−7＋7＝18＋7','5x＝25'];R=['5x−7＝18','5x＝18＋7','5x＝25']
for k in range(3):
    y=290+k*165;s.text(430,y,L[k],46);s.text(1170,y,R[k],46)
    if k<2: s.arrow(250,y+30,250,y+100,BLUE,5);s.arrow(990,y+30,990,y+100,ORANGE,5)
s.text(270,290+95,'両辺に ＋7',36,BLUE,'start');s.text(1010,290+95,'−7 を移すと ＋7',36,ORANGE,'start')
s.rect(250,740,1100,90,fill='#fff7ec',stroke=ORANGE,sw=4,rx=18);s.text(800,800,'同じ行は同じ式になる → 移項は等式の性質の近道',40,INK);out.append(s.save('M1-C3-S1-D03'))
s=S('どれから手をつける？の流れ図');s.heading('方程式は この順に 整える')
steps=[('分数がある？','分母をはらう（最小公倍数をかける）'),('小数がある？','10倍・100倍する'),('かっこがある？','かっこを外す'),(None,'移項して ax＝b にする'),(None,'両辺を a でわる')]
y=140
for k,(q,a) in enumerate(steps):
    if q: s.rect(90,y,380,96,fill='#fff7ec',stroke=ORANGE,sw=4,rx=48);s.text(280,y+62,q,40,ORANGE);s.arrow(480,y+48,600,y+48,ORANGE,5);s.text(540,y+30,'はい',30,ORANGE)
    s.rect(620,y,880,96,fill='white',stroke=BLUE,sw=4,rx=16);s.text(1060,y+62,a,40)
    if k<4: s.arrow(1060,y+100,1060,y+136,BLUE,5)
    if q: s.path(f'M280 {y+100} L280 {y+136}',stroke=DIM,sw=4,dash='10 8');s.text(320,y+128,'いいえ',30,DIM,'start')
    y+=140
out.append(s.save('M1-C3-S1-D04'))
def ratio_rects(s,ttl,note):
    s.heading(ttl);u=40;x=120
    for k,(a,b) in enumerate([(2,5),(4,10),(6,15)]):
        w=b*u;h=a*u;y=560-h;s.rect(x,y,w,h,fill=SKY,stroke=INK,sw=4,rx=4)
        s.text(x+w/2,605,f'横 {b}',40);s.text(x+w/2,y+h/2+15,f'たて {a}',36 if k==0 else 40,INK)
        s.text(x+w/2,y-28,f'{a}：{b}',48,BLUE,weight=800);x+=w+80
    s.text(800,700,note,42,ORANGE);return s
s=S('比の値と比例式');ratio_rects(s,'同じ形の長方形','どれも同じ形 → 2：5 ＝ 4：10 ＝ 6：15');s.text(800,790,'比の値は どれも 2/5',40);out.append(s.save('M1-C3-S1-D05'))
s=S('比の値と比例式');ratio_rects(s,'比の値が等しい','たて÷横 ＝ 2/5 が どれも同じ');s.text(800,790,'2：5 ＝ 4：10 のような式を 比例式 という',40);out.append(s.save('M1-C3-S1-E01'))
s=S('分数・小数・かっこを整える');s.heading('係数を整数に そろえる')
s.card(70,150,700,600,'分数 → ×12',BLUE);s.card(830,150,700,600,'小数 → ×10',ORANGE)
s.text(420,330,'(x＋1)/4 ＝ (2/3)x − 1',44);s.text(420,420,'×12   ×12   ×12',38,BLUE);s.arrow(420,450,420,520,BLUE,6);s.text(420,600,'3(x＋1) ＝ 8x − 12',46);s.text(420,690,'すべての項にかける',36,BLUE)
s.text(1180,330,'0.6x − 1.5 ＝ 0.1x ＋ 1',44);s.text(1180,420,'×10  ×10   ×10  ×10',38,ORANGE);s.arrow(1180,450,1180,520,ORANGE,6);s.text(1180,600,'6x − 15 ＝ x ＋ 10',46);s.text(1180,690,'整数だけの式になる',36,ORANGE)
out.append(s.save('M1-C3-S1-E02'))
s=S('まちがいと正しい考え方');s.mistake(['方程式 2x＋1＝7 で','x＝3 を入れて','左辺 ＝ 7 だけ計算','「7 になったから解」'],None,mark=3,steps=['左辺 ＝ 2×3＋1 ＝ 7','右辺 ＝ 7','左辺 ＝ 右辺 → 解'],note='左辺と右辺の両方を計算して、等しいかを見る');out.append(s.save('M1-C3-S1-M01'))
s=S('まちがいと正しい考え方');s.mistake(['x − 8 ＝ −3','両辺から 8 をひく','x ＝ −11'],None,mark=1,steps=['x のとなりは −8','反対の計算は ＋8','x ＝ −3 ＋ 8'],note='「反対の計算」をすると x がひとりになる');out.append(s.save('M1-C3-S1-M02'))
s=S('まちがいと正しい考え方');s.mistake(['6x＋5＝2x−11','6x−2x＝−11＋5'],None,mark=1,steps=['＋5 を右辺へ移す','符号が変わって −5','6x−2x＝−11−5'],note='移項すると、符号が変わる');out.append(s.save('M1-C3-S1-M03'))
s=S('まちがいと正しい考え方');s.mistake(['(x＋1)/4＝(2/3)x−1','×12 して','3(x＋1)＝8x−1'],None,mark=2,steps=['−1 にも 12 をかける','−1 × 12 ＝ −12','3(x＋1)＝8x−12'],note='分母をはらうときは、すべての項にかける');out.append(s.save('M1-C3-S1-M04'))
s=S('まちがいと正しい考え方');s.mistake(['x：10 ＝ 2：5','2x ＝ 50'],None,mark=1,steps=['外側どうし：x と 5','内側どうし：10 と 2','5x ＝ 10 × 2'],note='a：b＝c：d なら ad＝bc（外側×外側＝内側×内側）');out.append(s.save('M1-C3-S1-M05'))
s=S('この節の地図');s.heading('方程式の解き方の地図')
rooms=[('整える','分数・小数・かっこ',BLUE),('集める','移項して ax＝b',ORANGE),('わる','両辺を a でわる',GREEN),('確かめる','もとの式に入れる',PURPLE)]
for k,(a,b,c) in enumerate(rooms):
    x=70+k*380;s.card(x,230,330,330,f'{k+1}. {a}',c);s.text(x+165,420,b,34)
    if k<3: s.arrow(x+340,395,x+372,395,INK,6)
s.text(800,680,'等式の性質（両辺に同じ計算をしても等式は成り立つ）が土台',40);s.text(800,760,'比例式 a：b＝c：d は ad＝bc で1次方程式になる',40,ORANGE);out.append(s.save('M1-C3-S1-DMAP'))
# ---- 3章2節 ----
s=S('ことばの式から方程式へ');s.heading('ことばの式に 数や式をはめる')
for k,(t,c) in enumerate([('払った額',BLUE),('代金',ORANGE),('おつり',GREEN)]):
    x=150+k*470;s.rect(x,190,380,110,fill=PALE,stroke=c,sw=5);s.text(x+190,262,t,46,c)
for x,t in ((570,'−'),(1040,'＝')): s.text(x,265,t,60)
for k,(t,c) in enumerate([('1000',BLUE),('(4x＋150)',ORANGE),('90',GREEN)]):
    x=150+k*470;s.arrow(x+190,320,x+190,420,c,6);s.rect(x+30,440,320,120,fill='white',stroke=c,sw=6);s.text(x+190,520,t,52,c)
for x,t in ((570,'−'),(1040,'＝')): s.text(x,520,t,60)
s.text(800,690,'1000 − (4x＋150) ＝ 90',56,INK,weight=800);s.text(800,790,'かっこをつけて、代金をひとまとまりにする',40);out.append(s.save('M1-C3-S2-D01'))
s=S('割合を帯で表す');s.heading('女子の 80％ より 8人多い')
u=3.2;y1,y2=260,460
s.rect(200,y1,100*u*1.25*0.8+0.0,90,fill=SKY,stroke=INK,sw=4,rx=6)
W=500;s.rect(200,y1,W,90,fill=SKY,stroke=INK,sw=4,rx=6);s.text(200+W/2,y1+60,'女子 x 人',44);s.text(150,y1+60,'女子',36,INK,'end')
w2=W*0.8;s.rect(200,y2,w2,90,fill='#f2c48d',stroke=INK,sw=4,rx=6);s.rect(200+w2,y2,120,90,fill='#f6dcb8',stroke=INK,sw=4,rx=6,dash='10 6');s.text(200+w2/2,y2+60,'0.8x 人',44);s.text(200+w2+60,y2+60,'8人',40);s.text(150,y2+60,'男子',36,INK,'end')
s.line(200+w2,y1+95,200+w2,y2-5,DIM,3,'8 8');s.text(200+w2+10,y1+150,'女子の 0.8倍',34,ORANGE,'start')
s.path(f'M1000 {y1} Q1060 {y1} 1060 {(y1+y2+90)/2-30} L1090 {(y1+y2+90)/2} L1060 {(y1+y2+90)/2+30} Q1060 {y2+90} 1000 {y2+90}',stroke=BLUE,sw=5)
s.text(1120,(y1+y2+90)/2+16,'合わせて 170人',46,BLUE,'start',800);s.text(800,720,'x ＋ (0.8x ＋ 8) ＝ 170',52,INK,weight=800);out.append(s.save('M1-C3-S2-D02'))
s=S('同じ数ずつ加える比');s.heading('A と B に 同じ数ずつ 加える')
for k,(lab,n) in enumerate([('箱A',30),('箱B',18)]):
    x=180+k*700;s.rect(x,200,560,400,fill='white',stroke=INK,sw=5,rx=12);s.text(x+280,180,lab,46,BLUE,weight=800)
    for j in range(n):
        cx=x+50+(j%10)*52;cy=260+(j//10)*52;s.circle(cx,cy,20,fill=SKY,stroke=INK,sw=2)
    s.rect(x+30,440,500,130,fill='#fff7ec',stroke=ORANGE,sw=4,rx=14,dash='12 8');s.text(x+280,520,'＋ x 個',48,ORANGE,weight=800)
    s.text(x+280,650,f'{n} ＋ x',48)
s.text(800,780,'どちらにも 同じ x 個 → (30＋x)：(18＋x)',44,INK);out.append(s.save('M1-C3-S2-D03'))
s=S('この節の地図');s.heading('「等しい関係」の見つけ方')
cards=[('代金','払った額−代金＝おつり',BLUE),('過不足','配り方を変えても全体は同じ',ORANGE),('速さ','追いつく → 道のりが等しい',GREEN),('割合','全体＝部分の合計',PURPLE),('比例式','比が等しい → ad＝bc',RED)]
for k,(a,b,c) in enumerate(cards):
    x=60+(k%3)*510;y=160+(k//3)*320;s.card(x,y,470,270,a,c);s.text(x+235,y+180,b,32)
s.card(1080,480,470,270,'手順',INK);s.lines(1315,600,['① x を決める','② 式にする','③ 解いて確かめる'],32,gap=46);out.append(s.save('M1-C3-S2-DMAP'))
s=S('まちがいと正しい考え方');s.mistake(['1人8枚ずつだと','9枚 足りない','全体 ＝ 8x ＋ 9'],None,mark=2,steps=['足りない → 配る数より少ない','全体 ＝ 8x − 9','線分図で確かめる'],note='「余る」は＋、「足りない」は−');out.append(s.save('M1-C3-S2-M01'))
s=S('まちがいと正しい考え方');s.mistake(['妹が15分前に出発','妹の時間を x 分','姉の時間を 15＋x 分'],None,mark=2,steps=['先に出たのは妹','妹の方が 15分長い','姉 x 分、妹 15＋x 分'],note='先に出発した人の時間が長い');out.append(s.save('M1-C3-S2-M02'))
s=S('まちがいと正しい考え方');s.mistake(['A から B へ x mL 移す','A：500 ＋ x','B：300 ＋ x'],None,mark=1,steps=['取り出した A は −x','入れた B は ＋x','(500−x)：(300＋x)'],note='移すときは、片方がへって、片方がふえる');out.append(s.save('M1-C3-S2-M03'))
# ---- 3章 章末 ----
s=S('答えの意味を考える');s.heading('答えが負の数のとき');X=s.numline(160,1440,420,-5,5,1)
s.text(X(0),330,'今',44,BLUE,weight=800);s.arrow(X(0),360,X(0),395,BLUE,5);s.text(X(3.5),330,'未来 →',40,GREEN);s.text(X(-3.5),330,'← 過去',40,PURPLE)
s.path(f'M{X(0)} 470 Q{X(-1)} 560 {X(-2)} 470',stroke=ORANGE,sw=6);s.arrow(X(-1.9),495,X(-2),470,ORANGE,6,20);s.text(X(-1),600,'−2年後 ＝ 2年前',44,ORANGE,weight=800)
s.text(800,760,'x を「年後」と決めたら、負の答えは「年前」と読みかえる',40);out.append(s.save('M1-C3-REVIEW-E01'))
s=S('方程式の解き方チェックリスト');s.heading('文章題 4つのステップ')
icons=['✏️','⚖️','➡️','🔍']
for k,t in enumerate(['x を決める（何を x にするか書く）','等しい関係を式にする','移項して解く','答えを問題文にもどして確かめる']):
    y=140+k*175;s.rect(220,y,1160,135,fill='white',stroke=BLUE,sw=5);s.circle(310,y+67,48,fill=PALE,stroke=BLUE,sw=4);s.text(310,y+86,str(k+1),52,BLUE,weight=900);s.text(860,y+84,t,44);s.text(1300,y+88,icons[k],48)
    if k<3: s.arrow(800,y+140,800,y+170,BLUE,6)
out.append(s.save('M1-C3-REVIEW-E02'))
s=S('まちがえやすい所の地図');s.heading('方程式の まちがえやすい所')
pairs=[('移項で符号そのまま','移すと符号が変わる'),('かっこの後ろだけにかける','かっこの中の全部にかける'),('分母をはらうとき1項かけ忘れ','すべての項にかける'),('答えを確かめない','もとの式・問題文に入れる')]
s.text(500,175,'✗ のれい',44,RED,weight=800);s.text(1150,175,'○ なおし方',44,GREEN,weight=800)
for k,(a,b) in enumerate(pairs):
    y=210+k*150;s.rect(150,y,700,120,fill='white',stroke=RED,sw=4,dash='12 8');s.text(500,y+76,a,38);s.arrow(860,y+60,920,y+60,INK,5);s.rect(930,y,520,120,fill='#edf5ef',stroke=GREEN,sw=4);s.text(1190,y+76,b,38)
out.append(s.save('M1-C3-REVIEW-E03'))
s=S('文章題の図のかき方');s.heading('問題に合った図を えらぶ')
for k,(q,fig,c) in enumerate([('過不足','線分図',BLUE),('速さ','表',ORANGE),('等しい関係','天びん',GREEN)]):
    y=170+k*220;s.rect(120,y,360,140,fill=PALE,stroke=c,sw=5);s.text(300,y+88,q,48,c,weight=800);s.arrow(500,y+70,700,y+70,c,6);s.rect(720,y,760,170,fill='white',stroke=c,sw=4)
    if k==0: s.rect(780,y+40,420,40,fill=SKY,stroke=INK,sw=3,rx=4);s.rect(1200,y+40,120,40,fill='#f6dcb8',stroke=INK,sw=3,rx=4);s.rect(780,y+100,560,40,fill=SKY,stroke=INK,sw=3,rx=4,dash='10 6')
    if k==1:
        for i,t in enumerate(['','速さ','時間','道のり']): s.rect(760+i*170,y+30,170,55,fill=PALE if i==0 or True else 'white',stroke=INK,sw=2,rx=0);s.text(845+i*170,y+70,t,32)
        for i in range(4): s.rect(760+i*170,y+85,170,55,fill='white',stroke=INK,sw=2,rx=0)
    if k==2: balance(s,1100,y+30,'','',0,0.6)
out.append(s.save('M1-C3-REVIEW-E04'))
s=S('解を代入する');s.heading('解を代入して a を求める')
parts=[(470,'3',None),(560,'x','box'),(660,'−',None),(740,'a',None),(830,'＝',None),(920,'2',None),(1010,'x','box'),(1110,'＋',None),(1190,'5',None)]
for x,t,k in parts:
    s.text(x,300,t,80,ORANGE if k else INK,weight=800,**({'font_style':'italic'} if t in 'xa' else {}))
    if k: s.rect(x-50,205,100,125,fill='none',stroke=ORANGE,sw=6,rx=14,dash='12 8');s.rect(x-42,430,84,90,fill='#fff7ec',stroke=ORANGE,sw=5,rx=12);s.text(x,495,'4',58,ORANGE,weight=900);s.arrow(x,425,x,345,ORANGE,6)
s.text(800,640,'x の場所に 4 を入れると、a だけの式になる',44);s.text(800,740,'3 × 4 − a ＝ 2 × 4 ＋ 5',52,BLUE);out.append(s.save('M1-APP2-C3-CH'))
print(len(out))
