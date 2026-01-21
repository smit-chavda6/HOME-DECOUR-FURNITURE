// Contact Page Animations and Interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize floating shapes
    initFloatingShapes();
    
    // Initialize card interactions
    initCardInteractions();
    
    // Initialize shimmer effects
    initShimmerEffects();
});

// Scroll Animation Observer
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Add staggered animation for cards
                if (entry.target.classList.contains('info-card')) {
                    const delay = entry.target.style.transitionDelay || '0s';
                    const delayValue = parseFloat(delay) * 1000;
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, delayValue);
                }
            }
        });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
}

// Floating Shapes Animation
function initFloatingShapes() {
    const shapes = document.querySelectorAll('.floating-shape');
    
    shapes.forEach((shape, index) => {
        // Add random animation delays
        const randomDelay = Math.random() * 4;
        shape.style.animationDelay = `${randomDelay}s`;
        
        // Add mouse interaction
        shape.addEventListener('mouseenter', () => {
            shape.style.animationPlayState = 'paused';
            shape.style.transform = 'scale(1.2)';
        });
        
        shape.addEventListener('mouseleave', () => {
            shape.style.animationPlayState = 'running';
            shape.style.transform = 'scale(1)';
        });
    });
}

// Card Interactions
function initCardInteractions() {
    const cards = document.querySelectorAll('.info-card');
    
    cards.forEach(card => {
        // Add ripple effect on click
        card.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            ripple.classList.add('ripple-effect');
            
            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            card.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
        
        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        });
        
        // Add parallax effect on mouse move
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

// Shimmer Effects
function initShimmerEffects() {
    const shimmerElements = document.querySelectorAll('.title-accent, .action-btn');
    
    shimmerElements.forEach(element => {
        // Add shimmer animation
        element.addEventListener('mouseenter', () => {
            element.style.animationPlayState = 'running';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.animationPlayState = 'paused';
        });
    });
}

// Enhanced Button Interactions
function initButtonInteractions() {
    const buttons = document.querySelectorAll('.action-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create click effect
            const clickEffect = document.createElement('div');
            clickEffect.classList.add('button-click-effect');
            
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            clickEffect.style.left = x + 'px';
            clickEffect.style.top = y + 'px';
            
            button.appendChild(clickEffect);
            
            setTimeout(() => {
                clickEffect.remove();
            }, 300);
        });
    });
}

// Contact Form Enhancements
function initContactForm() {
    // Support both legacy and redesigned form IDs/classes
    const form = document.getElementById('redesigned-contact-form') || document.getElementById('contact-form');
    if (!form) return; // nothing to init
    const inputs = form.querySelectorAll('input, textarea, select');

    // If already logged in, prefill and lock name/email (and phone if present)
    fetch('/api/check-auth', { credentials: 'include' })
        .then(r => r.ok ? r.json() : { authenticated: false })
        .then(data => {
            if (data && data.authenticated && data.user) {
                const n = form.querySelector('#name');
                const e = form.querySelector('#email');
                const p = form.querySelector('#phone');
                if (n) { n.value = data.user.full_name || data.user.username || ''; n.readOnly = true; n.required = false; n.classList.add('has-value'); n.parentElement?.classList.add('focused'); }
                if (e) { e.value = data.user.email || ''; e.readOnly = true; e.required = false; e.classList.add('has-value'); e.parentElement?.classList.add('focused'); }
                if (p && (data.user.phone || '').trim()) { p.value = data.user.phone; p.readOnly = true; p.classList.add('has-value'); p.parentElement?.classList.add('focused'); }
                // Optionally hide name/email groups to simplify UI when logged in
                const nameGroup = n?.closest('.form-group');
                const emailGroup = e?.closest('.form-group');
                if (nameGroup) nameGroup.style.display = 'none';
                if (emailGroup) emailGroup.style.display = 'none';
            }
        }).catch(()=>{});
    
    inputs.forEach(input => {
        // Add floating label effect
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // Add input validation animation
        input.addEventListener('input', () => {
            if (input.value) {
                input.classList.add('has-value');
            } else {
                input.classList.remove('has-value');
            }
        });
    });
    
    // Form submission with simple animation
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Support new isolated button as well
        const submitBtn = form.querySelector('.contact-send-btn, .redesigned-submit-btn, .submit-btn');
        if (!submitBtn) return;
        // Find label and icon across button variants
        const btnTextEl = submitBtn.querySelector('.contact-send-btn__label')
                          || submitBtn.querySelector('.btn-text')
                          || submitBtn.querySelector('span');
        const btnIcon = submitBtn.querySelector('.contact-send-btn__icon svg')
                          || submitBtn.querySelector('.btn-icon')
                          || submitBtn.querySelector('svg');
        const originalText = btnTextEl ? btnTextEl.textContent : '';
        const originalIcon = btnIcon ? btnIcon.outerHTML : '';
        
        // Ensure no size changes
        submitBtn.style.transform = 'none';
        submitBtn.style.boxShadow = '0 8px 32px rgba(139, 69, 19, 0.10)';
        submitBtn.style.width = submitBtn.offsetWidth + 'px';
        submitBtn.style.height = submitBtn.offsetHeight + 'px';
        
        // Add loading state
    submitBtn.classList.add('loading');
    if (btnTextEl) btnTextEl.textContent = 'Sending...';
    if (btnIcon && btnIcon.style) btnIcon.style.opacity = '0';
        
        // Collect form values
        const payload = {
            name: form.querySelector('#name')?.value?.trim() || undefined,
            email: form.querySelector('#email')?.value?.trim() || undefined,
            phone: form.querySelector('#phone')?.value?.trim() || undefined,
            subject: form.querySelector('#subject')?.value || 'general',
            message: form.querySelector('#message')?.value?.trim() || ''
        };

        // Persist to backend
        fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(async (res)=>{
            if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Failed to send');
            return res.json();
        }).then(() => {
            // Success UI
            submitBtn.classList.remove('loading');
            if (btnTextEl) btnTextEl.textContent = 'Message Sent!';
            if (btnIcon) {
                btnIcon.outerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
            }
            submitBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';

            const sendSection = document.querySelector('.send-message-section');
            if (sendSection) sendSection.classList.add('is-hidden');
            const popup = document.getElementById('contactSuccessPopup');
            if (popup) popup.setAttribute('aria-hidden','false');

            // Reset after a pause
            setTimeout(() => {
                form.reset();
                if (btnTextEl) btnTextEl.textContent = originalText;
                // Restore icon for all variants
                const existingIcon = submitBtn.querySelector('svg');
                if (!existingIcon && originalIcon) {
                    const iconWrap = submitBtn.querySelector('.contact-send-btn__icon');
                    if (iconWrap) {
                        iconWrap.innerHTML = originalIcon;
                    } else {
                        submitBtn.insertAdjacentHTML('beforeend', originalIcon);
                    }
                }
                submitBtn.style.background = 'linear-gradient(135deg, #8B4513, #D2691E)';
                submitBtn.classList.remove('loading');

                // Reset button styles
                submitBtn.style.transform = '';
                submitBtn.style.boxShadow = '';
                submitBtn.style.width = '';
                submitBtn.style.height = '';

                if (popup) popup.setAttribute('aria-hidden','true');
                if (sendSection) sendSection.classList.remove('is-hidden');

                // Reset input states
                inputs.forEach(input => {
                    input.classList.remove('has-value');
                    input.parentElement.classList.remove('focused');
                });
            }, 3000);
        }).catch((err) => {
            // Error UI
            submitBtn.classList.remove('loading');
            submitBtn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            if (btnTextEl) btnTextEl.textContent = err.message || 'Failed';
            setTimeout(() => {
                if (btnTextEl) btnTextEl.textContent = originalText;
                submitBtn.style.background = 'linear-gradient(135deg, #8B4513, #D2691E)';
            }, 2000);
        });
    });
}

// Initialize all functions
document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initFloatingShapes();
    initCardInteractions();
    initShimmerEffects();
    initButtonInteractions();
    initContactForm();
});

// Add CSS for additional effects
const additionalStyles = `
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .button-click-effect {
        position: absolute;
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        transform: scale(0);
        animation: buttonClick 0.3s ease-out;
        pointer-events: none;
    }
    
    @keyframes buttonClick {
        to {
            transform: scale(3);
            opacity: 0;
        }
    }
    
    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    
    .form-group {
        position: relative;
    }
    
    .form-group.focused label {
        transform: translateY(-25px) scale(0.8);
        color: #8B4513;
    }
    
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
        border-color: #8B4513;
        box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
    }
    
    .form-group input.has-value,
    .form-group textarea.has-value,
    .form-group select.has-value {
        border-color: #27ae60;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 


// ============================================================
// CONTACT FORM HANDLER WITH LOGIN MODAL
// ============================================================
// Handles contact form submission with:
// - Login state detection via API
// - Custom styled modal popup (no browser alert)
// - Form data preservation in sessionStorage
// - Automatic redirect after login
// - Form data restoration after login redirect
// ============================================================

(function() {
    'use strict';

    // ============= DOM ELEMENTS =============
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const loginModal = document.getElementById('loginRequiredModal');
    const modalOverlay = loginModal?.querySelector('.modal-overlay');
    const modalCancelBtn = loginModal?.querySelector('.modal-cancel-btn');
    const modalOkBtn = loginModal?.querySelector('.modal-ok-btn');

    // ============= STORAGE KEY =============
    const FORM_DATA_KEY = 'contactFormData';
    const REDIRECT_KEY = 'contactRedirect';

    // ============= MODAL FUNCTIONS =============
    
    /**
     * Show the login required modal
     * Displays a styled popup instead of browser alert
     */
    function showLoginModal() {
        if (loginModal) {
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    }

    /**
     * Hide the login required modal
     */
    function hideLoginModal() {
        if (loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scroll
        }
    }

    /**
     * Save form data to sessionStorage
     * Preserves user's typed message for restoration after login
     */
    function saveFormData() {
        if (!contactForm) return;
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        
        // Save to sessionStorage (cleared when browser closes)
        sessionStorage.setItem(FORM_DATA_KEY, JSON.stringify(data));
        // Mark that user should be redirected back to contact page
        sessionStorage.setItem(REDIRECT_KEY, 'true');
        
        console.log('Form data saved to sessionStorage');
    }

    /**
     * Restore form data from sessionStorage
     * Called on page load to restore previously typed message
     */
    function restoreFormData() {
        if (!contactForm) return;
        
        const savedData = sessionStorage.getItem(FORM_DATA_KEY);
        const shouldRestore = sessionStorage.getItem(REDIRECT_KEY);
        
        if (savedData && shouldRestore) {
            try {
                const data = JSON.parse(savedData);
                
                // Restore each form field
                Object.keys(data).forEach(key => {
                    const field = contactForm.querySelector(`[name="${key}"]`);
                    if (field) {
                        field.value = data[key];
                    }
                });
                
                console.log('Form data restored from sessionStorage');
                
                // Clear the storage after restoration
                sessionStorage.removeItem(FORM_DATA_KEY);
                sessionStorage.removeItem(REDIRECT_KEY);
            } catch (err) {
                console.error('Error restoring form data:', err);
            }
        }
    }

    /**
     * Handle redirect to login page
     * Saves form data and redirects user
     */
    function redirectToLogin() {
        saveFormData();
        hideLoginModal();
        // Redirect to login page with return URL
        window.location.href = '/login.html?redirect=/contact.html';
    }

    // ============= EVENT LISTENERS =============
    
    // Modal Cancel button
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', hideLoginModal);
    }

    // Modal overlay click (close on outside click)
    if (modalOverlay) {
        modalOverlay.addEventListener('click', hideLoginModal);
    }

    // Modal OK/Login button - save data and redirect
    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', redirectToLogin);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && loginModal?.classList.contains('active')) {
            hideLoginModal();
        }
    });

    // ============= FORM SUBMISSION =============
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Step 1: Check if user is logged in
            let isAuthenticated = false;
            
            try {
                const authCheck = await fetch('/api/check-auth', { credentials: 'include' });
                const authData = await authCheck.json();
                isAuthenticated = authData.authenticated;
            } catch (err) {
                console.error('Auth check failed:', err);
                isAuthenticated = false;
            }

            // Step 2: If NOT logged in, show modal (NOT alert)
            if (!isAuthenticated) {
                showLoginModal();
                // Form data is preserved - we don't reset or clear anything
                return;
            }

            // Step 3: User is logged in - proceed with form submission
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            
            try {
                // Submit to API
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    // Show error notification
                    showErrorNotification('Error sending message: ' + (result.error || 'Unknown error'));
                    return;
                }
                
                console.log('Message sent successfully:', result);
                
                // Hide form and show success message
                contactForm.style.display = 'none';
                formSuccess.removeAttribute('hidden');
                
                // Reset form after 3 seconds
                setTimeout(() => {
                    contactForm.reset();
                    contactForm.style.display = 'block';
                    formSuccess.setAttribute('hidden', '');
                }, 3000);
                
            } catch (err) {
                console.error('Form submission error:', err);
                showErrorNotification('Error sending message. Please try again.');
            }
        });
    }

    /**
     * Show error notification (styled toast)
     */
    function showErrorNotification(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'contact-toast error';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ============= INITIALIZATION =============
    
    // Restore form data on page load (if redirected back from login)
    restoreFormData();

})();
