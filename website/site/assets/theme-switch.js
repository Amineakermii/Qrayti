// The teacher portal's day/night character, reused without changing page theme storage or click handlers.
(() => {
  const selector = '#themeBtn, [data-theme-toggle]';
  const artwork = `<svg class="theme-clouds" viewBox="0 0 88 46" aria-hidden="true" focusable="false"><path d="M36 46V35c0-6 8-9 12-5 1-9 14-12 19-4 7-7 18-3 19 5h8v15Z" fill="currentColor"/><path d="M49 46V40c0-5 6-7 10-4 3-9 16-8 19 0 5-3 11 0 11 5v5Z" fill="white"/></svg>
    <svg class="theme-stars" viewBox="0 0 88 46" aria-hidden="true" focusable="false"><path d="m18 8 1.2 3.8L23 13l-3.8 1.2L18 18l-1.2-3.8L13 13l3.8-1.2Zm18 15 .8 2.7L39.5 27l-2.7.8L36 30.5l-.8-2.7L32.5 27l2.7-1.3Z" fill="currentColor"/><circle cx="10" cy="30" r="1.2" fill="currentColor"/><circle cx="34" cy="11" r="1" fill="currentColor"/><circle cx="23" cy="35" r="1" fill="currentColor"/></svg>
    <span class="theme-orb" aria-hidden="true"><svg viewBox="0 0 36 36" focusable="false"><g class="theme-sun"><circle cx="18" cy="18" r="18" fill="#ffd166"/><path d="M11 16v1m14-1v1m-10 5q3 3 6 0" fill="none" stroke="#735016" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="21" r="2" fill="#efad64"/><circle cx="27" cy="21" r="2" fill="#efad64"/></g><g class="theme-moon"><circle cx="18" cy="18" r="18" fill="#e4ebf7"/><circle cx="9" cy="9" r="3.5" fill="#bdcce3"/><circle cx="26" cy="10" r="2" fill="#c9d6e9"/><circle cx="27" cy="27" r="3" fill="#c9d6e9"/><path d="M10 18q2 2 4 0m8 0q2 2 4 0m-11 6q3 2 6 0" fill="none" stroke="#52647e" stroke-width="1.6" stroke-linecap="round"/></g></svg></span>`;
  function sync() {
    const root = document.documentElement;
    const dark = root.dataset.theme === 'dark';
    const labels = root.lang.startsWith('ar') ? ['الوضع الفاتح', 'الوضع الداكن'] : root.lang.startsWith('fr') ? ['Mode jour', 'Mode nuit'] : ['Light mode', 'Dark mode'];
    document.querySelectorAll(selector).forEach(button => {
      if (!button.classList.contains('qrayti-theme-switch')) {
        button.classList.add('qrayti-theme-switch');
        button.innerHTML = artwork;
      }
      button.setAttribute('role', 'switch');
      button.setAttribute('aria-checked', String(dark));
      button.setAttribute('aria-label', labels[1]);
      button.title = labels[dark ? 0 : 1];
    });
  }
  sync();
  new MutationObserver(sync).observe(document.documentElement, {attributes:true,attributeFilter:['data-theme','lang']});
  // Admin rebuilds this small toolbar when changing language or navigating, not when switching theme.
  const toolbar = document.getElementById('languageBar');
  if (toolbar) new MutationObserver(sync).observe(toolbar, {childList:true});
})();
