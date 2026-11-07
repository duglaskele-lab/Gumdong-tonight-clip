/* 03 · Крупный план, липсинк: «i'm really scared / mom, can i sleep with you tonight?» */
scene({
  id: '03 closeup scared', start: b(32), end: b(57), lyrics: 'caption',
  layers: [
    { type: 'bg', style: 'spot', x: W * .5, y: H * .4, pulse: .06 },
    { type: 'sprite', char: 'gumdong', pose: 'calm', x: W / 2, y: H + 300, anchor: 'bottom', mouth: true, anim: ['breath'],
      keys: [{ t: 0, h: 1300 }, { t: b(57) - b(32), h: 1420, e: 'linear' }] },
  ],
  fx: [{ t: 0, type: 'flash', dur: .3, amount: .55, color: '#ff8aa0' }],
  overlay: [{ type: 'note', text: '03 · ЛИПСИНК: 4 нарисованных рта по голосу' }],
});
