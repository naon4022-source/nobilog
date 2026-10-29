from pathlib import Path
from html import escape
from 図.fraction_layout import final_svg
root=Path(__file__).resolve().parents[1]
rows=[(['(+13)+(−21)＝+8'], ['符号は絶対値の大きい', '−21 のほう']), (['(−9)−(−14)＝−23'], ['ひく数の符号も変える。', '(−9)+(+14)＝5']), (['−(−9) を −9 のまま計算'], ['+9 に直してから']), (['(−6)×(−13)＝−78'], ['同じ符号は +']), (['0÷(−5)＝−5'], ['0 をわると 0']), (['−9/2 の逆数を', '2/9 とする'], ['逆数の符号は元と同じ', '→ −2/9']), (['−3² ＝ 9'], ['− は 3² の外。', '−3²＝−9']), (['(5/6−3/4)×(−24) で、', '5/6 にだけかける'], ['かっこの中のすべての項', 'にかける']), (['0 を自然数の集合に入れる'], ['0 は整数の集合には入るが、', '自然数ではない']), (['1 を素数に入れる'], ['素数は 2 から'])]
for i,(bad,good) in enumerate(rows,1):
 s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img"><title>よくあるまちがいと正しい考え方</title><rect width="1600" height="900" fill="#f6f8fc"/><g font-family="Hiragino Sans,sans-serif" fill="#203348"><text x="90" y="100" font-size="44" font-weight="700">よくあるまちがい</text><rect x="65" y="155" width="710" height="625" rx="26" fill="white" stroke="#ac4e41" stroke-width="6" stroke-dasharray="16 8"/><rect x="825" y="155" width="710" height="625" rx="26" fill="white" stroke="#397052" stroke-width="6"/><text x="420" y="265" font-size="65" fill="#ac4e41" text-anchor="middle">✗</text><text x="1180" y="265" font-size="65" fill="#397052" text-anchor="middle">○</text>'
 for j,t in enumerate(bad):s+=f'<text x="420" y="{400+j*75}" text-anchor="middle" font-size="40">{escape(t)}</text>'
 s+='<ellipse cx="420" cy="422" rx="315" ry="125" stroke="#ac4e41" stroke-width="5" fill="none"/><text x="420" y="595" font-size="44" fill="#ac4e41" text-anchor="middle">ここ！</text>'
 for j,t in enumerate(good):s+=f'<rect x="870" y="{318+j*150}" width="620" height="100" rx="16" fill="#edf5ef"/><text x="1180" y="{382+j*150}" font-size="40" text-anchor="middle">{escape(t)}</text>'
 if len(good)>1:s+='<path d="M1180 425V455l-14 -17M1180 455l14 -17" fill="none" stroke="#397052" stroke-width="6"/>'
 s+='<text x="800" y="852" font-size="40" text-anchor="middle">✗の考え方を、○の手順で直そう。</text></g></svg>'
 ident=f'M1-C1-S2-M{i:02d}'
 (root/(ident+'.svg')).write_text(final_svg(ident,s))
