from pathlib import Path
import json, html, shutil
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4

ROOT=Path(__file__).resolve().parents[1]
# Independent practice, not a reproduction of official examination questions.
def rows(s):
    return [dict(zip(('q','answer','why'),line.split('|'))) for line in s.strip().splitlines()]
DATA={
'5':dict(label='5級',cloze=rows('''My aunt is a teacher at a ( school / river / kitchen ).|school|英語を教える場所は学校。riverは川、kitchenは台所です。
A: Is this your bag? B: No. It is ( he / his / him ).|his|「彼のもの」は所有代名詞his。heは主語、himは目的語です。
We have music class ( on / at / in ) Friday.|on|曜日の前にはonを使います。時刻の前はatです。
My sister ( like / likes / liking ) oranges, but I like apples.|likes|主語My sisterは三人称単数。現在形の動詞にsを付けます。
There ( is / are / am ) two bicycles behind the house.|are|two bicyclesは複数なのでThere areを使います。
A: ( Who / Where / When ) is your lunch box? B: On the desk.|Where|答えが場所なのでWhere。「誰」ならWho、「いつ」ならWhenです。
Ken can ( swims / swim / swimming ) very fast.|swim|助動詞canの直後は動詞の原形です。
Listen! The children are ( sing / sings / singing ) in the next room.|singing|areと動詞のing形で、今している動作を表します。
A: ( How / What / Which ) many notebooks do you have? B: Three.|How|数をたずねる決まった形はHow manyです。
I am hungry. Let's ( eat / drink / wear ) these sandwiches.|eat|サンドイッチを食べるのでeat。飲むはdrink、着るはwearです。'''),order=rows('''「私は毎朝、犬と歩きます。」( every / walk / I / morning / my dog / with )|I walk with my dog every morning.|主語I、動詞walk、with my dog、時を表すevery morningの順。
「あなたのお父さんは何時に起きますか。」( your father / does / get up / what time )|What time does your father get up?|What timeのあとにdoes、主語、動詞の原形を置きます。
「箱の中にボールが一つあります。」( a ball / is / in the box / there )|There is a ball in the box.|存在を表すThere isと、物、場所を並べます。
「その女の子は今、本を読んでいます。」( now / a book / reading / the girl / is )|The girl is reading a book now.|主語、is、reading、目的語、nowの順です。'''),passages=[
('A notice','The school library opens at nine on Saturday. A story reading starts at ten. Please bring a pencil. You can borrow two books. The library closes at twelve.',rows('''何曜日に図書室が開きますか。英語1語で答えなさい。|Saturday|文のon Saturdayが曜日を示しています。
読み聞かせは何時に始まりますか。数字で答えなさい。|10|A story reading starts at ten.が根拠。開館の9時とは違います。
何冊まで借りられますか。数字で答えなさい。|2|borrow two booksから2冊と分かります。''')),
('An email','Hi Mei, I live near a park. I play tennis there with my brother on Sundays. Today it is rainy, so we are at home. My brother is making lunch. I am drawing a picture of our cat. See you, Yuki',rows('''Yukiが日曜日にするスポーツを英語1語で答えなさい。|tennis|I play tennis thereが根拠です。
今日の天気を英語1語で答えなさい。|rainy|Today it is rainyと明記されています。
Yukiは何の絵を描いていますか。英語1語で答えなさい。|cat|a picture of our catから猫の絵と分かります。'''))],writing=[]),
'4':dict(label='4級',cloze=rows('''I ( buy / bought / buying ) a notebook at that shop yesterday.|bought|yesterdayは過去。buyの過去形はboughtです。
A: Did Hana finish her homework? B: Yes, she ( did / does / is ).|did|Didで始まる質問にはdidで答えます。
This street is ( wide / wider / widest ) than the street near my school.|wider|thanを伴って二つを比べるので比較級widerです。
Of the three boxes, this one is the ( heavy / heavier / heaviest ).|heaviest|三つの中で最も重いので最上級heaviestです。
We are going ( visit / to visit / visiting ) our uncle next week.|to visit|be going toと動詞の原形で予定を表します。
I went to the station ( meet / to meet / met ) my cousin.|to meet|目的「会うために」はtoと動詞の原形で表します。
Thank you for ( help / helped / helping ) me with my bag.|helping|前置詞forのあとで動作を表すにはing形を使います。
There isn't ( some / any / many ) milk in the bottle.|any|否定文で不特定の量を表すときはany。milkは数えない名詞です。
I went to bed early ( because / during / despite ) I was tired.|because|疲れていたことが早く寝た理由なのでBecauseです。
A: How ( long / far / many ) does the trip take? B: About forty minutes.|long|時間の長さをたずねるにはHow longです。距離はHow farです。'''),order=rows('''「私は昨日、駅で彼女に会いました。」( at the station / her / yesterday / I / met )|I met her at the station yesterday.|metはmeetの過去形。人herのあとに場所、時を置きます。
「私の兄は私より背が高いです。」( than / taller / my brother / I am / is )|My brother is taller than I am.|比較級tallerのあとにthanを置き、比べる相手を続けます。
「私たちは明日、公園を掃除する予定です。」( tomorrow / clean / going to / we / the park / are )|We are going to clean the park tomorrow.|are going to cleanで掃除する予定を表します。
「私は科学について学びたいです。」( about / want / science / I / to learn )|I want to learn about science.|want to learnは学びたい、about scienceは科学についてです。'''),passages=[
('A club message','Our hiking club planned to meet at the station at eight on Sunday. The weather report says it will rain in the morning. We will now meet at ten, when the rain should stop. Please bring lunch and a jacket. The walk will take two hours.',rows('''集合は変更後、何時ですか。数字で答えなさい。|10|We will now meet at tenが新しい集合時刻。eightは変更前です。
朝の天気予報を英語1語で答えなさい。|rain|it will rain in the morningが根拠です。rainyも天気の表現として認めます。
歩く時間は何時間ですか。数字で答えなさい。|2|The walk will take two hoursから2時間です。''')),
('A new hobby','Last month, Riku started cooking with his grandfather. At first, cutting vegetables was difficult for him. He practiced every Saturday. Yesterday he made vegetable soup for his family. His sister asked for another bowl. Next weekend he wants to make bread.',rows('''Rikuに料理を教えている家族を英語1語で答えなさい。|grandfather|started cooking with his grandfatherから祖父です。
Rikuが練習した曜日を英語1語で答えなさい。|Saturday|He practiced every Saturdayが根拠です。
次に作りたい食べ物を英語1語で答えなさい。|bread|Next weekend he wants to make breadが根拠です。'''))],writing=[]),
'3':dict(label='3級',cloze=rows('''I have ( lived / living / live ) in this town for three years.|lived|haveと過去分詞、for three yearsで現在までの継続を表します。
The bridge was ( build / built / building ) fifty years ago.|built|受動態wasと過去分詞。buildの過去分詞はbuiltです。
This is the book ( who / which / where ) I borrowed yesterday.|which|先行詞bookは物。目的格の関係代名詞whichを使います。
It is important for us ( save / to save / saved ) water.|to save|It is形容詞for人to動詞の形。to saveが内容を表します。
If it ( rains / rained / will rain ) tomorrow, we will stay inside.|rains|未来のことでも条件を表すif節では現在形を使います。
I have never ( went / go / been ) to Canada.|been|have never been toで「一度も行ったことがない」という経験です。
Please speak more ( slow / slowly / slower ) so I can understand.|slowly|動詞speakを説明する副詞slowly。more slowlyで「もっとゆっくり」です。
My father asked me ( wash / washing / to wash ) the dishes.|to wash|ask人to動詞で、人に何かするよう頼むことを表します。
The boy ( sit / sitting / sits ) by the window is my cousin.|sitting|名詞boyのあとに現在分詞sittingを置いて、座っている少年を説明します。
You may bring your own lunch, but you ( mustn't / don't have to / couldn't ) because meals are provided.|don't have to|食事が用意されるので持参する必要がない。禁止を表すmustn'tとは異なります。'''),order=rows('''「私はすでにその手紙を書きました。」( already / the letter / have / I / written )|I have already written the letter.|haveと過去分詞writtenで完了。alreadyをhaveとwrittenの間に置きます。
「この部屋は毎日掃除されます。」( every day / cleaned / this room / is )|This room is cleaned every day.|is cleanedで現在の受動態を作ります。
「私はどこで切符を買うべきか分かりません。」( tickets / where / I / to buy / don't know )|I don't know where to buy tickets.|where to buyでどこで買うべきかという内容をまとめます。
「音楽を聴くことは私を幸せにします。」( makes / to music / me / listening / happy )|Listening to music makes me happy.|動名詞のまとまりが主語。make人形容詞で「人をその状態にする」です。'''),passages=[
('Repair Saturday','At Elm School, students used to throw away broken umbrellas. Mina suggested a repair event. A local shop owner showed volunteers how to replace small parts. At the first event, they repaired eighteen umbrellas but could not fix four. Those four were sent to a recycling center. The next event will be in November. Students should book a place by email because only twelve volunteers can work safely in the room.',rows('''最初の行事で修理できた傘の数を数字で答えなさい。|18|repaired eighteen umbrellasが根拠です。fourは修理できなかった数です。
予約に使う手段を英語1語で答えなさい。|email|book a place by emailが根拠。作業スペースの安全を保つため予約します。''')),
('Reading outside','Leo did not enjoy reading long books. His teacher suggested a short nature guide. Leo took it to a riverside park and looked for birds shown in the pictures. He became interested in learning more and borrowed a longer book about birds. He now visits the park twice a month. On rainy days, he reads at home instead. He says the first guide helped him connect reading with something he could actually see.',rows('''最初にLeoへ提案した人を英語1語で答えなさい。|teacher|His teacher suggested a short nature guideが根拠です。
毎月、公園へ行く回数を数字で答えなさい。|2|twice a monthは月に2回です。雨の日は家で読書します。'''))],writing=rows('''友達へのメールです。英語30語程度で返事を書き、二つの質問両方に答えなさい。Hi! I want to learn a new sport. What sport do you recommend? Why do you recommend it?|I recommend badminton. You can play it indoors, so rain is not a problem. It is also easy to start with friends. I think you will enjoy playing it.|模範例は一例です。競技名と薦める理由の両方が必要。理由が競技の特徴とつながっているか、主語と動詞があるかを確認します。
Do you think students should help clean their local parks? 英語40語程度で自分の考えと理由二つを書きなさい。|Yes, I do. First, clean parks are safer for children because there is less trash on the ground. Second, students can learn to take care of their town. Working together can also help them make new friends.|YesでもNoでもよい。立場、異なる理由二つ、理由とのつながりを評価します。模範例と同じ文章である必要はありません。''')),
'pre2':dict(label='準2級',cloze=rows('''The museum offers free ( admission / attention / direction ) to children under six.|admission|入場を表すadmission。attentionは注意、directionは方向です。
The heavy snow caused a ( delay / habit / purpose ) in train services.|delay|列車の運行が遅れることはdelay。habitは習慣、purposeは目的です。
We need to ( reduce / refuse / replace ) food waste by buying only what we need.|reduce|必要な分だけ買うことで食品廃棄を減らすのでreduceです。
Our prediction was wrong: the results were different from what we had ( expected / protected / collected ).|expected|予想していた内容との違いなのでexpected。protectは守る、collectは集めるです。
The match was put ( off / out / away ) until Monday because of the storm.|off|put offは延期する。put outは火を消す、put awayは片付けるです。
Although the route was longer, it was much ( safe / safely / safer ).|safer|wasの補語は形容詞。muchは比較級saferを強めます。
I wish I ( have / had / will have ) more time to practice now.|had|現在の事実と異なる願いはI wishと過去形で表します。
By the time I arrived, the meeting had already ( begun / began / begin ).|begun|hadと過去分詞で到着前の開始を表します。beginの過去分詞はbegunです。
She is used to ( work / working / worked ) with people from different countries.|working|be used toは「慣れている」。このtoは前置詞なのでing形を続けます。
The device allows users ( check / checking / to check ) the temperature remotely.|to check|allow人to動詞で、人が何かできるようにすることを表します。'''),order=rows('''「彼はその申し出を受け入れるかどうか決めていません。」( the offer / decided / he / whether to accept / hasn't )|He hasn't decided whether to accept the offer.|whether to acceptは受け入れるかどうか。hasn't decidedの目的語になります。
「悪天候にもかかわらず、彼らは調査を続けました。」( the survey / despite / continued / they / the bad weather )|Despite the bad weather, they continued the survey.|despiteのあとに名詞句を置き、逆接を表します。文末に置いても認めます。
「その説明は、私が理解できるほど明確でした。」( for me / clear enough / the explanation / to understand / was )|The explanation was clear enough for me to understand.|形容詞enough for人to動詞で、人がその動作をできる程度であることを表します。
「誰がその展示を担当するのか教えてください。」( the display / tell me / in charge of / please / who is )|Please tell me who is in charge of the display.|間接疑問はwho isの語順。be in charge ofは担当しているという意味です。'''),passages=[
('A shared freezer','Westfield residents opened a shared freezer for extra garden vegetables. At first, anyone could leave food without a label. Volunteers soon found that this made it difficult to check how long food had been stored. They introduced labels showing the date and the name of the vegetable. Cooked meals are not accepted because the volunteers cannot check all ingredients. The freezer is open three afternoons a week. A nearby cafe pays the electricity bill, while residents take turns cleaning the area.',rows('''ラベルのない食品では何の確認が難しかったですか。日本語で答えなさい。|食品がどれくらいの期間保存されていたか|how long food had been storedが根拠。種類や量だけを答えると目的を捉えられていません。
電気代を払っている施設を英語1語で答えなさい。|cafe|A nearby cafe pays the electricity billが根拠です。住民は清掃を分担します。''')),
('Testing a bus route','A town tested a late bus for students attending evening classes. The first survey asked whether people wanted the service, and most said yes. However, only a few used it during the first month. A second survey revealed that the bus left ten minutes before many classes ended. The town changed the departure time rather than canceling the route. Passenger numbers then increased. Officials decided to continue the test for three more months before making a final decision.',rows('''利用者が少なかった理由を日本語で答えなさい。|多くの授業が終わる10分前にバスが出発していたから|wanted the serviceへの肯定と実際の利用は別。2回目の調査で出発時刻の問題が分かりました。
最終判断の前に、さらに何か月試験運行しますか。数字で答えなさい。|3|for three more monthsが根拠です。first monthは最初の実施期間です。'''))],writing=rows('''英語50語程度でメールへの返信を書きなさい。相手の提案に賛成か反対かと理由を述べ、必要な情報を一つ質問しなさい。Our club may hold a weekend event where students exchange books. Do you think this is a good idea?|I think a book exchange is a good idea because students can discover new stories without spending much money. It also gives us a chance to talk about our favorite writers. Could you tell me where we would hold the event? We will need enough space for the books.|賛否、関連する理由、情報を求める質問が必要です。書き手の意図が伝わるかを確認し、例と違う考えでも認めます。
Should towns provide more places where young people can study after school? 英語60語程度で意見と理由二つを書きなさい。|I think towns should provide more study spaces. First, some students do not have a quiet place at home, so a public space would help them concentrate. Second, students could support each other when they have difficult homework. These spaces should have clear rules so that everyone can use them safely and comfortably. This would make them more useful.|YesでもNoでもよい。理由二つが別の観点か、意見を支えているか、文同士がつながるかを評価します。模範例は唯一の正答ではありません。'''))}

# Alternate valid answers: never use ungrounded approximate matching.
ALT={('5',11):['Every morning I walk with my dog.'],('5',14):['Now the girl is reading a book.'],('4',11):['Yesterday I met her at the station.','I met her yesterday at the station.'],('4',13):['Tomorrow we are going to clean the park.'],('4',16):['rainy'],('3',11):['I have written the letter already.'],('pre2',12):['They continued the survey despite the bad weather.'],('pre2',15):['食品の保存期間','食品がいつから保存されているか'],('pre2',17):['多くの授業の終了より10分早くバスが出発したから']}
for grade,d in DATA.items():
    allq=d['cloze']+d['order']+[q for _,_,qs in d['passages'] for q in qs]+d['writing']
    assert len(allq)==20
    for i,q in enumerate(allq,1):
        q['id']=i;q['accepted']=[q['answer']]+ALT.get((grade,i),[])
        assert q['q'] and q['answer'] and q['why']
        if i<=10: assert q['answer'] in [v.strip() for v in q['q'].split('(')[-1].split(')')[0].split(' / ')]
    d['questions']=allq

pdfmetrics.registerFont(TTFont('NobiJapanese','/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
styles={
 'title':ParagraphStyle('title',fontName='NobiJapanese',fontSize=19,leading=28,spaceAfter=12),
 'sub':ParagraphStyle('sub',fontName='NobiJapanese',fontSize=12,leading=19,spaceAfter=12),
 'jp':ParagraphStyle('jp',fontName='NobiJapanese',fontSize=10.5,leading=17,wordWrap='CJK',spaceAfter=6),
 'en':ParagraphStyle('en',fontName='Helvetica',fontSize=11,leading=17,spaceAfter=7),
 'small':ParagraphStyle('small',fontName='NobiJapanese',fontSize=9,leading=14,wordWrap='CJK',spaceAfter=7)}
def P(s,k='jp'):return Paragraph(html.escape(s).replace('\n','<br/>'),styles[k])
def footer(c,doc):
    c.setStrokeColor(colors.black);c.line(42,38,A4[0]-42,38)
    c.setFont('NobiJapanese',8);c.drawString(42,25,'のびログ / オリジナル英語練習 / 2026-10-01')
    c.setFont('Helvetica',8);c.drawRightString(A4[0]-42,25,str(doc.page))
def heading(d,title):return [P('英検 '+d['label']+' 向け '+title,'title'),P('原本の問題を転載せず、新しい場面・英文で作った独自の練習です。公式試験の再現ではありません。','small')]
def space(n=1):return [P('________________________________________________________________','en') for _ in range(n)]
out=ROOT/'output/pdf/eiken-first-set';out.mkdir(parents=True,exist_ok=True)
for grade,d in DATA.items():
    story=heading(d,'練習問題 20問')+[P('リスニングは含みません。すべて解答を書いてください。語順問題は全文を書き、内容問題は指定の言語で答えます。','jp'),P('1 - 10   文を完成させよう','sub'),P('括弧内の候補から最も適切な語句を選び、その語句を書きなさい。','small')]
    for q in d['cloze']:story += [KeepTogether([P(str(q['id'])+'. '+q['q'],'en')]+space())]
    story += [PageBreak(),P('11 - 14   語順を整えよう','title'),P('すべての語句を一回ずつ使い、英文を完成させなさい。大文字と句読点は適切に変えてかまいません。','jp')]
    for q in d['order']: story += [KeepTogether([P(str(q['id'])+'. '+q['q'])]+space(2)+[Spacer(1,12)])]
    story += [PageBreak(),P('15 - '+('18' if d['writing'] else '20')+'   文章を読み取ろう','title')]
    for title,passage,qs in d['passages']:
        story += [P(title,'sub'),P(passage,'en'),Spacer(1,8)]
        for q in qs:story += [KeepTogether([P(str(q['id'])+'. '+q['q'])]+space())]
        story += [Spacer(1,12)]
    if d['writing']:
        story += [PageBreak(),P('19 - 20   自分の言葉で書こう','title'),P('語数はこの練習独自の目安です。公式試験の指定語数ではありません。意見や理由が伝わる英文を目指します。','small')]
        for q in d['writing']:story += [KeepTogether([P(str(q['id'])+'. '+q['q'])]+space(7)+[Spacer(1,10)])]
    path=out/f'eiken-original-{grade}-questions.pdf'
    SimpleDocTemplate(str(path),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=52,title='のびログ 英検'+d['label']+'向け 独自練習問題').build(story,onFirstPage=footer,onLaterPages=footer)
    story=heading(d,'解答・解説')+[P('大文字・小文字や文末の句読点だけの違いは誤りにしません。読解は内容が同じ表現も認めます。英作文は模範例との文字一致では採点しません。','jp')]
    for q in d['questions']:
        group=[P(str(q['id'])+'. '+('模範例' if d['writing'] and q['id']>=19 else '正答'),'sub'),P(q['answer'],'jp' if grade=='pre2' and q['id'] in (15,17) else 'en'),P(q['why'])]
        if len(q['accepted'])>1:group.append(P('別解：'+' / '.join(q['accepted'][1:])))
        if d['writing'] and q['id']>=19:group.append(P('確認の観点：指定内容を満たす・理由が伝わる・語順と時制が適切・文同士がつながる。違う結論や具体例でも条件を満たせば正しい答案です。','small'))
        story.append(KeepTogether(group+[Spacer(1,7)]))
    path=out/f'eiken-original-{grade}-answers.pdf'
    SimpleDocTemplate(str(path),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=52,title='のびログ 英検'+d['label']+'向け 解答と解説').build(story,onFirstPage=footer,onLaterPages=footer)
    for suffix in (() if (ROOT/'tools/eiken-series-bank.json').exists() else ('questions','answers')):shutil.copy2(out/f'eiken-original-{grade}-{suffix}.pdf',ROOT/'site-assets'/f'eiken-original-{grade}-{suffix}.pdf')
(ROOT/'tools/eiken-original-bank.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2)+'\n')
print('Created 8 PDFs; 4 levels x 20 independently written questions.')
