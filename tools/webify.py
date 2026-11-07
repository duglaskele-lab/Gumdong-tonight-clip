"""Сжатые копии спрайтов для быстрой загрузки клипа: assets/sprites/NAME.png → assets/sprites/web/NAME.webp.

    python3 tools/webify.py          # обновить только изменившиеся
    python3 tools/webify.py --all    # пересобрать все

Источник правды — PNG (их заменяем/правим); плеер грузит webp из web/, а если его нет — PNG.
Запускать после каждой замены спрайта (и поднять CLIP.ver в config.js, чтобы браузеры перезагрузили картинку).
"""
import glob, os, sys
from PIL import Image
force = '--all' in sys.argv
os.makedirs('assets/sprites/web', exist_ok=True)
n = 0
for f in sorted(glob.glob('assets/sprites/*.png')):
    out = 'assets/sprites/web/' + os.path.basename(f)[:-4] + '.webp'
    if not force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f): continue
    Image.open(f).save(out, 'webp', quality=92, method=6); n += 1
    print(out, os.path.getsize(f) // 1024, '→', os.path.getsize(out) // 1024, 'KB')
print('обновлено:', n)
os.system('python3 tools/manifest.py')   # версии файлов для кеша браузера
