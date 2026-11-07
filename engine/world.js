/* engine/world.js — псевдо-3D клуб: камера с перспективой, плоскости (пол, стены, сцена),
   билборды (персонажи, столики, барабаны), свет (лучи прожекторов, свечи, гирлянда).
   Единицы — метры. x вправо, y вверх (пол = 0), z вглубь от входа к сцене. */
'use strict';

// ---------- камера ----------
let CAM = null;
function setCam(c) {
  const d2r = Math.PI / 180;
  CAM = Object.assign({ x: 0, y: 1.5, z: 0, yaw: 0, pitch: 0, roll: 0, fov: 50 }, c);
  CAM.cy = Math.cos(CAM.yaw * d2r); CAM.sy = Math.sin(CAM.yaw * d2r);
  CAM.cp = Math.cos(CAM.pitch * d2r); CAM.sp = Math.sin(CAM.pitch * d2r);
  CAM.F = (H / 2) / Math.tan(CAM.fov * d2r / 2);
}
function toCam(x, y, z) {
  const dx = x - CAM.x, dy = y - CAM.y, dz = z - CAM.z;
  const x1 = dx * CAM.cy - dz * CAM.sy, z1 = dx * CAM.sy + dz * CAM.cy;
  const y2 = dy * CAM.cp - z1 * CAM.sp, z2 = dy * CAM.sp + z1 * CAM.cp;
  return [x1, y2, z2];
}
const NEAR = .12;
const projC = c => { const s = CAM.F / c[2]; return [W / 2 + c[0] * s, H / 2 - c[1] * s, s]; };
function proj(x, y, z) { const c = toCam(x, y, z); if (c[2] < NEAR) return null; return projC(c); }

function clipNear(cs) {
  const out = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i], b = cs[(i + 1) % cs.length], ina = a[2] >= NEAR, inb = b[2] >= NEAR;
    if (ina) out.push(a);
    if (ina !== inb) { const u = (NEAR - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), NEAR]); }
  }
  return out;
}
function polyPath(ctx, pts) {
  const cs = clipNear(pts.map(p => toCam(p[0], p[1], p[2]))); if (cs.length < 3) return false;
  ctx.beginPath(); cs.forEach((c, i) => { const p = projC(c); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); return true;
}
function poly(ctx, pts, fill) { if (polyPath(ctx, pts)) { ctx.fillStyle = fill; ctx.fill(); } }
function line3(ctx, a, b, stroke, w) {
  let ca = toCam(...a), cb = toCam(...b);
  if (ca[2] < NEAR && cb[2] < NEAR) return;
  if (ca[2] < NEAR) { const u = (NEAR - ca[2]) / (cb[2] - ca[2]); ca = ca.map((v, i) => lerp(v, cb[i], u)); }
  if (cb[2] < NEAR) { const u = (NEAR - cb[2]) / (ca[2] - cb[2]); cb = cb.map((v, i) => lerp(v, ca[i], u)); }
  const p = projC(ca), q = projC(cb); ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
}
function glow(ctx, x, y, r, color, a = 1) {
  if (r < .5) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}

// ---------- сцена мира ----------
// Освещение сцены (S.set.light): house — зал, stage — сцена, candles — свечи, spot — id под лучом,
// beams 0..1 — прожекторы, string — гирлянда, eyes(lt,T) — сила свечения глаз у теней в зале.
function worldState(S, lt, T) {
  const set = S.set || {};
  const light = Object.assign({}, SET.light, typeof set.light === 'function' ? set.light(lt, T) : set.light);
  // hide, ents, add могут быть функциями (lt, T) — меняются по ходу сцены
  const hide = new Set((typeof set.hide === 'function' ? set.hide(lt, T) : set.hide) || []);
  const ov = typeof set.ents === 'function' ? set.ents(lt, T) : set.ents;
  const ents = SET.ents.filter(e => !hide.has(e.id)).map(e => {
    const o = ov && ov[e.id]; return o ? Object.assign({}, e, typeof o === 'function' ? o(lt, T) : o) : e;
  }).concat((typeof set.add === 'function' ? set.add(lt, T) : set.add) || []);
  return { light, ents };
}

function drawWorld(ctx, S, lt, T) {
  setCam(S.cam.smooth != null ? splineAt(S.cam.keys, lt, S.cam.smooth) : keyAt(S.cam.keys, lt));   // smooth: плавная кривая через все ключи
  const st = worldState(S, lt, T), L = st.light;
  ctx.save();
  if (CAM.roll) { ctx.translate(W / 2, H / 2); ctx.rotate(CAM.roll * Math.PI / 180); ctx.translate(-W / 2, -H / 2); }
  drawRoom(ctx, L, T);
  // билборды: от дальних к ближним
  const list = st.ents.map(e => ({ e, d: toCam(e.x, (e.y || 0) + 1, e.z)[2] })).filter(o => o.d > NEAR).sort((a, b) => b.d - a.d);
  for (const { e } of list) drawEnt(ctx, e, L, lt, T, S);
  drawBeams(ctx, L, st, T, 'front');
  ctx.restore();
}

const ROOM = { x0: -7, x1: 7, z0: -4, z1: 17.6, h: 4.4, stZ: 12, stH: .7, stX: 5.2 };
function drawRoom(ctx, L, T) {
  const R = ROOM, hz = L.house, sz = L.stage;
  const sh = (hex, k) => shadeHex(hex, k);
  // потолок, стены, пол
  poly(ctx, [[R.x0, R.h, R.z0], [R.x1, R.h, R.z0], [R.x1, R.h, R.z1], [R.x0, R.h, R.z1]], sh('#140b12', .35 + hz * .5));
  poly(ctx, [[R.x0, 0, R.z0], [R.x0, R.h, R.z0], [R.x0, R.h, R.z1], [R.x0, 0, R.z1]], sh('#2a1219', .3 + hz * .7));
  poly(ctx, [[R.x1, 0, R.z0], [R.x1, R.h, R.z0], [R.x1, R.h, R.z1], [R.x1, 0, R.z1]], sh('#2a1219', .3 + hz * .7));
  poly(ctx, [[R.x0, 0, R.z0], [R.x1, 0, R.z0], [R.x1, 0, R.z1], [R.x0, 0, R.z1]], sh('#1d1013', .35 + hz * .6));
  poly(ctx, [[R.x0, 0, R.z1], [R.x1, 0, R.z1], [R.x1, R.h, R.z1], [R.x0, R.h, R.z1]], sh('#1c0d14', .3 + sz * .5));
  // стена входа: дверь, табличка EXIT, барная стойка
  poly(ctx, [[R.x0, 0, R.z0], [R.x1, 0, R.z0], [R.x1, R.h, R.z0], [R.x0, R.h, R.z0]], sh('#24111a', .3 + hz * .6));
  poly(ctx, [[-.6, 0, R.z0 + .01], [.6, 0, R.z0 + .01], [.6, 2.2, R.z0 + .01], [-.6, 2.2, R.z0 + .01]], sh('#0c0608', 1));
  poly(ctx, [[-.5, .1, R.z0 + .02], [.5, .1, R.z0 + .02], [.5, 2.1, R.z0 + .02], [-.5, 2.1, R.z0 + .02]], sh('#1a1012', .4 + hz * .4));
  { const p = proj(0, 2.45, R.z0 + .02); if (p) { glow(ctx, p[0], p[1], .7 * p[2], 'rgba(40,255,120,.5)', .8); ctx.save(); ctx.fillStyle = '#7dffb0'; ctx.font = `${.16 * p[2]}px VT323`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', p[0], p[1]); ctx.restore(); } }
  poly(ctx, [[3, 0, R.z0 + .9], [6.9, 0, R.z0 + .9], [6.9, 1.1, R.z0 + .9], [3, 1.1, R.z0 + .9]], sh('#2a1416', .3 + hz * .6));
  poly(ctx, [[3, 1.1, R.z0 + .9], [6.9, 1.1, R.z0 + .9], [6.9, 1.1, R.z0 + .3], [3, 1.1, R.z0 + .3]], sh('#4a2a24', .3 + hz * .7));
  for (let i = 0; i < 7; i++) { const p = proj(3.4 + i * .5, 1.75, R.z0 + .05); if (p) { ctx.save(); ctx.fillStyle = ['#3a6a40', '#6a3a2a', '#8a7a40', '#2a3a6a'][i % 4]; ctx.globalAlpha = .35 + hz * .6; ctx.fillRect(p[0] - .04 * p[2], p[1] - .14 * p[2], .08 * p[2], .28 * p[2]); ctx.restore(); } }
  { const p = proj(4.9, 2.2, R.z0 + .05); if (p) glow(ctx, p[0], p[1], 1.4 * p[2], 'rgba(255,120,60,.45)', hz); }
  // кирпич на боковых стенах, доски пола
  ctx.save(); ctx.globalAlpha = .35;
  for (let y = .3; y < R.h; y += .32) { line3(ctx, [R.x0, y, R.z0], [R.x0, y, R.z1], '#000', 1.5); line3(ctx, [R.x1, y, R.z0], [R.x1, y, R.z1], '#000', 1.5); }
  for (let x = R.x0 + .5; x < R.x1; x += .55) line3(ctx, [x, 0, R.z0], [x, 0, R.stZ], '#000', 1.5);
  // трубы под потолком
  ctx.globalAlpha = .8; line3(ctx, [-3, R.h - .25, R.z0], [-3, R.h - .25, R.z1], sh('#3a2a30', .4 + hz * .4), 9); line3(ctx, [2.4, R.h - .35, R.z0], [2.4, R.h - .35, R.z1], sh('#3a2a30', .4 + hz * .4), 6);
  ctx.restore();
  // бра на стенах (тёплые пятна)
  for (const z of [1, 5, 9]) for (const x of [R.x0 + .02, R.x1 - .02]) { const p = proj(x, 2.3, z); if (p) { glow(ctx, p[0], p[1], 1.6 * p[2], 'rgba(255,140,70,.55)', hz); glow(ctx, p[0], p[1], .12 * p[2], '#ffd9a0', .3 + hz); } }
  // занавес
  const cx0 = -4.8, cx1 = 4.8, n = 26;
  for (let i = 0; i < n; i++) {
    const a = cx0 + (cx1 - cx0) * i / n, b = cx0 + (cx1 - cx0) * (i + 1) / n, k = .55 + .45 * Math.abs(Math.sin(i * 1.7));
    poly(ctx, [[a, R.stH, R.z1 - .1], [b, R.stH, R.z1 - .1], [b, 4.1, R.z1 - .1], [a, 4.1, R.z1 - .1]], sh(i % 2 ? '#5c0b1d' : '#3d0613', (.25 + sz * .75) * k));
  }
  // неоновый полумесяц над занавесом
  { const p = proj(0, 3.75, R.z1 - .15); if (p) { const r = .32 * p[2]; ctx.save(); ctx.lineWidth = Math.max(2, .045 * p[2]); ctx.strokeStyle = '#ff5fa2'; ctx.shadowColor = '#ff2a7a'; ctx.shadowBlur = 30 * L.neon;
      ctx.globalAlpha = .25 + .75 * L.neon; ctx.beginPath(); ctx.arc(p[0], p[1], r, Math.PI * .35, Math.PI * 1.65); ctx.arc(p[0] + r * .45, p[1] - r * .1, r * .78, Math.PI * 1.55, Math.PI * .45, true); ctx.closePath(); ctx.stroke(); ctx.restore(); } }
  // сцена: верх и передняя грань
  poly(ctx, [[-R.stX, R.stH, R.stZ], [R.stX, R.stH, R.stZ], [R.stX, R.stH, R.z1], [-R.stX, R.stH, R.z1]], sh('#3a2328', .25 + sz * .6));
  poly(ctx, [[-R.stX, 0, R.stZ], [R.stX, 0, R.stZ], [R.stX, R.stH, R.stZ], [-R.stX, R.stH, R.stZ]], sh('#1e1014', .4 + hz * .4));
  ctx.save(); ctx.globalAlpha = .5; for (let x = -R.stX + .6; x < R.stX; x += .6) line3(ctx, [x, R.stH, R.stZ], [x, R.stH, R.z1], '#000', 1.2); ctx.restore();
  // светодиодная кромка сцены
  for (let x = -R.stX + .1; x <= R.stX; x += .3) { const p = proj(x, R.stH, R.stZ); if (p) glow(ctx, p[0], p[1], .09 * p[2], '#ff3355', .5 + .5 * L.edge); }
  // гирлянда над сценой
  for (let i = 0; i <= 34; i++) { const u = i / 34, x = lerp(-6.6, 6.6, u), y = 4.15 - Math.sin(u * Math.PI) * .45, p = proj(x, y, R.z1 - .3);
    if (p) { const tw = .6 + .4 * Math.sin(T * 3 + i * 1.3); glow(ctx, p[0], p[1], .2 * p[2], 'rgba(255,190,110,.9)', L.string * tw); glow(ctx, p[0], p[1], .03 * p[2], '#fff2d0', L.string); } }
  drawBeams(ctx, L, null, T, 'back');
}

function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16); k = clamp(k, 0, 1.5);
  return `rgb(${Math.min(255, ((n >> 16) & 255) * k) | 0},${Math.min(255, ((n >> 8) & 255) * k) | 0},${Math.min(255, (n & 255) * k) | 0})`;
}

// лучи прожекторов: back — до персонажей (подсветка пола и дымки), front — после (сам луч поверх)
function drawBeams(ctx, L, st, T, pass) {
  for (const b of SET.beams) {
    const k = (L.beams || 0) * (b.k || 1) * (b.flicker ? (.8 + .2 * Math.sin(T * 9 + b.to[0])) : 1); if (k <= .01) continue;
    beam(ctx, b.from, b.to, b.r, b.color, k * .55, pass, false, T);
  }
  if (L.spot && st) { const e = st.ents.find(e => e.id === L.spot); if (e) beam(ctx, [e.x, ROOM.h - .1, e.z - 1.2], [e.x, (e.y || 0), e.z], .75, '#fff1d6', (L.spotK ?? 1), pass, true, T); }
}
function beam(ctx, from, to, r, color, a, pass, dust, T) {
  const A = proj(...from), C = proj(to[0], to[1], to[2]); if (!A || !C) return;
  if (pass === 'back') { // пятно на полу
    const p1 = proj(to[0] - r, to[1], to[2]), p2 = proj(to[0], to[1], to[2] - r); if (!p1 || !p2) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * .6; ctx.translate(C[0], C[1]); ctx.scale(1, Math.max(.08, Math.abs(p2[1] - C[1]) / Math.max(1, Math.abs(C[0] - p1[0]))));
    const rr = Math.abs(C[0] - p1[0]); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-rr, -rr, rr * 2, rr * 2); ctx.restore();
    return;
  }
  const pl = proj(to[0] - r, to[1], to[2]), pr = proj(to[0] + r, to[1], to[2]); if (!pl || !pr) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(A[0], A[1], C[0], C[1]); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = a * .45; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(A[0] - 6, A[1]); ctx.lineTo(A[0] + 6, A[1]); ctx.lineTo(pr[0], pr[1]); ctx.lineTo(pl[0], pl[1]); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = a; glow(ctx, A[0], A[1], 30, color, a);
  if (dust) { ctx.fillStyle = '#fff6e0';
    for (let i = 0; i < 90; i++) { const u = ((rand(i) + T * (.015 + rand(i + 7) * .02)) % 1) * .9 + .08, v = (rand(i + 50) - .5) * 1.7 * u;
      const x = lerp(A[0], C[0], u) + v * (pr[0] - pl[0]) * .5, y = lerp(A[1], C[1], u) + Math.sin(T + i) * 4; const sz = 1.5 + rand(i + 3) * 3;
      ctx.globalAlpha = a * (.25 + .5 * Math.abs(Math.sin(T * 1.5 + i))); ctx.fillRect(x, y, sz, sz); } }
  ctx.restore();
}

// ---------- сущности ----------
function entLight(e, L) {
  if (L.spot && e.id === L.spot) return 1;
  const base = e.zone === 'stage' ? L.stage : L.house;
  return clamp(base + (e.glow || 0), 0, 1);
}
function drawEnt(ctx, e, L, lt, T, S) {
  const f = ENT[e.type]; if (f) f(ctx, e, L, lt, T, S);
}
const ENT = {};

// персонаж-спрайт. e: {char, pose, x,y,z, h? (м), seat (доля сверху, если сидит), seatY, flip, anim, inst:'guitar'|'bass', mouth:true}
ENT.char = (ctx, e, L, lt, T, S) => {
  const C = CHARACTERS[e.char], P = poseOf(e.char, e.pose); const im = poseImg(P, T, e); if (!im) return;
  // P.part — спрайт «по пояс»: картинка покрывает верхнюю долю part роста, низ картинки висит на высоте (1-part)·рост
  const hm = (e.h || C.height) * (P.scale || 1), part = P.part || 1;
  const p = proj(e.x + (P.dx || 0), (e.y || 0) + (e.seat ? (e.seatY ?? .45) : hm * (1 - part)), e.z); if (!p) return;
  // масштаб — по глубине середины тела, а не ступней: при наклонённой камере (сцена 02) персонаж не «уезжает»
  const pc = e.seat ? p : proj(e.x + (P.dx || 0), (e.y || 0) + hm * (1 - part / 2), e.z);
  const fullH = hm * (pc ? pc[2] : p[2]);
  const crop = e.seat ? [0, 0, 1, e.seat] : (P.crop || null);
  const hh = fullH * (crop ? crop[3] : 1) * part, ww = hh * (im.width * (crop ? crop[2] : 1)) / (im.height * (crop ? crop[3] : 1));
  const an = animOf(e.anim, T + (e.phase || 0));
  const light = entLight(e, L);
  ctx.save(); ctx.translate(p[0] + an.dx * fullH, p[1] + an.dy * fullH); ctx.rotate(an.r); ctx.scale(1, an.sy);
  const o = { crop, flip: e.flip, shade: (1 - light) * .88, shadeColor: e.zone === 'stage' ? '#12040a' : '#07040a',
    sil: e.sil, silColor: e.silColor, alpha: e.alpha, glow: e.glow };   // sil 0..1 — заливка цветом silColor (силуэт), glow — свечение
  if (e.zone === 'stage' && L.rim) o.rim = { color: L.rimColor || '#ff2a55', amount: L.rim * (1 - light * .5), depth: .25 };
  drawImg(ctx, im, -ww / 2, -hh, ww, hh, o);
  if (e.inst) drawInstrument(ctx, e.inst, -ww / 2, -hh, ww, fullH, light, P);
  if (e.mouth && P.mouth && !P.mouths) drawMouth(ctx, -ww / 2, -hh, ww, hh, mouthAt(P, T, e), voxOpen(T), crop, e.flip);
  ctx.restore();
  if (e.eyes) eyesGlow(ctx, e, p, fullH, L, lt, T);
};
function poseOf(ch, pose) { const C = CHARACTERS[ch]; const P = C.poses[pose] || C.poses[C.fallback]; return typeof P === 'string' ? { key: P } : P; }

// гитара/бас — заглушка поверх спрайта, пока нет поз с инструментом
function drawInstrument(ctx, kind, x, y, w, fullH, light, P) {
  const g = P.inst || { x: .5, y: .56 }; const cx = x + w * g.x, cy = y + fullH * g.y, s = fullH;
  const bass = kind === 'bass'; const body = bass ? '#2b2440' : '#8c0f22';
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.55);
  const dk = (1 - light) * .8;
  ctx.fillStyle = '#1a1416'; ctx.fillRect(-s * .01, -s * (bass ? .52 : .42), s * .02, s * (bass ? .44 : .36)); // гриф
  ctx.fillStyle = '#0d0a0b'; ctx.fillRect(-s * .018, -s * (bass ? .56 : .45), s * .036, s * .05);
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, s * .02, s * .085, s * .1, 0, 0, Math.PI * 2); ctx.ellipse(0, -s * .07, s * .065, s * .07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(-s * .035, s * .02, s * .07, s * .012); ctx.beginPath(); ctx.arc(0, -s * .03, s * .018, 0, 7); ctx.fill();
  ctx.globalAlpha = dk; ctx.fillStyle = '#060206'; ctx.beginPath(); ctx.ellipse(0, s * .02, s * .087, s * .102, 0, 0, Math.PI * 2); ctx.ellipse(0, -s * .07, s * .067, s * .072, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// круглый столик со скатертью и свечой
ENT.table = (ctx, e, L, lt, T) => {
  const top = proj(e.x, .76, e.z), bot = proj(e.x, 0, e.z); if (!top || !bot) return;
  const r = (e.r || .45) * top[2], ry = Math.max(3, r * clamp((CAM.y - .76) / Math.max(.5, toCam(e.x, .76, e.z)[2]), .05, .6));
  const k = .25 + L.house * .5 + L.candles * .35;
  ctx.save();
  const g = ctx.createLinearGradient(0, top[1], 0, bot[1]); g.addColorStop(0, shadeHex('#4a1520', k)); g.addColorStop(1, shadeHex('#1a070b', k));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(top[0] - r * 1.04, top[1]); ctx.lineTo(top[0] - r * 1.12, bot[1]); ctx.quadraticCurveTo(top[0], bot[1] + ry * .8, top[0] + r * 1.12, bot[1]); ctx.lineTo(top[0] + r * 1.04, top[1]); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shadeHex('#5c1c28', k * 1.1); ctx.beginPath(); ctx.ellipse(top[0], top[1], r * 1.04, ry, 0, 0, Math.PI * 2); ctx.fill();
  // свеча в стакане
  const c = proj(e.x, .86, e.z); if (c) { const cs = c[2];
    ctx.fillStyle = 'rgba(255,170,90,.35)'; ctx.fillRect(c[0] - .045 * cs, c[1] - .02 * cs, .09 * cs, .1 * cs);
    const fl = .8 + .2 * Math.sin(T * 11 + e.x * 3) * Math.sin(T * 7.3 + e.z);
    glow(ctx, c[0], c[1], .55 * cs, 'rgba(255,150,60,.8)', L.candles * fl); glow(ctx, c[0], c[1], .05 * cs, '#fff0c0', L.candles); }
  ctx.restore();
};

// тень-зритель (заглушка до листов персонажей): голова, уши, плечи; глаза могут светиться
ENT.ghost = (ctx, e, L, lt, T) => {
  const p = proj(e.x, .45, e.z); if (!p) return; const s = p[2];
  const k = .12 + L.house * .35 + L.candles * .15;
  ctx.save(); ctx.translate(p[0], p[1]); if (e.flip) ctx.scale(-1, 1);
  ctx.fillStyle = shadeHex(e.color || '#3a2a36', k);
  ctx.beginPath(); ctx.ellipse(0, -.35 * s, .26 * s, .4 * s, 0, Math.PI, 0); ctx.lineTo(.26 * s, 0); ctx.lineTo(-.26 * s, 0); ctx.fill();
  const hy = -.88 * s; ctx.beginPath(); ctx.ellipse(0, hy, .13 * s, .15 * s, 0, 0, Math.PI * 2); ctx.fill();
  const ear = e.ears || 1; ctx.beginPath(); ctx.moveTo(-.12 * s, hy - .05 * s); ctx.lineTo(-.1 * s, hy - .26 * s * ear); ctx.lineTo(-.02 * s, hy - .12 * s); ctx.moveTo(.12 * s, hy - .05 * s); ctx.lineTo(.1 * s, hy - .26 * s * ear); ctx.lineTo(.02 * s, hy - .12 * s); ctx.fill();
  if (e.snout) { ctx.beginPath(); ctx.ellipse(.1 * s, hy + .03 * s, .08 * s, .05 * s, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  eyesGlow(ctx, e, [p[0], p[1] - .88 * s, s], 0, L, lt, T, true);
};
function eyesGlow(ctx, e, p, fullH, L, lt, T, ghost) {
  const k = L.eyes ? L.eyes : 0; if (k <= .01) return; const s = p[2];
  const ex = ghost ? p[0] : p[0] + (e.eyeX || 0) * fullH, ey = ghost ? p[1] - .02 * s : p[1] - (e.eyeY || .9) * fullH;
  for (const d of [-1, 1]) { const x = ex + d * .055 * s; glow(ctx, x, ey, .09 * s, 'rgba(255,40,70,.9)', k); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#ffd0d8'; ctx.fillRect(x - .012 * s, ey - .008 * s, .024 * s, .016 * s); ctx.restore(); }
}

// ударная установка (рисуется кодом)
ENT.drums = (ctx, e, L, lt, T) => {
  const p = proj(e.x, ROOM.stH, e.z); if (!p) return; const s = p[2], k = .3 + L.stage * .7;
  const hit = Math.pow(1 - beatPhase(T), 4) * (L.play ?? 1);
  ctx.save(); ctx.translate(p[0], p[1]);
  const metal = shadeHex('#9a8f7a', k), shell = shadeHex('#7a1426', k), dark = shadeHex('#160a0d', k);
  ctx.strokeStyle = metal; ctx.lineWidth = Math.max(1, .015 * s);
  for (const [x, y] of [[-.55, -1.05], [.6, -1.15], [-.75, -.85]]) { ctx.beginPath(); ctx.moveTo(x * s, 0); ctx.lineTo(x * s, y * s); ctx.stroke(); }
  ctx.fillStyle = shadeHex('#c9a24a', k); for (const [x, y, w, j] of [[-.55, -1.05, .28, 1], [.6, -1.15, .32, 0], [-.75, -.85, .2, 1]]) { ctx.save(); ctx.translate(x * s, y * s + (j ? hit * .02 * s : 0)); ctx.rotate(j ? -.1 : .12); ctx.beginPath(); ctx.ellipse(0, 0, w * s, .03 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = shell; for (const [x, y, r] of [[-.22, -.72, .13], [.2, -.74, .14], [.55, -.42, .2]]) { ctx.beginPath(); ctx.ellipse(x * s, y * s, r * s, r * .8 * s, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = shell; ctx.beginPath(); ctx.arc(0, -.32 * s, .32 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, -.32 * s, .26 * s, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shadeHex('#ff5fa2', .4 + L.neon * .6); ctx.lineWidth = Math.max(1, .012 * s); ctx.beginPath(); ctx.arc(0, -.32 * s, .14 * s, Math.PI * .35, Math.PI * 1.65); ctx.stroke();
  ctx.restore();
};
// микрофонная стойка
// микрофонная стойка: e.x — где стоит стойка, e.h — высота микрофона; e.boom — штанга вбок (м, + вправо), на её конце микрофон
ENT.mic = (ctx, e, L) => {
  const bm = e.boom || 0, top = ROOM.stH + (e.h || 1.5) - (bm ? .05 : 0);
  const a = proj(e.x, ROOM.stH, e.z), b = proj(e.x, top, e.z), m = proj(e.x + bm, ROOM.stH + (e.h || 1.5), e.z); if (!a || !b || !m) return;
  const k = .3 + L.stage * .7; ctx.save(); ctx.strokeStyle = shadeHex('#4a4448', k); ctx.lineWidth = Math.max(1.5, .018 * a[2]); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); if (bm) ctx.lineTo(m[0], m[1]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(a[0] - .18 * a[2], a[1]); ctx.lineTo(a[0], a[1] - .12 * a[2]); ctx.lineTo(a[0] + .18 * a[2], a[1]); ctx.stroke();
  const ang = bm ? Math.atan2(m[1] - b[1], m[0] - b[0]) : -Math.PI / 2 - .3;   // микрофон смотрит по направлению штанги
  ctx.fillStyle = shadeHex('#222', k + .3); ctx.beginPath(); ctx.ellipse(m[0] + Math.cos(ang) * .03 * m[2], m[1] + Math.sin(ang) * .03 * m[2], .055 * m[2], .03 * m[2], ang, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shadeHex('#8a8a90', k + .2); ctx.beginPath(); ctx.ellipse(m[0] + Math.cos(ang) * .075 * m[2], m[1] + Math.sin(ang) * .075 * m[2], .022 * m[2], .03 * m[2], ang, 0, Math.PI * 2); ctx.fill();   // сетка
  ctx.restore();
};
// усилитель
ENT.amp = (ctx, e, L) => {
  const w = e.w || .9, h = e.h || 1.1, d = .45, x0 = e.x - w / 2, x1 = e.x + w / 2, y0 = ROOM.stH, y1 = ROOM.stH + h, k = .25 + L.stage * .6;
  poly(ctx, [[x0, y1, e.z], [x1, y1, e.z], [x1, y1, e.z + d], [x0, y1, e.z + d]], shadeHex('#2a2226', k));
  poly(ctx, [[x0, y0, e.z], [x1, y0, e.z], [x1, y1, e.z], [x0, y1, e.z]], shadeHex('#141012', k));
  poly(ctx, [[x0 + .06, y0 + .08, e.z - .01], [x1 - .06, y0 + .08, e.z - .01], [x1 - .06, y1 - .2, e.z - .01], [x0 + .06, y1 - .2, e.z - .01]], shadeHex('#2c2428', k));
  const p = proj(x0 + .12, y1 - .1, e.z - .01); if (p) glow(ctx, p[0], p[1], .05 * p[2], '#ff3040', .8);
};
// гигантский текст в мире (плоскость лицом к камере)
ENT.text3d = (ctx, e, L, lt, T) => {
  const p = proj(e.x, e.y, e.z); if (!p) return; const a = typeof e.alpha === 'function' ? e.alpha(lt, T) : (e.alpha ?? 1); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.font = `${e.weight || 400} ${e.size * p[2]}px ${e.font || '"Dela Gothic One"'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (e.glow) { ctx.shadowColor = e.glow; ctx.shadowBlur = 40; }
  ctx.fillStyle = e.color || '#f6efe4'; ctx.fillText(e.text, p[0], p[1]); ctx.restore();
};
