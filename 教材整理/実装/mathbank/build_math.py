"""数学の70問の小単元を作って検査し、教材整理/確認済み/ に書き出す"""
import json, sys
from pathlib import Path
from check import check
import w1, muldiv, calc, review, moji1, moji2, eqs, func, geo, solid, data
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / '教材整理/確認済み'
# 写真で確認した、ページにある問題番号（出典の検査に使う）
ALLOWED = {
 'workbook-math-1-addsub3': {10: ['A①', 'A②', 'A③'], 11: ['A④', 'B①', 'B+②'], 'tb': (30, 31, 32)},
 'workbook-math-1-muldiv1': {12: ['A①', 'A②'], 13: ['A③', 'B①', 'B+②'], 'tb': (33, 34, 35)},
 'workbook-math-1-muldiv2': {14: ['A①', 'A②'], 15: ['A③', 'B①', 'B+②'], 'tb': (36, 37)},
 'workbook-math-1-muldiv3': {16: ['A①', 'A②', 'A③'], 17: ['A④', 'B①', 'B+②'], 'tb': (38, 39, 40, 41)},
 'workbook-math-1-calc1': {18: ['A①', 'A②'], 19: ['A③', 'B①', 'B+②'], 'tb': (42, 43)},
 'workbook-math-1-calc2': {20: ['A①', 'A②'], 21: ['A③', 'B①', 'B+②'], 'tb': (43, 44)},
 'workbook-math-1-review': {22: ['①', '②', '③', '④', '⑤'], 23: ['⑥', '⑦', '⑧', '⑨'], 'tb': (20, 31, 32, 35, 38, 40, 42, 43, 44)},
 'workbook-math-1-numworld': {24: ['A①', 'A②', 'A③'], 25: ['A④', 'A⑤', 'B①', 'B②', 'B+③'], 'tb': (47, 48, 49, 50)},
 'workbook-math-1-use': {26: ['A①'], 27: ['B①', 'B②', 'B③', 'B④'], 'tb': (52, 53)},
 'workbook-math-1-moji1': {32: ['A①', 'A②', 'A③'], 33: ['A④', 'A⑤', 'B①', 'B+②'], 'tb': (60, 61, 62, 63)},
 'workbook-math-1-moji2': {34: ['A①', 'A②'], 35: ['A③', 'B①', 'B②', 'B+③'], 'tb': (64, 65)},
 'workbook-math-1-moji3': {36: ['A①', 'A②'], 37: ['A③', 'A④', 'B①', 'B②', 'B+③'], 'tb': (66, 67, 68)},
 'workbook-math-1-moji4': {38: ['A①', 'A②'], 39: ['A③', 'B①', 'B+②'], 'tb': (70, 71, 72)},
 'workbook-math-1-moji5': {40: ['A①', 'A②'], 41: ['A③', 'B①', 'B+②'], 'tb': (73, 74)},
 'workbook-math-1-moji6': {42: ['A①', 'A②'], 43: ['A③', 'B①', 'B+②'], 'tb': (75, 76, 77)},
 'workbook-math-1-moji7': {44: ['A①', 'A②'], 45: ['A③', 'B①', 'B+②'], 'tb': (76, 77)},
 'workbook-math-1-mojireview': {46: ['①', '②', '③', '④'], 47: ['⑤', '⑥', '⑦', '⑧'], 'tb': (66, 67, 68, 71, 73, 74, 76, 77)},
 'workbook-math-1-relation': {48: ['A①', 'A②'], 49: ['A③', 'B①', 'B②', 'B+③'], 'tb': (78, 79, 80, 81)},
 'workbook-math-1-eq1': {54: ['A①', 'B①', 'B+②'], 'tb': (90,)},
 'workbook-math-1-eq2': {55: ['A①', 'B①', 'B+②'], 'tb': (92, 93)},
 'workbook-math-1-solve1': {56: ['A①', 'A②'], 57: ['A③', 'B①', 'B+②'], 'tb': (94, 95)},
 'workbook-math-1-solve2': {58: ['A①', 'A②'], 59: ['A③', 'B①', 'B+②'], 'tb': (96, 97, 99)},
 'workbook-math-1-ratio': {60: ['A①', 'A②'], 61: ['A③', 'B①', 'B+②'], 'tb': (100, 101)},
 'workbook-math-1-eqreview': {62: ['①', '②', '③'], 63: ['④', '⑤', '⑥'], 'tb': (92, 95, 96, 97, 101)},
 'workbook-math-1-equse1': {64: ['A①', 'A②'], 65: ['A③', 'B①', 'B+②'], 'tb': (102, 104, 105, 106)},
 'workbook-math-1-equse2': {66: ['A①'], 67: ['A②', 'B①', 'B+②'], 'tb': (106, 107, 108)},
 'workbook-math-1-ratiouse': {68: ['A①', 'B①', 'B+②'], 'tb': (109,)},
 'workbook-math-1-equsereview': {69: ['①', '②', '③'], 'tb': (105, 107, 109)},
 'workbook-math-1-func': {74: ['A①', 'A②', 'B①'], 75: ['A③', 'B①', 'B②', 'B+③'], 'tb': (116, 117, 118)},
 'workbook-math-1-prop1': {76: ['A①', 'A②'], 77: ['A③', 'A④', 'B①', 'B+②'], 'tb': (120, 121, 122)},
 'workbook-math-1-prop2': {78: ['A①', 'A②'], 79: ['A③', 'A④', 'B①', 'B+②'], 'tb': (122, 124, 125)},
 'workbook-math-1-propgraph': {80: ['A①', 'A②'], 81: ['A③', 'B①', 'B+②'], 'tb': (126, 128)},
 'workbook-math-1-inv1': {82: ['A①', 'A②'], 83: ['A③', 'B①', 'B+②'], 'tb': (132, 133)},
 'workbook-math-1-invgraph': {84: ['A①', 'A②'], 85: ['A③', 'B①', 'B+②'], 87: ['⑥'], 'tb': (135, 136, 137)},
 'workbook-math-1-funcreview': {86: ['①', '②', '③'], 87: ['④', '⑤', '⑥'], 'tb': (122, 128, 133, 136)},
 'workbook-math-1-funcuse': {88: ['A①', 'A②'], 89: ['A③', 'B①', 'B+②'], 'tb': (140, 141, 142, 143)},
 'workbook-math-1-line': {94: ['A①', 'A②', 'A③', 'A④'], 95: ['A⑤', 'A⑥', 'B①', 'B+②'], 'tb': (150, 151, 152, 153, 154)},
 'workbook-math-1-move': {96: ['A①', 'A②', 'A③', 'A④'], 97: ['A⑤', 'A⑥', 'B①', 'B+②'], 'tb': (156, 157, 158, 159, 160, 161)},
 'workbook-math-1-draw1': {98: ['A①', 'A②', 'A③'], 99: ['A④', 'B①', 'B②', 'B+③'], 'tb': (162, 163)},
 'workbook-math-1-draw2': {100: ['A①', 'A②', 'A③', 'A④'], 101: ['B①', 'B②', 'B③', 'B④', 'B⑤', 'B+⑥'], 'tb': (153, 164, 165)},
 'workbook-math-1-drawuse': {102: ['A①'], 103: ['A②', 'B①', 'B+②'], 'tb': (159, 166, 167, 168)},
 'workbook-math-1-circle': {104: ['A①', 'A②', 'A③'], 105: ['A④', 'A⑤', 'B①', 'B+②'], 'tb': (170, 171, 172, 175)},
 'workbook-math-1-circlecalc': {106: ['A①', 'A②'], 107: ['A③', 'B①', 'B+②'], 109: ['⑦'], 'tb': (173, 174, 175, 176)},
 'workbook-math-1-georeview': {108: ['①', '②', '③', '④'], 109: ['⑤', '⑥', '⑦'], 'tb': (157, 163, 165, 168, 171, 176)},
 'workbook-math-1-solid1': {114: ['A①', 'A②', 'A③'], 115: ['A④', 'B①', 'B+②'], 'tb': (184, 185, 187, 188, 189)},
 'workbook-math-1-solid2': {116: ['A①', 'A②'], 117: ['A③', 'A④', 'B①', 'B+②'], 'tb': (189, 190, 191)},
 'workbook-math-1-spaceline': {118: ['A①', 'A②'], 119: ['A③', 'B①', 'B②', 'B+③'], 'tb': (194, 195, 196, 197)},
 'workbook-math-1-solidmake': {120: ['A①', 'A②', 'A③', 'A④'], 121: ['A⑤', 'A⑥', 'B①', 'B+②'], 'tb': (200, 201)},
 'workbook-math-1-volume': {122: ['A①', 'A②'], 123: ['A③', 'A④', 'B①', 'B②', 'B+③'], 'tb': (204, 205, 206, 207)},
 'workbook-math-1-surface1': {124: ['A①', 'A②'], 125: ['A③', 'B①', 'B②', 'B+③'], 'tb': (208, 209, 210)},
 'workbook-math-1-surface2': {126: ['A①', 'A②', 'B①', 'B+②'], 'tb': (211,)},
 'workbook-math-1-spaceuse': {127: ['A①', 'B①', 'B+②'], 'tb': (214, 215)},
 'workbook-math-1-solidreview': {128: ['①', '②', '③'], 129: ['④', '⑤', '⑥', '⑦'], 'tb': (189, 195, 196, 206, 207, 210, 211)},
 'workbook-math-1-hist1': {134: ['A①'], 135: ['A②', 'B①', 'B+②'], 'tb': (224, 225, 226)},
 'workbook-math-1-hist2': {136: ['A①', 'A②'], 137: ['A③', 'B①', 'B+②'], 'tb': (227, 228, 231)},
 'workbook-math-1-hist3': {138: ['A①', 'A②'], 139: ['B①', 'B+②', 'A②'], 'tb': (236, 237)},
 'workbook-math-1-prob': {140: ['A①'], 141: ['B①', 'B②', 'B+③'], 'tb': (240, 241, 242, 243)},
}
UNITS = {'workbook-math-1-addsub3': w1.build, 'workbook-math-1-muldiv1': muldiv.w2, 'workbook-math-1-muldiv2': muldiv.w3, 'workbook-math-1-muldiv3': muldiv.w4, 'workbook-math-1-calc1': calc.w5, 'workbook-math-1-calc2': calc.w6, 'workbook-math-1-review': review.w7, 'workbook-math-1-numworld': review.w8, 'workbook-math-1-use': review.w9, 'workbook-math-1-moji1': moji1.m1, 'workbook-math-1-moji2': moji1.m2, 'workbook-math-1-moji3': moji1.m3, 'workbook-math-1-moji4': moji2.m4, 'workbook-math-1-moji5': moji2.m5, 'workbook-math-1-moji6': moji2.m6, 'workbook-math-1-moji7': moji2.m7, 'workbook-math-1-mojireview': moji2.m8, 'workbook-math-1-relation': moji2.m9, 'workbook-math-1-eq1': eqs.e1, 'workbook-math-1-eq2': eqs.e2, 'workbook-math-1-solve1': eqs.e3, 'workbook-math-1-solve2': eqs.e4, 'workbook-math-1-ratio': eqs.e5, 'workbook-math-1-eqreview': eqs.e6, 'workbook-math-1-equse1': eqs.e7, 'workbook-math-1-equse2': eqs.e8, 'workbook-math-1-ratiouse': eqs.e9, 'workbook-math-1-equsereview': eqs.e10, 'workbook-math-1-func': func.f1, 'workbook-math-1-prop1': func.f2, 'workbook-math-1-prop2': func.f3, 'workbook-math-1-propgraph': func.f4, 'workbook-math-1-inv1': func.f5, 'workbook-math-1-invgraph': func.f6, 'workbook-math-1-funcreview': func.f7, 'workbook-math-1-funcuse': func.f8, 'workbook-math-1-line': geo.g1, 'workbook-math-1-move': geo.g2, 'workbook-math-1-draw1': geo.g3, 'workbook-math-1-draw2': geo.g4, 'workbook-math-1-drawuse': geo.g5, 'workbook-math-1-circle': geo.g6, 'workbook-math-1-circlecalc': geo.g7, 'workbook-math-1-georeview': geo.g8, 'workbook-math-1-solid1': solid.s1, 'workbook-math-1-solid2': solid.s2, 'workbook-math-1-spaceline': solid.s3, 'workbook-math-1-solidmake': solid.s4, 'workbook-math-1-volume': solid.s5, 'workbook-math-1-surface1': solid.s6, 'workbook-math-1-surface2': solid.s7, 'workbook-math-1-spaceuse': solid.s8, 'workbook-math-1-solidreview': solid.s9, 'workbook-math-1-hist1': data.d1, 'workbook-math-1-hist2': data.d2, 'workbook-math-1-hist3': data.d3, 'workbook-math-1-prob': data.d4}
def main(only=None):
    bad = 0
    for uid, fn in UNITS.items():
        if only and uid not in only: continue
        u = fn(); data = u.json(); errs = check(data, ALLOWED[uid])
        print(uid, len(data['questions']), 'OK' if not errs else f'NG {len(errs)}')
        for e in errs[:15]: print('  ', e)
        if errs: bad += 1; continue
        (OUT / f'{uid}.json').write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    sys.exit(1 if bad else 0)
if __name__ == '__main__': main(sys.argv[1:])
