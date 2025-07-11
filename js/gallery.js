// Gallery Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryContainer = document.querySelector('.gallery-container');
    
    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items
            filterItems(filter);
        });
    });
    
    function filterItems(filter) {
        galleryItems.forEach(item => {
            const category = item.getAttribute('data-category');
            
            if (filter === 'all' || category === filter) {
                item.style.display = 'block';
                // Add animation for showing items
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 100);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Intersection Observer for scroll animations
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
    
    // Observe gallery items for animation
    galleryItems.forEach(item => {
        observer.observe(item);
    });
    
    // Add hover effects to gallery items
    galleryItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click effects to gallery items
    galleryItems.forEach(item => {
        item.addEventListener('click', function(e) {
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
    
    // Search functionality (if needed)
    const searchInput = document.querySelector('.gallery-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            galleryItems.forEach(item => {
                const title = item.querySelector('h3').textContent.toLowerCase();
                const price = item.querySelector('.price').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || price.includes(searchTerm)) {
                    item.style.display = 'block';
                    item.style.opacity = '1';
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    }
    
    // Lazy loading enhancement
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    // Observe images for lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
        imageObserver.observe(img);
    });
    
    // Add loading states
    function showLoading() {
        galleryContainer.classList.add('loading');
    }
    
    function hideLoading() {
        galleryContainer.classList.remove('loading');
    }
    
    // Simulate loading for demo purposes
    if (galleryItems.length > 0) {
        showLoading();
        setTimeout(hideLoading, 1000);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Reset filters
            filterButtons.forEach(btn => btn.classList.remove('active'));
            filterButtons[0].classList.add('active'); // "All Items" button
            filterItems('all');
        }
    });
    
    // Add smooth scrolling to top when filtering
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Enhanced filter with scroll to top
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            scrollToTop();
        });
    });
    
    // Add counter for filtered items
    function updateItemCounter() {
        const visibleItems = document.querySelectorAll('.gallery-item[style*="block"], .gallery-item:not([style*="none"])');
        const counter = document.querySelector('.item-counter');
        
        if (counter) {
            counter.textContent = `${visibleItems.length} items`;
        }
    }
    
    // Update counter on filter
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            setTimeout(updateItemCounter, 400);
        });
    });
    
    // Initialize counter
    updateItemCounter();
    
    // Add masonry layout option (if needed)
    function toggleMasonry() {
        galleryContainer.classList.toggle('masonry');
    }
    
    // Add view toggle buttons (if needed)
    const viewToggle = document.querySelector('.view-toggle');
    if (viewToggle) {
        viewToggle.addEventListener('click', toggleMasonry);
    }
    
    // Add price range filter (if needed)
    const priceRange = document.querySelector('.price-range');
    if (priceRange) {
        priceRange.addEventListener('input', function() {
            const maxPrice = parseFloat(this.value);
            
            galleryItems.forEach(item => {
                const priceText = item.querySelector('.price').textContent;
                const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                
                if (price <= maxPrice) {
                    item.style.display = 'block';
                    item.style.opacity = '1';
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    }
    
    // Add sort functionality (if needed)
    function sortItems(criteria) {
        const itemsArray = Array.from(galleryItems);
        
        itemsArray.sort((a, b) => {
            if (criteria === 'price-low') {
                const priceA = parseFloat(a.querySelector('.price').textContent.replace(/[^0-9.]/g, ''));
                const priceB = parseFloat(b.querySelector('.price').textContent.replace(/[^0-9.]/g, ''));
                return priceA - priceB;
            } else if (criteria === 'price-high') {
                const priceA = parseFloat(a.querySelector('.price').textContent.replace(/[^0-9.]/g, ''));
                const priceB = parseFloat(b.querySelector('.price').textContent.replace(/[^0-9.]/g, ''));
                return priceB - priceA;
            } else if (criteria === 'name') {
                const nameA = a.querySelector('h3').textContent.toLowerCase();
                const nameB = b.querySelector('h3').textContent.toLowerCase();
                return nameA.localeCompare(nameB);
            }
        });
        
        // Reorder items in DOM
        itemsArray.forEach(item => {
            galleryContainer.appendChild(item);
        });
    }
    
    // Add sort buttons (if needed)
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            const criteria = this.getAttribute('data-sort');
            sortItems(criteria);
        });
    });
    
    // Initialize gallery
    console.log('Gallery initialized with', galleryItems.length, 'items');
}); 