"""特訓：空間図形 ふりかえりドリル（6章全体）。"""
from fractions import Fraction as F
from itertools import combinations, product
from mk import Unit
from vutil import only, pt

U = Unit('solidreview', '教科書 p184〜215（6章 空間図形 全体）',
         '2026-10-08 Claude作成（特訓・下書き）。円錐の展開図と体積・多面体を組み合わせる問題。答えは check.py で計算し直して検算。'
         '【保留】6章のほかの特訓と重ならない総合問題は 3 問まで。70問にしていない。')
U.expr('底面の半径 3 cm、母線 5 cm、高さ 4 cm の円錐の表面積を、π を使って答えよう（cm²）。', '24π',
       '①側面のおうぎ形：弧 6π、半径 5 で、面積 6π × 5 ÷ 2 ＝ 15π　②底面 9π　③24π。答え 24π cm²',
       lambda π: 2 * π * 3 * 5 / 2 + π * 9)
U.num('正四面体の辺の数と面の数の積を求めよう。', '24',
      '①正四面体は正三角形 4 つの面　②辺は 4 × 3 ÷ 2 ＝ 6　③6 × 4 ＝ 24。答え 24',
      lambda: F(4 * 3, 2) * 4)
U.num('底面の半径 3 cm、高さ 4 cm の円錐の体積は、同じ底面で同じ体積の円柱の高さを何 cm にすればよいか答えよう。', '4/3',
      '①円錐の体積 π × 9 × 4 ÷ 3 ＝ 12π　②円柱 π × 9 × h ＝ 12π　③h ＝ 4/3。答え 4/3cm',
      lambda: only(h for h in [F(n, 30) for n in range(0, 300)] if 9 * h == F(9 * 4, 3)), units=['cm'])
