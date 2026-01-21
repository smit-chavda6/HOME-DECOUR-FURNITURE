// Lightweight mobile menu helper (fallback for legacy includes)
(() => {
  if (window.__mobileMenuShim) return;
  window.__mobileMenuShim = true;

  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const navbarMenu = document.querySelector('.navbar-menu');
  let backdrop = null;

  const setMenuOpen = (open) => {
    if (!hamburger || !navbarMenu) return;
    hamburger.classList.toggle('active', !!open);
    navbarMenu.classList.toggle('active', !!open);
    document.body.classList.toggle('no-scroll', !!open);
    if (open) {
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'navbar-backdrop active';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', () => setMenuOpen(false));
      } else {
        backdrop.classList.add('active');
      }
    } else if (backdrop) {
      backdrop.classList.remove('active');
    }
  };

  if (hamburger && navbarMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = navbarMenu.classList.contains('active');
      setMenuOpen(!isOpen);
    });
  }

  // Close on link click (mobile)
  document.addEventListener('click', (e) => {
    if (!navbar) return;
    if (navbarMenu && navbarMenu.classList.contains('active') && !navbar.contains(e.target)) {
      setMenuOpen(false);
    }
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbarMenu && navbarMenu.classList.contains('active')) setMenuOpen(false);
  });
})();
