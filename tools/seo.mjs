// Search metadata and product terminology; the public interface remains Uzbek.
export const moduleNames = {
  erp: { en: 'Enterprise Resource Planning', ru: 'Управление производством' },
  crm: { en: 'Customer Relationship Management', ru: 'Управление клиентами и продажами' },
  ombor: { en: 'Warehouse Management System', ru: 'Складской учёт' },
  'ish-haqi': { en: 'Human Resource Management', ru: 'Кадры, посещаемость и расчёт зарплаты' },
  talim: { en: 'Learning Management System', ru: 'Управление учебным центром' },
};

export function updateHomeSeo(home) {
  const title = 'FlowCore — ombor, savdo va ish haqi hisobi dasturi';
  const description = 'Ombor qoldig‘i, mijozlar, buyurtmalar, davomat va ish haqini FlowCore’da boshqaring. O‘zbek tilidagi biznes dasturini ro‘yxatdan o‘tmasdan namunada sinang.';
  home = home.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="keywords"[^>]*>\s*/, '')
    .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(">)/g, `$1${description}$2`)
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(">)/g, `$1${title}$2`);
  return home.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_match,open,json,close) => {
    const schema = JSON.parse(json);
    for (const node of schema['@graph']) {
      if (node['@type'] === 'WebSite') node.inLanguage = 'uz';
      if (node['@type'] === 'Organization' || node['@type'] === 'WebSite') node.alternateName = ['Flow Core','flowcore.uz','ФлоуКор'];
      if (node['@type'] === 'Organization') node.sameAs = ['https://www.instagram.com/flowcore_uz/','https://t.me/flowcoreuz'];
      if (node['@type'] === 'WebPage') Object.assign(node,{name:title,description});
      if (node['@type'] === 'SoftwareApplication') {
        node.description = description;
        node.alternateName = ['Flow Core','FlowCore ERP','FlowCore CRM','FlowCore WMS','FlowCore HRM','FlowCore LMS','ФлоуКор'];
      }
      if (node['@type'] === 'FAQPage') {
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
