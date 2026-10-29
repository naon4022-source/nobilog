// Isolated candidate, not integrated or executed yet.
// Inputs here come from a verified server session and server-owned game catalog.
// The adapter must persist revision CAS, active-session ownership and clear
// effects atomically. Never return this internal state directly to a browser.
const idPattern = /^[A-Za-z0-9_-]{1,80}$/;
function requireValue(ok, code) { if (!ok) throw new Error(code); }
function id(value) { requireValue(typeof value === 'string' && idPattern.test(value), 'invalid_id'); return value; }
function integer(value, min = 0) { return Number.isSafeInteger(value) && value >= min; }
function name(value) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 24 && !/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value), 'invalid_name');
  return value.trim();
}
function participant(actor) { return { uid: id(actor.uid), name: name(actor.name), ready: false, connected: true, contributed: false, lastSequence: 0 }; }
function clock(room, now) { requireValue(integer(now) && now >= room.updatedAt, 'invalid_server_time'); return now; }
function copy(raw) {
  requireValue(raw?.version === 1 && integer(raw.revision, 1) && integer(raw.updatedAt) && ['lobby', 'battle', 'paused', 'cleared'].includes(raw.phase), 'invalid_state');
  id(raw.id); id(raw.stageId); id(raw.hostUid);
  requireValue(Array.isArray(raw.members) && raw.members.length >= 1 && raw.members.length <= 3 && new Set(raw.members.map(p => p.uid)).size === raw.members.length, 'invalid_roster');
  for (const p of raw.members) {
    id(p.uid); name(p.name);
    requireValue(typeof p.ready === 'boolean' && typeof p.connected === 'boolean' && typeof p.contributed === 'boolean' && integer(p.lastSequence), 'invalid_member');
  }
  requireValue(raw.members.some(p => p.uid === raw.hostUid) && integer(raw.hp) && integer(raw.maxHp, 1) && raw.hp <= raw.maxHp && (raw.hp === 0) === (raw.phase === 'cleared'), 'invalid_boss');
  if (raw.phase !== 'lobby') requireValue(raw.members.length >= 2 && integer(raw.startedAt) && raw.startedAt <= raw.updatedAt, 'invalid_started_party');
  else requireValue(raw.startedAt === null && raw.members.every(p => !p.contributed && p.lastSequence === 0), 'invalid_waiting_party');
  if (raw.phase === 'battle') requireValue(raw.members.filter(p => p.connected).length >= 2, 'invalid_presence_state');
  if (raw.phase === 'paused') requireValue(raw.members.filter(p => p.connected).length < 2, 'invalid_presence_state');
  requireValue((raw.phase === 'cleared') === Boolean(raw.clear), 'invalid_clear');
  if (raw.clear) {
    requireValue(raw.clear.id === raw.id && raw.clear.stageId === raw.stageId && integer(raw.clear.at) && raw.clear.at >= raw.startedAt && raw.clear.at <= raw.updatedAt, 'invalid_clear');
    for (const key of ['startedMembers', 'contributors', 'presentMembers']) {
      const list = raw.clear[key];
      requireValue(Array.isArray(list) && list.length <= 3 && new Set(list.map(p => p.uid)).size === list.length, 'invalid_clear_members');
      for (const p of list) { own(raw, p.uid); name(p.name); }
    }
    requireValue(raw.clear.startedMembers.length === raw.members.length && raw.clear.contributors.length >= 1 && raw.clear.presentMembers.length >= 2, 'invalid_clear_members');
  }
  return structuredClone(raw);
}
function own(room, uid) { const p = room.members.find(p => p.uid === id(uid)); requireValue(p, 'not_member'); return p; }
function changed(room, now) { requireValue(integer(room.revision + 1, 1), 'revision_overflow'); room.revision++; room.updatedAt = now; return room; }
function connected(room) { return room.members.filter(p => p.connected); }
function live(room) { requireValue(['battle', 'paused'].includes(room.phase), 'not_live'); }

export function createParty({ roomId, stageId, host, bossHp }, now) {
  requireValue(integer(now) && integer(bossHp, 1), 'invalid_create');
  return { version: 1, id: id(roomId), stageId: id(stageId), hostUid: id(host.uid), revision: 1, updatedAt: now, startedAt: null, phase: 'lobby', maxHp: bossHp, hp: bossHp, members: [participant(host)], clear: null };
}

// Call only after invitation validation, host approval and invitee consent.
export function joinParty(raw, actor, now) {
  const room = copy(raw); clock(room, now); requireValue(room.phase === 'lobby', 'roster_locked');
  const uid = id(actor.uid);
  if (room.members.some(p => p.uid === uid)) return room;
  requireValue(room.members.length < 3, 'party_full');
  room.members.push(participant(actor));
  // New members change the proposal; everyone confirms the final roster.
  for (const p of room.members) p.ready = false;
  return changed(room, now);
}

export function readyParty(raw, uid, ready, now) {
  const room = copy(raw); clock(room, now); requireValue(room.phase === 'lobby' && typeof ready === 'boolean', 'invalid_ready');
  const p = own(room, uid); requireValue(p.connected, 'disconnected');
  if (p.ready === ready) return room;
  p.ready = ready; return changed(room, now);
}

export function startParty(raw, uid, now) {
  const room = copy(raw); clock(room, now); requireValue(id(uid) === room.hostUid, 'host_only');
  if (room.phase !== 'lobby') { requireValue(['battle', 'paused'].includes(room.phase), 'already_finished'); return room; }
  requireValue(room.members.length >= 2 && room.members.every(p => p.ready && p.connected), 'need_ready_party');
  room.phase = 'battle'; room.startedAt = now; return changed(room, now);
}

// Transport adapter owns presence leases. A browser heartbeat cannot attest
// to a different member's presence; expiry is computed using server time.
export function setConnection(raw, uid, isConnected, now) {
  const room = copy(raw); clock(room, now); const p = own(room, uid);
  requireValue(typeof isConnected === 'boolean', 'invalid_presence');
  if (room.phase === 'cleared' || p.connected === isConnected) return room;
  p.connected = isConnected;
  if (!isConnected && room.phase === 'lobby') p.ready = false;
  if (['battle', 'paused'].includes(room.phase)) room.phase = connected(room).length >= 2 ? 'battle' : 'paused';
  return changed(room, now);
}

export function leaveWaitingParty(raw, uid, now) {
  const room = copy(raw); clock(room, now); requireValue(room.phase === 'lobby', 'roster_locked');
  own(room, uid); requireValue(uid !== room.hostUid, 'host_must_cancel_room');
  room.members = room.members.filter(p => p.uid !== uid);
  for (const p of room.members) p.ready = false;
  return changed(room, now);
}

// Damage and quiz lock are server-owned. Sequence is scoped to this room and
// must not reset on reconnection. No queued offline tap batches are accepted.
// A retry returns current state without a second reward/effect.
export function attackParty(raw, uid, { sequence }, { damage, quizLocked }, now) {
  const room = copy(raw); clock(room, now); const p = own(room, uid);
  requireValue(integer(sequence, 1), 'invalid_sequence');
  if (sequence <= p.lastSequence) return { room, clearEffect: null, replay: true };
  live(room);
  requireValue(room.phase === 'battle' && connected(room).length >= 2 && p.connected, 'need_connected_party');
  requireValue(sequence === p.lastSequence + 1, 'sequence_gap');
  requireValue(integer(damage, 1) && typeof quizLocked === 'boolean' && !quizLocked, 'attack_not_allowed');
  p.lastSequence = sequence; p.contributed = true;
  const remaining = Math.max(0, room.hp - damage);
  let clearEffect = null;
  if (remaining === 0) {
    room.phase = 'cleared';
    const snapshot = member => ({ uid: member.uid, name: member.name });
    room.clear = {
      id: room.id, stageId: room.stageId, at: now,
      startedMembers: room.members.map(snapshot),
      contributors: room.members.filter(member => member.contributed).map(snapshot),
      presentMembers: connected(room).map(snapshot)
    };
    clearEffect = structuredClone(room.clear);
  }
  room.hp = remaining;
  return { room: changed(room, now), clearEffect, replay: false };
}

export function partyView(raw, uid) {
  const room = copy(raw); own(room, uid);
  const display = p => ({ name: p.name, self: p.uid === uid, ready: p.ready, connected: p.connected });
  return {
    id: room.id, revision: room.revision, stageId: room.stageId, phase: room.phase,
    hp: room.phase === 'cleared' ? 0 : room.hp, maxHp: room.maxHp,
    members: room.members.map(display),
    clear: room.clear ? {
      at: room.clear.at,
      companions: room.clear.presentMembers.filter(p => p.uid !== uid).map(p => p.name),
      presentAtClear: room.clear.presentMembers.filter(p => p.uid !== uid).map(p => p.name)
    } : null
  };
}
