// 候補2で足した書き方・単位が○、近い誤りが×になるか
const eng=require('../engine/material-engine.js'),fs=require('fs'),path=require('path');const dir=process.argv[2];
const Q={};for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')))for(const q of JSON.parse(fs.readFileSync(path.join(dir,f))).questions)Q[q.id.slice(17)]=q;
const T=[["kaseki-33","8億年",1],["kaseki-33","8",1],["kaseki-33","8年",0],["kaseki-33","80億年",0],["oto-7","1224km/h",1],["oto-7","1224km",1],["oto-7","1224m",0],["oto-8","4目盛り",1],["oto-8","40目盛り",0],
["tsuriai-4","6目盛り",1],["tsuriai-30","6めもり",1],["tsuriai-30","3目盛り",0],["chikara-16","300グラム",1],["chikara-16","50g",0],["chikara-53","1.0cm",1],["chikara-53","6cm",0],
["jishin-35","0km",1],["jishin-35","10km",0],["futten-36","2回",1],["futten-36","3回",0],["tsuriai-24","20ニュートン",1],["tsuriai-24","40N",0],["tsuriai-24","-20",0],["tsuriai-49","0N",1],["tsuriai-49","6N",0],["tsuriai-60","2.4N",1],["tsuriai-60","24N",0],
["futten-56","水のほうが4.2g重い",1],["futten-56","エタノールが4.2g重い",0],["yure-35","M7の地震が約1000倍",1],["yure-35","M5が約1000倍",0],["tsuriai-56","9N、下向き",1],["tsuriai-56","9N、上向き",0],
["kazan-69","二酸化炭素と硫化水素",1],["kazan-69","二酸化炭素と酸素",0],["hana-63","柱頭・花柱・子房",1],["hana-63","子房・花柱・柱頭",0],["yure-44","北アメリカプレート・ユーラシアプレート",1],["yure-44","太平洋プレート・ユーラシアプレート",0],
["oto-50","超音波",1],["hana-42","ア、イ",1],["hana-42","ア、エ",0]];
let bad=0;for(const [id,inp,exp] of T){const r=eng.grade(Q[id],inp);if(!!r.correct!==!!exp){bad++;console.log('×',id,inp,exp,r.reason);}}
console.log('チェック',T.length,'期待とちがう',bad);process.exit(bad?1:0);
