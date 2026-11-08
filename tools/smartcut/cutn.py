import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
WM=(705,1058,818,1097)
def cut(i, dbg=False):
  v=np.asarray(Image.open('FR/f%03d.png'%i).convert('RGB')).astype(float).copy()
  x0,y0,x1,y1=WM; v[y0:y1,x0:x1]=253
  mn=v.min(2); mx=v.max(2)
  cand=(mn>=245)&(mx-mn<=6)                                  # светлое и нейтральное
  lab,n=nd.label(cand)
  ids=np.arange(1,n+1)
  sz=nd.sum(np.ones_like(mn),lab,ids)
  core=(mn>=249)&(mx-mn<=4)
  frac=nd.mean(core.astype(float),lab,ids)
  border=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
  # защита: зрачки/радужка рядом (глаза) и красный рот (зубы)
  Lv=v.mean(2)
  purple=(v[...,2]-v[...,1]>25)&(v[...,0]-v[...,1]>10)&(Lv>100)&(Lv<215)   # светлая радужка (не тёмные волосы)
  red=(v[...,0]-v[...,2]>45)&(v[...,0]>120)
  purple[340:]=False   # радужка только в области головы (лавандовый кончик хвоста — не глаз)
  near_p=nd.binary_dilation(purple,iterations=6); near_r=nd.binary_dilation(red,iterations=4)
  bgids=[]
  for k,s,f in zip(ids,sz,frac):
    if k in border: bgids.append(k); continue
    if s<6 or f<.55: continue
    m=lab==k
    if (m&near_p).any() or (m&near_r).any(): continue
    bgids.append(k)
  bg=np.isin(lab,bgids)
  # просветы между завитками: светлое пятно, вокруг которого только тёмные волосы/контур или фон
  pink=(v[...,0]-v[...,2]>18)&(Lv>120)
  hair=(mx<170)&~pink
  sp=mx-mn
  light=(mn>=200)&(mx-mn<=24)&~bg
  # замкнутый ровный фон (чуть темнее краёв из-за виньетки видео): ярко-нейтральные пятна
  lab4,n4=nd.label((mn>=240)&(sp<=4)&~bg)
  if n4:
    ids4=np.arange(1,n4+1); s4=nd.sum(np.ones_like(mn),lab4,ids4); m4=nd.mean(mn,lab4,ids4); p4=nd.mean(sp,lab4,ids4)
    for k,a_,b_,c_ in zip(ids4,s4,m4,p4):
      if a_>=30 and b_>=242.5 and c_<=3.0:
        m=lab4==k
        if (m&near_p).any() or (m&near_r).any(): continue
        ring=nd.binary_dilation(m,iterations=3)&~m
        furring=((mn>=215)&~bg)[ring].mean()          # блик на меху окружён мехом, просвет фона — контуром
        if furring<.5: bg|=m
  lab3,n3=nd.label(light)
  if n3:
    sz3=nd.sum(np.ones_like(mn),lab3,range(1,n3+1))
    for k in range(1,n3+1):
      if sz3[k-1]<8 or sz3[k-1]>40000: continue
      m=lab3==k; sl=nd.find_objects(m.astype(np.uint8))[0]
      sl=(slice(max(sl[0].start-5,0),sl[0].stop+5),slice(max(sl[1].start-5,0),sl[1].stop+5))
      mm=m[sl]; ring=nd.binary_dilation(mm,iterations=3)&~mm
      if (mm&near_p[sl]).any() or (mm&near_r[sl]).any(): continue
      msp=sp[sl][mm].mean(); mmn=mn[sl][mm].mean()
      if mmn>=243 and msp<=2.5 and mm.sum()>=30: bg[sl]|=mm; continue   # замкнутый фон (чуть темнее из-за виньетки видео)
      ok=(hair[sl]|bg[sl])[ring].mean()
      if ok>=.85 and msp>=6.5: bg[sl]|=mm                                 # просвет в волосах (подкрашен сжатием)
  # светлые пятна, которые касаются фона напрямую (без чёрного контура между ними) — тоже фон
  for _ in range(3):
    lab5,n5=nd.label((mn>=212)&(sp<=22)&~bg)
    if not n5: break
    adj=nd.binary_dilation(bg,iterations=1)
    per=nd.binary_dilation(lab5>0,iterations=1)&~(lab5>0)
    ids5=np.arange(1,n5+1)
    touch=nd.sum(adj&(lab5>0),lab5,ids5)                    # пиксели пятна у самого фона
    edge=nd.sum((nd.binary_erosion(lab5>0)==0)&(lab5>0),lab5,ids5)   # все граничные пиксели пятна
    s5=nd.sum(np.ones_like(mn),lab5,ids5); m5=nd.mean(mn,lab5,ids5)
    add=[k for k,t,e,a_,b_ in zip(ids5,touch,edge,s5,m5) if a_>=8 and b_>=222 and e>0 and t/e>.35]
    if not add: break
    mm=np.isin(lab5,add)&~near_p&~near_r
    bg|=mm
  # мягкий край: полоса 3 px вокруг фона, альфа = насколько темнее фона, цвет очищен от белого
  alpha=(~bg).astype(float)
  near=nd.binary_dilation(bg,iterations=3)&~bg
  f=np.clip((253-mn[near])/110,0,1); alpha[near]=np.minimum(1,f)
  c=v.copy(); an=np.maximum(f,1e-3)[:,None]; c[near]=np.clip((v[near]-(1-an)*253)/an,0,255)
  # крупнейшая фигура
  lab2,n2=nd.label(nd.binary_dilation(alpha>.25,iterations=2))
  if n2>1:
    s2=nd.sum(np.ones_like(mn),lab2,range(1,n2+1)); alpha*= (lab2==np.argmax(s2)+1)
  out=Image.fromarray(np.dstack([c,alpha*255]).round().astype(np.uint8),'RGBA')
  return out
if __name__=='__main__':
  a,b=int(sys.argv[1]),int(sys.argv[2])
  for i in range(a,b+1): cut(i).save('FRn/f%03d.png'%i)
