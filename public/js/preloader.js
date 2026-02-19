/* ============================================================================
   ULTRA-PREMIUM MINIMALIST PRELOADER
   GSAP Timeline for Luxury Furniture Brand
   ============================================================================ */

// Add loading class immediately
document.body.classList.add('loading');

// Wait for DOM and GSAP
document.addEventListener('DOMContentLoaded', function() {
    
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined') {
        console.warn('⚠️ GSAP not loaded. Falling back to simple preloader.');
        fallbackPreloader();
        return;
    }
    
    // Initialize elements
    const preloader = document.querySelector('.preloader');
    const preloaderBrand = document.querySelector('.preloader-brand');
    const brandPart1 = document.querySelector('.brand-part-1');
    const brandPart2 = document.querySelector('.brand-part-2');
    const preloaderSubtitle = document.querySelector('.preloader-subtitle');
    const preloaderCounter = document.querySelector('.preloader-counter');
    const preloaderLine = document.querySelector('.preloader-line');
    const preloaderLineFill = document.querySelector('.preloader-line-fill');
    const preloaderLeft = document.querySelector('.preloader-left');
    const preloaderRight = document.querySelector('.preloader-right');
    const navbar = document.querySelector('.navbar');
    const navbarName = document.querySelector('.navbar-name');
    const navbarItems = document.querySelectorAll('.navbar-menu .navbar-item');
    const heroSection = document.querySelector('.hero-section, .slide-content, section:first-of-type');
    
    // Split text into individual letters for "HOME DECOR"
    if (brandPart1) {
        const text = brandPart1.textContent;
        brandPart1.innerHTML = text.split('').map(char => 
            char === ' ' ? '<span class="letter space-letter"></span>' : 
            `<span class="letter">${char}</span>`
        ).join('');
    }
    
    // Split text for "FURNITURE"
    if (brandPart2) {
        const text = brandPart2.textContent;
        brandPart2.innerHTML = text.split('').map(char => 
            char === ' ' ? '<span class="letter space-letter"></span>' : 
            `<span class="letter">${char}</span>`
        ).join('');
    }
    
    const lettersPart1 = document.querySelectorAll('.brand-part-1 .letter');
    const lettersPart2 = document.querySelectorAll('.brand-part-2 .letter');
    
    // Create GSAP Timeline
    const tl = gsap.timeline({
        defaults: {
            ease: "power4.out"
        }
    });
    
    // Counter object for animation
    const counter = { value: 0 };
    
    // PHASE 1: "HOME DECOR" LETTER REVEAL & COUNTER (0-1.5s)
    tl.to(lettersPart1, {
        y: 0,
        opacity: 1,
        clipPath: 'inset(0 0 0% 0)',
        duration: 1.2,
        stagger: {
            each: 0.05,
            ease: "power3.out"
        }
    }, 0)
    
    // Show counter and line
    .to([preloaderCounter, preloaderLine], {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out"
    }, 0.4)
    
    // Animate counter from 0 to 50
    .to(counter, {
        value: 50,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: function() {
            if (preloaderCounter) {
                preloaderCounter.textContent = Math.floor(counter.value).toString().padStart(3, '0');
            }
        }
    }, 0.2)
    
    // Grow line fill to 50%
    .to(preloaderLineFill, {
        width: '50%',
        duration: 1.5,
        ease: "power2.inOut"
    }, 0.2)
    
    // PHASE 2: "FURNITURE" REVEAL (1.5-2.8s)
    .to(brandPart2, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
    }, 1.5)
    
    .to(lettersPart2, {
        y: 0,
        opacity: 1,
        clipPath: 'inset(0 0 0% 0)',
        duration: 1,
        stagger: {
            each: 0.04,
            ease: "power3.out"
        }
    }, 1.6)
    
    // Continue counter 50 to 100
    .to(counter, {
        value: 100,
        duration: 1.3,
        ease: "power2.inOut",
        onUpdate: function() {
            if (preloaderCounter) {
                preloaderCounter.textContent = Math.floor(counter.value).toString().padStart(3, '0');
            }
        }
    }, 1.5)
    
    // Complete line fill to 100%
    .to(preloaderLineFill, {
        width: '100%',
        duration: 1.3,
        ease: "power2.inOut"
    }, 1.5)
    
    // Fade in subtitle
    .to(preloaderSubtitle, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
    }, 2.0)
    
    // PHASE 3: PAUSE AT 100% (2.8-3.2s)
    .to({}, { duration: 0.4 })
    
    // PHASE 4: MORPH TO NAVBAR POSITION (3.2-4.8s)
    .to([preloaderCounter, preloaderLine, preloaderSubtitle], {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in"
    }, 3.2)
    
    // Make navbar visible BEFORE morph so we can see target position (desktop only)
    .add(() => {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile && navbar) {
            gsap.to(navbar, {
                opacity: 0.3,
                duration: 0.1,
                ease: "none"
            });
        }
    }, 3.5)
    
    // Get navbar name position and morph brand to it
    .add(() => {
        if (navbarName && preloaderBrand) {
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // Mobile: Simple fade and scale animation instead of merge
                gsap.to(preloaderBrand, {
                    opacity: 0,
                    y: -30,
                    scale: 0.85,
                    duration: 1.0,
                    ease: "power2.inOut"
                });
                
                // Also fade out counter, line, and subtitle on mobile
                gsap.to([preloaderCounter, preloaderLine, preloaderSubtitle], {
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.in"
                });
                
                // Fade out doors and preloader quickly on mobile
                gsap.to([preloaderLeft, preloaderRight], {
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.inOut",
                    delay: 0.8
                });
                
                gsap.to(preloader, {
                    opacity: 0,
                    duration: 0.6,
                    delay: 1.2,
                    ease: "power2.inOut",
                    onComplete: () => {
                        document.body.classList.remove('loading');
                        if (preloader && preloader.parentNode) {
                            preloader.remove();
                        }
                        // Show navbar and content
                        if (navbar) gsap.to(navbar, { opacity: 1, duration: 0.5 });
                        if (heroSection) gsap.to(heroSection, { opacity: 1, scale: 1, duration: 0.8 });
                        if (navbarItems) gsap.to(navbarItems, { opacity: 1, x: 0, duration: 0.5, stagger: 0.05 });
                    }
                });
            } else {
                // Desktop: Morph to navbar position
                const navRect = navbarName.getBoundingClientRect();
                const preRect = preloaderBrand.getBoundingClientRect();
                
                // Calculate transform needed to move center to center
                const deltaX = navRect.left + (navRect.width / 2) - (preRect.left + (preRect.width / 2));
                const deltaY = navRect.top + (navRect.height / 2) - (preRect.top + (preRect.height / 2));
                const scaleRatio = navRect.width / preRect.width;
                
                // Increase z-index to keep brand visible during morph
                gsap.set(preloaderBrand, { zIndex: 100000 });
                
                // Morph entire brand to navbar name position
                gsap.to(preloaderBrand, {
                    x: deltaX,
                    y: deltaY,
                    scale: scaleRatio,
                    duration: 1.6,
                    ease: "power4.inOut"
                });
            }
        }
    }, 3.6)
    
    // PHASE 5: SPLIT DOOR EXIT (5.0-5.6s) - Start earlier, faster
    .to([preloaderLeft, preloaderRight], {
        x: (index) => index === 0 ? '-100%' : '100%',
        duration: 0.6,
        ease: "power3.inOut",
        stagger: 0.02
    }, 5.0)
    
    // PHASE 6: REVEAL NAVBAR & HERO (5.2-6.0s)
    // Fully reveal navbar (it's already at 0.3 opacity)
    .to(navbar, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out"
    }, 5.2)
    
    // Stagger navbar items from right
    .to(navbarItems, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: {
            each: 0.05,
            ease: "power3.out"
        }
    }, 5.3)
    
    // Hero section reveal with scale effect
    .to(heroSection, {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power3.out"
    }, 5.3)
    
    // PHASE 7: CLEANUP (5.6s) - Earlier, smoother
    .add(() => {
        document.body.classList.remove('loading');
    }, 5.6)
    
    .to(preloader, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
            if (preloader && preloader.parentNode) {
                preloader.remove();
            }
        }
    }, 5.6);
    
    // Fallback: Force remove after 8 seconds
    setTimeout(() => {
        if (preloader && preloader.parentNode) {
            document.body.classList.remove('loading');
            gsap.to(preloader, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => preloader.remove()
            });
        }
    }, 8000);
    
    console.log('✨ Premium GSAP preloader initialized');
});

// Fallback preloader without GSAP
function fallbackPreloader() {
    const preloader = document.querySelector('.preloader');
    
    setTimeout(() => {
        document.body.classList.remove('loading');
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (preloader.parentNode) {
                    preloader.remove();
                }
            }, 500);
        }
    }, 3000);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && document.body.classList.contains('loading')) {
        // If tab becomes visible during load, ensure animations continue
        console.log('Tab visible - preloader active');
    }
});

