# 検定形式修正の候補をつくる（Claude 2026-10-27）。前回候補（採点の受けつけ方16件の修正ずみ）から始める。
# 変えるのは：比4問の ratio 印／漢検（二）15問と（六）10問を本試験の形式に／理科の用語を答える7問を記号選択に／図2点の参照。
import json, copy, pathlib
H = pathlib.Path(__file__).resolve().parent.parent
U = {k: json.loads((H / '前回候補' / f'kentei-{k}.json').read_text(encoding='utf-8')) for k in ['kanken-4', 'suken-3', 'suken-4', 'suken-5', 'rika-5']}
MAP = []   # 元ID → 候補ID・変更の種類・理由
def qid(u, n): return next(q for q in u['questions'] if q['id'] == f"{u['id']}-{n}")

# 1) 比の4問：比として自然な「3:4」「3：4」を、比の問題だけで受けつける（エンジン候補の ratio 印）
for k, ns in [('suken-5', [13, 14]), ('suken-4', [14, 15])]:
    for n in ns:
        q = qid(U[k], n); q['answer']['ratio'] = True
        MAP.append((q['id'], q['id'], '採点', 'answer.ratio=true（コロン区切りの比を受けつける。順序・値は今までどおり）'))

# 2) 漢検4級（二）同音・同訓異字：3問一組・5つの選択肢を共用・同訓をふくむ（本試験の標準解答：15問×2点、ア〜オ）
K = U['kanken-4']; tmpl = qid(K, 31)
G2 = [  # (読み, 選択肢5, [(文, 正答)]×3)
 ('キ', ['奇', '祈', '貴', '輝', '機'], [('海でおぼれた子が助かったのは、まさにキ跡だった。', 'ア'), ('神社で家族の健康をキ願する。', 'イ'), ('博物館でキ重な資料を見た。', 'ウ')]),
 ('カン', ['監', '勧', '環', '歓', '完'], [('防犯のため、店の前にカン視カメラをつける。', 'ア'), ('医者のカン告にしたがって休養する。', 'イ'), ('川のよごれは地域のカン境の問題だ。', 'ウ')]),
 ('トウ', ['到', '倒', '盗', '踏', '糖'], [('待ちに待った春がトウ来した。', 'ア'), ('強い相手を圧トウして優勝した。', 'イ'), ('自転車のトウ難にあわないよう、かぎをかける。', 'ウ')]),
 ('アツ（い）', ['厚', '熱', '暑', '圧', '温'], [('冬に向けてアツい毛布を出した。', 'ア'), ('アツいお茶を少しずつ飲む。', 'イ'), ('今年の夏はとてもアツい。', 'ウ')]),
 ('ツト（める）', ['努', '務', '勤', '勉', '働'], [('問題の解決にツトめる。', 'ア'), ('学級会で議長をツトめる。', 'イ'), ('父は駅前の会社にツトめている。', 'ウ')]),
]
# 正答の記号が毎回アイウにならないよう、組ごとに選択肢の順番を回す（中身は同じ）
ROT = [0, 2, 4, 1, 3]
L = 'アイウエオ'
new2 = []
for gi, (yomi, opts, items) in enumerate(G2):
    r = ROT[gi]; order = opts[r:] + opts[:r]          # 表示する順の漢字
    for si, (sent, ans_letter_in_base) in enumerate(items):
        kanji = opts[L.index(ans_letter_in_base)]
        letter = L[order.index(kanji)]
        new2.append((yomi, order, sent, letter, kanji, gi))
old_ids = [f'kentei-kanken-4-{n}' for n in range(31, 46)]
qs2 = []
for i, (yomi, order, sent, letter, kanji, gi) in enumerate(new2):
    q = copy.deepcopy(tmpl); q['id'] = f'kentei-kanken-4-{121 + i}'
    q['role'] = '例題' if i == 0 else '確認問題'
    q['prompt'] = (f'次の文のカタカナにあてはまる漢字を、ア〜オから選ぼう（{i // 3 * 3 + 1}〜{i // 3 * 3 + 3} は同じア〜オから選ぶ）。\n{sent}\n'
                   + '　'.join(f'{L[j]} {c}' for j, c in enumerate(order)))
    q['answer'] = {'kind': 'exact', 'accepted': [letter]}
    q['explanation'] = f'「{yomi}」と読む漢字の中から、文の意味に合う「{kanji}」を選ぶ。' + ('同じ訓読みの漢字は、意味のちがいで使い分ける。' if '（' in yomi else '')
    q['points'] = 2
    qs2.append(q)
    MAP.append((old_ids[i], q['id'], '漢検（二）', '本試験の形式（3問一組・5択共用・同訓をふくむ）に合わせて作り直し'))

# 3) 漢検4級（六）対義語・類義語：対義5・類義5、語群のひらがなを漢字一字に（本試験：10問×2点）
BANK = 'い・きゅう・しゅく・せい・そく・だん・はく・び・ぶ・ふん'
G6 = [('対義語', '濃厚 ― 淡□', ['白', '泊'], 'はく', '「濃厚」の対義語は「淡白（淡泊）」。'),
      ('対義語', '拡大 ― □小', ['縮'], 'しゅく', '「拡大」の対義語は「縮小」。'),
      ('対義語', '需要 ― 供□', ['給'], 'きゅう', '「需要」の対義語は「供給」。'),
      ('対義語', '冷静 ― 興□', ['奮'], 'ふん', '「冷静」の対義語は「興奮」。'),
      ('対義語', '曇天 ― □天', ['晴'], 'せい', '「曇天」の対義語は「晴天」。'),
      ('類義語', '詳細 ― □細', ['委'], 'い', '「詳細」の類義語は「委細」。どちらも「くわしいこと」。'),
      ('類義語', '互角 ― 五□', ['分'], 'ぶ', '「互角」と「五分」は、どちらも力が同じくらいであること。'),
      ('類義語', '推量 ― 推□', ['測'], 'そく', '「推量」の類義語は「推測」。'),
      ('類義語', '方法 ― 手□', ['段'], 'だん', '「方法」の類義語は「手段」。'),
      ('類義語', '用意 ― 準□', ['備'], 'び', '「用意」の類義語は「準備」。')]
old6 = [f'kentei-kanken-4-{n}' for n in range(71, 81)]
tmpl6 = qid(K, 71); qs6 = []
for i, (kind, word, acc, yomi, ex) in enumerate(G6):
    q = copy.deepcopy(tmpl6); q['id'] = f'kentei-kanken-4-{136 + i}'
    q['role'] = '例題' if i == 0 else '確認問題'
    q['prompt'] = (f'後の［　］の中のひらがなを漢字一字に直して□に入れ、{kind}を完成させよう（1〜5は対義語、6〜10は類義語。ひらがなは1回ずつ使う）。\n'
                   f'［ {BANK} ］\n{word}')
    q['answer'] = {'kind': 'exact', 'accepted': acc}
    q['explanation'] = ex + f'語群の「{yomi}」を使う。'
    q['points'] = 2
    qs6.append(q)
    MAP.append((old6[i], q['id'], '漢検（六）', '本試験の形式（対義5・類義5・語群のひらがなを漢字に）に合わせて作り直し'))
K['questions'] = K['questions'][:30] + qs2 + K['questions'][45:70] + qs6 + K['questions'][80:]

# 4) 理科検定5級：用語を書く7問を記号選択に（サンプルでは用語も記号で選ぶ。(20) は3択なので3択も使う）
R = U['rika-5']
RC = {5: ('全反射', ['屈折', '全反射', '乱反射', '直進'], '水中から空気中へ光が進むとき、入射角を大きくしていくと、光が空気中に出ないで、すべて水面で反射するようになる。この現象を何というか。次から選び、記号で答えよう。'),
      12: ('エタノール', ['エタノール', '水', '水とエタノールが同じくらい'], '水とエタノールの混合物を加熱して、出てきた気体を冷やして集めた。最初に集めた液体に多くふくまれているものを、次から選び、記号で答えよう。'),
      13: ('単子葉類', ['双子葉類', '裸子植物', '単子葉類', 'シダ植物'], '子葉が1枚で、葉脈が平行脈、根がひげ根の植物のなかまを、次から選び、記号で答えよう。'),
      14: ('シダ植物', ['コケ植物', '裸子植物', '被子植物', 'シダ植物'], '種子をつくらず、胞子でふえ、葉・茎・根の区別がある植物のなかまを、次から選び、記号で答えよう。'),
      16: ('子房', ['子房', '胚珠', 'やく', '柱頭'], '被子植物の花で、受粉したあと成長して果実になる部分を、次から選び、記号で答えよう。'),
      18: ('長くなる', ['長くなる', '短くなる', '変わらない'], '初期微動継続時間は、震源からの距離が遠いほどどうなるか。次から選び、記号で答えよう。'),
      19: ('深成岩', ['火山岩', '堆積岩', '溶岩', '深成岩'], 'マグマが地下深くでゆっくり冷え固まってできた岩石を何というか。次から選び、記号で答えよう。')}
# 既存の3択5問：中身はそのまま、正答がすべて「ア」なので選択肢の並びだけ入れかえる（並び＝表示順の新しい位置）
REORDER = {3: [1, 0, 2], 4: [1, 2, 0], 11: [2, 0, 1], 20: [2, 1, 0]}
import re
newq = []
for q in R['questions']:
    n = int(q['id'].split('-')[-1])
    if n in RC:
        ans, opts, prompt = RC[n]
        q2 = copy.deepcopy(q); q2['id'] = f'kentei-rika-5-{20 + len([m for m in RC if m <= n])}'
        q2['prompt'] = prompt + '\n' + '　'.join(f'{L[j]} {c}' for j, c in enumerate(opts))
        q2['answer'] = {'kind': 'exact', 'accepted': [L[opts.index(ans)]]}
        q2['explanation'] = q['explanation'] + f'（答えは {L[opts.index(ans)]} の「{ans}」）'
        newq.append(q2); MAP.append((q['id'], q2['id'], '理科（形式）', f'用語を書く形から{len(opts)}択の記号選択へ（サンプル(19)は4択、(20)は3択）'))
    elif n in REORDER:
        head, line = q['prompt'].rsplit('\n', 1)
        opts = [s.split(' ', 1)[1] for s in re.split('　', line)]
        assert len(opts) == 3 and q['answer']['accepted'] == ['ア'], q['id']
        order = REORDER[n]; new = [None] * 3
        for old_i, new_i in enumerate(order): new[new_i] = opts[old_i]
        q['prompt'] = head + '\n' + '　'.join(f'{L[j]} {c}' for j, c in enumerate(new))
        q['answer'] = {'kind': 'exact', 'accepted': [L[order[0]]]}
        newq.append(q); MAP.append((q['id'], q['id'], '理科（並び）', f'選択肢の中身は同じで並びだけ入れかえ（正答 ア→{L[order[0]]}。正答がすべてアだったため）'))
    else:
        newq.append(q)
R['questions'] = newq
# 図：1番（ばね）と4番（凸レンズ）に候補の図をつける（答えは図にかかない）
for n, f in [(1, '図/kentei-rika-5-fig-bane.svg'), (4, '図/kentei-rika-5-fig-lens.svg')]:
    q = next(x for x in R['questions'] if x['id'] == f'kentei-rika-5-{n}')
    q['figure'] = {'src': f, 'alt': '問題の図（答えはかいていない）', 'status': '候補（本体の画像の置き場所への接続はCodex）'}
    MAP.append((q['id'], q['id'], '理科（図）', f'候補の図 {f} を参照'))

for k, u in U.items():
    (H / '候補' / f'kentei-{k}.json').write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(H / '元IDと候補IDの対応.tsv').write_text('元ID\t候補ID\t種類\t理由\n' + ''.join('\t'.join(m) + '\n' for m in MAP), encoding='utf-8')
print('対応', len(MAP), {k: len(u['questions']) for k, u in U.items()})

# 5) 電卓と試験時間の案内（候補のメタデータ。画面の文言は Codex が接続する）
CALC = ('2次（数理技能検定）では電卓を使えます（一般的な電卓・関数電卓・グラフ電卓）。通信機能や印刷機能のある電卓、スマートフォン・タブレット・電子辞書・パソコンなどの電卓機能は使えません。'
        '1次（計算技能検定）で使えるかは、公式ページの本文に明記がありません（表の並びからは使えないと読めますが未確認）。')
for k in ['suken-3', 'suken-4', 'suken-5']:
    ex = U[k].setdefault('exam', {})
    ex['calculatorNote'] = CALC
    ex['calculatorSource'] = {'url': 'https://www.su-gaku.net/suken/examination/', 'checked': '2026-10-27'}
    MAP.append((U[k]['id'], U[k]['id'], '案内', 'exam.calculatorNote を追加（電卓の可否と機種）'))
exk = U['kanken-4'].setdefault('exam', {})
exk['minutesSource'] = {'url': 'https://www.kanken.or.jp/kanken/individual/pbt/schedule/', 'checked': '2026-10-27',
                        'note': '公開会場（紙）の4級は13:40〜14:40（準2級・6級と同じ時間）＝60分'}
MAP.append((U['kanken-4']['id'], U['kanken-4']['id'], '案内', 'exam.minutesSource を追加（60分の根拠）'))
for k, u in U.items():
    (H / '候補' / f'kentei-{k}.json').write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(H / '元IDと候補IDの対応.tsv').write_text('元ID\t候補ID\t種類\t理由\n' + ''.join('\t'.join(m) + '\n' for m in MAP), encoding='utf-8')
print('案内を追加', len(MAP))
