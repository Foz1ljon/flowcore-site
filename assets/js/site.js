/* Lightweight controls for the static product pages. */
(() => {
  const root = document.documentElement;
  const button = document.querySelector('#themeToggle');
  const sync = () => {
    const dark = root.dataset.theme === 'dark';
    button.setAttribute('aria-label', dark ? 'Yorug‘ ko‘rinishga o‘tish' : 'Tungi ko‘rinishga o‘tish');
    document.querySelector('#themeColor').content = dark ? '#09090b' : '#fafafa';
  };
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('flowcore-theme', root.dataset.theme); } catch { /* Keep the toggle usable without storage. */ }
    sync();
  });
  sync();
  const back = document.querySelector('#goBack');
  if (back) {
    back.hidden = false;
    back.addEventListener('click', () => {
      if (history.length > 1) history.back();
      else location.assign('/');
    });
  }
})();
