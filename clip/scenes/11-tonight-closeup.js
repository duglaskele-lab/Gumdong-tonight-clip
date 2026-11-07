/* 11 · Кульминация: на «to-night» крупный план у микрофона — S3, голова поднимается к свету, рот широко открыт
   на протяжном «-niiight»; на 65.8 свет гаснет. Финал: Gumdong постепенно становится белым светящимся силуэтом,
   камера быстро отъезжает назад через пустой тёмный зал; силуэтами проступают Lupa и Rossali; уход в чёрное к 1:11. */
{ // блок: константы сцены не видны другим файлам
const OFF = 65.8 - b(150);          // от начала сцены: блэкаут
const SIL = .9;                     // за сколько секунд Gumdong становится белым силуэтом
const BACK0 = OFF + .8, BACK1 = OFF + 3.7;   // отъезд камеры
const SWAP = BACK0 + .3, SWD = .15;   // подмена силуэта по пояс на силуэт в полный рост — уже на ходу камеры
const sm = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const WHITE = { silColor: '#fdf8ff', glow: { color: 'rgba(255,240,255,.9)', blur: 26 } };
const AUDIENCE = ['maeve', 'g1', 'g2', 'g3', 'g4', 'g5', 'alex'];
scene({
  id: '11 tonight closeup', start: b(150), end: CLIP.duration, world: true, lyrics: 'caption',
  cam: { keys: [
    { t: 0, x: .04, y: 2.03, z: 11.95, pitch: 3 },
    { t: OFF, x: .02, y: 2.1, z: 12.3, pitch: 5.5, e: 'linear' },     // медленный наезд и чуть вверх — за поднимающейся головой
    { t: BACK0, x: .02, y: 2.08, z: 12.15, pitch: 5, e: 'out' },      // силуэт проявляется, камера почти стоит
    { t: BACK1, x: 0, y: 1.75, z: -2.2, pitch: 4, e: 'io3' },         // быстрый отъезд назад через пустой зал
    { t: CLIP.duration - b(150), x: 0, y: 1.72, z: -2.9, pitch: 4, e: 'linear' },
  ] },
  set: {
    hide: lt => lt < OFF ? ['mic'] : ['mic', ...AUDIENCE],   // стойка нарисована в S3; после блэкаута зал пустой
    ents: lt => {
      const o = { gumdong: { pose: 'micUp', animOffset: 46 / 24 - b(150) } };   // S3 с кадра 46; к блэкауту — кадр ~116
      if (lt >= OFF) {
        const s = sm((lt - OFF) / SIL);
        o.gumdong = Object.assign({}, o.gumdong, WHITE, { sil: s, alpha: 1 - sm((lt - SWAP) / SWD) });   // в белый, затем передаёт место силуэту в полный рост
        const a = sm((lt - OFF - .5) / 1.1) * .8;
        // замирают на кадре момента блэкаута (как Gumdong) — стоп-кадр: animSpeed 0, кадр = время блэкаута (+ их сдвиг цикла)
        o.lupa = Object.assign({ sil: 1, alpha: a, animSpeed: 0, animOffset: 65.8 }, WHITE);
        o.rossali = Object.assign({ sil: 1, alpha: a, animSpeed: 0, animOffset: 65.8 + 1.7 }, WHITE);
      }
      return o;
    },
    add: lt => {
      const items = [{ id: 'tonight', type: 'text3d', text: 'TONIGHT', x: 0, y: 2.55, z: 17.25, size: 1.7, color: '#ffd9e6', glow: '#ff2a7a', alpha: lt < OFF ? .92 : 0 }];
      // силуэт в полный рост (голова поднята, как в конце S3) — нужен, когда камера отъезжает и видны ноги
      // x/h подобраны так, чтобы голова совпала с головой в последнем кадре S3
      if (lt >= SWAP) items.push(Object.assign({ id: 'gumdong_full', type: 'char', char: 'gumdong', pose: 'singUp', x: .019, y: .7, z: 13.3, h: 1.58, zone: 'stage', sil: 1, alpha: sm((lt - SWAP) / SWD) }, WHITE));
      return items;
    },
    light: lt => lt < OFF ? { house: .3, stage: 1, beams: 1, rim: .9 }
      : { house: .07, stage: .04, beams: 0, candles: 0, string: .12, neon: .06, edge: .08, rim: 0, eyes: 0 },
  },
  fx: [{ t: OFF, type: 'black', dur: .08 }],
  overlay: [{ type: 'note', text: '11 · «tonight» (S3) → белый силуэт, отъезд через пустой зал' }],
});
}
