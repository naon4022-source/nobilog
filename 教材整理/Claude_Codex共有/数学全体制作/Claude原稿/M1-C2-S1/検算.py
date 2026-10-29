# M1-C2-S1 の検算（標準ライブラリだけ・読むだけ）
# 文字式は、いくつかの値を代入して、元の式と答えの式の値が一致するかで確かめる。
from fractions import Fraction as F
import itertools
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print('NG',n,g,w)
VALS=[F(-3),F(-1,2),F(2),F(5),F(7,3)]
def same(n,f,g,k=1):
    for v in itertools.product(VALS,repeat=k):
        if f(*v)!=g(*v): return check(n,False,True)
    check(n,True,True)
# 例題・確認（書き直しの前後で値が同じ）
same('例1標準',lambda m,n: n*(-3)*m*n, lambda m,n: -3*m*n**2,2)
same('例1応用',lambda a,b: 2*a/b*5, lambda a,b: 10*a/b,2)
same('逆向き',lambda a,b: 3*a**2*b, lambda a,b: 3*a*a*b,2)
same('確認1-1',lambda x,y: x*7*y, lambda x,y: 7*x*y,2)
same('確認1-2',lambda m: m/(-6), lambda m: -m/6)
same('確認1-3',lambda p,q: 1*p+q*(-1), lambda p,q: p-q,2)
same('例2応用1',lambda x: x-x*F('0.25'), lambda x: F(3,4)*x)
same('確認2-2',lambda x: x*F(20,60), lambda x: x/3)
same('確認2-3',lambda b: b*F(15,100), lambda b: F(3,20)*b)
# 式の値
check('例3基本',5-2*F(-3),11)
check('例3標準1',(F(-4)**2,-(F(-4)**2)),(16,-16))
check('例3標準2',4*2-5*(-3),23)
x=F(-1,2); check('例3応用',6*x**2-x,2)
check('確認3-1',-F(-2)+3,5); check('確認3-2',F(20)/(-4),-5); check('確認3-3',F(-5)**2-2*4,17)
check('P088',F(-3)-12,-15)
check('P089',(3*3,2*3),(9,6))
# 確認問題
same('Q1',lambda a,b: b*a*4, lambda a,b: 4*a*b,2)
same('Q2',lambda x: x*x*x*(-2), lambda x: -2*x**3)
same('Q3',lambda a,b: (a-b)/6, lambda a,b: F(1,6)*(a-b),2)
same('Q4',lambda m,n: 3*m-n/4, lambda m,n: -n/4+3*m,2)
same('Q8',lambda x: x+x*F(3,10), lambda x: F(13,10)*x)
check('Q9',4+3*F(-6),-14); check('Q10',-(F(-3)**2),-9)
x,y=F(3),F(-2); check('Q11',2*x**2-x*y,24)
# 誤答例が本当に誤りか
check('誤Q9',4+3*6,22); check('誤Q11',2*x**2-6,12)
check('誤Q3はちがう値',(F(5)-F(2))/6==F(5)-F(2)/6,False)
print(f'検算 {ok}件 成功 / {ng}件 失敗'); raise SystemExit(1 if ng else 0)
