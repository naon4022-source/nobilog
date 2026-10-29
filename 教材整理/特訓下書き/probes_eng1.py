from mkprobe import make
T,F_=True,False
make('tokkun-english-1-l1a',[
 ('（ am / a / do / I / soccer / fan ）','I am a soccer fan.',T,'与えた語どおり'),('（ am / a / do / I / soccer / fan ）','I am a soccer fan',T,'ピリオドなし'),('（ am / a / do / I / soccer / fan ）',"I'm a soccer fan.",F_,'与えた語を短縮'),('（ am / a / do / I / soccer / fan ）','I do a soccer fan.',F_,'使わない語を使用'),
 ("（ don't / am / play / I / the / piano ）","I don't play the piano.",T,'与えた語どおり'),("（ don't / am / play / I / the / piano ）","I don’t play the piano.",T,'’の表記'),("（ don't / am / play / I / the / piano ）",'I do not play the piano.',F_,'与えた語を変更'),("（ don't / am / play / I / the / piano ）","I am don't play the piano.",F_,'余分な語'),
 ("（ not / hungry / don't / I'm ）","I'm not hungry.",T,'与えた語どおり'),("（ not / hungry / don't / I'm ）",'I am not hungry.',F_,'与えた語を変更'),("（ not / hungry / don't / I'm ）","I don't hungry.",F_,'誤文'),
])
make('tokkun-english-1-l1b',[
 ("（ play / can't / don't / I / the guitar ）","I can't play the guitar.",T,'与えた語どおり'),("（ play / can't / don't / I / the guitar ）",'I cannot play the guitar.',F_,'与えた語を変更'),("（ play / can't / don't / I / the guitar ）","I don't play the guitar.",F_,'使わない語を使用'),
 ("baseball / it's / fun","My favorite sport is baseball. It's fun.",T,'与えた語どおり'),("baseball / it's / fun",'My favorite sport is baseball. It is fun.',F_,'与えた語を変更'),("baseball / it's / fun","My favorite sport is baseball, it's fun.",F_,'文の区切りちがい'),
])
make('tokkun-english-1-l3b',[
 ("（ didn't / I / play / played / the piano / yesterday ）","I didn't play the piano yesterday.",T,'与えた語どおり'),("（ didn't / I / play / played / the piano / yesterday ）",'I did not play the piano yesterday.',F_,'与えた語を変更'),("（ didn't / I / play / played / the piano / yesterday ）","I didn't played the piano yesterday.",F_,'過去形の誤用'),
 ("（ we / watch / didn't","We didn't watch TV last night.",T,'与えた語どおり'),("（ we / watch / didn't","we didn't watch TV last night",T,'【採点仕様】小文字始まり・ピリオドなしも正解（大文字小文字は区別しない設定）'),
 ("（ visit / visited / I / didn't","I didn't visit my grandmother last week.",T,'与えた語どおり'),("（ visit / visited / I / didn't","I didn't visited my grandmother last week.",F_,'過去形の誤用'),
])
make('tokkun-english-1-l4a',[
 ("（ my brother / doesn't","My brother doesn't eat fish.",T,'与えた語どおり'),("（ my brother / doesn't",'My brother does not eat fish.',F_,'与えた語を変更'),("（ my brother / doesn't","My brother don't eat fish.",F_,'3単現の誤り'),
 ("（ Mai / doesn't","Mai doesn't read magazines.",T,'与えた語どおり'),("（ Mai / doesn't","Mai doesn't reads magazines.",F_,'動詞の形の誤り'),
])
make('tokkun-english-1-l4b',[
 ("（ I / don't / any / some","I don't have any T-shirts.",T,'与えた語どおり'),("（ I / don't / any / some",'I do not have any T-shirts.',F_,'与えた語を変更'),("（ I / don't / any / some","I don't have some T-shirts.",F_,'some/anyの誤り'),
])
