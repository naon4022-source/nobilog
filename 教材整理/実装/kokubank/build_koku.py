"""国語の70問の小単元を作って検査し、教材整理/確認済み/ に書き出す（台帳・単元一覧も更新）。
python3 build_koku.py で検査だけ、--write で書き出し。"""
import sys
from koku import VIEWED, INFO
from check_kk import make_check
from kbuild import build
import kanji, chishiki, bunpo, koten, yomu
UNITS = [kanji.kanji1, kanji.kanji2, kanji.kanji3, chishiki.kanjichishiki, bunpo.bunpo1, bunpo.bunpo2, koten.kobun, koten.kanbun,
         yomu.shi, yomu.setsumei, yomu.bungaku, yomu.kaku]
if __name__ == '__main__':
    build(UNITS, make_check(VIEWED), INFO, subject='国語', area='国語', row_filter=lambda r: True, write='--write' in sys.argv)
