// Modern Navbar JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    // Check authentication status and update navbar
    checkAuthAndUpdateNavbar();
    
    // Hamburger menu functionality
    if (hamburger && navbarMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link (improved for mobile)
        const navbarLinks = document.querySelectorAll('.navbar-link');
        navbarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    hamburger.classList.remove('active');
                    navbarMenu.classList.remove('active');
                }
            });
        });
    }
    
    // Scroll effect for navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
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
        if (!navbar.contains(e.target) && navbarMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
        }
    });
    
    // Keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navbarMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
        }
    });
    
    // Authentication functions
    async function checkAuthAndUpdateNavbar() {
        try {
            const response = await fetch('http://localhost:3000/api/check-auth', {
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
                    <p>Email: ${user.email}</p>
                </div>
                <div class="user-actions">
                    <button class="btn-secondary" onclick="window.location.href='profile.html'">Profile</button>
                    <button class="btn-primary" onclick="logout()">Logout</button>
                </div>
            </div>
        `;
        
        popup.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 1000;
            padding: 20px;
            min-width: 250px;
            border: 1px solid #eee;
        `;
        
        document.body.appendChild(popup);
        
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
            const response = await fetch('http://localhost:3000/api/logout', {
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
}); 