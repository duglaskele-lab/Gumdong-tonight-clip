/* 11 · Кульминация и финал.
   «to-night»: крупный план у микрофона — S3, голова поднимается к свету, рот открыт на протяжном «-niiight».
   65.8 — блэкаут: Gumdong становится белым светящимся силуэтом, проступают белые силуэты Rossali и Lupa,
   камера отъезжает. На ходу фигуры растворением (без затемнения) встают в позы-буквы прямо на сцене:
   Rossali с басом над головой — первая T, Gumdong — ножка i (на неё падает белый кирпич, отскакивает
   и зависает точкой), Lupa с палочками над головой — последняя T. Между ними загораются неоновые O N G H.
   Слово — TONiGHT, i выше остальных (солистка). Уход в чёрное к 1:11. */
{ // блок: константы сцены не видны другим файлам
const OFF = 65.8 - b(150);          // от начала сцены: блэкаут
const SIL = .9;                     // за сколько секунд Gumdong становится белым силуэтом
const BACK0 = OFF + .8, BACK1 = OFF + 2.4;   // отъезд камеры
const SW = OFF + 1.25, SWD = .35;   // растворение в позы-буквы (на ходу камеры)
const TB = OFF + 2.35;              // кирпич появляется над Gumdong
const TL = OFF + 2.95, LS = .09;    // неоновые буквы загораются по одной
const C = 1.45;                     // высота буквы в метрах = рост силуэтов в позах-буквах
const Z = 13.3, Y = .7;             // все три на одной линии сцены (глубина Gumdong)
const sm = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const WHITE = { silColor: '#fdf8ff', glow: { color: 'rgba(255,240,255,.9)', blur: 26 } };
const AUDIENCE = ['maeve', 'g1', 'g2', 'g3', 'g4', 'g5', 'alex'];
const FONT = '800 {S}px Nunito';   // неон потоньше — под тонкие силуэты-буквы
const font = sz => FONT.replace('{S}', sz);

// Раскладка слова в долях высоты буквы (cap) относительно центра i (Gumdong). Считается один раз.
let LAY = null;
function layout() {
  if (LAY) return LAY;
  const [, g] = scratch('tw', 8, 8); g.font = font(200);
  const cap0 = g.measureText('H').actualBoundingBoxAscent || 146, gw = ch => g.measureText(ch).width / cap0;
  const asp = k => { const im = E.img[k]; return im ? im.width / im.height : .6; };
  const slots = [
    { ch: 'T', w: asp('rossali_t'), fig: 'rossali' }, { ch: 'O', w: gw('O') }, { ch: 'N', w: gw('N') },
    { ch: 'i', w: asp('gumdong_guitar'), fig: 'gumdong' },
    { ch: 'G', w: gw('G') }, { ch: 'H', w: gw('H') }, { ch: 'T', w: asp('lupa_t'), fig: 'lupa' },
  ];
  const gap = .07; let x = 0; for (const s of slots) { s.u0 = x; x += s.w + gap; }
  const ci = slots[3].u0 + slots[3].w / 2; for (const s of slots) s.u = s.u0 + s.w / 2 - ci;   // центр слота от центра i
  return (LAY = { slots, k0: 200 / cap0 });
}
const slotX = fig => layout().slots.find(s => s.fig === fig).u * C;   // где стоит фигура в мире (x)

function glowFill(ctx, draw) {   // белая заливка с белым и розовым свечением — как у силуэтов
  ctx.save(); ctx.fillStyle = '#fdf8ff';
  ctx.shadowColor = 'rgba(255,60,140,.55)'; ctx.shadowBlur = 60; draw();
  ctx.shadowColor = 'rgba(255,240,255,.9)'; ctx.shadowBlur = 26; draw(); ctx.restore();
}
function neonOn(lt, i) {   // зажигание неона: короткое мерцание, затем ровный свет
  const u = (lt - TL - i * LS) / .22; if (u <= 0) return 0; if (u >= 1) return 1;
  return (rand(Math.floor(lt * 40) * 7 + i * 13) > .35 ? 1 : .25) * Math.min(1, u * 2);
}
// кирпич: падает сверху на голову, отскакивает и зависает точкой над i. Возвращает {y (в долях cap над головой), r}
function brick(t) {
  const FALL = .32, BOUNCE = .38, top = 2.2, rest = .21;   // зависает вдвое ближе к голове
  if (t < 0) return null;
  if (t < FALL) { const u = t / FALL; return { y: top * (1 - u * u), r: .5 * (1 - u) }; }                  // свободное падение
  const u = Math.min(1, (t - FALL) / BOUNCE), e = 1 - Math.pow(1 - u, 3);
  return { y: rest * e + Math.sin(Math.PI * u) * .12, r: -.25 * (1 - e) * Math.sin(u * 9) };                // отскок и зависание
}

LAYER.tonightWord = (ctx, Ly, S, lt, T) => {
  if (lt < TB) return;
  const L = layout(), st = worldState(S, lt, T), g = st.ents.find(e => e.id === 'gumdong_i'); if (!g) return;
  const r = entRect(g, T); if (!r) return;
  const cap = r.h, base = r.yb, size = cap * L.k0;
  // неоновые буквы между фигурами (экранные координаты считаются от силуэта Gumdong — всё на одной глубине)
  ctx.save(); ctx.font = font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  L.slots.forEach((s, i) => {
    if (s.fig) return; const a = neonOn(lt, i); if (!a) return;
    ctx.save(); ctx.globalAlpha = a; glowFill(ctx, () => ctx.fillText(s.ch, r.cx + s.u * cap, base)); ctx.restore();
  });
  ctx.restore();
  // кирпич — точка над i
  const k = brick(lt - TB); if (!k) return;
  const bw = cap * .225, bh = cap * .1125,   /* на 25 % меньше */ cx = r.cx, cy = base - cap - k.y * cap - bh / 2;   // y=0 — касается макушки
  ctx.save(); ctx.globalAlpha = sm((lt - TB) / .12); ctx.translate(cx, cy); ctx.rotate(k.r);
  glowFill(ctx, () => { ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh * .12); ctx.fill(); });
  ctx.restore();
};

scene({
  id: '11 tonight closeup', start: b(150), end: CLIP.duration, world: true, lyrics: 'caption',
  cam: { keys: [
    { t: 0, x: .04, y: 2.03, z: 11.95, pitch: 3 },
    { t: OFF, x: .02, y: 2.1, z: 12.3, pitch: 5.5, e: 'linear' },     // медленный наезд и чуть вверх — за поднимающейся головой
    { t: BACK0, x: .02, y: 2.08, z: 12.15, pitch: 5, e: 'out' },      // силуэт проявляется, камера почти стоит
    { t: BACK1, x: 0, y: 1.75, z: 4.6, pitch: 4, e: 'io3' },          // отъезд: на сцене — всё слово
    { t: CLIP.duration - b(150), x: 0, y: 1.74, z: 4.2, pitch: 4, e: 'linear' },
  ] },
  set: {
    hide: lt => lt < OFF ? ['mic'] : ['mic', ...AUDIENCE],   // стойка нарисована в S3; после блэкаута зал пустой
    ents: lt => {
      const o = { gumdong: { pose: 'micUp', animOffset: 46 / 24 - b(150) } };   // S3 с кадра 46; к блэкауту — кадр ~116
      if (lt >= OFF) {
        const s = sm((lt - OFF) / SIL), out = 1 - sm((lt - SW) / SWD);
        o.gumdong = Object.assign({}, o.gumdong, WHITE, { sil: s, alpha: out });   // в белый, затем растворяется в позу-букву
        const a = sm((lt - OFF - .5) / 1.1) * out;
        // замирают на кадре момента блэкаута (как Gumdong) — стоп-кадр: animSpeed 0, кадр = время блэкаута (+ их сдвиг цикла)
        o.lupa = Object.assign({ sil: 1, alpha: a, animSpeed: 0, animOffset: 65.8 }, WHITE);
        o.rossali = Object.assign({ sil: 1, alpha: a, animSpeed: 0, animOffset: 65.8 + 1.7 }, WHITE);
      }
      return o;
    },
    // позы-буквы: проявляются растворением поверх старых поз, все трое — на одной линии сцены
    add: lt => {
      if (lt < SW) return [];
      const a = sm((lt - SW) / SWD), lit = sm((lt - TL) / .5);   // когда горит слово — фигуры светятся как неон
      const glow = { color: lit > 0 ? `rgba(255,${Math.round(240 - 150 * lit)},${Math.round(255 - 90 * lit)},.9)` : WHITE.glow.color, blur: 26 + 22 * lit };
      const base = Object.assign({ type: 'char', y: Y, z: Z, h: C, zone: 'stage', sil: 1, alpha: a }, WHITE, { glow });
      return [
        Object.assign({}, base, { id: 'rossali_T', char: 'rossali', pose: 'letterT', x: slotX('rossali') }),
        Object.assign({}, base, { id: 'gumdong_i', char: 'gumdong', pose: 'guitar', x: slotX('gumdong') }),
        Object.assign({}, base, { id: 'lupa_T', char: 'lupa', pose: 'letterT', x: slotX('lupa') }),
      ];
    },
    light: lt => lt < OFF ? { house: .3, stage: 1, beams: 1, rim: .9 }
      : { house: .05, stage: .03, beams: 0, candles: 0, string: .08, neon: 0, neonOff: sm((lt - TB + .6) / .5),   /* луна гаснет перед кирпичом */ edge: .06, rim: 0, eyes: 0 },
  },
  fx: [{ t: OFF, type: 'black', dur: .08 }],
  overlay: [
    { type: 'tonightWord' },
    { type: 'note', text: '11 · «tonight» → белые силуэты → позы-буквы: TONiGHT' },
  ],
});
}
