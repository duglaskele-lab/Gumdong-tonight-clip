/* 02 · Со спины вокалистки: перед ней зал в огоньках свечей, титр с названием. */
scene({
  id: '02 title back', start: b(19), end: b(32), lyrics: 'none',
  layers: [
    { type: 'bg', style: 'bokeh', drift: -12 },
    { type: 'sprite', char: 'gumdong', pose: 'backGuitar', x: W * .52, y: H + 330, anchor: 'bottom', shade: .6, rim: { color: '#c040ff', amount: .55, depth: .3 },
      keys: [{ t: 0, h: 1500 }, { t: b(32) - b(19), h: 1640, e: 'linear' }] },
    { type: 'title', from: .4, text: 'CAN I SLEEP WITH YOU TONIGHT?', x: 90, y: H - 140, size: 52, type_cps: 26 },
  ],
  overlay: [{ type: 'note', text: '02 · со спины с гитарой, титр' }],
});
