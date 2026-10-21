import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const origin = 'https://flowcore.uz';
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function generatePages(assets) {
  const products = JSON.parse(readFileSync(new URL('./products.json', import.meta.url), 'utf8'));
  const home = readFileSync('index.html', 'utf8');
  const logo = home.match(/<a class="logo".*?<\/a>/s)[0].replace('href="#top"', 'href="/"');
  const themeScript = home.match(/<!-- Theme before first paint.*?<script>(.*?)<\/script>/s)[1];
  const themeButton = home.match(/<button class="theme-toggle".*?<\/button>/s)[0];
  const symbols = '<svg class="icon-symbols" xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" focusable="false"><defs>' + [...home.matchAll(/<symbol id="icon-(?:sun|moon)"[\s\S]*?<\/symbol>/g)].map(match=>match[0]).join('') + '</defs></svg>';
  const files = [];
  for (const p of products) {
    const url = `${origin}/${p.slug}/`;
    const schema = { '@context':'https://schema.org', '@graph':[
      { '@type':'WebPage', '@id':`${url}#webpage`, url, name:p.title, description:p.description, inLanguage:'uz', isPartOf:{'@id':`${origin}/#website`}, publisher:{'@id':`${origin}/#organization`}, primaryImageOfPage:{'@type':'ImageObject',url:`${origin}/og-image.png`,width:1200,height:630}, about:{'@id':`${url}#software`}, breadcrumb:{'@id':`${url}#breadcrumb`} },
      { '@type':'SoftwareApplication', '@id':`${url}#software`, name:`FlowCore ${p.code}`, alternateName:`FlowCore ${p.name}`, url, image:`${origin}/og-image.png`, description:p.description, applicationCategory:'BusinessApplication', applicationSubCategory:p.code, operatingSystem:'Web, Windows, macOS, Linux', inLanguage:'uz', isPartOf:{'@id':`${origin}/#software`}, publisher:{'@id':`${origin}/#organization`}, featureList:p.cards.map(([title])=>title) },
      { '@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'FlowCore',item:`${origin}/`},{'@type':'ListItem',position:2,name:`FlowCore ${p.code}`,item:url}] },
      { '@type':'FAQPage','@id':`${url}#faq`,mainEntity:p.faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})) }
    ]};
    const document = `<!doctype html>
<html lang="uz" data-theme="light">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(p.title)}</title>
<meta name="description" content="${escape(p.description)}">
<meta name="author" content="FlowCore">
<meta name="yandex-verification" content="09a3603c5db71a5a" />
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="color-scheme" content="light dark"><meta name="theme-color" id="themeColor" content="#fafafa">
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="uz" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="uz_UZ"><meta property="og:site_name" content="FlowCore"><meta property="og:url" content="${url}">
<meta property="og:title" content="${escape(p.title)}"><meta property="og:description" content="${escape(p.description)}">
<meta property="og:image" content="${origin}/og-image.png"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escape(p.title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(p.title)}"><meta name="twitter:description" content="${escape(p.description)}"><meta name="twitter:image" content="${origin}/og-image.png"><meta name="twitter:image:alt" content="${escape(p.title)}">
${home.match(/<!-- Icons & manifest -->([\s\S]*?)<!-- Theme before first paint/)[1].trim()}
<script>${themeScript}</script>
<link rel="preload" href="/assets/fonts/bricolage-latin-v9.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/onest-latin-v11.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/${assets.style}"><link rel="stylesheet" href="/${assets.product}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
</head>
<body class="detail-page">
${symbols}
<a class="skip-link" href="#main">Asosiy mazmunga o‘tish</a>
<header class="site-header"><div class="wrap detail-header">${logo}
<nav aria-label="Asosiy menyu"><a href="/#modullar">Bo‘limlar</a><a href="/erp/"${p.slug==='erp'?' aria-current="page"':''}>Ishlab chiqarish</a><a href="/crm/"${p.slug==='crm'?' aria-current="page"':''}>Mijozlar va savdo</a><a href="/#aloqa">Bog‘lanish</a></nav>${themeButton}</div></header>
<main class="wrap" id="main">
<nav class="breadcrumbs" aria-label="Sahifa yo‘li"><a href="/">FlowCore</a><span aria-hidden="true">/</span><span aria-current="page">${escape(p.name)}</span></nav>
<section class="detail-hero" aria-labelledby="detail-title"><p class="detail-kicker">FlowCore ${p.code} · ${escape(p.name)}</p><h1 id="detail-title">${escape(p.heading)}</h1><p class="detail-lead">${escape(p.intro)}</p><div class="detail-actions"><a class="btn btn-accent btn-lg" href="/#aloqa">Bepul tanishish</a><a class="btn btn-line btn-lg" href="/#ichkarida">Ishlashini sinab ko‘rish</a></div></section>
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
</main><footer class="detail-footer"><div class="wrap"><a href="/">FlowCore — ombor, ishlab chiqarish, xodimlar, mijozlar va ta’lim hisobi.</a></div></footer>
<script src="/${assets.site}" defer></script>
</body></html>`;
    mkdirSync(p.slug, {recursive:true});
    const filename=`${p.slug}/index.html`;writeFileSync(filename,document);files.push(filename);
  }
  writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['',...products.map(p=>`${p.slug}/`)].map(path=>`  <url><loc>${origin}/${path}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  return files;
}
