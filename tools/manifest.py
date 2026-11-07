"""Версии файлов для кеша браузера: assets/data/manifest.js = {путь: короткий хеш содержимого}.

    python3 tools/manifest.py      (вызывается и из tools/webify.py)

Плеер добавляет к адресу каждой картинки/кадра/песни ?v=<хеш ЭТОГО файла>, поэтому после замены
одного спрайта браузер перекачивает только его, а всё остальное берёт из кеша (sw.js).
"""
import glob, hashlib, json, os
paths = sorted(glob.glob('assets/sprites/web/*.webp') + glob.glob('assets/sprites/*.png') + glob.glob('assets/anim/*/*.webp')
               + glob.glob('assets/audio/song_clip.mp3') + glob.glob('assets/fonts/*.woff2'))
v = {p: hashlib.md5(open(p, 'rb').read()).hexdigest()[:8] for p in paths}
open('assets/data/manifest.js', 'w').write('/* генерируется tools/manifest.py — не править руками */\nwindow.ASSET_V=' + json.dumps(v, separators=(',', ':')) + ';\n')
print('manifest:', len(v), 'файлов')
