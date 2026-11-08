/* clip/config.js — общие настройки клипа: темп, ассеты, персонажи, текст, декорации клуба.
   Сцены лежат в clip/scenes/NN-name.js и подключаются списком CLIP.scenes (порядок не важен — сортируются по start). */
'use strict';
const CLIP = {
  title: 'Can I Sleep with You Tonight?',
  ver: 23,   // поднимать, когда картинку заменили под тем же именем (сбрасывает кеш браузера)
  audio: 'assets/audio/song_clip.mp3',   // первые 1:15 песни (быстрее грузится); полная — assets/audio/song.mp3
  bpm: 143.555, beatOffset: 0.186,          // доля ≈ 0.418 с
  duration: 71.0, fadeOut: 70.2,          // fadeOut — картинка уходит в чёрное к концу
  audioFade: [65.8, 71.0],                 // звук быстро затухает от блэкаута 1:05.8 до 1:11 («-night» звучит в полную силу)
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
    '11-tonight-closeup',
  ],
};
const b = k => CLIP.beatOffset + k * 60 / CLIP.bpm;   // время доли № k

// Анимации (кадры Seedance, вырезаны tools/whitecut.py): assets/anim/<имя>/fNNN.webp
// gumdong_play1 — спокойная игра на гитаре, 119 кадров, 24 fps, цикл. В позе: {anim: 'gumdong_play1'}
// gumdong_sing1 — поёт с поднятой головой и играет (S2), 119 кадров, 24 fps, цикл
const ANIM_FILES = {
  gumdong_play1: { dir: 'assets/anim/gumdong_play1', frames: 119, fps: 24, loop: true },
  gumdong_sing1: { dir: 'assets/anim/gumdong_sing1', frames: 119, fps: 24, loop: true },
  // gumdong_mic_up — у микрофона поднимает голову к свету (S3), 121 кадр, без цикла (держит последний кадр);
  // кадры в той же рамке, что спрайт gumdong_mic → переход со статики незаметен
  gumdong_mic_up: { dir: 'assets/anim/gumdong_mic_up', frames: 121, fps: 24, loop: false },
  // lupa_play1 — Lupa играет на барабанах (L2), кадры в рамке спрайта lupa_kit, уменьшены до 0.6; цикл
  // gumdong_back1 — со спины покачивается с гитарой (руки на месте), 121 кадр, без цикла; сцена 02
  gumdong_back1: { dir: 'assets/anim/gumdong_back1', frames: 121, fps: 24, loop: false },
  // gumdong_mic_play — у микрофона играет на гитаре (Seedance), кадры в рамке спрайта gumdong_mic (×0.75); верх уха обрезан Seedance — держать за кадром
  // gumdong_calm_sway — портрет, покачивает головой (Seedance), сцена 03; с начала, потом бесшовная петля кадров 44…91 (одно покачивание, 2 с)
  // freija_dance — FreijaFoxy танцует, руки на бёдрах (Seedance); конец ≈ начало — обычный цикл; в клубе замедлен вдвое (animSpeed у объекта)
  freija_dance: { dir: 'assets/anim/freija_dance', frames: 121, fps: 24, loop: true },
  gumdong_calm_sway: { dir: 'assets/anim/gumdong_calm_sway', frames: 121, fps: 24, loop: [44, 92] },
  gumdong_mic_play: { dir: 'assets/anim/gumdong_mic_play', frames: 121, fps: 24, loop: 'pingpong' },   // рот Seedance стёрт в кадрах (рот — кодом по ANIM_TRACK)
  lupa_play1: { dir: 'assets/anim/lupa_play1', frames: 121, fps: 24, loop: true },
  // rossali_play1 — Rossali играет на басе (R2), уменьшены до 0.75; цикл
  rossali_play1: { dir: 'assets/anim/rossali_play1', frames: 121, fps: 24, loop: true },
};

const ASSETS = {
  gumdong_guitar: 'assets/sprites/gumdong_guitar.png',
  gumdong_front: 'assets/sprites/gumdong_front.png', gumdong_side: 'assets/sprites/gumdong_side.png', gumdong_back: 'assets/sprites/gumdong_back.png',
  gumdong_face: 'assets/sprites/gumdong_face.png', gumdong_face34: 'assets/sprites/gumdong_face34.png',
  // портреты высокого разрешения с 4 ртами (закрыт / приоткрыт / А / О); картинки совпадают везде, кроме рта
  gumdong_scared_closed: 'assets/sprites/gumdong_scared_closed.png', gumdong_scared_half: 'assets/sprites/gumdong_scared_half.png',
  gumdong_scared_wide: 'assets/sprites/gumdong_scared_wide.png', gumdong_scared_o: 'assets/sprites/gumdong_scared_o.png',
  gumdong_calm_closed: 'assets/sprites/gumdong_calm_closed.png', gumdong_calm_half: 'assets/sprites/gumdong_calm_half.png',
  gumdong_calm_wide: 'assets/sprites/gumdong_calm_wide.png', gumdong_calm_o: 'assets/sprites/gumdong_calm_o.png',
  // сцена 03: портрет в рамке ролика покачивания (поля 50/30 px) и вырезанные рты для наложения на кадры ролика
  gumdong_calm_pad: 'assets/sprites/gumdong_calm_pad.png', gumdong_calm_mp_closed: 'assets/sprites/gumdong_calm_mp_closed.png',
  gumdong_calm_mp_half: 'assets/sprites/gumdong_calm_mp_half.png', gumdong_calm_mp_wide: 'assets/sprites/gumdong_calm_mp_wide.png', gumdong_calm_mp_o: 'assets/sprites/gumdong_calm_mp_o.png',
  gumdong_34_closed: 'assets/sprites/gumdong_34_closed.png', gumdong_34_half: 'assets/sprites/gumdong_34_half.png',
  gumdong_34_wide: 'assets/sprites/gumdong_34_wide.png', gumdong_34_o: 'assets/sprites/gumdong_34_o.png',
  gumdong_mic: 'assets/sprites/gumdong_mic.png', gumdong_sing_up: 'assets/sprites/gumdong_sing_up.png',
  gumdong_back_guitar: 'assets/sprites/gumdong_back_guitar.png', gumdong_eyes: 'assets/sprites/gumdong_eyes.png',
  rossali_bass: 'assets/sprites/rossali_bass.png', rossali_front: 'assets/sprites/rossali_front.png', rossali_side: 'assets/sprites/rossali_side.png',
  rossali_wide: 'assets/sprites/rossali_wide.png', rossali_think: 'assets/sprites/rossali_think.png', rossali_laugh: 'assets/sprites/rossali_laugh.png',
  lupa_t: 'assets/sprites/lupa_t.png', rossali_t: 'assets/sprites/rossali_t.png',   // финал: силуэты-буквы T
  lupa_kit: 'assets/sprites/lupa_kit.png', lupa_portrait: 'assets/sprites/lupa_portrait.png', rossali_portrait: 'assets/sprites/rossali_portrait.png',
  lupa_front: 'assets/sprites/lupa_front.png', lupa_34: 'assets/sprites/lupa_34.png', lupa_face: 'assets/sprites/lupa_face.png',
  alex_v: 'assets/sprites/alex_v.png', alex_side: 'assets/sprites/alex_side.png',
  lupa_stick: 'assets/sprites/lupa_stick.png', maeve_chin: 'assets/sprites/maeve_chin.png',
  raithwyn_front: 'assets/sprites/raithwyn_front.png', raithwyn_back: 'assets/sprites/raithwyn_back.png',
  freija_front: 'assets/sprites/freija_front.png', freija_front_pad: 'assets/sprites/freija_front_pad.png', freija_back: 'assets/sprites/freija_back.png',   // FreijaFoxy (src-sheets/freija_*_src.png)
  couple_front: 'assets/sprites/couple_front.png', couple_back: 'assets/sprites/couple_back.png',   // пара: кролик и конь (src-sheets/couple_*_src.png; вид сзади отзеркален — конь слева, как и должно быть со спины)
  chillet: 'assets/sprites/chillet.png',
  maeve_sit: 'assets/sprites/maeve_sit.png', maeve_sit_back: 'assets/sprites/maeve_sit_back.png', chair: 'assets/sprites/chair.png',   // стул-образец — для всех зрителей один
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
    // портреты: mouths — нарисованные рты [закрыт, приоткрыт, А, О]; при mouth: true движок выбирает по голосу
    scared: { key: 'gumdong_scared_closed', mouth: { x: .499, y: .446, w: .106 },
      mouths: ['gumdong_scared_closed', 'gumdong_scared_half', 'gumdong_scared_wide', 'gumdong_scared_o'] },
    // спокойный портрет анфас (её обычное усталое выражение) с 4 ртами — сцена 03
    // calmBust — тот же портрет в 3D-клубе: картинка = верхние 43 % роста (уши → грудь), сцена 03
    // ролик Seedance с покачиванием головы; рамка шире спрайта (поля) → scale/part пересчитаны, чтобы размер не изменился;
    // рот Seedance стёрт в кадрах, нарисованные рты накладываются по дорожке головы (mouthPatch)
    calmBust: { key: 'gumdong_calm_pad', part: .4355, scale: 1.0097, anim: 'gumdong_calm_sway',
      mouthPatch: { keys: ['gumdong_calm_mp_closed', 'gumdong_calm_mp_half', 'gumdong_calm_mp_wide', 'gumdong_calm_mp_o'], w: 140 / 1095, h: 152 / 1356, at: [545 / 1095, 666 / 1356, 0] } },
    calm: { key: 'gumdong_calm_closed', mouth: { x: .4975, y: .48, w: .06 },
      mouths: ['gumdong_calm_closed', 'gumdong_calm_half', 'gumdong_calm_wide', 'gumdong_calm_o'] },
    // q34Bust — тот же портрет 3/4 в 3D-клубе: картинка = верхние 44 % роста (уши → грудь), сцена 06
    q34Bust: { key: 'gumdong_34_half', part: .44, mouth: { x: .364, y: .46, w: .08 },
      mouths: ['gumdong_34_closed', 'gumdong_34_half', 'gumdong_34_wide', 'gumdong_34_o'] },
    q34: { key: 'gumdong_34_half', mouth: { x: .364, y: .46, w: .08 },
      mouths: ['gumdong_34_closed', 'gumdong_34_half', 'gumdong_34_wide', 'gumdong_34_o'] },
    play: { key: 'gumdong_guitar', anim: 'gumdong_play1' },   // анимация: играет на гитаре (Seedance S1, цикл 5 с)
    // то же + процедурный рот по голосу (положение рта по кадрам — assets/data/anim_track.js); для общих планов
    playSing: { key: 'gumdong_guitar', anim: 'gumdong_play1', mouth: { x: .523, y: .192, w: .045, lip: '#c9a07c' } },
    sing: { key: 'gumdong_sing_up', anim: 'gumdong_sing1' },  // анимация: поёт и играет, голова вверх (S2)
    // по пояс у микрофона (cowboy shot); part — доля роста сверху. Рот нарисован открытым → cover закрашивает его,
    // движок рисует свой рот по голосу (процедурно, пока нет 4 нарисованных ртов)
    mic: { key: 'gumdong_mic', part: .6, mouth: { x: .5425, y: .262, w: .036, lip: '#cda98c', cover: { rx: .78, ry: .82 } } },
    // то же + анимация игры; рот закрашивается и рисуется по голосу, положение — по кадрам (anim_track.js)
    micPlay: { key: 'gumdong_mic', part: .6, anim: 'gumdong_mic_play', mouth: { x: .543, y: .247, w: .032, lip: '#cda98c', line: true, clipOut: { x: .4784, y: .2681, rx: .0366, ry: .0272 } } },
    micUp: { key: 'gumdong_mic', part: .6, anim: 'gumdong_mic_up' },  // анимация S3: у микрофона поднимает голову к свету
    singUp: 'gumdong_sing_up',          // в полный рост, голова вверх, глаза закрыты, поёт
    backGuitar: 'gumdong_back_guitar',
    backPlay: { key: 'gumdong_back_guitar', anim: 'gumdong_back1' },   // анимация: со спины покачивается в такт  // со спины с гитарой (отзеркалена: гриф в правой руке — она левша)
    eyes: 'gumdong_eyes',               // глаза крупно — прямоугольный кадр, не вырезан
  } },
  rossali: { name: 'Rossali — бас', height: 1.74, fallback: 'bass', poses: { bass: 'rossali_bass', portrait: 'rossali_portrait',
    wide: 'rossali_wide', laugh: 'rossali_laugh', think: 'rossali_think', letterT: 'rossali_t',   // крупные планы сцены 07: с басом (сигарета) / смеётся / задумалась
    play: { key: 'rossali_bass', anim: 'rossali_play1' },   // portrait — по грудь, с сигаретой (только крупные планы)
     front: { key: 'rossali_front', inst: { x: .5, y: .56 } }, side: 'rossali_side' } },
  lupa: { name: 'Lupa — ударные', height: 1.6, fallback: 'front', poses: { front: 'lupa_front', q34: 'lupa_34', face: 'lupa_face', portrait: 'lupa_portrait', stick: 'lupa_stick', letterT: 'lupa_t',
    kit: { key: 'lupa_kit', scale: .903, anim: 'lupa_play1' } } },   // scale: картинка выросла сверху под поднятые палочки   // kit — за своей установкой (установка в картинке; рост картинки ≈ 1.37 м по бочке 22")
  maeve: { name: 'Maeve (зритель)', height: 1.88, fallback: 'front', poses: { front: 'maeve_front', chin: 'maeve_chin',
    // сидит на стуле-образце, лицом к сцене; рост картинки ≈ 1.2 м; back — вид сзади (камера за спиной: сцены 01, 05),
    // отзеркален (хвост с той же стороны, что спереди), backScale — стул на картинке сзади нарисован на 8 % мельче
    sit: { key: 'maeve_sit', scale: 1.2 / 1.88, back: 'maeve_sit_back', backScale: 1.084 } } },
  chillet: { name: 'Chillet (маленький зверёк, спит перед столиком t3)', height: .45, fallback: 'sleep', poses: { sleep: 'chillet' } },   // только вид спереди: со входа его закрывает стол
  raithwyn: { name: 'Raithwyn (зритель, стоит у столика Alex)', height: 1.6, fallback: 'stand', poses: {
    stand: { key: 'raithwyn_front', back: 'raithwyn_back' } } },
  freija: { name: 'FreijaFoxy (зритель, танцует у столика Maeve t1, руки на бёдрах; миниатюрная)', height: 1.2, fallback: 'stand', poses: {
    stand: { key: 'freija_front', back: 'freija_back' },   // рост картинки — до кончика рога (было 1.72, уменьшена на 30 % — она миниатюрная)
    // танец (Seedance, руки на бёдрах): кадры в рамке спрайта с полями 140/2 px (хвост машет шире) → scale; вид сзади статичный
    dance: { key: 'freija_front_pad', anim: 'freija_dance', scale: 1253 / 1243, back: 'freija_back', backScale: 1243 / 1253 } } },
  couple: { name: 'Пара (зрители, стоят у столика t4): девушка-кролик и конь обнимает её за талию', height: 1.95, fallback: 'stand', poses: {
    stand: { key: 'couple_front', back: 'couple_back' } } },   // рост картинки = конь до кончиков ушей   // стоит лицом к сцене; вид сзади — когда камера за спиной
  alex: { name: 'Alex (зритель за столиком)', height: 1.75, fallback: 'front', poses: { front: 'alex_front', v: 'alex_v',   // v — крупный план со знаком V
    // сидит на стуле-образце лицом к сцене; есть только вид сбоку (вид спереди/сзади — когда будут картинки);
    // рост картинки ≈ 1.07 м — по стулу (0.845 м = 923 px)
    sit: { key: 'alex_side', side: 'alex_side', frontMissing: true, scale: 1.07 / 1.75 } } },
};

// Текст песни для подписей. t/end — секунды. Уточняется инструментом Sync lyrics (клавиша L) в плеере.
const LYRICS = [
  { t: 13.84, end: 16.30, text: "i'm really scared" },   // «scared» тянется до 16.3
  { t: 16.60, end: 22.50, text: 'mom, can i sleep with you tonight?' },   // «mom» — 16.65, после паузы
  { t: 24.16, end: 29.20, text: "it's not a nightmare, i'm dreaming, it's a nightmare i live in" },
  { t: 29.98, end: 32.60, text: "i'm really scared" },
  { t: 33.66, end: 38.90, text: 'mom, can i sleep with you tonight?' },
  { t: 39.10, end: 46.60, text: 'again, again, again, again, again…' },
  { t: 48.20, end: 52.00, text: 'can i sleep with you tonight?' },   // голос вступает в 48.2 (до этого тишина)
  { t: 61.10, end: 65.80, text: 'can i sleep with you tonight?' },   // первый громкий слог — 61.17 (до этого вдох/подголоски)
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
    // установка кодом ({ type: 'drums' }) больше не нужна: она нарисована в спрайте lupa_kit
    { id: 'lupa', type: 'char', char: 'lupa', pose: 'kit', x: 2.4, y: .7, z: 15.35, zone: 'stage' },   // Lupa вместе с установкой (картинка); установка кодом — kit, спрятана
    { id: 'rossali', type: 'char', char: 'rossali', pose: 'play', x: -2.5, y: .7, z: 14.2, zone: 'stage', animOffset: 1.7 },   // R2; сдвиг цикла, чтобы не совпадал с Lupa
    { id: 'mic', type: 'mic', x: -.2, boom: .12, z: 12.95, h: 1.27 },   // стойка слева от неё (как в спрайтах у микрофона), штанга к губам; в сценах 08, 11 спрятана — стойка в спрайте
    { id: 'gumdong', type: 'char', char: 'gumdong', pose: 'play', x: 0, y: .7, z: 13.3, zone: 'stage', mouth: true },   // поза play — анимация, своё движение не нужно
    // зал: столики и зрители (тени — заглушки до листов зрителей)
    { id: 't1', type: 'table', x: -3.6, z: 9.4 }, { id: 'maeve', type: 'char', char: 'maeve', pose: 'sit', x: -3.6, z: 8.85, zone: 'house', eyeY: .92 }, { id: 'freija', type: 'char', char: 'freija', pose: 'dance', animSpeed: .5, x: -4.25, z: 8.7, zone: 'house' }, /* FreijaFoxy стоит у столика Maeve (t1), рядом с ней, со стороны входа */
    { id: 't2', type: 'table', x: 2.9, z: 9.0 }, { id: 'alex', type: 'char', char: 'alex', pose: 'sit', x: 3.55, z: 9.0, zone: 'house', face: [-1, 0] }, /* Alex — сбоку от столика t2 (+x), лицом к столу (face): в сцене 01 справа от стола, в 02 слева */ { id: 'raithwyn', type: 'char', char: 'raithwyn', pose: 'stand', x: 2.2, z: 9.05, zone: 'house' }, /* Raithwyn стоит у столика t2 (−x, напротив Alex), вместо тени g2 */
    { id: 't3', type: 'table', x: -1.2, z: 7.0, r: .4 }, { id: 'chillet', type: 'char', char: 'chillet', pose: 'sleep', x: -1.05, z: 7.6, zone: 'house' }, /* Chillet спит на полу перед столиком t3 (со стороны сцены), вместо тени g3 */
    { id: 't4', type: 'table', x: 4.6, z: 5.6 }, { id: 'couple', type: 'char', char: 'couple', pose: 'stand', x: 4.55, z: 6.15, zone: 'house' }, /* пара стоит у столика t4 со стороны сцены, вместо тени g4 */
    { id: 't5', type: 'table', x: -4.4, z: 4.8 }, 
    { id: 't6', type: 'table', x: 1.6, z: 3.2, r: .4 },
  ],
};
