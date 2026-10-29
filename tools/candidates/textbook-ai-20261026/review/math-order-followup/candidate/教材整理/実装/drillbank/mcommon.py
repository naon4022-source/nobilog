"""数学ドリル（ドリル/数学 52枚。名前順 k番目の写真＝p(2+2k)〜p(3+2k)。Claude が目視で確認）の共通部品"""
import sys, math, itertools
from pathlib import Path
from fractions import Fraction as F
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'mathbank'))
from bank import Unit, expr_q, num_answer, nums_answer, choice_answer, exact_answer, rng, explain, expr_answer, relation_answer, PAGES
from helpers import rint, rfrac, rdec
from expr import C, L, D, Lit, Grp, Pow, Neg, show, fmt_num, ans_str, dec_str

import unicodedata as _ud
# 台帳の「ドリル/…」のファイル名は NFD（濁点が分かれた形）で登録されているので、それに合わせる
PAGES['drill'] = {k: _ud.normalize('NFD', v) for k, v in PAGES['drill'].items()}

class DUnit(Unit):
    def __init__(self, uid, title, major, note=''):
        super().__init__(uid, 'drill', title, major, note)

def fill(u, plan, n=115, limit=60000):
    """plan をくり返して n 問そろえる（同じ問題文は入らない）。最後の15問が確認テストになるので、作り方がまざるように順番に回す"""
    i = 0
    while len(u.qs) < n:
        try: plan[i % len(plan)]()
        except (ZeroDivisionError, IndexError, ValueError, AssertionError): pass
        i += 1
        if i > limit: raise SystemExit(f'{u.uid}: {len(u.qs)}問しか作れない')
    u.qs = u.qs[:n]
    return u

def nice(v, dmax=12, amax=400): return v.denominator <= dmax and abs(v) <= amax
def num(v): return num_answer(F(v))
def fx(v):
    """表示用の数（分数は a/b、負は −）"""
    return fmt_num(F(v))

# 写真で全体を目視した見開き（左ページ → 見出し）
TITLES = {4: '正負の数の加減', 6: '正負の数の加減（標準問題）', 8: '正負の数の乗除', 10: '正負の数の四則計算', 12: '正負の数の利用（基準・素因数分解）',
          14: '正負の数 実力問題①', 16: '正負の数 実力問題②', 18: '文字式の表し方', 20: '数量を表す式', 22: '文字と式（標準問題）', 24: '1次式の計算',
          26: '1次式の計算（標準問題）', 28: '文字式の利用（代入・等式・不等式・規則性）', 30: '文字と式 実力問題①', 32: '文字と式 実力問題②',
          34: '1次方程式の解き方', 36: 'いろいろな1次方程式', 38: '1次方程式（標準問題）', 40: '1次方程式の利用', 42: '1次方程式の利用（標準問題）',
          44: '1次方程式 実力問題①', 46: '1次方程式 実力問題②', 48: '比例と反比例', 50: '比例と反比例（標準問題）', 52: '座標とグラフ',
          54: '座標とグラフ（標準問題）', 56: '比例と反比例の利用', 58: '比例と反比例の利用（標準問題）', 60: '比例と反比例 実力問題①',
          62: '比例と反比例 実力問題②', 64: '図形の移動', 66: '図形の移動（標準問題）', 68: 'いろいろな作図', 70: 'いろいろな作図（標準問題）',
          72: 'おうぎ形', 74: 'おうぎ形（標準問題）', 80: '直線や平面の位置関係', 82: '立体のいろいろな見方', 86: '立体の表面積と体積',
          88: '立体の表面積と体積（標準問題）', 90: '立体の切断', 96: 'データの整理', 98: 'データの整理（標準問題）',
          76: '平面図形 実力問題①', 78: '平面図形 実力問題②', 84: '立体のいろいろな見方（標準問題）', 92: '空間図形 実力問題①',
          94: '空間図形 実力問題②', 100: 'データの整理 実力問題', 102: '総仕上げテスト', 104: '総仕上げテスト（つづき）'}
SINGLE = {104}  # 最後の写真は p104 の1ページだけ
def spread(l): return [l] if l in SINGLE else [l, l + 1]
VIEWED = {p for l in TITLES for p in spread(l)}
def file_info():
    return {PAGES['drill'][l]: (spread(l), t) for l, t in TITLES.items()}

MI = '−'
def term(c, v, first=False, disp=True):
    """係数 c と文字 v の項を文字にする（disp=True は表示用の −、False は採点用の -）"""
    c = F(c); m = MI if disp else '-'
    if c == 0: return ''
    sgn = '' if first and c > 0 else (('+' if not disp else ' ＋ ') if c > 0 else ((m if first else (' ' + m + ' ') if disp else m)))
    if first and c < 0: sgn = m
    a = abs(c)
    if v:
        body = (v if a == 1 else (str(a) + v if a.denominator == 1 else (f'{a.numerator}/{a.denominator}{v}' if not disp else f'{a.numerator}/{a.denominator}{v}')))
    else:
        body = str(a.numerator) if a.denominator == 1 else f'{a.numerator}/{a.denominator}'
    return sgn + body
def lin(a, b, v='x', disp=False):
    """a v + b（採点用の文字列。disp=True で表示用）"""
    s = term(a, v, True, disp)
    t = term(b, '', not s, disp)
    return (s + t) or '0'
