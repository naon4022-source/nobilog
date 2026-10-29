from pathlib import Path
s=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc"><title id="title">読書の目標20ページを基準にする</title><desc id="desc">月から金の読書量は23、18、20、25、15ページ。目標20ページの線より上をプラス、下をマイナスと示す。各日の差の数は表示しない。</desc><defs><pattern id="stripe" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10L10 0" stroke="#6587ac" stroke-width="2"/></pattern></defs><rect width="1600" height="900" fill="#f6f8fc"/><g font-family="Hiragino Sans,sans-serif" fill="#203348"><rect x="45" y="35" width="1510" height="120" rx="25" fill="#e8f0fa"/><text x="90" y="114" font-size="48" font-weight="700">目標を0の基準にすると？</text><rect x="65" y="190" width="1470" height="580" rx="25" fill="white"/>']
base=670;scale=16;target=base-20*scale
for i,(day,n) in enumerate(zip('月火水木金',[23,18,20,25,15])):
 x=340+i*220;top=base-n*scale
 s.append(f'<rect x="{x}" y="{top}" width="100" height="{n*scale}" fill="#d5e1ee" stroke="#203348" stroke-width="3"/><text x="{x+50}" y="{top-24}" font-size="40" text-anchor="middle">{n}</text><text x="{x+50}" y="725" font-size="40" text-anchor="middle">{day}</text>')
 if n!=20:
  low=min(top,target);h=abs(top-target);s.append(f'<rect x="{x}" y="{low}" width="100" height="{h}" fill="url(#stripe)" stroke="#1f5fa8" stroke-width="3"/><text x="{x+145}" y="{low+h/2+12}" font-size="45">{"＋" if n>20 else "−"}</text>')
s.append(f'<path d="M270 {target}H1450" stroke="#203348" stroke-width="5" stroke-dasharray="14 8"/><text x="110" y="{target-25}" font-size="40">目標20</text><text x="110" y="{target+20}" font-size="40">0の基準</text><path d="M270 670H1450" stroke="#203348" stroke-width="3"/><text x="800" y="838" text-anchor="middle" font-size="40">上なら＋。下なら−。同じなら、ちがいはない。</text></g></svg>')
Path(__file__).resolve().parent.parent.joinpath('M1-C1-S1-D03.svg').write_text(''.join(s))
