/* 06 · Крупный план в 3/4, липсинк: «mom, can i sleep with you tonight?» */
scene({
  id: '06 closeup 3/4', start: b(80), end: b(93), lyrics: 'caption',
  layers: [
    { type: 'bg', style: 'spot', x: W * .62, y: H * .38, color: '#05040c', glow: 'rgba(70,40,200,.8)', glow2: 'rgba(200,30,90,.4)', pulse: .05 },
    { type: 'sprite', char: 'gumdong', pose: 'face34', x: W * .58, y: H + 30, anchor: 'bottom', mouth: true, anim: ['breath'],
      rim: { color: '#6a5cff', amount: .35, depth: .3 },
      keys: [{ t: 0, h: 960 }, { t: b(93) - b(80), h: 1040, e: 'linear' }] },
  ],
  overlay: [{ type: 'note', text: '06 · ЛИПСИНК в 3/4' }],
});
