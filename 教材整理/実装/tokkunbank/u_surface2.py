"""特訓：立体の表面積②（教科書 p211：球の表面積）。"""
from fractions import Fraction as F
from itertools import combinations, product
from mk import Unit
from vutil import only, pt

U = Unit('surface2', '教科書 p211（球の表面積）',
         '2026-10-08 Claude作成（特訓・下書き）。球の表面積を逆に求める・くらべる問題。答えは check.py で計算し直して検算。'
         '【保留】教科書問題（半球・球の一部の表面積）と似ない問題は 3 問まで。70問にしていない。')
U.expr('半径 6 cm の球を、中心を通る平面で2つに切った。2つの半球の表面積の和は、もとの球の表面積より何 cm² ふえるか、π を使って答えよう。', '72π',
       '①切り口の円（半径 6 cm）が2つふえる　②π × 36 × 2　③72π。答え 72π cm²',
       lambda π: 2 * π * 36)
U.num('球の半径を 3 倍にすると、表面積はもとの何倍になるか答えよう。', '9',
      '①表面積は 半径 × 半径 に比例　②3 × 3 ＝ 9　③答え 9倍',
      lambda: only((4 * (3 * r) ** 2) / (4 * r * r) for r in (F(1), F(2))), units=['倍'])
U.num('半径 r cm の球の表面積は、底面の半径が r cm、高さが 2r cm の円柱の側面積の何倍か答えよう。', '1',
      '①球 4πr²　②円柱の側面 2πr × 2r ＝ 4πr²　③等しいので 1 倍。答え 1倍',
      lambda: only((4 * r * r) / (2 * r * 2 * r) for r in (F(1), F(3))), units=['倍'])
