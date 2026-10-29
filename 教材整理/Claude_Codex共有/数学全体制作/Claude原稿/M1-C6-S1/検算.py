# M1-C6-S1 の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
# π をふくむ値は「π の係数」で表す
prism=lambda n:(n+2,3*n,2*n)       # 角柱 面・辺・頂点
pyramid=lambda n:(n+1,2*n,n+1)     # 角錐
euler=lambda f,e,v:f+v-e
cyl_v=lambda r,h:F(r)**2*h
cone_v=lambda r,h:F(1,3)*F(r)**2*h
sph_v=lambda r:F(4,3)*F(r)**3
sph_s=lambda r:4*F(r)**2
cone_side=lambda l,r:F(l)*r
angle=lambda r,l:F(360)*r/l

check('例1基本',prism(6),(8,18,12)); check('例1基本 オイラー',euler(*prism(6)),2)
check('例1標準',pyramid(5),(6,10,6))
check('確認1-1',prism(8),(10,24,16))
check('例2基本 横',2*3,6)
check('例2標準',angle(4,12),120)
check('確認2-1',angle(5,15),120)
check('確認2-2 辺',pyramid(4)[1],8)
check('振り返り1',pyramid(7),(8,14,8))
check('振り返り2',angle(6,10),216)
check('例4応用 横',2*2,4)
# 直方体の辺 AB/AD の関係（11本）
cube={'AB','BC','CD','DA','EF','FG','GH','HE','AE','BF','CG','DH'}
def rel(e):
    v={'A':(0,0,1),'B':(1,0,1),'C':(1,1,1),'D':(0,1,1),'E':(0,0,0),'F':(1,0,0),'G':(1,1,0),'H':(0,1,0)}
    d=lambda s:tuple(v[s[1]][i]-v[s[0]][i] for i in range(3))
    out={'交':[],'平':[],'ね':[]}
    for f in sorted(cube-{e}):
        if set(e)&set(f): out['交'].append(f)
        elif all(a==0 for a in [d(e)[1]*d(f)[2]-d(e)[2]*d(f)[1],d(e)[2]*d(f)[0]-d(e)[0]*d(f)[2],d(e)[0]*d(f)[1]-d(e)[1]*d(f)[0]]): out['平'].append(f)
        else: out['ね'].append(f)
    return out
check('例3標準 AD',sorted(rel('DA')['ね']),sorted(['BF','CG','EF','GH']))
check('R3 AB',len(rel('AB')['ね']),4)
check('練習262-2 CG',sorted(rel('CG')['ね']),sorted(['AB','DA','EF','HE']))
check('練習254-1',pyramid(9),(10,18,10))
check('練習254-4 正八面体',(F(8*3,4),F(8*3,2)),(6,12))
check('練習258-2',angle(3,9),120)
check('練習258-3',F(90*16,360),4)
check('チェック',(pyramid(4)[1],angle(2,6)),(8,120))
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
