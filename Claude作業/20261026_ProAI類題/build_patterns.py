# coding: utf-8
# Claude 2026-10-26：Codex候補30問（5教科10パターン）に不足するパターンの追加候補。原本・問題バンクには書きこまない。
import json, hashlib
from fractions import Fraction as F
from pathlib import Path
ROOT = Path('/Users/shimizunaotomoo/Desktop/my-app')
bank = json.loads((ROOT/'site-assets/material-bank.json').read_text())
QS = {q['id']: (u['id'], q) for u in bank['units'] for q in u['questions']+u.get('tests', [])}
P, Q = [], []
def pat(pid, subject, cause, purpose, comment, sources, unit):
    for s in sources: assert s in QS and QS[s][0]==unit, (s, unit)
    assert len(comment) <= 70, (pid, len(comment))
    P.append(dict(id=pid, subject=subject, grade=1, causeToCheck=cause, purpose=purpose, commentExample=comment,
                  sources=[dict(unitId=unit, questionId=s) for s in sources], practiceIds=[]))
def q(pid, qid, prompt, opts, ans, expl, why, check=None, src=None):
    letters = 'アイウ'
    assert len(opts) == 3 and ans in letters
    body = prompt + '\nア・イ・ウの1字で答えよう。\n' + '\n'.join(f'{l}　{o}' for l, o in zip(letters, opts))
    item = dict(id=qid, patternId=pid, type='input', difficulty='hard', prompt=body,
                answer=dict(kind='exact', accepted=[ans]), explanation=expl, whyThisChecksCause=why,
                appliesToSourceIds=src or [s['questionId'] for s in P[-1]['sources']])
    if check: item['numericCheck'] = dict(expression=check[0], expected=str(check[1]))
    Q.append(item); P[-1]['practiceIds'].append(qid)

# ── 数学：文字式の表し方 ──
pat('math-expression-notation', '数学', '×・÷を省くときの約束（数を前、同じ文字は累乗、÷は分数、1は書かない）を使えたかを確かめる。誤答理由を本人へ断定しない。',
    '文字式の書き方の約束の確認', '数は文字の前、同じ文字は指数、÷は分数。約束を一つずつ当てはめて確かめよう。',
    ['drill-math-1-moji-test-9', 'drill-math-1-moji-test-11', 'drill-math-1-moji-test-14', 'drill-math-1-moji-test-15'], 'drill-math-1-moji')
q('math-expression-notation', 'review-math-notation-01', 'b×x×x×3 を、×を使わない式に直す。正しい式と理由はどれか。',
  ['b3x²。かけ算の順番どおりに、出てきた順に並べる。', '3bx²。数を文字の前に書き、同じ文字xの積は指数で表す。', '3b2x。同じ文字が2つあるので、2をかけた形にする。'],
  'イ', 'イ。数3を前に、文字はb、xの順に並べ、x×xはx²と書きます。2xはx＋xの意味なので、x×xとは別の式です。',
  '答えの式だけでなく、数の位置と同じ文字の積の表し方という2つの約束を区別できるかを問う。')
q('math-expression-notation', 'review-math-notation-02', '−x÷6 を、÷を使わない式に直す。正しい式と理由はどれか。',
  ['−x/6（6分の−x）。÷6は「6でわる」ので、6を分母にした分数で表す。', '−6/x（x分の−6）。÷の後ろの数を分子にして、わられる数を分母にする。', '−6x。÷も×と同じように記号を省いて、数を前に書く。'],
  'ア', 'ア。a÷b＝a/bなので、−x÷6＝−x/6です。分子と分母を逆にすると別の式になり、÷を×のように省くこともできません。',
  'わる数を分母にするという、÷の約束を×の約束と混同していないかを確かめる。')
q('math-expression-notation', 'review-math-notation-03', '(−1)×x×y を、×を使わない式に直す。正しい式と理由はどれか。',
  ['−1xy。かけた数はそのまま残し、文字の前に書く。', 'xy(−1)。負の数は、かっこを付けて文字の後ろに書く。', '−xy。数は前に書き、−1をかける場合は1を書かずに−だけを書く。'],
  'ウ', 'ウ。1×aはa、(−1)×aは−aと書きます。−1xyは値は同じでも、文字式の書き方の約束に合いません。数は文字の前に書きます。',
  '係数が1や−1のときの省き方という、見落としやすい約束を確かめる。')

# ── 数学：方程式の移項 ──
pat('math-equation-transposition', '数学', '移項するときに符号を変えたか、すべての項に同じ操作をしたかを確かめる。誤答理由を本人へ断定しない。',
    '移項と等式の性質の確認', '項を反対の辺へ動かすときは符号が変わるよ。両辺に同じ操作をしたか、代入でも確かめよう。',
    ['drill-math-1-equation-test-3', 'drill-math-1-equation-test-9', 'drill-math-1-equation-test-5'], 'drill-math-1-equation')
q('math-equation-transposition', 'review-math-transpose-01', '9x−10＝7x−22 を解く。移項した式と解が両方正しいものはどれか。',
  ['9x−7x＝−22−10 なので x＝−16。左辺の−10は、符号を変えずに右辺へ移す。', '9x−7x＝−22＋10 なので x＝−6。−10は右辺へ移すと＋10、7xは左辺へ移すと−7xになる。', '9x＋7x＝−22＋10 なので x＝−3/4。文字の項は、移しても符号を変えない。'],
  'イ', 'イ。2x＝−12、x＝−6。代入すると左辺9×(−6)−10＝−64、右辺7×(−6)−22＝−64で等しくなります。',
  '数の項と文字の項の両方で、移項するときに符号を変えられるかを分けて確かめる。', ('(-22+10)/(9-7)', -6))
q('math-equation-transposition', 'review-math-transpose-02', '3x−15＝5x−5 を解く。途中の式と解が両方正しいものはどれか。',
  ['3x−5x＝−5＋15 として −2x＝10、x＝5。わるときは数の大きさだけを見ればよい。', '3x−5x＝−5−15 として −2x＝−20、x＝10。−15は符号を変えずに右辺へ移す。', '3x−5x＝−5＋15 として −2x＝10、x＝−5。両辺を−2でわるので、符号も考える。'],
  'ウ', 'ウ。−2x＝10の両辺を−2でわると、x＝−5。代入すると3×(−5)−15＝−30、5×(−5)−5＝−30で等しくなります。',
  '移項の符号と、負の係数でわるときの符号という、2か所のどちらで崩れたかを分けて確かめる。', ('(-5+15)/(3-5)', -5))
q('math-equation-transposition', 'review-math-transpose-03', '−1.7x−1.8＝−0.6x＋0.4 を、両辺を10倍してから解く。10倍した式と解が両方正しいものはどれか。',
  ['−17x−18＝−6x＋4 なので、x＝−2。両辺のすべての項を10倍する。', '−17x−18＝−0.6x＋0.4 なので、xは小数になる。小数のある左辺だけを10倍する。', '−17x−18＝−6x＋0.4 なので、x＝−18.4÷11。文字の項だけを10倍すればよい。'],
  'ア', 'ア。等式の性質では、両辺の全部の項に同じ数をかけます。−11x＝22、x＝−2。代入すると左右とも1.6になります。',
  '小数の方程式で、10倍を一部の項にだけかけていないかを確かめる。', ('(4+18)/(-17+6)', -2))

# ── 数学：比例・反比例 ──
pat('math-proportion-inverse', '数学', '比例ではy/x、反比例ではxyが一定という、関係の見分けと定数の求め方を確かめる。誤答理由を本人へ断定しない。',
    '比例と反比例の見分けの確認', '比例ならy÷x、反比例ならx×yが一定だよ。どちらの関係かを先に決めてから式にしよう。',
    ['drill-math-1-proportion-test-6', 'drill-math-1-proportion-test-7', 'drill-math-1-proportion-test-10', 'drill-math-1-proportion-test-1'], 'drill-math-1-proportion')
q('math-proportion-inverse', 'review-math-prop-01', 'yはxに反比例し、x＝−4のときy＝6である。y＝3のときのxの値と理由が両方正しいものはどれか。',
  ['x＝−2。yが半分になったので、xも半分になる。', 'x＝−2。y÷xが一定なので、6÷(−4)と同じになるxを探す。', 'x＝−8。x×yが−24で一定なので、x＝−24÷3になる。'],
  'ウ', 'ウ。反比例ではxyが一定で、(−4)×6＝−24。−24÷3＝−8。yが半分になればxは2倍になります。−8×3＝−24で確かめられます。',
  '反比例を比例と同じ「同じ割合で増減する」関係として扱っていないかを確かめる。', ('(-4*6)/3', -8))
q('math-proportion-inverse', 'review-math-prop-02', '24kmの道のりを時速xkmで進むとき、かかる時間をy時間とする。xとyの関係と理由が両方正しいものはどれか。',
  ['反比例。x×y＝24で、道のりが一定だから。', '比例。xが大きくなると、yも決まった割合で変わるから。', 'どちらでもない。xが大きくなるとyが小さくなるので、式に表せないから。'],
  'ア', 'ア。速さ×時間＝道のりなので、xy＝24。xが2倍になればyは半分です。式y＝24/xで表せます。',
  '「片方が増えると片方が減る」という印象だけでなく、積が一定かどうかで判断できるかを問う。')
q('math-proportion-inverse', 'review-math-prop-03', '点(−3, □)が y＝18/x のグラフ上にある。□の求め方と値が両方正しいものはどれか。',
  ['18×(−3)＝−54。比例と同じように、xに18をかける。', '18÷(−3)＝−6。y＝18/xにx＝−3を代入する。', '18÷3＝6。座標の値は、符号を外して計算する。'],
  'イ', 'イ。y＝18/(−3)＝−6。(−3)×(−6)＝18でxyが一定になることも確かめられます。',
  '反比例の式への代入で、比例の式と混同したり、負の符号を落としたりしていないかを確かめる。', ('18/(-3)', -6))

# ── 理科：光の反射 ──
pat('science-reflection-angle', '理科', '入射角・反射角を、鏡の面ではなく鏡に垂直な線（法線）からの角として読めたかを確かめる。誤答理由を本人へ断定しない。',
    '反射角の測り方の確認', '入射角と反射角は、鏡に垂直な線からの角だよ。図に垂直な線を引いて、どの角か確かめよう。',
    ['drill-science-1-phenomena-test-9'], 'drill-science-1-phenomena')
q('science-reflection-angle', 'review-sci-reflect-01', '鏡の面と入ってくる光のなす角が30°だった。反射角と理由が両方正しいものはどれか。',
  ['60°。反射角は鏡に垂直な線（法線）からの角なので、90°−30°になる。', '30°。鏡の面と光がつくる角が、そのまま反射角になる。', '60°。入ってくる光の角を2倍すると、反射角になる。'],
  'ア', 'ア。入射角も反射角も、鏡に垂直な線からはかります。90−30＝60で入射角60°、反射の法則で反射角も60°です。ウは答えの数だけが同じで、理由が正しくありません。',
  '数値が合っても理由が違う選択肢を置き、法線からはかる理由まで確かめる。', ('90-30', 60))
q('science-reflection-angle', 'review-sci-reflect-02', '入射角が40°のとき、鏡に入ってくる光と反射した光のなす角と理由が両方正しいものはどれか。',
  ['40°。入射角と反射角は等しいので、2本の光のなす角も40°になる。', '100°。180°から入射角と反射角をひく。', '80°。2本の光は法線の両側にあり、入射角40°と反射角40°を合わせた角になる。'],
  'ウ', 'ウ。法線をはさんで入射角40°と反射角40°があるので、2本の光のなす角は80°です。図に法線をかくと分かります。',
  '入射角と、光どうしのなす角を区別できるかを確かめる。', ('40+40', 80))
q('science-reflection-angle', 'review-sci-reflect-03', '光が鏡の面に垂直に当たった。入射角と、反射した光の進み方が両方正しいものはどれか。',
  ['入射角は90°。光は鏡の面に沿って進む。', '入射角は0°。光は来た道をそのまま逆向きにもどる。', '入射角は45°。光はななめに反射する。'],
  'イ', 'イ。鏡に垂直な光は法線と重なるので、入射角は0°、反射角も0°で、同じ道をもどります。鏡の面との角90°と混同しないようにします。',
  '鏡の面との角と入射角の取りちがいを、極端な場合で確かめる。')

# ── 理科：地震のゆれの伝わり方 ──
pat('science-quake-distance', '理科', '初期微動継続時間が震源からの距離に比例することと、P波・S波の時間差から距離を出す考え方を確かめる。誤答理由を本人へ断定しない。',
    '初期微動継続時間と距離の確認', 'P波とS波が届く時刻の差が、距離とともにどう変わるかを考えよう。1kmあたりの差も使えるよ。',
    ['drill-science-1-earth-test-3', 'drill-science-1-earth-test-9', 'drill-science-1-earth-test-12'], 'drill-science-1-earth')
q('science-quake-distance', 'review-sci-quake-01', '震源からの距離が40kmの地点で、初期微動継続時間が8秒だった。同じ地震で、震源からの距離が120kmの地点の初期微動継続時間と理由が両方正しいものはどれか。',
  ['8秒。同じ地震なら、初期微動継続時間はどの地点でも同じだから。', '24秒。初期微動継続時間は震源からの距離に比例し、距離が3倍だから。', '3秒。震源から遠いほど、ゆれが弱くなって短くなるから。'],
  'イ', 'イ。P波とS波は同時に出て、遠いほど届く時刻の差が開きます。120÷40＝3倍なので、8×3＝24秒です。',
  '「同じ地震だから同じ」「遠いほど弱いから短い」という考えと、距離に比例する考えを区別できるかを問う。', ('8*120/40', 24))
q('science-quake-distance', 'review-sci-quake-02', 'P波の速さが6km/s、S波の速さが4km/sの地震で、ある地点の初期微動継続時間は2秒だった。震源からの距離の求め方と値が両方正しいものはどれか。',
  ['6×2＝12km。P波の速さに初期微動継続時間をかける。', '(6−4)×2＝4km。速さの差に時間をかける。', '24km。1kmあたりでS波はP波より1/4−1/6＝1/12秒おそいので、2÷(1/12)で求める。'],
  'ウ', 'ウ。距離xkmのとき、x/4−x/6＝2なので、x/12＝2、x＝24。確かめ：24÷6＝4秒、24÷4＝6秒で、差は2秒です。',
  '初期微動継続時間を、片方の波の速さだけや速さの差だけで扱っていないかを確かめる。', ('2*4*6/(6-4)', 24))
q('science-quake-distance', 'review-sci-quake-03', 'P波の速さが8km/sの地震で、震源から96km離れた地点にP波が届くのは、地震発生の何秒後か。求め方と値が両方正しいものはどれか。',
  ['96÷8＝12秒後。かかった時間は、距離を速さでわって求める。', '8×96＝768秒後。速さと距離をかけると時間になる。', '96÷8÷2＝6秒後。音の反射と同じように、往復なので2でわる。'],
  'ア', 'ア。時間＝距離÷速さ＝96÷8＝12秒。P波は震源から地点へ片道で届くので、2でわりません。',
  '速さ・時間・距離の関係と、片道か往復かを、音の問題と混同していないかを確かめる。', ('96/8', 12))

# ── 理科：ばねののび ──
pat('science-spring-extension', '理科', 'ばねの「のび」が力に比例することと、全体の長さとのびの区別ができたかを確かめる。誤答理由を本人へ断定しない。',
    'ばねののびと全体の長さの確認', '比例するのは「のび」だよ。全体の長さから元の長さを引いてから、おもりの重さを考えよう。',
    ['drill-science-1-phenomena-test-8', 'drill-science-1-phenomena-test-14', 'drill-science-1-phenomena-test-4'], 'drill-science-1-phenomena')
q('science-spring-extension', 'review-sci-spring-01', 'あるばねは、10gのおもりをつるすと2cmのびる。このばねが6cmのびたとき、つるしたおもりの質量と理由が両方正しいものはどれか。',
  ['12g。のびの6cmに、最初のおもりの2倍をかける。', '16g。のびが4cm増えたので、10gに6gを足す。', '30g。のびはおもりの重さに比例し、のびが3倍なので、おもりも3倍になる。'],
  'ウ', 'ウ。6÷2＝3倍のびたので、おもりも10×3＝30gです。1cmのびるのに5g必要、と考えても6×5＝30gになります。',
  'のびと力の比例を、足し算や別の数のかけ算で処理していないかを確かめる。', ('10*6/2', 30))
q('science-spring-extension', 'review-sci-spring-02', '何もつるさないときの長さが10cmのばねがあり、10gのおもりで2cmのびる。ばね全体の長さが16cmになったとき、つるしたおもりの質量と理由が両方正しいものはどれか。',
  ['80g。全体の長さ16cmが、おもりによるのびだから。', '30g。のびは16−10＝6cmで、2cmあたり10gなので3倍になる。', '16g。全体の長さが10cmの1.6倍なので、おもりも1.6倍になる。'],
  'イ', 'イ。力に比例するのは「のび」です。16−10＝6cm、6÷2＝3倍で、10×3＝30g。全体の長さは、おもりがなくても10cmあります。',
  '全体の長さとのびを区別して、比例を当てはめられるかを確かめる。', ('10*(16-10)/2', 30))
q('science-spring-extension', 'review-sci-spring-03', 'ばねAは10gのおもりで2cm、ばねBは10gのおもりで5cmのびる。それぞれに20gのおもりをつるしたとき、のびの差と理由が両方正しいものはどれか。',
  ['6cm。Aは2倍で4cm、Bは2倍で10cmのびるので、10−4になる。', '3cm。のびの差は、おもりの重さに関係なく5−2のままになる。', '14cm。2本ののびを合わせた長さが差になる。'],
  'ア', 'ア。それぞれのばねで比例を使い、Aは4cm、Bは10cmです。差は6cm。おもりが2倍なら、のびの差も3cmの2倍になります。',
  '2本のばねの比例を別々に当てはめ、差も比例して変わることを確かめる。', ('(5-2)*20/10', 6))

# 検査
import subprocess
letters = [x['answer']['accepted'][0] for x in Q]
assert len({x['id'] for x in Q}) == len(Q) and len({x['prompt'] for x in Q}) == len(Q)
for x in Q:
    if 'numericCheck' in x:
        v = eval(x['numericCheck']['expression'], {'F': F})
        assert F(v).limit_denominator(1000) == F(x['numericCheck']['expected']), x['id']
old = json.loads((ROOT/'tools/candidates/textbook-ai-20261026/review/practice-five-subjects-candidate.json').read_text())
assert not ({x['id'] for x in Q} & {x['id'] for x in old['questions']}) and not ({p['id'] for p in P} & {p['id'] for p in old['patterns']})
out = dict(version=1, status='candidate only (Claude 2026-10-26); no main library/endpoint/UI connection',
           authorship='Claude original diagnostic options; canonical questions are references only, not rewritten',
           displayPolicy=old['displayPolicy'], patterns=P, questions=Q,
           coverageLimits=['18 questions / 6 additional patterns; complements Codex 30 questions; no claim of full coverage',
                           'Only explicitly mapped source IDs may open these practice IDs'])
Path('practice-bank.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
Path('mistake-patterns.json').write_text(json.dumps(dict(version=1, patterns=P), ensure_ascii=False, indent=1) + '\n')
print('patterns', len(P), 'questions', len(Q), 'letters', ''.join(letters))
