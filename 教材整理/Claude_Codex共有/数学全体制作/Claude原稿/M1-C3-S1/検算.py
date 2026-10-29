# M1-C3-S1 の検算：一次方程式は、左辺−右辺 を x の1次式とみて解き、さらに代入して確かめる。
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print('NG',n,g,w)
def solve(f):
    # f(x)=左辺−右辺 が一次式であることを仮定して解く
    a=f(F(1))-f(F(0)); b=f(F(0))
    assert f(F(2))==2*a+b, '一次式でない'
    x=-b/a; assert f(x)==0; return x
eqs={
 'P123':(lambda x:x+30-80,50),
 '例1-1 解?':(lambda x:3*x-5-(x+3),4),
 '例1-2':(lambda x:5-x-(3*x+13),-2),
 '例2-1':(lambda x:x-8-(-3),5),'例2-2':(lambda x:x+15-6,-9),'例2-3':(lambda x:x/6-(-2),-12),'例2-4':(lambda x:-9*x-63,-7),
 '例2応用':(lambda x:F(3,4)*x-(-9),-12),
 '確認1-1':(lambda x:4*x+9-(x+6),-1),'確認1-2':(lambda x:7-2*x-(x-2),3),
 '確認2-1':(lambda x:x+F('2.5')-1,F('-1.5')),'確認2-2':(lambda x:-x/3-4,-12),'確認2-3':(lambda x:10*x-(-4),F(-2,5)),
 '例3-1':(lambda x:5*x-7-18,5),'例3-2':(lambda x:4*x-(7*x-9),3),'例3-3':(lambda x:6*x+5-(2*x-11),-4),
 '確認3-1':(lambda x:9-2*x-15,-3),'確認3-2':(lambda x:8*x-3-(5*x+12),5),'確認3-3':(lambda x:2*x+6-(-x-9),-5),
 '例4-1':(lambda x:4*(x+3)-(x-6),-6),'例4-2':(lambda x:(x+1)/4-(F(2,3)*x-1),3),'例4-3':(lambda x:F('0.6')*x-F('1.5')-(F('0.1')*x+1),5),
 '例4-4':(lambda x:(2*x-1)/3-(x-2)/2-1,2),
 '確認4-1':(lambda x:5-2*(x-4)-(3*x+3),2),'確認4-2':(lambda x:x/2+1-(x+7)/5,F(4,3)),'確認4-3':(lambda x:F('0.05')*x-F('0.2')-(F('0.15')*x+F('0.3')),-5),
 '例5-1':(lambda x:5*x-10*2,4),'例5-2':(lambda x:14*3-7*x,6),'例5-3':(lambda x:5*(x-2)-3*x,5),
 '確認5-1':(lambda x:6*12-9*x,8),'確認5-2':(lambda x:4*x-(x+6),2),
 'P144':(lambda x:3*x+20-(x+60),20),
 'Q2':(lambda x:x+9-4,-5),'Q3':(lambda x:x/5+4,-20),'Q4':(lambda x:-6*x+42,7),'Q5':(lambda x:3*x+8+7,-5),
 'Q6':(lambda x:11-4*x-(2*x-1),2),'Q7':(lambda x:2*(3*x-1)-(4*x+10),6),'Q8':(lambda x:(x-3)/2-x/5,5),
 'Q9':(lambda x:F('0.4')*x+F('1.2')-(F('0.9')*x-F('0.3')),3),'Q10':(lambda x:7*x-21*4,12),
 'Q11':(lambda x:F(2,3)*x-F(1,2)-(F(1,4)*x+2),6),'Q12':(lambda x:3*(x+2)-5*(2*x-1)+3,2),'Q13':(lambda x:3*(x+1)-5*(x-3),9),
 '導入170x=850':(lambda x:170*x-850,5),
}
for n,(f,w) in eqs.items(): check(n,solve(f),F(w))
# 確認1と例題1-標準の候補判定
check('Q1',[c for c in (-3,1,3) if 2*c+5==11],[3])
check('例1-2候補',[c for c in (-2,0,2) if 5-c==3*c+13],[-2])
# □・a の逆算
check('例1応用□',(5*3-4)-2*3,5)
check('Q14 a',4*(-2)-(2*(-2)+7),-11)
# 誤答例が本当に誤り
check('誤Q5',solve(lambda x:3*x-8+7),F(1,3))
check('誤Q6',solve(lambda x:-4*x+2*x-(-1-11)),6)
check('誤Q7',solve(lambda x:6*x-1-(4*x+10)),F(11,2))
check('誤Q8',solve(lambda x:5*x-3-2*x),1)
check('誤Q10',solve(lambda x:4*x-21*7),F(147,4))
check('誤Q11',solve(lambda x:8*x-6-(3*x+2)),F(8,5))
check('誤Q12',solve(lambda x:3*x+6-10*x-5+3),F(4,7))
check('誤Q13',solve(lambda x:3*x+1-(5*x-3)),2)
print(f'検算 {ok}件 成功 / {ng}件 失敗'); raise SystemExit(1 if ng else 0)
