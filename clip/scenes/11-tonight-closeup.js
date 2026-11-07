/* 11 · Кульминация и финал.
   «to-night»: крупный план у микрофона — S3, голова поднимается к свету, рот открыт на протяжном «-niiight».
   65.8 — блэкаут: Gumdong становится белым светящимся силуэтом, камера быстро отъезжает через пустой зал,
   проступают белые силуэты Rossali и Lupa. Затем фигуры слетаются в слово TONIGHT:
   Rossali — ножка буквы T (под неоновой перекладиной), Lupa с установкой — внутри кольца O,
   Gumdong — буква I; остальные буквы загораются неоном. Уход в чёрное к 1:11. */
{ // блок: константы сцены не видны другим файлам
const OFF = 65.8 - b(150);          // от начала сцены: блэкаут
const SIL = .9;                     // за сколько секунд Gumdong становится белым силуэтом
const BACK0 = OFF + .8, BACK1 = OFF + 2.3;   // отъезд камеры
const SWAP = BACK0 + .3, SWD = .15;   // подмена силуэта по пояс на силуэт в полный рост — уже на ходу камеры
const TH = OFF + 2.3;               // фигуры «отрываются» от сцены и летят в слово
const SL = .85;                     // сколько летят
const TL = TH + .75;                // загораются буквы (по одной, шаг LS)
const LS = .09;
const sm = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const WHITE = { silColor: '#fdf8ff', glow: { color: 'rgba(255,240,255,.9)', blur: 26 } };
const AUDIENCE = ['maeve', 'g1', 'g2', 'g3', 'g4', 'g5', 'alex'];
const FONT = '"Dela Gothic One"';

// Раскладка слова: размеры букв и места для фигур (экранные координаты). Считается один раз.
let LAY = null;
function layout(ctx) {
  if (LAY) return LAY;
  ctx.save(); ctx.font = `400 200px ${FONT}`;
  const cap0 = ctx.measureText('H').actualBoundingBoxAscent || 150;
  const ADV = {}; for (const ch of 'TONIGH') ADV[ch] = ctx.measureText(ch).width;   // мерить, пока шрифт выставлен
  const adv = ch => ADV[ch];
  ctx.restore();
  const k0 = 200 / cap0;                            // кегль на единицу высоты прописной
  // ширины слотов в долях высоты буквы (cap); фигуры — по своим пропорциям
  const gw = ch => adv(ch) / cap0;
  const slots = [
    { ch: 'T', w: gw('T'), fig: 'rossali' },        // перекладина T + Rossali вместо ножки
    { ch: 'O', w: 1.0, fig: 'lupa' },               // неоновое кольцо, Lupa с установкой внутри
    { ch: 'N', w: gw('N') },
    { ch: 'I', w: .62, fig: 'gumdong' },            // Gumdong — буква I
    { ch: 'G', w: gw('G') },
    { ch: 'H', w: gw('H') },
    { ch: 'T', w: gw('T') },
  ];
  const gap = .1, total = slots.reduce((s, x) => s + x.w, 0) + gap * (slots.length - 1);
  const cap = Math.min(W * .86 / total, H * .36);
  let x = (W - total * cap) / 2; const base = H * .64;
  for (const s of slots) { s.x0 = x; s.cx = x + s.w * cap / 2; x += (s.w + gap) * cap; }
  return (LAY = { cap, base, top: base - cap, slots, size: cap * k0, st: cap * .26 });
}
// куда встаёт фигура (прямоугольник: центр x, низ, высота)
function figTarget(L, s, r) {
  const c = L.cap;
  if (s.fig === 'rossali') { const h = c * .7; return { cx: s.cx, yb: L.base, h }; }                 // под перекладиной
  if (s.fig === 'lupa') { const ri = c / 2 - L.st, h = ri * 2 * .86 / Math.max(1, r.w / r.h);      // вписать в кольцо
    return { cx: s.cx, yb: L.base - c / 2 + h / 2, h }; }
  return { cx: s.cx, yb: L.base, h: c };                                                             // Gumdong — во всю высоту
}
function neonOn(lt, i) {   // зажигание неона: короткое мерцание, затем ровный свет
  const u = (lt - TL - i * LS) / .22; if (u <= 0) return 0; if (u >= 1) return 1;
  return (rand(Math.floor(lt * 40) * 7 + i * 13) > .35 ? 1 : .25) * Math.min(1, u * 2);
}
function glowFill(ctx, draw) {   // белая заливка с белым и розовым свечением — как у силуэтов
  ctx.save(); ctx.fillStyle = '#fdf8ff'; ctx.strokeStyle = '#fdf8ff';
  ctx.shadowColor = 'rgba(255,60,140,.55)'; ctx.shadowBlur = 60; draw();
  ctx.shadowColor = 'rgba(255,240,255,.9)'; ctx.shadowBlur = 26; draw(); ctx.restore();
}

LAYER.tonightWord = (ctx, Ly, S, lt, T) => {
  if (lt < TH - .25) return;
  const L = layout(ctx);
  // зал уходит в темноту
  ctx.save(); ctx.globalAlpha = .9 * sm((lt - TH + .25) / .8); ctx.fillStyle = '#030104'; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (lt < TH) return;
  // откуда летят фигуры: их место на экране в момент TH (камера и стоп-кадры — как в 3D)
  if (!Ly._src) {
    setCam(keyAt(S.cam.keys, TH));
    const ents = worldState(S, TH - .001, S.start + TH - .001).ents, by = id => ents.find(e => e.id === id);
    Ly._src = { rossali: entRect(by('rossali'), S.start + TH), lupa: entRect(by('lupa'), S.start + TH), gumdong: entRect(by('gumdong_full'), S.start + TH) };
  }
  const u = EASE.io3(clamp((lt - TH) / SL, 0, 1));
  // буквы
  ctx.save(); ctx.font = `400 ${L.size}px ${FONT}`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  L.slots.forEach((s, i) => {
    const a = neonOn(lt, i); if (!a) return;
    ctx.save(); ctx.globalAlpha = a;
    if (s.fig === 'gumdong') { ctx.restore(); return; }
    if (s.ch === 'O') glowFill(ctx, () => { ctx.lineWidth = L.st; ctx.beginPath(); ctx.arc(s.cx, L.base - L.cap / 2, L.cap / 2 - L.st / 2, 0, Math.PI * 2); ctx.stroke(); });
    else if (s.fig === 'rossali') { ctx.beginPath(); ctx.rect(0, L.top - L.cap, W, L.cap * 1.27); ctx.clip(); glowFill(ctx, () => ctx.fillText('T', s.cx, L.base)); }
    else glowFill(ctx, () => ctx.fillText(s.ch, s.cx, L.base));
    ctx.restore();
  });
  ctx.restore();
  // фигуры летят на свои места
  for (const s of L.slots) {
    if (!s.fig) continue; const r = Ly._src[s.fig]; if (!r) continue;
    const t = figTarget(L, s, r), h = lerp(r.h, t.h, u), cx = lerp(r.cx, t.cx, u), w = h * r.w / r.h;
    const yb = lerp(r.yb, t.yb, u) - (s.fig === 'lupa' ? Math.sin(Math.PI * u) * L.cap * .7 : 0);   // Lupa перелетает над Gumdong дугой
    const lit = sm((lt - TL - 3 * LS) / .3);   // когда слово горит — у фигур такое же розовое свечение, как у букв
    if (lit > 0) drawImg(ctx, r.im, cx - w / 2, yb - h, w, h, { sil: 1, silColor: '#fdf8ff', alpha: lit, glow: { color: 'rgba(255,60,140,.55)', blur: 60 } });
    drawImg(ctx, r.im, cx - w / 2, yb - h, w, h, Object.assign({ sil: 1 }, WHITE));
  }
};

scene({
  id: '11 tonight closeup', start: b(150), end: CLIP.duration, world: true, lyrics: 'caption',
  cam: { keys: [
    { t: 0, x: .04, y: 2.03, z: 11.95, pitch: 3 },
    { t: OFF, x: .02, y: 2.1, z: 12.3, pitch: 5.5, e: 'linear' },     // медленный наезд и чуть вверх — за поднимающейся головой
    { t: BACK0, x: .02, y: 2.08, z: 12.15, pitch: 5, e: 'out' },      // силуэт проявляется, камера почти стоит
    { t: BACK1, x: 0, y: 1.75, z: 4.0, pitch: 4, e: 'io3' },          // быстрый отъезд назад через пустой зал
    { t: CLIP.duration - b(150), x: 0, y: 1.74, z: 3.4, pitch: 4, e: 'linear' },
  ] },
  set: {
    hide: lt => lt < OFF ? ['mic'] : ['mic', ...AUDIENCE],   // стойка нарисована в S3; после блэкаута зал пустой
    ents: lt => {
      const o = { gumdong: { pose: 'micUp', animOffset: 46 / 24 - b(150) } };   // S3 с кадра 46; к блэкауту — кадр ~116
      if (lt >= OFF) {
        const s = sm((lt - OFF) / SIL);
        o.gumdong = Object.assign({}, o.gumdong, WHITE, { sil: s, alpha: 1 - sm((lt - SWAP) / SWD) });   // в белый, затем передаёт место силуэту в полный рост
        const a = lt >= TH ? 0 : sm((lt - OFF - .5) / 1.1);     // после TH фигуры рисует слой слова
        // замирают на кадре момента блэкаута (как Gumdong) — стоп-кадр: animSpeed 0, кадр = время блэкаута (+ их сдвиг цикла)
        o.lupa = Object.assign({ sil: 1, alpha: a, animSpeed: 0, animOffset: 65.8 }, WHITE);
        o.rossali = Object.assign({ sil: 1, alpha: a, animSpeed: 0, animOffset: 65.8 + 1.7 }, WHITE);
      }
      return o;
    },
    add: lt => {
      // силуэт в полный рост (голова поднята, как в конце S3) — нужен, когда камера отъезжает и видны ноги
      // x/h подобраны так, чтобы голова совпала с головой в последнем кадре S3
      if (lt < SWAP) return [];
      return [Object.assign({ id: 'gumdong_full', type: 'char', char: 'gumdong', pose: 'singUp', x: .019, y: .7, z: 13.3, h: 1.58, zone: 'stage',
        sil: 1, alpha: lt >= TH ? 0 : sm((lt - SWAP) / SWD) }, WHITE)];
    },
    light: lt => lt < OFF ? { house: .3, stage: 1, beams: 1, rim: .9 }
      : { house: .07, stage: .04, beams: 0, candles: 0, string: .12, neon: .06, edge: .08, rim: 0, eyes: 0 },
  },
  fx: [{ t: OFF, type: 'black', dur: .08 }],
  overlay: [
    { type: 'tonightWord' },
    { type: 'note', text: '11 · «tonight» → белые силуэты → слово TONIGHT из фигур' },
  ],
});
}
