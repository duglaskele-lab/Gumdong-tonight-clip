from PIL import Image
from rembg import remove, new_session
import numpy as np
from scipy import ndimage as nd
S=new_session('isnet-anime')
C={
 'vox_front':(1,(80,65,380,968)),'vox_side':(1,(440,70,720,962)),'vox_back':(1,(760,65,1030,962)),
 'vox_face':(1,(10,975,330,1400)),'vox_face34':(1,(320,985,600,1400)),
 'bass_front':(2,(12,78,372,1078)),'bass_side':(2,(372,78,650,1078)),
 'drum_front':(3,(5,45,300,708)),'drum_34':(3,(282,45,585,708)),'drum_face':(3,(40,725,300,1000)),
 'maeve_front':(4,(15,55,385,848)),'alex_front':(5,(140,38,505,1000)),
}
for k,(s,box) in C.items():
    im=Image.open(f'src/sheet{s}.png').convert('RGB').crop(box)
    a=np.asarray(im).astype(int)
    rb=np.asarray(remove(im,session=S,post_process_mask=True))[:,:,3]
    if s==4:   # busy pink bg: trust rembg
        alpha=rb.astype(float)/255
    else:
        bgc=np.median(np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]),axis=0)
        d=np.abs(a-bgc).max(2)
        # light/neutral = background candidate (also grid lines: gray, low saturation & light)
        sat=a.max(2)-a.min(2); lum=a.mean(2)
        cand=(d<22)|((sat<14)&(lum>150)&(rb<40))
        lab,n=nd.label(cand)
        edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
        bg=np.isin(lab,list(edge))
        for i in range(1,n+1):
            if i in edge: continue
            m=lab==i
            if m.sum()>40 and (rb[m]<60).mean()>.8: bg|=m
        fg=~bg
        alpha=fg.astype(float)
        # soft edge
        e=fg & nd.binary_dilation(bg)
        alpha[e]=np.clip(d[e]/40,0.35,1)
    env=nd.binary_dilation(nd.binary_fill_holes(rb>40),iterations=7)
    if s!=4: alpha=alpha*env
    # keep largest component
    lab,n=nd.label(nd.binary_dilation(alpha>.3,iterations=2))
    if n>1:
        sizes=nd.sum(np.ones_like(lab),lab,range(1,n+1)); keep=lab==(np.argmax(sizes)+1)
        alpha=alpha*keep
    rgba=np.dstack([a,(alpha*255).astype(np.uint8)]).astype(np.uint8)
    out=Image.fromarray(rgba,'RGBA'); ys,xs=np.where(alpha>.1)
    out=out.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)); out.save(f'cut/{k}.png'); print(k,out.size)
