// English (/en/) and Russian (/ru/) overview and product pages, built from tools/i18n.mjs.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { languages } from './i18n.mjs';
import { moduleNames, socialLinks } from './seo.mjs';

export const origin = 'https://flowcore.uz';
export const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const translatedLanguages = Object.keys(languages);

// Product tour screens exist for these modules (tools/capture-screens.mjs).
export const screenFor = (slug) => existsSync(`assets/images/screens/${slug}.webp`) ? `/assets/images/screens/${slug}.webp` : null;
export const ogFor = (slug) => existsSync(`assets/images/og/${slug}.jpg`) ? `${origin}/assets/images/og/${slug}.jpg` : `${origin}/og-image.png`;
export const SCREEN_WIDTH = 1240, SCREEN_HEIGHT = 752;
// 640px variants (cwebp -q 80 -resize 640 0) keep phones from downloading the full screen.
export const screenSrcset = (src) => `${src.replace('.webp', '-640.webp')} 640w, ${src} 1240w`;
const SCREEN_SIZES = '(max-width: 1140px) calc(100vw - 32px), 1100px';

/** Path of a page in each language: '' is the home page, otherwise a product slug. */
export const pathFor = (lang, slug) => `/${lang === 'uz' ? '' : `${lang}/`}${slug ? `${slug}/` : ''}`;

/** hreflang links for a page that exists in Uzbek, English and Russian. */
export function alternateLinks(slug) {
  return ['uz', ...translatedLanguages].map(lang => `<link rel="alternate" hreflang="${lang}" href="${origin}${pathFor(lang, slug)}">`).join('')
    + `<link rel="alternate" hreflang="x-default" href="${origin}${pathFor('uz', slug)}">`;
}

/** Small language switcher; the current language is marked with aria-current. */
export function languageNav(current, slug, label) {
  const names = { uz: 'O‘zbekcha', en: 'English', ru: 'Русский' };
  const short = { uz: 'UZ', en: 'EN', ru: 'RU' };
  return `<nav class="lang-switch" aria-label="${escape(label)}">${['uz', ...translatedLanguages].map(lang => `<a href="${pathFor(lang, slug)}" hreflang="${lang}" lang="${lang}"${lang === current ? ' aria-current="page"' : ''} title="${names[lang]}"><abbr title="${names[lang]}">${short[lang]}</abbr></a>`).join('')}</nav>`;
}

export function screenFigure(slug, alt, caption) {
  const src = screenFor(slug);
  if (!src) return '';
  return `<figure class="detail-shot"><img src="${src}" srcset="${screenSrcset(src)}" sizes="${SCREEN_SIZES}" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}" alt="${escape(alt)}" decoding="async"><figcaption>${escape(caption)}</figcaption></figure>`;
}

export function screenshotSchema(slug, name) {
  const src = screenFor(slug);
  return src ? { screenshot: { '@type': 'ImageObject', url: origin + src, contentUrl: origin + src, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, caption: name } } : {};
}

function head({ lang, title, description, url, slug, image, schema, assets, ctx }) {
  const L = languages[lang];
  return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta name="author" content="FlowCore">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="color-scheme" content="light dark"><meta name="theme-color" id="themeColor" content="#050a0e">
<link rel="canonical" href="${url}">${alternateLinks(slug)}
<meta property="og:type" content="website"><meta property="og:locale" content="${L.locale}"><meta property="og:locale:alternate" content="uz_UZ"><meta property="og:site_name" content="FlowCore"><meta property="og:url" content="${url}">
<meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">
<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escape(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${escape(title)}">
${ctx.icons}
<script>${ctx.themeScript}</script>
<link rel="preload" href="/assets/fonts/onest-latin-v11.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/${assets.style}"><link rel="stylesheet" href="/${assets.product}">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
</head>`;
}

function header(lang, slug, ctx) {
  const L = languages[lang].ui;
  return `<a class="skip-link" href="#main">${escape(L.skip)}</a>
<header class="site-header"><div class="wrap detail-header">${ctx.logo.replace('href="/"', `href="${pathFor(lang, '')}"`).replace('— bosh sahifa', lang === 'en' ? '— home page' : '— главная страница').replace('Biznesingiz bir oqimda', lang === 'en' ? 'Your business in one flow' : 'Ваш бизнес в одном потоке')}
<nav aria-label="${escape(L.modules)}"><a href="${pathFor(lang, '')}#modules">${escape(L.modules)}</a><a href="${pathFor(lang, 'erp')}"${slug==='erp'?' aria-current="page"':''}>ERP</a><a href="${pathFor(lang, 'crm')}"${slug==='crm'?' aria-current="page"':''}>CRM</a><a href="${pathFor(lang, 'ai')}"${slug==='ai'?' aria-current="page"':''}>AI</a><a href="/#aloqa">${escape(L.contact)}</a></nav>${languageNav(lang, slug, L.languages)}${ctx.themeButton}</div></header>`;
}

function footer(lang, slug, assets) {
  const L = languages[lang].ui;
  return `<footer class="detail-footer"><div class="wrap legal-footer"><a href="${pathFor(lang, '')}">${escape(L.footer)}</a><nav aria-label="${escape(L.social)}"><a href="${socialLinks.instagram}" target="_blank" rel="noopener">Instagram</a><a href="${socialLinks.telegram}" target="_blank" rel="noopener">Telegram</a></nav><nav aria-label="${escape(L.legal)}"><a href="/privacy/" hreflang="uz">${escape(L.privacy)}</a><a href="/terms/" hreflang="uz">${escape(L.terms)}</a><a href="#top">${escape(L.top)}</a></nav>${languageNav(lang, slug, L.languages)}</div></footer>
<script src="/${assets.stack}" defer></script>
<script src="/${assets.site}" defer></script>
</body></html>`;
}

const faqHtml = (faqs) => faqs.map(([q, a]) => `<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('');
const faqSchema = (id, url, lang, faqs) => ({ '@type':'FAQPage', '@id':id, inLanguage:lang, isPartOf:{'@id':`${url}#webpage`}, mainEntity:faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})) });

export function generateTranslatedPages(assets, ctx, products) {
  const files = [];
  for (const lang of translatedLanguages) {
    const L = languages[lang];
    const H = L.home;
    const homeUrl = origin + pathFor(lang, '');
    const order = products.map(p => p.slug).filter(slug => L.products[slug]);
    // Overview page.
    const homeSchema = { '@context':'https://schema.org', '@graph':[
      { '@type':'WebPage', '@id':`${homeUrl}#webpage`, url:homeUrl, name:H.title, description:H.description, inLanguage:lang, isPartOf:{'@id':`${origin}/#website`}, publisher:{'@id':`${origin}/#organization`}, about:{'@id':`${origin}/#software`}, primaryImageOfPage:{'@type':'ImageObject',url:`${origin}/og-image.png`,width:1200,height:630}, hasPart:{'@id':`${homeUrl}#faq`} },
      faqSchema(`${homeUrl}#faq`, homeUrl, lang, H.faq),
    ]};
    const cards = order.map(slug => {
      const p = L.products[slug];
      return `<article class="detail-card"><h3><a href="${pathFor(lang, slug)}">${escape(p.title.split(' — ')[0])}</a></h3><p>${escape(p.description)}</p></article>`;
    }).join('');
    const shots = ['erp','crm','ombor'].map(slug => {
      const name = L.products[slug].title.split(' — ')[0];
      return screenFor(slug) ? `<figure class="detail-shot"><img src="${screenFor(slug)}" srcset="${screenSrcset(screenFor(slug))}" sizes="${SCREEN_SIZES}" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}" alt="${escape(L.ui.screenAlt(name))}" loading="lazy" decoding="async"><figcaption>${escape(name)}</figcaption></figure>` : '';
    }).join('');
    const homeHtml = `${head({ lang, title:H.title, description:H.description, url:homeUrl, slug:'', image:`${origin}/og-image.png`, schema:homeSchema, assets, ctx })}
<body class="detail-page" id="top">
${ctx.symbols}
${header(lang, '', ctx)}
<main class="wrap" id="main">
<section class="detail-hero" aria-labelledby="detail-title"><p class="detail-kicker">${escape(H.kicker)}</p><h1 id="detail-title">${escape(H.heading)}</h1><p class="detail-lead">${escape(H.intro)}</p><div class="detail-actions"><a class="btn btn-accent btn-lg" href="/#aloqa">${escape(L.ui.demo)}</a><a class="btn btn-line btn-lg" href="/#ichkarida" hreflang="uz">${escape(L.ui.tryIt)}</a></div></section>
<section class="detail-section" id="modules" aria-labelledby="modules-title"><h2 id="modules-title">${escape(H.modulesTitle)}</h2><div class="detail-grid">${cards}</div></section>
<section class="detail-section" aria-labelledby="why-title"><h2 id="why-title">${escape(H.whyTitle)}</h2><div class="detail-grid">${H.why.map(([t, x]) => `<article class="detail-card"><h3>${escape(t)}</h3><p>${escape(x)}</p></article>`).join('')}</div></section>
${shots ? `<section class="detail-section detail-gallery" aria-label="${escape(L.ui.screenCaption)}">${shots}<p>${escape(L.ui.screenCaption)}</p></section>` : ''}
<section class="detail-section detail-faq" aria-labelledby="questions-title"><h2 id="questions-title">${escape(L.ui.faq)}</h2>${faqHtml(H.faq)}</section>
<section class="detail-section" aria-labelledby="start-title"><h2 id="start-title">${escape(H.contactTitle)}</h2><p>${escape(H.contactText)}</p><div class="detail-actions"><a class="btn btn-accent" href="${socialLinks.telegram}" target="_blank" rel="noopener">Telegram</a><a class="btn btn-line" href="${socialLinks.instagram}" target="_blank" rel="noopener">Instagram</a><a class="btn btn-line" href="/#aloqa">${escape(L.ui.startButton)}</a></div></section>
</main>${footer(lang, '', assets)}`;
    mkdirSync(lang, { recursive: true });
    writeFileSync(`${lang}/index.html`, homeHtml); files.push(`${lang}/index.html`);

    for (const slug of order) {
      const p = L.products[slug];
      const base = products.find(x => x.slug === slug);
      const url = origin + pathFor(lang, slug);
      const name = p.title.split(' — ')[0];
      const schema = { '@context':'https://schema.org', '@graph':[
        { '@type':'WebPage', '@id':`${url}#webpage`, url, name:p.title, description:p.description, inLanguage:lang, isPartOf:{'@id':`${origin}/#website`}, publisher:{'@id':`${origin}/#organization`}, primaryImageOfPage:{'@type':'ImageObject',url:ogFor(slug),width:1200,height:630}, about:{'@id':`${origin}/${slug}/#software`}, hasPart:{'@id':`${url}#faq`}, breadcrumb:{'@id':`${url}#breadcrumb`} },
        { '@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'FlowCore',item:homeUrl},{'@type':'ListItem',position:2,name,item:url}] },
        faqSchema(`${url}#faq`, url, lang, p.faqs),
      ]};
      const html = `${head({ lang, title:p.title, description:p.description, url, slug, image:ogFor(slug), schema, assets, ctx })}
<body class="detail-page" id="top">
${ctx.symbols}
${header(lang, slug, ctx)}
<main class="wrap" id="main">
<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${pathFor(lang, '')}">FlowCore</a><span aria-hidden="true">/</span><span aria-current="page">${escape(name)}</span></nav>
<section class="detail-hero" aria-labelledby="detail-title"><p class="detail-kicker">FlowCore ${escape(base.code)} · ${escape(moduleNames[slug][lang] || moduleNames[slug].en)}</p><h1 id="detail-title">${escape(p.heading)}</h1><p class="detail-lead">${escape(p.intro)}</p><div class="detail-actions"><a class="btn btn-accent btn-lg" href="/#aloqa">${escape(L.ui.demo)}</a><a class="btn btn-line btn-lg" href="/#ichkarida" hreflang="uz">${escape(L.ui.tryIt)}</a></div>${screenFigure(slug, L.ui.screenAlt(name), L.ui.screenCaption)}</section>
<section class="detail-section" aria-labelledby="features-title"><h2 id="features-title">${escape(L.ui.features)}</h2><div class="detail-grid">${p.cards.map(([t, x]) => `<article class="detail-card"><h3>${escape(t)}</h3><p>${escape(x)}</p></article>`).join('')}</div></section>
<section class="detail-section detail-faq" aria-labelledby="questions-title"><h2 id="questions-title">${escape(L.ui.faq)}</h2>${faqHtml(p.faqs)}</section>
<section class="detail-section" aria-labelledby="start-title"><h2 id="start-title">${escape(L.ui.startTitle)}</h2><p>${escape(L.ui.startText)}</p><a class="btn btn-accent" href="/#aloqa">${escape(L.ui.startButton)}</a></section>
<section class="detail-section" aria-labelledby="related-title"><h2 id="related-title">${escape(L.ui.related)}</h2><nav class="detail-related" aria-label="${escape(L.ui.related)}">${order.filter(s => s !== slug).map(s => `<a href="${pathFor(lang, s)}">${escape(L.products[s].title.split(' — ')[0])}</a>`).join('')}</nav></section>
</main>${footer(lang, slug, assets)}`;
      mkdirSync(`${lang}/${slug}`, { recursive: true });
      writeFileSync(`${lang}/${slug}/index.html`, html); files.push(`${lang}/${slug}/index.html`);
    }
  }
  return files;
}
