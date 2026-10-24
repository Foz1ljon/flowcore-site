import { mkdirSync, writeFileSync } from 'node:fs';
import { legalPages } from './legal-content.mjs';

const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function generateLegalPages(assets, { home, logo, themeScript, themeButton, symbols }) {
  return legalPages.map(page => {
    const url = `https://flowcore.uz/${page.slug}/`;
    const schema = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description, inLanguage: 'uz', dateModified: '2026-10-21', isPartOf: { '@id': 'https://flowcore.uz/#website' } },
      { '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'FlowCore', item: 'https://flowcore.uz/' }, { '@type': 'ListItem', position: 2, name: page.label, item: url } ] },
    ] };
    const document = `<!doctype html>
<html lang="uz" data-theme="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}"><meta name="author" content="FlowCore">
<meta name="robots" content="index, follow"><meta name="color-scheme" content="light dark"><meta name="theme-color" id="themeColor" content="#09090b">
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="uz" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="uz_UZ"><meta property="og:site_name" content="FlowCore"><meta property="og:url" content="${url}"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:image" content="https://flowcore.uz/og-image.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)}"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="https://flowcore.uz/og-image.png">
${home.match(/<!-- Icons & manifest -->([\s\S]*?)<!-- Theme before first paint/)[1].trim()}
<script>${themeScript}</script>
<link rel="preload" href="/assets/fonts/onest-latin-v11.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/${assets.style}"><link rel="stylesheet" href="/${assets.product}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
</head>
<body class="detail-page legal-page" id="top">
${symbols}
<a class="skip-link" href="#main">Asosiy mazmunga o‘tish</a>
<header class="site-header"><div class="wrap detail-header">${logo}<nav aria-label="Asosiy menyu"><a href="/">Bosh sahifa</a>${legalPages.map(p => `<a href="/${p.slug}/"${p.slug === page.slug ? ' aria-current="page"' : ''}>${escape(p.label)}</a>`).join('')}<a href="/#aloqa">Bog‘lanish</a></nav>${themeButton}</div></header>
<main class="wrap" id="main">
<nav class="breadcrumbs" aria-label="Sahifa yo‘li"><a href="/">FlowCore</a><span aria-hidden="true">/</span><span aria-current="page">${escape(page.label)}</span></nav>
<section class="detail-hero legal-hero" aria-labelledby="legal-title"><p class="detail-kicker">FLOWCORE · HUQUQIY MA’LUMOTLAR</p><h1 id="legal-title">${escape(page.label)}.</h1><p class="detail-lead">${escape(page.intro)}</p><div class="legal-meta"><span>Versiya 1.0</span><span>Yangilangan: <time datetime="2026-10-21">21-oktabr 2026</time></span><a href="#contact">Murojaat qilish</a></div></section>
<div class="legal-summary" aria-label="Asosiy ma’lumotlar">${page.summary.map(([title,text]) => `<article><h2>${escape(title)}</h2><p>${escape(text)}</p></article>`).join('')}</div>
<div class="legal-layout">
<aside class="legal-toc"><nav aria-label="Sahifa mundarijasi"><p>Mundarija</p><ol>${page.sections.map(([id,title]) => `<li><a href="#${id}">${escape(title)}</a></li>`).join('')}<li><a href="#contact">Aloqa va huquqiy manbalar</a></li></ol></nav></aside>
<div class="legal-content">${page.sections.map(([id,title,body],i) => `<section class="legal-section" id="${id}" aria-labelledby="${id}-title"><span class="legal-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h2 id="${id}-title">${escape(title)}</h2>${body}</section>`).join('\n')}
<section class="legal-section legal-contact" id="contact" aria-labelledby="contact-title"><h2 id="contact-title">Aloqa va huquqiy manbalar</h2><p>Maxfiylik, ma’lumotlar yoki xizmat shartlari bo‘yicha yozing. Murojaatda kompaniya nomi va bog‘lanish usulini ko‘rsating.</p><a class="btn btn-accent" href="mailto:info@flowcore.uz">info@flowcore.uz</a><p class="legal-contact-note">Xizmat ko‘rsatuvchining to‘liq rekvizitlarini buyurtma yoki shartnoma tuzishdan oldin so‘rang.</p><ul><li><a href="https://lex.uz/docs/-4396419">“Shaxsga doir ma’lumotlar to‘g‘risida” — O‘RQ-547</a></li><li><a href="https://lex.uz/docs/-6213382">“Elektron tijorat to‘g‘risida” — O‘RQ-792</a></li><li><a href="https://lex.uz/docs/-4704">“Iste’molchilarning huquqlarini himoya qilish to‘g‘risida” — 221-I</a></li></ul><p>Manbalar Lex.uz’dagi rasmiy matnlarga olib boradi. Qonunning tegishli vaqtda amalda bo‘lgan tahriri qo‘llanadi.</p></section></div></div>
</main>
<footer class="detail-footer"><div class="wrap legal-footer"><a href="/">© 2026 FlowCore</a><nav aria-label="Ijtimoiy tarmoqlar"><a href="https://www.instagram.com/flowcore_uz/" target="_blank" rel="noopener">Instagram</a><a href="https://t.me/flowcoreuz" target="_blank" rel="noopener">Telegram</a></nav><nav aria-label="Huquqiy sahifalar"><a href="/privacy/">Maxfiylik siyosati</a><a href="/terms/">Foydalanish shartlari</a><a href="#top">Yuqoriga ↑</a></nav></div></footer>
<script src="/${assets.site}" defer></script>
</body></html>`;
    mkdirSync(page.slug, { recursive: true });
    const file = `${page.slug}/index.html`;
    writeFileSync(file, document);
    return file;
  });
}
