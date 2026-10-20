/* FlowCore landing — vanilla JS */
(() => {
  'use strict';

  /*
   * Lead delivery. Set ONE of these before going live:
   * - endpoint: a URL that accepts a JSON POST (your backend, Formspree, etc.)
   * - telegramUsername: opens a prefilled Telegram chat (without "@")
   * - email: opens the visitor's mail app with a prefilled message
   */
  const CONTACT = {
    endpoint: window.FLOWCORE_LEADS_ENDPOINT || '/api/public/leads',
    telegramUsername: '',
    email: 'info@flowcore.uz',
  };

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const setLabel = (element, text) => {
    (element.querySelector('[data-label]') || element).textContent = text;
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const group = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const signed = (n) => (n < 0 ? `−${group(-n)}` : group(n));
  const tashkentTime = (offsetMin = 0) =>
    new Date(Date.now() - offsetMin * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent' });

  /* ---------- Theme ---------- */
  const themeBtn = $('#themeToggle');
  const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (darkMq.matches ? 'dark' : 'light');
  const syncThemeLabel = () => {
    themeBtn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Kunduzgi rejimga o‘tish' : 'Tungi rejimga o‘tish');
  };
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    try { localStorage.setItem('fc-theme', theme); } catch { /* storage unavailable */ }
    syncThemeLabel();
  };
  themeBtn.addEventListener('click', (e) => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduceMotion) { applyTheme(next); return; }
    const r = themeBtn.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => applyTheme(next)).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => { /* theme stays applied if the visual transition fails */ });
  });
  darkMq.addEventListener('change', syncThemeLabel);
  syncThemeLabel();

  /* ---------- Header, progress, active nav ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  let scrollFrame = 0;
  const onScroll = () => {
    scrollFrame = 0;
    header.classList.toggle('scrolled', scrollY > 8);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : 0);
  };
  onScroll();
  addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(onScroll);
  }, { passive: true });

  const navLinks = $$('.nav a[href^="#"]:not(.btn)');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const t = $(a.hash); if (t) navObserver.observe(t); });

  const nav = $('#nav');
  const navToggle = $('#navToggle');
  const mobileNavMq = window.matchMedia('(max-width: 860px)');
  const syncNavAvailability = () => {
    nav.inert = mobileNavMq.matches && !nav.classList.contains('open');
  };
  syncNavAvailability();
  const setNav = (open) => {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
    syncNavAvailability();
    syncFloat();
  };
  navToggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); navToggle.focus(); }
  });
  document.addEventListener('click', (e) => { if (!header.contains(e.target)) setNav(false); });
  mobileNavMq.addEventListener('change', () => { setNav(false); });
  header.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !mobileNavMq.matches || !nav.classList.contains('open')) return;
    const controls = $$('a, button', header).filter(el => el.getClientRects().length && !el.disabled);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- Clock ---------- */
  const clock = $('#clock');
  const tickClock = () => { clock.textContent = tashkentTime(); };
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------- Split headings into words ---------- */
  $$('.split').forEach((el) => {
    let i = 0;
    const wrap = (inner, free = false) => {
      const w = document.createElement('span');
      w.className = free ? 'w w-free' : 'w';
      const s = document.createElement('span');
      s.style.setProperty('--i', i++);
      s.append(inner);
      w.append(s);
      return w;
    };
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          frag.append(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
        });
        node.replaceWith(frag);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const placeholder = document.createComment('');
        node.replaceWith(placeholder);
        placeholder.replaceWith(wrap(node, true));
      }
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const counters = new Map();
  $$('.reveal').forEach((el) => {
    const n = counters.get(el.parentElement) || 0;
    counters.set(el.parentElement, n + 1);
    el.style.setProperty('--d', `${Math.min(n, 6) * 0.07}s`);
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
  root.classList.add('js');
  $$('.reveal, .split').forEach((el) => revealObserver.observe(el));

  /* ---------- Split-flap boards ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#:+-/';
  const compactMq = window.matchMedia('(max-width: 640px)');
  const flipQueue = [];
  let flipTimer = 0;
  const pump = () => {
    const now = performance.now();
    for (let i = flipQueue.length - 1; i >= 0; i--) {
      const job = flipQueue[i];
      if (now < job.at) continue;
      if (job.steps > 0) {
        job.cell.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        job.cell.classList.toggle('f1');
        job.cell.classList.toggle('f2', !job.cell.classList.contains('f1'));
        job.steps--;
        job.at = now + 55;
      } else {
        job.cell.textContent = job.ch;
        flipQueue.splice(i, 1);
      }
    }
    flipTimer = flipQueue.length ? setTimeout(pump, 40) : 0;
  };
  const kick = () => { if (!flipTimer && flipQueue.length) flipTimer = setTimeout(pump, 40); };

  /**
   * A split-flap board. `wide` and `compact` are column layouts: [key, cells][];
   * an event is { m, t, s, st, time } where `s` is the short text for phones.
   */
  const createBoard = (boardEl, rowsEl, { rows, wide, compact }) => {
    let cols = [];
    let grid = [];
    let feed = [];
    const build = () => {
      cols = compactMq.matches ? compact : wide;
      boardEl.style.setProperty('--cells', cols.reduce((sum, [, n]) => sum + n, 0));
      boardEl.style.setProperty('--colgap', compactMq.matches ? '10px' : '14px');
      boardEl.style.setProperty('--ngaps', cols.length - 1);
      rowsEl.textContent = '';
      grid = [];
      for (let r = 0; r < rows; r++) {
        const row = document.createElement('div');
        row.className = 'brow';
        const groups = {};
        cols.forEach(([key, n]) => {
          const g = document.createElement('div');
          g.className = 'bgrp';
          g.dataset.col = key === 's' ? 't' : key;
          const cells = [];
          for (let i = 0; i < n; i++) {
            const c = document.createElement('span');
            c.className = 'flap';
            cells.push(c);
            g.append(c);
          }
          groups[key] = { el: g, cells };
          row.append(g);
        });
        rowsEl.append(row);
        grid.push(groups);
      }
    };
    const setCell = (cell, ch, delay, animate) => {
      if (cell.dataset.c === ch) return;
      // A filter may change while a previous animation is still queued.
      for (let i = flipQueue.length - 1; i >= 0; i--) if (flipQueue[i].cell === cell) flipQueue.splice(i, 1);
      cell.dataset.c = ch;
      if (!animate || reduceMotion) { cell.textContent = ch; return; }
      flipQueue.push({ cell, ch, steps: 2 + Math.floor(Math.random() * 4), at: performance.now() + delay });
    };
    const render = (animate) => {
      for (let r = 0; r < rows; r++) {
        const ev = feed[r] || { m: '', t: '', s: '', st: '', time: '' };
        cols.forEach(([key, n], ci) => {
          const raw = key === 'time' ? ev.time : (ev[key] || '');
          const text = raw.toUpperCase().slice(0, n).padEnd(n, ' ');
          grid[r][key].el.dataset.mod = ev.m;
          grid[r][key].el.dataset.st = ev.st || '';
          [...text].forEach((ch, i) => setCell(grid[r][key].cells[i], ch, (r * 6 + ci * 3 + i) * 14, animate));
        });
      }
      kick();
    };
    build();
    compactMq.addEventListener('change', () => { build(); render(false); });
    return {
      el: boardEl,
      set(list, animate = true) { feed = list.slice(0, rows); render(animate); },
      push(ev, animate = true) { feed = [ev, ...feed].slice(0, rows); render(animate); },
      blank() { $$('.flap', boardEl).forEach((c) => { c.dataset.c = ''; c.textContent = ' '; }); },
    };
  };

  /* ---------- Hero board (with module filter) ---------- */
  const EVENTS = [
    { m: 'WMS', t: '+500 M MATO KIRIM QILINDI', s: '+500 M MATO KIRIM', st: 'OK' },
    { m: 'ERP', t: '#1042 DAZMOL BOSQICHIDA', s: '#1042 DAZMOLDA', st: 'JARAYON' },
    { m: 'CRM', t: 'TELEGRAM: YANGI LID', s: 'TELEGRAM: YANGI LID', st: 'YANGI' },
    { m: 'HR', t: 'MALIKA A.: 480 DONA', s: 'MALIKA: 480 DONA', st: 'OK' },
    { m: 'LMS', t: 'INGLIZ B1: DAVOMAT 24/26', s: 'B1 DAVOMAT 24/26', st: 'OK' },
    { m: 'WMS', t: 'IP QORA: QOLDIQ KAM', s: 'IP QORA: KAM', st: 'DIQQAT' },
    { m: 'ERP', t: '#1043 BICHISH BOSHLANDI', s: '#1043 BICHISH', st: 'JARAYON' },
    { m: 'CRM', t: 'INSTAGRAM: 3 XABAR', s: 'INSTAGRAM: 3 XABAR', st: 'YANGI' },
    { m: 'LMS', t: '3 TA QARZDOR ANIQLANDI', s: '3 TA QARZDOR', st: 'DIQQAT' },
    { m: 'HR', t: 'SENTABR ISH HAQI YOPILDI', s: 'SENTABR YOPILDI', st: 'OK' },
    { m: 'ERP', t: '#1041 300 DONA OMBORGA', s: '#1041 OMBORGA', st: 'OK' },
    { m: 'CRM', t: '“NUR” DO‘KONI: BITIM', s: '“NUR”: BITIM', st: 'OK' },
    { m: 'HR', t: '24/26 XODIM ISHGA KELDI', s: '24/26 KELDI', st: 'OK' },
    { m: 'WMS', t: 'INVENTARIZATSIYA TUGADI', s: 'INVENTARIZATSIYA', st: 'OK' },
    { m: 'LMS', t: 'YANGI O‘QUVCHI: MADINA', s: 'YANGI: MADINA', st: 'YANGI' },
    { m: 'HR', t: 'TUNGI SMENA BOSHLANDI', s: 'TUNGI SMENA', st: 'JARAYON' },
    { m: 'WMS', t: 'TUGMA: 8 600 DONA', s: 'TUGMA: 8 600', st: 'OK' },
    { m: 'LMS', t: '203-XONA: TO‘QNASHUV', s: '203: TO‘QNASHUV', st: 'DIQQAT' },
    { m: 'CRM', t: 'ERTAGA 3 TA QO‘NG‘IROQ', s: '3 TA QO‘NG‘IROQ', st: 'JARAYON' },
    { m: 'ERP', t: '#1043: BRAK 2 DONA', s: '#1043 BRAK 2', st: 'DIQQAT' },
  ];
  const HERO_ROWS = 5;
  const heroBoard = createBoard($('#board'), $('#boardRows'), {
    rows: HERO_ROWS,
    wide: [['time', 5], ['m', 3], ['t', 24], ['st', 7]],
    compact: [['m', 3], ['s', 18]],
  });
  let heroFilter = '';
  let heroCursor = 0;
  const heroPool = () => (heroFilter ? EVENTS.filter((e) => e.m === heroFilter) : EVENTS);
  const heroInitial = () => {
    const pool = heroPool();
    heroCursor = HERO_ROWS;
    return Array.from({ length: HERO_ROWS }, (_, i) => ({ ...pool[i % pool.length], time: tashkentTime(i * 3 + (i ? 1 : 0)) }));
  };
  heroBoard.set(heroInitial(), false);

  let heroVisible = false;
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe(heroBoard.el);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => {
    if (reduceMotion || !finePointer || !heroVisible || document.hidden) return;
    heroBoard.blank();
    heroBoard.set(heroInitial(), true);
  }, 300));
  if (!reduceMotion) {
    setInterval(() => {
      if (!heroVisible || document.hidden) return;
      const pool = heroPool();
      heroBoard.push({ ...pool[heroCursor++ % pool.length], time: tashkentTime() });
    }, 3600);
  }
  $$('.board-filter button').forEach((btn) => {
    btn.addEventListener('click', () => {
      heroFilter = btn.dataset.f;
      $$('.board-filter button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      heroBoard.set(heroInitial(), true);
    });
  });

  /* ---------- §03 Sandbox: one core, cascading modules ---------- */
  const sbBoard = createBoard($('#sbBoard'), $('#sbRows'), {
    rows: 6,
    wide: [['time', 5], ['m', 3], ['t', 22]],
    compact: [['m', 3], ['s', 16]],
  });
  const SB_START = () => ({ newL: 2, talk: 1, won: 0, order: { no: 1043, stage: 0 }, backlog: 0, nextNo: 1044, mato: 140, shirt: 312, pieces: 480 });
  const QTY = 50;
  const MATO_PER = 2.5;
  const STAGES = ['Bichish', 'Tikish', 'Dazmol', 'Qadoqlash'];
  const STAGE_UP = ['BICHISH', 'TIKISH', 'DAZMOL', 'QADOQLASH'];
  let sb = SB_START();
  let sbCount = 0;
  let sbActions = 0;
  const sbEl = (id) => $(`#${id}`);
  const sbCards = { crm: sbEl('sb-crm'), erp: sbEl('sb-erp'), wms: sbEl('sb-wms'), hr: sbEl('sb-hr') };
  const setNum = (id, value) => {
    const el = sbEl(id);
    const text = typeof value === 'number' ? group(value) : value;
    if (el.textContent === text) return;
    el.textContent = text;
    const dd = el.closest('dd');
    if (dd) { dd.classList.remove('tick'); void dd.offsetWidth; dd.classList.add('tick'); }
  };
  const hit = (mod, from) => {
    const card = sbCards[mod];
    card.querySelector('.sb-from').textContent = from ? `← ${from}` : '';
    card.classList.remove('hit');
    void card.offsetWidth;
    card.classList.add('hit');
    clearTimeout(card._t);
    card._t = setTimeout(() => card.classList.remove('hit'), 1600);
  };
  const bad = (mod) => {
    const card = sbCards[mod];
    card.classList.remove('bad');
    void card.offsetWidth;
    card.classList.add('bad');
    setTimeout(() => card.classList.remove('bad'), 600);
  };
  const log = (m, t, s, st = 'OK') => {
    sbCount++;
    sbBoard.push({ m, t, s, st, time: tashkentTime() });
    $('#sbCount').textContent = `${sbCount} hodisa`;
    $('#sbLast').textContent = `${m}: ${t.toLowerCase()}`;
  };
  const renderSb = () => {
    setNum('sb-new', sb.newL);
    setNum('sb-talk', sb.talk);
    setNum('sb-won', sb.won);
    setNum('sb-mato', sb.mato);
    setNum('sb-shirt', sb.shirt);
    setNum('sb-pieces', sb.pieces);
    setNum('sb-pay', 2000000 + sb.pieces * 5000);
    const stages = $$('#sb-stages li');
    const btn = sbEl('sb-stage-btn');
    const note = sbEl('sb-erp-note');
    $('#sb-stages').classList.toggle('idle', !sb.order);
    if (sb.order) {
      sbEl('sb-order').textContent = `#${sb.order.no}`;
      stages.forEach((li, i) => { li.className = i < sb.order.stage ? 'done' : i === sb.order.stage ? 'now' : ''; });
      btn.disabled = false;
      setLabel(btn, sb.order.stage === 3 ? 'Yakunlash va omborga o‘tkazish' : `${STAGES[sb.order.stage]} tayyor`);
      note.textContent = `${QTY} ta ko‘ylak · retsept bo‘yicha ${group(QTY * MATO_PER)} m mato${sb.backlog ? ` · navbatda ${sb.backlog}` : ''}`;
    } else {
      sbEl('sb-order').textContent = '—';
      stages.forEach((li) => { li.className = 'done'; });
      btn.disabled = true;
      setLabel(btn, 'Faol buyurtma yo‘q');
      note.textContent = 'Yangi buyurtma CRM’da bitim yopilganda paydo bo‘ladi.';
    }
  };
  const nudge = () => {
    sbActions++;
    if (sbActions === 2) $('#sbHint').innerHTML = 'Zo‘r! Endi ERP’da bosqichlarni o‘tkazing: <b>“Tikish”</b> tugaganda Malikaning ish haqi o‘zi oshadi.';
    if (sbActions === 5) $('#sbNudge').hidden = false;
  };
  const startOrder = () => {
    sb.order = { no: sb.nextNo++, stage: 0 };
    log('ERP', `#${sb.order.no} YARATILDI: ${QTY} DONA`, `#${sb.order.no} YARATILDI`, 'YANGI');
    hit('erp', 'CRM');
  };
  const SB_ACTIONS = {
    lead() {
      sb.newL++;
      log('CRM', 'TELEGRAM: YANGI LID', 'TELEGRAM: LID', 'YANGI');
      hit('crm');
    },
    deal() {
      if (sb.talk + sb.newL === 0) {
        log('CRM', 'LID YO‘Q: AVVAL XABAR', 'LID YO‘Q', 'DIQQAT');
        bad('crm');
        return;
      }
      if (sb.talk > 0) sb.talk--; else sb.newL--;
      sb.won++;
      log('CRM', `BITIM: ${QTY} TA KO‘YLAK`, `BITIM: ${QTY} DONA`, 'OK');
      hit('crm');
      if (sb.order) {
        sb.backlog++;
        log('ERP', `BUYURTMA NAVBATGA (${sb.backlog})`, `NAVBATDA: ${sb.backlog}`, 'JARAYON');
        hit('erp', 'CRM');
      } else {
        startOrder();
      }
    },
    stage() {
      const o = sb.order;
      if (!o) return;
      if (o.stage < 3) {
        log('ERP', `#${o.no} ${STAGE_UP[o.stage]} TAYYOR`, `#${o.no} ${STAGE_UP[o.stage]}`, 'JARAYON');
        hit('erp');
        if (o.stage === 1) {
          sb.pieces += QTY;
          log('HR', `MALIKA: +${QTY} DONA, +${group(QTY * 5000)}`, `MALIKA +${QTY} DONA`, 'OK');
          hit('hr', 'ERP');
        }
        o.stage++;
        return;
      }
      const need = QTY * MATO_PER;
      if (sb.mato < need) {
        log('WMS', `MATO YETMAYDI: -${group(need - sb.mato)} M`, `MATO YETMAYDI`, 'DIQQAT');
        bad('wms');
        $('#sbHint').innerHTML = 'Tizim chiqimni blokladi: omborda mato yetmaydi. WMS’da <b>“Mato kirim”</b> qiling va qayta urining.';
        return;
      }
      log('ERP', `#${o.no} YAKUNLANDI`, `#${o.no} YAKUNLANDI`, 'OK');
      hit('erp');
      sb.mato -= need;
      sb.shirt += QTY;
      log('WMS', `-${group(need)} M MATO, +${QTY} KO‘YLAK`, `-${group(need)} M, +${QTY} DONA`, 'OK');
      hit('wms', 'ERP');
      sb.order = null;
      if (sb.backlog > 0) { sb.backlog--; startOrder(); }
    },
    receive() {
      sb.mato += 200;
      log('WMS', '+200 M MATO KIRIM', '+200 M MATO', 'OK');
      hit('wms');
    },
  };
  $$('#sb [data-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.remove('ripple');
      void btn.offsetWidth;
      btn.classList.add('ripple');
      SB_ACTIONS[btn.dataset.act]();
      renderSb();
      nudge();
    });
  });
  const sbIdle = () => sbBoard.set([{ m: 'SYS', t: 'TUGMANI BOSING', s: 'TUGMANI BOSING', st: '', time: tashkentTime() }], false);
  $('#sbReset').addEventListener('click', () => {
    sb = SB_START();
    sbCount = 0;
    sbActions = 0;
    $('#sbCount').textContent = '0 hodisa';
    $('#sbNudge').hidden = true;
    $('#sbLast').textContent = 'Namuna tiklandi. Boshlash uchun tugmani bosing.';
    Object.values(sbCards).forEach((card) => {
      clearTimeout(card._t);
      card.classList.remove('hit', 'bad');
      card.querySelector('.sb-from').textContent = '';
    });
    $('#sbHint').innerHTML = 'CRM’da <b>“Bitim yopish”</b>ni bosing va buyurtma qanday paydo bo‘lishini ko‘ring.';
    sbBoard.set([], false);
    sbIdle();
    renderSb();
  });
  sbIdle();
  renderSb();

  /* ---------- §01 Before / after ---------- */
  const ba = $('#ba');
  const baRange = $('#baRange');
  const setPos = (v) => { ba.style.setProperty('--pos', `${v}%`); };
  baRange.addEventListener('input', () => setPos(baRange.value));
  let baTouched = false;
  baRange.addEventListener('pointerdown', () => { baTouched = true; });
  baRange.addEventListener('keydown', () => { baTouched = true; });
  if (!reduceMotion) {
    new IntersectionObserver(([entry], obs) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      // One hint sweep so visitors see the slider is interactive.
      const keys = [[0, 50], [900, 78], [1900, 24], [2800, 50]];
      const start = performance.now();
      const step = (now) => {
        if (baTouched) return;
        const t = now - start;
        let k = 0;
        while (k < keys.length - 2 && t > keys[k + 1][0]) k++;
        const [t0, v0] = keys[k];
        const [t1, v1] = keys[k + 1];
        const p = Math.min(Math.max((t - t0) / (t1 - t0), 0), 1);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const v = v0 + (v1 - v0) * e;
        setPos(v);
        baRange.value = String(Math.round(v));
        if (t < keys[keys.length - 1][0]) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 500);
    }, { threshold: 0.6 }).observe(ba);
  }

  /* ---------- §02 Module story ---------- */
  const heat = $('#heat');
  if (heat) {
    // October 2026 starts on a Thursday; weeks start on Monday.
    ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].forEach((d) => {
      const s = document.createElement('span');
      s.className = 'wd';
      s.textContent = d;
      heat.append(s);
    });
    for (let i = 0; i < 3; i++) { const b = document.createElement('span'); b.className = 'd blank'; heat.append(b); }
    const today = Number(new Date().toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Asia/Tashkent' }));
    const isOct2026 = new Date().toLocaleDateString('en-GB', { month: 'numeric', year: 'numeric', timeZone: 'Asia/Tashkent' }) === '10/2026';
    const cutoff = isOct2026 ? today : 31;
    for (let day = 1; day <= 31; day++) {
      const s = document.createElement('span');
      const weekday = (day + 2) % 7; // 0 = Monday
      let cls = 'ok';
      if (weekday === 6 || day === 9) cls = 'off';
      else if (day === 3 || day === 14) cls = 'half';
      if (day > cutoff) cls = 'future';
      s.className = `d ${cls}${day === cutoff && isOct2026 ? ' today' : ''}`;
      s.style.setProperty('--i', day);
      s.textContent = day;
      heat.append(s);
    }
  }
  $$('.tt .blk').forEach((b, k) => b.style.setProperty('--k', k));

  const storyLinks = $$('.story-index a');
  const storyList = $('.story-index ol');
  const mods = $$('.mod');
  const setActiveMod = (id) => {
    const idx = mods.findIndex((m) => m.id === id);
    storyLinks.forEach((a) => a.classList.toggle('active', a.hash === `#${id}`));
    storyList.style.setProperty('--ip', ((idx + 1) / mods.length).toFixed(3));
    const active = storyLinks[idx];
    if (active && getComputedStyle(storyList).display === 'flex') {
      storyList.scrollTo({ left: active.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };
  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) setActiveMod(entry.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  const inObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      inObserver.unobserve(entry.target);
    });
  }, { threshold: 0.3 });
  mods.forEach((m) => { activeObserver.observe(m); inObserver.observe(m); });
  setActiveMod(mods[0].id);

  /* ---------- §05 Payroll receipt ---------- */
  const calc = $('#calc');
  const val = (id) => Number($(`#${id}`).value);
  const units = { 'c-fixed': 'so‘m', 'c-pieces': 'dona', 'c-rate': 'so‘m', 'c-bonus': 'so‘m' };
  const lines = { fixed: $('.r-line[data-k="fixed"] b'), piece: $('.r-line[data-k="piece"] b'), bonus: $('.r-line[data-k="bonus"] b') };
  const pieceNote = $('#r-piece-note');
  const totalEl = $('#r-total');
  let shownTotal = 0;
  let totalFrame = 0;
  const flash = (el) => {
    const line = el.closest('.r-line');
    line.classList.remove('flash');
    void line.offsetWidth;
    line.classList.add('flash');
  };
  const animateTotal = (to) => {
    cancelAnimationFrame(totalFrame);
    if (reduceMotion) { shownTotal = to; totalEl.textContent = group(to); return; }
    const from = shownTotal;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / 420, 1);
      shownTotal = from + (to - from) * (1 - Math.pow(1 - p, 3));
      totalEl.textContent = group(shownTotal);
      if (p < 1) totalFrame = requestAnimationFrame(step);
    };
    totalFrame = requestAnimationFrame(step);
  };
  const updateCalc = (changedId) => {
    $$('input[type="range"]', calc).forEach((input) => {
      const v = Number(input.value);
      const out = $(`output[for="${input.id}"]`, calc);
      out.textContent = `${input.id === 'c-bonus' && v > 0 ? '+' : ''}${signed(v)} ${units[input.id]}`;
      input.style.setProperty('--p', `${((v - input.min) / (input.max - input.min)) * 100}%`);
    });
    const fixed = val('c-fixed');
    const piece = val('c-pieces') * val('c-rate');
    const bonus = val('c-bonus');
    lines.fixed.textContent = group(fixed);
    lines.piece.textContent = group(piece);
    lines.bonus.textContent = `${bonus > 0 ? '+' : ''}${signed(bonus)}`;
    pieceNote.textContent = `${val('c-pieces')}×${group(val('c-rate'))}`;
    const map = { 'c-fixed': lines.fixed, 'c-pieces': lines.piece, 'c-rate': lines.piece, 'c-bonus': lines.bonus };
    if (changedId && map[changedId]) flash(map[changedId]);
    animateTotal(Math.max(fixed + piece + bonus, 0));
  };
  calc.addEventListener('input', (e) => updateCalc(e.target.id));
  updateCalc();

  /* ---------- §07 Steps progress (scroll-linked) ---------- */
  const steps = $('#steps');
  const stepItems = $$('li', steps);
  const updateSteps = () => {
    const r = steps.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25), 0), 1);
    steps.style.setProperty('--p', p.toFixed(3));
    stepItems.forEach((li, i) => li.classList.toggle('on', p >= i / stepItems.length + 0.02 || p === 1));
  };
  updateSteps();
  addEventListener('scroll', updateSteps, { passive: true });
  addEventListener('resize', updateSteps);

  /* ---------- §08 Configurator ---------- */
  const modBoxes = $$('input[name="mod"]');
  const deployRadios = $$('input[name="deploy"]');
  const wms = modBoxes.find((b) => b.value === 'WMS');
  const erp = modBoxes.find((b) => b.value === 'ERP');
  const bundleValue = $('#bundleValue');
  const bundleDeploy = $('#bundleDeploy');
  const bundleNote = $('#bundleNote');
  const bundleField = $('#f-bundle');
  const formBundle = $('#formBundle');
  const bundleButton = $('.ticket .btn');
  const updateBundle = () => {
    // ERP consumes and receives stock, so it always includes WMS.
    wms.disabled = erp.checked;
    if (erp.checked) wms.checked = true;
    const picked = modBoxes.filter((b) => b.checked).map((b) => b.value);
    const deploy = deployRadios.find((r) => r.checked).value;
    bundleValue.textContent = picked.length ? picked.join(' + ') : 'Modul tanlanmagan';
    bundleDeploy.textContent = `→ ${deploy}`;
    bundleValue.classList.remove('bump');
    void bundleValue.offsetWidth;
    bundleValue.classList.add('bump');
    bundleNote.textContent = erp.checked
      ? 'ERP ombor bilan ishlaydi, shuning uchun WMS avtomatik qo‘shildi.'
      : picked.length === 5 ? 'To‘liq to‘plam: beshala modul bitta yadroda.'
      : picked.length ? `${picked.length} ta modul. Keyin qo‘shish mumkin.` : 'Kamida bitta modulni yoqing.';
    const summary = picked.length ? `${picked.join(' + ')} · ${deploy}` : '';
    bundleField.value = summary;
    formBundle.textContent = summary ? `Tanlangan to‘plam: ${summary}` : '';
    bundleButton.setAttribute('aria-disabled', String(!picked.length));
    setLabel(bundleButton, picked.length ? 'Narx taklifini olish' : 'Avval modul tanlang');
    // A changed selection invalidates an already prepared contact draft.
    if (!$('#leadDraft').hidden) {
      $('#formMsg').textContent = 'To‘plam o‘zgardi. Yangi tanlov bilan so‘rovni qayta tayyorlang.';
      $('#formMsg').className = 'form-msg';
    }
    $('#leadDraft').hidden = true;
  };
  bundleButton.addEventListener('click', (event) => {
    if (!modBoxes.some(box => box.checked)) {
      event.preventDefault();
      modBoxes.find(box => !box.disabled)?.focus();
    }
  });
  [...modBoxes, ...deployRadios].forEach((el) => el.addEventListener('change', updateBundle));
  updateBundle();

  const focusConfig = () => {
    const config = $('.config');
    config.classList.remove('flash-in');
    void config.offsetWidth;
    config.classList.add('flash-in');
    config.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    modBoxes.find(box => !box.disabled)?.focus({ preventScroll: true });
  };
  const industries = {
    sewing: ['WMS', 'ERP', 'HR'], production: ['WMS', 'ERP', 'HR'],
    shop: ['WMS', 'HR', 'CRM'], education: ['LMS', 'CRM', 'HR'],
    school: ['LMS', 'HR'], sport: ['LMS', 'CRM'],
  };
  $$('[data-industry]').forEach(button => button.addEventListener('click', () => {
    const selected = industries[button.dataset.industry];
    modBoxes.forEach(box => { box.disabled = false; box.checked = selected.includes(box.value); });
    updateBundle(); syncFloatText(); focusConfig();
  }));
  $$('[data-deploy-pick]').forEach(button => button.addEventListener('click', () => {
    deployRadios.forEach(radio => { radio.checked = radio.value === button.dataset.deployPick; });
    updateBundle(); syncFloatText(); focusConfig();
  }));

  /* ---------- Quiz: three questions → bundle ---------- */
  const quiz = $('#quiz');
  const answers = {};
  const quizSteps = $$('.quiz-step', quiz);
  const quizResult = $('.quiz-result', quiz);
  const quizDots = $$('.quiz-dots li', quiz);
  let quizIndex = 0;
  const showStep = (i) => {
    quizIndex = i;
    quizSteps.forEach((st, k) => { st.hidden = k !== i; });
    quizResult.hidden = i < quizSteps.length;
    $('#quizBack').hidden = i === 0;
    $('#quizProgress').textContent = i < quizSteps.length ? `${i + 1} / 3 savol` : 'Tavsiya tayyor';
    $$('.quiz-opts button', quiz).forEach(button => button.setAttribute('aria-pressed', String(answers[button.dataset.k] === button.dataset.v)));
    quizDots.forEach((d, k) => d.classList.toggle('on', k <= Math.min(i, quizDots.length - 1)));
    const first = i < quizSteps.length ? $('button', quizSteps[i]) : $('#quizApply');
    if (first && quiz.contains(document.activeElement)) first.focus();
  };
  const recommend = () => {
    const base = { prod: ['WMS', 'ERP', 'HR'], shop: ['WMS', 'HR'], edu: ['LMS', 'HR'], service: ['HR', 'CRM'] }[answers.type];
    const mods = new Set(base);
    if (answers.chan === 'social') mods.add('CRM');
    const order = ['WMS', 'ERP', 'HR', 'CRM', 'LMS'];
    const picked = order.filter((m) => mods.has(m));
    const why = {
      prod: 'Sex ombordan xomashyo oladi, buyurtma bosqichma-bosqich yuradi, ishchilar donabay haq oladi.',
      shop: 'Qoldiqlar va har bir sotuvchining ish haqi, jumladan savdodan foizi, bitta joyda.',
      edu: 'Guruhlar, jadval, davomat va to‘lovlar, o‘qituvchilar ish haqi ham shu yerda.',
      service: 'Mijozlar oqimi va xodimlar ish haqi bitta tizimda.',
    }[answers.type];
    const extraWhy = answers.chan === 'social' ? ' Telegram va Instagram xabarlari CRM’da lidga aylanadi.' : '';
    const dep = answers.deploy === 'Desktop' ? ' Desktopda asosiy hisoblar kompyuteringizda; aktivatsiya va onlayn xizmatlar uchun internet kerak.' : ' Bulutda internet orqali jamoangiz bilan umumiy ish muhitiga kirasiz.';
    return { picked, deploy: answers.deploy, why: why + extraWhy + dep };
  };
  $$('.quiz-opts button', quiz).forEach((btn) => {
    btn.addEventListener('click', () => {
      answers[btn.dataset.k] = btn.dataset.v;
      const step = Number(btn.closest('.quiz-step').dataset.step);
      if (step + 1 < quizSteps.length) { showStep(step + 1); return; }
      const r = recommend();
      $('#quizBundle').innerHTML = `${r.picked.join(' + ')}<small>→ ${r.deploy}</small>`;
      $('#quizWhy').textContent = r.why;
      quizResult.dataset.mods = r.picked.join(',');
      quizResult.dataset.deploy = r.deploy;
      showStep(quizSteps.length);
    });
  });
  $('#quizRestart').addEventListener('click', () => {
    Object.keys(answers).forEach(key => delete answers[key]);
    showStep(0);
  });
  $('#quizBack').addEventListener('click', () => showStep(Math.max(0, quizIndex - 1)));
  $('#quizApply').addEventListener('click', () => {
    const mods = quizResult.dataset.mods.split(',');
    modBoxes.forEach((b) => { b.disabled = false; b.checked = mods.includes(b.value); });
    deployRadios.forEach((r) => { r.checked = r.value === quizResult.dataset.deploy; });
    updateBundle();
    focusConfig();
  });

  /* ---------- Floating CTA ---------- */
  const floatCta = $('#floatCta');
  const floatText = $('#floatText');
  const heroEl = $('.hero');
  const contactEl = $('#aloqa');
  let pastHero = false;
  let nearContact = false;
  const syncFloat = () => {
    const show = pastHero && !nearContact && !nav.classList.contains('open');
    floatCta.classList.toggle('show', show);
    floatCta.setAttribute('aria-hidden', String(!show));
    floatCta.tabIndex = show ? 0 : -1;
  };
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; syncFloat(); }).observe(heroEl);
  new IntersectionObserver(([e]) => { nearContact = e.isIntersecting; syncFloat(); }, { rootMargin: '0px 0px 20% 0px' }).observe(contactEl);
  navToggle.addEventListener('click', syncFloat);
  const syncFloatText = () => {
    const v = bundleField.value;
    floatText.textContent = v ? `Demo so‘rash · ${v.split(' · ')[0]}` : 'Bepul demo so‘rash';
  };
  [...modBoxes, ...deployRadios].forEach((el) => el.addEventListener('change', syncFloatText));
  $('#quizApply').addEventListener('click', syncFloatText);
  syncFloatText();

  /* ---------- Lead form: delivered only after a real endpoint response ---------- */
  const form = $('#leadForm');
  const msg = $('#formMsg');
  const draft = $('#leadDraft');
  const draftText = $('#leadText');
  const sendLink = $('#leadSend');
  const submitButton = $('#leadSubmit');
  const setMsg = (text, type = '') => { msg.textContent = text; msg.className = `form-msg ${type}`; };
  let sending = false;
  let requestId = '';
  let lastPayload = '';
  if (CONTACT.endpoint) {
    setLabel(submitButton, 'Demo so‘rovini yuborish');
    $('#deliveryHint').textContent = 'So‘rov aloqa xizmatiga yuboriladi. Natija shu yerda ko‘rsatiladi.';
  }
  const prepareDraft = (text) => {
    draftText.value = text;
    if (CONTACT.telegramUsername) {
      sendLink.href = `https://t.me/${encodeURIComponent(CONTACT.telegramUsername.replace(/^@/, ''))}?text=${encodeURIComponent(text)}`;
      setLabel(sendLink, 'Telegramda yuborish');
      sendLink.querySelector('use').setAttribute('href', '#icon-send');
      sendLink.target = '_blank';
      sendLink.rel = 'noopener noreferrer';
    } else if (CONTACT.email) {
      sendLink.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent('FlowCore demo so‘rovi')}&body=${encodeURIComponent(text)}`;
      setLabel(sendLink, 'Email orqali yuborish');
      sendLink.querySelector('use').setAttribute('href', '#icon-mail');
      sendLink.removeAttribute('target');
    }
    sendLink.hidden = !CONTACT.telegramUsername && !CONTACT.email;
    draft.hidden = false;
  };
  form.addEventListener('input', (event) => {
    if (event.target === draftText) return;
    event.target.removeAttribute('aria-invalid');
    draft.hidden = true;
    if (!sending) setMsg('');
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    const name = form.elements.namedItem('name');
    const phone = form.elements.namedItem('phone');
    const company = form.elements.namedItem('company');
    const bundle = form.elements.namedItem('bundle');
    const digits = phone.value.replace(/\D/g, '');
    const nameOk = name.value.trim().length >= 2;
    const phoneOk = /^\+?[\d\s()−-]+$/.test(phone.value.trim()) && (digits.length === 9 || (digits.startsWith('998') ? digits.length === 12 : digits.length >= 10 && digits.length <= 15));
    name.setAttribute('aria-invalid', String(!nameOk));
    phone.setAttribute('aria-invalid', String(!phoneOk));
    draft.hidden = true;
    if (!nameOk) { setMsg('Ismingizni kamida 2 ta belgi bilan kiriting.', 'err'); name.focus(); return; }
    if (!phoneOk) { setMsg('Telefon raqamni to‘liq kiriting, masalan +998 90 123 45 67.', 'err'); phone.focus(); return; }
    if (!bundle.value) { setMsg('Tariflar bo‘limida kamida bitta modulni tanlang.', 'err'); focusConfig(); return; }
    const fields = { name: name.value.trim(), phone: phone.value.trim(), company: company.value.trim(), bundle: bundle.value };
    const payload = JSON.stringify(fields);
    if (payload !== lastPayload) {
      requestId = crypto.randomUUID().replace(/-/g, '');
      lastPayload = payload;
    }
    const data = { ...fields, requestId };
    const text = [
      'FlowCore demo so‘rovi', `Ism: ${data.name}`, `Telefon: ${data.phone}`,
      data.company && `Kompaniya: ${data.company}`, `To‘plam: ${data.bundle}`,
    ].filter(Boolean).join('\n');
    if (!CONTACT.endpoint) {
      prepareDraft(text);
      setMsg('So‘rov matni tayyor. Quyidagi yuborish tugmasi orqali davom eting yoki matnni nusxalang. Hali yuborilmadi.');
      return;
    }
    sending = true;
    submitButton.disabled = true;
    setLabel(submitButton, 'Yuborilmoqda…');
    form.setAttribute('aria-busy', 'true');
    setMsg('So‘rov yuborilmoqda…');
    try {
      const response = await fetch(CONTACT.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(String(response.status));
      const result = await response.json();
      if (result.ok !== true) throw new Error('Unconfirmed delivery');
      setMsg('So‘rovingiz qabul qilindi. Aloqa uchun ko‘rsatgan raqamingizdan foydalanamiz.', 'ok');
    } catch {
      prepareDraft(text);
      setMsg('Serverdan tasdiq olinmadi. So‘rovni email/Telegram orqali yuboring yoki qayta urinishdan oldin holatini tekshiring.', 'err');
    } finally {
      sending = false;
      submitButton.disabled = false;
      setLabel(submitButton, 'Demo so‘rovini yuborish');
      form.removeAttribute('aria-busy');
    }
  });
  sendLink.addEventListener('click', () => setMsg('Yuborishni ochilgan ilovada tasdiqlang. Bu sahifa xabar yetib borganini tekshira olmaydi.'));
  $('#leadCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(draftText.value);
      setMsg('So‘rov matni nusxalandi. Uni kerakli suhbatga joylab yuborishingiz mumkin.', 'ok');
    } catch {
      draftText.focus(); draftText.select();
      setMsg('Matn belgilandi. Nusxalash uchun Ctrl+C yoki ⌘C bosing.');
    }
  });
  $('#leadDownload').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([draftText.value], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'flowcore-demo-sorovi.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg('So‘rov matnini TXT fayl sifatida yuklab olish boshlandi.');
  });

  /* ---------- Small touches ---------- */
  if (finePointer && !reduceMotion) {
    $$('.bento .cell').forEach((cell) => {
      cell.addEventListener('pointermove', (e) => {
        const r = cell.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        cell.style.transform = `translateY(-3px) perspective(900px) rotateX(${-y * 2.5}deg) rotateY(${x * 2.5}deg)`;
      });
      cell.addEventListener('pointerleave', () => { cell.style.transform = ''; });
    });
  }
  $('#year').textContent = String(new Date().getFullYear());
})();
