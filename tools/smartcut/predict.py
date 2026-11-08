import numpy as np, cv2, sys, pickle
from PIL import Image
from scipy import ndimage as nd
from smart import load, head_prior, feats
clf=pickle.load(open('clf.pkl','rb'))
def run(i):
  V,ab,ac,acur=load(i)
  pr,inh,cc=head_prior(V)
  roi=nd.binary_dilation((ab>.1)|(ac>.1),iterations=12)
  F=feats(V,ab,ac,np.full(pr.shape,.5,np.float32),np.zeros(pr.shape,np.float32))
  p=np.zeros(ab.shape,np.float32); ys,xs=np.where(roi)
  p[ys,xs]=clf.predict_proba(F[ys,xs])[:,1]
  if cc>.85:
    mn_=V.min(2); sp_=V.max(2)-mn_
    bgcore=(mn_>=246)&(sp_<=4)
    ph=.7*pr+.3*p
    ph=np.where(bgcore&(p<.5),np.minimum(ph,.2),ph)      # перенесённое ухо легло на ровный фон — это фон
    p=np.where(inh>0, ph, p)                              # голова и уши — из хорошего кадра по движению головы
  m=p>.5
  # чистка: крупнейшая фигура, мелкие дырки внутри (не фон по цвету) — закрыть
  lab,n=nd.label(m)
  if n>1: s=nd.sum(m,lab,range(1,n+1)); m=lab==np.argmax(s)+1
  holes=nd.binary_fill_holes(m)&~m; hl,hn=nd.label(holes)
  if hn:
    hs=nd.sum(holes,hl,range(1,hn+1)); mn=V.min(2); sp=V.max(2)-mn
    bgfrac=nd.mean(((mn>=243)&(sp<=5)).astype(float),hl,range(1,hn+1))
    m|=np.isin(hl,[k+1 for k in range(hn) if hs[k]<40 and bgfrac[k]<.5])
  m=nd.binary_opening(m,iterations=1)|(m&nd.binary_erosion(m,iterations=0+1))
  # светлые нейтральные клочки, касающиеся фона без чёрного контура (края ушей при сильном наклоне головы) — фон
  mn_=V.min(2); sp_=V.max(2)-mn_
  for _ in range(3):
    cand=m&(mn_>=232)&(sp_<=9)
    lab5,n5=nd.label(cand)
    if not n5: break
    adj=nd.binary_dilation(~m)&cand
    edge5=cand&~nd.binary_erosion(cand)
    ids=np.arange(1,n5+1)
    t=nd.sum(adj,lab5,ids); e=nd.sum(edge5,lab5,ids); sz=nd.sum(cand,lab5,ids)
    bad=[k for k,a_,b_,c_ in zip(ids,t,e,sz) if c_<3000 and b_>0 and a_/b_>.35]
    if not bad: break
    m&=~np.isin(lab5,bad)
  # мягкий край и очистка от белого
  mn=V.min(2); al=m.astype(np.float32)
  edge=m&~nd.binary_erosion(m,iterations=2)
  f=np.clip((252-mn)/70,0,1); al[edge]=np.maximum(f[edge],.0)
  out=V.copy(); an=np.maximum(al,1e-3)[...,None]; e=edge&(al>0)
  out[e]=np.clip((V[e]-(1-an[e])*252)/an[e],0,255)
  rgba=np.dstack([out,al*255]).round().astype(np.uint8)
  Image.fromarray(rgba,'RGBA').save('SM/f%03d.png'%i)
  return cc
if __name__=='__main__':
  for i in range(int(sys.argv[1]),int(sys.argv[2])+1): print(i,round(run(i),3),flush=True)
