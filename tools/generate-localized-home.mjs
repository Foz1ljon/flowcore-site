import { homeFaq, homeTranslations } from './home-translations.mjs';

export function localizedHomeBody(home, lang, products, translatedProducts, escape) {
  const offset = lang === 'ru' ? 1 : 0;
  const translate = value => homeTranslations.get(value)?.[offset];
  const productPaths = new Set(products.map(product => product.slug));
  const faq = homeFaq.map(row => row.slice(2 * offset, 2 * offset + 2));
  // Keep one HTML layout, including the SVG symbols, interactive demo and form.
  // Script contents are left intact. Paths are resolved from the site root.
  let body = home.slice(home.indexOf('<body'));
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<[^>]+>|[^<]+/g, token => {
    if (token.startsWith('<script')) return token.replace(/(src="|new URL\(')assets\//g, '$1/assets/');
    if (!token.startsWith('<')) {
      return token.replace(/^(\s*)(\S[\s\S]*?)(\s*)$/, (original, before, value, after) => {
        const translated = translate(value);
        return translated ? before + escape(translated) + after : original;
      });
    }
    if (token.startsWith('<!--')) return token;
    return token
      .replace(/\b((?:data-[\w-]+|src|srcset|href)=")([^"]*)"/g, (_, start, value) => {
        value = value.replace(/(^|,\s*)assets\//g, '$1/assets/');
        const slug = /^\/([\w-]+)\//.exec(value)?.[1];
        if (/^(?:href|data-href)=/.test(start) && productPaths.has(slug)) value = `/${lang}${value}`;
        if (/^(?:data-name|data-desc)=/.test(start)) value = (translate(value) ? escape(translate(value)) : value);
        return start + value + '"';
      })
      .replace(/\b(aria-label|title|alt|placeholder)="([^"]*)"/g, (original, key, value) => {
        const translated = translate(value);
        return translated ? `${key}="${escape(translated)}"` : original;
      });
  });
  body = body.replace(/<a\b[^>]*\bhreflang="(?:uz|en|ru)"[^>]*>/g, tag => {
    const clean = tag.replace(/ aria-current="page"/, '');
    return clean.includes(`hreflang="${lang}"`) ? clean.replace(/>$/, ' aria-current="page">') : clean;
  }).replace('<span aria-hidden="true">UZ</span>', `<span aria-hidden="true">${lang.toUpperCase()}</span>`);
  body = body.replace(/<div class="faq">[\s\S]*?<\/div>/, () =>
    '<div class="faq">' + faq.map(([q,a], i) =>
      `<details class="reveal"${i === 0 ? ' open' : ''}><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('') + '</div>');
  const featureCopy = slug => {
    const product = translatedProducts[slug];
    return {
      name: product.heading,
      description: product.intro,
      points: product.cards.slice(0, 4).map(([title]) => title),
    };
  };
  body = body.replace(/<a class="platform-card"[^>]+>/g, tag => {
    const slug = /href="\/(?:en|ru)\/([\w-]+)\/"/.exec(tag)?.[1];
    if (!slug || !translatedProducts[slug]) return tag;
    const copy = featureCopy(slug);
    return tag.replace(/data-(name|desc|points)="[^"]*"/g, (_, key) => {
      const value = { name:copy.name, desc:copy.description, points:copy.points.join('|') }[key];
      return `data-${key}="${escape(value)}"`;
    });
  });
  const initial = featureCopy('ombor');
  body = body.replace(/<article class="platform-feature"[\s\S]*?<\/article>/, article => article
    .replace(/(<p class="platform-code"><b>WMS<\/b><span>)[\s\S]*?(<\/span>)/, (_, open, close) =>
      open + escape(initial.name) + close)
    .replace(/(<p class="platform-desc">)[\s\S]*?(<\/p>)/, (_, open, close) =>
      open + escape(initial.description) + close)
    .replace(/(<ul class="platform-points">)[\s\S]*?(<\/ul>)/, (_, open, close) =>
      open + initial.points.map(text => `<li>${escape(text)}</li>`).join('') + close));
  body = body.replace(/<div class="mod-copy">[\s\S]*?<\/div>/g, markup => {
    const slug = /class="module-details-link" href="\/(?:en|ru)\/([\w-]+)\/"/.exec(markup)?.[1];
    const product = translatedProducts[slug];
    if (!product) return markup;
    return markup
      .replace(/(<p class="module-search-name">)[\s\S]*?(<\/p>\s*<p>)[\s\S]*?(<\/p>)/,
        (_, open, between, close) => open + escape(product.title) + between + escape(product.intro) + close)
      .replace(/(<ul class="ticks">)[\s\S]*?(<\/ul>)/,
        (_, open, close) => open + product.cards.map(([title]) => `<li>${escape(title)}</li>`).join('') + close)
      .replace(/(class="module-details-link"[^>]*>)[^<]+(<\/a>)/,
        (_, open, close) => open + escape(translate('Bo‘lim haqida batafsil')) + close);
  });
  const dictionary = Object.fromEntries([...homeTranslations].map(([key, values]) => [key, values[offset]]));
  const runtime = JSON.stringify(dictionary).replace(/</g, '\\u003c');
  body = body.replace('</body>', `<script type="application/json" id="homeTranslations">${runtime}</script>\n</body>`);
  return { body, faq };
}
