// Search metadata and product terminology; the public interface remains Uzbek.
export const moduleNames = {
  erp: { en: 'Enterprise Resource Planning', ru: 'Управление производством' },
  crm: { en: 'Customer Relationship Management', ru: 'Управление клиентами и продажами' },
  ombor: { en: 'Warehouse Management System', ru: 'Складской учёт' },
  'ish-haqi': { en: 'Human Resource Management', ru: 'Кадры, посещаемость и расчёт зарплаты' },
  talim: { en: 'Learning Management System', ru: 'Управление учебным центром' },
};

export function updateHomeSeo(home) {
  const title = 'FlowCore — ERP, CRM, WMS, HRM va LMS biznes dasturi';
  const description = 'FlowCore — O‘zbekiston biznesi uchun ERP ishlab chiqarish, CRM savdo, WMS ombor, HRM ish haqi va LMS o‘quv markazi dasturi. Kerakli bo‘limlarni tanlang.';
  home = home.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="keywords"[^>]*>\s*/, '')
    .replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(">)/g, `$1${description}$2`)
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(">)/g, `$1${title}$2`);
  return home.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_match,open,json,close) => {
    const schema = JSON.parse(json);
    for (const node of schema['@graph']) {
      if (node['@type'] === 'WebSite') node.inLanguage = 'uz';
      if (node['@type'] === 'Organization' || node['@type'] === 'WebSite') node.alternateName = ['Flow Core','flowcore.uz','ФлоуКор'];
      if (node['@type'] === 'WebPage') Object.assign(node,{name:title,description});
      if (node['@type'] === 'SoftwareApplication') {
        node.description = description;
        node.alternateName = ['Flow Core','FlowCore ERP','FlowCore CRM','FlowCore WMS','FlowCore HRM','FlowCore LMS','ФлоуКор'];
      }
      if (node['@type'] === 'FAQPage') {
        const name = 'FlowCore, Flow Core yoki CoreFlow — qaysi biri to‘g‘ri?';
        node.mainEntity = node.mainEntity.filter(question => question.name !== name);
        node.mainEntity.push({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text:'Ushbu dasturning rasmiy nomi FlowCore, sayti flowcore.uz. Flow Core yoki CoreFlow deb qidirgan bo‘lsangiz, mahsulot nomi va rasmiy domenni tekshiring. FlowCore ombor, ishlab chiqarish, mijozlar, xodimlar va ta’lim hisobini yuritadi.'}});
      }
    }
    return open+JSON.stringify(schema).replace(/</g,'\\u003c')+close;
  });
}
