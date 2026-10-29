# M1-C3-REVIEW の検算（標準ライブラリだけ）
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print('NG',n,g,w)
def solve(f):
    a=f(F(1))-f(F(0)); b=f(F(0)); assert f(F(2))==2*a+b; x=-b/a; assert f(x)==0; return x
# 本文
x=solve(lambda x:42+x-3*(10+x)); check('例1 3倍',(x,42+x,3*(10+x)),(6,48,48))
x=solve(lambda x:42+x-5*(10+x)); check('例1 5倍',(x,42+x,5*(10+x)),(-2,40,40))
x=solve(lambda x:4*x+3-(6*x-6)); check('例2 4本6本',x,F(9,2))
x=solve(lambda x:x/60-x/90-10); check('例3 方法1',x,1800)
t=solve(lambda t:60*(t+10)-90*t); check('例3 方法2',(t,90*t,60*(t+10)),(20,1800,1800))
# 確認問題
v=F(-3); check('R1',(2*v+9==3, 4-v==v+1, 5*v==v-12),(True,False,True))
x=solve(lambda x:7*x-4-(3*x+16)); check('R2',(x,7*x-4,3*x+16),(5,31,31))
x=solve(lambda x:3*(x-4)-(x+6)); check('R3',(x,3*(x-4),x+6),(9,15,15))
x=solve(lambda x:(x+1)/2-(2*x-3)/5); check('R4',(x,(x+1)/2,(2*x-3)/5),(-11,-5,-5))
x=solve(lambda x:F(3,10)*x-F(14,10)-(F(1,10)*x+F(2,10))); check('R5',(x,F(3,10)*x-F(14,10)),(8,1))
x=solve(lambda x:5*x-2*(x+6)); check('R6',(x,F(x,x+6)),(4,F(2,5)))
a=solve(lambda a:3*4+a-(2*4+3*a)); check('R7',a,2); check('R7 確かめ',solve(lambda x:3*x+a-(2*x+3*a)),4)
x=solve(lambda x:1000-(3*x+120)-280); check('R8',(x,1000-(3*x+120)),(200,280))
x=solve(lambda x:5*x+7-(7*x-9)); check('R9',(x,5*x+7,7*x-9),(8,47,47))
x=solve(lambda x:39+x-4*(12+x)); check('R10',(x,39+x,4*(12+x)),(-3,36,36))
x=solve(lambda x:x/2-3-(x+4)/3); check('R11 正しい解',(x,x/2-3,(x+4)/3),(26,10,10))
x=solve(lambda x:3*x-18-(2*x+4)); check('R11 誤りの解',x,22)
check('R11 ①は正しい',all(6*(v/2-3)==3*v-18 and 6*((v+4)/3)==2*(v+4) for v in (F(0),F(5),F(-7,3))),True)
x=solve(lambda x:x/80-x/120-5); check('R12 方法1',x,1200)
t=solve(lambda t:80*(t+5)-120*t); check('R12 方法2',(t,120*t),(10,1200))
# 誤答例の値
check('誤R8',solve(lambda x:1000-3*x+120-280),280)
check('誤R9',solve(lambda x:5*x+7-(7*x+9)),-1)
check('誤R4',solve(lambda x:5*(x+1)-(4*x-3)),-8)
check('誤R6',solve(lambda x:5*x-(2*x+6)),2)
check('誤R3',solve(lambda x:3*x-4-(x+6)),5)
check('誤R2',solve(lambda x:4*x-(16-4)),3)
check('誤R5',solve(lambda x:3*x-14-(x+F(2,10))),F(71,10))
check('誤R7',solve(lambda a:a+3*a-(8-12)),-1)
check('誤R12',solve(lambda x:3*x-2*x-5),5)
print(f'検算 {ok}件 成功 / {ng}件 失敗')
