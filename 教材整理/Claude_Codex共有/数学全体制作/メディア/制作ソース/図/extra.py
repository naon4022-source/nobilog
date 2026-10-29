from svgkit import *
import math
out=[]
# 1章1節：数のなかま分け
s=S('数のなかま分け');s.heading('数を「正・0・負」と「整数か」で分ける')
cols=[('負の数',RED),('0',INK),('正の数',BLUE)];rows=['整数','整数でない']
x0,y0,cw,rh=300,200,400,200
for j,(c,col) in enumerate(cols): s.rect(x0+j*cw,y0-80,cw,80,fill='#e3e9f1',stroke=INK,sw=2,rx=0);s.text(x0+j*cw+cw/2,y0-26,c,40,col,weight=800)
for i,r in enumerate(rows): s.rect(x0-260,y0+i*rh,260,rh,fill='#e3e9f1',stroke=INK,sw=2,rx=0);s.text(x0-130,y0+i*rh+rh/2+14,r,36)
cells={(0,0):'−4、−1',(0,1):'0',(0,2):'+2、5',(1,0):'−0.5、−⅓',(1,1):'（なし）',(1,2):'0.5、⅓'}
for (i,j),t in cells.items(): s.rect(x0+j*cw,y0+i*rh,cw,rh,fill='white',stroke=INK,sw=2,rx=0);s.text(x0+j*cw+cw/2,y0+i*rh+rh/2+14,t,40,DIM if t=='（なし）' else INK)
s.rect(x0+2*cw+8,y0+8,cw-16,rh-16,fill='none',stroke=GREEN,sw=6,rx=14,dash='14 10');s.text(x0+2*cw+cw/2,y0+rh-24,'自然数',32,GREEN,weight=800)
s.text(800,720,'自然数 ＝ 正の整数（0 は入らない）',38,GREEN);s.text(800,790,'+6/3 は 2 と同じなので 整数',32,DIM);out.append(s.save('M1-C1-S1-D07'))
# 1章2節：(−3)⁴ と −3⁴
s=S('かっこのある累乗');s.heading('(−3)⁴ と −3⁴ は ちがう')
s.card(60,170,700,600,'(−3)⁴',BLUE);s.text(410,330,'(−3)×(−3)×(−3)×(−3)',40);s.text(410,440,'−3 を 4回かける',34,BLUE);s.text(410,600,'＝ 81',70,BLUE,weight=900)
s.card(840,170,700,600,'−3⁴',ORANGE);s.text(1190,330,'−( 3×3×3×3 )',44);s.text(1190,440,'3 だけを 4回かける',34,ORANGE);s.text(1190,600,'＝ −81',70,ORANGE,weight=900)
assert (-3)**4==81 and -(3**4)==-81
s.text(800,840,'指数は すぐ左の数（かっこがあれば かっこ全体）にかかる',34);out.append(s.save('M1-C1-S2-D11'))
# 2章2節：等式と不等式
s=S('等式と不等式');s.heading('等号・不等号で 関係を表す')
s.rect(160,200,1280,170,fill='white',stroke=BLUE,sw=5);s.text(500,310,'4x ＋ 3',64,INK,weight=800);s.text(800,310,'＝',64,BLUE,weight=900);s.text(1100,310,'y',64,INK,weight=800,font_style='italic')
s.text(500,430,'左辺',38,BLUE);s.text(1100,430,'右辺',38,BLUE);s.line(400,460,1200,460,BLUE,3);s.line(400,450,400,470,BLUE,3);s.line(1200,450,1200,470,BLUE,3);s.text(800,510,'両辺',38,BLUE)
for k,(sym,t) in enumerate((('a ＞ b','a は b より大きい'),('a ＜ b','a は b より小さい（未満）'),('a ≧ b','a は b 以上'),('a ≦ b','a は b 以下'))):
    x=100+k*360;s.rect(x,580,330,200,fill='#fff7ec',stroke=ORANGE,sw=4);s.text(x+165,660,sym,48,ORANGE,weight=800);s.text(x+165,730,t,26)
s.text(800,850,'以上・以下は「＝」をふくむ',34,ORANGE);out.append(s.save('M1-C2-S2-D06'))
# 3章1節：分母をはらう
s=S('分母をはらう');s.heading('両辺に 分母の最小公倍数をかける')
s.text(800,270,'x/2 ＋ x/3 ＝ 5',64,INK,weight=800)
s.arrow(800,310,800,420,ORANGE,7);s.text(830,380,'両辺 × 6',40,ORANGE,'start',weight=800)
s.text(800,520,'6×(x/2) ＋ 6×(x/3) ＝ 6×5',48)
s.arrow(800,560,800,640,ORANGE,7);s.text(800,730,'3x ＋ 2x ＝ 30',64,BLUE,weight=900)
s.rect(1150,170,400,170,fill='white',stroke=RED,sw=4);s.text(1350,240,'整数の項 5 にも',32,RED);s.text(1350,290,'6 をかける',32,RED)
s.text(800,850,'分数がなくなれば、いつもの方程式',34);out.append(s.save('M1-C3-S1-D06'))
# 3章のまとめ：2通りの文字の置き方
s=S('行きと帰りの道のり');s.heading('同じ道のりを 2通りの見方で')
y1,y2=310,660;s.text(180,y1+14,'家',44,INK,'end');s.text(1420,y1+14,'図書館',44,INK,'start')
s.arrow(220,y1,1390,y1,BLUE,8);s.text(805,y1-40,'行き：分速 60m',40,BLUE,weight=800);s.text(805,y1+70,'(t＋10) 分',38,BLUE)
s.arrow(1390,y2,220,y2,ORANGE,8);s.text(805,y2-40,'帰り：分速 90m',40,ORANGE,weight=800);s.text(805,y2+70,'t 分',38,ORANGE)
s.line(220,y1+130,220,y2-110,DIM,3,'10 8');s.line(1390,y1+130,1390,y2-110,DIM,3,'10 8');s.text(805,(y1+y2)/2+20,'道のりは 同じ',38,GREEN,weight=800)
s.text(800,820,'方法1：道のりを x　方法2：帰りの時間を t → 同じ答えになるか確かめる',32);out.append(s.save('M1-C3-REVIEW-FIG01'))
# 4章3節：反比例のグラフのつまずき
s=S('反比例のグラフのかき方');s.heading('点は なめらかな曲線で結ぶ')
for k,(t,ok,c) in enumerate((('まちがい：折れ線',False,RED),('正しい：なめらかな曲線',True,GREEN))):
    X,Y=chart(s,140+k*760,760,560,520,0,7,0,7,list(range(0,8)),list(range(0,8)),'x','y',26)
    pts=[(1,6),(2,3),(3,2),(6,1)]
    if ok: plot(s,X,Y,lambda x:6/x,0.86,7,c,6)
    else: s.poly([(X(a),Y(b)) for a,b in pts],stroke=c,sw=6,close=False);s.line(X(6),Y(1),X(7),Y(0),c,6)
    for a,b in pts: dot(s,X(a),Y(b),11,INK)
    s.text(140+k*760+280,170,t,38,c,weight=800)
s.text(1180,330,'軸には くっつかない',32,GREEN);s.text(420,330,'軸に くっつけない',32,RED);out.append(s.save('M1-C4-S3-D03'))
# 7章1節：範囲
s=S('範囲＝最大値−最小値');s.heading('範囲 ＝ 最大値 − 最小値');A=[4.2,5.8,6.1,6.5,7.0,7.3,7.4,7.8,8.1,8.2,8.5,8.6,8.9,9.0,9.4,9.7,10.2,10.8,11.5,12.6]
X=lambda v:160+(v-4)*140;s.line(X(4),560,X(14),560,INK,4)
for v in range(4,15): s.line(X(v),548,X(v),572,INK,3);s.text(X(v),615,str(v),32)
from collections import Counter
for k,v in enumerate(A):
    st=sum(1 for w in A[:k] if abs(w-v)<0.35);dot(s,X(v),520-st*34,12,BLUE)
dot(s,X(4.2),520,16,ORANGE);dot(s,X(12.6),520,16,ORANGE);s.text(X(4.2),460,'最小値 4.2',32,ORANGE);s.text(X(12.6),460,'最大値 12.6',32,ORANGE)
s.arrow(X(4.2)+6,700,X(12.6)-6,700,GREEN,6);s.arrow(X(12.6)-6,700,X(4.2)+6,700,GREEN,6);s.text((X(4.2)+X(12.6))/2,760,'範囲 12.6 − 4.2 ＝ 8.4（m）',40,GREEN,weight=800)
assert round(max(A)-min(A),1)==8.4;out.append(s.save('M1-C7-S1-FIG05'))
# 巻末1：1あたりでくらべる
s=S('1あたりでくらべる');s.heading('速さも 割合も「わり算で 1あたり」')
s.card(60,170,700,600,'速さ',BLUE);s.text(410,320,'道のり ÷ 時間',48,INK,weight=800);s.text(410,400,'＝ 1分（1時間）あたりの道のり',30,BLUE)
for k in range(5): s.rect(130+k*112,500,100,90,fill=SKY if k==0 else '#e6eef8',stroke=INK,sw=2,rx=6);s.text(180+k*112,555,'1分',26)
s.text(410,660,'1つ分の道のりでくらべる',32)
s.card(840,170,700,600,'割合',ORANGE);s.text(1190,320,'くらべる量 ÷ もとにする量',40,INK,weight=800);s.text(1190,400,'＝ もとにする量を 1 とみた大きさ',30,ORANGE)
s.rect(920,500,400,70,fill='#f6dcb8',stroke=INK,sw=2,rx=0);s.text(1120,546,'1',34);s.rect(920,590,520,70,fill='#f2c48d',stroke=INK,sw=2,rx=0);s.text(1180,636,'1.3',34)
s.text(1190,720,'1 にあたる量でくらべる',32);out.append(s.save('M1-APP1-D01'))
print(len(out))
