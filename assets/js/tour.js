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
  const count = (value) => new Intl.NumberFormat('uz-UZ').format(value);
  const modules = {
    wms: {
      label: 'WMS / Ombor boshqaruvi', title: 'Qoldiqni taxmin qilmang.',
      description: 'Qaysi mahsulot qancha qoldi, nimani buyurtma qilish kerak — bir qarashda ko‘ring.',
      search: 'Mahsulot nomini qidiring', caption: 'Namunaviy ombor qoldiqlari',
      headers: ['Mahsulot', 'Ombor', 'Qoldiq', 'Holat'],
      metrics: () => [['Mahsulot turi', '4', 'Namuna katalogi'], ['Oq mato', `${count(state.cotton)} m`, 'Asosiy ombor'], ['Kam qoldiq', '1', 'Xarid kerak']],
      rows: () => [['Paxta mato, oq', 'Asosiy ombor', `${count(state.cotton)} m`, 'Yetarli'], ['Tugma 12 mm', 'Asosiy ombor', '8 600 dona', 'Yetarli'], ['Ko‘ylak, M', 'Tayyor mahsulot', '312 dona', 'Yetarli'], ['Ip, qora', 'Asosiy ombor', '18 g‘altak', 'Kam qoldiq']],
      button: () => '100 m mato kirim',
      act() { state.cotton += 100; return `100 m oq mato kirim qilindi. Yangi qoldiq: ${count(state.cotton)} m.`; },
      takeaway: 'Natija: xaridni qoldiqqa qarab rejalashtirasiz, xomashyo yetishmovchiligini oldindan ko‘rasiz.',
    },
    erp: {
      label: 'ERP / Ishlab chiqarish', title: 'Buyurtma qaysi bosqichda?',
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
      label: 'HR / Xodimlar va ish haqi', title: 'Har bir ish kuni hisobda.',
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
      label: 'CRM / Mijozlar bilan ishlash', title: 'Har bir murojaatning davomi bor.',
      description: 'Mijoz qaysi kanaldan keldi, kim javobgar va keyingi qadam nima — bitta voronkada. Yangi lid qo‘shib ko‘ring.',
      search: 'Mijoz yoki kanalni qidiring', caption: 'Namunaviy mijozlar voronkasi',
      headers: ['Mijoz', 'Kanal', 'Mas’ul', 'Holat'],
      metrics: () => [['Murojaatlar', String(4 + state.leads), 'Namunaviy voronka'], ['Yangi lid', String(1 + state.leads), 'Birinchi suhbat kerak'], ['Yopilgan bitim', '1', 'Nur do‘koni']],
      rows: () => [...Array.from({ length: state.leads }, (_, i) => [`Yangi mijoz ${state.leads - i}`, 'Telegram', 'Aziza', 'Yangi']), ['Nur do‘koni', 'Telefon', 'Sardor', 'Bitim yopildi'], ['Madina R.', 'Telegram', 'Aziza', 'Yangi'], ['Atlas', 'Instagram', 'Sardor', 'Taklif yuborildi'], ['Ziyo', 'Telefon', 'Aziza', 'Muzokara']],
      button: () => state.leads >= 10 ? 'Namuna limiti: 10 ta lid' : 'Namunaviy lid', disabled: () => state.leads >= 10,
      act() { state.leads++; return `Telegramdan “Yangi mijoz ${state.leads}” qo‘shildi va Azizaga biriktirildi.`; },
      takeaway: 'Natija: javobsiz qolgan murojaatni ko‘rasiz va mijoz bilan keyingi suhbatni unutmay qo‘yasiz.',
    },
    lms: {
      label: 'LMS / O‘quv markazi', title: 'Dars ham, to‘lov ham nazoratda.',
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
  const renderRows = () => {
    const definition = modules[current];
    const query = search.value.trim().toLocaleLowerCase('uz');
    const rows = definition.rows().filter(row => row.join(' ').toLocaleLowerCase('uz').includes(query));
    const body = $('#tour-body');
    body.replaceChildren();
    rows.forEach(row => {
      const tr = node('tr');
      row.forEach((value, index) => {
        const td = node('td');
        if (index === row.length - 1) td.append(node('span', value, `product-status${['Kam qoldiq', 'Qarzdor', 'Kutilmoqda'].includes(value) ? ' warning' : ''}`));
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
    const definition = modules[current];
    $('#tour-eyebrow').textContent = definition.label;
    $('#tour-heading').textContent = definition.title;
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
    });
    $('#tour-metrics').replaceChildren(...definition.metrics().map(([label, value, note]) => {
      const box = node('div', undefined, 'product-metric');
      box.append(node('span', label), node('strong', value), node('small', note));
      return box;
    }));
    const tr = node('tr');
    definition.headers.forEach(label => { const th = node('th', label); th.scope = 'col'; tr.append(th); });
    $('#tour-head').replaceChildren(tr);
    renderRows();
  };
  const select = (key) => { current = key; search.value = ''; feedback.textContent = ''; render(); };
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
  $('#tourReset').addEventListener('click', () => { state = initial(); search.value = ''; render(); feedback.textContent = 'Barcha modullarning namuna ma’lumotlari tiklandi.'; });
  document.querySelectorAll('[data-tour-link]').forEach(link => link.addEventListener('click', () => select(link.dataset.tourLink)));
  render();
})();
