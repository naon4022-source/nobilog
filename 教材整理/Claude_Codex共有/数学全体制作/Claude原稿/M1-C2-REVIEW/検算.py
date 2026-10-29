# M1-C2-REVIEW の検算
from fractions import Fraction as F
import itertools
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print('NG',n,g,w)
VALS=[F(-3),F(-1,2),F(0),F(2),F(7,3)]
def same(n,f,g,k=1):
    for v in itertools.product(VALS,repeat=k):
        if f(*v)!=g(*v): return check(n,False,True)
    check(n,True,True)
same('R1',lambda m,n:m*(-1)*n*m,lambda m,n:-m**2*n,2)
a=F(-5); check('R3',a**2-4*a,45)
same('R4',lambda y:-7*y+2-(3-5*y),lambda y:-2*y-1)
same('R5',lambda x:(15*x-10)/F(-5,3),lambda x:-9*x+6)
same('R6',lambda x:2*(3*x-2)-(-x+5),lambda x:7*x-9)
same('R8',lambda n:(2*n+2)*2,lambda n:4*n+4)
check('R8 n=3 数えて',2*(2*3)+2*2,16); check('R8 式 n=3',4*3+4,16)
x=F(-2); check('P121',(3*(x+4)-2*(x-1),x+14),(12,12))
same('P121式',lambda x:3*(x+4)-2*(x-1),lambda x:x+14)
same('P121別解',lambda x:F(1,3)*(6*x-9)-F(1,2)*(4*x+2),lambda x:F(-4))
print(f'検算 {ok}件 成功 / {ng}件 失敗'); raise SystemExit(1 if ng else 0)
