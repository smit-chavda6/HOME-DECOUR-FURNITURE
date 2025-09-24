// Gallery Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    if (window.__galleryInit) {
        // Prevent double-binding which can invert wishlist add/remove
        return;
    }
    window.__galleryInit = true;
    const filterButtons = document.querySelectorAll('.filter-btn');
    let galleryItems = Array.from(document.querySelectorAll('.product-card'));
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
    // Advanced filters (optional)
    const advBrand = document.getElementById('advBrand');
    const advMaterial = document.getElementById('advMaterial');
    // Wishlist elements
    const wishlistSection = document.querySelector('.wishlist-section');
    const wishlistItemsEl = document.getElementById('wishlistItems');
    const wishlistEmptyEl = document.getElementById('wishlistEmptyState');
    const clearWishlistBtn = document.getElementById('clearWishlistBtn');
    const WISHLIST_KEY = 'hd_wishlist';
    let wishlist = {};
    
    // Current filter state
    let currentFilter = 'all';
    let currentSearch = '';
    let currentMinPrice = 0;
    let currentMaxPrice = 90000;
    let currentSort = '';
    let currentBrand = '';
    let currentMaterial = '';
    
    // If gallery is not present on this page, exit early to avoid errors
    const isGalleryPage = !!galleryContainer || galleryItems.length > 0;
    if (!isGalleryPage) {
        console.debug('gallery.js: No gallery found on this page; skipping init');
        return;
    }

    // --- Wishlist: State helpers ---
    function loadWishlist() {
        try {
            const raw = localStorage.getItem(WISHLIST_KEY);
            wishlist = raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn('Failed to parse wishlist from storage:', e);
            wishlist = {};
        }
    }

    function saveWishlist() {
        try {
            localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
        } catch (e) {
            console.warn('Failed to save wishlist:', e);
        }
    }

    function getProductDataFromCard(card) {
        const id = card.getAttribute('data-product-id');
        const title = card.querySelector('.product-title')?.textContent?.trim() || `Product ${id}`;
        const price = card.querySelector('.current-price')?.textContent?.trim() || '';
        const imgEl = card.querySelector('.product-image img');
        const image = imgEl ? imgEl.getAttribute('src') : 'image/Logo maker project.webp';
        const category = card.getAttribute('data-category') || '';
        return { id, title, price, image, category };
    }

    function parsePriceToNumber(priceText) {
        if (!priceText) return 0;
        const n = parseFloat(String(priceText).replace(/[^0-9.]/g, ''));
        return isNaN(n) ? 0 : n;
    }

    function renderWishlist() {
        if (!wishlistItemsEl || !wishlistEmptyEl) return;
        const items = Object.values(wishlist);
        if (items.length === 0) {
            wishlistItemsEl.innerHTML = '';
            wishlistEmptyEl.style.display = 'block';
        } else {
            wishlistEmptyEl.style.display = 'none';
            const html = items.map(item => `
                <div class="wishlist-item" data-product-id="${item.id}">
                    <div class="wishlist-thumb">
                        <img src="${item.image}" alt="${item.title}" loading="lazy"/>
                    </div>
                    <div class="wishlist-meta">
                        <a class="wishlist-title" href="product-details.html?id=${item.id}">${item.title}</a>
                        ${item.price ? `<div class="wishlist-price">${item.price}</div>` : ''}
                        <div class="wishlist-meta-actions">
                            <a class="wishlist-view" href="product-details.html?id=${item.id}">View</a>
                            <button class="wishlist-add-to-cart" data-action="add-to-cart" aria-label="Add to cart from wishlist">Add to Cart</button>
                            <button class="wishlist-remove" data-action="remove" aria-label="Remove from wishlist">Remove</button>
                        </div>
                    </div>
                </div>
            `).join('');
            wishlistItemsEl.innerHTML = html;
        }
        syncWishlistButtons();
    }

    function addToWishlistFromCard(card) {
        const data = getProductDataFromCard(card);
        wishlist[data.id] = data;
        saveWishlist();
        renderWishlist();
        // Immediately sync buttons to reflect state
        syncWishlistButtons();
    }

    function removeFromWishlist(id) {
        if (wishlist[id]) {
            delete wishlist[id];
            saveWishlist();
            renderWishlist();
            // Immediately sync buttons to reflect state
            syncWishlistButtons();
        }
    }

    function isWishlisted(id) { return !!wishlist[id]; }

    function syncWishlistButtons() {
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const id = btn.getAttribute('data-product-id') || btn.closest('.product-card')?.getAttribute('data-product-id');
            if (!id) return;
            if (isWishlisted(id)) {
                btn.classList.add('active');
                btn.textContent = '♥';
                btn.style.color = '#e74c3c';
            } else {
                btn.classList.remove('active');
                btn.textContent = '♡';
                btn.style.color = '#D2691E';
            }
        });
    }

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
    function observeItems(items){
        items.forEach(item => observer.observe(item));
    }
    observeItems(galleryItems);
    
    // Add hover effects to gallery items
    function bindHover(items){
        items.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-15px) scale(1.02)';
            });
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
    bindHover(galleryItems);
    
    // Add click effects to gallery items
    function bindRipple(items){
        items.forEach(item => {
            item.addEventListener('click', function(e) {
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
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }
    bindRipple(galleryItems);
    
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
        if (!clearSearchBtn) return;
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

    // Advanced filters
    if (advBrand) {
        advBrand.addEventListener('change', function() {
            currentBrand = this.value || '';
            applyFilters();
        });
    }
    if (advMaterial) {
        advMaterial.addEventListener('change', function() {
            currentMaterial = this.value || '';
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
            const brand = item.getAttribute('data-brand') || '';
            const material = item.getAttribute('data-material') || '';
            
            // Check category filter
            const categoryMatch = currentFilter === 'all' || category === currentFilter;
            
            // Check search filter
            const searchMatch = currentSearch === '' || 
                title.includes(currentSearch) || 
                priceText.toLowerCase().includes(currentSearch);
            
            // Check price filter
            const priceMatch = price >= currentMinPrice && price <= currentMaxPrice;
            
            const brandMatch = !currentBrand || brand === currentBrand;
            const materialMatch = !currentMaterial || material === currentMaterial;

            if (categoryMatch && searchMatch && priceMatch && brandMatch && materialMatch) {
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
    // Accepts: a single root Node, or an Array/NodeList of card elements to scope binding
    function bindCardButtons(context){
        let scopes = [];
        if (!context) {
            scopes = [document];
        } else if (Array.isArray(context)) {
            scopes = context;
        } else if (NodeList.prototype.isPrototypeOf(context)) {
            scopes = Array.from(context);
        } else {
            scopes = [context];
        }

        // Aggregate elements from all scopes
        const viewDetailsBtns = [];
        const addToCartBtns = [];
        const quickViewBtns = [];
        const wishlistBtns = [];
        const viewInRoomBtnsDyn = [];

        scopes.forEach(root => {
            if (!root || !root.querySelectorAll) return;
            viewDetailsBtns.push(...root.querySelectorAll('.view-details-btn'));
            addToCartBtns.push(...root.querySelectorAll('.add-to-cart-btn'));
            quickViewBtns.push(...root.querySelectorAll('.quick-view-btn'));
            wishlistBtns.push(...root.querySelectorAll('.wishlist-btn'));
            viewInRoomBtnsDyn.push(...root.querySelectorAll('.view-in-room-btn'));
        });
    
        // View Details button styling
        viewDetailsBtns.forEach(btn => {
            btn.style.textDecoration = 'none';
            btn.style.display = 'inline-block';
        });
    

    
    // Add to Cart: handled globally via delegated listener in cart-popup.js to avoid duplicates

        // Quick View button functionality
        quickViewBtns.forEach(btn => {
            if (btn.dataset.boundQuickView === '1') return;
            btn.dataset.boundQuickView = '1';
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const productId = this.getAttribute('data-product-id');
                const productCard = this.closest('.product-card');
                const productTitle = productCard.querySelector('.product-title').textContent;
                const productPrice = productCard.querySelector('.current-price').textContent;
                console.log(`Quick view: ${productTitle} (${productPrice}) - ID: ${productId}`);
                window.location.href = `product-details.html?id=${productId}`;
            });
        });
    
        // Wishlist button functionality with persistence
        wishlistBtns.forEach(btn => {
            if (btn.dataset.boundWishlist === '1') return;
            btn.dataset.boundWishlist = '1';
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const productCard = this.closest('.product-card');
                const productId = productCard?.getAttribute('data-product-id');
                const productTitle = productCard?.querySelector('.product-title')?.textContent || 'Item';
                if (!productId) return;
                if (isWishlisted(productId)) {
                    removeFromWishlist(productId);
                    window.cartPopupSystem?.showNotification(`${productTitle} removed from wishlist!`, 'info');
                } else {
                    addToWishlistFromCard(productCard);
                    window.cartPopupSystem?.showNotification(`${productTitle} added to wishlist!`, 'success');
                }
                // Ensure button UI updates even if no wishlist section on page
                syncWishlistButtons();
            });
        });

        // AR view-in-room for dynamically added items
        viewInRoomBtnsDyn.forEach(btn => {
            if (btn.dataset.boundViewInRoom === '1') return;
            btn.dataset.boundViewInRoom = '1';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productCard = btn.closest('.product-card');
                const productTitle = productCard.querySelector('.product-title').textContent;
                const modelSrc = (btn.getAttribute('data-model-src')||'').replace(/\s/g, '%20');
                const productId = btn.getAttribute('data-product-id');
                // Try to trigger AR directly from the on-card model-viewer if supported (Android Scene Viewer / WebXR)
                const mvOnCard = productCard.querySelector('model-viewer');
                if (mvOnCard && mvOnCard.canActivateAR) {
                    try { mvOnCard.activateAR(); return; } catch {}
                }
                // Fallback: open our AR/3D modal
                showGalleryARExperience(productTitle, modelSrc, productId);
            });
        });
    }

    bindCardButtons(document);

    // Delegated handlers as a safety net: ensures clicks work even if buttons are added later
    if (galleryContainer) {
        galleryContainer.addEventListener('click', (e) => {
            const quickBtn = e.target.closest('.quick-view-btn');
            if (quickBtn && galleryContainer.contains(quickBtn)) {
                e.preventDefault();
                const card = quickBtn.closest('.product-card');
                const id = quickBtn.getAttribute('data-product-id') || card?.getAttribute('data-product-id');
                if (id) {
                    window.location.href = `product-details.html?id=${id}`;
                }
                return;
            }

            const arBtn = e.target.closest('.view-in-room-btn');
            if (arBtn && galleryContainer.contains(arBtn)) {
                e.preventDefault();
                const card = arBtn.closest('.product-card');
                const title = card?.querySelector('.product-title')?.textContent || 'Item';
                const rawSrc = arBtn.getAttribute('data-model-src') || '';
                const modelSrc = rawSrc.replace(/\s/g, '%20');
                const id = arBtn.getAttribute('data-product-id') || card?.getAttribute('data-product-id');
                // Prefer direct AR from on-card viewer
                const mv = card?.querySelector('model-viewer');
                if (mv && mv.canActivateAR) {
                    try { mv.activateAR(); return; } catch {}
                }
                showGalleryARExperience(title, modelSrc, id);
            }
        });
    }

    // Initialize wishlist state immediately so buttons reflect saved items
    try {
        loadWishlist();
        renderWishlist(); // safe no-op if section doesn't exist
        syncWishlistButtons();
    } catch (e) { console.debug('Wishlist init skipped:', e); }

    // Fetch products from API and append to gallery (if any)
    async function fetchAndAppendProducts(){
        if (!galleryContainer) return;
        try {
            const res = await fetch('/api/products', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            const products = (data.products||[]);
            if (!products.length) return;
            const created = [];
            products.forEach(p => {
                const existing = galleryContainer.querySelector(`.product-card[data-product-id="${p.id}"]`);
                const priceHtml = `<span class="current-price">₹${Number(p.price||0).toLocaleString('en-IN')}</span>`;
                const originalHtml = p.original_price ? `<span class=\"original-price\">₹${Number(p.original_price).toLocaleString('en-IN')}</span>` : '';
                const discountHtml = p.discount ? `<span class=\"discount\">-${p.discount}%</span>` : '';
                const badgeHtml = p.badge ? `<div class=\"product-badge\">${p.badge}</div>` : '';
                const mediaHtml = p.is_3d && p.model_src ? `
                    <model-viewer src="${p.model_src}" alt="${p.name}" camera-controls auto-rotate background-color="#fff8f3" ar ar-modes="scene-viewer quick-look webxr"></model-viewer>
                ` : `
                    <img src="${p.image || 'image/Logo maker project.webp'}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='image/Logo maker project.webp';">
                `;
                if (existing) {
                    // Update existing static card with latest DB data
                    existing.setAttribute('data-category', p.category || '');
                    if (p.brand) existing.setAttribute('data-brand', p.brand); else existing.removeAttribute('data-brand');
                    if (p.material) existing.setAttribute('data-material', p.material); else existing.removeAttribute('data-material');
                    const imgWrap = existing.querySelector('.product-image');
                    if (imgWrap) {
                        const overlay = imgWrap.querySelector('.product-overlay');
                        imgWrap.innerHTML = `${mediaHtml}${overlay ? overlay.outerHTML : ''}${badgeHtml}`;
                    }
                    const titleEl = existing.querySelector('.product-title');
                    if (titleEl) titleEl.textContent = p.name;
                    const ratingWrap = existing.querySelector('.product-rating');
                    if (ratingWrap) ratingWrap.innerHTML = `<span class="stars">${'★'.repeat(Math.round(p.rating||4))}${'☆'.repeat(5-Math.round(p.rating||4))}</span><span class="rating-count">(${p.rating_count||0})</span>`;
                    const priceWrap = existing.querySelector('.product-price');
                    if (priceWrap) priceWrap.innerHTML = `${priceHtml}${originalHtml}${discountHtml}`;
                    // Re-bind buttons on this card
                    bindCardButtons(existing);
                } else {
                    // Create a new card if it doesn't exist in static markup
                    const card = document.createElement('div');
                    card.className = 'product-card' + (p.is_3d ? ' product-card-3d' : '');
                    card.setAttribute('data-category', p.category || '');
                    card.setAttribute('data-product-id', p.id);
                    if (p.brand) card.setAttribute('data-brand', p.brand);
                    if (p.material) card.setAttribute('data-material', p.material);
                    card.innerHTML = `
                        <div class="product-image">
                            ${mediaHtml}
                            <div class="product-overlay">
                                <button class="quick-view-btn" data-product-id="${p.id}">Quick View</button>
                                <button class="add-to-cart-btn" data-product-id="${p.id}">Add to Cart</button>
                                ${p.is_3d && p.model_src ? `<button class="view-in-room-btn" data-product-id="${p.id}" data-model-src="${p.model_src}">View in Room</button>` : ''}
                            </div>
                            ${badgeHtml}
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${p.name}</h3>
                            <div class="product-rating">
                                <span class="stars">${'★'.repeat(Math.round(p.rating||4))}${'☆'.repeat(5-Math.round(p.rating||4))}</span>
                                <span class="rating-count">(${p.rating_count||0})</span>
                            </div>
                            <div class="product-price">
                                ${priceHtml}
                                ${originalHtml}
                                ${discountHtml}
                            </div>
                            <div class="product-actions">
                                <a href="product-details.html?id=${p.id}" class="view-details-btn">View Details</a>
                                <button class="wishlist-btn" data-product-id="${p.id}">♡</button>
                            </div>
                        </div>`;
                    galleryContainer.appendChild(card);
                    created.push(card);
                }
            });
            if (created.length){
                // Update references and bindings
                galleryItems = Array.from(document.querySelectorAll('.product-card'));
                observeItems(created);
                bindHover(created);
                bindRipple(created);
                // Bind only the newly created cards to avoid double-binding existing buttons
                bindCardButtons(created);
                updatePriceRange();
                applyFilters();
                syncWishlistButtons();
            }
        } catch (e){ console.warn('Failed to fetch products', e); }
    }

    fetchAndAppendProducts();
    
    // Add event listeners for AR buttons
    const viewInRoomBtns = document.querySelectorAll('.view-in-room-btn');
    viewInRoomBtns.forEach(btn => {
        if (btn.dataset.boundViewInRoom === '1') return;
        btn.dataset.boundViewInRoom = '1';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productCard = btn.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            const modelSrc = (btn.getAttribute('data-model-src')||'').replace(/\s/g, '%20');
            const productId = btn.getAttribute('data-product-id');
            // Try direct AR from on-card viewer first
            const mvOnCard = productCard.querySelector('model-viewer');
            if (mvOnCard && mvOnCard.canActivateAR) {
                try { mvOnCard.activateAR(); return; } catch {}
            }
            // Otherwise open fallback modal
            showGalleryARExperience(productTitle, modelSrc, productId);
        });
    });
    
    // Function to show AR experience from gallery
    function showGalleryARExperience(productTitle, modelSrc, productId) {
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
                    <model-viewer src="${modelSrc}" alt="${productTitle}" camera-controls auto-rotate background-color="#121419" ar ar-modes="scene-viewer quick-look webxr" style="width:100%;height:400px;border-radius:1.2rem;box-shadow:0 2px 12px rgba(0,0,0,0.35);"></model-viewer>
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
                    <a class="gallery-ar-view-details-btn" href="product-details.html?id=${productId}">View Full Details</a>
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
        
    const closeModal = () => { try { document.body.classList.remove('no-scroll'); } catch {} modal.remove(); };
        
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
            // Close modal and let the anchor navigate
            closeModal();
        });
        
        document.body.appendChild(modal);
        try { document.body.classList.add('no-scroll'); } catch {}
    }

    // --- Initialize wishlist UI ---
    if (wishlistSection) {
        loadWishlist();
        renderWishlist();

        // Clear all
        if (clearWishlistBtn) {
            clearWishlistBtn.addEventListener('click', () => {
                wishlist = {};
                saveWishlist();
                renderWishlist();
                if (window.cartPopupSystem) {
                    window.cartPopupSystem.showNotification('Wishlist cleared', 'info');
                }
            });
        }

        // Remove single via delegation
        if (wishlistItemsEl) {
            wishlistItemsEl.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('[data-action="remove"]');
                const addBtn = e.target.closest('[data-action="add-to-cart"]');
                const itemEl = e.target.closest('.wishlist-item');
                const id = itemEl?.getAttribute('data-product-id');
                if (!itemEl || !id) return;

                if (removeBtn) {
                    removeFromWishlist(id);
                    if (window.cartPopupSystem) {
                        window.cartPopupSystem.showNotification('Removed from wishlist', 'info');
                    }
                    return;
                }

                if (addBtn) {
                    const data = wishlist[id];
                    if (!data) return;
                    const product = {
                        id: String(data.id),
                        name: data.title,
                        price: parsePriceToNumber(data.price),
                        image: data.image
                    };
                    if (window.cartPopupSystem && typeof window.cartPopupSystem.addToCartFromProductDetails === 'function') {
                        window.cartPopupSystem.addToCartFromProductDetails(product, 1);
                        window.cartPopupSystem.showNotification(`${product.name} added to cart!`, 'success');
                    } else {
                        // Fallback: create a hidden button-like context
                        const fakeBtn = document.createElement('button');
                        fakeBtn.setAttribute('data-product-id', String(product.id));
                        document.body.appendChild(fakeBtn);
                        try { window.cartPopupSystem?.addToCart(fakeBtn); } catch {}
                        try { document.body.removeChild(fakeBtn); } catch {}
                    }
                }
            });
        }
    }

}); 