/* Interactive product illustration. All state is in memory and is reset on reload. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const tabs = [...document.querySelectorAll('[data-tour]')];
  const search = $('#tour-search');
  const action = $('#tour-action');
  const feedback = $('#tour-feedback');
  const initial = () => ({ cotton: 1240, stage: 0, attendance: false, leads: 0, paid: false });
  let state = initial();
  let current = 'wms';
  let view = 'products';
  const count = (value) => new Intl.NumberFormat('uz-UZ').format(value);
  const modules = {
    wms: {
      label: 'OMBOR BOSHQARUVI', title: 'Mahsulotlar',
      description: 'Qaysi mahsulot qancha qoldi, nimani buyurtma qilish kerak — bir qarashda ko‘ring.',
      search: 'Mahsulot nomini qidiring', caption: 'Namunaviy ombor qoldiqlari',
      headers: ['Mahsulot', 'Ombor', 'Qoldiq', 'Holat'],
      metrics: () => [['Mahsulot turi', '4', 'Sinov ro‘yxati'], ['Oq mato', `${count(state.cotton)} m`, 'Asosiy ombor'], ['Kam qoldiq', '1', 'Xarid kerak']],
      rows: () => [['Paxta mato, oq', 'Asosiy ombor', `${count(state.cotton)} m`, 'Yetarli'], ['Tugma 12 mm', 'Asosiy ombor', '8 600 dona', 'Yetarli'], ['Ko‘ylak, M', 'Tayyor mahsulot', '312 dona', 'Yetarli'], ['Ip, qora', 'Asosiy ombor', '18 g‘altak', 'Kam qoldiq']],
      button: () => '100 m mato kirim',
      act() { state.cotton += 100; return `100 m oq mato kirim qilindi. Yangi qoldiq: ${count(state.cotton)} m.`; },
      takeaway: 'Natija: xaridni qoldiqqa qarab rejalashtirasiz, xomashyo yetishmovchiligini oldindan ko‘rasiz.',
    },
    erp: {
      label: 'ISHLAB CHIQARISH', title: 'Buyurtmalar',
      description: 'Mas’ul, miqdor va ishlab chiqarish holati bir jadvalda. #1043 buyurtmani keyingi bosqichga o‘tkazib ko‘ring.',
      search: 'Buyurtma yoki mahsulotni qidiring', caption: 'Namunaviy ishlab chiqarish buyurtmalari',
      headers: ['Buyurtma', 'Mahsulot', 'Miqdor', 'Bosqich'],
      metrics: () => [['Faol buyurtma', state.stage < 4 ? '3' : '2', 'Jarayondagi ishlar'], ['#1043 jarayoni', `${Math.min(state.stage, 4)} / 4`, 'Bajarilgan bosqich'], ['Tayyor mahsulot', state.stage === 4 ? '350 dona' : '300 dona', 'Yakunlangan buyurtmalar']],
      rows: () => [['#1043 · Nur do‘koni', 'Ko‘ylak', '50 dona', ['Bichish', 'Tikish', 'Dazmol', 'Qadoqlash', 'Yakunlandi'][state.stage]], ['#1042 · Bahor', 'Forma', '120 dona', 'Tikish'], ['#1041 · Atlas', 'Ko‘ylak', '300 dona', 'Yakunlandi'], ['#1044 · Ziyo', 'Forma', '80 dona', 'Bichish']],
      button: () => state.stage === 4 ? 'Buyurtma yakunlandi' : '#1043: keyingi bosqich',
      disabled: () => state.stage === 4,
      act() { state.stage = Math.min(state.stage + 1, 4); return state.stage === 4 ? '#1043 yakunlandi: 50 dona tayyor mahsulot. Qayta sinash uchun namunani tiklang.' : `#1043 endi ${['Bichish', 'Tikish', 'Dazmol', 'Qadoqlash'][state.stage].toLowerCase()} bosqichida.`; },
      takeaway: 'Natija: buyurtma holatini telefon qilib so‘ramasdan, ishning qayergacha kelganini ko‘rasiz.',
    },
    hr: {
      label: 'XODIMLAR BOSHQARUVI', title: 'Xodimlar',
      description: 'Davomat, ishlangan miqdor va ish haqi tarkibini kuzating. Dilshodning bugungi davomatini belgilang.',
      search: 'Xodim yoki lavozimni qidiring', caption: 'Namunaviy xodimlar davomati',
      headers: ['Xodim', 'Lavozim', 'Bugungi ish', 'Davomat'],
      metrics: () => [['Xodimlar', '4', 'Namuna jamoasi'], ['Bugun kelgan', state.attendance ? '4 / 4' : '3 / 4', 'Belgilangan davomat'], ['Malikaning ish haqi', '4 400 000', '2 mln + 480 × 5 000 so‘m']],
      rows: () => [['Malika A.', 'Tikuvchi', '480 dona', 'Keldi'], ['Aziza K.', 'Bichuvchi', '8 soat', 'Keldi'], ['Dilshod S.', 'Qadoqlovchi', state.attendance ? 'Smena boshlandi' : 'Belgilanmagan', state.attendance ? 'Keldi' : 'Kutilmoqda'], ['Sardor B.', 'Omborchi', '8 soat', 'Keldi']],
      button: () => state.attendance ? 'Dilshod belgilandi' : 'Dilshodning davomati',
      disabled: () => state.attendance,
      act() { state.attendance = true; return 'Dilshod uchun “Keldi” belgilandi. Bugungi davomat: 4 / 4.'; },
      takeaway: 'Natija: davomat va bajarilgan ishni bir joyda tekshirib, ish haqi hisobini asoslab berasiz.',
    },
    crm: {
      label: 'MIJOZLAR BILAN MUNOSABAT', title: 'Mijozlar va savdo',
      description: 'Mijoz qaysi kanaldan keldi, kim javobgar va keyingi qadam nima — bir joyda. Yangi so‘rov qo‘shib ko‘ring.',
      search: 'Mijoz yoki kanalni qidiring', caption: 'Namunaviy mijozlar ro‘yxati',
      headers: ['Mijoz', 'Kanal', 'Mas’ul', 'Holat'],
      metrics: () => [['Murojaatlar', String(4 + state.leads), 'Mijozlar ro‘yxati'], ['Yangi so‘rov', String(1 + state.leads), 'Birinchi suhbat kerak'], ['Yopilgan savdo', '1', 'Nur do‘koni']],
      rows: () => [...Array.from({ length: state.leads }, (_, i) => [`Yangi mijoz ${state.leads - i}`, 'Telegram', 'Aziza', 'Yangi']), ['Nur do‘koni', 'Telefon', 'Sardor', 'Savdo yopildi'], ['Madina R.', 'Telegram', 'Aziza', 'Yangi'], ['Atlas', 'Instagram', 'Sardor', 'Taklif yuborildi'], ['Ziyo', 'Telefon', 'Aziza', 'Muzokara']],
      button: () => state.leads >= 10 ? 'Namuna limiti: 10 ta so‘rov' : 'Yangi so‘rov qo‘shish', disabled: () => state.leads >= 10,
      act() { state.leads++; return `Telegramdan “Yangi mijoz ${state.leads}” qo‘shildi va Azizaga biriktirildi.`; },
      takeaway: 'Natija: javobsiz qolgan murojaatni ko‘rasiz va mijoz bilan keyingi suhbatni unutmay qo‘yasiz.',
    },
    lms: {
      label: 'TA’LIM BOSHQARUVI', title: 'Guruhlar',
      description: 'Guruh, davomat va qarzdorlikni tekshiring. Madinaning 450 000 so‘mlik to‘lovini namunada qayd eting.',
      search: 'O‘quvchi yoki guruhni qidiring', caption: 'Namunaviy o‘quvchilar va to‘lovlar',
      headers: ['O‘quvchi', 'Guruh', 'Qarz', 'Holat'],
      metrics: () => [['O‘quvchilar', '4', 'Namuna ro‘yxati'], ['Qarzdorlar', state.paid ? '1' : '2', 'To‘lov kutilmoqda'], ['Jami qarz', state.paid ? '250 000' : '700 000', 'So‘m']],
      rows: () => [['Madina R.', 'Ingliz tili B1', state.paid ? '0 so‘m' : '450 000 so‘m', state.paid ? 'To‘langan' : 'Qarzdor'], ['Javohir S.', 'Matematika', '0 so‘m', 'To‘langan'], ['Shahnoza A.', 'Ingliz tili B1', '250 000 so‘m', 'Qarzdor'], ['Aziz K.', 'IT boshlang‘ich', '0 so‘m', 'To‘langan']],
      button: () => state.paid ? 'To‘lov qayd etildi' : 'Madina: 450 000 so‘m', disabled: () => state.paid,
      act() { state.paid = true; return 'Namuna to‘lovi qayd etildi. Madinaning qarzi 0 so‘m. Bu haqiqiy pul operatsiyasi emas.'; },
      takeaway: 'Natija: o‘quvchi, guruh va to‘lov ma’lumotini alohida daftarlardan qidirmaysiz.',
    },
  };
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  // Labels and page structures follow playground/shared/module-navigation.ts.
  const navigation = {
    wms: { name: 'Ombor boshqaruvi', code: 'WMS', pages: [['products', 'Mahsulotlar', 'warehouse'], ['warehouses', 'Omborlar', 'store'], ['movements', 'Ombor harakatlari', 'arrow-left-right']] },
    erp: { name: 'Ishlab chiqarish', code: 'ERP', pages: [['orders', 'Buyurtmalar', 'factory'], ['tasks', 'Vazifalar', 'calendar-check'], ['materials', 'Xomashyo ehtiyoji', 'warehouse']] },
    hr: { name: 'Xodimlar va ish haqi', code: 'HRM', pages: [['employees', 'Xodimlar', 'users-round'], ['attendance', 'Davomat', 'calendar-check'], ['payroll', 'Ish haqi', 'wallet']] },
    crm: { name: 'Mijozlar va savdo', code: 'CRM', pages: [['pipeline', 'Savdo voronkasi', 'chart-no-axes-combined'], ['tasks', 'Vazifalar', 'calendar-check'], ['inbox', 'Demo inbox', 'inbox']] },
    lms: { name: 'Ta’lim boshqaruvi', code: 'LMS', pages: [['groups', 'Guruhlar', 'users-round'], ['students', 'O‘quvchilar', 'graduation-cap'], ['payments', 'To‘lovlar', 'wallet']] },
  };
  const icon = (name) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('icon');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', `#icon-${name}`); svg.append(use); return svg;
  };
  const views = {
    wms: {
      products: { headers: ['Mahsulot', 'SKU', 'Kategoriya', 'Qoldiq', 'Narxi', 'Holat'], rows: () => [['Paxta mato, oq', 'MAT-001', 'Xomashyo', `${count(state.cotton)} m`, '35 000 so‘m', 'Mavjud'], ['Tugma 12 mm', 'TUG-012', 'Furnitura', '8 600 dona', '150 so‘m', 'Mavjud'], ['Ko‘ylak, M', 'KOY-001', 'Tayyor mahsulot', '312 dona', '120 000 so‘m', 'Mavjud'], ['Ip, qora', 'IP-004', 'Xomashyo', '18 g‘altak', '8 000 so‘m', 'Kam qolgan']] },
      warehouses: { headers: ['Ombor', 'Joylashuv', 'Mahsulot turi', 'Holat'], rows: () => [['Asosiy ombor', '1-bino', '3 tur', 'Faol'], ['Tayyor mahsulot', '2-bino', '1 tur', 'Faol']] },
      movements: { headers: ['Mahsulot', 'Harakat', 'Ombor', 'Miqdor', 'Holat'], rows: () => [['Paxta mato, oq', 'Kirim', 'Asosiy ombor', `${count(state.cotton - 1140)} m`, 'Qayd etilgan'], ['Ko‘ylak, M', 'Kirim', 'Tayyor mahsulot', '50 dona', 'Qayd etilgan'], ['Tugma 12 mm', 'Chiqim', 'Asosiy ombor', '300 dona', 'Qayd etilgan']] },
    },
    erp: {
      orders: { headers: modules.erp.headers, rows: modules.erp.rows },
      tasks: { headers: ['Vazifa', 'Buyurtma', 'Mas’ul', 'Holat'], rows: () => [['Ko‘ylaklarni tikish', '#1042 · Bahor', 'Malika A.', 'Jarayonda'], ['Matoni bichish', '#1044 · Ziyo', 'Aziza K.', 'Kutilmoqda'], ['Tayyor mahsulotni qadoqlash', '#1041 · Atlas', 'Dilshod S.', 'Yakunlandi']] },
      materials: { headers: ['Xomashyo', 'Talab', 'Qoldiq', 'Holat'], rows: () => [['Paxta mato, oq', '125 m', '1 240 m', 'Yetarli'], ['Tugma 12 mm', '300 dona', '8 600 dona', 'Yetarli'], ['Ip, qora', '25 g‘altak', '18 g‘altak', '7 ta yetishmaydi']] },
    },
    hr: {
      employees: { headers: ['Xodim', 'Lavozim', 'Bo‘lim', 'To‘lov turi', 'Holat'], rows: () => [['Malika A.', 'Tikuvchi', 'Ishlab chiqarish', 'Oylik + donabay', 'Faol'], ['Aziza K.', 'Bichuvchi', 'Ishlab chiqarish', 'Soatbay', 'Faol'], ['Dilshod S.', 'Qadoqlovchi', 'Ishlab chiqarish', 'Kunbay', 'Faol'], ['Sardor B.', 'Omborchi', 'Ombor', 'Oylik', 'Faol']] },
      attendance: { headers: modules.hr.headers, rows: modules.hr.rows },
      payroll: { headers: ['Xodim', 'Oylik', 'Qo‘shimcha haq', 'Jami', 'Holat'], rows: () => [['Malika A.', '2 000 000', '2 400 000', '4 400 000 so‘m', 'Hisoblangan'], ['Aziza K.', '3 200 000', '0', '3 200 000 so‘m', 'Hisoblangan'], ['Sardor B.', '3 000 000', '200 000', '3 200 000 so‘m', 'Hisoblangan']] },
    },
    crm: {
      pipeline: { headers: modules.crm.headers, rows: modules.crm.rows },
      tasks: { headers: ['Vazifa', 'Mijoz', 'Mas’ul', 'Holat'], rows: () => [['Narx taklifini yuborish', 'Atlas', 'Sardor', 'Bugun'], ['Qayta qo‘ng‘iroq qilish', 'Madina R.', 'Aziza', 'Bugun'], ['Uchrashuvni kelishish', 'Ziyo', 'Aziza', 'Kutilmoqda']] },
      inbox: { headers: ['Mijoz', 'Kanal', 'Oxirgi xabar', 'Holat'], rows: () => [['Madina R.', 'Telegram', 'Ko‘ylak narxi qancha?', 'Yangi'], ['Atlas', 'Instagram', 'Taklifingizni kutamiz.', 'Javob berilgan'], ['Nur do‘koni', 'Telegram', 'Buyurtma uchun rahmat.', 'Javob berilgan']] },
    },
    lms: {
      groups: { headers: ['Guruh', 'O‘qituvchi', 'Jadval', 'O‘quvchilar', 'Holat'], rows: () => [['Ingliz tili B1', 'Nigora S.', 'Du · Ch · Ju / 14:00', '2 nafar', 'Faol'], ['Matematika', 'Jasur A.', 'Se · Pa / 16:00', '1 nafar', 'Faol'], ['IT boshlang‘ich', 'Akmal R.', 'Du · Ch / 18:00', '1 nafar', 'Faol']] },
      students: { headers: ['O‘quvchi', 'Guruh', 'Qolgan to‘lov', 'Holat'], rows: modules.lms.rows },
      payments: { headers: modules.lms.headers, rows: modules.lms.rows },
    },
  };
  const descriptions = {
    wms: { products: 'Barcha mahsulot va xomashyolar — yagona nazorat ostida. Namunada 100 metr mato kirim qilib ko‘ring.', warehouses: 'Omborlaringiz va ulardagi zaxiralarni boshqaring. Quyida namunaviy saqlash joylari ko‘rsatilgan.', movements: 'Har bir kirim, chiqim va ko‘chirish tarixi. 100 metr mato kirim qiling va yozuvning o‘zgarishini kuzating.' },
    erp: { orders: 'Ishlab chiqarish buyurtmalari, miqdori va bosqichlari. #1043 buyurtmani keyingi bosqichga o‘tkazib ko‘ring.', tasks: 'Buyurtmalarga tegishli ishlar, mas’ul xodimlar va bajarilish holati.', materials: 'Buyurtmaga kerakli xomashyoni ombor qoldig‘i bilan solishtiring. Yetishmayotgan materialni oldindan biling.' },
    hr: { employees: 'Xodimlar, lavozimlar va to‘lov turlari — bitta ro‘yxatda.', attendance: 'Kim ishga kelganini va bajarilgan ishni tekshiring. Dilshodning davomatini namunada belgilab ko‘ring.', payroll: 'Belgilangan oylik va qo‘shimcha haqdan yakuniy summa qanday yig‘ilganini ko‘ring. Barcha summalar namuna uchun.' },
    crm: { pipeline: 'Mijozlar, bitimlar va yozishmalar — bitta ish maydonida. Yangi mijoz qo‘shib ko‘ring.', tasks: 'Mijozga qo‘ng‘iroq qilish, taklif yuborish va uchrashuvlar uchun keyingi ishlar.', inbox: 'Telegram va Instagramdan kelgan suhbatlarning namunaviy ro‘yxati. Bu namuna haqiqiy xabar yubormaydi.' },
    lms: { groups: 'Guruh, o‘qituvchi, dars vaqti va o‘quvchilar sonini bir joyda ko‘ring.', students: 'O‘quvchilarni guruh va to‘lov holati bilan birga toping. Ism yoki guruh nomidan qidiring.', payments: 'O‘quvchi qarzdorligini tekshiring. Madinaning 450 000 so‘mlik to‘lovini namunada qayd eting.' },
  };
  const definitionForView = () => ({ ...modules[current], ...views[current][view], description: descriptions[current][view], search: current === 'wms' && view === 'products' ? 'Nomi yoki SKU…' : 'Ro‘yxatdan qidirish…' });
  const renderNavigation = () => {
    const info = navigation[current];
    $('#tour-app-name').textContent = info.name;
    $('#tour-sidebar-label').textContent = `${info.code} · ${info.name}`;
    $('#tour-sections').replaceChildren(...info.pages.map(([key, label, symbol]) => {
      const button = node('button'); button.type = 'button';
      button.append(icon(symbol), node('span', label));
      if (key === view) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => { view = key; search.value = ''; feedback.textContent = ''; render(); });
      return button;
    }));
  };
  const renderRows = () => {
    const definition = definitionForView();
    const query = search.value.trim().toLocaleLowerCase('uz');
    const rows = definition.rows().filter(row => row.join(' ').toLocaleLowerCase('uz').includes(query));
    $('#tour-record-count').textContent = `${rows.length} ta yozuv`;
    const board = $('#tour-kanban');
    const isBoard = current === 'crm' && view === 'pipeline';
    board.hidden = !isBoard;
    $('.product-table-wrap').hidden = isBoard;
    $('#tour-table-hint').hidden = isBoard;
    board.replaceChildren();
    if (isBoard) {
      for (const stage of ['Yangi', 'Taklif yuborildi', 'Muzokara', 'Savdo yopildi']) {
        const column = node('section', undefined, 'tour-stage');
        const leads = rows.filter(row => row[3] === stage);
        column.append(node('h4', `${stage} · ${leads.length}`));
        for (const row of leads) {
          const card = node('article', undefined, 'tour-lead');
          card.append(node('strong', row[0]), node('p', row[1]), node('span', `Mas’ul: ${row[2]}`));
          column.append(card);
        }
        if (!leads.length) column.append(node('p', 'Hozircha mijoz yo‘q', 'tour-stage-empty'));
        board.append(column);
      }
    }
    const body = $('#tour-body');
    body.replaceChildren();
    rows.forEach(row => {
      const tr = node('tr');
      row.forEach((value, index) => {
        const td = node('td');
        if (index === row.length - 1) td.append(node('span', value, `product-status${['Kam qoldiq', 'Kam qolgan', 'Qarzdor', 'Kutilmoqda', '7 ta yetishmaydi', 'Bugun'].includes(value) ? ' warning' : ''}`));
        else td.textContent = value;
        tr.append(td);
      });
      body.append(tr);
    });
    if (!rows.length) {
      const td = node('td', 'Hech narsa topilmadi. Boshqa so‘z bilan qidiring.', 'empty-cell');
      td.colSpan = definition.headers.length;
      const tr = node('tr'); tr.append(td); body.append(tr);
    }
  };
  const render = () => {
    const definition = definitionForView();
    $('#tour-eyebrow').textContent = definition.label;
    renderNavigation();
    const page = navigation[current].pages.find(([key]) => key === view);
    $('#tour-heading').textContent = page[1];
    $('#tour-list-label').textContent = `${page[1]} · Namuna`;
    action.hidden = !({ wms: ['products', 'movements'], erp: ['orders'], hr: ['attendance'], crm: ['pipeline'], lms: ['payments'] }[current].includes(view));
    $('#tour-description').textContent = definition.description;
    $('#tour-caption').textContent = definition.caption;
    $('#tour-takeaway').textContent = definition.takeaway;
    $('#tour-more').href = `#m-${current}`;
    $('#tour-panel').setAttribute('aria-labelledby', `tour-tab-${current}`);
    search.placeholder = definition.search;
    action.querySelector('[data-label]').textContent = definition.button();
    action.disabled = Boolean(definition.disabled?.());
    action.querySelector('use').setAttribute('href', `#icon-${action.disabled ? 'check' : current === 'erp' ? 'arrow-right' : 'plus'}`);
    action.querySelector('title').textContent = action.disabled ? 'Bajarildi' : 'Namunaviy amal';
    tabs.forEach(tab => {
      const selected = tab.dataset.tour === current;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && tab.parentElement.scrollWidth > tab.parentElement.clientWidth) {
        const strip = tab.parentElement;
        const offset = tab.getBoundingClientRect().left - strip.getBoundingClientRect().left;
        strip.scrollLeft += offset - (strip.clientWidth - tab.offsetWidth) / 2;
      }
    });
    const metrics = definition.metrics();
    const extra = { wms: ['Omborlar', '2', 'Saqlash joylari'], erp: ['Bosqichlar', '4', 'Ish ketma-ketligi'], hr: ['Davomat usuli', 'Face ID', 'Planshet ilovasi'], crm: ['Kanallar', '3', 'Telefon · Telegram · Instagram'], lms: ['Guruhlar', '3', 'Faol guruhlar'] };
    metrics.push(extra[current]);
    $('#tour-metrics').replaceChildren(...metrics.map(([label, value, note]) => {
      const box = node('div', undefined, 'product-metric');
      box.append(node('span', label), node('strong', value), node('small', note));
      return box;
    }));
    const tr = node('tr');
    definition.headers.forEach(label => { const th = node('th', label); th.scope = 'col'; tr.append(th); });
    $('#tour-head').replaceChildren(tr);
    renderRows();
  };
  const select = (key) => { current = key; view = navigation[key].pages[0][0]; search.value = ''; feedback.textContent = ''; render(); };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.tour));
    tab.addEventListener('keydown', event => {
      let next;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); select(tabs[next].dataset.tour); tabs[next].focus();
    });
  });
  search.addEventListener('input', renderRows);
  action.addEventListener('click', () => {
    if (modules[current].disabled?.()) return;
    feedback.textContent = modules[current].act(); search.value = ''; render();
  });
  $('#tourReset').addEventListener('click', () => { state = initial(); search.value = ''; render(); feedback.textContent = 'Barcha bo‘limlardagi sinov ma’lumotlari tiklandi.'; });
  document.querySelectorAll('[data-tour-link]').forEach(link => link.addEventListener('click', () => select(link.dataset.tourLink)));
  render();
})();
