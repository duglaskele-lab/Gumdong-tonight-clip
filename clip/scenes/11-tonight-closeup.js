/* 11 · Кульминация: на «to-night» крупный план у микрофона — S3, голова поднимается к свету, рот широко открыт
   на протяжном «-niiight»; на 65.8 свет резко гаснет, затемнение. */
{ // блок: константы сцены не видны другим файлам
const OFF11 = 65.8 - b(150);   // от начала сцены: блэкаут
scene({
  id: '11 tonight closeup', start: b(150), end: CLIP.duration, world: true, lyrics: 'caption',
  cam: { keys: [
    { t: 0, x: .04, y: 2.03, z: 11.95, pitch: 3 },
    { t: OFF11, x: .02, y: 2.1, z: 12.3, pitch: 5.5, e: 'linear' },   // медленный наезд и чуть вверх — за поднимающейся головой
  ] },
  set: {
    hide: ['mic'],   // стойка нарисована в S3
    ents: { gumdong: { pose: 'micUp', animOffset: 46 / 24 - b(150) } },   // S3 с кадра 46 (рот открыт, голова начинает подниматься); к блэкауту — кадр ~116, глаза закрыты
    add: [{ id: 'tonight', type: 'text3d', text: 'TONIGHT', x: 0, y: 2.55, z: 17.25, size: 1.7, color: '#ffd9e6', glow: '#ff2a7a',
      alpha: lt => lt < OFF11 ? .92 : 0 }],
    light: lt => lt < OFF11 ? { house: .3, stage: 1, beams: 1, rim: .9 }
      : { house: 0, stage: 0, beams: 0, candles: .15, string: 0, neon: 0, edge: 0, rim: 0 },
  },
  fx: [{ t: OFF11, type: 'black', dur: .08 }, { t: OFF11, type: 'dark', amount: .8 }],
  overlay: [{ type: 'note', text: '11 · крупный план «tonight» (S3), блэкаут' }],
});
}
