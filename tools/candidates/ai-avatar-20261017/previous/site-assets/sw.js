/* =========================================================
   のびログ サービスワーカー（アプリ版のオフライン担当）

   ★いちばん大事な決まり
     1. アプリ本体(index.html)は「まずネットを見る」。取れたら必ずそれを使う。
        取れなかったときだけ、手元にとってあるものを出す。
        （逆にすると deploy しても古い のびログ が出つづけて大事故になる）
     2. 同期サーバー（workers.dev）には絶対にさわらない。
        古い成績や古いDMが出てしまうため、キャッシュも横取りもしない。
   ========================================================= */

const CACHE = 'nobilog-app-v2.51.0';

// アプリを開くのに最低限いるもの
const CORE = [
  '/',
  '/workbook-questions.js',
  '/progressive-questions.js',
  '/unit-guides.js',
  '/september-test.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-64.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE).catch(() => {}))   // 1つ取れなくても入れ直しは続ける
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// アプリ本体：まずネット。だめなら手元の分
async function pageFirstNetwork(req) {
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    if (fresh && fresh.ok) {
      const c = await caches.open(CACHE);
      c.put('/', fresh.clone());        // つぎに電波が無いとき用にとっておく
    }
    return fresh;
  } catch (e) {
    const hit = (await caches.match('/')) || (await caches.match(req));
    if (hit) return hit;
    throw e;
  }
}

// 絵など：手元にあれば先に出して、裏で新しくしておく
async function assetCacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // 送信はそのまま通す

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  // 本人の添付画像は、独自ドメインや同一オリジンでも端末キャッシュに入れない。
  if (/(?:^|\/)(?:learning-(?:images?|review|notes|note-analysis(?:-job)?|chat|plan|time(?:-start)?)|plan|photos|avatar(?:-image|-generate)?)(?:\/|$)/.test(url.pathname)) return;

  // ★同期サーバーには一切さわらない（古い記録・古いDMを出さないため）
  if (url.hostname.endsWith('workers.dev')) return;

  // アプリ本体
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(pageFirstNetwork(req));
    return;
  }

  // 自分のところの絵・マニフェスト
  if (url.origin === self.location.origin) {
    e.respondWith(assetCacheFirst(req));
    return;
  }

  // グラフの部品(Chart.js)だけは、電波が無いときのために とっておく
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(assetCacheFirst(req));
  }
});

// 端末通知はサーバーで署名・暗号化された Web Push だけを表示する。
self.addEventListener('push', (e) => {
  let notice;
  try { notice = e.data && e.data.json(); } catch (_) { return; }
  if (!notice || typeof notice !== 'object' || typeof notice.id !== 'string' || !/^[A-Za-z0-9:._-]{1,180}$/.test(notice.id)
      || typeof notice.title !== 'string' || !notice.title || typeof notice.body !== 'string') return;
  const title = notice.title.slice(0, 100), body = notice.body.slice(0, 450);
  const url = new URL('/', self.location.origin);
  url.searchParams.set('notice', notice.id);
  e.waitUntil(self.registration.showNotification(title, {
    body, icon:'/icon-192.png', badge:'/favicon-64.png', tag:'nobilog-'+notice.id,
    data:{url:url.href}
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    let target;
    try { target = new URL(e.notification.data?.url || '/', self.location.origin); } catch (_) { return; }
    if (target.origin !== self.location.origin || target.pathname !== '/') return;
    const windows = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const open = windows.find(client => new URL(client.url).origin === target.origin);
    if (open) { await open.focus();open.navigate(target.href);return; }
    await self.clients.openWindow(target.href);
  })());
});
