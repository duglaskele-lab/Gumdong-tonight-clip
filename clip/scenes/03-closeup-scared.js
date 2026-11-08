/* 03 · Крупный план, липсинк: «i'm really scared / mom, can i sleep with you tonight?»
   Фон — настоящий клуб за её спиной (занавес, гирлянда, Rossali и Lupa), размыт как глубина резкости;
   камера медленно смещается вбок — фон плывёт (параллакс). Сама Gumdong — 2D-слой поверх. */
scene({
  id: '03 closeup scared', start: b(32), end: b(57), lyrics: 'caption', world: true, worldBlur: 7,
  cam: { keys: [{ t: 0, x: -.35, y: 2.0, z: 11.2, pitch: 2 }, { t: b(57) - b(32), x: .35, y: 2.0, z: 11.2, pitch: 2, e: 'linear' }] },
  set: { hide: ['gumdong', 'mic'], light: { house: .2, stage: .9, beams: 1, rim: .8 } },
  layers: [
    { type: 'sprite', char: 'gumdong', pose: 'calm', x: W / 2, y: H + 300, anchor: 'bottom', mouth: true, anim: ['breath'],
      keys: [{ t: 0, h: 1300 }, { t: b(57) - b(32), h: 1420, e: 'linear' }] },
  ],
  fx: [{ t: 0, type: 'flash', dur: .3, amount: .55, color: '#ff8aa0' }],
  overlay: [{ type: 'note', text: '03 · ЛИПСИНК: 4 нарисованных рта по голосу' }],
});
