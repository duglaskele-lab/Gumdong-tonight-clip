/* 01 · Пролёт через зал. Камера от входа между столиками к сцене; группа в контровом свете. */
scene({
  id: '01 intro flythrough', start: 0, end: b(19), world: true, lyrics: 'none',
  cam: { keys: [
    { t: 0, x: .7, y: 1.6, z: -3.2, yaw: -3, pitch: 1.5 },
    { t: b(19), x: .25, y: 1.45, z: 8.0, yaw: 0, pitch: 4, e: 'io' },
  ] },
  set: { hide: ['alex'], light: { house: .28, stage: .18, beams: 1, rim: 1, candles: 1 } },
  fx: [{ t: 0, type: 'fadeIn', dur: 2.2 }],
  overlay: [{ type: 'note', text: '01 · пролёт через зал к сцене (3D-камера по слоям)' }],
});
