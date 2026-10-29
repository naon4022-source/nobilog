import sys
from mcommon import VIEWED, file_info
from dbuild import build
import mdrill_a, mdrill_b, mdrill_c, mdrill_d, mdrill_e, mdrill_f, mdrill_g
UNITS = [mdrill_a.unit, mdrill_b.unit, mdrill_c.unit, mdrill_d.unit, mdrill_e.unit, mdrill_f.unit, mdrill_g.unit]
if __name__ == '__main__':
    build(UNITS, subject='数学', viewed=VIEWED, file_info=file_info(), area='数学', write='--write' in sys.argv)
