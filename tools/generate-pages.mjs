import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { generateLegalPages } from './generate-legal.mjs';
import { generateNotFound } from './generate-not-found.mjs';
import { generateLlms } from './generate-llms.mjs';
import { moduleNames, socialLinks } from './seo.mjs';
import { origin, escape, alternateLinks, languageNav, screenFigure, screenshotSchema, ogFor, screenFor, translatedLanguages, pathFor, generateTranslatedPages } from './generate-i18n.mjs';
export function generatePages(assets, previousHome) {
  // Preserve modification dates when a rebuild has not changed a page.
  const previousSitemap = existsSync('sitemap.xml') ? readFileSync('sitemap.xml','utf8') : '';
  const previousDates = new Map([...previousSitemap.matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod>/g)].map(([,url,date]) => [url,date]));
  const previousPages = new Map([['index.html', previousHome ?? readFileSync('index.html','utf8')]]);
  const products = JSON.parse(readFileSync(new URL('./products.json', import.meta.url), 'utf8'));
  const home = readFileSync('index.html', 'utf8');
  const logo = home.match(/<a class="logo".*?<\/a>/s)[0].replace('href="#top"', 'href="/"');
  const themeScript = home.match(/<!-- Theme before first paint.*?<script>(.*?)<\/script>/s)[1];
  const themeButton = home.match(/<button class="theme-toggle".*?<\/button>/s)[0];
  const symbols = '<svg class="icon-symbols" xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" focusable="false"><defs>' + [...home.matchAll(/<symbol id="icon-(?:sun|moon)"[\s\S]*?<\/symbol>/g)].map(match=>match[0]).join('') + '</defs></svg>';
  const files = [];
  for (const filename of [...products.map(p=>`${p.slug}/index.html`), 'privacy/index.html', 'terms/index.html', ...translatedLanguages.flatMap(lang => [`${lang}/index.html`, ...products.map(p=>`${lang}/${p.slug}/index.html`)])]) {
    if (existsSync(filename)) previousPages.set(filename, readFileSync(filename,'utf8'));
  }
  for (const p of products) {
    const url = `${origin}/${p.slug}/`;
    const schema = { '@context':'https://schema.org', '@graph':[
      { '@type':'WebPage', '@id':`${url}#webpage`, url, name:p.title, description:p.description, inLanguage:'uz', isPartOf:{'@id':`${origin}/#website`}, publisher:{'@id':`${origin}/#organization`}, primaryImageOfPage:{'@type':'ImageObject',url:ogFor(p.slug),width:1200,height:630}, about:{'@id':`${url}#software`}, mainEntity:{'@id':`${url}#software`}, hasPart:{'@id':`${url}#faq`}, breadcrumb:{'@id':`${url}#breadcrumb`} },
      { '@type':'SoftwareApplication', '@id':`${url}#software`, name:`FlowCore ${p.code}`, alternateName:[`FlowCore ${p.name}`,`Flow Core ${p.code}`,`FlowCore ${moduleNames[p.slug].en}`,`FlowCore ${moduleNames[p.slug].ru}`], url, image:ogFor(p.slug), ...screenshotSchema(p.slug, `FlowCore ${p.code}`), description:p.description, applicationCategory:'BusinessApplication', applicationSubCategory:p.code, operatingSystem:'Web, Windows, macOS, Linux', inLanguage:'uz', mainEntityOfPage:{'@id':`${url}#webpage`}, isAccessibleForFree:false, isPartOf:{'@id':`${origin}/#software`}, publisher:{'@id':`${origin}/#organization`}, featureList:p.cards.map(([title])=>title) },
      { '@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'FlowCore',item:`${origin}/`},{'@type':'ListItem',position:2,name:`FlowCore ${p.code}`,item:url}] },
      { '@type':'FAQPage','@id':`${url}#faq`,inLanguage:'uz',isPartOf:{'@id':`${url}#webpage`},mainEntity:p.faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})) }
    ]};
    const document = `<!doctype html>
<html lang="uz" data-theme="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(p.title)}</title>
<meta name="description" content="${escape(p.description)}">
<meta name="author" content="FlowCore">
<meta name="yandex-verification" content="09a3603c5db71a5a" />
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="color-scheme" content="light dark"><meta name="theme-color" id="themeColor" content="#050a0e">
<link rel="canonical" href="${url}">${alternateLinks(p.slug)}
<meta property="og:type" content="website"><meta property="og:locale" content="uz_UZ"><meta property="og:site_name" content="FlowCore"><meta property="og:url" content="${url}">
<meta property="og:title" content="${escape(p.title)}"><meta property="og:description" content="${escape(p.description)}">
<meta property="og:image" content="${ogFor(p.slug)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escape(p.title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(p.title)}"><meta name="twitter:description" content="${escape(p.description)}"><meta name="twitter:image" content="${ogFor(p.slug)}"><meta name="twitter:image:alt" content="${escape(p.title)}">
${home.match(/<!-- Icons & manifest -->([\s\S]*?)<!-- Theme before first paint/)[1].trim()}
<script>${themeScript}</script>
<link rel="preload" href="/assets/fonts/onest-latin-v11.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/${assets.style}"><link rel="stylesheet" href="/${assets.product}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
</head>
<body class="detail-page" id="top">
${symbols}
<a class="skip-link" href="#main">Asosiy mazmunga o‘tish</a>
<header class="site-header"><div class="wrap detail-header">${logo}
<nav aria-label="Asosiy menyu"><a href="/#modullar">Bo‘limlar</a><a href="/erp/"${p.slug==='erp'?' aria-current="page"':''}>Ishlab chiqarish</a><a href="/crm/"${p.slug==='crm'?' aria-current="page"':''}>Mijozlar va savdo</a><a href="/ai/"${p.slug==='ai'?' aria-current="page"':''}>AI</a><a href="/#aloqa">Bog‘lanish</a></nav>${languageNav('uz', p.slug, 'Tillar')}${themeButton}</div></header>
<main class="wrap" id="main">
<nav class="breadcrumbs" aria-label="Sahifa yo‘li"><a href="/">FlowCore</a><span aria-hidden="true">/</span><span aria-current="page">${escape(p.name)}</span></nav>
<section class="detail-hero" aria-labelledby="detail-title"><p class="detail-kicker">FlowCore ${p.code} · ${escape(p.name)}</p><h1 id="detail-title">${escape(p.heading)}</h1><p class="detail-lead">${escape(p.intro)}</p><div class="detail-actions"><a class="btn btn-accent btn-lg" href="/#aloqa">Bepul tanishish</a><a class="btn btn-line btn-lg" href="/${p.slug==='pos'?'#m-pos':p.slug==='ai'?'#ai-mcp':'#ichkarida'}">${p.slug==='pos'?'Savdo misolini ko‘rish':p.slug==='ai'?'AI imkoniyatlarini ko‘rish':'Ishlashini sinab ko‘rish'}</a></div>${screenFigure(p.slug, `FlowCore ${p.code} dasturi: ${p.name} bo‘limi ekrani`, 'FlowCore namuna kompaniyasidagi ekran.')}</section>
<section class="detail-section" aria-labelledby="plain-title"><h2 id="plain-title">Oddiy qilib aytganda, bu nima?</h2><p>${escape(p.plain)}</p></section>
<section class="detail-section" aria-labelledby="problems-title"><h2 id="problems-title">Sizda ham shunday holatlar bo‘ladimi?</h2><ul class="detail-list">${p.problems.map(text=>`<li>${escape(text)}</li>`).join('')}</ul></section>
<section class="detail-section" aria-labelledby="benefits-title"><h2 id="benefits-title">Ishingizga qanday foydasi tegadi?</h2><div class="detail-grid">${p.benefits.map(([title,text])=>`<article class="detail-card"><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join('')}</div></section>
<section class="detail-section" aria-labelledby="features-title"><h2 id="features-title">Bu bo‘lim nima qiladi?</h2><div class="detail-grid">${p.cards.map(([title,text])=>`<article class="detail-card"><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join('')}</div></section>
<section class="detail-section" aria-labelledby="workflow-title"><h2 id="workflow-title">${p.slug==='ish-haqi'?'Planshetdagi Face ID’dan oylik hisobigacha.':'Kundalik ish qanday tashkil etiladi?'}</h2><ol class="detail-list">${p.workflow.map(([title,text])=>`<li><h3>${escape(title)}</h3><p>${escape(text)}</p></li>`).join('')}</ol></section>
<section class="detail-section" aria-labelledby="connections-title"><h2 id="connections-title">Boshqa bo‘limlar bilan qanday ishlaydi?</h2><p>${escape(p.connections)}</p></section>
<section class="detail-section" aria-labelledby="example-title"><h2 id="example-title">Oddiy misolda ko‘ramiz.</h2><div class="detail-example">${p.example.map(text=>`<p>${escape(text)}</p>`).join('')}</div></section>
<section class="detail-section" aria-labelledby="result-title"><h2 id="result-title">Natijada nimani bilib turasiz?</h2><p>${escape(p.result)}</p></section>
<section class="detail-section" aria-labelledby="audience-title"><h2 id="audience-title">Kimlar uchun foydali?</h2><ul class="detail-list">${p.audience.map(text=>`<li>${escape(text)}</li>`).join('')}</ul></section>
<section class="detail-section detail-faq" aria-labelledby="questions-title"><h2 id="questions-title">Ko‘p so‘raladigan savollar.</h2>${p.faqs.map(([q,a])=>`<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('')}</section>
<section class="detail-section" aria-labelledby="start-title"><h2 id="start-title">Ishingizga mos kelishini birga ko‘ramiz.</h2><p>FlowCore o‘zbek tilida ishlaydi. Dasturdan internet orqali yoki kompyuterga o‘rnatib foydalanish mumkin. Narx kerakli bo‘limlar, jamoa va foydalanish turiga qarab kelishiladi. Ismingiz va telefoningizni qoldiring, siz bilan bog‘lanib, ishingizga mos imkoniyatlarni ko‘rsatamiz.</p><a class="btn btn-accent" href="/#aloqa">So‘rov qoldirish</a></section>
<section class="detail-section" aria-labelledby="related-title"><h2 id="related-title">Boshqa bo‘limlar bilan tanishing.</h2><nav class="detail-related" aria-label="Boshqa bo‘limlar">${products.filter(x=>x.slug!==p.slug).map(x=>`<a href="/${x.slug}/">FlowCore ${x.code} · ${escape(x.name)}</a>`).join('')}</nav></section>
</main><footer class="detail-footer"><div class="wrap legal-footer"><a href="/">FlowCore — biznes hisobi.</a><nav aria-label="Ijtimoiy tarmoqlar"><a href="${socialLinks.instagram}" target="_blank" rel="noopener">Instagram</a><a href="${socialLinks.telegram}" target="_blank" rel="noopener">Telegram</a></nav><nav aria-label="Huquqiy sahifalar"><a href="/privacy/">Maxfiylik siyosati</a><a href="/terms/">Foydalanish shartlari</a><a href="#top">Yuqoriga ↑</a></nav>${languageNav('uz', p.slug, 'Tillar')}</div></footer>
<script src="/${assets.stack}" defer></script>
<script src="/${assets.site}" defer></script>
</body></html>`;
    mkdirSync(p.slug, {recursive:true});
    const filename=`${p.slug}/index.html`;writeFileSync(filename,document);files.push(filename);
  }
  files.push(...generateLegalPages(assets, { home, logo, themeScript, themeButton, symbols }));
  const icons = home.match(/<!-- Icons & manifest -->([\s\S]*?)<!-- Theme before first paint/)[1].trim();
  const translated = generateTranslatedPages(assets, { logo, themeScript, themeButton, symbols, icons }, products);
  files.push(...translated);
  generateNotFound(assets, { home, logo, themeScript, themeButton, symbols });
  generateLlms(products);
  // Sitemap with language alternates (hreflang) and page images for every public URL.
  const slugOf = (filename) => { const parts = filename.replace(/index\.html$/, '').split('/').filter(Boolean); if (translatedLanguages.includes(parts[0])) parts.shift(); return parts[0] || ''; };
  const translatedSlugs = new Set(['', ...products.map(p => p.slug)]);
  const entry = (filename) => {
    const url = `${origin}/${filename.replace('index.html','')}`;
    const previous = previousPages.get(filename);
    const unchanged = previous !== undefined && previous === readFileSync(filename,'utf8');
    const date = unchanged && previousDates.has(url) ? previousDates.get(url) : new Date().toISOString().slice(0,10);
    const slug = slugOf(filename);
    const alternates = translatedSlugs.has(slug) && !['privacy','terms'].includes(slug)
      ? ['uz', ...translatedLanguages].map(lang => `<xhtml:link rel="alternate" hreflang="${lang}" href="${origin}${pathFor(lang, slug)}"/>`).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${pathFor('uz', slug)}"/>`
      : '';
    const images = [screenFor(slug) && `${origin}${screenFor(slug)}`, slug ? ogFor(slug) : `${origin}/og-image.png`].filter(Boolean).map(src => `<image:image><image:loc>${src}</image:loc></image:image>`).join('');
    const priority = slug === '' ? (filename === 'index.html' ? '1.0' : '0.8') : ['privacy','terms'].includes(slug) ? '0.3' : filename.startsWith(slug) ? '0.9' : '0.7';
    return `  <url><loc>${url}</loc><lastmod>${date}</lastmod><changefreq>${['privacy','terms'].includes(slug) ? 'yearly' : 'weekly'}</changefreq><priority>${priority}</priority>${alternates}${images}</url>`;
  };
  writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${['index.html',...files].map(entry).join('\n')}\n</urlset>\n`);
  return files;
}
