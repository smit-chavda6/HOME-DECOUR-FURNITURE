// Mobile menu fallback shim (only runs if app.js isn't loaded or didn't initialize)
// This is legacy code - the primary implementation is now in app.js
document.addEventListener('DOMContentLoaded', () => {
  // Exit if app.js already handled initialization
  if (window.__navbarInit) return;
  // Exit if this shim already ran
  if (window.__mobileMenuShim) return;
  window.__mobileMenuShim = true;

  // Fallback menu initialization for pages that don't include app.js
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const navbarMenu = document.querySelector('.navbar-menu');
  
  if (!hamburger || !navbarMenu) return; // No menu to initialize

  let backdrop = null;

  const setMenuOpen = (open) => {
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

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navbarMenu.classList.contains('active');
    setMenuOpen(!isOpen);
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navbar && navbarMenu && navbarMenu.classList.contains('active') && !navbar.contains(e.target)) {
      setMenuOpen(false);
    }
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbarMenu && navbarMenu.classList.contains('active')) {
      setMenuOpen(false);
    }
  });

  // Close when clicking a link
  const links = navbarMenu.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        setMenuOpen(false);
      }
    });
  });
});
