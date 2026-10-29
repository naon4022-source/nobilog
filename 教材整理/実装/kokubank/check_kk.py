"""社会の70問の検査（英語と同じ check_e を使う：理科の check_k ＋目視したページ・単元をまたいだ重なり・verify-material-marks と同じ正答）"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'engbank'))
from check_e import make_check
