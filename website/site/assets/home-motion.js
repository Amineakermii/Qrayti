// Homepage-only navigation feedback for the motion preview.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', event => {
    const button = event.target.closest?.('.screen.landing .primary-cta[data-go]');
    if (!button || event.defaultPrevented || button.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const destination = button.dataset.go;
    if (reducedMotion.matches) {
      location.hash = destination;
      return;
    }
    button.disabled = true;
    button.closest('.landing-screen')?.classList.add('home-leaving');
    setTimeout(() => { location.hash = destination; }, 155);
  }, true);
})();
