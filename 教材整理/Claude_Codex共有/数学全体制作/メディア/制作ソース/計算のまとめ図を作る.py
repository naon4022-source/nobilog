from pathlib import Path
from html import escape
from 図.fraction_layout import final_svg
r=Path(__file__).resolve().parents[1]
def wrap(title,body):
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#f6f8fc"/><g font-family="Hiragino Sans,sans-serif" font-size="40" fill="#203348"><text x="90" y="100" font-size="48">'+escape(title)+'</text>'+body+'</g></svg>'
body=''
for i,(x,y,label,detail) in enumerate([(80,220,'項・係数','何がいくつあるか'),(620,220,'まとめる','同じ種類だけ'),(80,470,'かっこを外す','すべての項へ'),(620,470,'数との乗除','分配と約分'),(1080,650,'関係を表す式','＝・＜・＞')]):
 body+=f'<rect x="{x}" y="{y}" width="440" height="170" rx="24" fill="white" stroke="#386a9a" stroke-width="4"/><text x="{x+220}" y="{y+65}" text-anchor="middle">{label}</text><text x="{x+220}" y="{y+130}" text-anchor="middle">{detail}</text>'
body+='<path d="M530 305h70l-18 -14m18 14l-18 14M840 400v40H300v18l-14 -16m14 16l14 -16M530 555h70l-18 -14m18 14l-18 14M1070 555h200v75l-14 -18m14 18l14 -18" fill="none" stroke="#386a9a" stroke-width="5"/>'
(r/'M1-C2-S2-DMAP.svg').write_text(wrap('文字式の計算｜つながりの地図',body))
body='<text x="800" y="215" text-anchor="middle">4等分の1切れを8倍 → 2枚分</text>'
for cx,cy,quarter in [(325,455,True),(1000,455,False),(1370,455,False)]:
 body+=f'<circle cx="{cx}" cy="{cy}" r="140" fill="#faf1df" stroke="#203348" stroke-width="4"/>'
 if quarter:body+=f'<path d="M{cx} {cy}V{cy-140}A140 140 0 0 1 {cx+140} {cy}Z" fill="#7fa88f" stroke="#203348" stroke-width="4"/>'
 else:body+=f'<circle cx="{cx}" cy="{cy}" r="135" fill="#7fa88f"/>'
 body+=f'<path d="M{cx-140} {cy}H{cx+140}M{cx} {cy-140}V{cy+140}" stroke="#203348" stroke-width="4"/>'
body+='<path d="M530 455H790l-25 -18m25 18l-25 18" fill="none" stroke="#386a9a" stroke-width="6"/><text x="650" y="390" text-anchor="middle">×8</text><text x="800" y="730" text-anchor="middle" font-size="56">(3x−1)/4×8＝2(3x−1)</text><text x="800" y="840" text-anchor="middle">分子は、かっこでひとまとめにしたまま。</text>'
(r/'M1-C2-S2-E01.svg').write_text(final_svg('M1-C2-S2-E01',wrap('分数の形の式 × 数｜4と8で約分',body)))
body=''
for cx,tilt,symbol,caption in [(290,0,'＝','同じ'),(800,55,'＜','右が重い'),(1310,-55,'＞','左が重い')]:
 cy=380
 body+=f'<path d="M{cx} {cy}L{cx-65} 680H{cx+65}Z" fill="#a3b5c6"/><path d="M{cx-160} {cy-tilt}L{cx+160} {cy+tilt}" stroke="#203348" stroke-width="7"/>'
 for dx,dy in [(-160,-tilt),(160,tilt)]:
  x=cx+dx;y=cy+dy
  body+=f'<path d="M{x-60} {y}V{y+160}H{x+60}V{y}" fill="none" stroke="#203348" stroke-width="4"/><rect x="{x-30}" y="{y+100}" width="60" height="55" rx="8" fill="#8caf9d"/>'
 body+=f'<text x="{cx}" y="280" text-anchor="middle" font-size="70">{symbol}</text><text x="{cx}" y="760" text-anchor="middle">{caption}</text>'
body+='<text x="800" y="855" text-anchor="middle">不等号の口は、大きいほうに開く。</text>'
(r/'M1-C2-S2-E02.svg').write_text(wrap('等式と不等式のてんびん',body))
p=r/'制作ソース/正負のまちがい図を作る.py';code=p.read_text();a=code.index('rows=');b=code.index('\nfor i,',a)
rows=[(['4x+2 を 6x とする'],['文字の項と数の項は','まとめられない']),(['6a−(4a−7)＝','6a−4a−7'],['−( ) は中の すべて の','符号を変える：+7']),(['−3(5x−2)＝−15x−6'],['−3×(−2)＝+6']),(['(3x−1)/4×8 を','3x−1×2 とする'],['分子のかっこを残す：','(3x−1)×2']),(['「以下」に < を使う'],['以下は ≦','（等しいときもふくむ）'])]
code=code[:a]+'rows='+repr(rows)+code[b:];code=code.replace('M1-C1-S1-M','M1-C2-S2-M');q=p.with_name('文字式計算の比較図を作る.py');q.write_text(code);exec(compile(code,str(q),'exec'),{'__file__':str(q.resolve())})
