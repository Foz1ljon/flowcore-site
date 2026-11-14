export const socialLinks = Object.freeze({
  telegram: 'https://t.me/flowcoreuz',
  instagram: 'https://www.instagram.com/flowcore_uz',
});

// Search metadata and product terminology; the public interface remains Uzbek.
export const moduleNames = {
  moliya: { en: 'Finance', ru: 'Финансы' },
  pos: { en: 'Point of Sale', ru: 'Касса и розничная торговля' },
  erp: { en: 'Enterprise Resource Planning', ru: 'Управление производством' },
  crm: { en: 'Customer Relationship Management', ru: 'Управление клиентами и продажами' },
  ombor: { en: 'Warehouse Management System', ru: 'Складской учёт' },
  'ish-haqi': { en: 'Human Resource Management', ru: 'Кадры, посещаемость и расчёт зарплаты' },
  talim: { en: 'Learning Management System', ru: 'Управление учебным центром' },
};

export function updateHomeSeo(home) {
  const title = 'FlowCore — biznes uchun CRM, ERP va ombor dasturi';
  const description = 'Ombor qoldig‘i, mijozlar, buyurtmalar, davomat va ish haqini FlowCore’da boshqaring. O‘zbek tilidagi biznes dasturini ro‘yxatdan o‘tmasdan namunada sinang.';
  home = home.replace(/https:\/\/www\.instagram\.com\/flowcore[._]uz\/?(?=["'])/g, socialLinks.instagram)
    .replace(/https:\/\/t\.me\/flowcore_?uz(?=["'])/g, socialLinks.telegram);
  for (const [network, url] of Object.entries(socialLinks)) {
    const handle = network === 'instagram' ? '@flowcore_uz' : '@flowcoreuz';
    home = home.replaceAll(new RegExp(`<a href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<\\/a>`, 'g'), link => link.replace(/@flowcore(?:_uz|uz|\.uz)/g, handle));
  }
  home = home.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="keywords"[^>]*>\s*/, '')
    .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(">)/g, `$1${description}$2`)
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(">)/g, `$1${title}$2`);
  return home.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_match,open,json,close) => {
    const schema = JSON.parse(json);
    for (const node of schema['@graph']) {
      if (node['@type'] === 'WebSite') node.inLanguage = 'uz';
      if (node['@type'] === 'Organization' || node['@type'] === 'WebSite') node.alternateName = ['Flow Core','flowcore.uz','ФлоуКор'];
      if (node['@type'] === 'Organization') Object.assign(node, {
        name: 'FlowCore', url: 'https://flowcore.uz/',
        logo: {'@type':'ImageObject', '@id':'https://flowcore.uz/#logo', url:'https://flowcore.uz/icon-512.png', contentUrl:'https://flowcore.uz/icon-512.png', width:512, height:512, caption:'FlowCore'},
        sameAs: Object.values(socialLinks),
        contactPoint: {'@type':'ContactPoint', contactType:'sales', url:'https://flowcore.uz/#aloqa', availableLanguage:['uz'], areaServed:'UZ'},
      });
      if (node['@type'] === 'WebPage') Object.assign(node,{name:title,description, mainEntity:{'@id':'https://flowcore.uz/#software'}, hasPart:{'@id':'https://flowcore.uz/#faq'}});
      if (node['@type'] === 'SoftwareApplication') {
        node.description = description;
        delete node.downloadUrl;
        delete node.softwareVersion; // Not tied to a release feed.
        delete node.screenshot; // The social card is not an application screenshot.
        delete node.availableLanguage;
        node.inLanguage = 'uz';
        node.mainEntityOfPage = {'@id':'https://flowcore.uz/#webpage'};
        node.featureList = [...new Set([...node.featureList, 'POS: kassa, savdo, to‘lovlar, nasiya va smena', 'Moliya: hisoblar, kirim, chiqim va o‘tkazmalar — bonus modul', 'Rahbar: Android telefonda hisobotlar va bildirishnomalar', 'FaceID: Android planshetda yuz orqali davomat'])];
        if (!node.hasPart.some(part => part['@id'] === 'https://flowcore.uz/pos/#software')) node.hasPart.push({'@id':'https://flowcore.uz/pos/#software'});
        if (!node.hasPart.some(part => part['@id'] === 'https://flowcore.uz/moliya/#software')) node.hasPart.push({'@id':'https://flowcore.uz/moliya/#software'});
        node.alternateName = ['Flow Core','FlowCore Moliya','FlowCore ERP','FlowCore CRM','FlowCore WMS','FlowCore HRM','FlowCore LMS','FlowCore POS','ФлоуКор'];
      }
      if (node['@type'] === 'FAQPage') {
        node['@id'] = 'https://flowcore.uz/#faq';
        node.isPartOf = {'@id':'https://flowcore.uz/#webpage'};
        node.inLanguage = 'uz';
        // Generate FAQ markup from the visible answers so search and page copy agree.
        const plain = text => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        const faq = home.match(/<div class="faq">([\s\S]*?)<\/div>/)?.[1] || '';
        node.mainEntity = [...faq.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map(([,q,a]) => ({
          '@type':'Question', name:plain(q.replace(/<span>.*?<\/span>/, '')),
          acceptedAnswer:{'@type':'Answer',text:plain(a)}
        }));
      }
    }
    return open+JSON.stringify(schema).replace(/</g,'\\u003c')+close;
  });
}
