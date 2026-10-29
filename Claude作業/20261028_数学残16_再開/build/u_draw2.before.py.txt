"""特訓：基本の作図②（教科書 p164〜165：垂線）。"""
from fractions import Fraction as F
from itertools import combinations, permutations
from mk import Unit
from vutil import only, pt

U = Unit('draw2', '教科書 p164〜165（垂線の作図とその利用）',
         '2026-10-08 Claude作成（特訓・下書き）。垂線の性質（点と直線のきょり・高さ・対角線）を使って数で答える一段難しい問題。答えは check.py で計算し直して検算。'
         '【保留】文章で数を答える形にできる問題は 4 問まで。70問にしていない。')
U.num('点 P(2, 6) から、x 軸に平行な直線 y ＝ 1 に垂線をひく。垂線の長さを求めよう。', '5',
      '①垂線の足は (2, 1)　②長さ 6 − 1 ＝ 5　③答え 5',
      lambda: 6 - 1)
U.num('三角形 ABC で、頂点Aから辺 BC に垂線 AH をひいた。BC ＝ 8 cm、三角形の面積が 20 cm² のとき、AH の長さを求めよう。', '5',
      '①面積 ＝ BC × AH ÷ 2　②8 × AH ÷ 2 ＝ 20　③AH ＝ 5。答え 5cm',
      lambda: only(h for h in [F(n, 10) for n in range(0, 1000)] if 8 * h / 2 == 20), units=['cm'])
U.num('正方形の2本の対角線は、たがいに垂直に交わり、長さが等しい。対角線の長さが 10 cm の正方形の面積を求めよう。', '50',
      '①正方形はひし形でもあるので、面積 ＝ 対角線 × 対角線 ÷ 2　②10 × 10 ÷ 2 ＝ 50　③答え 50cm²',
      lambda: F(10 * 10, 2), units=['cm²'])
U.num('点Aから直線 ℓ にひいた垂線の長さは 7 cm である。ℓ 上の点Pで、AP の長さとして考えられる、もっとも小さい値を答えよう。', '7',
      '①点と直線を結ぶ線分のうち、垂線がもっとも短い　②AP の最小は 7 cm（P が垂線の足のとき）　③答え 7cm',
      lambda: min([7] + [7 + k for k in range(1, 10)]), units=['cm'])
