// Regenerates assets/images/screens/*.webp (product tour screens) and assets/images/og/*.jpg.
// Needs a running local copy (npm run dev) and puppeteer-core, e.g. from the Lighthouse npx cache:
//   node tools/capture-screens.mjs <path to puppeteer-core> . http://localhost:8080
// Then make the phone variants: for f in assets/images/screens/*[^0].webp; do cwebp -q 80 -resize 640 0 "$f" -o "${f%.webp}-640.webp"; done
/* global document, scrollY -- used inside page.evaluate callbacks, which run in the browser */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const [ppDir, root, base] = process.argv.slice(2);
const { default: puppeteer } = await import(join(ppDir, 'lib/puppeteer/puppeteer-core.js'));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1360, height: 900, deviceScaleFactor: 1.5 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'light' }]);
await page.goto(base + '/', { waitUntil: 'networkidle0' });
await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; document.documentElement.classList.add('stack-render-all'); });
const outDir = join(root, 'assets/images/screens'); mkdirSync(outDir, { recursive: true });
const map = { wms: 'ombor', erp: 'erp', hr: 'ish-haqi', crm: 'crm', lms: 'talim', pos: 'pos' };
const cdp = await page.createCDPSession();
const shots = {};
for (const [tab, slug] of Object.entries(map)) {
  await page.evaluate(id => document.getElementById(id).click(), `tour-tab-${tab}`);
  await new Promise(r => setTimeout(r, 400));
  const frame = await page.$('.product-frame');
  await frame.evaluate(el => el.scrollIntoView({ block: 'start' }));
  await new Promise(r => setTimeout(r, 300));
  const box = await frame.boundingBox();
  const clip = { x: box.x, y: box.y + await page.evaluate(() => scrollY), width: box.width, height: Math.min(box.height, 760), scale: 1 };
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'webp', quality: 82, clip, captureBeyondViewport: true });
  writeFileSync(join(outDir, `${slug}.webp`), Buffer.from(data, 'base64'));
  const jpg = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 84, clip, captureBeyondViewport: true });
  shots[slug] = 'data:image/jpeg;base64,' + jpg.data;
  console.log(slug, Math.round(clip.width), 'x', Math.round(clip.height));
}
// OG images: title on the left, product screen on the right.
const products = JSON.parse((await import('node:fs')).readFileSync(join(root, 'tools/products.json'), 'utf8'));
const og = await browser.newPage();
await og.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
const ogDir = join(root, 'assets/images/og'); mkdirSync(ogDir, { recursive: true });
const logo = '<svg width="44" height="44" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#064e3b"/><path d="M20 46V27C20 22.0294 24.0294 18 29 18H46M20 33H39" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="46" cy="46" r="5" fill="#6ee7b7"/></svg>';
for (const p of products) {
  const shot = shots[p.slug];
  const heading = p.title.split(' — ')[0];
  const tagline = p.title.split(' — ')[1] || '';
  await og.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;background:#f4f4f5;font-family:Inter,system-ui,sans-serif;color:#18181b;position:relative}
  .copy{position:absolute;left:64px;top:64px;width:500px}.brand{display:flex;gap:14px;align-items:center;font:700 34px Inter,system-ui;letter-spacing:-.04em}.brand b{color:#059669}
  h1{margin-top:64px;font-size:64px;line-height:1;letter-spacing:-.04em}h1 em{font-style:normal;color:#047857}
  p{margin-top:24px;font-size:26px;line-height:1.3;color:#52525b}.url{position:absolute;left:64px;bottom:56px;font:600 22px ui-monospace,monospace;color:#047857}
  .shot{position:absolute;left:600px;top:70px;width:760px;border-radius:18px;box-shadow:0 30px 70px -20px rgb(0 0 0/.35);border:1px solid #d4d4d8}
  .modules{position:absolute;left:640px;top:150px;width:480px;display:flex;flex-wrap:wrap;gap:14px}.modules b{font-size:34px;padding:22px 28px;border-radius:16px;background:#fff;border:1px solid #d4d4d8;color:#047857}.bar{position:absolute;right:0;top:0;bottom:0;width:14px;background:#10b981}
  </style></head><body><div class="copy"><div class="brand">${logo}<span>FlowCore<b>.</b></span></div><h1>${heading.replace('FlowCore ', 'FlowCore <em>')}</em></h1><p>${tagline}</p></div><div class="url">flowcore.uz/${p.slug}/</div>${shot ? `<img class="shot" src="${shot}">` : `<div class="modules">${["WMS","ERP","CRM","HRM","LMS","POS","AI"].map(m=>`<b>${m}</b>`).join("")}</div>`}<div class="bar"></div></body></html>`, { waitUntil: 'load' });
  writeFileSync(join(ogDir, `${p.slug}.jpg`), await og.screenshot({ type: 'jpeg', quality: 86 }));
  console.log('og', p.slug);
}
await browser.close();
