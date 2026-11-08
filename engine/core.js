/* engine/core.js — загрузка, время, ключевые кадры, рендер-цикл, пост-эффекты.
   Всё — чистая функция времени: renderAt(T) рисует кадр с любого момента. Никакого Math.random(). */
'use strict';
const W = 1920, H = 1080;
const E = { img: {}, ctx: null, ready: false, buf: null, bctx: null, notes: true };
const SCENES = [];
function scene(s) { SCENES.push(s); }            // вызывается из clip/scenes/NN-name.js

// ---------- math ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const rand = i => { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const EASE = {
  linear: u => u, step: u => u < 1 ? 0 : 1,
  in: u => u * u, out: u => 1 - (1 - u) * (1 - u),
  io: u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2,
  io3: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
};
// keys: [{t, ...numbers, e}] → интерполированный объект. e — easing сегмента, ведущего К этому ключу.
function keyAt(keys, t) {
  if (!keys || !keys.length) return {};
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]; if (t > b.t) continue;
    const a = keys[i - 1], u = (EASE[b.e || 'io'] || EASE.io)((t - a.t) / Math.max(1e-6, b.t - a.t)), o = {};
    for (const k in b) o[k] = (typeof b[k] === 'number' && typeof a[k] === 'number') ? lerp(a[k], b[k], u) : b[k];
    for (const k in a) if (!(k in o)) o[k] = a[k];
    return o;
  }
  return keys[keys.length - 1];
}
// Плавная траектория через все ключи (Catmull-Rom) без остановок на промежуточных точках.
// Время идёт по всей длине пути с мягким разгоном в начале и торможением в конце (ease: 0 — равномерно, 1 — полностью синус).
function splineAt(keys, t, ease = .65) {
  if (!keys || keys.length < 2) return keyAt(keys, t);
  const t0 = keys[0].t, t1 = keys[keys.length - 1].t, u = clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1);
  const tt = t0 + (lerp(u, .5 - Math.cos(Math.PI * u) / 2, ease)) * (t1 - t0);
  let i = 1; while (i < keys.length - 1 && tt > keys[i].t) i++;
  const p1 = keys[i - 1], p2 = keys[i], p0 = keys[i - 2] || p1, p3 = keys[i + 1] || p2;
  const s = clamp((tt - p1.t) / Math.max(1e-6, p2.t - p1.t), 0, 1), s2 = s * s, s3 = s2 * s, o = {};
  for (const k in p1) {
    if (typeof p1[k] !== 'number' || typeof p2[k] !== 'number' || k === 't') continue;
    const a = p0[k] ?? p1[k], b = p1[k], c = p2[k], d = p3[k] ?? p2[k];
    o[k] = .5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
  }
  return o;
}
// громкость песни 0..1: быстрое затухание (квадратичное) на отрезке CLIP.audioFade
function audioGain(t) { const f = CLIP.audioFade; if (!f) return 1; const u = clamp((t - f[0]) / (f[1] - f[0]), 0, 1); return (1 - u) * (1 - u); }
const BEAT = () => 60 / CLIP.bpm;
const beatPos = t => (t - CLIP.beatOffset) / BEAT();
const beatIdx = t => Math.floor(beatPos(t));
const beatPhase = t => { const p = beatPos(t); return p - Math.floor(p); };
const sceneAt = t => SCENES.find(s => t >= s.start && t < s.end) || null;
function lyricAt(t) { for (let i = 0; i < LYRICS.length; i++) { const l = LYRICS[i]; if (t >= l.t && t < (l.end || (LYRICS[i + 1] ? LYRICS[i + 1].t : l.t + 4))) return Object.assign({ i }, l); } return null; }

// голос для липсинка: 0..1, только внутри спетой строки
function voxOpen(t) {
  const env = window.VOX_ENV; if (!env) return 0;
  const L = lyricAt(t); if (!L || L.end && t > L.end - .05) return 0;
  const i = Math.floor(t * env.fps); const v = (env.v[i] || 0) * .6 + (env.v[i - 1] || 0) * .4;
  return clamp((v - .25) / .6, 0, 1);
}

// Нарисованные рты: 0 закрыт, 1 приоткрыт, 2 «А» (широко), 3 «О». Выбор по громкости голоса;
// на громком слоге «А» или «О» — решает хеш начала слога (детерминированно, без мигания внутри слога).
function mouthIdx(t) {
  const v = voxOpen(t); if (v < .14) return 0; if (v < .5) return 1;
  const env = window.VOX_ENV; let i = Math.floor(t * env.fps);
  for (let k = 0; k < 40 && i > 0 && voxOpen((i - 1) / env.fps) >= .14; k++) i--;   // начало слога
  return rand(i * 7.31) < .35 ? 3 : 2;
}
// Картинка позы в момент T: кадр анимации (P.anim), рот (P.mouths, если o.mouth) или обычный спрайт.
// o.animOffset — сдвиг цикла в секундах (чтобы соседние сцены не начинались с одного кадра), o.animSpeed.
function animIdx(P, T, o = {}) {
  const fr = E.anim && E.anim[P.anim]; if (!P.anim || !fr || !fr.length) return -1;
  const a = ANIM_FILES[P.anim], n = fr.length;
  const i = Math.floor((T * (o.animSpeed ?? P.animSpeed ?? 1) + (o.animOffset ?? P.animOffset ?? 0)) * a.fps);   // animSpeed: 0 — стоп-кадр
  if (a.loop === 'pingpong') { const p = 2 * n - 2, k = ((i % p) + p) % p; return k < n ? k : p - k; }   // вперёд-назад: нет шва цикла
  return a.loop === false ? clamp(i, 0, n - 1) : ((i % n) + n) % n;
}
// Где рот в момент T: у анимации с дорожкой ANIM_TRACK (assets/data/anim_track.js) — по кадру, иначе P.mouth.
function mouthAt(P, T, o) {
  const tr = window.ANIM_TRACK && P.anim && ANIM_TRACK[P.anim]; if (!tr || !P.mouth) return P.mouth;
  const i = animIdx(P, T, o); return i >= 0 && tr[i] ? Object.assign({}, P.mouth, { x: tr[i][0], y: tr[i][1] }) : P.mouth;
}
function poseImg(P, T, o = {}) {
  const i = animIdx(P, T, o);
  if (i >= 0) return E.anim[P.anim][i] || E.img[P.key];
  if (P.anim && E.anim && !E.anim[P.anim] && typeof ANIM_FILES !== 'undefined' && ANIM_FILES[P.anim]) loadAnim(P.anim);   // на всякий случай: догрузить по требованию
  if (o.mouth && P.mouths) return E.img[P.mouths[mouthIdx(T)]] || E.img[P.key];
  return E.img[P.key];
}

// ---------- loading ----------
const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src + (window.__V ? '?v=' + window.__V : ''); s.charset = 'utf-8'; s.onload = ok; s.onerror = () => no(src); document.head.appendChild(s); });
// версия файла для кеша: хеш содержимого из assets/data/manifest.js (tools/manifest.py) — после замены
// одного спрайта меняется только его адрес, остальное браузер берёт из кеша; нет в манифесте — CLIP.ver
const verQ = src => { const h = window.ASSET_V && ASSET_V[src]; return h ? '?v=' + h : (typeof CLIP !== 'undefined' && CLIP.ver ? '?v=' + CLIP.ver : ''); };
const loadImg1 = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = (window.__A && __A[src]) || (src + verQ(src)); });
// Спрайты assets/sprites/X.png грузятся сжатыми из assets/sprites/web/X.webp (tools/webify.py); нет webp — берётся PNG.
async function loadImg(src) {
  const m = !(window.__A && __A[src]) && /^assets\/sprites\/([^/]+)\.png$/.exec(src);
  const im = (m && await loadImg1(`assets/sprites/web/${m[1]}.webp`)) || await loadImg1(src);
  if (!im) console.warn('missing', src); return im;
}
E.load = { done: 0, total: 0 };
const track = p => { E.load.total++; return p.then(v => { E.load.done++; return v; }); };
// Какие анимации реально стоят в сценах (неиспользуемые не грузим): позы в SET.ents, set.ents и слоях сцен.
function usedAnims() {
  const out = [], add = (ch, pose) => { const C = CHARACTERS[ch]; const P = C && C.poses[pose]; if (P && P.anim && !out.includes(P.anim)) out.push(P.anim); };
  for (const S of SCENES) {
    const set = S.set || {}, ov = (typeof set.ents === 'function' ? set.ents(0, S.start) : set.ents) || {};
    for (const e of SET.ents) if (e.type === 'char' && S.world) { let o = ov[e.id]; if (typeof o === 'function') o = o(0, S.start); add(e.char, (o && o.pose) || e.pose); }
    const walk = L => { if (!L) return; if (L.char) add(L.char, L.pose); (L.items || []).forEach(walk); };
    (S.layers || []).forEach(walk); (S.overlay || []).forEach(walk);
  }
  return out;
}
// Покадровые анимации (Seedance): ANIM_FILES[name] = {dir, frames, fps, loop} → E.anim[name] = [Image…].
// Массив создаётся сразу; пока кадр не пришёл, рисуется статичный спрайт позы.
function loadAnim(k) {
  const a = ANIM_FILES[k]; if (!a || E.anim[k]) return Promise.resolve();
  const fr = E.anim[k] = new Array(a.frames).fill(null);
  return Promise.all(fr.map((_, i) => track(loadImg1(`${a.dir}/f${String(i).padStart(3, '0')}.${a.ext || 'webp'}`).then(im => { fr[i] = im; }))));
}
// waitAnims: true — ждать все кадры (рендер видео, проверка кадров); иначе плеер стартует сразу, анимации догружаются в фоне.
async function loadAll(waitAnims = true) {
  for (const n of CLIP.scenes) { try { await loadScript('clip/scenes/' + n + '.js'); } catch (e) { console.error('scene file failed', e); } }
  SCENES.sort((a, b) => a.start - b.start);
  E.anim = {};
  await Promise.all(Object.entries(ASSETS).map(([k, p]) => track(loadImg(p)).then(im => { E.img[k] = im; })));
  try { await Promise.all(CLIP.fonts.map(f => document.fonts.load(f))); } catch (e) {}
  E.buf = document.createElement('canvas'); E.buf.width = W; E.buf.height = H; E.bctx = E.buf.getContext('2d');
  const anims = typeof ANIM_FILES !== 'undefined' ? usedAnims() : [];
  if (waitAnims) await Promise.all(anims.map(loadAnim));
  else (async () => { for (const k of anims) await loadAnim(k); })();   // по очереди, в порядке появления в клипе
  E.ready = true;
}

// ---------- scratch canvases ----------
const _scr = {};
function scratch(name, w, h) { let c = _scr[name]; if (!c) { c = _scr[name] = document.createElement('canvas'); } if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.clearRect(0, 0, w, h); return [c, g]; }

// Нарисовать картинку с затемнением/подкраской. o: {crop:[x,y,w,h] доли, shade 0..1, shadeColor, tint:{color,amount}, flip, alpha, sil (силуэт), rim}
function drawImg(ctx, im, x, y, w, h, o = {}) {
  if (!im || w < 1 || h < 1) return;
  const c = o.crop || [0, 0, 1, 1];
  const sx = c[0] * im.width, sy = c[1] * im.height, sw = c[2] * im.width, sh = c[3] * im.height;
  const need = o.shade || o.tint || o.sil || o.rim || o.glow;
  ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (!need) {
    if (o.flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h); }
    else ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
    ctx.restore(); return;
  }
  const pw = Math.ceil(w) + 2, ph = Math.ceil(h) + 2;
  const [cv, g] = scratch('img', pw, ph);
  if (o.flip) { g.translate(pw - 1, 1); g.scale(-1, 1); g.drawImage(im, sx, sy, sw, sh, 0, 0, w, h); g.setTransform(1, 0, 0, 1, 0, 0); }
  else g.drawImage(im, sx, sy, sw, sh, 1, 1, w, h);
  g.globalCompositeOperation = 'source-atop';
  if (o.tint) { g.globalAlpha = o.tint.amount; g.fillStyle = o.tint.color; g.fillRect(0, 0, pw, ph); }
  if (o.shade) { g.globalAlpha = clamp(o.shade, 0, 1); g.fillStyle = o.shadeColor || '#07040a'; g.fillRect(0, 0, pw, ph); }
  if (o.sil) { g.globalAlpha = o.sil; g.fillStyle = o.silColor || '#000'; g.fillRect(0, 0, pw, ph); }
  if (o.rim) { // контровой свет сверху: светлая полоса по верхнему краю силуэта
    g.globalAlpha = o.rim.amount || .5; const gr = g.createLinearGradient(0, 0, 0, ph * (o.rim.depth || .35));
    gr.addColorStop(0, o.rim.color || '#ff3a5c'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(0, 0, pw, ph);
  }
  if (o.glow) { ctx.shadowColor = o.glow.color || '#fff'; ctx.shadowBlur = o.glow.blur || 20; }   // свечение вокруг силуэта
  ctx.drawImage(cv, x - 1, y - 1); ctx.restore();
}

// Рот для липсинка поверх спрайта. m: {x,y,w} доли спрайта (без crop), open 0..1
// m.cover {rx, ry} (в ширинах рта) — закрасить нарисованный на спрайте рот цветом кожи m.lip и рисовать свой,
// в тишине — закрытый рот линией (для спрайта, где рот нарисован открытым).
// m.line — рисовать закрытый рот линией в тишине (нарисованный рот уже стёрт в кадрах, cover не нужен).
// m.clipOut {x, y, rx, ry} (доли спрайта) — эллипс, внутри которого рот не рисуется (головка микрофона перед лицом).
function drawMouth(ctx, x, y, w, h, m, open, crop, flip) {
  const c = crop || [0, 0, 1, 1];
  let mx = (m.x - c[0]) / c[2], my = (m.y - c[1]) / c[3]; if (flip) mx = 1 - mx;
  const mw = m.w / c[2] * w, cx = x + mx * w, cy = y + my * h;
  if (m.clipOut) {
    const k = m.clipOut; let ex = (k.x - c[0]) / c[2]; if (flip) ex = 1 - ex;
    ctx.save(); ctx.beginPath(); ctx.rect(x - w, y - h, w * 3, h * 3);
    ctx.ellipse(x + ex * w, y + (k.y - c[1]) / c[3] * h, k.rx / c[2] * w, k.ry / c[3] * h, 0, 0, Math.PI * 2); ctx.clip('evenodd');
    drawMouth(ctx, x, y, w, h, Object.assign({}, m, { clipOut: null }), open, crop, flip); ctx.restore(); return;
  }
  if (m.line && open < .08) { ctx.save(); ctx.strokeStyle = '#3a1c18'; ctx.lineWidth = Math.max(1, mw * .06); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - mw * .3, cy + mw * .03); ctx.quadraticCurveTo(cx, cy - mw * .04, cx + mw * .3, cy + mw * .02); ctx.stroke(); ctx.restore(); return; }
  if (m.cover) {
    ctx.save(); ctx.fillStyle = m.lip; ctx.shadowColor = m.lip; ctx.shadowBlur = mw * .25;
    ctx.beginPath(); ctx.ellipse(cx, cy, m.cover.rx * mw, m.cover.ry * mw, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    if (open < .08) { ctx.save(); ctx.strokeStyle = '#2a1414'; ctx.lineWidth = Math.max(1.2, mw * .07); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - mw * .32, cy + mw * .04); ctx.quadraticCurveTo(cx, cy - mw * .06, cx + mw * .32, cy + mw * .04); ctx.stroke(); ctx.restore(); return; }
  }
  if (open < .08) return;
  const rw = mw * (.42 + .12 * open), rh = mw * (.08 + .42 * open);
  ctx.save();
  ctx.fillStyle = m.lip || '#c9a07c'; ctx.beginPath(); ctx.ellipse(cx, cy + rh * .35, rw * 1.08, rh * 1.05 + mw * .05, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a0c12'; ctx.beginPath(); ctx.ellipse(cx, cy + rh * .35, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
  if (open > .45) { ctx.fillStyle = '#b8455a'; ctx.beginPath(); ctx.ellipse(cx, cy + rh * .9, rw * .55, rh * .35, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#1a0a0c'; ctx.lineWidth = Math.max(1.5, mw * .06); ctx.beginPath(); ctx.ellipse(cx, cy + rh * .35, rw, rh, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// простые циклы движения спрайта (без кадров): возвращают смещения в долях высоты
const ANIM = {
  bob: (t, a = 1) => { const p = beatPhase(t); return { dy: -Math.pow(1 - p, 3) * .012 * a, sy: 1 - Math.pow(1 - p, 4) * .012 * a }; },
  sway: (t, a = 1) => ({ r: Math.sin(beatPos(t) * Math.PI / 2) * .025 * a, dx: Math.sin(beatPos(t) * Math.PI / 2) * .01 * a }),
  headbang: (t, a = 1) => { const p = beatPhase(t); return { r: (p < .3 ? p / .3 : 1 - (p - .3) / .7) * .05 * a, dy: (p < .3 ? p / .3 : 1 - (p - .3) / .7) * .015 * a }; },
  dance: (t, a = 1) => { const b = beatPos(t), p = beatPhase(t); return { dx: Math.sin(b * Math.PI / 2) * .06 * a, r: Math.sin(b * Math.PI / 2) * .06 * a, dy: -Math.abs(Math.sin(p * Math.PI)) * .03 * a }; },
  breath: (t, a = 1) => ({ sy: 1 + Math.sin(t * 2.2) * .006 * a }),
};
function animOf(list, t) {
  const o = { dx: 0, dy: 0, r: 0, sy: 1 };
  for (const a of [].concat(list || [])) { const [n, amt] = Array.isArray(a) ? a : [a, 1]; const f = ANIM[n]; if (!f) continue; const v = f(t, amt); o.dx += v.dx || 0; o.dy += v.dy || 0; o.r += v.r || 0; o.sy *= v.sy || 1; }
  return o;
}

// ---------- render ----------
function renderAt(T, outCtx) {
  const S = sceneAt(T); const ctx = E.bctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (S) {
    const lt = T - S.start;
    // тряска/удар камеры
    ctx.save();
    // bob — плавное покачивание кадра вверх-вниз в такт (px): вниз на одну долю, вверх на следующую.
    // Кадр чуть увеличен, чтобы при сдвиге не открывались края. (Бывший «удар» punch убран по просьбе.)
    if (S.bob || S.shake) {
      const bob = S.bob || 0, dy = bob * Math.cos(Math.PI * beatPos(T)), k = 1 + 2 * bob / H;
      const sh = typeof S.shake === 'function' ? S.shake(lt, T) : (S.shake || 0);
      ctx.translate(W / 2 + (rand(Math.floor(T * 24)) - .5) * sh, H / 2 + dy + (rand(Math.floor(T * 24) + 99) - .5) * sh); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2);
    }
    if (S.world) drawWorld(ctx, S, lt, T);
    for (const L of S.layers || []) drawLayer(ctx, L, S, lt, T);
    ctx.restore();
    for (const L of S.overlay || []) drawLayer(ctx, L, S, lt, T);
  }
  postFX(ctx, S, T);
  if (S && S.lyrics !== 'none' && E.captions !== false) drawCaption(ctx, T, S);
  sceneFX(ctx, S, T);
  outCtx.setTransform(1, 0, 0, 1, 0, 0); outCtx.drawImage(E.buf, 0, 0);
}

function sceneFX(ctx, S, T) {
  if (!S) return; const lt = T - S.start;
  for (const f of S.fx || []) {
    if (f.type === 'dark' && lt >= f.t) { ctx.save(); ctx.globalAlpha = f.amount ?? .85; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); continue; }
    const u = (lt - f.t) / (f.dur || .2); if (u < 0 || u > 1) continue;
    ctx.save();
    if (f.type === 'flash') { ctx.globalAlpha = (1 - u) * (f.amount || .85); ctx.fillStyle = f.color || '#fff'; ctx.fillRect(0, 0, W, H); }
    if (f.type === 'fadeIn') { ctx.globalAlpha = 1 - u; ctx.fillStyle = f.color || '#000'; ctx.fillRect(0, 0, W, H); }
    if (f.type === 'fadeOut') { ctx.globalAlpha = u; ctx.fillStyle = f.color || '#000'; ctx.fillRect(0, 0, W, H); }
    if (f.type === 'black') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }
  if (T > CLIP.fadeOut) { ctx.save(); ctx.globalAlpha = clamp((T - CLIP.fadeOut) / (CLIP.duration - CLIP.fadeOut), 0, 1); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// пост: пикселизация, ограничение палитры, VHS, глитч, зерно, виньетка
let _grain = null;
function postFX(ctx, S, T) {
  const P = Object.assign({}, CLIP.post, S && S.post); const lt = S ? T - S.start : 0;
  const glitch = typeof P.glitch === 'function' ? P.glitch(lt, T) : (P.glitch || 0);
  // глитч: горизонтальные сдвиги блоков
  if (glitch > 0) {
    const [c, g] = scratch('post', W, H); g.drawImage(E.buf, 0, 0); const fr = Math.floor(T * 24);
    const n = Math.floor(3 + glitch * 14);
    for (let i = 0; i < n; i++) { const r1 = rand(fr * 31 + i), r2 = rand(fr * 17 + i * 3), r3 = rand(fr * 7 + i * 11); if (r3 > glitch + .15) continue;
      const y = Math.floor(r1 * H), h = 6 + Math.floor(r2 * 60 * glitch), dx = (r3 - .5) * 160 * glitch;
      ctx.drawImage(c, 0, y, W, h, dx, y, W, h);
      if (r2 > .6) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .35 * glitch; ctx.fillStyle = r1 > .5 ? '#ff0040' : '#00e5ff'; ctx.fillRect(0, y, W, h); ctx.restore(); }
    }
  }
  // RGB-сдвиг
  const chroma = typeof P.chroma === 'function' ? P.chroma(lt, T) : (P.chroma || 0);
  if (chroma > 0) {
    const [c, g] = scratch('post', W, H); g.drawImage(E.buf, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ff0000'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(E.buf, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.drawImage(c, chroma, 0); ctx.restore();
  }
  // красный свет: тот же красный канал без сдвига — ровный тёплый «залив» (продолжение вида RGB-сдвига)
  const red = typeof P.red === 'function' ? P.red(lt, T) : (P.red || 0);
  if (red > 0) {
    const [c, g] = scratch('post', W, H); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(E.buf, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ff0000'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(E.buf, 0, 0); g.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55 * red; ctx.drawImage(c, 0, 0); ctx.restore();
  }
  // пиксельная сетка
  const px = P.pixel || 1;
  if (px > 1) {
    const w = Math.round(W / px), h = Math.round(H / px); const [c, g] = scratch('pix', w, h);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'medium'; g.drawImage(E.buf, 0, 0, w, h);
    if (P.levels) { // постеризация каналов — «ограниченная палитра»
      const id = g.getImageData(0, 0, w, h), d = id.data, L = P.levels - 1, bay = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, th = (bay[(y & 3) * 4 + (x & 3)] / 16 - .5) * (255 / L) * .9;
        d[i] = Math.round(clamp(d[i] + th, 0, 255) / 255 * L) / L * 255; d[i + 1] = Math.round(clamp(d[i + 1] + th, 0, 255) / 255 * L) / L * 255; d[i + 2] = Math.round(clamp(d[i + 2] + th, 0, 255) / 255 * L) / L * 255; }
      g.putImageData(id, 0, 0);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, W, H); ctx.restore();
  }
  // VHS: полоса срыва синхронизации
  const vhs = typeof P.vhs === 'function' ? P.vhs(lt, T) : (P.vhs || 0);
  if (vhs > 0) {
    const by = ((T * 0.13) % 1.3) * H - 100; ctx.save(); ctx.globalAlpha = .12 * vhs; ctx.fillStyle = '#fff'; ctx.fillRect(0, by, W, 14); ctx.globalAlpha = .06 * vhs; ctx.fillRect(0, by + 20, W, 40); ctx.restore();
  }
  // сканлайны
  if (P.scan) { ctx.save(); ctx.globalAlpha = P.scan; ctx.fillStyle = '#000'; for (let y = 0; y < H; y += (P.pixel || 2) * 2) ctx.fillRect(0, y, W, P.pixel || 2); ctx.restore(); }
  // зерно
  if (P.grain) {
    if (!_grain) { _grain = []; for (let k = 0; k < 4; k++) { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'), id = g.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = rand(i * 1.3 + k * 999) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); _grain.push(c); } }
    ctx.save(); ctx.globalAlpha = P.grain; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(_grain[Math.floor(T * 24) % 4], 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (P.vignette) { ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${P.vignette})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// подпись: белые буквы с чёрной обводкой внизу по центру
function drawCaption(ctx, T, S) {
  const L = lyricAt(T); if (!L) return;
  const text = L.text.toUpperCase(); let size = 42;
  ctx.save(); ctx.font = `900 ${size}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
  const tw = ctx.measureText(text).width; if (tw > W * .88) { size *= W * .88 / tw; ctx.font = `900 ${size}px Nunito, sans-serif`; }
  const a = clamp((T - L.t) / .12, 0, 1); ctx.globalAlpha = a;
  const y = S.lyricY || H - 70;
  ctx.lineJoin = 'round'; ctx.lineWidth = size * .22; ctx.strokeStyle = '#000'; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 10;
  ctx.strokeText(text, W / 2, y); ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.fillText(text, W / 2, y);
  ctx.restore();
}
