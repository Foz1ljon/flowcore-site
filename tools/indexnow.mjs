// Tells IndexNow search engines (Yandex, Bing, Seznam, Naver …) that the sitemap URLs
// changed, so new and updated pages are crawled within hours instead of weeks.
// Usage after a deploy: node tools/indexnow.mjs [https://flowcore.uz]
// The key file `<key>.txt` in the site root proves ownership; it must be publicly served.
import { readFileSync, readdirSync } from 'node:fs';

const site = (process.argv[2] || 'https://flowcore.uz').replace(/\/$/, '');
const keyFile = readdirSync('.').find(name => /^[0-9a-f]{32}\.txt$/.test(name));
if (!keyFile) throw new Error('IndexNow key file (<32 hex>.txt) is missing in the site root.');
const key = readFileSync(keyFile, 'utf8').trim();
const urls = [...readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${keyFile}`, urlList: urls }),
  signal: AbortSignal.timeout(20000),
});
// 200 = accepted, 202 = accepted, key check pending.
console.log(`IndexNow: ${urls.length} URLs → HTTP ${response.status}`);
if (response.status >= 400) process.exitCode = 1;
