# «Умная» вырезка: классификатор пикселей, обученный на хороших кадрах (f001 исправлен вручную, f114),
# + уши/верх головы переносятся из хорошего кадра по движению головы (ECC).
import numpy as np, cv2, sys, pickle
from PIL import Image
from scipy import ndimage as nd
I='/tmp/claude-0/-home-user/aa966f10-7a90-5773-9515-a8aed08cd650/images/'
def load(i): d=np.load('CV/f%03d.npz'%i); return d['V'].astype(np.float32),d['ab']/255.,d['ac']/255.,d['acur']/255.
u=np.asarray(Image.open(I+'42.png').convert('RGB')).astype(int)
lab1=~((u[...,0]>230)&(u[...,1]<40)&(u[...,2]>230))
REFS={1:lab1.astype(np.float32), 114:(load(114)[3]>.5).astype(np.float32)}
FACE=(slice(150,300),slice(410,590)); HEAD=(slice(0,215),slice(330,680))
def gray(V): return cv2.GaussianBlur(cv2.cvtColor(V.astype(np.uint8),cv2.COLOR_RGB2GRAY).astype(np.float32),(0,0),1.2)
RG={k:gray(load(k)[0]) for k in REFS}
def head_prior(V):
  g=gray(V); best=None
  mask=np.zeros(g.shape,np.uint8); mask[FACE]=1
  for k,rg in RG.items():
    try: cc,W=cv2.findTransformECC(rg,g,np.eye(2,3,dtype=np.float32),cv2.MOTION_AFFINE,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,100,1e-5),mask,5)
    except cv2.error: continue
    if best is None or cc>best[0]: best=(cc,W,k)
  pr=np.full(g.shape,.5,np.float32); inhead=np.zeros(g.shape,np.float32)
  if best:
    cc,W,k=best
    ref=REFS[k]*0; ref[HEAD]=REFS[k][HEAD]; hm=np.zeros_like(ref); hm[HEAD]=1
    # W: ref coords -> frame coords (template=ref)
    wr=cv2.warpAffine(ref,W,(g.shape[1],g.shape[0]),flags=cv2.INTER_LINEAR)
    wh=cv2.warpAffine(hm,W,(g.shape[1],g.shape[0]),flags=cv2.INTER_NEAREST)
    pr=np.where(wh>0,wr,.5); inhead=wh
  return pr,inhead,(best[0] if best else 0)
def feats(V,ab,ac,pr,inh):
  mn=V.min(2); mx=V.max(2); sp=mx-mn; L=V.mean(2)
  F=[V[...,0],V[...,1],V[...,2],mn,sp,L,V[...,0]-V[...,2]]
  for r in (2,5,12):
    m=cv2.blur(L,(2*r+1,2*r+1)); F.append(m); F.append(np.sqrt(np.maximum(cv2.blur(L*L,(2*r+1,2*r+1))-m*m,0)))
    F.append(cv2.blur(sp,(2*r+1,2*r+1)))
  for r in (2,4,8,16): F.append(nd.minimum_filter(L,size=2*r+1))
  F.append(np.minimum(nd.distance_transform_edt(L>=90),40))
  bgc=(mn>=245)&(sp<=6); F.append(np.minimum(nd.distance_transform_edt(~bgc),40))
  for a in (ab,ac):
    F.append(a); F.append(cv2.blur(a,(11,11)))
  F.append(pr); F.append(inh)
  H,W_=L.shape; F.append(np.repeat(np.arange(H,dtype=np.float32)[:,None]/H,W_,1))
  return np.stack(F,-1).astype(np.float32)
if __name__=='__main__' and sys.argv[1]=='train':
  from sklearn.ensemble import HistGradientBoostingClassifier
  X=[];Y=[]
  rng=np.random.default_rng(0)
  for k,lab in REFS.items():
    V,ab,ac,acur=load(k)
    pr,inh,cc=head_prior(V); print('ref',k,'cc',cc)
    pr=np.full(pr.shape,.5,np.float32); inh=np.zeros(pr.shape,np.float32)   # у самих эталонов приор не подсказывает ответ
    Fm=feats(V,ab,ac,pr,inh)
    roi=nd.binary_dilation((lab>0)|(ab>.1)|(ac>.1),iterations=12)
    light=(V.min(2)>=200)
    ys,xs=np.where(roi)
    wgt=np.where(light[ys,xs],1.0,.25); sel=rng.random(len(ys))<wgt*.6
    X.append(Fm[ys[sel],xs[sel]]); Y.append(lab[ys[sel],xs[sel]]>.5)
  X=np.concatenate(X); Y=np.concatenate(Y); print('samples',len(Y),Y.mean())
  clf=HistGradientBoostingClassifier(max_iter=300,learning_rate=.1,max_leaf_nodes=63).fit(X,Y)
  pickle.dump(clf,open('clf.pkl','wb')); print('trained')
