(() => {
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let language = 'fr';
  try {
    const savedTheme = localStorage.getItem('qrayti-teacher-theme');
    const savedLanguage = localStorage.getItem('qrayti-teacher-language');
    if (['light', 'dark'].includes(savedTheme)) theme = savedTheme;
    if (['fr', 'en'].includes(savedLanguage)) language = savedLanguage;
  } catch { /* Browser storage may be disabled. */ }
  const previewLanguage=new URLSearchParams(location.search).get('preview-language');
  if(window.parent!==window&&new URLSearchParams(location.search).has('admin-preview')&&['fr','en'].includes(previewLanguage))language=previewLanguage;
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = language;
  document.documentElement.dir = 'ltr';
})();
