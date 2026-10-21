// Runs before the stylesheet so the saved theme is applied before first paint.
(() => {
  let saved;
  try { saved=localStorage.getItem('qrayti-admin-theme'); } catch {}
  document.documentElement.dataset.theme=['light','dark'].includes(saved)
    ? saved : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();
