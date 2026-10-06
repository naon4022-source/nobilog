// 5冊（国語・英語・理科・地理・歴史）の動画の共通場面（Claude・2026-10-05）。
// 動画エンジン engine.js の部品（g, C, W, HT, text, tw, rbox, seg, clamp, header, arrow）を使う。
// window.META = {kind:'V'|'VP', chip, title, steps:[{role, text}]} を make.py が場面ごとのHTMLに書きこむ。
// role：V＝intro/problem/step/answer/point、VP＝title/pt/tip/caution/end。字幕は出さず、読み上げた文を必ず画面のカードに出す。
window.WARN = [];
const M = window.META;
const P = {cream: '#fffdf8', yellow: '#f6c945', yelLight: '#fff6d6', greenLight: '#e6f5ec', redLight: '#fdecee', blueLight: '#e8f0fa', leaf: '#3fa34d', leafDark: '#2a7a37', body: '#8fd19e'};
const OPEN = '、。，．）」』】！？!?,.)…ー：:ゃゅょっャュョッ';

// 文を行に分ける：英単語は切らない。全角スペース・①②…の前で改行。行頭に句読点が来ないようにする
function wrap(s, size, maxW) {
  const out = [];
  for (const para of s.replace(/\s*([①-⑨])/g, '\n$1').split(/[\n　]+/).filter(x => x.trim())) {
    const toks = para.match(/[A-Za-z0-9][A-Za-z0-9'’.,!?%\-\/]*\s*|\s+|./gu) || [];
    let line = '';
    for (const tk of toks) {
      if (line && tw(line + tk.trimEnd(), size) > maxW && !OPEN.includes(tk[0])) {
        // 区切りのよい所（、。：／・」）や空白の直後）が行の後ろ4割にあれば、そこで切る。行末に「（ を残さない
        let cut = -1;
        for (let k = line.length - 1; k > line.length * .6; k--) if ('、。：／・」）』 '.includes(line[k])) { cut = k + 1; break; }
        let rest = '';
        if (cut > 0 && cut < line.length) { rest = line.slice(cut); line = line.slice(0, cut); }
        while (line.length > 1 && '「（『【('.includes(line[line.length - 1])) { rest = line[line.length - 1] + rest; line = line.slice(0, -1); }
        out.push(line.trimEnd()); line = (rest + tk).trimStart();
      }
      else line += tk;
    }
    if (line.trim()) { if (out.length && line.trim().length <= 2 && !/^[、。」』）！？]+$/.test(line.trim())) out.orphan = true; out.push(line.trimEnd()); }
  }
  return out;
}
// 箱に入る、いちばん大きい文字の大きさを探す
function fit(s, maxW, maxH, big, small, lh = 1.38) {
  // 1〜2字だけが次の行に落ちる大きさはさける（どの大きさでも落ちるときだけ許す）
  for (const strict of [true, false]) for (let z = big; z >= small; z -= 2) { const L = wrap(s, z, maxW); if ((!strict || !L.orphan) && L.length * z * lh <= maxH && L.every(l => tw(l, z) <= maxW + z * .6)) return {z, L, h: L.length * z * lh}; }
  const L = wrap(s, small, maxW); window.WARN.push('入りきらない：' + s.slice(0, 30)); return {z: small, L, h: L.length * small * lh};
}
function lines(F, x, y, col = C.ink, align = 'left', lh = 1.38) { F.L.forEach((l, k) => text(l, x, y + F.z * (k * lh + 1) - F.z * .14, F.z, col, align, 700)); }
function tag(label, x, y, fill, col = '#fff') { const w = tw(label, 26, 800) + 30; rbox(x, y, w, 40, 14, fill); text(label, x + w / 2, y + 30, 26, col, 'center', 800); return w; }

// マスコット「のびー」：芽の形。wave＝手をふる、point＝指さす。ゆっくりはずむ
function nobi(x, y, s = 1, o = {}) {
  const t = o.t || 0, bob = Math.sin(t * 5) * 6 * s;
  g.save(); g.translate(x, y + bob); g.scale(s, s);
  const sway = Math.sin(t * 3) * .12;
  for (const d of [-1, 1]) { g.save(); g.translate(0, -52); g.rotate(d * (.55 + sway)); g.fillStyle = d < 0 ? P.leaf : P.leafDark; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(d * 30, -40, d * 4, -64); g.quadraticCurveTo(d * -18, -30, 0, 0); g.fill(); g.restore(); }
  g.strokeStyle = P.leafDark; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -30); g.lineTo(0, -56); g.stroke();
  g.fillStyle = P.body; g.strokeStyle = P.leafDark; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 56, 50, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = C.ink; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * 18, -6, 6, 8, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(232,110,120,.45)'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(d * 32, 10, 9, 6, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.arc(0, 8, 12, .15 * Math.PI, .85 * Math.PI); g.stroke();
  g.strokeStyle = P.leafDark; g.lineWidth = 7; g.lineCap = 'round';
  if (o.wave) { const a = -1.1 + Math.sin(t * 9) * .35; g.beginPath(); g.moveTo(48, 0); g.lineTo(48 + 40 * Math.cos(a), 40 * Math.sin(a)); g.stroke(); }
  else if (o.point) { g.beginPath(); g.moveTo(50, 4); g.lineTo(92, -18); g.stroke(); }
  else { g.beginPath(); g.moveTo(50, 8); g.lineTo(66, 26); g.stroke(); }
  g.beginPath(); g.moveTo(-50, 8); g.lineTo(-66, 26); g.stroke(); g.lineCap = 'butt';
  g.restore();
}
function bubble(x, y, w, h, tailX, tailY, a) {
  g.globalAlpha = a; g.fillStyle = '#fff'; g.strokeStyle = '#c9d6e8'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(x + 2, y + h * .5); g.lineTo(tailX, tailY); g.lineTo(x + 2, y + h * .72); g.closePath(); g.fill(); g.stroke();
  rbox(x, y, w, h, 28, '#fff', '#c9d6e8', 3); g.fillStyle = '#fff'; g.fillRect(x - 2, y + h * .5 + 4, 8, h * .22 - 8);
}
// 囲みの線を、時間に合わせて少しずつ描く（「丸で囲む」）
function drawFrame(x, y, w, h, u, col) { const per = 2 * (w + h) + 160; g.save(); g.strokeStyle = col; g.lineWidth = 7; g.setLineDash([per * u, per]); g.beginPath(); g.roundRect(x - 10, y - 10, w + 20, h + 20, 26); g.stroke(); g.restore(); }
function slide(a) { return (1 - a) * 40; }

const ROLE = M.steps.map(s => s.role);
const idx = r => ROLE.map((x, k) => x === r ? k : -1).filter(k => k >= 0);
const STEPS = idx('step'), PTS = idx('pt');
const TOP = 100, BOTTOM = 704;

function drawV(i, p, t) {
  const role = ROLE[i];
  if (role === 'intro') {
    const a = seg(p, 0, .25); g.globalAlpha = a; nobi(250, 440, 1.7, {t, wave: true});
    bubble(450, 200, 780, 380, 360, 400, a); const F = fit(M.steps[0].text, 700, 320, 54, 30); lines(F, 490, 390 - F.h / 2, C.ink); g.globalAlpha = 1; return;
  }
  const pi = ROLE.indexOf('problem'), PF = fit(M.steps[pi].text, 1080, 190, 42, 24), pH = PF.h + 72;
  const ptI = ROLE.indexOf('point'), last = i >= ptI, ansI = ROLE.indexOf('answer'), showAns = ansI >= 0 && i >= ansI;
  { const a = i === pi ? seg(p, 0, .2) : 1; g.globalAlpha = a * (last ? 0 : 1); rbox(40, TOP + slide(a), 1200, pH, 24, P.blueLight, C.blue, 4); tag('問題', 64, TOP + 14 + slide(a), C.blue); lines(PF, 70, TOP + 62 + slide(a), C.ink); g.globalAlpha = 1; }
  const y0 = TOP + pH + 20, area = BOTTOM - y0, n = Math.max(1, STEPS.length), gap = 14, ch = (area - gap * (n - 1)) / n;
  STEPS.forEach((k, j) => {
    if (i < k) return;
    const a = i === k ? seg(p, 0, .18) : 1, on = i === k, y = y0 + j * (ch + gap);
    g.globalAlpha = a * (showAns || last ? 0 : 1);
    rbox(110 + slide(a), y, 1130, ch, 20, on ? P.cream : '#fff', on ? C.orange : '#c9d6e8', on ? 6 : 3);
    g.fillStyle = on ? C.orange : C.blue; g.beginPath(); g.arc(70, y + ch / 2, 26, 0, Math.PI * 2); g.fill(); text(String(j + 1), 70, y + ch / 2 + 11, 32, '#fff', 'center', 800);
    const F = fit(M.steps[k].text, 1060, ch - 16, 44, 22); lines(F, 140 + slide(a), y + ch / 2 - F.h / 2, C.ink);
    g.globalAlpha = 1;
  });
  if (showAns) {
    const a = i === ansI ? seg(p, 0, .2) : 1; g.globalAlpha = a * (last ? 0 : 1);
    const F = fit(M.steps[ansI].text, 1080, area - 90, 44, 22), h = F.h + 74, y = y0 + (area - h) / 2;
    rbox(60, y, 1160, h, 24, P.greenLight, C.green, 4); tag('答え', 84, y + 14, C.green); lines(F, 90, y + 62, C.ink);
    if (!last) drawFrame(60, y, 1160, h, i === ansI ? seg(p, .15, .5) : 1, C.orange);
    g.globalAlpha = 1;
  }
  if (last) {
    const a = seg(p, 0, .2), F = fit(M.steps[i].text, 880, 330, 50, 26), h = F.h + 110, y = 150 + (440 - h) / 2;
    g.globalAlpha = a; rbox(280, y + slide(a), 940, h, 30, P.yelLight, P.yellow, 6); tag('ポイント', 308, y + 18 + slide(a), '#c48a00');
    lines(F, 320, y + 80 + slide(a), C.ink); nobi(150, 560, 1.05, {t, point: true}); g.globalAlpha = 1;
  }
}

function drawVP(i, p, t) {
  const role = ROLE[i];
  if (role === 'title') {
    const a = seg(p, 0, .25); g.globalAlpha = a;
    const bw = tw('1分でわかる', 52, 800) + 70; rbox(W / 2 - bw / 2, 140 + slide(a), bw, 84, 42, C.orange); text('1分でわかる', W / 2, 199 + slide(a), 52, '#fff', 'center', 800);
    const F = fit(M.steps[0].text, 1040, 200, 62, 32); lines(F, W / 2, 260 + slide(a), C.ink, 'center');
    nobi(W / 2, 600, 1.1, {t, wave: true}); g.globalAlpha = 1; return;
  }
  const n = PTS.length, cols = n === 4 ? 2 : 1, rows = Math.ceil(n / cols), gap = 16;
  const cw = (1200 - gap * (cols - 1)) / cols, ch = (BOTTOM - TOP - gap * (rows - 1)) / rows;
  const later = role === 'tip' || role === 'caution' || role === 'end';
  PTS.forEach((k, j) => {
    if (i < k) return;
    const a = i === k ? seg(p, 0, .18) : 1, on = i === k, cx = 40 + (j % cols) * (cw + gap), cy = TOP + Math.floor(j / cols) * (ch + gap) + slide(a);
    g.globalAlpha = a * (later ? 0 : 1);
    rbox(cx, cy, cw, ch, 22, on ? P.cream : '#fff', on ? C.orange : '#c9d6e8', on ? 6 : 3);
    g.fillStyle = on ? C.orange : C.blue; g.beginPath(); g.arc(cx + 42, cy + ch / 2, 24, 0, Math.PI * 2); g.fill(); text(String(j + 1), cx + 42, cy + ch / 2 + 11, 30, '#fff', 'center', 800);
    const F = fit(M.steps[k].text, cw - 110, ch - 24, cols === 2 ? 42 : 48, 22); lines(F, cx + 82, cy + ch / 2 - F.h / 2, C.ink);
    g.globalAlpha = 1;
  });
  if (role === 'tip' || role === 'caution') {
    const a = seg(p, 0, .2), tip = role === 'tip', F = fit(M.steps[i].text, 820, 340, 50, 26), h = F.h + 110, y = 150 + (460 - h) / 2;
    g.globalAlpha = a; rbox(320, y + slide(a), 900, h, 30, tip ? P.yelLight : P.redLight, tip ? P.yellow : C.red, 6);
    tag(tip ? 'かんたんにやるコツ' : '気をつけて！', 348, y + 18 + slide(a), tip ? '#c48a00' : C.red);
    if (!tip) { g.strokeStyle = C.red; g.lineWidth = 8; const bx = 1170, by = y + 40 + slide(a); g.beginPath(); g.moveTo(bx - 18, by - 18); g.lineTo(bx + 18, by + 18); g.moveTo(bx + 18, by - 18); g.lineTo(bx - 18, by + 18); g.stroke(); }
    lines(F, 360, y + 80 + slide(a), C.ink); nobi(170, 540, 1.15, {t, point: tip}); g.globalAlpha = 1;
  }
  if (role === 'end') {
    const a = seg(p, 0, .25); g.globalAlpha = a; nobi(W / 2, 480, 1.6, {t, wave: true});
    const F = fit(M.steps[i].text, 1000, 120, 50, 30); lines(F, W / 2, 150, C.ink, 'center');
    for (let k = 0; k < 18; k++) { const ang = k / 18 * Math.PI * 2 + t, r = 250 + 20 * Math.sin(t * 4 + k); g.fillStyle = [C.orange, C.blue, C.green, P.yellow][k % 4]; g.fillRect(W / 2 + r * Math.cos(ang) - 6, 470 + r * .5 * Math.sin(ang) - 6, 12, 12); }
    g.globalAlpha = 1;
  }
}

// 見出し：長い題は字を小さくして、右上の札と重ならないようにする
function hdr(title, chip) {
  let cw = 0; if (chip) { cw = tw(chip, 30, 800) + 44; rbox(W - 28 - cw, 18, cw, 64, 18, C.orange); text(chip, W - 28 - cw / 2, 61, 30, '#fff', 'center', 800); }
  let z = 34; while (z > 22 && tw(title, z, 800) > W - 56 - cw - 70) z -= 2;
  if (tw(title, z, 800) > W - 56 - cw - 70) window.WARN.push('見出しが長い：' + title);
  rbox(28, 18, tw(title, z, 800) + 48, 64, 18, '#e8f0fa'); text(title, 52, 50 + z * .36, z, C.blue, 'left', 800);
}
window.SCENE = {caption: false, draw({i, p, t}) {
  hdr(M.title, M.chip);
  (M.kind === 'VP' ? drawVP : drawV)(i, p, t);
}};
