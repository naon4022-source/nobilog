"""Reuse the exact AV/scene-audit assertions already used for chapter 2, for chapter 3 only."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
base = HERE.parent / 'math-ch2-recheck-20261018/verify.py'
text = base.read_text()
changes = [
    ("x['id'].startswith('M1-C2-')", "x['id'].startswith('M1-C3-')"),
    ('assert len(items) == 13', 'assert len(items) == 11'),
    ('点検/20261018_章別再点検/M1-C2_再復号.json', '点検/20261019_章別再点検/M1-C3_再復号.json'),
    ('nobi-math-ch2-frames-20261018-', 'nobi-math-ch3-frames-20261019-'),
    ('数学2章13本の再復号成功', '数学3章11本の再復号成功'),
]
for before, after in changes:
    assert text.count(before) == 1, before
    text = text.replace(before, after, 1)
destination = HERE.parents[2] / '教材整理/Claude_Codex共有/数学全体制作/メディア/点検/20261019_章別再点検/M1-C3_再復号.json'
assert not destination.exists(), 'Existing chapter-3 result must be inspected, not overwritten or redundantly rerun'
exec(compile(text, str(base), 'exec'), {'__file__': str(base), '__name__': '__main__'})
