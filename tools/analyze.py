"""Анализ песни: темп/первая доля и огибающая голоса для липсинка -> assets/data/vox_env.js
   python3 tools/analyze.py assets/audio/song.mp3 [vocals.wav]
   vocals.wav — отделённый голос (audio-separator --model_filename UVR-MDX-NET-Voc_FT.onnx --single_stem Vocals); без него — по полосе 350–2800 Гц всего микса."""
import sys, json, numpy as np, librosa
song = sys.argv[1]; voc = sys.argv[2] if len(sys.argv) > 2 else None
y, sr = librosa.load(song, sr=22050)
oenv = librosa.onset.onset_strength(y=y, sr=sr)
tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr)
bt = librosa.frames_to_time(beats, sr=sr); per = 60 / float(np.atleast_1d(tempo)[0])
off = (bt[0] + np.median(((bt - bt[0] + per / 2) % per) - per / 2)) % per
print('bpm', 60 / per, 'beatOffset', round(off, 3))
fps = 30; hop = int(22050 / fps)
src = librosa.load(voc, sr=22050)[0] if voc else y
S = np.abs(librosa.stft(src, n_fft=2048, hop_length=hop)); f = librosa.fft_frequencies(sr=22050, n_fft=2048)
band = S[(f > 200) & (f < 4000)].mean(0)
e = librosa.amplitude_to_db(band, ref=np.max); lo, hi = np.percentile(e, 30), np.percentile(e, 99)
v = np.clip((e - lo) / (hi - lo), 0, 1)
slow = np.convolve(v, np.ones(12) / 12, 'same')          # ~0.4 с
v = np.clip(.45 * v + 1.6 * (v - slow), 0, 1)            # открывать на слогах, а не держать открытым
v = np.convolve(v, [.25, .5, .25], 'same')
open('assets/data/vox_env.js', 'w').write('window.VOX_ENV=' + json.dumps({'fps': fps, 'v': [round(float(x), 2) for x in v]}, separators=(',', ':')) + ';')
print('frames', len(v))
