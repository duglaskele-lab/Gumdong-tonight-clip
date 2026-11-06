/* clip/config.js — общие настройки клипа: темп, ассеты, персонажи, текст, декорации клуба.
   Сцены лежат в clip/scenes/NN-name.js и подключаются списком CLIP.scenes (порядок не важен — сортируются по start). */
'use strict';
const CLIP = {
  title: 'Can I Sleep with You Tonight?',
  audio: 'assets/audio/song.mp3',
  bpm: 143.555, beatOffset: 0.186,          // доля ≈ 0.418 с
  duration: 67.5, fadeOut: 66.0,
  fonts: ['80px "Dela Gothic One"', '40px VT323', '900 40px Nunito', '700 20px "JetBrains Mono"'],
  // глобальный пост; сцена может переопределить полем post
  post: { pixel: 3, levels: 0, grain: .10, vignette: .55, scan: .06 },
  scenes: [
    '01-intro-flythrough',
    '02-title-back',
    '03-closeup-scared',
    '04-tables-nightmare',
    '05-band-wide',
    '06-closeup-34',
    '07-again-cuts',
    '08-spotlight-alone',
    '09-instrumental',
    '10-chorus-tonight',
  ],
};
const b = k => CLIP.beatOffset + k * 60 / CLIP.bpm;   // время доли № k

const ASSETS = {
  gumdong_guitar: 'assets/sprites/gumdong_guitar.png',
  gumdong_front: 'assets/sprites/gumdong_front.png', gumdong_side: 'assets/sprites/gumdong_side.png', gumdong_back: 'assets/sprites/gumdong_back.png',
  gumdong_face: 'assets/sprites/gumdong_face.png', gumdong_face34: 'assets/sprites/gumdong_face34.png',
  rossali_bass: 'assets/sprites/rossali_bass.png', rossali_front: 'assets/sprites/rossali_front.png', rossali_side: 'assets/sprites/rossali_side.png',
  lupa_front: 'assets/sprites/lupa_front.png', lupa_34: 'assets/sprites/lupa_34.png', lupa_face: 'assets/sprites/lupa_face.png',
  maeve_front: 'assets/sprites/maeve_front.png', alex_front: 'assets/sprites/alex_front.png',
};

// Персонажи: позы → ассет. mouth — где рот (доли картинки) для липсинка; inst — куда вешать гитару-заглушку.
// Имена: Gumdong — вокал и гитара (играет левой рукой — спрайты не отзеркаливать), Rossali — бас, Lupa — ударные.
// Базовые позы для общих и средних планов — с инструментом (guitar / bass); с них же генерировать новые позы и ролики Seedance.
const CHARACTERS = {
  gumdong: { name: 'Gumdong — вокал, гитара', height: 1.68, fallback: 'guitar', poses: {
    guitar: { key: 'gumdong_guitar', mouth: { x: .538, y: .189, w: .04 } },
    front: { key: 'gumdong_front', mouth: { x: .447, y: .191, w: .046 }, inst: { x: .5, y: .58 } },   // с листа, без гитары
    side: 'gumdong_side', back: 'gumdong_back',
    face: { key: 'gumdong_face', mouth: { x: .548, y: .724, w: .095 } },
    face34: { key: 'gumdong_face34', mouth: { x: .182, y: .773, w: .1 } },
  } },
  rossali: { name: 'Rossali — бас', height: 1.74, fallback: 'bass', poses: { bass: 'rossali_bass', front: { key: 'rossali_front', inst: { x: .5, y: .56 } }, side: 'rossali_side' } },
  lupa: { name: 'Lupa — ударные', height: 1.6, fallback: 'front', poses: { front: 'lupa_front', q34: 'lupa_34', face: 'lupa_face' } },
  maeve: { name: 'Maeve (зритель)', height: 1.88, fallback: 'front', poses: { front: 'maeve_front' } },
  alex: { name: 'Alex (танцует у сцены)', height: 1.75, fallback: 'front', poses: { front: 'alex_front' } },
};

// Текст песни для подписей. t/end — секунды. Уточняется инструментом Sync lyrics (клавиша L) в плеере.
const LYRICS = [
  { t: 13.84, end: 15.40, text: "i'm really scared" },
  { t: 15.60, end: 22.50, text: '"mom, can i sleep with you tonight?"' },
  { t: 24.16, end: 29.20, text: "it's not a nightmare, i'm dreaming, it's a nightmare i live in" },
  { t: 29.98, end: 32.60, text: "i'm really scared" },
  { t: 33.66, end: 38.90, text: '"mom, can i sleep with you tonight?"' },
  { t: 39.10, end: 46.60, text: 'again, again, again, again, again…' },
  { t: 47.00, end: 52.00, text: '"can i sleep with you tonight?"' },
  { t: 60.60, end: 65.80, text: '"can i sleep with you tonight?"' },
];

// Декорации клуба (мир в метрах). Сцена может спрятать (set.hide), переопределить (set.ents) или добавить (set.add) объекты.
const SET = {
  light: { house: .35, stage: .55, candles: .9, beams: .8, string: .8, neon: .8, edge: .6, rim: .5, rimColor: '#ff2a55', spot: null, eyes: 0, play: 1 },
  beams: [
    { from: [-3.2, 4.3, 13.2], to: [-2.5, .7, 14.2], r: .9, color: '#ff2050' },
    { from: [3.4, 4.3, 13.2], to: [2.4, .7, 15.6], r: .9, color: '#a040ff' },
    { from: [0, 4.3, 16.8], to: [0, .7, 13.3], r: .8, color: '#ff4a8a', k: .8 },
  ],
  ents: [
    // сцена
    { id: 'amp_l', type: 'amp', x: -4.1, z: 16.4 }, { id: 'amp_r', type: 'amp', x: 4.0, z: 16.2, w: 1.0, h: 1.3 },
    { id: 'kit', type: 'drums', x: 2.4, z: 15.3 },
    { id: 'lupa', type: 'char', char: 'lupa', pose: 'front', x: 2.4, y: .7, z: 15.75, seat: .62, seatY: .58, zone: 'stage', anim: ['headbang'] },
    { id: 'rossali', type: 'char', char: 'rossali', pose: 'bass', x: -2.5, y: .7, z: 14.2, zone: 'stage', anim: [['bob', 1], ['sway', .5]], phase: .2 },
    { id: 'mic', type: 'mic', x: .09, z: 12.95, h: 1.2 },
    { id: 'gumdong', type: 'char', char: 'gumdong', pose: 'guitar', x: 0, y: .7, z: 13.3, zone: 'stage', mouth: true, anim: ['breath', ['bob', .6]] },
    // зал: столики и зрители (тени — заглушки до листов зрителей)
    { id: 't1', type: 'table', x: -3.6, z: 9.4 }, { id: 'maeve', type: 'char', char: 'maeve', pose: 'front', x: -3.5, z: 9.85, seat: .5, seatY: .42, zone: 'house', eyeY: .92 },
    { id: 't2', type: 'table', x: 2.9, z: 9.0 }, { id: 'g1', type: 'ghost', x: 2.6, z: 9.45, color: '#4a3040' }, { id: 'g2', type: 'ghost', x: 3.35, z: 9.5, color: '#2d3a4a', ears: 1.3, snout: true },
    { id: 't3', type: 'table', x: -1.2, z: 7.0, r: .4 }, { id: 'g3', type: 'ghost', x: -1.0, z: 7.4, color: '#3d4030', ears: .7 },
    { id: 't4', type: 'table', x: 4.6, z: 5.6 }, { id: 'g4', type: 'ghost', x: 4.7, z: 6.05, color: '#40303a', snout: true },
    { id: 't5', type: 'table', x: -4.4, z: 4.8 }, { id: 'g5', type: 'ghost', x: -4.6, z: 5.25, color: '#30343e', ears: 1.2 },
    { id: 't6', type: 'table', x: 1.6, z: 3.2, r: .4 },
    // Alex танцует у сцены
    { id: 'alex', type: 'char', char: 'alex', pose: 'front', x: 5.7, y: 0, z: 11.2, zone: 'house', glow: .25, anim: ['dance'] },
  ],
};
