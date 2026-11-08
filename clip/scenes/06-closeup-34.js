/* 06 · Крупный план в 3/4, липсинк: «mom, can i sleep with you tonight?»
   Gumdong стоит в 3D-клубе на своём месте (портрет 3/4 по грудь, поза q34Bust), камера неподвижна, близко,
   сбоку-спереди (со стороны, куда она смотрит); за ней — размытая часть сцены: занавес, Rossali. Gumdong резкая. */
{ // блок: константы сцены не видны другим файлам
const G = { x: 0, y: .7 + 1.5, z: 13.3 };   // лицо Gumdong
const R = .64, A = 22, OF = -9;              // расстояние, угол камеры от фронта (°, + — справа от неё), смещение взгляда (она правее центра)
const r = A * Math.PI / 180;
const CAM6 = { x: G.x + R * Math.sin(r), y: G.y - .2, z: G.z - R * Math.cos(r), yaw: -A + OF, pitch: 7, fov: 60 };
scene({
  id: '06 closeup 3/4', start: b(80), end: b(93), lyrics: 'caption', world: true, worldBlur: 6, sharp: ['gumdong'],
  cam: { keys: [Object.assign({ t: 0 }, CAM6), Object.assign({ t: b(93) - b(80) }, CAM6)] },   // статичная камера
  set: { hide: ['mic'], ents: { gumdong: { pose: 'q34Bust', mouth: true, anim: [['breath', 1.5], ['sway', .175]] } },   // не статична: дыхание (сжатие-растяжение) и лёгкое покачивание
    light: { house: .2, stage: .9, beams: 1, rim: .8 } },
  overlay: [{ type: 'note', text: '06 · 3/4, липсинк: 4 нарисованных рта; фон — размытая сцена' }],
});
}
