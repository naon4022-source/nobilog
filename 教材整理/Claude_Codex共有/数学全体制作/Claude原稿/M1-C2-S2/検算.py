# M1-C2-S2 の検算（標準ライブラリだけ・読むだけ）
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
same('例1標準',lambda x:4*x-9*x,lambda x:-5*x)
same('例1応用1',lambda a:F('0.3')*a-F('1.1')*a+F('2.5')-F('0.9'),lambda a:F('-0.8')*a+F('1.6'))
same('例1応用2',lambda y:F(2,3)*y-F(5,6)*y,lambda y:-y/6)
same('確認1-1',lambda y:7*y-y,lambda y:6*y); same('確認1-2',lambda a:3*a+5-8*a-2,lambda a:-5*a+3)
same('例2基本',lambda x:5*x+(2*x-9),lambda x:7*x-9); same('例2標準',lambda a:6*a-(4*a-7),lambda a:2*a+7)
same('例2応用和',lambda x:(3*x-8)+(-5*x+2),lambda x:-2*x-6); same('例2応用差',lambda x:(3*x-8)-(-5*x+2),lambda x:8*x-10)
same('確認2-1',lambda y:2*y-(-y+4),lambda y:3*y-4); same('確認2-2',lambda a:(4*a+1)-(6*a-3),lambda a:-2*a+4)
same('例3基本',lambda a:-4*a*6,lambda a:-24*a); same('例3基本2',lambda y:15*y/(-5),lambda y:-3*y); same('例3基本3',lambda x:4*x/F(2,3),lambda x:6*x)
same('例3標準1',lambda x:-3*(5*x-2),lambda x:-15*x+6); same('例3標準2',lambda a:(12*a-20)/4,lambda a:3*a-5)
same('例3応用',lambda x:(9*x-6)/F(-3,2),lambda x:-6*x+4)
same('確認3-1',lambda x:F(-2,5)*x*15,lambda x:-6*x); same('確認3-2',lambda y:(-8*y+12)/(-4),lambda y:2*y-3)
same('FIG03',lambda x:5*(2*x+3),lambda x:10*x+15)
same('例4基本',lambda x:(3*x-1)/4*8,lambda x:6*x-2); same('例4標準',lambda a:2*(3*a+4)-5*(a-1),lambda a:a+13)
same('例4応用',lambda x:F(1,3)*(6*x-9)-F(1,2)*(4*x+2),lambda x:F(-4))
same('確認4-1',lambda x:12*(2*x+5)/6,lambda x:4*x+10); same('確認4-2',lambda x:3*(x-2)-(2*x-7),lambda x:x+1)
same('P111',lambda n:n+n+1+1,lambda n:2*(n+1)); check('P111 n=5',2*(5+1),12)
same('Q1',lambda a:9*a-5*a,lambda a:4*a); same('Q2',lambda x:-2*x+7-6*x+1,lambda x:-8*x+8)
same('Q3',lambda a:F(1,2)*a-F(3,4)*a,lambda a:-a/4); same('Q4',lambda x:4*x+(6-x),lambda x:3*x+6)
same('Q5',lambda y:8*y-(3*y-5),lambda y:5*y+5); same('Q6',lambda x:(7*x-2)-(-3*x+4),lambda x:10*x-6)
same('Q7',lambda a:6*a*(-7),lambda a:-42*a); same('Q8',lambda y:-4*(2*y-5),lambda y:-8*y+20)
same('Q9',lambda x:(18*x-27)/9,lambda x:2*x-3); same('Q10',lambda x:(2*x+3)/5*(-10),lambda x:-4*x-6)
same('Q11',lambda a:4*(2*a-1)-3*(a+2),lambda a:5*a-10)
# 関係式：具体例でことばどおりになるか
check('Q12 例 a=150,b=50',5*150+50,800)
check('Q13 例 x=14,y=4 は余る',14>3*4,True)
check('例5応用 a=1500,b=400',1500-2*400>=500,True)
print(f'検算 {ok}件 成功 / {ng}件 失敗'); raise SystemExit(1 if ng else 0)
