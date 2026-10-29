#!/usr/bin/env python3
# 国語1は build-textbook-subject.py（4教科共通）で作る。このファイルは前の呼び方のための入口。
import runpy, sys
sys.argv = [sys.argv[0], 'kokugo1'] + [a for a in sys.argv[1:] if a.startswith('--')]
runpy.run_path(str(__import__('pathlib').Path(__file__).with_name('build-textbook-subject.py')), run_name='__main__')
