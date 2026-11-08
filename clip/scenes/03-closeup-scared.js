/* 03 · Крупный план, липсинк: «i'm really scared / mom, can i sleep with you tonight?»
   Gumdong стоит в 3D-клубе на своём месте (портрет по грудь, поза calmBust), камера близко, широкий объектив,
   и облетает её по дуге слева направо: в начале слева в кадре Rossali, Gumdong справа; в конце Gumdong слева,
   справа Lupa за установкой. Клуб размыт (глубина резкости), Gumdong резкая (S.sharp). */
{ // блок: константы сцены не видны другим файлам
const D3 = b(57) - b(32);
const G = { x: 0, y: .7 + 1.5, z: 13.3 };   // точка на лице Gumdong (вокруг неё облёт)
const R = .78, FOV = 62, A0 = 30, A1 = -12, OF0 = -13, OF1 = 17;   // радиус, объектив, угол облёта (справа → чуть левее центра), куда смотрит камера мимо неё (°)
function orbit(t, u) {   // u 0..1 — доля облёта
  const a = A0 + (A1 - A0) * u, r = a * Math.PI / 180;
  return { t, x: G.x + R * Math.sin(r), y: G.y - .05, z: G.z - R * Math.cos(r), yaw: -a + OF0 + (OF1 - OF0) * u, pitch: -1, fov: FOV };
}
scene({
  id: '03 closeup scared', start: b(32), end: b(57), lyrics: 'caption', world: true, worldBlur: 6, sharp: ['gumdong'],
  cam: { smooth: .6, keys: [0, .25, .5, .75, 1].map(u => orbit(u * D3, u)) },
  set: { hide: ['mic'], ents: { gumdong: { pose: 'calmBust', mouth: true, animSpeed: 1.25, animOffset: -b(32) * 1.25 } },   // ролик покачивания с 1-го кадра, на 25 % быстрее
    light: { house: .2, stage: .9, beams: 1, rim: .8 } },
  fx: [{ t: 0, type: 'flash', dur: .3, amount: .55, color: '#ff8aa0' }],
  overlay: [{ type: 'note', text: '03 · ЛИПСИНК: 4 нарисованных рта; облёт: Rossali → Gumdong → Lupa' }],
});
}
