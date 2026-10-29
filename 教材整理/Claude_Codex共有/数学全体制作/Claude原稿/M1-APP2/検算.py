# M1-APP2 の検算
from fractions import Fraction as F
from math import gcd
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
def median(xs):
    s=sorted(xs);n=len(s);return s[n//2] if n%2 else F(s[n//2-1]+s[n//2],2)

# 1章
check('1-1',-7+12-(-5),10); check('1-2',F((-2)**3*(-3),6),4); check('1-3',-3**2+(-4)*(-2),-1)
check('1-4',F(-5,6)/F(10,9)*(-4),3); check('1-5',2**2*3**2*5,180); check('1-6',len(range(-4,5)),9)
check('1-7',(5+3)*(-3),-24)
# 2章（x の係数と定数で確かめる）
check('2-2',5-(-2)**2,1)
lin=lambda f:(f(1)-f(0),f(0))
check('2-3',lin(lambda x:4*(3*x-2)-3*(2*x-5)),(6,7)); check('2-4',lin(lambda x:F(9*x-6,-3)),(-3,2))
check('2-5',lin(lambda x:F(x-1,2)+F(2*x+1,3)),(F(7,6),F(-1,6)))
check('2-7',(4*10-4,sum(1 for i in range(10) for j in range(10) if i in(0,9) or j in(0,9))),(36,36))
# 3章
solve=lambda f:-F(f(0))/(f(1)-f(0))
check('3-1',solve(lambda x:7*x-4-(3*x+20)),6); check('3-2',solve(lambda x:2*(x-3)-(5*x+9)),-5)
check('3-3',solve(lambda x:F(4,10)*x-F(12,10)-(F(1,10)*x+F(3,10))),5); check('3-4',solve(lambda x:F(x+2,3)-F(x-1,2)),7)
check('3-5',F(12*5,4),15); check('3-6',solve(lambda x:90*x+120*(10-x)-1020),6); check('3-7',3*4-(2*4+5),-1)
# 4章
check('4-1',F(12,-4),-3); check('4-2',F(6*(-2),-3),4); check('4-3',F(2,5)*10,4); check('4-5',(2*2,F(8,2)),(4,4))
check('4-6',F(8*9,12),6); check('4-7',(2*9,F(18,-6)),(18,-3))
# 5章（π の係数）
arc=lambda r,a:2*F(r)*F(a,360); sec=lambda r,a:F(r)**2*F(a,360)
check('5-1',(arc(6,60),sec(6,60)),(2,6)); check('5-2',F(6,2*8)*360,135); check('5-3',F(1,2)*5*4,10)
check('5-5',(90+60,180-30),(150,150)); check('5-6',180-90-55,35); check('5-7',(16,sec(4,90)),(16,4))
# 6章
check('6-1',F(1,3)*16*9,48); check('6-2',9*4+16,52); check('6-3',(F(4,3)*6**3,4*6**2),(288,144))
check('6-4',2*(12+20+15),94); check('6-6',F(360*3,12),90); check('6-7',F(36*8)/(F(1,3)*36*8),3)
# 7章
x=[8,14,5,11,9,17,6]; check('7-1',(max(x)-min(x),median(x)),(12,9)); check('7-2',F(21,60),F(35,100))
f=[3,6,9,2]; m=[5,15,25,35]; check('7-3',F(sum(a*b for a,b in zip(f,m)),20),20)
check('7-4',(m[f.index(max(f))],[sum(f[:i+1]) for i in range(4)]),(25,[3,9,18,20]))
check('7-5',F(390,1500),F(26,100)); check('7-6',F(26,100)*200,52); check('7-7',72*6-70*5,82)
check('振り返り',((-3)*4-F(-18,-6),solve(lambda x:3*(x-2)-(x+4))),(-15,5))
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
