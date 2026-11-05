// Снимает кадры клипа в лист для проверки.  node tools/frames.js out.jpg 0 4.5 12.8 ...  (сервер: python3 -m http.server 8765)
const { chromium } = require('playwright');
(async () => {
  const [out, ...ts] = process.argv.slice(2); const times = ts.map(Number);
  const port = process.env.PORT || 8765;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
  p.on('pageerror', e => console.log('PAGEERROR', e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text()); });
  await p.goto(`http://localhost:${port}/index.html?render&t=0`); await p.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  const shots = await p.evaluate(async times => { const c = document.createElement('canvas'); c.width = 640; c.height = 360; const g = c.getContext('2d'); const res = [];
    for (const t of times) { renderAt(t, E.ctx); g.drawImage(document.getElementById('c'), 0, 0, 640, 360); g.fillStyle = '#000'; g.fillRect(0, 0, 120, 26); g.fillStyle = '#ff0'; g.font = '18px monospace'; g.fillText(t.toFixed(2), 6, 19); res.push(c.toDataURL('image/jpeg', .85)); } return res; }, times);
  const cols = 3, rows = Math.ceil(shots.length / cols);
  const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},640px);gap:4px">${shots.map(s => `<img src="${s}">`).join('')}</body>`;
  const p2 = await b.newPage({ viewport: { width: cols * 644, height: rows * 364 } }); await p2.setContent(html); await p2.waitForTimeout(200);
  await p2.screenshot({ path: out, type: 'jpeg', quality: 85, fullPage: true }); await b.close();
})();
