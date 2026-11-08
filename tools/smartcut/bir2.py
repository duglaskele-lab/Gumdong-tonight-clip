import sys, os, time, resource
import numpy as np, onnxruntime as ort
from PIL import Image
so=ort.SessionOptions(); so.enable_cpu_mem_arena=False; so.enable_mem_pattern=False; so.intra_op_num_threads=4
sess=ort.InferenceSession('/root/.rembg/models/birefnet-general/birefnet-general.onnx', so, providers=['CPUExecutionProvider'])
inp=sess.get_inputs()[0].name
mean=np.array([.485,.456,.406],np.float32); std=np.array([.229,.224,.225],np.float32)
a,b=int(sys.argv[1]),int(sys.argv[2])
for k in range(a,b+1):
  o='FRb/f%03d.png'%k
  if os.path.exists(o): continue
  t=time.time()
  im=Image.open('FR/f%03d.png'%k).convert('RGB'); W,H=im.size
  x=(np.asarray(im.resize((1024,1024),Image.BILINEAR),np.float32)/255-mean)/std
  y=sess.run(None,{inp:x.transpose(2,0,1)[None]})[0]
  m=1/(1+np.exp(-y[0,0])); m=(m-m.min())/(m.max()-m.min()+1e-8)
  al=Image.fromarray((m*255).astype(np.uint8)).resize((W,H),Image.BILINEAR)
  out=im.convert('RGBA'); out.putalpha(al); out.save(o)
  print(k, round(time.time()-t,1), 'maxrss MB', resource.getrusage(resource.RUSAGE_SELF).ru_maxrss//1024, flush=True)
