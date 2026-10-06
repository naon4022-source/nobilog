#!/usr/bin/env python3
"""しくみの図（D01）を書き出す（Claude）。python3 make_d01.py kokugo1 …"""
import sys, importlib
from common import lessons, media
MOD = {'kokugo1': 'd01_kokugo', 'english1': 'd01_english', 'science1': 'd01_science', 'geography': 'd01_geography', 'history': 'd01_history'}
for book in sys.argv[1:]:
    m = importlib.import_module(MOD[book]); out = media(book); n = 0
    for code, U, L in lessons(book):
        if code not in m.FIG: print('図がない', code); continue
        (out / f'{code}-D01.svg').write_text(m.D(code), encoding='utf-8'); n += 1
    print(book, 'D01', n)
