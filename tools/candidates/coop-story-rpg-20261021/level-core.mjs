// A separate RPG progression ledger. A caller cannot award XP by claiming it
// in an HTTP body: only a committed server-side quiz/quest receipt may call it.
const need=(ok,code)=>{if(!ok)throw Error(code);};
const id=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(x);
const int=x=>Number.isSafeInteger(x)&&x>=0;
const day=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
export function xpAtLevel(level){need(int(level)&&level>=1&&level<=100,'invalid_level');return 50*(level-1)*(level-1);}
export function levelForXp(xp){need(int(xp),'invalid_xp');return Math.min(100,1+Math.floor(Math.sqrt(xp/50)));}
export function requiredChapterLevel(number){need(int(number)&&number>=1,'stage_unknown');return Math.min(100,1+Math.floor((number-1)/2));}
export function newLevelProfile(uid){need(id(uid),'invalid_id');return {v:1,uid,xp:0,revision:1,rewardIds:[],soloDay:null,soloCorrect:0};}
function valid(raw,uid){
 need(raw?.v===1&&raw.uid===uid&&id(uid),'profile_owner');need(int(raw.xp)&&int(raw.revision)&&raw.revision>=1&&Array.isArray(raw.rewardIds)&&raw.rewardIds.every(id)&&new Set(raw.rewardIds).size===raw.rewardIds.length&&int(raw.soloCorrect),'invalid_level_profile');
 return structuredClone(raw);
}
export function awardRpgXp(raw,uid,receipt){
 const p=valid(raw,uid);need(receipt&&id(receipt.id)&&['solo_correct','chapter_clear'].includes(receipt.kind),'invalid_reward');
 if(p.rewardIds.includes(receipt.id))return {profile:p,replay:true,awarded:0};
 let amount;
 if(receipt.kind==='solo_correct'){
  need(receipt.correct===true&&day(receipt.day),'invalid_reward');
  if(p.soloDay!==null)need(receipt.day>=p.soloDay,'stale_reward_day');
  if(p.soloDay!==receipt.day){p.soloDay=receipt.day;p.soloCorrect=0;}
  need(p.soloCorrect<30,'solo_daily_limit');p.soloCorrect++;amount=10;
 }else{need(int(receipt.chapter)&&receipt.chapter>=1&&receipt.id==='chapter_'+receipt.chapter,'invalid_reward');amount=100;}
 need(int(p.xp+amount)&&int(p.revision+1),'invalid_xp');
 p.xp+=amount;p.revision++;p.rewardIds.push(receipt.id);
 return {profile:p,replay:false,awarded:amount};
}
export function levelView(raw,uid){const p=valid(raw,uid),level=levelForXp(p.xp);return {level,xp:p.xp,nextLevelXp:level===100?null:xpAtLevel(level+1),soloCorrectToday:p.soloCorrect};}
