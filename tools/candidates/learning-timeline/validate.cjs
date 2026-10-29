'use strict';
// 保存API用の候補。sessionとcatalogは認証・読み込み済みサーバー値を渡す。
// クライアントの本人ID・教科・壁時計は受け付けない。実APIには未接続。
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const subjects=['数学','英語','国語','理科','社会'];
function validate(body,{session,catalog,now}){
 const fields=['id','sessionId','activity','startOffset','endOffset'];
 if(!body||Array.isArray(body)||Object.keys(body).length!==fields.length||Object.keys(body).some(k=>!fields.includes(k)))throw Error('bad fields');
 if(!uuid.test(body.id||'')||!uuid.test(body.sessionId||''))throw Error('bad id');
 if(!session||body.sessionId!==session.id||!Number.isSafeInteger(now)||!Number.isSafeInteger(session.startedAt)||session.startedAt<0||now<session.startedAt||now-session.startedAt>7*86400000)throw Error('expired session');
 if(!Number.isSafeInteger(body.startOffset)||!Number.isSafeInteger(body.endOffset)||body.startOffset<0||body.endOffset<=body.startOffset||body.endOffset-body.startOffset>5000||body.endOffset>4*3600000||session.startedAt+body.endOffset>now)throw Error('bad offsets');
 if(typeof body.activity!=='string'||body.activity.length>160)throw Error('bad activity');
 const target=catalog.find(a=>a.id===body.activity);
 if(!target||!subjects.includes(target.subject)||!['textbook','question'].includes(target.kind))throw Error('unknown activity');
 return {id:body.id,sessionId:session.id,activity:target.id,subject:target.subject,kind:target.kind,start:session.startedAt+body.startOffset,end:session.startedAt+body.endOffset,acceptedAt:now};
}
module.exports={validate};
