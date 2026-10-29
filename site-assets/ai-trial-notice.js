// AI trial notices contain counters only, never prompts, photos or credentials.
(function(root){
'use strict';
let node=null,lastKey='',date='',used=0,stopped=false;
function clear(){node?.remove();node=null;lastKey='';}
function show(status){
 if(!status||status.limit!==10||!Number.isSafeInteger(status.used)||status.used<0||status.used>10||typeof status.stopped!=='boolean'||!/^\d{4}-\d{2}-\d{2}$/.test(status.date||''))return;
 if(status.date<date||(status.date===date&&(status.used<used||(stopped&&!status.stopped))))return;
 if(status.date!==date){clear();used=0;stopped=false;}
 date=status.date;used=status.used;stopped=status.stopped;
 if(!status.stopped&&status.used<10){clear();return;}
 const key=status.date+':'+(status.stopped?'stopped':'limit');
 if(node?.isConnected&&lastKey===key)return;
 clear();lastKey=key;
 node=document.createElement('section');node.id='ai-trial-notice';node.className='ai-trial-notice';node.setAttribute('role','alert');
 const title=document.createElement('strong'),text=document.createElement('p'),close=document.createElement('button');
 title.textContent=status.stopped?'AIを安全のため停止しています':'AIの試験利用が今日の10回に達しました';
 text.textContent=status.stopped?'異常が続いたため、新しいAI通信を止めています。原因を確認し、なおの許可があるまで再開しません。':'追加で使う場合は、なおに知らせて許可をもらってください。自動で回数を増やしたり、呼び直したりしません。';
 close.type='button';close.textContent='通知を閉じる';close.addEventListener('click',clear);
 node.append(title,text,close);document.body.append(node);
}
root.NobiAITrialNotice=Object.freeze({show,clear});
})(globalThis);
