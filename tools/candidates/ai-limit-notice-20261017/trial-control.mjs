// Shared safety gate for real AI trials. Mock calls must never enter this gate.
export const TRIAL_LIMIT = 10;
const PREFIX = 'ai-trial:';
const day = now => new Date(now + 32400000).toISOString().slice(0, 10);
export async function trialStatus(db, now = Date.now()) {
  const used = await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(PREFIX + 'day:' + day(now)).first('v');
  const failures = await db.prepare('SELECT v FROM auth_kv WHERE k=?').bind(PREFIX + 'failures').first('v');
  // Corrupted counters fail closed, never reset silently.
  const number = value => value === null ? 0 : /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : Infinity;
  return {limit: TRIAL_LIMIT, used: Math.min(TRIAL_LIMIT, number(used)), stopped: number(failures) >= 3, date: day(now)};
}
export function runRealAITrial(db,work,now=Date.now()){return runBoundedTrial(db,work,now,12000);}
export function runAvatarAITrial(db,work,now=Date.now()){return runBoundedTrial(db,work,now,60000);}
async function runBoundedTrial(db, work, now, timeoutMs) {
  if (!db || typeof work !== 'function' || !Number.isSafeInteger(now)) return {error:'ai_control_unavailable'};
  const token = crypto.randomUUID(), lease = PREFIX + 'lease', started=performance.now();
  let locked = false;
  try {
    const status = await trialStatus(db, now);
    if (status.stopped) return {error:'ai_stopped',trial:status};
    if (status.used >= TRIAL_LIMIT) return {error:'ai_trial_daily', trial:status};
    locked = !!await db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v,expires_at=excluded.expires_at WHERE auth_kv.expires_at<=? RETURNING v').bind(lease,token,now+timeoutMs+48000,now).first('v');
    if (!locked) return {error:'ai_busy'};
    // Recheck after acquiring the cross-account lease.
    const lockedStatus=await trialStatus(db, now);
    if (lockedStatus.stopped) return {error:'ai_stopped',trial:lockedStatus};
    const key = PREFIX + 'day:' + day(now);
    const used = await db.prepare("INSERT INTO auth_kv(k,v,expires_at) VALUES(?,'1',0) ON CONFLICT(k) DO UPDATE SET v=CAST(CAST(auth_kv.v AS INTEGER)+1 AS TEXT) WHERE auth_kv.v GLOB '[0-9]*' AND auth_kv.v NOT GLOB '*[^0-9]*' AND CAST(auth_kv.v AS INTEGER)<? RETURNING v").bind(key,TRIAL_LIMIT).first('v');
    if (used === null) return {error:'ai_trial_daily',trial:await trialStatus(db,now)};
    // Persist a notice before the 10th call, including when the worker stops mid-call.
    if (Number(used) === TRIAL_LIMIT) await db.prepare('INSERT INTO auth_kv(k,v,expires_at) VALUES(?,?,0) ON CONFLICT(k) DO NOTHING').bind(PREFIX+'notice:'+day(now),JSON.stringify({kind:'trial_limit',date:day(now),limit:TRIAL_LIMIT})).run();
    const remaining=timeoutMs-(performance.now()-started);
    if(remaining<=0)return {error:'ai_control_unavailable'};
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    let result;
    try { result = await work(controller.signal); }
    catch (_) { result = {error:'ai_failed'}; }
    finally { clearTimeout(timer); }
    if (!result || typeof result !== 'object' || controller.signal.aborted) result = {error:'ai_failed'};
    const failureKey = PREFIX+'failures';
    if (result.error === 'ai_budget' || result.error === 'billing_not_ready') {
      // A normal monthly limit is not a broken provider; never latch the circuit.
    } else if (result.error) {
      await db.prepare("INSERT INTO auth_kv(k,v,expires_at) VALUES(?,'1',0) ON CONFLICT(k) DO UPDATE SET v=CAST(MIN(3,CAST(auth_kv.v AS INTEGER)+1) AS TEXT)").bind(failureKey).run();
    } else {
      await db.prepare("INSERT INTO auth_kv(k,v,expires_at) VALUES(?,'0',0) ON CONFLICT(k) DO UPDATE SET v='0'").bind(failureKey).run();
    }
    return {...result,trial:await trialStatus(db,now)};
  } catch (_) {
    // No retry or counter refund: a request may already have reached the provider.
    return {error:'ai_control_unavailable'};
  } finally {
    if (locked) {
      try { await db.prepare('DELETE FROM auth_kv WHERE k=? AND v=?').bind(lease,token).run(); }
      catch (_) { /* Keep the lease on storage failure; never bypass it. */ }
    }
  }
}
