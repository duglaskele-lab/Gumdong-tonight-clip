/* engine/layers.js — экранные (2D) слои: фоны, спрайты крупным планом, кинетический текст, титры.
   Слой: {type, from, to, keys:[{t,...}], ...}. Время from/to/keys — от начала сцены. */
'use strict';
const LAYER = {};
function drawLayer(ctx, L, S, lt, T) {
  if (L.from != null && lt < L.from) return; if (L.to != null && lt >= L.to) return;
  const f = LAYER[L.type]; if (!f) return;
  const k = L.keys ? Object.assign({}, L, keyAt(L.keys, lt)) : L;
  ctx.save(); if (k.alpha != null) ctx.globalAlpha *= k.alpha;
  const inDur = L.inDur || .25; if (L.in === 'fade' && L.from != null) ctx.globalAlpha *= clamp((lt - L.from) / inDur, 0, 1);
  f(ctx, k, S, lt, T); ctx.restore();
}

// фоны
LAYER.bg = (ctx, L, S, lt, T) => {
  const st = L.style || 'flat';
  if (st === 'flat') { ctx.fillStyle = L.color || '#000'; ctx.fillRect(0, 0, W, H); return; }
  if (st === 'spot') { // тёмный фон, мягкое цветное пятно за головой + дымка
    ctx.fillStyle = L.color || '#0b0408'; ctx.fillRect(0, 0, W, H);
    const pulse = 1 + (L.pulse || 0) * Math.pow(1 - beatPhase(T), 3);
    glow(ctx, L.x ?? W / 2, L.y ?? H * .42, (L.r || 900) * pulse, L.glow || 'rgba(190,20,60,.85)', 1);
    glow(ctx, (L.x ?? W / 2) + 300, H * .2, 700, L.glow2 || 'rgba(120,20,140,.45)', 1);
    // полосы дымки
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const y = H * (.2 + i * .16) + Math.sin(T * .3 + i) * 30; const g = ctx.createLinearGradient(0, y - 60, 0, y + 60); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, `rgba(255,120,150,${.03 + .02 * (i % 2)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, y - 60, W, 120); }
    ctx.restore(); return;
  }
  if (st === 'bokeh') { // зал со сцены: свечи и гирлянда не в фокусе
    ctx.fillStyle = L.color || '#07040a'; ctx.fillRect(0, 0, W, H);
    const drift = (L.drift || 0) * lt;
    for (let i = 0; i < (L.n || 26); i++) { const x = (rand(i) * 1.3 - .15) * W + drift * (.5 + rand(i + 5)), y = H * (.45 + rand(i + 9) * .45), r = 30 + rand(i + 3) * 70;
      glow(ctx, x, y, r * 1.6, `rgba(255,${130 + rand(i + 1) * 60 | 0},60,.55)`, .5 + .5 * Math.sin(T * 2 + i)); }
    for (let i = 0; i < 12; i++) { const x = (rand(i + 40) * 1.2 - .1) * W + drift * .3, y = H * (.55 + rand(i + 41) * .3), s = 140 + rand(i + 42) * 120; // головы зрителей
      ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.beginPath(); ctx.ellipse(x, y, s * .45, s * .5, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y + s * 1.1, s, s * .7, 0, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - s * .4, y - s * .2); ctx.lineTo(x - s * .3, y - s * .85); ctx.lineTo(x - s * .05, y - s * .45); ctx.moveTo(x + s * .4, y - s * .2); ctx.lineTo(x + s * .3, y - s * .85); ctx.lineTo(x + s * .05, y - s * .45); ctx.fill(); }
    return;
  }
};

// спрайт крупным планом. {char,pose | img, x,y (точка привязки), h (высота на экране px), anchor:'bottom'|'center', crop, flip, shade, rim, mouth, anim}
LAYER.sprite = (ctx, L, S, lt, T) => {
  let im, P = {};
  if (L.char) { P = poseOf(L.char, L.pose); im = E.img[P.key]; } else im = E.img[L.img];
  if (!im) return;
  const crop = L.crop || null; const cw = crop ? crop[2] : 1, ch = crop ? crop[3] : 1;
  const h = L.h, w = h * (im.width * cw) / (im.height * ch);
  const an = animOf(L.anim, T);
  let x = L.x, y = L.y; ctx.save(); ctx.translate(x + an.dx * h, y + an.dy * h); ctx.rotate((L.r || 0) + an.r); ctx.scale(1, an.sy);
  const ox = -w / 2, oy = L.anchor === 'center' ? -h / 2 : (L.anchor === 'top' ? 0 : -h);
  drawImg(ctx, im, ox, oy, w, h, { crop, flip: L.flip, shade: L.shade, shadeColor: L.shadeColor, rim: L.rim, tint: L.tint, sil: L.sil });
  if (L.mouth && P.mouth) drawMouth(ctx, ox, oy, w, h, P.mouth, voxOpen(T), crop, L.flip);
  ctx.restore();
};

// Ступенчатый зум слова: каждое слово растёт рывками (steps), без плавности. {words:[{t,text}], steps, stepDur, font, color, y, fit}
LAYER.stepword = (ctx, L, S, lt, T) => {
  let w = null; for (const x of L.words) if (lt >= x.t) w = x; if (!w) return;
  const k = Math.min(L.steps.length - 1, Math.floor((lt - w.t) / L.stepDur)), sc = L.steps[k];
  ctx.save(); ctx.font = `400 200px ${L.font || '"Dela Gothic One"'}`; const mw = ctx.measureText(w.text).width;
  const base = Math.min((W * (L.fit || .86)) / mw, (H * .42) / 200) * 200;
  ctx.font = `400 ${base * sc}px ${L.font || '"Dela Gothic One"'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const j = (L.jitter || 0) * (rand(k * 13 + w.t * 7) - .5);
  ctx.translate(W / 2 + j + (w.x || 0), (L.y || H / 2) + j);
  const txt = w.text; let x = -ctx.measureText(txt).width / 2; ctx.textAlign = 'left';
  for (let i = 0; i < txt.length; i++) { const ch = txt[i], cw = ctx.measureText(ch).width; ctx.save(); ctx.translate(x + cw / 2, Math.sin(i * 2.1) * base * .02); ctx.rotate((rand(i + w.t) - .5) * .06);
    ctx.fillStyle = L.color || '#f6efe4'; ctx.textAlign = 'center'; ctx.fillText(ch, 0, 0); ctx.restore(); x += cw; }
  ctx.restore();
};

// Монтаж в бит: на каждое t — свой кадр {bg, char,pose,crop,h,x,y,flip}. Слой рисует активный.
LAYER.cuts = (ctx, L, S, lt, T) => {
  let it = null; for (const x of L.items) if (lt >= x.t) it = x; if (!it) return;
  if (it.bg) { ctx.fillStyle = it.bg; ctx.fillRect(0, 0, W, H); }
  if (it.char || it.img) LAYER.sprite(ctx, Object.assign({ anchor: 'bottom', x: W / 2, y: H + 40 }, it, { keys: null }), S, lt, T);
};
// Кадр-«фото» поверх монтажа: что лежит в items перед словом / после слова
LAYER.cutsFront = (ctx, L, S, lt, T) => {
  let it = null; for (const x of L.items) if (lt >= x.t) it = x; if (!it || !(it.char || it.img)) return;
  const zoom = 1 + (lt - it.t) * (L.push || .08);
  LAYER.sprite(ctx, Object.assign({ anchor: 'bottom', x: W / 2, y: H + 40 }, it, { h: it.h * zoom, bg: null }), S, lt, T);
};

// Титр (мелко, пиксельным шрифтом)
LAYER.title = (ctx, L, S, lt, T) => {
  const n = L.type_cps ? Math.floor((lt - (L.from || 0)) * L.type_cps) : 1e9;
  ctx.save(); ctx.font = `${L.size || 46}px ${L.font || 'VT323'}`; ctx.textAlign = L.align || 'left'; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = (L.spacing || 4) + 'px';
  ctx.fillStyle = L.color || '#f6efe4'; ctx.shadowColor = L.glow || 'rgba(255,60,110,.8)'; ctx.shadowBlur = 18;
  ctx.fillText(L.text.slice(0, n), L.x, L.y);
  if (L.sub) { ctx.font = `${(L.size || 46) * .6}px ${L.font || 'VT323'}`; ctx.globalAlpha *= .75; ctx.fillText(L.sub.slice(0, Math.max(0, n - L.text.length)), L.x, L.y + (L.size || 46) * .9); }
  ctx.restore();
};

// Плашка-метка прототипа (что здесь будет)
LAYER.note = (ctx, L) => {
  if (!E.notes) return;
  ctx.save(); ctx.font = '700 22px "JetBrains Mono", monospace'; const tw = ctx.measureText(L.text).width;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(L.x || 24, L.y || 24, tw + 24, 38); ctx.fillStyle = '#ffd23a'; ctx.fillText(L.text, (L.x || 24) + 12, (L.y || 24) + 27); ctx.restore();
};
