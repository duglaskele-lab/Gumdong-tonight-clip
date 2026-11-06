/* 08 · Она одна в луче прожектора, зал погас. Липсинк: «can i sleep with you tonight?» */
scene({
  id: '08 spotlight alone', start: b(112), end: b(127), world: true, lyrics: 'caption',
  cam: { keys: [
    { t: 0, x: .05, y: 2.0, z: 11.2, pitch: 3 },
    { t: b(127) - b(112), x: 0, y: 2.08, z: 11.75, pitch: 4, e: 'linear' },
  ] },
  set: { light: { house: 0, stage: .06, candles: .12, beams: 0, string: .08, neon: .15, edge: .1, rim: .25, spot: 'gumdong', spotK: 1 } },
  post: { vignette: .8 },
  overlay: [{ type: 'note', text: '08 · луч прожектора, пыль; ЛИПСИНК' }],
});
