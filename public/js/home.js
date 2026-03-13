// Home Page Slideshow and Interactive Features
document.addEventListener('DOMContentLoaded', function () {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const totalSlides = slides.length;

    // Auto-advance slideshow
    let slideInterval = setInterval(nextSlide, 5000);

    // Function to show a specific slide
    function showSlide(n) {
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Remove active class from all dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });

        // Show the current slide and activate corresponding dot
        if (slides[n]) {
            slides[n].classList.add('active');
        }
        if (dots[n]) {
            dots[n].classList.add('active');
        }

        currentSlide = n;
    }

    // Function to go to next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    // Function to go to previous slide
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }

    // Make functions globally available for onclick handlers
    window.changeSlide = function (direction) {
        clearInterval(slideInterval);
        if (direction === 1) {
            nextSlide();
        } else {
            prevSlide();
        }
        // Restart auto-advance
        slideInterval = setInterval(nextSlide, 10000);
    };

    window.currentSlide = function (n) {
        clearInterval(slideInterval);
        showSlide(n - 1);
        // Restart auto-advance
        slideInterval = setInterval(nextSlide, 10000);
    };

    // Pause slideshow on hover
    const slideshowContainer = document.querySelector('.slideshow-container');
    if (slideshowContainer) {
        slideshowContainer.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });

        slideshowContainer.addEventListener('mouseleave', () => {
            slideInterval = setInterval(nextSlide, 10000);
        });
    }

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

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature, .category-card, .reason-card, .welcome-content, .cta-content');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Add hover effects to category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-10px)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add click effects to CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Newsletter form handling
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = this.querySelector('.newsletter-input').value;

            // Show success message using cart popup system
            if (window.cartPopupSystem) {
                window.cartPopupSystem.showNotification('Thank you for subscribing!', 'success');
            }
            this.reset();
        });
    }

    // Initialize first slide
    showSlide(0);

    // Authentication Check for Login Ad Popup
    setTimeout(async () => {
        try {
            const response = await fetch('/api/check-auth', { credentials: 'include' });
            const data = await response.json();

            // Show ad if not authenticated OR checking specific 'not logged in' condition
            if (!data || !data.authenticated) {
                // Ensure we only annoy them once per session
                if (!sessionStorage.getItem('loginPopupShown')) {
                    sessionStorage.setItem('loginPopupShown', 'true');
                    showLoginBanner();
                }
            }
        } catch (err) {
            console.error('Error checking auth for login popup:', err);
        }
    }, 2500); // Wait 2.5s to let the homepage visually settle

    function showLoginBanner() {
        // Create popup DOM
        const popup = document.createElement('div');
        popup.className = 'login-ad-popup';
        popup.innerHTML = `
            <div class="login-ad-content">
                <button class="login-ad-close" aria-label="Close">&times;</button>
                <h3>Welcome to Home Decor!</h3>
                <p>Register or Login now to save items to your wishlist, track orders easily, and get exclusive member deals.</p>
                <div class="login-ad-actions">
                    <a href="login.html" class="btn btn-primary">Login Now</a>
                    <a href="register.html" class="btn btn-secondary">Create Account</a>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        // Inject scoped styles
        const style = document.createElement('style');
        style.textContent = `
            .login-ad-popup {
                position: fixed;
                top: calc(85px + 24px); /* navbar height approx 85px + gap */
                right: 24px;
                width: calc(100% - 48px);
                max-width: 380px;
                background: #ffffff;
                border: 1px solid rgba(139, 69, 19, 0.15);
                box-shadow: 0 15px 40px rgba(139, 69, 19, 0.2);
                border-radius: 16px;
                padding: 24px;
                z-index: 10000;
                transform: translateY(-20px) scale(0.95);
                opacity: 0;
                transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 0.5s ease;
                font-family: 'Jost', sans-serif;
            }
            body.dark-mode .login-ad-popup {
                background: #15171b;
                border-color: #252932;
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
            }
            .login-ad-popup.show {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            .login-ad-close {
                position: absolute;
                top: 12px;
                right: 16px;
                background: none;
                border: none;
                font-size: 28px;
                line-height: 1;
                cursor: pointer;
                color: #888;
                transition: color 0.2s ease;
            }
            .login-ad-close:hover { color: #e74c3c; }
            body.dark-mode .login-ad-close { color: #666; }
            body.dark-mode .login-ad-close:hover { color: #ff6b6b; }
            
            .login-ad-content h3 {
                margin: 0 0 12px 0;
                color: #8B4513;
                font-weight: 700;
                font-size: 1.3rem;
            }
            body.dark-mode .login-ad-content h3 { 
                color: transparent;
                background: linear-gradient(135deg, var(--accent1, #A46B3D), var(--accent2, #D28B4F));
                -webkit-background-clip: text;
                background-clip: text;
            }
            .login-ad-content p {
                font-size: 0.95rem;
                margin-bottom: 20px;
                line-height: 1.5;
                color: #555;
            }
            body.dark-mode .login-ad-content p { color: #bbb; }
            
            .login-ad-actions {
                display: flex;
                gap: 12px;
            }
            .login-ad-actions .btn {
                padding: 10px 16px;
                border-radius: 8px;
                text-decoration: none;
                font-size: 0.9rem;
                font-weight: 600;
                text-align: center;
                flex: 1;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                border: none;
            }
            .login-ad-actions .btn:hover {
                transform: translateY(-2px);
            }
            .login-ad-actions .btn-primary {
                background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
                color: white;
                box-shadow: 0 6px 16px rgba(139, 69, 19, 0.25);
            }
            .login-ad-actions .btn-primary:hover {
                box-shadow: 0 8px 20px rgba(139, 69, 19, 0.35);
            }
            .login-ad-actions .btn-secondary {
                background: transparent;
                border: 2px solid #EED9C4;
                color: #8B4513;
            }
            .login-ad-actions .btn-secondary:hover {
                background: #FFF6EE;
                border-color: #8B4513;
            }
            
            body.dark-mode .login-ad-actions .btn-primary {
                background: linear-gradient(135deg, var(--accent1), var(--accent2));
                color: var(--accentText);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            }
            body.dark-mode .login-ad-actions .btn-primary:hover {
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
            }
            body.dark-mode .login-ad-actions .btn-secondary {
                border-color: #333;
                color: var(--accent2);
            }
            body.dark-mode .login-ad-actions .btn-secondary:hover {
                border-color: var(--accent2);
                background: rgba(255, 255, 255, 0.05);
            }
            
            @media (max-width: 480px) {
                .login-ad-popup {
                    top: calc(65px + 16px);
                    right: 16px;
                    width: calc(100% - 32px);
                }
                .login-ad-actions {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);

        // Slide the ad up slightly after it attaches
        requestAnimationFrame(() => {
            setTimeout(() => popup.classList.add('show'), 50);
        });

        // Event listener for closing
        popup.querySelector('.login-ad-close').addEventListener('click', () => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500); // 500ms allows exit animation
        });
    }

}); 