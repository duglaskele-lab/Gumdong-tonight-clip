/* 07 · again ×10: на каждое «again» — склейка на другого персонажа, слово AGAIN растёт ступенями. */
{ // блок: константы сцены не видны другим файлам
const AG0 = 39.15 - b(93), AGD = .72;   // первое «again» от начала сцены и шаг
const agT = i => AG0 + i * AGD;
const shots = [
  { char: 'gumdong', pose: 'scared', h: 980, x: W * .5, mouth: true },
  { char: 'rossali', pose: 'bass', crop: [0, 0, 1, .42], h: 1000, x: W * .36 },
  { char: 'lupa', pose: 'face', h: 900, x: W * .7 },
  { char: 'maeve', pose: 'front', crop: [0, 0, 1, .36], h: 1000, x: W * .32 },
  { char: 'alex', pose: 'front', crop: [0, 0, 1, .34], h: 1000, x: W * .68 },
  { char: 'gumdong', pose: 'scared', h: 1040, x: W * .5, mouth: true },   // поёт «again» — в середине сцены
  { char: 'rossali', pose: 'bass', crop: [0, 0, 1, .42], h: 1000, x: W * .64 },
  { char: 'lupa', pose: 'face', h: 900, x: W * .3, flip: true },
  { char: 'maeve', pose: 'front', crop: [0, 0, 1, .36], h: 1000, x: W * .68, flip: true },
  { char: 'gumdong', pose: 'eyes', anchor: 'center', h: W * 505 / 1280, x: W / 2, y: H / 2, bg: '#000' },   // финал сцены: глаза крупно, чёрные поля
];
const BGS = ['#8a0014', '#1d1a22'];
scene({
  id: '07 again cuts', start: b(93), end: b(112), lyrics: 'caption',
  layers: [
    { type: 'cuts', items: [{ t: 0, bg: '#000' }].concat(shots.map((s, i) => ({ t: agT(i), bg: s.bg || BGS[i % 2] }))) },
    { type: 'stepword', words: shots.map((s, i) => ({ t: agT(i), text: 'AGAIN' })), steps: [1, 1.22, 1.5], stepDur: AGD / 3, fit: .9, jitter: 14, color: '#f6efe4', y: H * .46 },
    { type: 'cutsFront', push: .12, items: [{ t: 0, char: 'gumdong', pose: 'scared', h: 900, x: W / 2, shade: .5 }].concat(shots.map((s, i) => Object.assign({ t: agT(i) }, s))) },
  ],
  overlay: [{ type: 'note', text: '07 · AGAIN: склейка на каждое слово' }],
});
}
