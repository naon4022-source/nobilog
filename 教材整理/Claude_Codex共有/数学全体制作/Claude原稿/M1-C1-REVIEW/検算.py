# M1-C1-REVIEW の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print('NG',n,g,w)
check('R1',-11+4-(-9),2)
check('R2',F('-0.7')<F(-2,3),True)
check('R3',(-3)**3*F(-1,9),3)
check('R4',16-(-2)**2*5,-4)
check('R5',F('-1.2')/F('0.4')*(-5),15)
check('R6',(F(3,4)-F(5,6))/F(-1,12),1)
check('R7',F('-4.5')+F('7.2')-F('5.6'),F('-2.9'))
check('R8イ反例',-2-(-5)>0,True); check('R8エ反例',2%2==0,True)
import itertools
negs=[F(-1),F(-2),F('-0.5'),F(-3,7)]
check('R8ア',all(a+b<0 for a,b in itertools.product(negs,repeat=2)),True)
check('R8ウ',all((a*b*c)<0 for a,b,c in itertools.product(negs,repeat=3)),True)
check('別解',(25*(-7)*4,25*4*(-7)),(-700,-700))
check('や',(99*(-6),(100-1)*(-6)),(-594,-594))
check('誤R5',F('-1.2')/(F('0.4')*(-5)),F('0.6'))
print(f'検算 {ok}件 成功 / {ng}件 失敗'); raise SystemExit(1 if ng else 0)
