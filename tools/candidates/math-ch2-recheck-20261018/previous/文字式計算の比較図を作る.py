from pathlib import Path
from html import escape
root=Path(__file__).resolve().parents[1]
rows=[(['4x+2 を 6x とする'], ['文字の項と数の項は', 'まとめられない']), (['6a−(4a−7)＝', '6a−4a−7'], ['−( ) は中の すべて の', '符号を変える：+7']), (['−3(5x−2)＝−15x−6'], ['−3×(−2)＝+6']), (['(3x−1)/4×8 を', '3x−1×2 とする'], ['分子のかっこを残す：', '(3x−1)×2']), (['「以下」に < を使う'], ['以下は ≦', '（等しいときもふくむ）'])]
for i,(bad,good) in enumerate(rows,1):
 s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img"><title>よくあるまちがいと正しい考え方</title><rect width="1600" height="900" fill="#f6f8fc"/><g font-family="Hiragino Sans,sans-serif" fill="#203348"><text x="90" y="100" font-size="44" font-weight="700">よくあるまちがい</text><rect x="65" y="155" width="710" height="625" rx="26" fill="white" stroke="#ac4e41" stroke-width="6" stroke-dasharray="16 8"/><rect x="825" y="155" width="710" height="625" rx="26" fill="white" stroke="#397052" stroke-width="6"/><text x="420" y="265" font-size="65" fill="#ac4e41" text-anchor="middle">✗</text><text x="1180" y="265" font-size="65" fill="#397052" text-anchor="middle">○</text>'
 for j,t in enumerate(bad):s+=f'<text x="420" y="{375+j*75}" text-anchor="middle" font-size="40">{escape(t)}</text>'
 s+='<ellipse cx="420" cy="422" rx="295" ry="113" stroke="#ac4e41" stroke-width="5" fill="none"/><text x="420" y="595" font-size="44" fill="#ac4e41" text-anchor="middle">ここ！</text>'
 for j,t in enumerate(good):s+=f'<rect x="870" y="{318+j*150}" width="620" height="100" rx="16" fill="#edf5ef"/><text x="1180" y="{382+j*150}" font-size="40" text-anchor="middle">{escape(t)}</text>'
 if len(good)>1:s+='<path d="M1180 425V455l-14 -17M1180 455l14 -17" fill="none" stroke="#397052" stroke-width="6"/>'
 s+='<text x="800" y="852" font-size="40" text-anchor="middle">✗の考え方を、○の手順で直そう。</text></g></svg>'
 (root/f'M1-C2-S2-M{i:02d}.svg').write_text(s)
