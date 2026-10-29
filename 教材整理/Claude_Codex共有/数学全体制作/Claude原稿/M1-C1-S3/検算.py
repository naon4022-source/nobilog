# M1-C1-S3 の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print('NG',n,g,w)
def avg(xs): return sum(F(str(x)) for x in xs)/len(xs)
def kari(xs,b): b=F(str(b)); return b+sum(F(str(x))-b for x in xs)/len(xs)
for name,xs,b,w in (('例1基本',[18,23,20,17,27],20,21),('例1標準',[2.4,2.1,2.7,2.2,2.6,1.8],2.4,F('2.3')),('や1',[63,58,70,61],60,63),
                    ('Q2',[47,52,45,50,56],50,50),('Q4',[1.2,0.9,1.5,1.0],1.0,F('1.15'))):
    check(name,(kari(xs,b),avg(xs)),(w,w))
check('例1応用',1*4-(4-6+1),5)
check('Q1',73-80,-7)
check('Q3',140+F(-8+3+11-2,4),141)
check('Q5',1*4-(5-2-7),8)
check('Q6',(kari([47,52,45,50,56],50),kari([47,52,45,50,56],45)),(50,50))
check('FIG01',[x-20 for x in [18,23,20,17,27]],[-2,3,0,-3,7])
check('確認1-2',70+F(-15,5),67)
print(f'検算 {ok}件 成功 / {ng}件 失敗'); raise SystemExit(1 if ng else 0)
