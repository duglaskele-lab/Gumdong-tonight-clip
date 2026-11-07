/* 04 · Вид от сцены на зал: зрители неподвижны, на «nightmare» у теней загораются глаза. */
{ // блок: константы сцены не видны другим файлам
const eyesAt = [1.0, 3.3];   // от начала сцены: оба «nightmare»
scene({
  id: '04 tables nightmare', start: b(57), end: b(71), world: true, lyrics: 'caption',
  cam: { keys: [
    { t: 0, x: -4.6, y: 1.25, z: 11.5, yaw: 196, pitch: -2 },
    { t: b(71) - b(57), x: 4.2, y: 1.3, z: 11.3, yaw: 166, pitch: -2, e: 'linear' },
  ] },
  set: { light: lt => ({ house: .42, stage: .5, candles: 1, beams: .3,
    eyes: Math.max(...eyesAt.map(t => lt < t ? 0 : clamp(1 - (lt - t) / 1.1, 0, 1))) }) },
  overlay: [{ type: 'note', text: '04 · зал: тени = места для уникальных зрителей' }],
});
}
