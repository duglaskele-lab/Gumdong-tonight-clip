"""Аккуратная вырезка персонажа с белого фона (ChatGPT, Seedance) в PNG с прозрачностью.

    python3 tools/whitecut.py src.png out.png [--thr 14] [--no-bottom] [--no-crop] [--wm x0,y0,x1,y1]

Как работает (лучше rembg для аниме-рисунков с тёмным контуром):
  1. фон = почти белые пиксели (255 - min(RGB) < thr), связные с краем картинки (flood fill);
  2. замкнутые белые просветы (между рукой и телом) — тоже фон, если rembg isnet-anime считает их
     прозрачными (белки глаз и блики остаются);
  3. мягкий край: в полосе 3 px у фона альфа = насколько пиксель темнее белого, цвет очищается от
     примеси белого (деконтаминация) — нет белой каймы и не срезаются кончики волос;
  4. остаётся крупнейшая фигура (водяной знак, мусор — убираются), crop по фигуре.
--no-bottom  у бюстов, обрезанных снизу: не заливать фон от нижнего края.
--no-crop    не обрезать по фигуре (кадры анимации: crop делается потом по общему bbox).
--wm         прямоугольник, который заранее закрасить белым (водяной знак).
--holes N    все замкнутые светлые просветы от N px — фон, без rembg (кадры видео, где белков глаз нет).
--hint       готовая маска rembg (PNG) вместо запуска нейросети — для серии похожих кадров.
Проверять на пурпурном и тёмном фоне. Нужно: pip install "rembg[cpu]" scipy pillow
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage as nd


def rembg_mask(im):
    from rembg import remove, new_session
    global _SESSION
    if '_SESSION' not in globals(): _SESSION = new_session('isnet-anime')
    return np.asarray(remove(im, session=_SESSION, post_process_mask=True))[:, :, 3]


def whitecut(im, thr=14, no_bottom=False, wm=None, hint=None, band=3, holes=0, hole_thr=30, holes_below=0):
    a = np.asarray(im.convert('RGB')).astype(float)
    if wm:
        x0, y0, x1, y1 = wm; a[y0:y1, x0:x1] = 255
    d = 255 - a.min(2)                                   # 0 = белый
    cand = d < thr
    lab, n = nd.label(cand)
    border = [lab[0], lab[:, 0], lab[:, -1]] + ([] if no_bottom else [lab[-1]])
    edge = set(np.unique(np.concatenate(border))) - {0}
    bg = np.isin(lab, list(edge))
    if holes:
        # все замкнутые светлые просветы площадью >= holes — фон (когда rembg их не видит;
        # подходит, если белков глаз/белых деталей крупнее holes в кадре нет)
        lab_h, nh = nd.label(d < hole_thr)
        eh = set(np.unique(np.concatenate([lab_h[0], lab_h[:, 0], lab_h[:, -1], lab_h[-1]]))) - {0}
        ids = [i for i in range(1, nh + 1) if i not in eh]
        if ids:
            ar = nd.sum(np.ones_like(d), lab_h, ids)
            cy = nd.center_of_mass(np.ones_like(d), lab_h, ids)
            big = [i for i, v, c in zip(ids, ar, cy) if v >= holes and c[0] >= holes_below]   # holes_below: выше этой строки (лицо, белки глаз) не трогать
            bg |= np.isin(lab_h, big)
            # и мягкая полоса вокруг них тоже уйдёт через band ниже
    # замкнутые просветы: спросить rembg
    rb = hint if hint is not None else (np.full(d.shape, 255, np.uint8) if holes else rembg_mask(Image.fromarray(a.astype(np.uint8))))
    idx = [i for i in range(1, n + 1) if i not in edge]
    if idx:
        areas = nd.sum(np.ones_like(d), lab, idx)
        transp = nd.mean((rb < 128).astype(float), lab, idx)
        for i, ar, tr in zip(idx, areas, transp):
            if ar >= 40 and tr > .8: bg |= lab == i
    # мягкий край + деконтаминация
    alpha = (~bg).astype(float)
    near = nd.binary_dilation(bg, iterations=band) & ~bg
    al = np.clip(d[near] / 200.0, 0, 1)
    alpha[near] = np.minimum(alpha[near], al)
    c = a.copy()
    an = np.maximum(alpha[near], 1e-3)[:, None]
    c[near] = np.clip((a[near] - (1 - an) * 255) / an, 0, 255)
    alpha[bg] = 0
    # крупнейшая фигура
    lab2, n2 = nd.label(nd.binary_dilation(alpha > .25, iterations=2))
    if n2 > 1:
        sizes = nd.sum(np.ones_like(d), lab2, range(1, n2 + 1))
        alpha *= lab2 == (np.argmax(sizes) + 1)
    rgba = np.dstack([c, alpha * 255]).round().astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA'), rb


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--thr', type=float, default=14)
    ap.add_argument('--no-bottom', action='store_true')
    ap.add_argument('--no-crop', action='store_true')
    ap.add_argument('--wm')
    ap.add_argument('--hint')
    ap.add_argument('--holes', type=int, default=0, help='замкнутые светлые просветы от N px — фон (без rembg)')
    A = ap.parse_args()
    hint = np.asarray(Image.open(A.hint).convert('L')) if A.hint else None
    out, _ = whitecut(Image.open(A.src), A.thr, A.no_bottom,
                      tuple(int(v) for v in A.wm.split(',')) if A.wm else None, hint, holes=A.holes)
    if not A.no_crop: out = out.crop(out.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    out.save(A.out); print(A.out, out.size)
