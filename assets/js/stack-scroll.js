/* Stacked sections: each section sticks once its end reaches the viewport bottom and
   the next one slides over it, while the covered one shrinks and fades. Layout heights
   do not change; only sticky positioning and transforms are used. */
(() => {
  const main = document.querySelector('main');
  const root = document.documentElement;
  if (!main || !CSS.supports('position', 'sticky')) return;
  const cards = [...main.children].filter(element => element.tagName === 'SECTION');
  if (cards.length < 2) return;

  // Measures layout as if nothing were stuck. Toggling the class within one synchronous
  // call never reaches the screen, so there is no flicker.
  const unstuck = read => {
    root.classList.add('stack-measure');
    try { return read(); } finally { root.classList.remove('stack-measure'); }
  };
  const naturalTop = element => unstuck(() => element.getBoundingClientRect().top + scrollY);
  window.flowcoreStack = { naturalTop, unstuck };

  root.classList.add('stack-scroll');
  cards.forEach((card, index) => { card.classList.add('stack-card'); card.style.zIndex = String(index + 1); });

  const progress = new Array(cards.length).fill(-1);
  let viewport = innerHeight, queued = false;
  const update = () => {
    queued = false;
    for (let index = 0; index < cards.length - 1; index++) {
      const top = cards[index + 1].getBoundingClientRect().top;
      const value = Math.round(Math.min(1, Math.max(0, (viewport - top) / viewport)) * 1000) / 1000;
      if (value === progress[index]) continue;
      progress[index] = value;
      const card = cards[index];
      card.style.setProperty('--stack-p', String(value));
      // A fully covered section leaves paint and the accessibility hit-test path.
      card.classList.toggle('is-covered', value >= 1);
    }
  };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  const measure = () => {
    viewport = innerHeight;
    const heights = unstuck(() => cards.map(card => card.offsetHeight));
    cards.forEach((card, index) => card.style.setProperty('--stack-top', `${Math.min(0, viewport - heights[index])}px`));
    progress.fill(-1);
    update();
  };

  // Same-page anchors scroll to a section's natural place, even while it is stuck.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href*="#"]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname !== location.pathname || destination.search !== location.search) return;
    if (destination.hash === '#aloqa' && document.querySelector('#aloqa .cta-grid')) return; // main.js centres the contact form
    const id = decodeURIComponent(destination.hash.slice(1));
    const target = id && id !== 'top' ? document.getElementById(id) : document.body;
    if (!target) return;
    event.preventDefault();
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const top = target === document.body ? 0 : Math.max(0, naturalTop(target) - padding);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (location.hash !== destination.hash) history.pushState(null, '', destination.href);
    scrollTo({ top, behavior: reduce ? 'instant' : 'smooth' });
    if (target !== document.body) {
      if (!target.hasAttribute('tabindex') && !target.matches('a,button,input,select,textarea,summary')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', measure);
  addEventListener('pageshow', measure);
  new ResizeObserver(measure).observe(main);
  document.fonts?.ready.then(measure);
  measure();
})();
