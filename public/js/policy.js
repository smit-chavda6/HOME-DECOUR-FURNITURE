/**
 * Policy Pages Scripts (Privacy Policy & Terms of Service)
 * Handles active navigation state and any specific interactivity.
 */

(function () {
    'use strict';

    // Highlight active navigation link based on current page URL
    try {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.navbar .navbar-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === path || (path === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('Error setting active navigation link:', error);
    }

    // Optional: Add smooth scrolling for anchor links within the policy content
    const anchorLinks = document.querySelectorAll('.policy-card a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100, // Offset for fixed header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Dark Mode Specific Adjustments (if any dynamic behavior is needed)
    // The CSS handles most dark mode styles via the .dark-mode body class.
})();
