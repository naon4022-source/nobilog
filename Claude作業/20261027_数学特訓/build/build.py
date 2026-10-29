"""特訓70問の下書きを 教材整理/特訓下書き/ に書き出す。使い方: python3 build.py [小単元キー ...]"""
import sys, importlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from units import ORDER
for key in sys.argv[1:] or [k for k in ORDER if (Path(__file__).resolve().parent / f'u_{k}.py').exists()]:
    U = importlib.import_module('u_' + key).U
    print(U.write().name, len(U.qs))
