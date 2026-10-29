from mkprobe import make
T,F_=True,False
make('tokkun-english-1-review',[
 ('もう一度言ってほしい','Pardon?',T,'模範'),('もう一度言ってほしい','pardon',T,'小文字・記号なし'),('もう一度言ってほしい','Excuse me.',F_,'場面ちがい'),
 ('たずねたいことがある','I have a question.',T,'模範'),('たずねたいことがある','I have a question',T,'ピリオドなし'),('たずねたいことがある','I have question.',F_,'aの欠落'),
 ('手渡す','Here you are.',T,'模範'),('手渡す','Here are you.',F_,'語順の誤り'),
 ('うっかりふんで','I’m sorry.',T,'’の表記'),('うっかりふんで','I am sorry.',T,'短縮しない形'),('うっかりふんで','Thank you.',F_,'場面ちがい'),
 ('「制服」は英語で','How do you say "seifuku" in English?',T,'模範'),('「制服」は英語で','How do you say “seifuku” in English?',T,'全角の引用符'),
 ('つづりをたずねる','How do you spell that word?',T,'模範'),('つづりをたずねる','How do you spell this word?',T,'thisでも自然'),
])
