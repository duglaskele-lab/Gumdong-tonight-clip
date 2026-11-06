"""Вырезка персонажа со светлого фона в PNG с прозрачностью.

    python3 tools/cut_sprites.py src.png out.png [--box x0,y0,x1,y1] [--rembg-only]

--box        вырезать фигуру из части листа (например, один вид с листа персонажа)
--rembg-only для пёстрого фона (звёзды, градиенты) — только нейросеть rembg

Как работает: фон = светлые пиксели, связные с краем картинки (flood fill); замкнутые просветы
(между рукой и телом) тоже фон, если rembg считает их прозрачными. Маска rembg `isnet-anime`
служит только оболочкой — срезает сетку, подписи и стрелки листа и не съедает внутренность ушей.
Остаётся крупнейшая связная фигура. Проверяйте результат на пурпурном фоне.
Нужно: pip install "rembg[cpu]" scipy pillow
"""
import argparse
import numpy as np
from PIL import Image
from rembg import remove, new_session
from scipy import ndimage as nd

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--box'); ap.add_argument('--rembg-only', action='store_true')
ap.add_argument('--max-h', type=int, default=2000)
A = ap.parse_args()

im = Image.open(A.src).convert('RGB')
if A.box: im = im.crop(tuple(int(v) for v in A.box.split(',')))
a = np.asarray(im).astype(int)
rb = np.asarray(remove(im, session=new_session('isnet-anime'), post_process_mask=True))[:, :, 3]

if A.rembg_only:
    alpha = rb.astype(float) / 255
else:
    bgc = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)
    d = np.abs(a - bgc).max(2); sat = a.max(2) - a.min(2); lum = a.mean(2)
    cand = (d < 22) | ((sat < 14) & (lum > 150) & (rb < 40))
    lab, n = nd.label(cand)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    for i in range(1, n + 1):
        if i in edge: continue
        m = lab == i
        if m.sum() > 40 and (rb[m] < 60).mean() > .8: bg |= m
    alpha = (~bg).astype(float)
    e = ~bg & nd.binary_dilation(bg)
    alpha[e] = np.clip(d[e] / 40, .35, 1)                      # мягкий край
    env = nd.binary_dilation(nd.binary_fill_holes(rb > 40), iterations=7)
    alpha *= env
lab, n = nd.label(nd.binary_dilation(alpha > .3, iterations=2))
if n > 1:
    sizes = nd.sum(np.ones_like(lab), lab, range(1, n + 1)); alpha *= lab == (np.argmax(sizes) + 1)
out = Image.fromarray(np.dstack([a, (alpha * 255).astype(np.uint8)]).astype(np.uint8), 'RGBA')
ys, xs = np.where(alpha > .1); out = out.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
if out.height > A.max_h: out = out.resize((round(out.width * A.max_h / out.height), A.max_h), Image.LANCZOS)
out.save(A.out); print(A.out, out.size)
