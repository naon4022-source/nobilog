import {readiness} from '../../../cf-worker/src/openai-policy.mjs';
import {budgetLimit} from '../../../cf-worker/src/openai-budget.mjs';

// Public diagnostics contain fixed reasons and limits only, never secret values
// or learner records. A ready configuration is not proof of a successful call.
export function connectionStatus(env,approved,trial){
 const cap=budgetLimit(env),validTrial=trial?.limit===10&&Number.isInteger(trial?.used)&&trial.used>=0&&trial.used<=10&&typeof trial?.stopped==='boolean';
 let reason='ready';
 if(env?.OPENAI_ENABLED!=='1')reason='disabled';
 else if(env?.GEMINI_ENABLED==='1')reason='provider_conflict';
 else if(!readiness(env))reason='setup_required';
 else if(env.OPENAI_BILLING_READY!=='1')reason='billing_required';
 else if(approved!==true)reason='consent_required';
 else if(!cap||!validTrial)reason='controls_unavailable';
 else if(trial.stopped)reason='stopped';
 else if(trial.used>=trial.limit)reason='daily_limit';
 return {ready:reason==='ready',reason,trialLimit:10,trialLeft:validTrial?10-trial.used:0,monthlyLimitYen:cap?cap/1000000:null};
}
