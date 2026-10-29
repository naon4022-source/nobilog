from pathlib import Path
import json, re, random, html, shutil
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Flowable
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'tools/eiken-series'
base=json.loads((ROOT/'tools/eiken-original-bank.json').read_text())

def read(grade,kind,columns):
 rows=[x.split('|') for x in (SRC/f'grade-{grade}-{kind}.txt').read_text().splitlines() if x.strip()]
 assert all(len(r)==columns for r in rows),(grade,kind)
 return rows

def q(prompt,answer,why):return dict(q=prompt,answer=answer,why=why,accepted=[answer])
def words(t):return sorted(re.sub(r'[.,?!]','',t.lower()).split())
series={}
for grade,original in base.items():
 sets=[{k:original[k] for k in ('cloze','order','passages','writing','questions')}]
 cloze=read(grade,'cloze',3);order=read(grade,'order',2)
 n=3 if grade in ('5','4') else 2
 readings=read(grade,'reading',2+3*n)
 writing=read(grade,'writing',3) if grade in ('3','pre2') else []
 assert len(cloze)==90 and len(order)==36 and len(readings)==18
 for s in range(9):
  block=dict(cloze=[q(*r) for r in cloze[s*10:(s+1)*10]],order=[],passages=[],writing=[])
  for i,(jp,answer) in enumerate(order[s*4:(s+1)*4]):
   pieces=re.sub(r'[.,?!]','',answer).split();rng=random.Random(f'{grade}:{s}:{i}')
   original_pieces=pieces.copy();rng.shuffle(pieces)
   if pieces==original_pieces:pieces=pieces[1:]+pieces[:1]
   prompt=jp+'（語句を並べ替えて英文にする）\n( '+' / '.join(pieces)+' )'
   assert words(answer)==words(' '.join(pieces))
   why='日本語の意味に合う主語と動詞を最初に確認し、動詞が求める目的語・補語を続けます。時や場所のまとまりを崩さず、すべての語句を一回ずつ使います。'
   if re.search(r'\b(?:have|has)\s+(?:(?:not|already|never|just|you)\s+)?(?:been|heard|found|traveled|studied|used|finished|lived|decided)\b',answer):why+=' 現在完了はhave/hasと過去分詞を組み合わせます。期間はfor、開始時点はsince、経験や完了は文中の時を表す語句で確認します。'
   if 'have to ' in answer:why+=' have to＋動詞の原形で「～する必要がある」を表し、haveの後にtoを置きます。'
   if answer.startswith('If I had more time'):why+=' 現在の事実と違う仮定なので、If節に過去形had、主節にwould＋動詞の原形を置きます。'
   if answer.startswith('I wish I had more confidence'):why+=' 現在の願望はI wish＋主語＋過去形で表します。このhadは「持っている」というhaveの過去形です。'
   if answer.startswith('I wish I had accepted'):why+=' 過去への後悔はI wish＋主語＋had＋過去分詞で表します。acceptedは過去分詞で、実際には受け入れなかった機会を述べます。'
   if 'than ' in answer:why+=' 比較する相手はthanの後ろに置きます。'
   if any(v in answer for v in (' told ',' asked ',' advised ','allowed ','encourages ','required ')):why+=' 人に動作を求める部分は人とto不定詞のまとまりにします。'
   block['order'].append(q(prompt,answer,why))
  for row in readings[s*2:(s+1)*2]:
   title,text=row[:2];qs=[]
   for at in range(2,len(row),3):
    prompt,answer,evidence=row[at:at+3];assert evidence in text
    explanation='本文の根拠：'+evidence
    if grade=='4' and answer=='1' and title=='Choosing a gift':explanation+=' 持っていた18ドルから15ドルと2ドルを引くと1ドルです。'
    if grade=='4' and title=='A different route' and answer=='10':explanation+=' 新しい15分は元より5分長いので、15 - 5 = 10分です。'
    if grade=='4' and title=='A garden project' and answer=='4':explanation+=' 窓際2鉢と暗い場所2鉢を足すと4鉢です。'
    entry=q(prompt,answer,explanation);entry['evidence']=evidence
    if '天気' in prompt and answer in ('rain','rainy','raining'):entry['accepted']=['rain','rainy','raining']
    qs.append(entry)
   block['passages'].append([title,text,qs])
  if writing:
   for row in writing[s*2:(s+1)*2]:
    entry=q(*row);entry['accepted']=[];entry['rubric']=['質問された内容をすべて満たす','意見と理由のつながりが分かる','主語・動詞・語順・時制が適切','文同士が自然につながる'];block['writing'].append(entry)
  block['questions']=block['cloze']+block['order']+[x for _,_,qs in block['passages'] for x in qs]+block['writing']
  assert len(block['questions'])==20
  sets.append(block)
 assert len(sets)==10
 for number,block in enumerate(sets,1):
  block['set']=number
  for entry in block['writing']:
   entry['accepted']=[]
   entry['rubric']=['指定された内容を満たす','意見と理由がつながる','語順と時制が適切','文章が自然につながる']
  for title,text,qs in block['passages']:
   for entry in qs:entry['context']=text
  for index,entry in enumerate(block['questions'],1):entry['id']=index
 # The cover questions remain the original practice, with one clearer explanation.
 if grade=='5':sets[0]['cloze'][0]['why']='教員が働く場所はschool。riverは川、kitchenは台所です。'
 if grade=='4':sets[0]['passages'][1][2][0]['q']='Rikuが一緒に料理を始めた家族を英語1語で答えなさい。'
 if grade=='5':
  block=sets[5]
  for title,text,qs in block['passages']:
   if title=='My new neighbor':qs[2]['evidence']='Dan likes baseball. I like baseball too.';qs[2]['why']='本文の根拠：Dan likes baseball. I like baseball too.'
 allq=[entry for block in sets for entry in block['questions']]
 assert len(allq)==200
 assert len({(x.get('context',''),x['q']) for x in allq})==200,(grade,'duplicate question')
 series[grade]={'label':original['label'],'sets':sets}
assert sum(len(b['questions']) for d in series.values() for b in d['sets'])==800
(ROOT/'tools/eiken-series-bank.json').write_text(json.dumps(series,ensure_ascii=False,indent=2)+'\n')

pdfmetrics.registerFont(TTFont('NobiJapanese','/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
styles={k:ParagraphStyle(k,fontName='NobiJapanese' if k!='en' else 'Helvetica',fontSize=size,leading=leading,wordWrap='CJK' if k!='en' else None,spaceAfter=space) for k,size,leading,space in [('title',17,25,10),('sub',12,18,10),('jp',10.5,17,6),('en',11,17,7),('small',9,14,7)]}
def P(s,k='jp'):return Paragraph(html.escape(s).replace('\n','<br/>'),styles[k])
def lines(n):return [P('________________________________________________________________','en') for _ in range(n)]
class Marker(Flowable):
 def __init__(self,number):Flowable.__init__(self);self.number=number;self.width=0;self.height=0
 def draw(self):pass
class Doc(SimpleDocTemplate):
 def __init__(self,*args,**kw):self.starts={};self.current_set=1;super().__init__(*args,**kw)
 def afterPage(self):footer(self.canv,self)
 def afterFlowable(self,flowable):
  if isinstance(flowable,Marker):self.starts[str(flowable.number)]=self.page;self.current_set=flowable.number

def footer(canvas,doc):
 canvas.setStrokeColor(colors.black);canvas.line(42,38,A4[0]-42,38)
 canvas.setFont('NobiJapanese',8);canvas.drawString(42,25,f'のびログ / 英検{doc.grade_label}向け練習{doc.current_set:02} / 2026-10-01')
 canvas.setFont('Helvetica',8);canvas.drawRightString(A4[0]-42,25,str(doc.page))

def front(d,b,kind):
 return [Marker(b['set']),P('英検 '+d['label']+' 向け 練習 '+str(b['set']).zfill(2)+' '+kind,'title'),P('全10セット・各20問（この冊子は200問）。独自に作成した筆記練習で、公式試験の再現ではありません。場面・人物は練習用の設定です。','small')]
manifest={};out=ROOT/'output/pdf';out.mkdir(parents=True,exist_ok=True)
for grade,d in series.items():
 info={'label':d['label'],'sets':[]};starts={}
 for kind in ('questions','answers'):
  story=[]
  for b in d['sets']:
   if story:story.append(PageBreak())
   story+=front(d,b,'問題' if kind=='questions' else '解答・解説')
   if kind=='answers':
    story += [P('別の言い方でも意味と指定条件が合っていれば認めます。英作文は模範例との文字一致では採点しません。','small')]
    for entry in b['questions']:
     is_writing=entry in b['writing'];jp_answer=bool(re.search('[\u3040-\u30ff\u4e00-\u9fff]',entry['answer']))
     group=[P(str(entry['id'])+'. '+('模範例' if is_writing else '正答'),'sub'),P(entry['answer'],'jp' if jp_answer else 'en'),P(entry['why'])]
     alt=[a for a in entry['accepted'] if a!=entry['answer']]
     if alt:group.append(P('別解：'+' / '.join(alt),'small'))
     if is_writing:group.append(P('確認する点：指定内容を満たす・理由が伝わる・語順と時制が適切・文同士がつながる。模範例は唯一の正答ではありません。','small'))
     story.append(KeepTogether(group+[Spacer(1,5)]))
    continue
   story += [P('リスニングは含みません。すべて解答を書いて取り組んでください。','small'),P('1 - 10   文を完成させよう','sub'),P('括弧内の候補から最も適切な語句を選び、その語句を書きなさい。','small')]
   for entry in b['cloze']:story.append(KeepTogether([P(str(entry['id'])+'. '+entry['q'],'en')]+lines(1)))
   story += [PageBreak(),P('11 - 14   語順を整えよう','title'),P('すべての語句を一回ずつ使って英文を完成させなさい。大文字と句読点は適切に変えてかまいません。','small')]
   for entry in b['order']:story.append(KeepTogether([P(str(entry['id'])+'. '+entry['q'])]+lines(2)+[Spacer(1,10)]))
   story += [PageBreak(),P('15 - '+('18' if b['writing'] else '20')+'   文章を読み取ろう','title')]
   for title,text,qs in b['passages']:
    # Each passage stays with its questions; a long pair can use separate pages.
    group=[P(title,'sub'),P(text,'en'),Spacer(1,5)]
    for entry in qs:group += [P(str(entry['id'])+'. '+entry['q'])]+lines(1)
    story.append(KeepTogether(group+[Spacer(1,10)]))
   if b['writing']:
    story += [PageBreak(),P('19 - 20   自分の言葉で書こう','title'),P('語数はこの練習独自の目安で、公式試験の指定語数ではありません。','small')]
    for entry in b['writing']:
     prompt=re.sub(r'(?<=。)(?=[A-Z])','\n',entry['q']).replace('? 英語','?\n英語')
     story.append(KeepTogether([P(str(entry['id'])+'. '+prompt)]+lines(7)+[Spacer(1,10)]))
  path=out/f'eiken-original-{grade}-{kind}.pdf';doc=Doc(str(path),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=52,title=f'のびログ 英検{d["label"]}向け 練習10セット {kind}')
  doc.grade_label=d['label'];doc.build(story);starts[kind]=doc.starts
  shutil.copy2(path,ROOT/'site-assets'/path.name)
  print(path.name,'sets:',len(doc.starts),'pages:',doc.page)
 for s in range(1,11):info['sets'].append({'number':s,'questionsPage':starts['questions'][str(s)],'answersPage':starts['answers'][str(s)],'count':20})
 manifest[grade]=info
(ROOT/'site-assets/eiken-series-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('800 unique practice questions; 4 levels x 10 sets x 20. Created 8 combined PDFs.')
