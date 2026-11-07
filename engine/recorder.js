/* engine/recorder.js — запись клипа в MP4 прямо в браузере (WebCodecs + mp4-muxer).
   Кадры рисуются по одному через renderAt(t) — видео ровное, без пропусков, даже если компьютер медленный.
   Звук — та же песня с тем же затуханием (audioGain). Библиотека assets/lib/mp4-muxer.js грузится только при записи.
   Видео: H.264 (если браузер не умеет — VP9/AV1 в MP4). Звук: AAC (иначе Opus). */
'use strict';
const REC = {
  res: { 360: [640, 360], 480: [854, 480], 720: [1280, 720], 1080: [1920, 1080] },
  // битрейт видео, кбит/с: [черновик, нормальное, высокое, максимум]
  kbps: { 360: [600, 1000, 1600, 2500], 480: [1000, 1600, 2500, 4000], 720: [2000, 3500, 5500, 8000], 1080: [4000, 7000, 11000, 16000] },
  qNames: ['черновик', 'нормальное', 'высокое', 'максимум'],
  audioKbps: 192, sr: 48000,
};

function setupRecorder(api) {
  const $ = id => document.getElementById(id);
  const panel = $('rec'), btn = $('bRec');
  let busy = false, cancel = false, lastUrl = null;
  const range = () => {
    const v = $('rRange').value, t = api.getT();
    if (v === 'scene') { const S = sceneAt(t) || SCENES[0]; return [S.start, S.end]; }
    if (v === 'here') return [t, CLIP.duration];
    return [0, CLIP.duration];
  };
  const fmtT = t => { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + s.toFixed(1).padStart(4, '0'); };
  function estimate() {
    const [a, b] = range(), r = +$('rRes').value, q = +$('rQ').value, d = b - a;
    const mb = (REC.kbps[r][q] + REC.audioKbps) * d / 8 / 1000;
    $('rInfo').textContent = `${fmtT(a)}–${fmtT(b)} · ${d.toFixed(1)} с · ≈ ${mb < 10 ? mb.toFixed(1) : Math.round(mb)} МБ`;
  }
  ['rRes', 'rQ', 'rFps', 'rRange'].forEach(id => $(id).addEventListener('change', estimate));
  btn.onclick = () => { if (busy) return; const open = !document.body.classList.contains('recording'); document.body.classList.toggle('recording', open); btn.classList.toggle('on', open); if (open) estimate(); };
  $('rClose').onclick = () => { if (!busy) { document.body.classList.remove('recording'); btn.classList.remove('on'); } };
  $('rCancel').onclick = () => { cancel = true; };
  $('rGo').onclick = () => record().catch(e => { console.error(e); status('Ошибка: ' + (e.message || e)); done(); });
  const status = s => { $('rStatus').textContent = s; };
  const bar = u => { $('rBar').style.width = (u * 100).toFixed(1) + '%'; };
  function done() { busy = false; E.recording = false; panel.classList.remove('busy'); }

  async function pickVideo(w, h, fps, kbps) {
    const base = { width: w, height: h, bitrate: kbps * 1000, framerate: fps, latencyMode: 'quality' };
    const tries = [
      ['avc', { codec: 'avc1.640028', avc: { format: 'avc' } }], ['avc', { codec: 'avc1.4d0028', avc: { format: 'avc' } }],
      ['avc', { codec: 'avc1.42e028', avc: { format: 'avc' } }], ['vp9', { codec: 'vp09.00.40.08' }], ['av1', { codec: 'av01.0.08M.08' }],
    ];
    for (const [m, c] of tries) { const cfg = Object.assign({}, base, c); try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return [m, cfg]; } catch (e) {} }
    return null;
  }
  async function pickAudio() {
    if (typeof AudioEncoder === 'undefined') return null;
    for (const [m, codec] of [['aac', 'mp4a.40.2'], ['opus', 'opus']]) {
      const cfg = { codec, sampleRate: REC.sr, numberOfChannels: 2, bitrate: REC.audioKbps * 1000 };
      try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) return [m, cfg]; } catch (e) {}
    }
    return null;
  }

  async function record() {
    if (typeof VideoEncoder === 'undefined') { status('Этот браузер не умеет кодировать видео. Откройте клип в Chrome или Edge — или запустите рендер в GitHub: Actions → Render video.'); return; }
    busy = true; cancel = false; panel.classList.add('busy'); bar(0); $('start').style.display = 'none'; $('rLink').style.display = 'none';
    api.pause();
    const [t0, t1] = range(), r = +$('rRes').value, q = +$('rQ').value, fps = +$('rFps').value, withText = $('rText').checked;
    const [w, h] = REC.res[r], kbps = REC.kbps[r][q];
    // ждём, пока догрузятся кадры анимаций (иначе в видео будут пустые места)
    while (E.load.done < E.load.total) { if (cancel) { status('Отменено'); return done(); } status(`Жду загрузку анимаций ${Math.round(E.load.done / E.load.total * 100)}%…`); await new Promise(r => setTimeout(r, 300)); }
    status('Готовлю кодировщик…');
    if (typeof Mp4Muxer === 'undefined') await loadScript('assets/lib/mp4-muxer.js');
    const vSel = await pickVideo(w, h, fps, kbps); if (!vSel) { status('Браузер не поддерживает ни H.264, ни VP9/AV1 для записи. Попробуйте Chrome.'); return done(); }
    const aSel = await pickAudio();
    const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), fastStart: 'in-memory', firstTimestampBehavior: 'offset',
      video: { codec: vSel[0], width: w, height: h, frameRate: fps },
      audio: aSel ? { codec: aSel[0], numberOfChannels: 2, sampleRate: REC.sr } : undefined });
    let encErr = null;

    // ---- звук ----
    if (aSel) {
      status('Кодирую звук…');
      const ab = await (await fetch(CLIP.audio)).arrayBuffer();
      const buf = await new OfflineAudioContext(2, 1, REC.sr).decodeAudioData(ab);
      const L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
      const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { encErr = e; } });
      ae.configure(aSel[1]);
      const s0 = Math.round(t0 * REC.sr), s1 = Math.min(L.length, Math.round(t1 * REC.sr)), N = 4800;
      for (let s = s0; s < s1; s += N) {
        const n = Math.min(N, s1 - s), data = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) { const g = audioGain((s + i) / REC.sr); data[i] = L[s + i] * g; data[n + i] = R[s + i] * g; }
        const ad = new AudioData({ format: 'f32-planar', sampleRate: REC.sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((s - s0) / REC.sr * 1e6), data });
        ae.encode(ad); ad.close();
      }
      await ae.flush(); ae.close();
    }

    // ---- картинка ----
    const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { encErr = e; } });
    ve.configure(vSel[1]);
    const out = document.createElement('canvas'); out.width = w; out.height = h; const og = out.getContext('2d');
    og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
    const notes = E.notes, caps = E.captions; E.notes = false; E.captions = withText; E.recording = true;
    const n = Math.max(1, Math.round((t1 - t0) * fps)), started = performance.now();
    try {
      for (let i = 0; i < n; i++) {
        if (cancel || encErr) break;
        const t = t0 + i / fps;
        renderAt(t, E.ctx);
        let src = E.ctx.canvas; if (w !== W) { og.drawImage(src, 0, 0, w, h); src = out; }
        const vf = new VideoFrame(src, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
        ve.encode(vf, { keyFrame: i % (fps * 2) === 0 }); vf.close();
        while (ve.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 1));
        if (i % 4 === 0) {
          const el = (performance.now() - started) / 1000, left = el / (i + 1) * (n - i - 1);
          bar((i + 1) / n); status(`Кадр ${i + 1} из ${n} · осталось ≈ ${left < 60 ? Math.ceil(left) + ' с' : Math.ceil(left / 60) + ' мин'}`);
          await new Promise(r => setTimeout(r, 0));   // дать странице обновиться
        }
      }
      if (!cancel && !encErr) await ve.flush();
    } finally {
      try { ve.close(); } catch (e) {}
      E.notes = notes; E.captions = caps;
    }
    if (encErr) throw encErr;
    if (cancel) { status('Отменено'); return done(); }
    status('Собираю файл…'); muxer.finalize();
    const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
    if (lastUrl) URL.revokeObjectURL(lastUrl); lastUrl = URL.createObjectURL(blob);
    const name = `can-i-sleep-with-you-tonight_${r}p_${REC.qNames[q]}_${fps}fps.mp4`;
    const a = $('rLink'); a.href = lastUrl; a.download = name; a.textContent = 'Скачать ещё раз'; a.style.display = '';
    a.click();
    const el = (performance.now() - started) / 1000;
    bar(1); status(`Готово: ${(blob.size / 1e6).toFixed(1)} МБ за ${el < 60 ? Math.round(el) + ' с' : (el / 60).toFixed(1) + ' мин'} · видео ${vSel[0].toUpperCase()}${aSel ? ', звук ' + aSel[0].toUpperCase() : ', без звука'}`);
    done(); api.redraw();
  }
}
