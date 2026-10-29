# M1-C7-S2 の検算
from fractions import Fraction as F
from decimal import Decimal as D, ROUND_HALF_UP
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
r2=lambda x:D(str(float(x))).quantize(D("0.01"),rounding=ROUND_HALF_UP)
A=[D(x) for x in "4.2 5.8 6.1 6.5 7.0 7.3 7.4 7.8 8.1 8.2 8.5 8.6 8.9 9.0 9.4 9.7 10.2 10.8 11.5 12.6".split()]
fA=[2,6,8,3,1]; fB=[1,4,8,9,3]; mids=[5,7,9,11,13]
cum=lambda f:[sum(f[:i+1]) for i in range(len(f))]
def median(xs):
    s=sorted(xs);n=len(s);return s[n//2] if n%2 else (s[n//2-1]+s[n//2])/2

up=[(100,22),(200,41),(500,108),(1000,214),(2000,426)]
check('紙コップ 相対度数',[F(k,n) for n,k in up],[F(22,100),F(41,200),F(108,500),F(214,1000),F(426,2000)])
check('紙コップ 小数',[float(F(k,n)) for n,k in up],[0.22,0.205,0.216,0.214,0.213])
check('2000回の合計',426+180+1394,2000)
check('例4基本',(r2(F(180,2000)),r2(F(1394,2000))),(D('0.09'),D('0.70')))
check('確率の合計',r2(F(426,2000))+D('0.09')+D('0.70'),D('1.00'))
check('例4標準',(F(56,800),F(56,800)*300),(F(7,100),21))
check('例4応用',(F(516,1200),F(690,1500)),(F(43,100),F(46,100)))
check('確認4-1',F(645,1500),F(43,100)); check('確認4-2',(F(36,400),F(36,400)*100),(F(9,100),9))
check('雨の記録',F(9,30),F(3,10)); check('景品',F(6,50)*75,9)
check('振り返り',(F(474,600),F(474,600)*50),(F(79,100),F(79,2)))
check('練習1',F(296,800),F(37,100)); check('練習2',F(4,100)*250,10); check('練習3',1-F(21,100)-F(9,100),F(7,10))
check('チェック',(F(85,500),F(3,10)*40),(F(17,100),12))
check('クイズ',(F(1,4)*80,1-F(36,100)),(20,F(64,100)))
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
