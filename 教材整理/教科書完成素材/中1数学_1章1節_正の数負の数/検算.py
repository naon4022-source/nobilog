# 1章1節 試作の検算（Claude Code・2026-10-03）
# 使い方：python3 検算.py   （標準ライブラリだけ。ファイルは読むだけで書きかえない）
# 問題の条件から答えを計算し直し、解答.md に書いた答えと一致するかを確かめる。
# 図は、SVGの点の座標を目盛りの位置から数値に戻して、決めた値と一致するかを確かめる。
from fractions import Fraction as F
import os, re, xml.etree.ElementTree as ET
HERE=os.path.dirname(os.path.abspath(__file__))
ok=0; ng=0
def check(name, got, want):
    global ok, ng
    if got==want: ok+=1
    else: ng+=1; print('NG', name, got, want)
is_int=lambda v: F(v).denominator==1
# ---- 例題 ----
nums=[F(-7),F('0.4'),F(0),F(3),F(-2,5),F(15),F(-1),F('1.2')]
check('例1標準 負',[v for v in nums if v<0],[F(-7),F(-2,5),F(-1)])
check('例1標準 整数',[v for v in nums if is_int(v)],[F(-7),F(0),F(3),F(15),F(-1)])
check('例1標準 自然数',[v for v in nums if is_int(v) and v>0],[F(3),F(15)])
step=F(1,5); check('例1応用 P',-3*step,F('-0.6')); check('例1応用 Q',2*step,F('0.4'))
check('例2標準',[d-20 for d in (26,17,20)],[6,-3,0])
check('例2応用(2)',50+(-8),42)
check('例3基本',(abs(F(-11)),-F(-11)),(F(11),F(11)))
check('例3標準(1)',F('-3.5')<F(-2),True)
check('例3標準(2)',sorted([F(-1),F(-4,3),F('0.5')]),[F(-4,3),F(-1),F('0.5')])
check('例3応用(1)',[n for n in range(-10,11) if abs(n)<3],[-2,-1,0,1,2])
check('例3応用(2)',F(-2)-4,F(-6))   # −4大きい＝4小さい
check('例3応用(3)',[x for x in range(-10,11) if x+4==1],[-3])   # □より4大きい数が1
# ---- 確認問題 ----
check('Q1',0-7,-7)
check('Q2',0-F(2,9),F(-2,9))
q3=[F(-6),F('2.5'),F(0),F(8),F(-1,2),F(13)]
check('Q3(1)',[v for v in q3 if is_int(v)],[F(-6),F(0),F(8),F(13)])
check('Q3(2)',[v for v in q3 if is_int(v) and v>0],[F(8),F(13)])
check('Q5',6-9,-3)               # 午前6時は基準9時との差
check('Q6',7400-8000,-600)
check('Q8',abs(F('-4.2')),F('4.2'))
check('Q9',[n for n in range(-10,11) if abs(n)<F('2.5')],[-2,-1,0,1,2])
check('Q10',F(-5,6)<F(-4,5),True)
check('Q11',sorted([F('0.7'),F('-1.6'),F(-3,10),F(-2),F(0)]),[F(-2),F('-1.6'),F(-3,10),F(0),F('0.7')])
check('Q12',F(2)-5,F(-3))        # −5大きい＝5小さい
# ---- 図 ----
def svg_points(fn):
    root=ET.parse(os.path.join(HERE,'図',fn)).getroot()
    ns='{http://www.w3.org/2000/svg}'
    ticks=[(float(e.get('x1')),F(e.get('data-v'))) for e in root.iter(ns+'line') if e.get('data-v') is not None]
    (xa,va),(xb,vb)=ticks[0],ticks[-1]
    to_v=lambda x: va+(F(x)-F(xa))*(vb-va)/(F(xb)-F(xa))
    pts={}
    for e in root.iter(ns+'circle'):
        v=to_v(F(e.get('cx'))).limit_denominator(100)
        pts.setdefault(e.get('data-point') or '', []).append(v)
        check(fn+' data-v一致', v, F(e.get('data-v')))
    return pts
p=svg_points('fig2_目盛りの読み取り.svg'); check('fig2 P',p['P'],[F(-3,5)]); check('fig2 Q',p['Q'],[F(2,5)])
p=svg_points('q4_数直線の読み取り.svg'); check('q4 A',p['A'],[F(-5,2)]); check('q4 B',p['B'],[F(3,2)])
p=svg_points('fig4_絶対値.svg'); check('fig4',sorted(p[''],),[F(-3),F(3)])
p=svg_points('fig5_数直線で求める.svg'); check('fig5',p[''],[F(1),F(4),F(1),F(-2)])
root=ET.parse(os.path.join(HERE,'図','fig3_基準とのちがい.svg')).getroot()
check('fig3',[int(e.get('data-diff')) for e in root.iter() if e.get('data-diff') is not None],[6,-3,0])
for fn in sorted(os.listdir(os.path.join(HERE,'図'))):
    r=ET.parse(os.path.join(HERE,'図',fn)).getroot(); ns='{http://www.w3.org/2000/svg}'
    check(fn+' title/desc', (r.find(ns+'title') is not None and r.find(ns+'desc') is not None), True)
print(f'検算 {ok}件 成功 / {ng}件 失敗')
raise SystemExit(1 if ng else 0)
