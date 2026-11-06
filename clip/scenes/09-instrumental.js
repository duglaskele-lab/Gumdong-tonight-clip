/* 09 · Проигрыш: камера кружит, группа играет, нарастают помехи. */
{ // блок: константы сцены не видны другим файлам
const D9 = () => b(144) - b(127);
scene({
  id: '09 instrumental', start: b(127), end: b(144), world: true, lyrics: 'none', bob: 8,
  cam: { smooth: .6, keys: [   // одна плавная дуга облёта, без остановки в середине
    { t: 0, x: -3.6, y: 1.5, z: 8.4, yaw: 17, pitch: 3, roll: -3 },
    { t: 3.55, x: 0, y: 1.25, z: 9.6, yaw: 0, pitch: 6, roll: 2 },
    { t: b(144) - b(127), x: 3.6, y: 1.7, z: 9.0, yaw: -18, pitch: 3, roll: -2 },
  ] },
  set: { light: { house: .2, stage: .9, beams: 1, rim: .8 } },
  post: { glitch: lt => clamp((lt - 3.8) / 3.3, 0, 1) * .75, chroma: lt => lt > 3.8 ? 3 + (lt - 3.8) * 2 : 0, vhs: 1 },
  overlay: [{ type: 'note', text: '09 · проигрыш: Gumdong — цикл игры (S1)' }],
});
}
