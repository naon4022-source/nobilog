import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHmac, createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import worker from './candidate/cf-worker/src/index.js';
import {resetGuardMemory} from './candidate/cf-worker/src/guard.mjs';
const {D1SQLite} = createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
let checks = 0, sequence = 0;
const ok = (value, message) => { assert(value, message); checks++; };
const digest = (pin, pepper) => createHmac('sha256', pepper).update(pin).digest('base64url');
const pins = ['fixture-nao', 'fixture-riran', 'fixture-souta'];
const originalFetch = globalThis.fetch;
let challenge = {};
globalThis.fetch = async url => {
  assert(String(url).endsWith('/siteverify'), 'Only synthetic Turnstile calls are allowed');
  return Response.json({success: true, hostname: 'nobilog.pages.dev', action: 'legacy_login', challenge_ts: new Date().toISOString(), ...challenge});
};
function fixture(dedicated = true) {
  resetGuardMemory();
  const db = new D1SQLite(), kv = new Map();
  const env = {AUTH_DB: db, BOARD: {get: async k => kv.get(k) || null, put: async (k,v) => kv.set(k,v), delete: async k => kv.delete(k)}, APP_ORIGIN: 'https://nobilog.pages.dev', PIN_PEPPER: 'fixture-shared-pepper', TURNSTILE_SECRET: 'fixture-turnstile'};
  for (const uid of ['u1','u2','u4']) {
    db.seed('cloud-save:' + uid, 'fixture-learning-' + uid, 0);
    db.seed('identity:google:fixture-' + uid, uid, 0);
  }
  if (dedicated) env.PIN_PEPPER_SOUTA = 'a'.repeat(64);
  for (const [i, name] of ['NAO','RIRAN','SOUTA'].entries()) env['LEGACY_' + name + '_PIN_HASH'] = digest(pins[i], i === 2 && dedicated ? env.PIN_PEPPER_SOUTA : env.PIN_PEPPER);
  const call = (path, body, token, origin = env.APP_ORIGIN) => worker.fetch(new Request('https://fixture.invalid' + path, {method: body === undefined ? 'GET' : 'POST', headers: {Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.80', ...(token ? {Authorization: 'Bearer ' + token} : {})}, ...(body === undefined ? {} : {body: JSON.stringify(body)})}), env, {});
  const start = (pin, origin) => call('/auth/legacy', {pin, turnstile: 'fixture-turnstile-token-' + (++sequence)}, null, origin);
  return {db, kv, env, call, start};
}
try {
  for (const dedicated of [false, true]) {
    const f = fixture(dedicated);
    try {
      for (const [i, uid] of ['u1','u2','u4'].entries()) {
        const sharedBefore = f.env.PIN_PEPPER;
        const r = await f.start(pins[i]), data = await r.json();
        ok(r.status === 200 && !!data.ticket, 'verified ticket: ' + uid + ' (status ' + r.status + ', error ' + (data.error || 'none') + ')');
        const login = await f.call('/auth/legacy/login', {ticket: data.ticket});
        const result = await login.json();
        ok(login.status === 200 && result.user.id === uid, 'PIN session belongs to correct account: ' + uid);
        ok((await f.call('/auth/me', undefined, result.session)).status === 200, 'normal session is usable');
        ok((await f.call('/auth/legacy/login', {ticket: data.ticket})).status === 400, 'ticket remains one-use');
        ok(f.env.PIN_PEPPER === sharedBefore, 'global pepper unchanged');
        await f.call('/auth/logout', {}, result.session);
      }
      ok((await f.start('fixture-wrong')).status === 401, 'wrong PIN rejected');
      ok((await f.start(pins[2], 'https://evil.invalid')).status === 403, 'foreign origin rejected');
      ok(![...f.kv.keys()].some(k => k.startsWith('cloud-save:')), 'no learning records created');
      for (const uid of ['u1','u2','u4']) {
        ok(f.db.get('cloud-save:' + uid).v === 'fixture-learning-' + uid, 'existing learning data untouched: ' + uid);
        ok(f.db.get('identity:google:fixture-' + uid).v === uid, 'existing linked identity untouched: ' + uid);
      }
    } finally { f.db.close(); }
  }
  for (const other of [0,1]) {
    const f = fixture();
    try {
      f.env.LEGACY_SOUTA_PIN_HASH = digest(pins[other], f.env.PIN_PEPPER_SOUTA);
      ok((await f.start(pins[other])).status === 503, 'cross-account duplicate PIN fails closed');
      ok((await f.start(pins[2])).status === 401, 'old Souta PIN no longer accepted');
    } finally { f.db.close(); }
  }
  for (const invalid of ['', 'short', 'A'.repeat(64), 'g'.repeat(64)]) {
    const f = fixture();
    try { f.env.PIN_PEPPER_SOUTA = invalid; ok((await f.start(pins[2])).status === 503, 'malformed dedicated key fails closed'); }
    finally { f.db.close(); }
  }
  {
    const f = fixture();
    try { delete f.env.LEGACY_SOUTA_PIN_HASH; ok((await f.start(pins[2])).status === 503, 'half-configured dedicated pair fails closed'); }
    finally { f.db.close(); }
  }
  {
    const f = fixture();
    try {
      f.env.LEGACY_SOUTA_PIN_HASH = digest(pins[2], f.env.PIN_PEPPER);
      ok((await f.start(pins[2])).status === 401, 'dedicated mode never falls back to global hash');
    } finally { f.db.close(); }
  }
  for (const invalid of [{success:false}, {hostname:'evil.invalid'}, {action:'wrong'}, {challenge_ts:'2000-01-01'}]) {
    const f = fixture();
    try { challenge = invalid; ok((await f.start(pins[2])).status === 403, 'invalid Turnstile remains rejected'); }
    finally { challenge = {}; f.db.close(); }
  }
  {
    const f = fixture();
    try {
      for (let i = 0; i < 5; i++) ok((await f.start('fixture-wrong')).status === 401, 'failure counted');
      ok((await f.start(pins[2])).status === 429, 'correct PIN cannot bypass exhausted attempt limit');
    } finally { f.db.close(); }
  }
  const source = await readFile(new URL('candidate/cf-worker/src/index.js', import.meta.url), 'utf8');
  const before = await readFile(new URL('../security-hardening-20261022/candidate/cf-worker/src/index.js', import.meta.url), 'utf8');
  const split = text => [text.slice(0, text.indexOf('async function legacyStart(')), text.slice(text.indexOf('async function legacyLogin('))];
  ok(JSON.stringify(split(source)) === JSON.stringify(split(before)), 'OAuth, sessions, saving, grants and all other Worker functions byte-identical');
  for (const name of ['guard.mjs','google-account.mjs']) ok(await readFile(new URL('candidate/cf-worker/src/' + name, import.meta.url), 'utf8') === await readFile(new URL('../security-hardening-20261022/candidate/cf-worker/src/' + name, import.meta.url), 'utf8'), 'unchanged ' + name);
  await writeFile(new URL('auth-result.json', import.meta.url), JSON.stringify({status: 'passed', checks, workerSHA256: createHash('sha256').update(source).digest('hex'), scope: 'isolated SQLite, fake Turnstile only; no real data or credentials'}, null, 2) + '\n');
  console.log('Souta dedicated key:', checks, 'isolated auth checks passed; three users, legacy compatibility, duplicate/configuration rejection, one-use tickets, origin, Turnstile and attempt limits preserved.');
} finally { globalThis.fetch = originalFetch; }
