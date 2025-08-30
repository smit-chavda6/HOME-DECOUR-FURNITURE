// Modern Navbar JavaScript
document.addEventListener('DOMContentLoaded', function() {
    if (window.__navbarInit) return; // prevent double init if script included twice
    window.__navbarInit = true;
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navbarMenu = document.querySelector('.navbar-menu');
    let backdrop = null;
    // Ensure a mobile cart icon exists next to hamburger for small screens
    const ensureMobileCartIcon = () => {
        const container = document.querySelector('.navbar-container');
        const existingMobileCart = document.querySelector('.mobile-cart-icon');
        const desktopCart = document.querySelector('.navbar-menu .cart-icon');
        if (!container || !desktopCart) return;
        // Only add on small screens and if missing
        if (window.innerWidth <= 768 && !existingMobileCart) {
            const mobileCart = desktopCart.cloneNode(true);
            mobileCart.classList.add('mobile-cart-icon');
            // Remove active class to avoid layout issues
            mobileCart.classList.remove('cart-icon');
            // Keep count element
            const count = mobileCart.querySelector('.cart-count');
            if (count) { count.style.display = count.textContent !== '0' ? 'flex' : 'none'; }
            // Insert after hamburger
            if (hamburger && hamburger.parentNode === container) {
                container.insertBefore(mobileCart, hamburger.nextSibling);
            } else {
                container.appendChild(mobileCart);
            }
            // Let cart popup system rebind later
        }
    };
    ensureMobileCartIcon();
    
    // Check authentication status and update navbar
    checkAuthAndUpdateNavbar();
    
    // Hamburger menu functionality
    function setMenuOpen(open){
        if (!hamburger || !navbarMenu) return;
        hamburger.classList.toggle('active', !!open);
        navbarMenu.classList.toggle('active', !!open);
        hamburger.setAttribute('aria-expanded', !!open);
        document.body.classList.toggle('no-scroll', !!open);
        // Create/remove backdrop
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
    }

    if (hamburger && navbarMenu) {
        hamburger.setAttribute('aria-controls', 'primary-navigation');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.addEventListener('click', () => {
            const isOpen = navbarMenu.classList.contains('active');
            setMenuOpen(!isOpen);
        });
    // Recreate/ensure mobile cart if viewport changed
    window.addEventListener('resize', ensureMobileCartIcon);
        
        // Close menu when clicking on a link (improved for mobile)
        const navbarLinks = document.querySelectorAll('.navbar-link');
        navbarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) setMenuOpen(false);
            });
        });
    }
    
    // Scroll effect for navbar
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // Active page highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navbarLinks = document.querySelectorAll('.navbar-link');
    
    navbarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navbar && navbarMenu && !navbar.contains(e.target) && navbarMenu.classList.contains('active')) {
            setMenuOpen(false);
        }
    });
    
    // Keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navbarMenu && navbarMenu.classList.contains('active')) setMenuOpen(false);
    });

    // Close menu when resizing to desktop to avoid stuck state
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navbarMenu && navbarMenu.classList.contains('active')) {
            setMenuOpen(false);
        }
    ensureMobileCartIcon();
    });
    
    // Authentication functions
    async function checkAuthAndUpdateNavbar() {
        try {
            const response = await fetch('/api/check-auth', {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.authenticated) {
                updateNavbarForLoggedInUser(data.user);
            } else {
                updateNavbarForLoggedOutUser();
            }
        } catch (error) {
            console.log('Auth check failed:', error);
            updateNavbarForLoggedOutUser();
        }
    }
    
    function updateNavbarForLoggedInUser(user) {
        const loginBtn = document.getElementById('navbar-login-btn');
        if (loginBtn) {
            loginBtn.innerHTML = `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
            loginBtn.title = `Welcome, ${user.username}`;
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showLoginPopup(user);
            });
        }
    }
    
    function updateNavbarForLoggedOutUser() {
        const loginBtn = document.getElementById('navbar-login-btn');
        if (loginBtn) {
            loginBtn.innerHTML = `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 8-4 8-4s8 0 8 4v1H4v-1z"/>
                </svg>
            `;
            loginBtn.title = 'Login';
            loginBtn.href = 'login.html';
        }
    }
    
    function showLoginPopup(user) {
        // Remove existing popup
        const existingPopup = document.querySelector('.user-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        const popup = document.createElement('div');
        popup.className = 'user-popup';
        popup.innerHTML = `
            <div class="user-popup-content">
                <div class="user-info">
                    <h3>Welcome, ${user.username}!</h3>
                    <p>${user.email ? `Email: ${user.email}` : ''}</p>
                </div>
                <div class="user-actions">
                    ${user.role === 'admin' ? `<button class="btn-secondary" onclick="window.location.href='admin.html'">Admin Panel</button>` : ''}
                    <button class="btn-secondary" onclick="window.location.href='profile.html'">Profile</button>
                    <button class="btn-primary" onclick="logout()">Logout</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);

    // Theming is handled via CSS in CSS/navbar.css for .user-popup
        
        // Close popup when clicking outside
        function closePopupOnClickOutside(e) {
            if (!popup.contains(e.target) && !document.getElementById('navbar-login-btn').contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', closePopupOnClickOutside);
            }
        }
        
        setTimeout(() => {
            document.addEventListener('click', closePopupOnClickOutside);
        }, 100);
    }
    
    // Global logout function
    window.logout = async function() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };
    
    // === Dark Mode Toggle & Persistence ===
    (function setupThemeToggle(){
        const THEME_KEY = 'hdf-theme';
        const ACCENT_KEY = 'hdf-accent';
        const ACCENTS = ['accent-amber','accent-emerald','accent-rose','accent-sapphire'];
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const saved = localStorage.getItem(THEME_KEY);
        let theme = saved || (prefersDark ? 'dark' : 'light');
        let accent = localStorage.getItem(ACCENT_KEY) || 'accent-amber';

        // Ensure dark-mode stylesheet is present
        const hasDarkCss = Array.from(document.styleSheets).some(ss => {
            try { return (ss.href||'').endsWith('CSS/dark-mode.css') || (ss.href||'').includes('dark-mode.css'); } catch { return false; }
        });
        if (!hasDarkCss) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'CSS/dark-mode.css';
            document.head.appendChild(link);
        }

    function applyTheme(t){
            document.body.classList.toggle('dark-mode', t === 'dark');
            const btn = document.getElementById('themeToggle');
            const icon = document.getElementById('themeIcon');
            if (btn && icon) {
                btn.title = (t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
                btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
                // Icon: dark mode = half-moon (crescent), light mode = sun
                icon.innerHTML = t === 'dark'
                    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
                    : '<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.48 0l1.79-1.79 1.41 1.41-1.79 1.8-1.41-1.42zM12 4V1h-2v3h2zm0 19v-3h-2v3h2zm8-9h3v-2h-3v2zM1 12H4v-2H1v2zm15.24 7.16l1.79 1.79 1.41-1.41-1.79-1.8-1.41 1.42zM4.22 18.95l-1.79 1.79 1.41 1.41 1.8-1.79-1.42-1.41zM18 12a6 6 0 1 1-6-6 6 6 0  0 1 6 6z"/>';
            }

            // Swap navbar brand logo based on theme
            const logoEls = document.querySelectorAll('img.navbar-logo');
            logoEls.forEach(img => {
                // Only swap known site logo assets to avoid changing product images accidentally
                const isLightLogo = /Logo maker project\.(webp|png|jpg)$/i.test(img.getAttribute('src') || '');
                const isDarkLogo = /dark logo\.(png|webp|jpg)$/i.test(img.getAttribute('src') || '');
                if (t === 'dark') {
                    if (!isDarkLogo) {
                        img.setAttribute('src', 'image/dark logo.png');
                    }
                } else {
                    if (!isLightLogo) {
                        img.setAttribute('src', 'image/Logo maker project.webp');
                    }
                }
            });
        }

    function applyAccent(a){
        // Remove any previous accent class
        ACCENTS.forEach(c => document.body.classList.remove(c));
        if (!ACCENTS.includes(a)) a = 'accent-amber';
        document.body.classList.add(a);
    }

        // Create toggle button if missing
        let toggle = document.getElementById('themeToggle');
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.id = 'themeToggle';
            toggle.className = 'theme-toggle';
            toggle.type = 'button';
            toggle.setAttribute('aria-label', 'Toggle dark mode');
            toggle.innerHTML = '<svg id="themeIcon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.64 13a1 1 0 0 0-1.05-.14A8 8 0 1 1 11.14 3.41a1 1 0 0 0-.14-1.05 1 1 0 0 0-1.09-.33A10 10 0 1 0 22 14.09a1 1 0 0 0-.36-1.09z"/></svg>';
            document.body.appendChild(toggle);
        }
        toggle.hidden = false;

        // Initial apply
        applyTheme(theme);
        applyAccent(accent);

        // Toggle handler (no Shift-click accent switching)
        toggle.addEventListener('click', () => {
            theme = theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem(THEME_KEY, theme);
            applyTheme(theme);
        });
    })();
}); 