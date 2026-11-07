# Раскадровка — «Can I Sleep with You Tonight?» (минута 0:00–1:05)

Темп 143.6 BPM (доля ≈ 0.418 с). Время в таблице — по песне; в сценах оно задаётся долями: `b(29)` = доля № 29 = 12.31 с.
Подписи текста песни — белые с чёрной обводкой внизу кадра. Пост на весь клип: пиксельная сетка 3 px, зерно, лёгкие сканлайны, виньетка.

**Идея.** Маленький подвальный клуб, зрители за столиками при свечах. Текст — детский страх «мама, можно я посплю с тобой?».
Клуб постепенно оказывается тем самым кошмаром: зрители слишком неподвижны, у теней в зале загораются глаза, к концу зал гаснет и остаётся одна вокалистка в луче.

| № | Файл | Время | Текст | Кадр | Приёмы | Что нужно из ассетов |
|---|---|---|---|---|---|---|
| 01 | `01-intro-flythrough.js` | 0:00–0:08.1 | — (интро) | Камера от входа между столиками к сцене, группа в контровом свете | 3D-камера по слоям, проявление из чёрного | позы группы с инструментами |
| 02 | `02-title-back.js` | 0:08.1–0:12.3 | — | Со спины вокалистки: перед ней зал в огоньках свечей, титр печатается | боке, контровой свет, титр VT323 | **поза со спины с гитарой** |
| 03 | `03-closeup-scared.js` | 0:12.3–0:21.5 | i'm really scared / «mom, can i sleep…» | Крупный план анфас, медленный наезд | **липсинк**, вспышка на первой доле | **портрет анфас + 4 рта** |
| 04 | `04-tables-nightmare.js` | 0:21.5–0:28.6 | it's not a nightmare… | Вид от сцены на зал, панорама по столикам; на «nightmare» у теней загораются глаза | параллакс, свечение глаз | **листы зрителей** (вместо теней) |
| 05 | `05-band-wide.js` | 0:28.6–0:32.8 | i'm really scared | Общий план группы, кадр покачивается в такт | bob | позы с инструментами |
| 06 | `06-closeup-34.js` | 0:32.8–0:38.6 | «mom, can i sleep…» | Крупный план в 3/4 на сине-фиолетовом | **липсинк** | **портрет 3/4 + 4 рта** |
| 07 | `07-again-cuts.js` | 0:38.6–0:44.9 | again ×10 | На каждое «again» склейка: вокалистка → басистка → барабанщица → зритель → Alex…; слово AGAIN растёт ступенями | кинетический текст, монтаж в долю, фон красный ↔ графит | портреты/бюсты всех |
| 08 | `08-spotlight-alone.js` | 0:44.9–0:51.2 | «can i sleep with you tonight?» | Она одна в луче прожектора, зал погас, пыль в луче | луч + пыль, сильная виньетка, **липсинк** | поза по пояс у микрофона |
| 09 | `09-instrumental.js` | 0:51.2–0:58.7 | — (проигрыш) | Камера кружит вокруг сцены, группа играет, нарастают глитч и помехи | облёт, VHS, глитч, RGB-сдвиг | циклы игры из Seedance (Gumdong ✅, Rossali, Lupa) |
| 10 | `10-chorus-tonight.js` | 0:58.7–1:05 | «can i sleep with you tonight?» | Вокалистка по центру, позади огромное неоновое TONIGHT; на 1:03.4 свет резко гаснет | гигантский текст, блэкаут, затемнение | поза в полный рост с гитарой |

## Список ассетов к генерации

**Gumdong (вокал, гитара, левша)** — подробный план ниже, в разделе «План спрайтов: Gumdong».

**Rossali (бас)** — подробный план ниже, в разделе «План спрайтов: Rossali и Lupa».

**Lupa (ударные)** — подробный план ниже, в разделе «План спрайтов: Rossali и Lupa».

**Зрители** — каждый уникальный, сидя (по пояс достаточно — столик закрывает низ); Alex — танец у сцены (Seedance, цикл 2–4 с).

**Генерация:** белый или светло-серый ровный фон, персонаж целиком с полями вокруг, без подписей и стрелок рядом с фигурой.

## План спрайтов: Gumdong

**Gumdong — левша:** гриф в **правой** руке (на картинке слева), бьёт по струнам **левой**. ChatGPT и Seedance любят «исправлять» это — сверять с референсом; готовые спрайты не отзеркаливать.

### Что есть

| Спрайт | Файл | Размер | Состояние |
|---|---|---|---|
| В полный рост с гитарой | `gumdong_guitar.png` | 956×2000 | ✅ основа для всех новых поз и роликов |
| Портрет анфас, испуганный, 4 рта | `gumdong_scared_{closed,half,wide,o}.png` | 957×1270 | ✅ рты выровнены — отличается только рот |
| Портрет 3/4, 4 рта | `gumdong_34_{closed,half,wide,o}.png` | 812×1323 | ✅ рты выровнены (база — «half», остальные рты перенесены на неё) |
| По пояс у микрофона с гитарой, поёт | `gumdong_mic.png` | 894×1274 | ✅ рот один (открыт) — для липсинка нужны ещё 3 рта |
| В полный рост, голова вверх, поёт | `gumdong_sing_up.png` | 816×1512 | ✅ |
| Со спины с гитарой | `gumdong_back_guitar.png` | 724×1249 | ✅ отзеркалена: ChatGPT нарисовал гриф в левой руке |
| Глаза крупно | `gumdong_eyes.png` | 1280×513 | ✅ прямоугольный кадр без вырезки |
| Цикл игры на гитаре (S1) | `assets/anim/gumdong_play1/f000–f118.webp` | 535×1050, 24 fps, 119 кадров | ✅ цикл ≈ 4.96 с, последний кадр ≈ первому |
| Поёт и играет, голова вверх (S2) | `assets/anim/gumdong_sing1/f000–f118.webp` | 647×1120, 24 fps, 119 кадров | ✅ цикл; в середине глаза открываются и становятся карими (ошибка Seedance) — на общем плане почти не видно |
| Анфас / профиль / спина с листа | `gumdong_front/side/back.png` | ~270×870 | ⚠️ мелкие, без гитары — заменить |
| Старые портреты с листа | `gumdong_face.png`, `gumdong_face34.png` | ~300×400 | ⚠️ мелкие — заменяются новыми |

Исходники: `src-sheets/gumdong_portraits/`, `src-sheets/seedance/`.

### Где стоят в клипе

| Сцена | Время | Gumdong |
|---|---|---|
| 01, 05, 09 | 0:00–0:08, 0:28–0:33, 0:51–0:59 | анимация `play` (цикл игры S1) в 3D-клубе |
| 02 | 0:08–0:13.6 | `backGuitar` — в 3D-клубе: камера на сцене через плечо, поднимается, открывается зал (обратный кадр к 01); ждём ролик со спины |
| 03 | 0:12–0:21 | `scared` — анфас, липсинк 4 ртами |
| 06 | 0:33–0:39 | `q34` — 3/4, липсинк 4 ртами |
| 07 | 0:39–0:47 | `scared` (с липсинком на «again») на 1-м и 6-м «again»; глаза `eyes` — последний кадр сцены |
| 08 | 0:47–0:53 | `mic` — cowboy shot у микрофона в луче, рот процедурный по голосу (ждём 4 нарисованных рта) |
| 10 | 1:00.5–1:02.9 | общий план, `playSing` — цикл игры S1 + процедурный рот (положение рта по кадрам) |
| 11 | 1:02.9–1:11 | крупный план «to-night» — `micUp` (S3 с кадра 46), блэкаут 1:05.8 → Gumdong становится белым силуэтом, подмена на силуэт `singUp` в полный рост, камера отъезжает через пустой зал, силуэты Lupa и Rossali, уход в чёрное |

### ChatGPT — что ещё сделать

Прикладывать `src-sheets/gumdong_guitar_src.png` (для крупных планов — ещё `gumdong_sheet.png`). Начало каждого промпта:
> *Same character as the reference, same art style, same outfit (black tank top, grey jeans, spiked collar, barefoot). Plain white background, full figure with margins, no text.*

| # | Спрайт | Сцена / время | Промпт (после общей фразы) | Статус |
|---|---|---|---|---|
| 1 | Портрет анфас, испуганный + 4 рта | 03 (0:12–0:21), 07 | *Close-up portrait from chest up, facing camera, worried scared expression, ears slightly back, eyes wide, mouth closed. High resolution.* | ✅ |
| 2 | Портрет 3/4 + 4 рта | 06 (0:33–0:38), 07 | *Close-up portrait from chest up, three-quarter view, sad tired eyes, mouth closed.* | ✅ |
| 3 | У микрофона с гитарой, по пояс, поёт | 08 (0:45–0:51) | *Waist-up, standing at a microphone stand, singing into it, eyes half-closed, holding the black Les Paul exactly like the reference (left-handed: neck in her RIGHT hand).* | ✅ |
| 4 | Со спины с гитарой, в полный рост | 02 (0:08–0:12, титр) | *Full body from behind, guitar strap over one shoulder, she is left-handed so from behind the guitar neck is on the RIGHT side of the image, tail visible, head slightly lowered.* | ✅ (отзеркалена) |
| 5 | Поёт, голова поднята, в полный рост | 10 (0:59–1:05) | *Full body, playing guitar, head tilted up, singing with open mouth, eyes closed, same guitar and pose as reference.* | ✅ |
| 6 | Глаза крупно (по желанию) | 07, финал | *Extreme close-up of eyes only, red eyes, scared, wide horizontal crop.* | ✅ |

**Рты для липсинка:** готовый портрет → *«edit this image, change ONLY the mouth, keep everything else identical»* → закрыт / приоткрыт / «А» / «О». Небольшие сдвиги головы не страшны — выравниваются при вырезке (так сделано для портрета 3/4).

### Seedance — ролики

Первый кадр — готовый спрайт; камера неподвижна, фон белый, фигура целиком в кадре.

| # | Ролик | Первый кадр | Длина | Сцена | Статус |
|---|---|---|---|---|---|
| S1 | Спокойная игра, лёгкое покачивание, цикл | `gumdong_guitar_src.png` | 3–5 с | 09, 01, 05 | ✅ `gumdong_play1` |
| S1b | **Энергичный риф**, цикл | `gumdong_guitar_src.png` | 4–5 с | 09 (нарастание), 10 | ⬜ |
| S1c | Гриф вверх, «рок-стойка» (по желанию) | `gumdong_guitar_src.png` | 3 с | 09, удар перед 10 | ⬜ |
| S2 | Поёт и играет, голова вверх, цикл | спрайт №5 | 5 с | пока не используется (рот не в такт) | ✅ `gumdong_sing1` |
| S2b | Покачивание у микрофона, цикл | спрайт №3 | 2–3 с | 08 | ⬜ |
| S3 | У микрофона поднимает голову к свету | спрайт №3 (у микрофона) | 5 с | 08 (0:47–0:53) | ✅ `gumdong_mic_up` → сцена 11 (кульминация «tonight»); гриф слева чуть обрезан краем видео |
| S4 | Испуганно оглядывается (по желанию) | портрет анфас | 2 с | 03 / 04 | ⬜ |

**S1** — *She strums the guitar with her left hand, slight head nod to the beat, hair and tail sway gently. Static camera, white background. End in the same pose as the start.*

**S1b, энергичный риф** —
> *She plays a fast, energetic punk rock riff on her black Les Paul: quick hard down-strokes with her LEFT hand over the pickups, her RIGHT hand slides along the neck changing chords. She bends her knees slightly and headbangs on every beat, hair, ears and tail bounce with the rhythm. Feet stay planted in place, whole body stays inside the frame. Fast steady tempo. Static camera, plain white background, no other objects. End in exactly the same pose as the first frame.*

**S1c, рок-стойка** —
> *She steps into a wide power stance and lifts the guitar neck up high, strumming hard with her LEFT hand, head thrown back, hair flying. Then she returns to the starting pose. Feet stay inside the frame. Static camera, plain white background. End in exactly the same pose as the first frame.*

**S2b** — *She sways slowly at the microphone, singing softly, eyes half closed. Static camera. End in the same pose as the start.*

**S3** — *She slowly raises her head toward a light above, eyes close. Static camera, white background.*

**S4** — *She glances nervously to the side, ears flatten. Static camera.*

Советы для Seedance: **перед загрузкой дополнить первый кадр белыми полями до формата видео (3:4 или 9:16)** — иначе Seedance обрезает края картинки (так в S3 обрезался гриф); просить *plain white background, no lighting effects* — в S3 он сам добавил серый фон с лучами (вырезали нейросетью, но с белым чище). если лицо «плывёт» — короче ролик (3–4 с) и меньше движения головы; если гитара перевернулась в правую руку — перегенерировать, отзеркалить нельзя. Водяной знак в углу не мешает — вырезается.

## План спрайтов: Rossali и Lupa

Они не поют — липсинк не нужен. Главное — **живая игра на общих планах** (сцены 01, 05, 09, 10, фон 08 и 11) и **по два портрета** для склеек на «again» (сцена 07).

Где они сейчас: Rossali — статичный спрайт с басом, покачивается кодом; Lupa — картинка с листа (290×571, без палочек), барабанная установка нарисована кодом, «хедбэнг» кодом. В сцене 07 — кропы этих же картинок (мелкие, у Lupa 235 px).

### Rossali (бас, играет правой рукой — гриф справа на картинке, как в `rossali_bass_src.png`)

| # | Что | Где | Инструмент | Промпт (после общей фразы) | Статус |
|---|---|---|---|---|---|
| R1 | В полный рост с басом | общие планы | ChatGPT | — | ✅ `rossali_bass` |
| R2 | **Цикл игры на басе** | 01, 05, 09, 10 | Seedance, кадр — `rossali_bass_src.png` + поля до 3:4 | *She plays a steady groove on her black 4-string bass, plucking with her right fingers, left hand moving on the neck, head nodding slightly to the beat, hair and big tail sway gently. Feet stay in place. Static camera, plain white background, no lighting effects. End in exactly the same pose as the first frame.* | ✅ `rossali_play1` — в клубе во всех сценах |
| R3 | Портрет по грудь, спокойная/хищная полуулыбка | 07 (2 «again») | ChatGPT, лист + `rossali_bass_src.png` | *Close-up portrait from chest up, facing camera slightly turned, calm half-smile, red eyes looking at the viewer, cigarette in the corner of her mouth, bass strap over the shoulder. High resolution.* | ✅ `rossali_portrait` → сцена 07 |
| R4 | Энергичная игра: хлёст волосами / наклон с басом (по желанию) | 09 — нарастание к припеву | Seedance | *She leans back and plays a hard, fast bass line, throws her long hair back with a head swing, tail swishes. Feet stay in place. Static camera, plain white background. End in the same pose as the first frame.* | ⬜ |

### Lupa (ударные)

Для анимации игры **установка должна быть на картинке** (палочки должны попадать по барабанам) — тогда установка кодом в клубе прячется.

| # | Что | Где | Инструмент | Промпт (после общей фразы) | Статус |
|---|---|---|---|---|---|
| L1 | **Сидит за барабанной установкой**, палочки в руках, вид спереди чуть сбоку | общие планы | ChatGPT, лист `lupa_sheet.png` | *Lupa sits behind a full black drum kit (bass drum facing the viewer, snare, two toms, hi-hat and two cymbals), holding drumsticks raised, ready to hit, wide toothy grin. Front view, slightly from the side, whole drum kit and her upper body visible, plain white background, margins around, no text.* | ✅ `lupa_kit` — стоит в клубе вместо установки кодом |
| L2 | **Цикл игры на барабанах** | 01, 05, 09, 10, фон 08 и 11 | Seedance, кадр — L1 + поля до 3:4 | *She plays a steady energetic rock beat on the drums, sticks hitting the snare and hi-hat in rhythm, headbanging to every beat, hair bouncing. The drum kit stays still. Static camera, plain white background, no lighting effects. End in exactly the same pose as the first frame.* | ✅ `lupa_play1` — в клубе во всех сценах |
| L3 | Портрет по грудь, широкая ухмылка с клыками | 07 (2 «again») | ChatGPT, лист | *Close-up portrait from chest up, facing camera, wide toothy grin with sharp canines, one eye hidden by purple hair, gold earrings visible. High resolution.* | ✅ `lupa_portrait` → сцена 07 |
| L4 | Брейк + удар по тарелке (по желанию) | конец 09 → вспышка начала 10 | Seedance, кадр — L1 | *She plays a fast drum fill across the toms and ends with a big crash cymbal hit, both arms up, head thrown back. The drum kit stays still. Static camera, plain white background.* | ⬜ |

Общая фраза для ChatGPT (как у Gumdong): *Same character as the reference, same art style, same outfit. Plain white background, full figure with margins, no text.*

**Порядок:** L1 → L2 → R2 → портреты R3, L3 → по желанию R4, L4.
