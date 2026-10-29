"""Independent exact arithmetic for the21 new mathematics questions; not the app grader."""
from pathlib import Path
from fractions import Fraction as F
import json,statistics,hashlib
p=Path(__file__).parent/'clarity';d=json.loads((p/'ai-review-practice-data.mjs').read_text().removeprefix('export default ').rstrip().removesuffix(';'));qs={q['id']:q for q in d['questions']}
checks=[]
def verify(ident,value,expected,prefix):
 assert value==expected,(ident,value,expected)
 q=qs[ident];label=q['answer']['accepted'][0];choice=next(x[2:] for x in q['prompt'].splitlines() if x.startswith(label+'　'))
 assert choice.startswith(prefix),(ident,choice,prefix)
 checks.append({'id':ident,'exactResult':str(value),'correctOption':label,'correctOptionPrefix':prefix})
verify('review-negcmp-01-c1',max(F('-2.5'),F(-9,4)),F(-9,4),'−9/4。')
verify('review-negcmp-02-c1',sorted([F('-0.3'),F(-1,4),F(-2,7)]),[F(-3,10),F(-2,7),F(-1,4)],'−0.3、−2/7、−1/4。')
verify('review-negcmp-03-c1',min(F('-1.6'),F(-8,5),F('-1.65'),F(-5,3)),F(-5,3),'−5/3。')
verify('review-absrng-01-c1',len([n for n in range(-10,11) if abs(n)<=3]),7,'7 個。')
verify('review-absrng-02-c1',[n for n in range(-10,11) if 2<abs(n)<5],[-4,-3,3,4],'−4、−3、3、4。')
verify('review-absrng-03-c1',sum(n for n in range(-10,0) if abs(n)<=4),-10,'−10。')
verify('review-adddiff-01-c1',6-11,-5,'−5。')
verify('review-adddiff-02-c1',F(-5,6)+F(1,4),F(-7,12),'−7/12。')
verify('review-adddiff-03-c1',-6-2,-8,'−8。')
verify('review-subsign-01-c1',-7-5,-12,'−12。')
verify('review-subsign-02-c1',-4-(3-9),2,'2。')
verify('review-subsign-03-c1',F('-.8')-F('-1.25'),F(9,20),'0.45。')
verify('review-sector-01-c1',2*9*F(80,360),F(4),'2π×9×80/360。')
verify('review-sector-02-c1',360*F(6,6*6),F(60),'60°。')
verify('review-sector-03-c1',F(8)/(2*F(120,360)),F(12),'12 cm。')
verify('review-cone-01-c1',3*9,27,'27π cm²。')
verify('review-cone-02-c1',360*F(4,10),F(144),'144°。')
verify('review-cone-03-c1',2*6+2*2,16,'16π cm²。')
verify('review-data-01-c1',statistics.median([F(n) for n in [12,7,15,9,20,11,8,14]]),F(23,2),'11.5。')
verify('review-data-02-c1',F(sum([(10,20),(20,30),(30,40)][[3,8,5].index(max([3,8,5]))]),2),F(25),'25。')
values=[3,5,5,6,8,9];mean=F(sum(values),len(values));median=statistics.median([F(v) for v in values]);mode=statistics.mode(values)
assert (mean,median,mode)==(6,F(11,2),5)
verify('review-data-03-c1',max([(mean,'mean'),(median,'median'),(mode,'mode')])[1],'mean','平均値。')
# Re-check the corrected distractor's implied calculation and unchanged correct radius.
assert F(8,2)==4 and F(8,2)*F(360,120)==12
assert len(checks)==21
(p/'content-arithmetic-result.json').write_text(json.dumps({'status':'passed','questions':21,'items':checks,'candidateSha256':hashlib.sha256((p/'ai-review-practice-data.mjs').read_bytes()).hexdigest(),'scope':'Independent exact fractions and elementary geometry/statistics calculations for all21 new mathematics questions, selected actual option checked. Not server/UI/source-photo verification.'},ensure_ascii=False,indent=2)+'\n')
print('Independent arithmetic:21 new mathematics questions passed; corrected distractor4 and actual radius12 are consistent.')
