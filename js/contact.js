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
        
        const submitBtn = form.querySelector('.redesigned-submit-btn, .submit-btn');
        if (!submitBtn) return;
        // For redesigned button simple content structure
        const btnTextEl = submitBtn.querySelector('.btn-text') || submitBtn.querySelector('span');
        const btnIcon = submitBtn.querySelector('.btn-icon') || submitBtn.querySelector('svg');
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
        
        // Simulate form submission
        setTimeout(() => {
            // Show success state
            submitBtn.classList.remove('loading');
            if (btnTextEl) btnTextEl.textContent = 'Message Sent!';
            if (btnIcon) {
                btnIcon.outerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
            }
            submitBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            
            // Show success message
            const successMessage = document.getElementById('contact-success');
            if (successMessage) {
                successMessage.style.display = 'flex';
                // add class to trigger scoped CSS animations
                successMessage.classList.add('show');
                // generate confetti pieces only first time per show
                if (!successMessage.dataset.confetti) {
                    const colors = ['primary','secondary','accent'];
                    for (let i=0;i<14;i++) {
                        const piece = document.createElement('span');
                        piece.className = 'success-confetti-piece' + (i%3===1?' alt': i%3===2?' accent':'');
                        // random trajectory via CSS vars
                        const angle = (Math.random()*100) - 50; // horizontal spread
                        const distance = 40 + Math.random()*70; // vertical distance
                        const rotate = Math.floor(Math.random()*360) + 'deg';
                        piece.style.setProperty('--x', angle + 'px');
                        piece.style.setProperty('--y', distance * -1 + 'px');
                        piece.style.setProperty('--r', rotate);
                        piece.style.animationDelay = (Math.random()*0.25)+'s';
                        piece.style.left = (50 + angle/6)+'%';
                        successMessage.appendChild(piece);
                    }
                    successMessage.dataset.confetti = 'true';
                }
            }
            
            // Reset form after 3 seconds
            setTimeout(() => {
                form.reset();
                if (btnTextEl) btnTextEl.textContent = originalText;
                if (originalIcon && submitBtn.querySelector('svg')) {
                    // already replaced, nothing else
                } else if (originalIcon) {
                    submitBtn.insertAdjacentHTML('beforeend', originalIcon);
                }
                submitBtn.style.background = 'linear-gradient(135deg, #8B4513, #D2691E)';
                submitBtn.classList.remove('loading');
                
                // Reset button styles
                submitBtn.style.transform = '';
                submitBtn.style.boxShadow = '';
                submitBtn.style.width = '';
                submitBtn.style.height = '';
                
                // Hide success message
                if (successMessage) {
                    successMessage.style.display = 'none';
                    successMessage.classList.remove('show');
                    // remove confetti for next show cycle
                    successMessage.querySelectorAll('.success-confetti-piece').forEach(p=>p.remove());
                    delete successMessage.dataset.confetti;
                }
                
                // Reset input states
                inputs.forEach(input => {
                    input.classList.remove('has-value');
                    input.parentElement.classList.remove('focused');
                });
            }, 3000);
        }, 2000);
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


