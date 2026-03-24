/* ============================================================================
   SMOOTH SCROLL & INTERSECTION OBSERVER ANIMATIONS
   Initialize Lenis smooth scroll + Add scroll-triggered animations
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================================================
    // 1. SMOOTH SCROLL DISABLED - Using native browser scrolling
    // ========================================================================
    
    // Lenis smooth scroll is disabled for faster performance
    // Using browser's default scroll behavior instead
    let lenis = null; // Keep variable for compatibility
    
    console.log('✅ Native scroll active (Lenis disabled for better performance)');

    // ========================================================================
    // 2. INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
    // ========================================================================

    // Create IntersectionObserver for animating elements on scroll
    const observerOptions = {
        threshold: 0.15,              // Trigger when 15% of element is visible
        rootMargin: '0px 0px -100px 0px'  // Start animation 100px before element is fully visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add is-visible class to trigger animation
                entry.target.classList.add('is-visible');
                
                // Optional: Stop observing after animation (saves performance)
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // ========================================================================
    // 3. APPLY OBSERVER TO ANIMATED ELEMENTS
    // ========================================================================

    // Select all elements with animation classes
    const animatedElements = document.querySelectorAll(
        '.scroll-animate, ' +
        '.scroll-animate-left, ' +
        '.scroll-animate-right, ' +
        '.scroll-animate-zoom, ' +
        '.scroll-animate.stagger'
    );

    // Observe each animated element
    animatedElements.forEach((element, index) => {
        observer.observe(element);
        
        // Add slight delay for staggered animations
        if (element.classList.contains('stagger')) {
            element.style.animationDelay = (index * 0.1) + 's';
        }
    });

    // ========================================================================
    // 4. SMOOTH ANIMATIONS FOR HERO SECTIONS & HEADERS
    // ========================================================================

    // Animate hero section content on page load
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        const heroElements = heroSection.querySelectorAll('h1, p, .cta-button');
        heroElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            setTimeout(() => {
                el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    // ========================================================================
    // 5. DYNAMIC ANIMATION ASSIGNMENT FOR COMMON SECTIONS
    // ========================================================================

    // Auto-assign animations to common elements if not already assigned
    const assignAnimationsAutomatically = () => {
        // Category cards - fade up
        document.querySelectorAll('.category-card').forEach(card => {
            if (!card.classList.contains('scroll-animate')) {
                card.classList.add('scroll-animate');
                observer.observe(card);
            }
        });

        // Why choose cards - staggered fade up
        document.querySelectorAll('.modern-why-card').forEach((card, index) => {
            if (!card.classList.contains('scroll-animate')) {
                card.classList.add('scroll-animate', 'stagger');
                card.style.animationDelay = (index * 0.1) + 's';
                observer.observe(card);
            }
        });

        // (Removed product cards to prevent conflict with gallery.js logic)

        // Section headers - slide in from left
        document.querySelectorAll('section h2').forEach(header => {
            if (!header.classList.contains('scroll-animate')) {
                header.classList.add('scroll-animate-left');
                observer.observe(header);
            }
        });
    };

    // Run automatic animation assignment
    assignAnimationsAutomatically();

    // ========================================================================
    // 6. PARALLAX EFFECT ON SCROLL (Optional - Lightweight)
    // ========================================================================

    const parallaxElements = document.querySelectorAll('[data-parallax]');
    if (parallaxElements.length > 0) {
        window.addEventListener('scroll', () => {
            parallaxElements.forEach(element => {
                const speed = element.dataset.parallax || 0.5;
                const yPos = window.scrollY * speed;
                element.style.transform = `translateY(${yPos}px)`;
            });
        }, { passive: true });
    }

    // ========================================================================
    // 7. SCROLL PROGRESS INDICATOR (Optional)
    // ========================================================================

    const createScrollProgress = () => {
        const progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(to right, #8B4513, #D2A679);
            width: 0%;
            z-index: 9999;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.width = scrollPercent + '%';
        }, { passive: true });
    };

    // Uncomment below to enable scroll progress indicator
    // createScrollProgress();

    // ========================================================================
    // 8. SMOOTH LINK NAVIGATION
    // ========================================================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                if (typeof lenis !== 'undefined') {
                    // Use Lenis smooth scroll
                    lenis.scrollTo(target);
                } else {
                    // Fallback to native smooth scroll
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // ========================================================================
    // 9. SCROLL ANIMATION FOR NAVBAR (Fade in/out on scroll)
    // ========================================================================

    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            
            if (scrollTop > 100) {
                navbar.style.boxShadow = '0 2px 10px rgba(139, 69, 19, 0.1)';
            } else {
                navbar.style.boxShadow = 'none';
            }
            
            lastScrollTop = scrollTop;
        }, { passive: true });
    }

    // ========================================================================
    // 10. COUNTER ANIMATION FOR STATS/NUMBERS
    // ========================================================================

    const animateCounters = () => {
        const counters = document.querySelectorAll('[data-count]');
        counters.forEach(counter => {
            observer.observe(counter);
            
            counter.addEventListener('animationstart', () => {
                const target = parseInt(counter.dataset.count);
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 50);
                let current = 0;

                const count = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        counter.textContent = target;
                        clearInterval(count);
                    } else {
                        counter.textContent = Math.floor(current);
                    }
                }, 50);
            });
        });
    };

    animateCounters();

    // ========================================================================
    // 11. MOBILE TOUCH OPTIMIZATION
    // ========================================================================

    // Disable hover effects on touch devices for better performance
    const isTouchDevice = () => {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    };

    if (isTouchDevice()) {
        document.body.classList.add('touch-device');
    }

    // ========================================================================
    // 12. MUTATION OBSERVER - Auto-animate dynamically added elements
    // ========================================================================

    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if element should have animation
                        if (node.classList.contains('category-card') || 
                            node.classList.contains('modern-why-card')) {
                            assignAnimationsAutomatically();
                        }
                    }
                });
            }
        });
    });

    // Start observing the document for changes
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // ========================================================================
    // 13. BACK TO TOP BUTTON
    // ========================================================================

    const disableBackToTopButton = document.body.hasAttribute('data-disable-back-to-top');

    if (disableBackToTopButton) {
        const existingBackToTopBtn = document.getElementById('backToTopBtn');
        if (existingBackToTopBtn) {
            existingBackToTopBtn.remove();
        }
    } else {
        // Create back to top button if it doesn't exist
        let backToTopBtn = document.getElementById('backToTopBtn');
        if (!backToTopBtn) {
            backToTopBtn = document.createElement('button');
            backToTopBtn.id = 'backToTopBtn';
            backToTopBtn.setAttribute('aria-label', 'Back to top');
            backToTopBtn.setAttribute('title', 'Back to top');
            document.body.appendChild(backToTopBtn);
        }

        // Show/hide button based on scroll position
        function toggleBackToTopButton() {
            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Show button when scrolled down 300px or reached 50% of page
            if (scrollPosition > 300 || scrollPosition > (documentHeight - windowHeight) * 0.5) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }

        // Scroll to top when button is clicked
        backToTopBtn.addEventListener('click', () => {
            // If Lenis is available, use it for smooth scroll
            if (typeof Lenis !== 'undefined' && lenis) {
                lenis.scrollTo(0, {
                    duration: 1.5,
                    easing: (t) => 1 - Math.pow(1 - t, 4)
                });
            } else {
                // Fallback to smooth scroll
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });

        // Listen to scroll events
        window.addEventListener('scroll', toggleBackToTopButton);
        
        // Initial check
        toggleBackToTopButton();
    }

    // ========================================================================
    // 14. DEBUG MODE (Set to false in production)
    // ========================================================================

    const DEBUG = false;
    if (DEBUG) {
        console.log('📊 Total animated elements:', animatedElements.length);
        console.log('🎯 Observer initialized for scroll animations');
        console.log('✨ Smooth scroll and animations ready!');
    }
});

// ============================================================================
// EVENT LISTENER FOR WHEN NEW CONTENT IS DYNAMICALLY LOADED
// ============================================================================

// If using AJAX or dynamic content loading, call this function:
function reinitializeScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.scroll-animate, ' +
        '.scroll-animate-left, ' +
        '.scroll-animate-right, ' +
        '.scroll-animate-zoom, ' +
        '.scroll-animate.stagger'
    );

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// ============================================================================
// EXPORT FOR USE IN OTHER SCRIPTS
// ============================================================================
window.smoothScroll = {
    reinitializeAnimations: reinitializeScrollAnimations
};
