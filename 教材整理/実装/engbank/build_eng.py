"""英語の70問の小単元を作って検査し、教材整理/確認済み/ に書き出す（台帳・単元一覧も更新）。
python3 build_eng.py で検査だけ、--write で書き出し。"""
import sys
from eng import SPREAD_TITLES, file_info
from check_e import make_check
from kbuild import build
import review, l1, l2, l3, l4, l5, l6, l7, l8, l9, words
UNITS = [review.review, l1.l1a, l1.l1b, l2.l2, l3.l3a, l3.l3b, l4.l4a, l4.l4b, l5.l5, l6.l6a, l6.l6b, l7.l7, l8.l8, l9.l9, words.words]
VIEWED = {p for l in SPREAD_TITLES for p in ((l,) if l == 120 else (l, l + 1))}
if __name__ == '__main__':
    build(UNITS, make_check(VIEWED), file_info(), subject='英語', area='英語', row_filter=lambda r: True, write='--write' in sys.argv)
