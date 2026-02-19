// Loading Animations JavaScript

class LoadingManager {
    constructor() {
        this.loaderWrapper = document.getElementById('loader-wrapper');
        this.loaderMessage = document.querySelector('.loader-message');
        this.isLoading = true;
        this.startTime = Date.now();
        
        // Detect if mobile for faster loading
        this.isMobile = window.innerWidth <= 768;
        
        // Shorter minimum time on mobile for better responsiveness
        this.minLoadingTime = this.isMobile ? 800 : 1200; // 0.8s on mobile, 1.2s on desktop
        
        this.messages = [
            "Crafting your perfect space...",
            "Polishing the finest designs...",
            "Unpacking premium collections...",
            "Lighting up your inspiration...",
            "Building your dream interior..."
        ];
        
        this.init();
    }
    
    init() {
        if (this.loaderWrapper && this.loaderMessage) {
            this.startLoading();
        }
    }
    
    startLoading() {
        // Update loading messages
        this.updateLoadingMessages();
        
        // Hide loading screen when complete
        window.addEventListener('load', () => {
            // Remove extra delay; hide as soon as minLoadingTime satisfied
            this.hideLoadingScreen();
        });
        
        // Fallback: hide after 5 seconds on desktop, 4 seconds on mobile
        const fallbackTime = this.isMobile ? 4000 : 5000;
        setTimeout(() => {
            if (this.isLoading) {
                this.hideLoadingScreen();
            }
        }, fallbackTime);
    }
    
    updateLoadingMessages() {
        let messageIndex = 0;
        
        const messageInterval = setInterval(() => {
            if (this.loaderMessage && messageIndex < this.messages.length) {
                this.loaderMessage.style.opacity = '0';
                
                setTimeout(() => {
                    this.loaderMessage.textContent = this.messages[messageIndex];
                    this.loaderMessage.style.opacity = '1';
                    messageIndex++;
                }, 400);
            } else {
                clearInterval(messageInterval);
            }
        }, 2500);
    }
    
    hideLoadingScreen() {
        if (this.loaderWrapper && this.isLoading) {
            const elapsedTime = Date.now() - this.startTime;
            const remainingTime = Math.max(0, this.minLoadingTime - elapsedTime);
            
            // Ensure minimum loading time has passed
            setTimeout(() => {
                if (this.isLoading) {
                    this.isLoading = false;
                    
                    // Add the 'hidden' class to trigger the fade/scale-out animation
                    this.loaderWrapper.classList.add('hidden');
                    
                    setTimeout(() => {
                        this.loaderWrapper.style.display = 'none';
                        
                        // Trigger page entrance animations
                        this.triggerPageAnimations();
                    }, 800);
                }
            }, remainingTime);
        }
    }
    
    triggerPageAnimations() {
        // Animate navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.opacity = '0';
            navbar.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                navbar.style.transition = 'all 0.8s ease';
                navbar.style.opacity = '1';
                navbar.style.transform = 'translateY(0)';
            }, 100);
        }
        
        // Animate hero section
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.opacity = '0';
            heroSection.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                heroSection.style.transition = 'all 1s ease';
                heroSection.style.opacity = '1';
                heroSection.style.transform = 'translateY(0)';
            }, 300);
        }
        
        // Animate other sections
        const sections = document.querySelectorAll('section:not(.hero-section)');
        sections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                section.style.transition = 'all 0.8s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 500 + (index * 200));
        });
    }
}

// Page-specific loading animations
class PageLoader {
    constructor() {
        this.createPageLoader();
    }
    
    createPageLoader() {
        const pageLoader = document.createElement('div');
        pageLoader.className = 'page-loader';
        pageLoader.innerHTML = `
            <div class="loading-content">
                <div class="furniture-loader">
                    <div class="furniture-piece sofa">
                        <div class="sofa-base"></div>
                        <div class="sofa-cushion"></div>
                        <div class="sofa-arm left"></div>
                        <div class="sofa-arm right"></div>
                    </div>
                    <div class="furniture-piece chair">
                        <div class="chair-seat"></div>
                        <div class="chair-back"></div>
                        <div class="chair-legs">
                            <div class="leg"></div>
                            <div class="leg"></div>
                            <div class="leg"></div>
                            <div class="leg"></div>
                        </div>
                    </div>
                    <div class="furniture-piece table">
                        <div class="table-top"></div>
                        <div class="table-legs">
                            <div class="leg"></div>
                            <div class="leg"></div>
                            <div class="leg"></div>
                            <div class="leg"></div>
                        </div>
                    </div>
                </div>
                <div class="loading-text">
                    <h2 class="brand-name">Loading...</h2>
                    <p class="loading-message">Preparing your experience...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(pageLoader);
        this.pageLoader = pageLoader;
    }
    
    show() {
        this.pageLoader.classList.add('active');
    }
    
    hide() {
        this.pageLoader.classList.remove('active');
    }
}

// Gallery loading animation
class GalleryLoader {
    constructor(container) {
        this.container = container;
        this.createSkeletonLoader();
    }
    
    createSkeletonLoader() {
        // Hide original content temporarily
        this.originalDisplay = this.container.style.display;
        this.container.style.display = 'none';
        
        // Create skeleton overlay
        this.skeletonOverlay = document.createElement('div');
        this.skeletonOverlay.className = 'gallery-loader';
        this.skeletonOverlay.innerHTML = `
            <div class="gallery-item-skeleton"></div>
            <div class="gallery-item-skeleton"></div>
            <div class="gallery-item-skeleton"></div>
            <div class="gallery-item-skeleton"></div>
        `;
        
        // Insert skeleton before the container
        this.container.parentNode.insertBefore(this.skeletonOverlay, this.container);
    }
    
    hide() {
        // Show original content
        this.container.style.display = this.originalDisplay || 'grid';
        
        // Remove skeleton overlay
        if (this.skeletonOverlay && this.skeletonOverlay.parentNode) {
            this.skeletonOverlay.parentNode.removeChild(this.skeletonOverlay);
        }
    }
}

// Button loading animation
class ButtonLoader {
    constructor(button) {
        this.button = button;
        this.originalText = button.textContent;
        this.isLoading = false;
    }
    
    start() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.button.classList.add('btn-loading');
        this.button.disabled = true;
        this.button.textContent = 'Loading...';
    }
    
    stop() {
        this.isLoading = false;
        this.button.classList.remove('btn-loading');
        this.button.disabled = false;
        this.button.textContent = this.originalText;
    }
}

// Initialize loading animations
document.addEventListener('DOMContentLoaded', function() {
    // Initialize main loading screen (only on index page)
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        new LoadingManager();
    }
    
    // Initialize page loader for other pages
    const pageLoader = new PageLoader();
    
    // Show page loader on navigation
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.includes('#') && !link.href.includes('javascript:')) {
            if (link.href !== window.location.href) {
                pageLoader.show();
            }
        }
    });
    
    // Hide page loader when page is loaded
    window.addEventListener('load', function() {
        setTimeout(() => {
            pageLoader.hide();
        }, 500);
    });
    
    // Add loading animation to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
                const btnLoader = new ButtonLoader(submitBtn);
                btnLoader.start();
                
                // Stop loading after form submission (you can adjust this based on your form handling)
                setTimeout(() => {
                    btnLoader.stop();
                }, 2000);
            }
        });
    });
    
    // Add loading animation to gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const link = item.querySelector('a');
            if (link && link.href) {
                pageLoader.show();
            }
        });
    });
    
    // Add loading animation to product detail links
    const productLinks = document.querySelectorAll('a[href*="product-details"]');
    productLinks.forEach(link => {
        link.addEventListener('click', function() {
            pageLoader.show();
        });
    });
    
    // Add loading animation to checkout
    const checkoutLinks = document.querySelectorAll('a[href*="checkout"]');
    checkoutLinks.forEach(link => {
        link.addEventListener('click', function() {
            pageLoader.show();
        });
    });
});

// Export classes for use in other scripts
window.LoadingManager = LoadingManager;
window.PageLoader = PageLoader;
window.GalleryLoader = GalleryLoader;
window.ButtonLoader = ButtonLoader; 