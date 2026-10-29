# M1-C2-S3 の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print('NG',n,g,w)
def trick(n,steps):
    v=F(n)
    for op,k in steps:
        v={'*':v*k,'+':v+k,'-':v-k,'/':v/k}[op]
    return v-n
NS=range(-20,21)
check('P113',{trick(n,[('*',3),('+',6),('/',3)]) for n in NS},{2})
check('例1標準',{trick(n,[('*',4),('-',8),('/',4)]) for n in NS},{-2})
check('確認1-1',{trick(n,[('*',2),('+',10),('/',2)]) for n in NS},{5})
check('P118',{trick(n,[('*',5),('+',15),('/',5)]) for n in NS},{3})
check('P118例',{trick(n,[('*',2),('+',14),('/',2)]) for n in NS},{7})
check('Q1',[F(3*n+12,3) for n in NS],[n+4 for n in NS])
check('Q2',{trick(n,[('*',6),('-',12),('/',6)]) for n in NS},{-2})
check('Q5',{trick(n,[('*',4),('+',24),('/',4)]) for n in NS},{6})
# 図形の規則：棒の本数を数で数えて式と照合
def hex_sticks(n): return 6+5*(n-1)
def sq_sticks(n): return 4+3*(n-1)
def pent_sticks(n): return 5+4*(n-1)
check('例1応用',[hex_sticks(n) for n in (1,2,3,10)],[5*n+1 for n in (1,2,3,10)])
check('確認1-2',[sq_sticks(n) for n in (1,2,3,10)],[3*n+1 for n in (1,2,3,10)])
check('Q3',[pent_sticks(n) for n in (1,2,3,10)],[4*n+1 for n in (1,2,3,10)])
check('Q4',4*20+1,81)
print(f'検算 {ok}件 成功 / {ng}件 失敗'); raise SystemExit(1 if ng else 0)
