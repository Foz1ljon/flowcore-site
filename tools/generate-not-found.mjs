import { writeFileSync } from 'node:fs';

export function generateNotFound(assets, { home, logo, themeScript, themeButton, symbols }) {
  writeFileSync('404.html', `<!doctype html>
<html lang="uz" data-theme="light">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sahifa topilmadi — FlowCore</title>
<meta name="description" content="Bu manzilda sahifa topilmadi. FlowCore bosh sahifasiga qayting yoki kerakli bo‘limni tanlang.">
<meta name="robots" content="noindex, follow"><meta name="color-scheme" content="light dark"><meta name="theme-color" id="themeColor" content="#fafafa">
${home.match(/<!-- Icons & manifest -->([\s\S]*?)<!-- Theme before first paint/)[1].trim()}
<script>${themeScript}</script>
<link rel="preload" href="/assets/fonts/bricolage-latin-v9.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/onest-latin-v11.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/${assets.style}"><link rel="stylesheet" href="/${assets.product}">
</head>
<body class="detail-page notfound-page" id="top">
${symbols}
<a class="skip-link" href="#main">Asosiy mazmunga o‘tish</a>
<header class="site-header"><div class="wrap detail-header">${logo}<nav aria-label="Asosiy menyu"><a href="/">Bosh sahifa</a><a href="/#modullar">Bo‘limlar</a></nav>${themeButton}</div></header>
<main class="wrap notfound-main" id="main">
<section class="notfound-content" aria-labelledby="notfound-title"><p class="notfound-code" aria-label="404 xatolik">404</p><p class="detail-kicker">MANZIL TOPILMADI</p><h1 id="notfound-title">Bu sahifa topilmadi.</h1><p class="notfound-description">Manzil xato yozilgan yoki sahifa boshqa joyga ko‘chirilgan bo‘lishi mumkin. Bosh sahifaga qayting yoki kerakli bo‘limni tanlang.</p>
<div class="detail-actions"><a class="btn btn-accent btn-lg" href="/">Bosh sahifaga qaytish</a><button class="btn btn-line btn-lg" id="goBack" type="button" hidden>Ortga qaytish</button></div>
<nav class="detail-related" aria-label="FlowCore bo‘limlari"><a href="/ombor/">Ombor</a><a href="/erp/">Ishlab chiqarish</a><a href="/crm/">Mijozlar va savdo</a><a href="/ish-haqi/">Ish haqi</a><a href="/talim/">Ta’lim</a></nav></section>
</main>
<footer class="detail-footer"><div class="wrap legal-footer"><a href="/">© 2026 FlowCore</a><nav aria-label="Huquqiy sahifalar"><a href="/privacy/">Maxfiylik siyosati</a><a href="/terms/">Foydalanish shartlari</a></nav></div></footer>
<script src="/${assets.site}" defer></script>
</body></html>`);
}
