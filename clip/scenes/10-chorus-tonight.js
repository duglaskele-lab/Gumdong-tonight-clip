/* 10 · Припев: вокалистка в полный рост, позади огромное TONIGHT, затем свет резко гаснет. */
{ // блок: константы сцены не видны другим файлам
const OFF10 = 65.8 - b(144);   // от начала сцены: блэкаут
scene({
  id: '10 chorus tonight', start: b(144), end: CLIP.duration, world: true, lyrics: 'caption', punch: .045,
  cam: { keys: [
    { t: 0, x: 0, y: 1.6, z: 7.4, pitch: 4 },
    { t: OFF10, x: 0, y: 1.7, z: 9.7, pitch: 5, e: 'linear' },
  ] },
  set: {
    ents: { gumdong: { pose: 'sing', animOffset: -b(144) } },   // анимация пения начинается с первого кадра сцены
    add: [{ id: 'tonight', type: 'text3d', text: 'TONIGHT', x: 0, y: 2.55, z: 17.25, size: 1.7, color: '#ffd9e6', glow: '#ff2a7a',
      alpha: lt => lt < OFF10 ? clamp(lt / .25, 0, 1) * .92 : 0 }],
    light: lt => lt < OFF10 ? { house: .3, stage: 1, beams: 1, rim: .9 }
      : { house: 0, stage: 0, beams: 0, candles: .15, string: 0, neon: 0, edge: 0, rim: 0 },
  },
  fx: [{ t: 0, type: 'flash', dur: .25, amount: .7 }, { t: OFF10, type: 'black', dur: .08 }, { t: OFF10, type: 'dark', amount: .8 }],
  overlay: [{ type: 'note', text: '10 · припев: Gumdong — анимация пения (S2), TONIGHT позади, блэкаут' }],
});
}
