// Рендер клипа в MP4.  node tools/render.js out.mp4 [fps=24] [from=0] [to=CLIP.duration]
// Нужны: npm i playwright (и браузер), ffmpeg в PATH. Сервер поднимается сам.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
(async () => {
  const [out = 'clip.mp4', fpsArg = '24', fromArg, toArg] = process.argv.slice(2); const fps = +fpsArg;
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
  const port = srv.address().port;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(`http://localhost:${port}/index.html?render&t=0`); await p.waitForFunction('window.__ready === true', null, { timeout: 120000 });
  const clip = await p.evaluate(() => ({ duration: CLIP.duration, audio: CLIP.audio, fadeOut: CLIP.fadeOut }));
  const t0 = fromArg ? +fromArg : 0, t1 = toArg ? +toArg : clip.duration, n = Math.round((t1 - t0) * fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-ss', String(t0), '-t', String(t1 - t0), '-i', path.join(ROOT, clip.audio),
    '-af', `afade=t=out:st=${Math.max(0, clip.fadeOut - t0)}:d=${clip.duration - clip.fadeOut}`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i += 12) {
    const ts = []; for (let k = i; k < Math.min(n, i + 12); k++) ts.push(t0 + k / fps);
    const frames = await p.evaluate(ts => ts.map(t => { renderAt(t, E.ctx); return document.getElementById('c').toDataURL('image/jpeg', .93).split(',')[1]; }), ts);
    for (const f of frames) { if (!ff.stdin.write(Buffer.from(f, 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
    process.stdout.write(`\r${Math.min(n, i + 12)}/${n} frames`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); srv.close(); console.log('\nsaved', out);
})();
