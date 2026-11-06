/* 10 · Припев: общий план, вокалистка играет (S1) и поёт — рот процедурный по голосу, позади огромное TONIGHT.
   На «to-» (62.9) — склейка на крупный план, сцена 11. */
{ // блок: константы сцены не видны другим файлам
const D10 = b(150) - b(144);
scene({
  id: '10 chorus tonight', start: b(144), end: b(150), world: true, lyrics: 'caption', bob: 12,
  cam: { keys: [
    { t: 0, x: 0, y: 1.6, z: 7.4, pitch: 4 },
    { t: D10, x: 0, y: 1.65, z: 8.5, pitch: 4.5, e: 'linear' },
  ] },
  set: {
    ents: { gumdong: { pose: 'playSing' } },   // цикл игры S1 + рот по голосу (камера далеко — процедурного рта достаточно)
    add: [{ id: 'tonight', type: 'text3d', text: 'TONIGHT', x: 0, y: 2.55, z: 17.25, size: 1.7, color: '#ffd9e6', glow: '#ff2a7a',
      alpha: lt => clamp(lt / .25, 0, 1) * .92 }],
    light: { house: .3, stage: 1, beams: 1, rim: .9 },
  },
  fx: [{ t: 0, type: 'flash', dur: .25, amount: .7 }],
  overlay: [{ type: 'note', text: '10 · припев: общий план, рот процедурный, TONIGHT позади' }],
});
}
