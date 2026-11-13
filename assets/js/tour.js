import { demoReport } from './demo-reports.js';
import { renderDemoDashboard, renderDemoBuilder } from './demo-dashboard.js';
/* Interactive product illustration. All state is in memory and is reset on reload. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const tabs = [...document.querySelectorAll('[data-tour]')];
  const search = $('#tour-search');
  const action = $('#tour-action');
  const feedback = $('#tour-feedback');
  const initial = () => ({ cotton: 1240, stage: 0, attendance: false, leads: 0, paid: false, cart: {}, receipts: 0, moved: {}, created: {} });
  let state = initial();
  let current = 'wms';
  let view = 'dashboard';
  const count = (value) => new Intl.NumberFormat('ru-RU').format(value).replace(/\u00a0/g, ' ');
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
    // Snapshot of the actual app's module-navigation.ts; no authenticated app code is shipped.
  modules.wms.metrics = () => [['Jami mahsulotlar','4 tur','3 kategoriya'],['Ombor qiymati',count(state.cotton*35000+38874000),'Barcha omborlar bo‘yicha'],['Kam qolgan','1 tur','Zaxirani to‘ldirish kerak'],['Tugagan','0 tur','Qoldig‘i mavjud emas']];
  modules.erp.metrics = () => [['Rejalashtirilgan','1',''],['Jarayonda',state.stage===4?'1':'2',''],['Muddati o‘tgan','0',''],['Xomashyo kamomadi','1',''],['Ijrochisiz bosqichlar','0',''],['Vazifalarim','2','']];
  modules.hr.metrics = () => [['Faol xodimlar','4','0 arxivda'],['Bo‘limlar','2','4 lavozim'],['Smenalar','1','Moslashuvchan ish tartibi'],['Qo‘shimcha maydonlar','0','Biznesingizga xos ma’lumotlar']];
  modules.crm.metrics = () => [['Ochiq bitimlar',String(3+state.leads),'faol savdo imkoniyatlari'],['Ochiq bitimlar summasi','7 500 000 so‘m','ochiq bitimlar summasi'],['Muddati o‘tgan vazifalar','1','qo‘ng‘iroq, uchrashuv, vazifa'],['G‘alaba darajasi','50%','yopilgan bitimlar ichida'],['Yangi xabarlar','2','Telegram · Instagram']];
  modules.lms.metrics = () => [['O‘qiyotgan o‘quvchilar','4','4 faol kartochka'],['Faol guruhlar','3','Bugun 2 ta dars'],['Shu oy tushum',state.paid?'450 000':'0','To‘lovlar'],['Umumiy qarzdorlik',state.paid?'250 000':'700 000','Bugungi holat bo‘yicha']];
  const sidebarContract = {"wms": [["dashboard", "Hisobotlar", "chart-no-axes-combined"], ["products", "Mahsulotlar", "package"], ["warehouses", "Omborlar", "warehouse"], ["movements", "Ombor harakatlari", "arrow-left-right"], ["recipes", "Retseptlar", "list-tree"], ["reports", "Hisobot konstruktori", "table-properties"], ["settings", "Sozlamalar", "settings-2"]], "erp": [["dashboard", "Hisobotlar", "chart-no-axes-combined"], ["orders", "Buyurtmalar", "clipboard-list"], ["tasks", "Vazifalar", "list-todo"], ["materials", "Xomashyo ehtiyoji", "package-search"], ["defects", "Brak tahlili", "chart-no-axes-column"], ["reports", "Hisobot konstruktori", "table-properties"], ["settings", "Sozlamalar", "settings-2"]], "hr": [["dashboard", "Hisobotlar", "chart-no-axes-combined"], ["employees", "Xodimlar", "users"], ["attendance", "Davomat", "calendar-check"], ["payroll", "Ish haqi", "banknote"], ["faceid", "FaceID terminal", "scan-face"], ["reports", "Hisobot konstruktori", "table-properties"], ["settings", "Sozlamalar", "settings-2"]], "crm": [["dashboard", "Hisobotlar", "chart-no-axes-combined"], ["pipeline", "Savdo voronkasi", "kanban"], ["tasks", "Vazifalar", "list-todo"], ["inbox", "Demo inbox", "inbox"], ["connections", "Kanallar", "plug"], ["reports", "Hisobot konstruktori", "table-properties"], ["settings", "Sozlamalar", "settings-2"]], "lms": [["dashboard", "Hisobotlar", "chart-no-axes-combined"], ["groups", "Guruhlar", "users-round"], ["students", "O‘quvchilar", "graduation-cap"], ["journal", "Davomat", "calendar-check"], ["grades", "Baholar", "star"], ["payments", "To‘lovlar", "wallet"], ["portal", "Kabinetlar", "key-round"], ["courses", "Kurslar va ustozlar", "book-open"], ["reports", "Hisobot konstruktori", "table-properties"], ["settings", "Sozlamalar", "settings-2"]], "pos": [["sale", "Kassa", "scan-barcode"], ["history", "Sotuvlar", "receipt"], ["debts", "Nasiyalar", "hand-coins"], ["shifts", "Smenalar", "clock"], ["branches", "Filiallar", "store"], ["reports", "Hisobot konstruktori", "table-properties"]]};
  navigation.pos = { name: 'Do‘kon kassasi', code: 'POS', pages: [] };
  for (const [key, pages] of Object.entries(sidebarContract)) navigation[key].pages = pages;
  const defaults = { wms: 'dashboard', erp: 'dashboard', hr: 'dashboard', crm: 'dashboard', lms: 'dashboard', pos: 'sale' };
  let filters = {};
  const table = (headers, rows) => ({ headers, rows: typeof rows === 'function' ? rows : () => rows, statusLast: false });
  const money = n => `${count(n)} so‘m`;
  modules.pos = {
    label: 'KASSA', caption: 'Namunaviy kassa savdosi', search: 'Nomi, SKU yoki shtrix-kod…',
    metrics: () => [['Bugun', money(state.receipts * 120000), `${state.receipts} chek`], ['Nasiya', '20 000 so‘m', '1 ta'], ['Filial', 'Asosiy do‘kon', 'Asosiy ombor']],
    button: () => 'To‘lov qilish', act: () => '', takeaway: 'Savdo, to‘lov, nasiya va smena — ombor qoldig‘i bilan bir hisobda.'
  };
  views.pos = {
    sale: table([], []),
    history: table(['Chek', 'Sana', 'Mijoz', 'Jami', 'To‘langan', 'Qarz', 'Holat'], () => [['#0001', '05.11.2026', 'Madina R.', '150 000', '130 000', '20 000', 'Nasiya'], ...Array.from({length:state.receipts}, (_, i) => [`#000${i+2}`, '05.11.2026', 'Chakana xaridor', '120 000', '120 000', '0', 'To‘langan'])]),
    debts: table(['Chek', 'Mijoz', 'Telefon', 'Jami', 'Qarz'], [['#0001', 'Madina R.', '+998 90 123 45 67', '150 000', '20 000']]),
    shifts: table(['Smena', 'Filial', 'Ochildi', 'Kassir', 'Boshlang‘ich naqd', 'Holat'], [['#12', 'Asosiy do‘kon', '05.11.2026 · 09:00', 'Aziz Karimov', '500 000', 'Ochiq']]),
    branches: table(['Filial', 'Manzil', 'Telefon', 'Ombor', 'Holat'], [['Asosiy do‘kon', 'Toshkent', '+998 90 123 45 67', 'Asosiy ombor', 'Faol'], ['Chilonzor', 'Chilonzor tumani', '+998 90 234 56 78', 'Filial ombori', 'Faol']]),
  };
  descriptions.pos = { sale: 'Asosiy do‘kon · Asosiy ombor · Smena #12 ochiq', history: 'Sotuvlar, to‘lovlar va qaytarishlar tarixi.', debts: 'Mijozlar bo‘yicha qolgan qarzlar.', shifts: 'Kassa ochilishi, yopilishi va naqd pul hisobi.', branches: 'Savdo nuqtalari va ularga biriktirilgan omborlar.' };
  views.wms.products = table(['Mahsulot', 'SKU', 'Kategoriya', 'Qoldiq', 'Narxi', 'Jami qiymat', 'Holat'], () => [
    ['Paxta mato, oq','MAT-001','Xomashyo',`${count(state.cotton)} m`,'35 000',count(state.cotton*35000),'Mavjud'],
    ['Tugma 12 mm','TUG-012','Furnitura','8 600 dona','150','1 290 000','Mavjud'],
    ['Ko‘ylak, M','KOY-001','Tayyor mahsulot','312 dona','120 000','37 440 000','Mavjud'],
    ['Ip, qora','IP-004','Xomashyo','18 g‘altak','8 000','144 000','Kam qolgan']]);
  views.wms.products.statusLast = true;
  views.wms.movements = table(['Sana','Mahsulot','Harakat turi','Ombor','Miqdor','Izoh'], () => [['05.11.2026','Paxta mato, oq','Kirim','Asosiy ombor',`${count(state.cotton-1140)} m`,'Yetkazib beruvchidan'],['05.11.2026','Tugma 12 mm','Chiqim','Asosiy ombor','300 dona','#1043 buyurtma']]);
  views.wms.recipes = table(['Mahsulot','Xomashyo','Miqdor','Birlik'], [['Ko‘ylak','Paxta mato, oq','2,5','m'],['Ko‘ylak','Tugma 12 mm','6','dona'],['Ko‘ylak','Ip, qora','40','m']]);
  views.erp.orders = table(['Buyurtma','Mahsulot','Miqdor','Bosqich','Muddat','Holat','Xarajat (UZS)','Mas’ul'], () => [['#1043 · Nur do‘koni','Ko‘ylak','50 dona',['Bichish','Tikish','Dazmol','Qadoqlash','Yakunlandi'][state.stage],'10.11.2026',state.stage===4?'Yakunlandi':'Jarayonda','4 375 000','Malika A.'],['#1042 · Bahor','Forma','120 dona','Tikish','12.11.2026','Jarayonda','8 400 000','Aziza K.'],['#1041 · Atlas','Ko‘ylak','300 dona','Yakunlandi','04.11.2026','Yakunlandi','21 000 000','Malika A.']]);
  views.erp.materials = table(['Xomashyo','Ombor','Kerak','Omborda','Yetishmaydi','Buyurtmalar'], () => [['Paxta mato, oq','Asosiy ombor','125 m',`${count(state.cotton)} m`,'—','#1043'],['Tugma 12 mm','Asosiy ombor','300 dona','8 600 dona','—','#1043'],['Ip, qora','Asosiy ombor','25 g‘altak','18 g‘altak','7 g‘altak','#1043']]);
  views.erp.defects = table(['Mahsulot','Buyurtmalar','Ishlab chiqarildi','Brak','Brak ulushi'], [['Ko‘ylak','2','350 dona','3 dona','0,86%'],['Forma','1','120 dona','1 dona','0,83%']]);
  views.hr.employees = table(['Xodim','Bo‘lim / lavozim','Smena','Ish haqi stavkalari','Ishga kirgan'], [['Malika A.','Ishlab chiqarish / Tikuvchi','Kunduzgi','Fiksa: 2 000 000 · Donabay: 5 000','01.09.2026'],['Aziza K.','Ishlab chiqarish / Bichuvchi','Kunduzgi','Soatbay: 20 000','15.08.2026'],['Dilshod S.','Ishlab chiqarish / Qadoqlovchi','Kunduzgi','Kunbay: 120 000','01.10.2026'],['Sardor B.','Ombor / Omborchi','Kunduzgi','Fiksa: 3 000 000','01.07.2026']]);
  views.hr.attendance = table(['Sana / xodim','Holat','Soat','Dona','Savdo','Bonus / ushlanma'], () => [['05.11.2026 · Malika A.','Ishladi','8','24','—','—'],['05.11.2026 · Aziza K.','Ishladi','8','—','—','—'],['05.11.2026 · Dilshod S.',state.attendance?'Ishladi':'Belgilanmagan',state.attendance?'8':'—','—','—','—'],['05.11.2026 · Sardor B.','Ishladi','8','—','—','—']]);
  views.hr.payroll = table(['Xodim','Kun / soat','Fiksa','Soatbay','Kunbay','Donabay','Savdodan %','Bonus','Ushlanma','Jami'], [['Malika A.','22 / 176','2 000 000','—','—','2 400 000','—','—','—','4 400 000'],['Aziza K.','20 / 160','—','3 200 000','—','—','—','—','—','3 200 000'],['Sardor B.','22 / 176','3 000 000','—','—','—','—','200 000','—','3 200 000']]);
  views.hr.faceid = table(['Xodim','Yuz rasmlari','Terminal','Oxirgi belgi','Holat'], [['Malika A.','3 ta','Kirish eshigi','05.11 · 08:57 · Keldi','Ulangan'],['Aziza K.','3 ta','Kirish eshigi','05.11 · 08:59 · Keldi','Ulangan']]);
  views.crm.connections = table(['Kanal','Nomi','Holat'], [['Telegram bot','FlowCore namuna','Ulangan'],['Instagram','Namuna do‘kon','Ulanmagan']]);
  views.lms.groups = table(['Guruh','Ustoz','Jadval','Muddat','O‘quvchilar'], [['Ingliz tili B1','Nigora S.','Du, Ch, Ju · 14:00–15:30','01.09–31.12.2026','2 / 12'],['Matematika','Jasur A.','Se, Pa · 16:00–17:30','01.10–31.12.2026','1 / 10'],['IT boshlang‘ich','Akmal R.','Du, Ch · 18:00–19:30','01.09–31.12.2026','1 / 10']]);
  views.lms.journal = table(['O‘quvchi','Guruh','05.11.2026','Izoh'], [['Madina R.','Ingliz tili B1','Keldi','—'],['Shahnoza A.','Ingliz tili B1','Keldi','—'],['Javohir S.','Matematika','Kelmadi','Sababli']]);
  views.lms.grades = table(['O‘quvchi','Guruh','Nazorat','Baho','Sana'], [['Madina R.','Ingliz tili B1','Oraliq nazorat','86 / 100','04.11.2026'],['Shahnoza A.','Ingliz tili B1','Oraliq nazorat','92 / 100','04.11.2026']]);
  views.lms.portal = table(['O‘quvchi','Kabinet','Login','Holat'], [['Madina R.','O‘quvchi','madina.r','Faol'],['Javohir S.','Ota-ona','javohir.parent','Faol']]);
  views.lms.courses = table(['Kurs','Ustoz','Oylik to‘lov','Holat'], [['Ingliz tili','Nigora S.','450 000','Faol'],['Matematika','Jasur A.','350 000','Faol'],['IT boshlang‘ich','Akmal R.','600 000','Faol']]);
  // Primary pages use the same headings, density and column order as the app.
  for (const key of Object.keys(navigation)) {
    for (const [page] of navigation[key].pages) {
      if (!views[key][page]) views[key][page] = table(['Ko‘rsatkich','Qiymat'], [['Namuna kompaniya','FlowCore'],['Hisob valyutasi','UZS']]);
    }
  }
  const matchesFilters = row => {
    if (filters.stock === 'Kam qolgan' && !row.includes('Kam qolgan')) return false;
    if (filters.stock === 'Tugagan' && !row.includes('Tugagan')) return false;
    return Object.entries(filters).every(([key, value]) => key==='stock' || !value || row.join(' ').includes(value));
  };
  const selectFilter = (label, options, key) => {
    const el = node('select'); el.setAttribute('aria-label',label);
    for (const [value,text] of [['',label], ...options.map(value=>[value,value])]) {const option=node('option',text);option.value=value;el.append(option);}
    el.value=filters[key]||'';el.addEventListener('change',()=>{filters[key]=el.value;renderRows();});return el;
  };
  const makeButton = (text, handler, cls='tour-ui-button') => {const button=node('button',text,cls);button.type='button';button.addEventListener('click',handler);return button;};
  const productCatalog = [['Ko‘ylak, M','KOY-001',120000,312],['Paxta mato, oq','MAT-001',35000,1240],['Tugma 12 mm','TUG-012',150,8600],['Ip, qora','IP-004',8000,18]];
  const renderPos = query => {
    $('#tour-kanban').hidden=true;$('.product-table-wrap').hidden=true;$('#tour-table-hint').hidden=true;$('#tour-pager').hidden=true;
    const special=$('#tour-special');special.hidden=false;special.replaceChildren();
    const layout=node('div',undefined,'tour-pos-layout');const goods=node('div',undefined,'tour-pos-products');
    const matching=productCatalog.filter(p=>`${p[0]} ${p[1]}`.toLocaleLowerCase('uz').includes(query));
    $('#tour-record-count').textContent=`${matching.length} ta mahsulot`;
    for(const [name,sku,price,qty] of matching){const button=makeButton('',()=>{state.cart[sku]=(state.cart[sku]||0)+1;renderPos(query);},'tour-pos-item');button.append(icon('warehouse'),node('strong',name),node('small',`${sku} · ${qty} dona`),node('b',money(price)));goods.append(button);}
    if(!matching.length)goods.append(node('p','Mahsulot topilmadi.'));
    const cart=node('div',undefined,'tour-pos-cart');cart.append(node('h4','Savatcha'));
    let total=0;
    for(const [name,sku,price] of productCatalog){const qty=state.cart[sku]||0;if(!qty)continue;total+=qty*price;const line=node('div',undefined,'tour-cart-line');line.append(node('strong',name),node('span',money(qty*price)));const controls=node('div',undefined,'tour-cart-controls');controls.append(makeButton('−',()=>{state.cart[sku]=Math.max(0,qty-1);renderPos(query);}),node('span',`${qty} × ${count(price)}`),makeButton('+',()=>{state.cart[sku]=qty+1;renderPos(query);}));line.append(controls);cart.append(line);}
    if(!total)cart.append(node('p','Tovarni bosing yoki skanerlang.','tour-cart-empty'));
    const sum=node('div',undefined,'tour-cart-total');sum.append(node('span','Jami'),node('strong',money(total)));cart.append(sum);
    const pay=makeButton('To‘lov qilish',()=>{const amount=money(total);state.receipts++;state.cart={};render();feedback.textContent=`Namuna savdosi: ${amount} naqd to‘lov qayd etildi. Haqiqiy pul operatsiyasi bajarilmadi.`;},'tour-ui-button primary');pay.disabled=!total;cart.append(pay,node('small','Namuna savdosi · haqiqiy to‘lov olinmaydi'));layout.append(goods,cart);special.append(layout);
  };
  const primaryLabels={wms:{products:'Mahsulot qo‘shish',warehouses:'Ombor qo‘shish',movements:'Harakat qo‘shish',recipes:'Retsept qo‘shish'},erp:{orders:'Buyurtma yaratish'},hr:{employees:'Xodim qo‘shish',attendance:'Davomat kiritish'},crm:{pipeline:'Mijoz qo‘shish',tasks:'Vazifa qo‘shish'},lms:{groups:'Guruh ochish',students:'O‘quvchi qo‘shish',payments:'To‘lov kiritish'},pos:{branches:'Filial qo‘shish',shifts:'Smena ochish'}};
  const openCreate = () => { feedback.textContent = 'Bu ekran tanishish uchun namuna. To‘liq dasturda ushbu tugma tegishli oynani ochadi.'; };
  const renderWorkspace = () => {
    const special=$('#tour-special');special.replaceChildren();special.hidden=true;
    const isSpecial=['dashboard','reports','settings','inbox','faceid'].includes(view);
    $('.product-frame').dataset.app=current;$('.product-frame').dataset.view=view;
    const stats=$('#tour-stats');stats.hidden=current==='pos';stats.classList.toggle('always-open',current==='wms'&&view==='products');stats.open=true;stats.hidden=['dashboard','reports'].includes(view);
    const actions=$('#tour-primary-actions');actions.replaceChildren();
    const label=primaryLabels[current]?.[view];if(current==='wms' && view==='products') actions.append(makeButton('↓ Eksport',()=>{ feedback.textContent='To‘liq dasturda mahsulotlar ro‘yxati eksport qilinadi.'; })); if(label)actions.append(makeButton('+ '+label,openCreate,'tour-ui-button primary'));
    const controls=$('#tour-filters');controls.replaceChildren();
    if(current==='wms'&&view==='products'){
      const stock=node('div',undefined,'tour-segmented');for(const text of ['Barchasi','Kam qolgan','Tugagan']){const btn=makeButton(text,()=>{filters.stock=text==='Barchasi'?'':text;stock.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));renderRows();});btn.setAttribute('aria-pressed',String((filters.stock||'Barchasi')===text));stock.append(btn);}controls.append(stock,selectFilter('Barcha kategoriyalar',['Xomashyo','Furnitura','Tayyor mahsulot'],'category'));
    }
    if(current==='crm'&&view==='pipeline')controls.append(selectFilter('Barcha mas’ullar',['Aziza','Sardor'],'owner'),selectFilter('Barcha bosqichlar',['Yangi','Taklif yuborildi','Muzokara','Savdo yopildi'],'stage'));
    if(current==='lms'&&view==='groups')controls.append(selectFilter('Barcha ustozlar',['Nigora S.','Jasur A.','Akmal R.'],'teacher'));
    if(current==='hr'&&view==='employees')controls.append(selectFilter('Barcha bo‘limlar',['Ishlab chiqarish','Ombor'],'department'));
    const pager=$('#tour-pager');pager.hidden=isSpecial;pager.replaceChildren(node('span','1–4 · Namuna yozuvlari'),node('span','Sahifada: 20     ‹  1  ›'));
    $('.product-toolbar').hidden=isSpecial;controls.hidden=isSpecial;
    $('.tour-view-label').hidden=isSpecial;
    if(isSpecial) { special.hidden=false;special.append(node('p',navigation[current].pages.find(([key])=>key===view)[1],'tour-section-title')); }
    if(view==='dashboard'){
      renderDemoDashboard(special,demoReport(current,state));
    } else if(view==='reports'){
      renderDemoBuilder(special,demoReport(current,state));
      if(current==='pos'){const dashboard=node('section');renderDemoDashboard(dashboard,demoReport(current,state));special.append(dashboard);}
    } else if(view==='settings'){
      const settings=node('div',undefined,'tour-settings');for(const [label,value] of [['Biznes nomi','Namuna kompaniya'],['Hisob valyutasi','UZS'],['Ish hajmi birligi','dona']]){const field=node('label',label);const input=node('input');input.value=value;field.append(input);settings.append(field);}settings.append(makeButton('Saqlash',()=>{feedback.textContent='Namuna sozlamalari saqlandi. Sahifa yangilanganda tiklanadi.';},'tour-ui-button primary'));special.append(settings);
    } else if(view==='inbox'){
      const inbox=node('div',undefined,'tour-inbox');const list=node('div',undefined,'tour-inbox-list');const thread=node('div',undefined,'tour-inbox-thread');
      const show=(name,message)=>{thread.replaceChildren(node('h4',name),node('p',message,'tour-chat-bubble'),node('small','Demo inbox · namunaviy suhbat'));};
      for(const [name,,message] of views.crm.inbox.rows())list.append(makeButton(`${name}\n${message}`,()=>show(name,message)));show('Madina R.','Ko‘ylak narxi qancha?');inbox.append(list,thread);special.append(inbox);
    } else if(view==='faceid'){
      const face=node('div',undefined,'tour-faceid-panel');face.append(icon('circle-user-round'),node('h4','FaceID terminal'),node('p','Kirish eshigi · Android planshet'),node('span','Ulangan · oxirgi sinxronlash 09:00','product-status'),makeButton('Davomat namunasini ko‘rish',()=>{view='attendance';render();}));special.append(face);
    }
    const subtitles={erp:'Rejadan tayyor mahsulotgacha — biznesingizga mos jarayon.',hr:'Xodimlar, davomat va biznesingizga mos ish haqi.',crm:'Mijozlar, bitimlar va yozishmalar — bitta ish maydonida.',lms:'Kurslar, guruhlar, davomat, baholar va to‘lovlar — tashkilotingiz tartibida.'};
    if(subtitles[current]) $('#tour-description').textContent=subtitles[current];
    if(current==='wms') $('#tour-description').textContent=({products:'Barcha mahsulot va xomashyolar — yagona nazorat ostida.',warehouses:'Omborlaringiz va ulardagi zaxiralarni boshqaring.',movements:'Har bir kirim, chiqim va ko‘chirish tarixi.',recipes:'Istalgan mahsulot tarkibi, sarf me’yori va ishlab chiqarish hisobi.'})[view]||descriptions.wms[view]||'';
    if(current==='pos') { $('#tour-sidebar-label').textContent='Kassa'; $('#tour-page-title').textContent=`Kassa · ${navigation.pos.pages.find(([key])=>key===view)[1]}`; }
    $('#tour-eyebrow').textContent={wms:'OMBOR BOSHQARUVI',erp:'ERP / ISHLAB CHIQARISH',hr:'HR / Namuna kompaniya',crm:'MIJOZLAR BILAN MUNOSABAT',lms:'LMS / Namuna kompaniya',pos:'KASSA'}[current];
  };

  views.pos.history = table(['Chek','Sana','Filial','Mijoz','Jami','Qarz','Holat'], () => demoReport('pos',state).sections[0].rows.map(r=>[r.number,r.date,r.branch,r.customer,count(r.total),count(r.debt),r.status]));
  views.pos.debts = table(['Chek','Mijoz','Telefon','Jami','Qarz'], () => demoReport('pos',state).sections[0].rows.filter(r=>r.debt>0).map(r=>[r.number,r.customer,'+998 90 123 45 67',count(r.total),count(r.debt)]));
  views.hr.payroll = table(['Xodim','Kun / soat','Fiksa','Soatbay','Kunbay','Donabay','Savdodan %','Bonus','Ushlanma','Jami'],()=>demoReport('hr',state).sections[0].rows.map(r=>[r.name,`${r.days} / ${r.hours}`,...['fixed','hourly','daily','piece','commission','bonus','deduction','total'].map(key=>r[key]?count(r[key]):'—')]));
  modules.lms.metrics = () => {const report=demoReport('lms',state);return [['O‘qiyotgan o‘quvchilar','4','4 faol kartochka'],['Faol guruhlar','3','Bugun 2 ta dars'],['Shu oy tushum',count(report.metrics[1].value),`${report.metrics[5].value} ta to‘lov`],['Umumiy qarzdorlik',count(report.metrics[2].value),'Bugungi holat bo‘yicha']];};
  modules.pos.metrics = () => {const report=demoReport('pos',state);return report.metrics.slice(0,4).map(m=>[m.label,count(m.value),m.unit||'Namuna']);};
  const definitionForView = () => ({ ...modules[current], ...views[current][view], description: descriptions[current][view] || `${navigation[current].pages.find(([key]) => key === view)[1]} — namuna ma’lumotlar.`, search: current === 'wms' && view === 'products' ? 'Nomi yoki SKU…' : 'Ro‘yxatdan qidirish…' });
  const renderNavigation = () => {
    const info = navigation[current];
    $('#tour-app-name').textContent = info.name;
    $('#tour-sidebar-label').textContent = info.code;
    $('#tour-sections').replaceChildren(...info.pages.map(([key, label, symbol]) => {
      const button = node('button'); button.type = 'button';
      button.append(icon(symbol), node('span', label));
      if (key === view) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => { view = key; filters = {}; search.value = ''; feedback.textContent = ''; render(); $('#tour-panel').scrollTop = 0; });
      return button;
    }));
  };
  const renderRows = () => {
    const definition = definitionForView();
    if (['dashboard','reports','settings','inbox','faceid'].includes(view)) { $('#tour-kanban').hidden=true; $('.product-table-wrap').hidden=true; $('#tour-table-hint').hidden=true; return; }
    const query = search.value.trim().toLocaleLowerCase('uz');
    const rows = [...(state.created[`${current}:${view}`] || []), ...definition.rows()].filter(row => row.join(' ').toLocaleLowerCase('uz').includes(query)).filter(row => matchesFilters(row));
    $('#tour-record-count').textContent = `${rows.length} ta yozuv`;
    $('#tour-pager').replaceChildren(node('span',`${rows.length} tadan ${rows.length ? 1 : 0}–${rows.length}`),node('span','Standart tartib    ·    20    ·    1'));
    const board = $('#tour-kanban');
    const isBoard = current === 'crm' && view === 'pipeline';
    if (current === 'pos' && view === 'sale') { renderPos(query); return; }
    board.hidden = !isBoard;
    $('.product-table-wrap').hidden = isBoard;
    $('#tour-table-hint').hidden = isBoard;
    board.replaceChildren();
    if (isBoard) {
      for (const stage of ['Yangi', 'Taklif yuborildi', 'Muzokara', 'Savdo yopildi']) {
        const column = node('section', undefined, 'tour-stage');
        const leads = rows.filter(row => (state.moved[row[0]] || row[3]) === stage);
        column.append(node('h4', `${stage} · ${leads.length}`));
        for (const row of leads) {
          const card = node('article', undefined, 'tour-lead');
          card.append(node('strong', row[0]), node('p', '1 500 000 so‘m', 'tour-deal-value'), node('span', `${row[2]} · ${row[1]}`));
          const move = node('select'); move.setAttribute('aria-label', `${row[0]} bosqichi`);
          for (const label of ['Yangi', 'Taklif yuborildi', 'Muzokara', 'Savdo yopildi']) { const option = node('option', label); option.value = label; option.selected = label === stage; move.append(option); }
          move.addEventListener('change', () => { state.moved[row[0]] = move.value; renderRows(); feedback.textContent = `${row[0]}: ${move.value}.`; }); card.append(move);
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
        if (definition.statusLast !== false && index === row.length - 1) td.append(node('span', value, `product-status${['Kam qoldiq', 'Kam qolgan', 'Qarzdor', 'Kutilmoqda', '7 ta yetishmaydi', 'Bugun'].includes(value) ? ' warning' : ''}`));
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
    $('#tour-heading').textContent = { erp: 'Ishlab chiqarish', hr: 'Jamoangiz. Sizning tartibingiz.', crm: 'Mijozlar va savdo', lms: 'Ta’lim jarayoni bir joyda', pos: 'Do‘kon kassasi' }[current] || page[1];
    $('#tour-page-title').textContent = `${navigation[current].code} · ${page[1]}`;
    $('#tour-list-label').textContent = `${page[1]} · Namuna`;
    action.hidden = !({ wms: ['products', 'movements'], erp: ['orders'], hr: ['attendance'], crm: ['pipeline'], lms: ['payments'], pos: [] }[current].includes(view));
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
    const extra = { wms: ['Omborlar', '2', 'Saqlash joylari'], erp: ['Bosqichlar', '4', 'Ish ketma-ketligi'], hr: ['Davomat usuli', 'Face ID', 'Planshet ilovasi'], crm: ['Kanallar', '3', 'Telefon · Telegram · Instagram'], lms: ['Guruhlar', '3', 'Faol guruhlar'], pos: ['Smena', '#12', 'Ochiq'] };
    if(current==='pos') metrics.push(extra[current]);
    $('#tour-metrics').replaceChildren(...metrics.map(([label, value, note]) => {
      const box = node('div', undefined, 'product-metric');
      box.append(node('span', label), node('strong', value), node('small', note));
      return box;
    }));
    const tr = node('tr');
    definition.headers.forEach(label => { const th = node('th', label); th.scope = 'col'; tr.append(th); });
    $('#tour-head').replaceChildren(tr);
    renderWorkspace();
    renderRows();
  };
  const select = (key) => { current = key; view = defaults[key]; filters = {}; search.value = ''; feedback.textContent = ''; render(); $('#tour-panel').scrollTop = 0; };
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
  $('#tourReset').addEventListener('click', () => { state = initial(); filters = {}; search.value = ''; render(); feedback.textContent = 'Barcha bo‘limlardagi sinov ma’lumotlari tiklandi.'; });
  document.querySelectorAll('[data-tour-link]').forEach(link => link.addEventListener('click', () => select(link.dataset.tourLink)));
  render();
})();
