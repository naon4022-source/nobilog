"""社会（地理・歴史）の70問の小単元を作って検査し、教材整理/確認済み/ に書き出す（台帳・単元一覧も更新）。
python3 build_soc.py geo（検査だけ）／ python3 build_soc.py geo --write（書き出し）。歴史は hist。"""
import sys
from soc import GEO_VIEWED, GEO_INFO
from check_s import make_check
from kbuild import build
import geo1, geo2, geo3, geo4
GEO_UNITS = [geo1.sekai, geo1.idokeido, geo1.jisa, geo2.nihon, geo2.kikou, geo2.seikatsu, geo3.asia, geo3.europe, geo3.africa,
             geo4.namerica, geo4.samerica, geo4.oceania]
if __name__ == '__main__':
    write = '--write' in sys.argv
    if 'geo' in sys.argv:
        build(GEO_UNITS, make_check(GEO_VIEWED), GEO_INFO, subject='社会', area='地理', row_filter=lambda r: r['major'] == '地理', write=write)
    if 'hist' in sys.argv:
        import hist_units
        from soc import HIST_VIEWED, HIST_INFO
        build(hist_units.UNITS, make_check(HIST_VIEWED), HIST_INFO, subject='社会', area='歴史', row_filter=lambda r: r['major'] == '歴史', write=write)
