# M1-C3-S2 の検算：方程式を解き、さらに文章の条件どおりに計算し直して確かめる。
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print('NG',n,g,w)
def solve(f):
    a=f(F(1))-f(F(0)); b=f(F(0)); assert f(F(2))==2*a+b; x=-b/a; assert f(x)==0; return x
x=solve(lambda x:1000-(4*x+150)-90); check('例1基本',x,190); check('例1基本 文章',1000-(4*190+150),90)
x=solve(lambda x:3*x+200-4*(x+40)); check('例1標準',x,40); check('例1標準 文章',(3*40+200,4*(40+40)),(320,320))
x=solve(lambda x:6*x+15-(8*x-9)); check('例1応用',(x,6*x+15,8*x-9),(12,87,87))
x=solve(lambda x:2000-(5*x+300)-200); check('確認1-1',x,300)
x=solve(lambda x:4*x+10-(6*x-4)); check('確認1-2',(x,4*x+10,6*x-4),(7,38,38))
x=solve(lambda x:150*x-60*(15+x)); check('例2基本',(x,150*x,60*(15+x)),(10,1500,1500))
check('例2標準',150*10>1200,True)
x=solve(lambda x:x+F('0.8')*x+8-170); check('例2応用',(x,F('0.8')*x+8),(90,80))
x=solve(lambda x:240*x-80*(12+x)); check('確認2-1',(x,240*x,80*(12+x),F(80*12)/(240-80)),(6,1440,1440,6))
x=solve(lambda x:x+F('0.75')*x-5-58); check('確認2-2',(x,F('0.75')*x-5),(36,22))
x=solve(lambda x:9*x-180*2); check('例3基本',(x,180-x,F(x,180-x) if False else F(40,140)),(40,140,F(2,7)))
x=solve(lambda x:4*(30+x)-5*(18+x)); check('例3標準',(x,F(30+x,18+x)),(30,F(5,4)))
x=solve(lambda x:5*(500-x)-3*(300+x)); check('例3応用',(x,F(500-x,300+x)),(200,F(3,5)))
x=solve(lambda x:5*x-250*3); check('確認3-1',x,150)
x=solve(lambda x:2*(60-x)-3*(20+x)); check('確認3-2',(x,F(60-x,20+x)),(12,F(3,2)))
# 確認問題
x=solve(lambda x:1500-(6*x+250)-50); check('Q1',x,200)
x=solve(lambda x:5*x+90-3*(x+70)); check('Q2',(x,5*x+90,3*(x+70)),(60,390,390))
x=solve(lambda x:5*x+8-(7*x-12)); check('Q3',(x,5*x+8,7*x-12),(10,58,58))
x=solve(lambda x:200*x-80*(9+x)); check('Q4',(x,200*x,80*(9+x)),(6,1200,1200))
x=solve(lambda x:8*x-240*5); check('Q5',(x,240-x,F(x,240-x)),(150,90,F(5,3)))
x=solve(lambda x:x+F('1.2')*x-30-410); check('Q6',(x,F('1.2')*x-30),(200,210))
x=solve(lambda x:1*(40+x)-4*(25-x)); check('Q7',(x,F(40+x,25-x)),(12,F(4,1)))
check('Q8',(200*6,200*6<2000),(1200,True))
# 誤答例
check('誤Q1',solve(lambda x:1500-(6*x+250)+50),F(650,3))
check('誤Q4',solve(lambda x:200*(9+x)-80*x),-15)
check('誤Q2',solve(lambda x:5*x+90-(3*x+70)),-10) 
check('誤Q3',solve(lambda x:5*x+8-(7*x+12)),-2)
check('誤Q5',solve(lambda x:3*x-240*5),400)
check('誤Q7',solve(lambda x:1*(40+x)-4*(25+x)),-20)
print(f'検算 {ok}件 成功 / {ng}件 失敗'); raise SystemExit(1 if ng else 0)
