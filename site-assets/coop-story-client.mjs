// tools/candidates/coop-story-rpg-20261021/client-actions.mjs
var randomId = () => crypto.randomUUID().replace(/-/g, "");
var invite = () => [...crypto.getRandomValues(new Uint8Array(8))].map((x) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[x & 31]).join("");
var methods = { profile: "POST", create: "POST", invite: "POST", leave: "POST", cancel: "POST", "join-request": "POST", approve: "POST", reject: "POST", ready: "POST", start: "POST", tap: "POST", answer: "POST", purchase: "POST", equip: "POST", heartbeat: "POST", disconnect: "POST", history: "GET", "history-more": "GET", story: "GET", pending: "GET", "join-status": "GET", state: "GET" };
var replaySafe = /* @__PURE__ */ new Set(["tap", "answer", "purchase", "create", "invite", "leave", "cancel", "join-request"]);
var failure = (code, status = 0) => Object.assign(Error(code), { code, status });
function createCoopActions(io, { makeId = randomId, makeInvite = invite, maxQueued = 20 } = {}) {
  for (const key of ["request", "isCurrent", "onState"]) if (typeof io?.[key] !== "function") throw Error("coop_actions_configuration");
  if (!Number.isSafeInteger(maxQueued) || maxQueued < 1 || maxQueued > 100) throw Error("coop_actions_capacity");
  let stopped = false, roomId = null, queue = Promise.resolve(), queued = 0, pending = null;
  let snapshot = { state: null, equipment: null, shop: [], story: null, history: [], canHost: false, connection: "connecting", retryPending: false };
  const abort = new AbortController(), current = () => !stopped && io.isCurrent() === true;
  function check() {
    if (!current()) {
      stop();
      throw failure("active_session", 409);
    }
  }
  function publish() {
    check();
    io.onState(structuredClone(snapshot));
  }
  function revoke() {
    const visible = current();
    stop();
    if (visible) {
      io.onState(structuredClone(snapshot));
      if (typeof io.onSessionChanged === "function") io.onSessionChanged();
    }
  }
  function gear(value) {
    if (value && Number.isSafeInteger(value.revision) && (!snapshot.equipment || value.revision >= snapshot.equipment.revision)) snapshot = { ...snapshot, equipment: value, profile: value };
  }
  function absorb(reply) {
    check();
    if (!reply || typeof reply !== "object") throw failure("invalid_reply");
    if (reply.state) {
      if (reply.state.id !== roomId || !Number.isSafeInteger(reply.state.revision)) throw failure("invalid_room_reply");
      if (snapshot.state && snapshot.state.id === roomId && reply.state.revision < snapshot.state.revision) return;
      snapshot = { ...snapshot, state: reply.state, canHost: reply.canHost === true };
      gear(reply.equipment);
    }
    if (Object.hasOwn(reply, "profile")) {
      if (reply.profile === null && !snapshot.equipment) snapshot.profile = null;
      else gear(reply.profile);
    }
    if (reply.view?.owned) gear(reply.view);
    if (reply.owned) gear(reply);
    if (Array.isArray(reply.shop)) snapshot.shop = reply.shop;
    if (Array.isArray(reply.items)) snapshot.history = reply.items;
    if (Array.isArray(reply.items)) snapshot.historyCursor = reply.next || null;
    if (Array.isArray(reply.completedStageIds)) snapshot.completedStageIds = reply.completedStageIds;
    if (Array.isArray(reply.stages)) snapshot.story = reply;
    if (Array.isArray(reply.requests)) snapshot.pendingRequests = reply.requests;
  }
  async function call(action, body, method = methods[action]) {
    check();
    const response = await io.request(action, { method, ...method === "GET" ? { query: body } : { body: structuredClone(body) }, signal: abort.signal });
    check();
    const data = await response.json().catch(() => null);
    check();
    if (!response.ok) {
      const error = failure(typeof data?.error === "string" ? data.error : "coop_unavailable", response.status);
      if (response.status === 401 || ["active_session", "forbidden", "origin"].includes(error.code)) revoke();
      throw error;
    }
    if (!data || typeof data !== "object") throw failure("invalid_reply");
    return data;
  }
  async function refresh() {
    if (!roomId) return snapshot;
    const reply = await call("state", { roomId });
    absorb(reply);
    publish();
    return structuredClone(snapshot);
  }
  function prepare(action, input) {
    const body = structuredClone(input || {});
    if (action === "create") {
      body.roomId = "room_" + makeId();
      body.inviteCode = makeInvite();
    }
    if (action === "invite") body.inviteCode = makeInvite();
    if (action === "join-request") body.requestId = "join_" + makeId();
    if (action === "purchase") body.operationId = "buy_" + makeId();
    if (action === "history-more") {
      if (!snapshot.historyCursor) throw failure("history_complete", 409);
      body.cursor = snapshot.historyCursor;
    }
    if (action === "join-status") Object.assign(body, snapshot.joinRequest || body);
    if (["tap", "ready", "start", "answer", "approve", "reject", "heartbeat", "disconnect", "pending", "state", "invite", "leave", "cancel"].includes(action)) {
      if (!roomId) throw failure("room_unavailable", 404);
      body.roomId = roomId;
    }
    if (action === "tap") body.sequence = (snapshot.state?.own?.lastSequence || 0) + 1;
    if (action === "answer") {
      const q = snapshot.state?.own?.question;
      if (!q || body.challengeId !== q.challengeId) throw failure("question_changed", 409);
      body.sequence = snapshot.state.own.nextAnswerSequence;
    }
    return { action, body, method: methods[action] };
  }
  async function execute(op) {
    let reply;
    try {
      try {
        reply = await call(op.action, op.body, op.method);
      } catch (error) {
        if (!current() || !replaySafe.has(op.action) || error.status > 0 && error.status < 500) throw error;
        reply = await call(op.action, op.body, op.method);
      }
    } catch (error) {
      if (current() && op.method === "POST" && (!error.status || error.status >= 500)) {
        pending = op;
        snapshot.retryPending = true;
        publish();
      }
      throw error;
    }
    check();
    pending = null;
    snapshot.retryPending = false;
    if (op.action === "leave" || op.action === "cancel") {
      clearRoom();
      publish();
      return structuredClone(snapshot);
    }
    if (op.action === "create") {
      if (reply.id !== op.body.roomId) throw failure("invalid_room_reply");
      roomId = reply.id;
      snapshot = { ...snapshot, inviteCode: op.body.inviteCode, state: null, canHost: false, pendingRequests: [], joinRequest: null, joinStatus: null };
    }
    if (op.action === "invite") {
      if (reply.id !== roomId) throw failure("invalid_room_reply");
      snapshot.inviteCode = op.body.inviteCode;
      snapshot.pendingRequests = [];
    }
    if (["join-request", "join-status"].includes(op.action)) {
      snapshot.joinRequest = { roomId: reply.roomId, requestId: reply.requestId };
      snapshot.joinStatus = reply.status;
      if (reply.status === "approved") {
        roomId = reply.roomId;
        snapshot.state = null;
        snapshot.inviteCode = null;
        snapshot.pendingRequests = [];
      }
    }
    if (op.action === "history-more") reply = { ...reply, items: [...new Map([...snapshot.history, ...reply.items].map((x) => [x.roomId, x])).values()] };
    absorb(reply);
    if (!reply.state && (op.action === "create" || ["approve", "reject", "invite"].includes(op.action) || ["join-request", "join-status"].includes(op.action) && reply.status === "approved")) await refresh();
    else publish();
    return structuredClone(snapshot);
  }
  function enqueue(task) {
    check();
    if (queued >= maxQueued) return Promise.reject(failure("client_queue_full", 429));
    queued++;
    const result = queue.catch(() => {
    }).then(() => {
      check();
      return task();
    });
    queue = result.finally(() => {
      queued--;
    });
    queue.catch(() => {
    });
    return result;
  }
  function act(action, input = {}) {
    if (action !== "retry" && !Object.hasOwn(methods, action)) return Promise.reject(failure("unknown_action", 400));
    const captured = structuredClone(input);
    try {
      return enqueue(async () => {
        if (action === "retry") {
          if (!pending) return structuredClone(snapshot);
          return execute(pending);
        }
        if (pending) throw failure("retry_required", 409);
        if (action === "tap" && snapshot.state?.own?.question) return structuredClone(snapshot);
        return execute(prepare(action, captured));
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
  function stop() {
    if (stopped) return;
    stopped = true;
    abort.abort();
    pending = null;
    roomId = null;
    snapshot = { state: null, connection: "session_changed", retryPending: false };
  }
  function clearRoom() {
    roomId = null;
    snapshot = { ...snapshot, state: null, canHost: false, inviteCode: null, pendingRequests: [], joinRequest: null, joinStatus: null };
  }
  return Object.freeze({
    act,
    refresh,
    stop,
    read() {
      check();
      return structuredClone(snapshot);
    },
    async load() {
      const profile = await call("profile", {}, "GET");
      absorb(profile);
      const history = await call("history", {}, "GET");
      absorb(history);
      const progress = await call("progress", {}, "GET");
      absorb(progress);
      publish();
      return structuredClone(snapshot);
    },
    async open(id) {
      check();
      if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw failure("invalid_id", 400);
      if (queued || pending) throw failure("client_busy", 409);
      roomId = id;
      snapshot.state = null;
      return refresh();
    },
    forgetRoom() {
      check();
      if (queued || pending) throw failure("client_busy", 409);
      clearRoom();
      publish();
    },
    accept(reply) {
      absorb(reply);
      publish();
    },
    setConnection(value) {
      check();
      snapshot.connection = value;
      publish();
    }
  });
}

// tools/candidates/coop-story-rpg-20261021/live-refresh.mjs
function createLiveRefresh(io, { later = (f, ms) => setTimeout(f, ms), cancel = (id) => clearTimeout(id) } = {}) {
  for (const key of ["connect", "fetchState", "isCurrent", "onState", "onStatus"]) if (typeof io[key] !== "function") throw Error("live_io");
  let stopped = false, started = false, listening = false, reader = null, timer = null, busy = false, dirty = false;
  let desired = 0, delivered = 0, backoff = 250;
  const controller = new AbortController();
  const current = () => !stopped && io.isCurrent() === true;
  function stop() {
    if (stopped) return;
    stopped = true;
    cancel(timer);
    timer = null;
    controller.abort();
    if (reader) void reader.cancel().catch(() => {
    });
    reader = null;
  }
  function status(value) {
    if (current()) io.onStatus(value);
  }
  function authFailure(error) {
    return [401, 403].includes(error?.status) || error?.code === "active_session";
  }
  function reconnect() {
    if (!current()) {
      stop();
      return;
    }
    if (listening) {
      if (reader) void reader.cancel().catch(() => {
      });
      return;
    }
    cancel(timer);
    timer = later(() => {
      timer = null;
      void listen();
    }, backoff);
    backoff = Math.min(5e3, backoff * 2);
  }
  async function pump() {
    if (busy || !current()) return;
    busy = true;
    try {
      while (dirty && current()) {
        dirty = false;
        const expected = desired, state = await io.fetchState(controller.signal);
        if (!current()) {
          stop();
          return;
        }
        if (!Number.isSafeInteger(state?.revision) || state.revision < 1) throw Error("state_revision");
        if (state.revision < expected) {
          status("syncing");
          reconnect();
          return;
        }
        if (state.revision >= delivered) {
          delivered = state.revision;
          io.onState(state);
          status("connected");
        }
      }
    } catch (error) {
      if (current()) {
        if (authFailure(error)) {
          status("session_changed");
          stop();
        } else {
          status("reconnecting");
          reconnect();
        }
      }
    } finally {
      busy = false;
    }
  }
  function refresh(revision = 0) {
    if (!current()) {
      stop();
      return;
    }
    if (!Number.isSafeInteger(revision) || revision < 0) throw Error("event_revision");
    desired = Math.max(desired, revision);
    dirty = true;
    void pump();
  }
  function event(block) {
    let kind = "", data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) kind = line.slice(6).trim();
      if (line.startsWith("data:")) {
        if (data) throw Error("event_data");
        data = line.slice(5).trim();
      }
    }
    if (!data && !kind) return;
    if (!["ready", "refresh"].includes(kind)) throw Error("event_kind");
    const packet = JSON.parse(data);
    if (!packet || Object.keys(packet).length !== 1 || !Number.isSafeInteger(packet.revision) || packet.revision < (kind === "ready" ? 0 : 1)) throw Error("event_revision");
    if (kind === "ready") refresh();
    else if (packet.revision > delivered) refresh(packet.revision);
  }
  async function listen() {
    if (!current()) {
      stop();
      return;
    }
    if (listening) return;
    listening = true;
    let localReader = null;
    const connectedAt = Date.now();
    try {
      status("connecting");
      const response = await io.connect(controller.signal);
      if (!current()) {
        void response.body?.cancel().catch(() => {
        });
        stop();
        return;
      }
      if (!response.ok) {
        const error = Error("event_connection");
        error.status = response.status;
        if (response.status === 409) {
          const body = await response.json().catch(() => null);
          if (body?.error === "active_session") error.code = "active_session";
        }
        throw error;
      }
      if (!response.body || !response.headers.get("content-type")?.startsWith("text/event-stream")) throw Error("event_type");
      localReader = response.body.getReader();
      reader = localReader;
      const decoder = new TextDecoder("utf-8", { fatal: true });
      let buffer = "";
      while (current()) {
        const { done, value } = await localReader.read();
        if (done) break;
        if (!current()) break;
        buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, "\n");
        if (buffer.length > 4096) throw Error("event_size");
        let split;
        while ((split = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);
          event(block);
        }
      }
    } catch (error) {
      if (current()) {
        if (authFailure(error)) {
          status("session_changed");
          stop();
        } else status("reconnecting");
      }
    } finally {
      if (localReader) {
        await localReader.cancel().catch(() => {
        });
        if (reader === localReader) reader = null;
      }
      listening = false;
      if (Date.now() - connectedAt >= 1e4) backoff = 250;
      if (current()) reconnect();
      else stop();
    }
  }
  return Object.freeze({
    start() {
      if (started || stopped) return;
      started = true;
      void listen();
    },
    refresh,
    stop
  });
}

// tools/candidates/coop-story-rpg-20261021/view-dom.mjs
function reconcileChildren(parent, next) {
  const children = [...next.childNodes];
  for (let i = 0; i < children.length; i++) {
    let old = parent.childNodes[i];
    const fresh = children[i], key = fresh.dataset?.coopKey;
    if (key !== void 0) {
      const match = [...parent.childNodes].slice(i).find((node) => node.nodeName === fresh.nodeName && node.dataset?.coopKey === key);
      if (!match) {
        parent.insertBefore(fresh, old || null);
        continue;
      }
      if (match !== old) parent.insertBefore(match, old || null);
      old = match;
    } else if (old?.dataset?.coopKey !== void 0) {
      parent.insertBefore(fresh, old);
      continue;
    }
    if (!old) parent.append(fresh);
    else reconcile(old, fresh);
  }
  while (parent.childNodes.length > children.length) parent.lastChild.remove();
}
function reconcile(old, fresh) {
  if (old.nodeType !== fresh.nodeType || old.nodeName !== fresh.nodeName || old.dataset?.coopKey !== fresh.dataset?.coopKey) {
    old.replaceWith(fresh);
    return;
  }
  if (old.nodeType === 3) {
    if (old.nodeValue !== fresh.nodeValue) old.nodeValue = fresh.nodeValue;
    return;
  }
  if (old.nodeType !== 1) return;
  const questionChanged = old.dataset.coopAnswer !== fresh.dataset.coopAnswer;
  for (const attribute of [...old.attributes]) if (!fresh.hasAttribute(attribute.name)) old.removeAttribute(attribute.name);
  for (const attribute of [...fresh.attributes]) if (old.getAttribute(attribute.name) !== attribute.value) old.setAttribute(attribute.name, attribute.value);
  old.onclick = fresh.onclick;
  old.onsubmit = fresh.onsubmit;
  old.oninput = fresh.oninput;
  if (old.nodeName === "TEXTAREA" && (questionChanged || old.value !== fresh.value)) old.value = fresh.value;
  reconcileChildren(old, fresh);
}

// tools/candidates/coop-story-rpg-20261021/view.mjs
function mountCoopView(root, io) {
  if (!root?.ownerDocument || typeof io?.onAction !== "function" || typeof io?.isCurrent !== "function" || typeof io?.renderPrompt !== "function") throw Error("coop_view_configuration");
  const doc = root.ownerDocument;
  let destroyed = false, busy = false, pendingTaps = 0, snapshot = null, questionId = null, answerDraft = "", activeTab = "party", storySection = 0, selectedStage = null;
  const current = () => !destroyed && io.isCurrent() === true;
  function node(tag, text, cls) {
    const el = doc.createElement(tag);
    if (text !== void 0) el.textContent = String(text);
    if (cls) el.className = cls;
    return el;
  }
  function button(text, action, detail = {}, disabled = false) {
    const b = node("button", text);
    b.type = "button";
    b.dataset.coopKey = action + ":" + (detail.itemId || detail.requestId || detail.challengeId || detail.stageId || detail.roomId || "");
    b.disabled = disabled || busy || snapshot?.retryPending === true && action !== "retry";
    b.onclick = () => void invoke(action, detail);
    return b;
  }
  function info(text) {
    const p = node("p", text, "nobi-coop-info");
    p.setAttribute("role", "status");
    return p;
  }
  function field(label, name, { type = "text", maxLength = 80, value = "" } = {}) {
    const wrap = node("label", label), input = node("input");
    input.name = name;
    input.type = type;
    input.maxLength = maxLength;
    input.value = value;
    input.autocomplete = "off";
    wrap.append(input);
    return { wrap, input };
  }
  function form(title, fields, action, extra = {}, disabled = false) {
    const f = node("form"), heading = node("h3", title);
    f.dataset.coopKey = "form:" + action;
    f.append(heading);
    const controls = fields.map((spec) => field(...spec));
    for (const c of controls) f.append(c.wrap);
    const submit = node("button", title);
    submit.type = "submit";
    submit.disabled = disabled || busy || snapshot?.retryPending === true;
    f.append(submit);
    f.onsubmit = (event) => {
      event.preventDefault();
      if (disabled || busy || snapshot?.retryPending) return;
      void invoke(action, { ...extra, ...Object.fromEntries(fields.map((spec) => [spec[1], event.currentTarget.elements.namedItem(spec[1]).value.trim()])) });
    };
    return f;
  }
  function joinForm() {
    const join = form("\u62DB\u5F85\u30B3\u30FC\u30C9\u3067\u53C2\u52A0\u3092\u7533\u3057\u8FBC\u3080", [["\u62DB\u5F85\u30B3\u30FC\u30C9", "inviteCode", { maxLength: 8 }]], "join-request", { consent: true });
    const consent = node("label", "\u3053\u306E\u90E8\u5C4B\u306E\u53C2\u52A0\u8005\u306B\u81EA\u5206\u306E\u8868\u793A\u540D\u3092\u4F1D\u3048\u3001\u5354\u529B\u3057\u3066\u904A\u3076\u3053\u3068\u306B\u540C\u610F\u3057\u307E\u3059\u3002");
    const checkbox = node("input");
    checkbox.type = "checkbox";
    checkbox.required = true;
    consent.prepend(checkbox);
    join.insertBefore(consent, join.lastChild);
    return join;
  }
  const errors = { active_session: "\u30ED\u30B0\u30A4\u30F3\u72B6\u614B\u304C\u5909\u308F\u308A\u307E\u3057\u305F\u3002\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002", host_only: "\u90E8\u5C4B\u3092\u4F5C\u3063\u305F\u4EBA\u304C\u64CD\u4F5C\u3057\u3066\u304F\u3060\u3055\u3044\u3002", need_connected_party: "\u4EF2\u9593\u304C2\u4EBA\u4EE5\u4E0A\u3064\u306A\u304C\u308B\u307E\u3067\u5F85\u3063\u3066\u304F\u3060\u3055\u3044\u3002", need_ready_party: "\u5168\u54E1\u306E\u6E96\u5099\u304C\u3067\u304D\u308B\u307E\u3067\u5F85\u3063\u3066\u304F\u3060\u3055\u3044\u3002", insufficient_coins: "RPG\u30B3\u30A4\u30F3\u304C\u8DB3\u308A\u307E\u305B\u3093\u3002", room_unavailable: "\u3053\u306E\u90E8\u5C4B\u306F\u958B\u3051\u307E\u305B\u3093\u3002\u62DB\u5F85\u3068\u53C2\u52A0\u72B6\u6CC1\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002", invite_unavailable: "\u62DB\u5F85\u304C\u898B\u3064\u304B\u3089\u306A\u3044\u304B\u3001\u671F\u9650\u304C\u5207\u308C\u3066\u3044\u307E\u3059\u3002", tap_rate: "\u5C11\u3057\u5F85\u3063\u3066\u304B\u3089\u30BF\u30C3\u30D7\u3057\u3066\u304F\u3060\u3055\u3044\u3002", question_changed: "\u554F\u984C\u304C\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F\u3002\u6700\u65B0\u306E\u8868\u793A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002" };
  let message = "";
  async function invoke(action, detail) {
    if (!current()) {
      destroy();
      return;
    }
    if (busy) return;
    const tapping = action === "tap";
    if (tapping && pendingTaps >= 20) return;
    if (tapping) pendingTaps++;
    else busy = true;
    message = "";
    if (!tapping || pendingTaps >= 20) paint();
    try {
      const result = await io.onAction(action, detail);
      if (!current()) {
        destroy();
        return;
      }
      if (result) accept(result);
    } catch (error) {
      if (current()) message = errors[error?.code] || "\u901A\u4FE1\u3092\u78BA\u8A8D\u3057\u3066\u3001\u3082\u3046\u4E00\u5EA6\u8A66\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
    } finally {
      if (tapping) pendingTaps--;
      else busy = false;
      if (current()) paint();
      else destroy();
    }
  }
  function accept(next) {
    if (!next || typeof next !== "object") throw Error("coop_view_payload");
    const id = next.state?.own?.question?.challengeId || null;
    if (id !== questionId) {
      questionId = id;
      answerDraft = "";
    }
    snapshot = next;
  }
  function avatar(profile) {
    const figure = node("figure", void 0, "nobi-coop-avatar");
    figure.dataset.body = profile?.body === "female" ? "female" : "male";
    figure.dataset.armored = String(Boolean(profile && profile.armor !== "\u88C5\u5099\u306A\u3057"));
    const shape = node("div", void 0, "nobi-coop-body");
    shape.setAttribute("aria-hidden", "true");
    shape.append(node("i"), node("b"), node("span"));
    if (profile && profile.weapon !== "\u7D20\u624B") shape.append(node("em", profile.weapon.includes("\u6756") ? "\u2502" : "\u2694", "nobi-coop-weapon"));
    figure.append(shape, node("figcaption", profile ? `${profile.body === "female" ? "\u5973\u6027" : "\u7537\u6027"}\u30FB${profile.weapon}\uFF0F${profile.armor}` : "\u4F53\u3092\u9078\u3093\u3067\u65C5\u3092\u59CB\u3081\u3088\u3046"));
    return figure;
  }
  function party(panel, data) {
    const state = data.state, profile = data.equipment || data.profile;
    panel.append(avatar(profile));
    if (!profile) {
      panel.append(info("\u6700\u521D\u306F\u7D20\u624B\u30FB\u9632\u5177\u306A\u3057\u3067\u3059\u3002\u898B\u305F\u76EE\u306F\u3044\u3064\u3067\u3082\u65C5\u306E\u88C5\u5099\u306B\u5408\u308F\u305B\u3066\u5909\u308F\u308A\u307E\u3059\u3002"));
      panel.append(button("\u7537\u6027\u306E\u4F53\u3067\u59CB\u3081\u308B", "profile", { body: "male" }), button("\u5973\u6027\u306E\u4F53\u3067\u59CB\u3081\u308B", "profile", { body: "female" }));
      return;
    }
    if (!state) {
      panel.append(info("2\u301C3\u4EBA\u3067\u5354\u529B\u3059\u308B\u7269\u8A9E\u3067\u3059\u3002\u62DB\u5F85\u3055\u308C\u305F\u4EBA\u306E\u540C\u610F\u3068\u3001\u90E8\u5C4B\u3092\u4F5C\u3063\u305F\u4EBA\u306E\u627F\u8A8D\u3067\u53C2\u52A0\u3057\u307E\u3059\u3002"));
      const stageId = data.nextStageId || "story_01";
      panel.append(button("\u4EF2\u9593\u3092\u62DB\u5F85\u3059\u308B\u90E8\u5C4B\u3092\u4F5C\u308B", "create", { stageId }));
      panel.append(joinForm());
      if (data.joinStatus) panel.append(info(data.joinStatus === "pending" ? "\u53C2\u52A0\u306E\u627F\u8A8D\u3092\u5F85\u3063\u3066\u3044\u307E\u3059\u3002" : "\u53C2\u52A0\u72B6\u6CC1\u3092\u66F4\u65B0\u3057\u3066\u304F\u3060\u3055\u3044\u3002"));
      return;
    }
    panel.append(node("h3", data.stageTitle || state.stageId));
    if (data.inviteCode && state.phase === "lobby") panel.append(info("\u62DB\u5F85\u30B3\u30FC\u30C9\uFF1A" + data.inviteCode));
    const members = node("ul", void 0, "nobi-coop-members");
    for (const m of state.members || []) members.append(node("li", `${m.name}${m.self ? "\uFF08\u3042\u306A\u305F\uFF09" : ""}\uFF1A${m.connected ? "\u63A5\u7D9A\u4E2D" : "\u518D\u63A5\u7D9A\u5F85\u3061"}${m.ready ? "\u30FB\u6E96\u5099\u3067\u304D\u305F" : ""}${m.questionPending ? "\u30FB\u554F\u984C\u306B\u6311\u6226\u4E2D" : ""}`));
    panel.append(members);
    if (data.canHost && state.phase !== "cleared") panel.append(button(state.phase === "lobby" ? "\u3053\u306E\u90E8\u5C4B\u3092\u9589\u3058\u308B" : "\u3053\u306E\u5192\u967A\u3092\u3084\u3081\u3066\u90E8\u5C4B\u3092\u9589\u3058\u308B", "cancel", { roomId: state.id }));
    const live = (state.members || []).filter((m) => m.connected).length, self = state.members?.find((m) => m.self);
    if (state.phase === "lobby") {
      if (!data.canHost) panel.append(button("\u90E8\u5C4B\u304B\u3089\u629C\u3051\u308B", "leave", { roomId: state.id }));
      panel.append(button(self?.ready ? "\u6E96\u5099\u3092\u53D6\u308A\u6D88\u3059" : "\u6E96\u5099\u3067\u304D\u305F", "ready", { roomId: state.id, ready: !self?.ready }, !self?.connected));
      if (data.canHost === true) {
        if (state.members.length < 3) {
          panel.append(button("\u62DB\u5F85\u30B3\u30FC\u30C9\u3092\u4F5C\u308A\u76F4\u3059", "invite", { roomId: state.id }));
          if (!data.inviteCode) panel.append(info("\u30B3\u30FC\u30C9\u3092\u4F5C\u308A\u76F4\u3059\u3068\u3001\u4EF2\u9593\u3092\u62DB\u5F85\u3067\u304D\u307E\u3059\u3002"));
        }
        for (const request of data.pendingRequests || []) {
          const row = node("div", request.name);
          row.append(button("\u53C2\u52A0\u3092\u627F\u8A8D", "approve", { roomId: state.id, requestId: request.requestId }), button("\u898B\u9001\u308B", "reject", { roomId: state.id, requestId: request.requestId }));
          panel.append(row);
        }
        const ready = live >= 2 && live <= 3 && state.members.every((m) => m.ready && m.connected);
        panel.append(button("\u5168\u54E1\u3067\u51FA\u767A\u3059\u308B", "start", { roomId: state.id }, !ready));
      }
      if (live < 2) panel.append(info("\u76F8\u65B9\u304C\u63A5\u7D9A\u3059\u308B\u3068\u51FA\u767A\u3067\u304D\u307E\u3059\u30021\u4EBA\u3067\u306F\u904A\u3079\u307E\u305B\u3093\u3002"));
      return;
    }
    if (state.phase === "cleared") {
      panel.append(node("h3", "\u30B9\u30C6\u30FC\u30B8\u30AF\u30EA\u30A2\uFF01"));
      const included = state.clear?.selfPresentAtClear === true;
      panel.append(info(included ? `\u4E00\u7DD2\u306B\u30AF\u30EA\u30A2\uFF1A${state.clear.companions?.join("\u30FB") || "\u8A18\u9332\u3092\u78BA\u8A8D\u4E2D"}` : "\u4EF2\u9593\u304C\u30AF\u30EA\u30A2\u3057\u307E\u3057\u305F\u3002\u3042\u306A\u305F\u306E\u30AF\u30EA\u30A2\u8A18\u9332\u306F\u5C65\u6B74\u3067\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"));
      if (data.loadingClear) panel.append(info("\u30AF\u30EA\u30A2\u5C65\u6B74\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059\u2026"));
      else if (data.nextStageId) panel.append(button(data.nextStageId === state.stageId ? "\u3053\u306E\u30B9\u30C6\u30FC\u30B8\u306B\u518D\u6311\u6226\u3059\u308B" : "\u6B21\u306E\u30B9\u30C6\u30FC\u30B8\u306E\u90E8\u5C4B\u3092\u4F5C\u308B", "create", { stageId: data.nextStageId }));
      if (data.joinStatus === "pending") panel.append(info("\u6B21\u306E\u90E8\u5C4B\u3078\u306E\u53C2\u52A0\u627F\u8A8D\u3092\u5F85\u3063\u3066\u3044\u307E\u3059\u3002"));
      else panel.append(joinForm());
      panel.append(button("\u30AF\u30EA\u30A2\u5C65\u6B74\u3092\u66F4\u65B0\u3059\u308B", "history"));
      return;
    }
    const hp = node("progress");
    hp.max = state.maxHp;
    hp.value = state.hp;
    hp.setAttribute("aria-label", "\u30DC\u30B9\u306E\u6B8B\u308A\u4F53\u529B");
    panel.append(hp, node("p", `\u30DC\u30B9\u306E\u4F53\u529B ${state.hp} / ${state.maxHp}`));
    if (state.phase === "countdown") {
      panel.append(info(Number.isInteger(data.countdownSeconds) ? `\u51FA\u767A\u307E\u3067 ${data.countdownSeconds} \u79D2` : "\u5168\u54E1\u306E\u6E96\u5099\u304C\u3067\u304D\u307E\u3057\u305F\u3002\u307E\u3082\u306A\u304F\u59CB\u307E\u308A\u307E\u3059\u3002"));
      return;
    }
    if (live < 2 || state.phase === "paused") {
      panel.append(info("\u4EF2\u9593\u306E\u518D\u63A5\u7D9A\u3092\u5F85\u3063\u3066\u3044\u307E\u3059\u3002\u653B\u6483\u3068\u9032\u884C\u3092\u6B62\u3081\u3066\u3044\u307E\u3059\u3002"));
      return;
    }
    const question = state.own?.question;
    if (question) {
      const block = node("section", void 0, "nobi-coop-question");
      block.append(node("h3", "\u81EA\u5206\u304C\u6B63\u89E3\u3057\u305F\u554F\u984C\u3092\u3001\u3082\u3046\u4E00\u5EA6"));
      const prompt = node("div", void 0, "nobi-coop-prompt");
      io.renderPrompt(prompt, question);
      block.append(prompt);
      const f = node("form"), label = node("label", "\u7B54\u3048"), input = node("textarea");
      f.dataset.coopKey = "answer:" + question.challengeId;
      input.maxLength = 4e3;
      input.value = answerDraft;
      input.dataset.coopAnswer = question.challengeId;
      input.disabled = busy || snapshot?.retryPending === true;
      label.append(input);
      f.append(label);
      input.oninput = (event) => {
        answerDraft = event.currentTarget.value;
      };
      const submit = node("button", "\u7B54\u3048\u3092\u78BA\u304B\u3081\u308B");
      submit.type = "submit";
      submit.disabled = busy || snapshot?.retryPending === true;
      f.append(submit);
      f.onsubmit = (event) => {
        event.preventDefault();
        if (busy || snapshot?.retryPending) return;
        void invoke("answer", { roomId: state.id, challengeId: question.challengeId, sequence: state.own.nextAnswerSequence, answer: event.currentTarget.querySelector("textarea").value });
      };
      block.append(f);
      if (state.own.lastResult?.challengeId === question.challengeId) block.append(info(state.own.lastResult.near ? "\u60DC\u3057\u3044\u3002\u8868\u8A18\u3082\u78BA\u304B\u3081\u3066\u3082\u3046\u4E00\u5EA6\u3002" : "\u3082\u3046\u4E00\u5EA6\u3001\u554F\u984C\u3092\u3088\u304F\u8AAD\u3082\u3046\u3002"));
      panel.append(block);
      return;
    }
    const canTap = data.connection === "connected" && self?.connected === true && state.phase === "battle";
    const tap = button("\u30BF\u30C3\u30D7\u3057\u3066\u653B\u6483", "tap", { roomId: state.id, sequence: (state.own?.lastSequence || 0) + 1 }, !canTap || pendingTaps >= 20 || data.retryPending === true);
    tap.className = "nobi-coop-tap";
    tap.setAttribute("aria-label", "\u56DB\u89D2\u3044\u5149\u3092\u30BF\u30C3\u30D7\u3057\u3066\u653B\u6483");
    panel.append(tap);
    panel.append(info(profile.damage ? `1\u30BF\u30C3\u30D7\u306E\u653B\u6483\u529B\uFF1A${profile.damage}` : "\u653B\u6483\u529B\u3092\u78BA\u8A8D\u4E2D"));
  }
  function story(panel, data) {
    const stages = data.story?.stages || [];
    const stage = stages.find((s) => s.id === (selectedStage || data.state?.stageId)) || stages[0];
    if (!stage) {
      panel.append(info("\u7269\u8A9E\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u304F\u3060\u3055\u3044\u3002"), button("\u7269\u8A9E\u3092\u8AAD\u307F\u8FBC\u3080", "story"));
      return;
    }
    const allowed = /* @__PURE__ */ new Set([data.state?.stageId, ...data.completedStageIds || [], ...(data.history || []).map((x) => x.stageId)]);
    if (!allowed.has(stage.id)) {
      panel.append(info("\u4EF2\u9593\u3068\u9032\u3080\u30B9\u30C6\u30FC\u30B8\u304B\u3001\u30AF\u30EA\u30A2\u6E08\u307F\u306E\u7269\u8A9E\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002"));
    } else {
      const section = stage.sections[Math.min(storySection, stage.sections.length - 1)];
      panel.append(node("h3", `${stage.number}\u7AE0 ${stage.title}`), node("h4", section.title));
      for (const text of section.paragraphs) panel.append(node("p", text, "nobi-coop-prose"));
      const nav = node("nav");
      for (const [label, step] of [["\u524D\u306E\u5834\u9762", -1], ["\u6B21\u306E\u5834\u9762", 1]]) {
        const b = node("button", label);
        b.type = "button";
        b.dataset.coopKey = "scene:" + step;
        b.disabled = storySection + step < 0 || storySection + step >= stage.sections.length;
        b.onclick = () => {
          storySection += step;
          paint();
        };
        nav.append(b);
      }
      panel.append(nav);
    }
    for (const item of stages.filter((s) => allowed.has(s.id))) {
      const b = node("button", `${item.number}\u7AE0 ${item.title}`);
      b.type = "button";
      b.dataset.coopKey = "chapter:" + item.id;
      b.onclick = () => {
        selectedStage = item.id;
        storySection = 0;
        paint();
      };
      panel.append(b);
    }
  }
  function shop(panel, data) {
    const profile = data.equipment || data.profile;
    if (!profile) {
      panel.append(info("\u5148\u306B\u4F53\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002"));
      return;
    }
    const coins = profile.coins;
    panel.append(avatar(profile), info(`RPG\u30B3\u30A4\u30F3\uFF1A${Number.isSafeInteger(coins) ? coins : "\u78BA\u8A8D\u4E2D"}`));
    const owned = new Set((profile.owned || []).map((x) => x.id));
    for (const item of data.shop || []) {
      const row = node("div", void 0, "nobi-coop-shop-item");
      row.append(node("h3", item.label), node("p", `${item.slot === "armor" ? "\u9632\u5177\u306E\u8FFD\u52A0\u653B\u6483\u529B +" : "\u6B66\u5668\u306E\u653B\u6483\u529B "}${item.power}\u30FB${item.price}\u30B3\u30A4\u30F3`));
      row.append(owned.has(item.id) ? button("\u88C5\u5099\u3059\u308B", "equip", { itemId: item.id }) : button("\u8CB7\u3046", "purchase", { itemId: item.id }, !Number.isSafeInteger(coins) || coins < item.price));
      panel.append(row);
    }
  }
  function history(panel, data) {
    panel.append(button("\u5C65\u6B74\u3092\u66F4\u65B0\u3059\u308B", "history"));
    if (!data.history?.length) {
      panel.append(info("\u4E00\u7DD2\u306B\u30AF\u30EA\u30A2\u3057\u305F\u30B9\u30C6\u30FC\u30B8\u304C\u3053\u3053\u306B\u6B8B\u308A\u307E\u3059\u3002"));
      return;
    }
    for (const item of data.history) {
      const entry = node("article");
      entry.append(node("h3", item.stageTitle || item.stageId), node("p", `\u4E00\u7DD2\u306B\u30AF\u30EA\u30A2\uFF1A${(item.companions || []).join("\u30FB")}`));
      panel.append(entry);
    }
    if (data.historyCursor) panel.append(button("\u4EE5\u524D\u306E\u30AF\u30EA\u30A2\u3092\u898B\u308B", "history-more"));
  }
  function paint() {
    if (!current()) {
      destroy();
      return;
    }
    const focused = doc.activeElement?.dataset?.coopAnswer, selection = focused ? [doc.activeElement.selectionStart, doc.activeElement.selectionEnd] : null;
    const shell = node("section", void 0, "nobi-coop");
    shell.append(node("h2", "\u4EF2\u9593\u3068\u8AAD\u3080\u5192\u967A"));
    const tabs = node("nav", void 0, "nobi-coop-tabs");
    tabs.setAttribute("aria-label", "\u5354\u529B\u5192\u967A\u306E\u753B\u9762");
    for (const [id, label] of [["party", "\u5192\u967A"], ["story", "\u7269\u8A9E"], ["shop", "\u88C5\u5099\u306E\u304A\u5E97"], ["history", "\u30AF\u30EA\u30A2\u5C65\u6B74"]]) {
      const b = node("button", label);
      b.type = "button";
      b.dataset.coopKey = "tab:" + id;
      b.setAttribute("aria-pressed", String(activeTab === id));
      b.onclick = () => {
        activeTab = id;
        paint();
      };
      tabs.append(b);
    }
    shell.append(tabs);
    const data = snapshot || {};
    if (data.connection && data.connection !== "connected") shell.append(info(data.connection === "session_changed" ? "\u30ED\u30B0\u30A4\u30F3\u72B6\u614B\u304C\u5909\u308F\u308A\u307E\u3057\u305F\u3002" : "\u63A5\u7D9A\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059\u3002\u653B\u6483\u306F\u78BA\u5B9A\u3059\u308B\u307E\u3067\u53CD\u6620\u3057\u307E\u305B\u3093\u3002"));
    if (data.retryPending) shell.append(info("\u524D\u306E\u64CD\u4F5C\u306E\u7D50\u679C\u3092\u78BA\u8A8D\u3059\u308B\u307E\u3067\u3001\u65B0\u3057\u3044\u64CD\u4F5C\u3092\u6B62\u3081\u3066\u3044\u307E\u3059\u3002"), button("\u540C\u3058\u64CD\u4F5C\u3092\u518D\u9001\u3059\u308B", "retry"));
    if (message) shell.append(info(message));
    if (busy) shell.append(info("\u4FDD\u5B58\u3068\u53CD\u6620\u3092\u78BA\u8A8D\u3057\u3066\u3044\u307E\u3059\u2026"));
    const panel = node("section");
    panel.dataset.coopKey = "panel:" + activeTab + ":" + (data.state?.id || "") + (activeTab === "party" ? ":" + (data.state?.phase || "setup") : "");
    ({ party, story, shop, history })[activeTab](panel, data);
    shell.append(panel);
    const frame = node("div");
    frame.append(shell);
    reconcileChildren(root, frame);
    if (focused === questionId) {
      const input = root.querySelector("textarea[data-coop-answer]");
      if (input) {
        input.focus({ preventScroll: true });
        if (selection) input.setSelectionRange(...selection);
      }
    }
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    answerDraft = "";
    snapshot = null;
    root.replaceChildren();
  }
  return Object.freeze({ render(next) {
    if (!current()) {
      destroy();
      return;
    }
    accept(next);
    paint();
  }, destroy });
}

// tools/candidates/coop-story-rpg-20261021/game-controller.mjs
var err = (code, status = 0) => Object.assign(Error(code), { code, status });
function mountCoopGame(root, io) {
  for (const key of ["request", "isCurrent", "renderPrompt"]) if (typeof io?.[key] !== "function") throw Error("coop_game_configuration");
  const doc = root.ownerDocument, win = doc.defaultView, scope = new AbortController();
  let alive = true, visible = doc.visibilityState !== "hidden", started = false, room = null, events = null, pulseTimer = null, clockTimer = null, pulsing = false, clockReading = false, lastClear = null;
  let snapshot = null, timeKey = null, timeReceived = 0, serverReceived = 0, loadingClear = false;
  const connectionId = "conn_" + crypto.randomUUID().replace(/-/g, "");
  const current = () => alive && io.isCurrent() === true;
  const view = mountCoopView(root, { isCurrent: current, renderPrompt: io.renderPrompt, onAction: operate });
  const actions = createCoopActions({ isCurrent: current, onState: receive, onSessionChanged: () => destroy(false), request: (action, options) => {
    if (!visible) throw err("view_hidden", 409);
    return request(action, options);
  } });
  function clearTimers() {
    clearTimeout(pulseTimer);
    clearTimeout(clockTimer);
    pulseTimer = null;
    clockTimer = null;
  }
  async function request(action, options) {
    if (!current()) throw err("active_session", 409);
    const response = await io.request(action, { ...options, signal: options.signal || scope.signal });
    if (!current()) {
      void response.body?.cancel().catch(() => {
      });
      throw err("active_session", 409);
    }
    return response;
  }
  async function json(action, options) {
    const response = await request(action, options), data = await response.json();
    if (!current()) throw err("active_session", 409);
    if (!response.ok) {
      const error = err(data?.error || "coop_unavailable", response.status);
      if (response.status === 401 || ["active_session", "forbidden", "origin"].includes(error.code)) destroy(false);
      throw error;
    }
    return data;
  }
  function rendered() {
    if (!snapshot) return null;
    const out = structuredClone(snapshot);
    const stages = out.story?.stages || [], completed = new Set(out.completedStageIds || []);
    out.stageTitle = stages.find((x) => x.id === out.state?.stageId)?.title;
    out.nextStageId = stages.find((x) => !completed.has(x.id))?.id;
    out.loadingClear = loadingClear;
    out.history = (out.history || []).map((x) => ({ ...x, stageTitle: stages.find((s) => s.id === x.stageId)?.title || x.stageId }));
    if (out.state?.phase === "countdown" && Number.isFinite(out.state.combatOpensAt) && Number.isFinite(serverReceived)) out.countdownSeconds = Math.max(0, Math.ceil((out.state.combatOpensAt - serverReceived - (performance.now() - timeReceived)) / 1e3));
    return out;
  }
  function paint() {
    if (current() && visible && snapshot) view.render(rendered());
  }
  function receive(value) {
    if (!current()) {
      destroy(false);
      return;
    }
    snapshot = value;
    const state = value.state, key = state ? `${state.id}:${state.revision}:${state.serverNow}:${state.combatOpensAt}` : null;
    if (key !== timeKey) {
      timeKey = key;
      timeReceived = performance.now();
      serverReceived = state?.serverNow ?? 0;
    }
    const next = state?.id || null;
    if (next !== room) {
      events?.stop();
      events = null;
      room = next;
      if (typeof io.onRoom === "function") io.onRoom(room);
      if (visible) startEvents();
    }
    if (state?.phase === "cleared") {
      events?.stop();
      events = null;
      if (lastClear !== room) {
        lastClear = room;
        loadingClear = true;
        void actions.load().catch(() => {
        }).finally(() => {
          loadingClear = false;
          paint();
        });
      }
    }
    paint();
    if (visible && !pulseTimer && !pulsing) schedulePulse();
    if (state?.phase === "countdown" && visible && !clockTimer) scheduleClock();
  }
  function status(value) {
    if (!current()) return;
    if (value === "session_changed") {
      destroy(false);
      return;
    }
    actions.setConnection(value);
    if (typeof io.onStatus === "function") io.onStatus(value);
  }
  function roomLost(error, id) {
    if (!current() || room !== id || error.code !== "room_unavailable") return false;
    try {
      actions.forgetRoom();
      actions.setConnection("connected");
      return true;
    } catch (_) {
      return false;
    }
  }
  function startEvents() {
    if (!current() || !visible || !room || snapshot?.state?.phase === "cleared" || events) return;
    const id = room;
    events = createLiveRefresh({
      isCurrent: () => current() && visible && room === id,
      connect: (signal) => request("events", { method: "GET", query: { roomId: id }, signal }),
      fetchState: async (signal) => {
        try {
          const data = await json("state", { method: "GET", query: { roomId: id }, signal });
          if (room !== id) throw err("room_changed", 409);
          actions.accept(data);
          return data.state;
        } catch (error) {
          roomLost(error, id);
          throw error;
        }
      },
      onState: () => {
      },
      onStatus: status
    });
    events.start();
  }
  function schedulePulse(delay = 2e3) {
    clearTimeout(pulseTimer);
    if (current() && visible) pulseTimer = setTimeout(() => {
      pulseTimer = null;
      void pulse();
    }, delay);
  }
  async function pulse() {
    if (!current()) {
      destroy(false);
      return;
    }
    if (!visible || pulsing) return;
    pulsing = true;
    const id = room;
    try {
      if (id && ["lobby", "battle", "paused"].includes(snapshot?.state?.phase)) {
        const data = await json("heartbeat", { method: "POST", body: { roomId: id, connectionId } });
        if (room === id) actions.accept(data);
        if (snapshot?.canHost && snapshot.state.phase === "lobby" && !snapshot.retryPending) await actions.act("pending");
      } else if (snapshot?.joinStatus === "pending" && !snapshot.retryPending) await actions.act("join-status");
      startEvents();
    } catch (error) {
      if (error.code === "presence_unavailable" && current() && room === id) {
        try {
          await actions.refresh();
        } catch (fresh) {
          if (roomLost(fresh, id)) return;
        }
      }
      if (!roomLost(error, id) && current() && error.code !== "view_hidden") status("reconnecting");
    } finally {
      pulsing = false;
      if (current() && visible) schedulePulse(id !== room ? 0 : 2e3);
    }
  }
  function scheduleClock() {
    clearTimeout(clockTimer);
    if (!current() || !visible || snapshot?.state?.phase !== "countdown") return;
    clockTimer = setTimeout(async () => {
      clockTimer = null;
      if (!current() || !visible) return;
      paint();
      if (rendered()?.countdownSeconds === 0 && !clockReading) {
        clockReading = true;
        try {
          await actions.refresh();
        } catch (_) {
        } finally {
          clockReading = false;
        }
      }
      scheduleClock();
    }, 250);
  }
  async function operate(action, detail) {
    if (!current() || !visible) throw err("view_hidden", 409);
    if (action === "cancel" && snapshot?.state?.phase !== "lobby" && !win.confirm("\u3053\u306E\u5192\u967A\u3092\u7D42\u4E86\u3057\u307E\u3059\u304B\uFF1F \u4ECA\u56DE\u306E\u9014\u4E2D\u7D4C\u904E\u306F\u518D\u958B\u3067\u304D\u307E\u305B\u3093\u3002\u5B66\u7FD2\u8A18\u9332\u3068\u30AF\u30EA\u30A2\u6E08\u307F\u306E\u5C65\u6B74\u306F\u6B8B\u308A\u307E\u3059\u3002")) return;
    await actions.act(action, detail);
    if (!current()) return;
    if (["create", "join-status", "approve", "start", "invite"].includes(action)) schedulePulse(0);
  }
  function disconnect() {
    if (!room || !current()) return;
    try {
      void Promise.resolve(io.request("disconnect", { method: "POST", body: { roomId: room, connectionId }, keepalive: true })).then((r) => r.body?.cancel()).catch(() => {
      });
    } catch (_) {
    }
  }
  function hide(send = true) {
    if (!alive) return;
    if (send && visible) disconnect();
    visible = false;
    clearTimers();
    events?.stop();
    events = null;
  }
  async function show() {
    if (!current()) {
      destroy(false);
      return;
    }
    visible = true;
    try {
      await actions.refresh();
      actions.setConnection("connected");
      startEvents();
      await pulse();
      paint();
    } catch (_) {
      if (current()) status("reconnecting");
    }
  }
  function destroy(send = true) {
    if (!alive) return;
    hide(send);
    alive = false;
    scope.abort();
    actions.stop();
    view.destroy();
    if (typeof io.onStop === "function") io.onStop();
  }
  doc.addEventListener("visibilitychange", () => {
    if (doc.visibilityState === "hidden") hide();
    else void show();
  }, { signal: scope.signal });
  win.addEventListener("pagehide", () => hide(), { signal: scope.signal });
  win.addEventListener("pageshow", () => {
    if (started && doc.visibilityState !== "hidden") void show();
  }, { signal: scope.signal });
  return Object.freeze({
    async start() {
      if (started || !current()) return;
      started = true;
      await actions.load();
      await actions.act("story");
      if (!current()) return;
      let hint = typeof io.loadRoomId === "function" ? await io.loadRoomId() : null;
      if (!current()) return;
      if (hint) {
        try {
          await actions.open(hint);
        } catch (error) {
          if (!current() || !["room_unavailable", "invalid_id"].includes(error.code)) throw error;
          actions.forgetRoom();
          hint = null;
        }
      }
      if (!hint) {
        const saved = await json("resume", { method: "GET", query: {} });
        if (saved.roomId) await actions.open(saved.roomId);
      }
      actions.setConnection("connected");
      if (visible) {
        startEvents();
        await pulse();
        paint();
      }
    },
    hide,
    show,
    destroy,
    async open(id) {
      if (!current() || !visible) throw err("view_hidden", 409);
      await actions.open(id);
      schedulePulse(0);
    },
    state: () => actions.read()
  });
}
export {
  mountCoopGame
};
