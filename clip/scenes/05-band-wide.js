/* 05 · Общий план группы. */
scene({
  id: '05 band wide', start: b(71), end: b(80), world: true, lyrics: 'caption', bob: 7,
  cam: { keys: [
    { t: 0, x: .6, y: 1.65, z: 5.6, yaw: 0, pitch: 4 },                          // справа налево — для разнообразия: другие облёты идут слева направо
    { t: b(80) - b(71), x: -.2, y: 1.6, z: 6.7, yaw: -1, pitch: 4.5, e: 'linear' },
  ] },
  set: { light: { house: .3, stage: .85, beams: 1 } },
  overlay: [{ type: 'note', text: '05 · общий план (нужны позы с инструментами)' }],
});
