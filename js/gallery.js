// Gallery Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.product-card');
    const galleryContainer = document.querySelector('.gallery-container');
    
    // New search and filter elements
    const searchInput = document.getElementById('gallerySearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortSelect = document.getElementById('sortSelect');
    const resultsCount = document.getElementById('resultsCount');
    
    // Current filter state
    let currentFilter = 'all';
    let currentSearch = '';
    let currentMinPrice = 0;
    let currentMaxPrice = 90000;
    let currentSort = '';
    
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
        currentFilter = filter;
        applyFilters();
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
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearch = this.value.toLowerCase();
            updateClearButton();
            applyFilters();
        });
    }
    
    // Clear search button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            currentSearch = '';
            updateClearButton();
            applyFilters();
        });
    }
    
    function updateClearButton() {
        if (currentSearch.length > 0) {
            clearSearchBtn.classList.add('visible');
        } else {
            clearSearchBtn.classList.remove('visible');
        }
    }
    
    // Simple image loading with fade-in effect
    const galleryImages = document.querySelectorAll('.product-card img');
    galleryImages.forEach(img => {
        // Add loading class initially
        img.classList.add('loading');
        
        // Add loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'image-loading-overlay';
        img.parentElement.appendChild(overlay);
        
        // Show loading overlay
        overlay.style.opacity = '1';
        
        // Handle image load
        img.addEventListener('load', function() {
            this.classList.remove('loading');
            this.classList.add('loaded');
            
            // Hide loading overlay
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentElement) {
                    overlay.remove();
                }
            }, 800);
        });
        
        // Handle image error
        img.addEventListener('error', function() {
            this.classList.remove('loading');
            this.classList.add('loaded');
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentElement) {
                    overlay.remove();
                }
            }, 800);
        });
        
        // If image is already loaded, show it immediately
        if (img.complete) {
            img.classList.remove('loading');
            img.classList.add('loaded');
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentElement) {
                    overlay.remove();
                }
            }, 800);
        }
    });
    

    
    // Check for category parameter and apply filter
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (category) {
        const btn = document.getElementById(`filter-${category}`);
        if (btn) {
            btn.click();
        }
    }
    
    // Update results counter
    updateResultsCounter(galleryItems.length);
    
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
    

    
    // Ensure gallery items are visible after a timeout
    setTimeout(() => {
        const visibleItems = document.querySelectorAll('.gallery-item[style*="display: none"]');
        if (visibleItems.length === galleryItems.length) {
            // If all items are hidden, show them all
            galleryItems.forEach(item => {
                item.style.display = 'block';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });
            updateResultsCounter(galleryItems.length);
        }
    }, 3000);
    

    

    


    
    // Price range filter
    if (priceRange) {
        priceRange.addEventListener('input', function() {
            currentMaxPrice = parseFloat(this.value);
            priceValue.textContent = `₹0 - ₹${currentMaxPrice.toLocaleString('en-IN')}`;
            maxPriceInput.value = currentMaxPrice;
            applyFilters();
        });
    }
    
    // Min price input
    if (minPriceInput) {
        minPriceInput.addEventListener('input', function() {
            currentMinPrice = parseFloat(this.value) || 0;
            applyFilters();
        });
    }
    
    // Max price input
    if (maxPriceInput) {
        maxPriceInput.addEventListener('input', function() {
            currentMaxPrice = parseFloat(this.value) || 90000;
            priceRange.value = currentMaxPrice;
            priceValue.textContent = `₹0 - ₹${currentMaxPrice.toLocaleString('en-IN')}`;
            applyFilters();
        });
    }
    
    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            applyFilters();
        });
    }
    
    function sortItems(items, criteria) {
        return items.sort((a, b) => {
            if (criteria === 'price-low') {
                const priceA = parseFloat(a.querySelector('.current-price').textContent.replace(/[^0-9.]/g, ''));
                const priceB = parseFloat(b.querySelector('.current-price').textContent.replace(/[^0-9.]/g, ''));
                return priceA - priceB;
            } else if (criteria === 'price-high') {
                const priceA = parseFloat(a.querySelector('.current-price').textContent.replace(/[^0-9.]/g, ''));
                const priceB = parseFloat(b.querySelector('.current-price').textContent.replace(/[^0-9.]/g, ''));
                return priceB - priceA;
            } else if (criteria === 'name-asc') {
                const nameA = a.querySelector('.product-title').textContent.toLowerCase();
                const nameB = b.querySelector('.product-title').textContent.toLowerCase();
                return nameA.localeCompare(nameB);
            } else if (criteria === 'name-desc') {
                const nameA = a.querySelector('.product-title').textContent.toLowerCase();
                const nameB = b.querySelector('.product-title').textContent.toLowerCase();
                return nameB.localeCompare(nameA);
            }
            return 0;
        });
    }
    
    // Main filter function
    function applyFilters() {
        let visibleItems = [];
        let filteredOutItems = [];
        
        galleryItems.forEach(item => {
            const category = item.getAttribute('data-category');
            const title = item.querySelector('.product-title').textContent.toLowerCase();
            const priceText = item.querySelector('.current-price').textContent;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            
            // Check category filter
            const categoryMatch = currentFilter === 'all' || category === currentFilter;
            
            // Check search filter
            const searchMatch = currentSearch === '' || 
                title.includes(currentSearch) || 
                priceText.toLowerCase().includes(currentSearch);
            
            // Check price filter
            const priceMatch = price >= currentMinPrice && price <= currentMaxPrice;
            
            if (categoryMatch && searchMatch && priceMatch) {
                item.style.display = 'block';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
                visibleItems.push(item);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
                
                // Track filtered out items for debugging
                if (!priceMatch) {
                    filteredOutItems.push({
                        title: item.querySelector('.product-title').textContent,
                        price: price,
                        reason: `Price ₹${price} outside range ₹${currentMinPrice}-₹${currentMaxPrice}`
                    });
                }
            }
        });
        
        // Debug log for filtered out items
        if (filteredOutItems.length > 0) {
            console.log('Filtered out items:', filteredOutItems);
        }
        
        // Apply sorting if specified
        if (currentSort) {
            visibleItems = sortItems(visibleItems, currentSort);
            
            // Reorder items in DOM
            visibleItems.forEach(item => {
                galleryContainer.appendChild(item);
            });
        }
        
        // Update results counter
        updateResultsCounter(visibleItems.length);
    }
    
    function updateResultsCounter(count) {
        if (resultsCount) {
            resultsCount.textContent = count;
        }
    }
    
    // Initialize gallery
    console.log('Gallery initialized with', galleryItems.length, 'items');
    
    // Auto-detect highest price and update range
    function updatePriceRange() {
        let highestPrice = 0;
        galleryItems.forEach(item => {
            const priceText = item.querySelector('.current-price').textContent;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            if (price > highestPrice) {
                highestPrice = price;
            }
        });
        
        // Add some buffer to the highest price
        const maxRange = Math.ceil(highestPrice / 1000) * 1000 + 1000;
        
        // Update the range slider if needed
        if (priceRange && maxRange > parseInt(priceRange.max)) {
            priceRange.max = maxRange;
            priceRange.value = maxRange;
            currentMaxPrice = maxRange;
            
            // Update input fields
            if (minPriceInput) minPriceInput.max = maxRange;
            if (maxPriceInput) maxPriceInput.max = maxRange;
            
            // Update display
            if (priceValue) {
                priceValue.textContent = `₹0 - ₹${maxRange.toLocaleString('en-IN')}`;
            }
            
            console.log(`Updated price range to ₹${maxRange.toLocaleString('en-IN')} (highest product: ₹${highestPrice.toLocaleString('en-IN')})`);
        }
    }
    
    // Initialize price range
    updatePriceRange();
    
    // Initialize price display
    if (priceValue) {
        priceValue.textContent = `₹0 - ₹${currentMaxPrice.toLocaleString('en-IN')}`;
    }
    
    // Initialize results counter
    updateResultsCounter(galleryItems.length);
    
    // Initialize clear button state
    updateClearButton();
    
    // Add event listeners for product card buttons
    const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    const quickViewBtns = document.querySelectorAll('.quick-view-btn');
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    
    // View Details button functionality - now using href links
    viewDetailsBtns.forEach(btn => {
        // The links are now <a> tags with href, so we don't need to prevent default
        // Just add some styling to make them look like buttons
        btn.style.textDecoration = 'none';
        btn.style.display = 'inline-block';
    });
    

    
    // Quick View button functionality
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            const productCard = this.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            const productPrice = productCard.querySelector('.current-price').textContent;
            
            // Quick view logic here
            console.log(`Quick view: ${productTitle} (${productPrice}) - ID: ${productId}`);
            
            // Navigate to product details page with correct ID
            window.location.href = `product-details.html?id=${productId}`;
        });
    });
    
    // Wishlist button functionality
    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            const productCard = this.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            
            // Toggle wishlist state
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
                this.textContent = '♥';
                this.style.color = '#e74c3c';
                if (window.cartPopupSystem) {
                    window.cartPopupSystem.showNotification(`${productTitle} added to wishlist!`, 'success');
                }
            } else {
                this.textContent = '♡';
                this.style.color = '#D2691E';
                if (window.cartPopupSystem) {
                    window.cartPopupSystem.showNotification(`${productTitle} removed from wishlist!`, 'info');
                }
            }
        });
    });
    
    // Add event listeners for AR buttons
    const viewInRoomBtns = document.querySelectorAll('.view-in-room-btn');
    viewInRoomBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productCard = btn.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            const modelSrc = btn.getAttribute('data-model-src');
            
            // Show AR experience
            showGalleryARExperience(productTitle, modelSrc);
        });
    });
    
    // Function to show AR experience from gallery
    function showGalleryARExperience(productTitle, modelSrc) {
        const modal = document.createElement('div');
        modal.className = 'gallery-ar-modal';
        modal.innerHTML = `
            <div class="gallery-ar-overlay"></div>
            <div class="gallery-ar-content">
                <div class="gallery-ar-header">
                    <h3>View ${productTitle} in Your Room</h3>
                    <button class="gallery-ar-close">&times;</button>
                </div>
                <div class="gallery-ar-body">
                    <model-viewer src="${modelSrc}" alt="${productTitle}" camera-controls auto-rotate background-color="#fff8f3" ar ar-modes="scene-viewer quick-look webxr" style="width:100%;height:400px;border-radius:1.2rem;box-shadow:0 2px 12px #ffe5c1aa;"></model-viewer>
                    <div class="gallery-ar-instructions">
                        <h4>How to use AR:</h4>
                        <ol>
                            <li>Point your camera at a flat surface</li>
                            <li>Tap to place the furniture</li>
                            <li>Move around to see different angles</li>
                            <li>Resize and rotate as needed</li>
                        </ol>
                    </div>
                </div>
                <div class="gallery-ar-footer">
                    <button class="gallery-ar-start-btn">Start AR Experience</button>
                    <button class="gallery-ar-view-details-btn">View Full Details</button>
                </div>
            </div>
        `;
        
        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .gallery-ar-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .gallery-ar-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }
            
            .gallery-ar-content {
                position: relative;
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: galleryArModalSlideIn 0.3s ease-out;
            }
            
            @keyframes galleryArModalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-30px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .gallery-ar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
            }
            
            .gallery-ar-header h3 {
                margin: 0;
                color: #2c3e50;
                font-size: 1.4rem;
                font-weight: 700;
            }
            
            .gallery-ar-close {
                background: none;
                border: none;
                font-size: 2rem;
                color: #999;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .gallery-ar-close:hover {
                background: #f0f0f0;
                color: #333;
            }
            
            .gallery-ar-body {
                margin-bottom: 20px;
            }
            
            .gallery-ar-instructions {
                margin-top: 20px;
                padding: 15px;
                background: linear-gradient(135deg, #fff8f3 0%, #ffe5c1 100%);
                border-radius: 12px;
                border-left: 4px solid #8B4513;
            }
            
            .gallery-ar-instructions h4 {
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 1.1rem;
            }
            
            .gallery-ar-instructions ol {
                margin: 0;
                padding-left: 20px;
                color: #2c3e50;
                line-height: 1.6;
            }
            
            .gallery-ar-instructions li {
                margin-bottom: 5px;
            }
            
            .gallery-ar-footer {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .gallery-ar-start-btn,
            .gallery-ar-view-details-btn {
                padding: 12px 24px;
                border-radius: 10px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
            }
            
            .gallery-ar-start-btn {
                background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
            }
            
            .gallery-ar-start-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(139, 69, 19, 0.4);
            }
            
            .gallery-ar-view-details-btn {
                background: linear-gradient(135deg, #ffe5c1 0%, #f5e6d3 100%);
                color: #8B4513;
                border: 2px solid #8B4513;
            }
            
            .gallery-ar-view-details-btn:hover {
                background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
                color: white;
                transform: translateY(-2px);
            }
            
            @media (max-width: 768px) {
                .gallery-ar-content {
                    padding: 20px;
                    margin: 20px;
                }
                
                .gallery-ar-header h3 {
                    font-size: 1.2rem;
                }
                
                .gallery-ar-footer {
                    flex-direction: column;
                }
                
                .gallery-ar-start-btn,
                .gallery-ar-view-details-btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(styles);
        
        // Event listeners
        const closeBtn = modal.querySelector('.gallery-ar-close');
        const overlay = modal.querySelector('.gallery-ar-overlay');
        const startBtn = modal.querySelector('.gallery-ar-start-btn');
        const viewDetailsBtn = modal.querySelector('.gallery-ar-view-details-btn');
        const modelViewer = modal.querySelector('model-viewer');
        
        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        startBtn.addEventListener('click', () => {
            if (modelViewer && modelViewer.canActivateAR) {
                modelViewer.activateAR();
            } else {
                if (window.cartPopupSystem) {
                    window.cartPopupSystem.showNotification('AR not supported on this device', 'warning');
                }
            }
        });
        
        viewDetailsBtn.addEventListener('click', () => {
            closeModal();
            // Navigate to product details page
            const productId = btn.getAttribute('data-product-id');
            window.location.href = `product-details.html?id=${productId}`;
        });
        
        document.body.appendChild(modal);
    }

}); 