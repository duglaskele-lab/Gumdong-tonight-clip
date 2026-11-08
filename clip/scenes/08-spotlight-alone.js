/* 08 · Она одна в луче прожектора, зал погас. «can i sleep with you tonight?» — cowboy shot у микрофона,
   рот процедурный по голосу (пока нет 4 нарисованных ртов для этой позы). Голос вступает в 48.2. */
scene({
  id: '08 spotlight alone', start: b(112), end: b(127), world: true, lyrics: 'caption',
  cam: { keys: [
    // крупнее, чем раньше: верх кадра ниже кончика уха (его обрезал Seedance), низ — выше среза спрайта
    { t: 0, x: .05, y: 1.95, z: 12.45, pitch: 0 },
    { t: b(127) - b(112), x: .02, y: 1.95, z: 12.62, pitch: 0, e: 'linear' },
  ] },
  set: { hide: ['mic'], ents: { gumdong: { pose: 'micPlay' } },   // у микрофона играет (анимация, стойка в кадрах), рот по голосу
    light: { house: 0, stage: .06, candles: .12, beams: 0, string: .08, neon: .15, edge: .1, rim: .25, spot: 'gumdong', spotK: 1 } },
  post: { vignette: .8 },
  overlay: [{ type: 'note', text: '08 · луч, у микрофона, рот по голосу (процедурный)' }],
});
