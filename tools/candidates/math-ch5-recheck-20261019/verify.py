"""Chapter5 only: independently decode the existing 12 videos; never overwrite prior media or audits."""
from pathlib import Path
HERE=Path(__file__).resolve().parent
base=HERE.parent/'math-ch2-recheck-20261018/verify.py'
text=base.read_text()
for before,after in [("x['id'].startswith('M1-C2-')","x['id'].startswith('M1-C5-')"),('assert len(items) == 13','assert len(items) == 12'),('点検/20261018_章別再点検/M1-C2_再復号.json','点検/20261019_章別再点検/M1-C5_再復号.json'),('nobi-math-ch2-frames-20261018-','nobi-math-ch5-frames-20261019-'),('数学2章13本の再復号成功','数学5章12本の再復号成功')]:
 assert text.count(before)==1,before
 text=text.replace(before,after,1)
destination=HERE.parents[2]/'教材整理/Claude_Codex共有/数学全体制作/メディア/点検/20261019_章別再点検/M1-C5_再復号.json'
assert not destination.exists(),'Inspect existing report instead of overwriting or repeating a completed audit'
exec(compile(text,str(base),'exec'),{'__file__':str(base),'__name__':'__main__'})
