// Gallery Page JavaScript
document.addEventListener('DOMContentLoaded', function () {
    if (window.__galleryInit) {
        // Prevent double-binding which can invert wishlist add/remove
        return;
    }
    window.__galleryInit = true;

    // Helper function to render stars with half-star support
    function renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = (rating - fullStars >= 0.5);
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

        let html = '';
        for (let i = 0; i < fullStars; i++) {
            html += '★';
        }
        if (hasHalf) {
            html += '⯨'; // Half star character
        }
        for (let i = 0; i < emptyStars; i++) {
            html += '☆';
        }
        return html;
    }

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
    // Wishlist elements
    const wishlistSection = document.querySelector('.wishlist-section');
    const wishlistItemsEl = document.getElementById('wishlistItems');
    const wishlistEmptyEl = document.getElementById('wishlistEmptyState');
    const clearWishlistBtn = document.getElementById('clearWishlistBtn');
    const closeWishlistBtn = document.getElementById('closeWishlistBtn');
    const wishlistBackdrop = document.getElementById('wishlistBackdrop');
    const wishlistNavItem = document.querySelector('.wishlist-nav-item');
    const wishlistNavButton = document.getElementById('wishlistNavButton');
    const wishlistNavCount = document.getElementById('wishlistNavCount');
    const wishlistFloatingBtn = document.getElementById('wishlistFloatingBtn');
    const wishlistFloatingCount = document.getElementById('wishlistFloatingCount');
    const WISHLIST_KEY = 'hd_wishlist';
    let wishlist = {};
    let wishlistCloseTimer = null;
    let wishlistLastFocusedEl = null;
    const WISHLIST_ANIM_MS = 220;
    // Current filter state
    let currentFilter = 'all';
    let currentSearch = '';
    let currentMinPrice = 0;
    let currentMaxPrice = 90000;
    let currentSort = '';
    // Advanced filters removed

    // If gallery is not present on this page, exit early to avoid errors
    const isGalleryPage = !!galleryContainer || galleryItems.length > 0;
    if (!isGalleryPage) {
        console.debug('gallery.js: No gallery found on this page; skipping init');
        return;
    }

    function normalizeModelSrc(src) {
        if (!src) return '';
        try {
            return encodeURI(String(src).trim());
        } catch {
            return String(src).trim().replace(/\s/g, '%20');
        }
    }

    function toAbsoluteUrl(url) {
        if (!url) return '';
        try {
            return new URL(url, window.location.origin).href;
        } catch {
            return '';
        }
    }

    // Normalize media paths for cross-device/browser compatibility.
    function normalizeMediaUrl(url) {
        if (!url) return '';
        let u = String(url).trim();
        if (!u) return '';

        u = u.replace(/\\/g, '/');
        u = u.replace(/^\.\//, '');
        u = u.replace(/^\/public\//i, '/');

        // If stale localhost URL was saved in DB, keep only its path for deployed environments.
        const localMatch = u.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)$/i);
        if (localMatch && localMatch[1]) u = localMatch[1];

        if (/^(uploads|image)\//i.test(u)) u = '/' + u;

        try {
            return encodeURI(u);
        } catch {
            return u;
        }
    }

    function deriveUsdzUrl(modelUrl) {
        if (!modelUrl) return '';
        if (/\.usdz(\?|#|$)/i.test(modelUrl)) return modelUrl;
        if (/\.(glb|gltf)(\?|#|$)/i.test(modelUrl)) {
            return modelUrl.replace(/\.(glb|gltf)(\?|#|$)/i, '.usdz$2');
        }
        return '';
    }

    function getDeviceInfo() {
        const ua = navigator.userAgent || '';
        const isAndroid = /Android/i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        return {
            isAndroid,
            isIOS,
            isMobile: isAndroid || isIOS || /Mobile|Phone/i.test(ua)
        };
    }

    function openExternalUrl(url) {
        if (!url) return false;
        try {
            const a = document.createElement('a');
            a.href = url;
            a.rel = 'noopener';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
            return true;
        } catch {
            return false;
        }
    }

    function launchNativeAR({ productTitle, modelSrc, usdzSrc, modelViewer, productId }) {
        const title = productTitle || 'Furniture Item';
        const normalizedModel = normalizeModelSrc(modelSrc);
        const normalizedUsdz = normalizeModelSrc(usdzSrc || deriveUsdzUrl(normalizedModel));
        const absoluteModel = toAbsoluteUrl(normalizedModel);
        const absoluteUsdz = toAbsoluteUrl(normalizedUsdz);
        const detailsUrl = `${window.location.origin}/product-details.html?id=${encodeURIComponent(productId || '')}`;
        const { isAndroid, isIOS } = getDeviceInfo();

        // 1) Preferred route: model-viewer native AR handoff
        if (modelViewer && modelViewer.canActivateAR) {
            try {
                modelViewer.activateAR();
                return true;
            } catch {
                // Continue with device-specific fallbacks
            }
        }

        // 2) Android fallback: Scene Viewer intent (works on modern Android Chrome/WebView)
        if (isAndroid && absoluteModel) {
            const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(absoluteModel)}&mode=ar_preferred&title=${encodeURIComponent(title)}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(detailsUrl)};end;`;
            if (openExternalUrl(intentUrl)) return true;
        }

        // 3) iOS fallback: Quick Look via USDZ
        if (isIOS && absoluteUsdz) {
            try {
                const arLink = document.createElement('a');
                arLink.setAttribute('rel', 'ar');
                arLink.setAttribute('href', absoluteUsdz);
                arLink.style.display = 'none';
                const img = document.createElement('img');
                img.alt = title;
                arLink.appendChild(img);
                document.body.appendChild(arLink);
                arLink.click();
                arLink.remove();
                return true;
            } catch {
                // Continue to modal fallback
            }
        }

        return false;
    }

    function renderSkeletonCards(count) {
        if (!galleryContainer) return;
        if (galleryContainer.querySelector('.skeleton-card')) return;
        const fragment = document.createDocumentFragment();
        const safeCount = Math.max(4, Math.min(count || 8, 12));
        for (let i = 0; i < safeCount; i++) {
            const card = document.createElement('div');
            card.className = 'product-card skeleton-card';
            card.setAttribute('data-skeleton', '1');
            card.innerHTML = `
                <div class="product-image skeleton-media skeleton-block"></div>
                <div class="product-info">
                    <div class="skeleton-line skeleton-title skeleton-block" style="width: 70%; height: 20px; margin-bottom: 10px;"></div>
                    <div class="skeleton-line skeleton-rating skeleton-block" style="width: 40%; height: 16px; margin-bottom: 15px;"></div>
                    <div class="skeleton-line skeleton-price skeleton-block" style="width: 30%; height: 18px; margin-bottom: 20px;"></div>
                    <div class="skeleton-btn skeleton-block" style="width: 100%; height: 40px; border-radius: 8px;"></div>
                </div>
            `;
            fragment.appendChild(card);
        }
        galleryContainer.appendChild(fragment);
    }

    function clearSkeletonCards() {
        if (!galleryContainer) return;
        galleryContainer.querySelectorAll('.skeleton-card').forEach((el) => el.remove());
    }

    // Enable 3D interaction on click, keep scroll working on hover
    if (galleryContainer) {
        const deactivateModel = (card) => {
            if (!card) return;
            card.classList.remove('model-active');
        };

        galleryContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card-3d');
            if (!card) return;

            const isBadge = !!e.target.closest('.product-3d-badge');
            const isModel = !!e.target.closest('model-viewer');
            if (isBadge || isModel) {
                card.classList.add('model-active');
            }
        });

        galleryContainer.addEventListener('mouseleave', (e) => {
            const card = e.target.closest('.product-card-3d');
            deactivateModel(card);
        }, true);

        galleryContainer.addEventListener('touchend', (e) => {
            const card = e.target.closest('.product-card-3d');
            if (!card) return;
            setTimeout(() => deactivateModel(card), 800);
        }, { passive: true });
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

    function isWishlisted(productId) {
        return !!(productId && wishlist[String(productId)]);
    }

    function addToWishlistFromCard(card) {
        if (!card) return;
        const product = getProductDataFromCard(card);
        if (!product?.id) return;
        wishlist[String(product.id)] = product;
        saveWishlist();
        renderWishlist();
        syncWishlistButtons();
    }

    function removeFromWishlist(productId) {
        if (!productId) return;
        delete wishlist[String(productId)];
        saveWishlist();
        renderWishlist();
        syncWishlistButtons();
    }

    function syncWishlistButtons() {
        document.querySelectorAll('.action-wishlist-btn').forEach(btn => {
            const pid = btn.getAttribute('data-product-id') || btn.closest('.product-card')?.getAttribute('data-product-id');
            const active = isWishlisted(pid);
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            btn.setAttribute('title', active ? 'Remove from Wishlist' : 'Add to Wishlist');
        });
    }

    function openWishlistPopup() {
        if (!wishlistSection || Object.keys(wishlist).length === 0) return;
        if (wishlistCloseTimer) {
            clearTimeout(wishlistCloseTimer);
            wishlistCloseTimer = null;
        }
        const activeEl = document.activeElement;
        if (activeEl && !wishlistSection.contains(activeEl)) {
            wishlistLastFocusedEl = activeEl;
        }
        if (wishlistBackdrop) wishlistBackdrop.hidden = false;
        wishlistSection.inert = false;
        wishlistSection.style.display = 'block';
        wishlistSection.classList.remove('is-closing');
        wishlistBackdrop?.classList.remove('is-closing');
        wishlistSection.setAttribute('aria-hidden', 'false');
        document.body.classList.add('wishlist-popup-open');
        document.body.classList.remove('wishlist-popup-closing');
        if (wishlistNavButton) wishlistNavButton.setAttribute('aria-expanded', 'true');
        if (wishlistFloatingBtn) wishlistFloatingBtn.setAttribute('aria-expanded', 'true');

        // Move focus into dialog for accessibility.
        const firstFocusable = wishlistSection.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable && typeof firstFocusable.focus === 'function') {
            requestAnimationFrame(() => firstFocusable.focus());
        }
    }

    function closeWishlistPopup() {
        if (!wishlistSection) return;
        const fallbackFocusEl = (wishlistLastFocusedEl && document.contains(wishlistLastFocusedEl))
            ? wishlistLastFocusedEl
            : wishlistNavButton;

        // Move focus outside the dialog before hiding it from assistive tech.
        if (wishlistSection.contains(document.activeElement) && fallbackFocusEl && typeof fallbackFocusEl.focus === 'function') {
            fallbackFocusEl.focus();
        }

        wishlistSection.inert = true;
        wishlistSection.setAttribute('aria-hidden', 'true');
        wishlistSection.classList.add('is-closing');
        wishlistBackdrop?.classList.add('is-closing');
        document.body.classList.add('wishlist-popup-closing');
        document.body.classList.remove('wishlist-popup-open');
        if (wishlistNavButton) wishlistNavButton.setAttribute('aria-expanded', 'false');
        if (wishlistFloatingBtn) wishlistFloatingBtn.setAttribute('aria-expanded', 'false');

        if (wishlistCloseTimer) clearTimeout(wishlistCloseTimer);
        wishlistCloseTimer = setTimeout(() => {
            if (wishlistBackdrop) {
                wishlistBackdrop.hidden = true;
                wishlistBackdrop.classList.remove('is-closing');
            }
            wishlistSection.style.display = 'none';
            wishlistSection.classList.remove('is-closing');
            document.body.classList.remove('wishlist-popup-closing');
            wishlistCloseTimer = null;
        }, WISHLIST_ANIM_MS);
    }

    function getProductDataFromCard(card) {
        const id = card.getAttribute('data-product-id');
        const title = card.querySelector('.product-title')?.textContent?.trim() || `Product ${id}`;
        const price = card.querySelector('.current-price')?.textContent?.trim() || '';
        const ratingText = card.querySelector('.rating-count')?.textContent?.trim() || '';
        const imgEl = card.querySelector('.product-image img');
        const modelEl = card.querySelector('model-viewer');
        const is3d = card.getAttribute('data-is-3d') === '1';
        const modelSrc = card.getAttribute('data-model-src') || '';
        const imageAttr = card.getAttribute('data-image');
        const category = card.getAttribute('data-category') || '';
        const material = card.getAttribute('data-material') || '';
        const brand = card.getAttribute('data-brand') || '';

        // Priority for image: 
        // 1. data-image attribute (explicitly set)
        // 2. src of <img> element
        // 3. poster of <model-viewer>
        // 4. Fallback to model-to-image mapping if 3D

        let image = '';

        // Extended logic to capture the best possible image for 3D products
        if (is3d && window.cartPopupSystem && typeof window.cartPopupSystem.get3DModelImage === 'function') {
            const mappedImage = window.cartPopupSystem.get3DModelImage(card);
            // If the mapper returns something specific (not just a generic fallback that might be invalid)
            if (mappedImage && !mappedImage.includes('data:image/svg')) {
                image = mappedImage;
            }
        }

        // If no 3D mapping found or not 3D, try standard sources
        if (!image) {
            if (imageAttr) {
                image = imageAttr;
            } else if (imgEl) {
                image = imgEl.getAttribute('src');
            } else if (modelEl && modelEl.getAttribute('poster')) {
                image = modelEl.getAttribute('poster');
            }
        }

        // Final fallback only if truly nothing found
        if (!image || image.trim() === '') {
            image = 'image/Logo maker project.webp';
        }

        // Clean up common placeholder if it accidentally got set but we have a better 3D source waiting
        if (is3d && image.includes('Logo maker project.webp') && window.cartPopupSystem) {
            const retryMap = window.cartPopupSystem.get3DModelImage(card);
            if (retryMap && !retryMap.includes('data:image/svg')) {
                image = retryMap;
            }
        }

        // Avoid "3D Model" badge logic by ensuring we always have an image path if possible
        if (image && image.startsWith('data:image/svg')) {
            // Let the specific resolve logic handle SVG/badge if it's truly a fallback
        }

        const description = material || (category ? `${category} piece with clean modern styling.` : 'Premium furniture crafted for modern interiors.');
        return {
            id,
            title,
            price,
            image,
            category,
            brand,
            material,
            description,
            rating_text: ratingText,
            is_3d: is3d,
            model_src: modelSrc
        };
    }

    function parsePriceToNumber(priceText) {
        if (!priceText) return 0;
        const n = parseFloat(String(priceText).replace(/[^0-9.]/g, ''));
        return isNaN(n) ? 0 : n;
    }

    function getPriceFromCard(card) {
        if (!card) return 0;
        const priceEl = card.querySelector('.current-price');
        if (priceEl && priceEl.textContent) {
            return parsePriceToNumber(priceEl.textContent);
        }
        const dataPrice = card.getAttribute('data-price') || card.getAttribute('data-current-price') || '';
        return parsePriceToNumber(dataPrice);
    }

    function getPriceTextFromCard(card) {
        if (!card) return '';
        const priceEl = card.querySelector('.current-price');
        if (priceEl && priceEl.textContent) return priceEl.textContent.trim();
        const dataPrice = card.getAttribute('data-price') || card.getAttribute('data-current-price') || '';
        if (!dataPrice) return '';
        const numeric = parsePriceToNumber(dataPrice);
        return numeric ? `₹${numeric.toLocaleString('en-IN')}` : '';
    }

    function renderWishlist() {
        if (!wishlistItemsEl || !wishlistEmptyEl) return;

        const esc = (v) => String(v || '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));

        const wishlistSection = document.querySelector('.wishlist-section');
        const items = Object.values(wishlist);
        const isPopupOpen = document.body.classList.contains('wishlist-popup-open');

        if (items.length === 0) {
            if (wishlistSection) wishlistSection.style.display = 'none';
            wishlistEmptyEl.style.display = 'none';
            wishlistItemsEl.innerHTML = `
                <div class="wishlist-empty-card">
                    <div class="wishlist-empty-icon" aria-hidden="true">♡</div>
                    <h3>Your wishlist is empty</h3>
                    <p>Save products you love and compare them later in one clean place.</p>
                </div>
            `;
        } else {
            if (wishlistSection) wishlistSection.style.display = isPopupOpen ? 'block' : 'none';
            wishlistEmptyEl.style.display = 'none';

            const html = items.map(item => {
                // Determine thumbnail: prioritize image if available (even for 3D items)
                let thumbHtml = '';
                // Check if we have a valid image URL (not empty, not just whitespace)
                // getProductDataFromCard now tries to find a poster or mapping for 3D items
                const hasValidImage = item.image && item.image.trim().length > 0 && !item.image.includes('data:image/svg');

                if (hasValidImage) {
                    thumbHtml = `<div class="wishlist-thumb"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" onerror="this.onerror=null;this.src='image/Logo maker project.webp';"/></div>`;
                } else {
                    // Fallback for 3D items without any resolved image
                    thumbHtml = `<div class="wishlist-thumb wishlist-thumb-3d" aria-label="3D model">3D</div>`;
                }

                const rating = item.rating_text ? `<div class="wishlist-rating">★ ${esc(item.rating_text)}</div>` : '';
                const desc = esc(item.description || item.category || 'Premium furniture crafted for modern interiors.');
                const price = esc(item.price || '');
                const id = esc(item.id);
                const title = esc(item.title);

                return `
                <div class="wishlist-item" data-product-id="${item.id}">
                    ${thumbHtml}
                    <div class="wishlist-meta">
                        <a class="wishlist-title" href="product-details.html?id=${id}">${title}</a>
                        ${rating}
                        <p class="wishlist-desc">${desc}</p>
                        ${price ? `<div class="wishlist-price">${price}</div>` : ''}
                        <div class="wishlist-meta-actions wishlist-actions-row">
                            <button class="wishlist-move-btn" data-product-id="${id}" aria-label="Move to cart" title="Move to Cart">Move to Cart</button>
                            <a class="wishlist-icon-btn wishlist-view" href="product-details.html?id=${id}" title="View Details" aria-label="View Details">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </a>
                            <button class="wishlist-icon-btn wishlist-remove" data-product-id="${id}" aria-label="Remove" title="Remove">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `}).join('');

            wishlistItemsEl.innerHTML = html;

            // Bind events for the new wishlist items
            wishlistItemsEl.querySelectorAll('.wishlist-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    removeFromWishlist(btn.getAttribute('data-product-id'));
                });
            });

            wishlistItemsEl.querySelectorAll('.wishlist-move-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const id = btn.getAttribute('data-product-id');
                    const item = wishlist[id];
                    if (item && window.cartPopupSystem) {
                        // Create a temporary object matching what cart expects
                        // We use the 'addToCartFromProductDetails' method as it accepts a direct object
                        // Or we can simulate a button click if needed, but direct call is cleaner
                        const productForCart = {
                            id: item.id,
                            name: item.title,
                            // Ensure price is a number
                            price: parsePriceToNumber(item.price),
                            image: item.image,
                            is_3d: item.is_3d
                        };

                        if (typeof window.cartPopupSystem.addToCartFromProductDetails === 'function') {
                            window.cartPopupSystem.addToCartFromProductDetails(productForCart, 1);
                            window.cartPopupSystem.showNotification(`${item.title} added to cart!`, 'success');
                        } else {
                            // Fallback
                            console.warn('Cart system not ready');
                        }
                    }
                });
            });
        }
        if (window.wishlistSystem && typeof window.wishlistSystem.updateNavbarButton === 'function') {
            window.wishlistSystem.updateNavbarButton();
        }
    }

    window.wishlistSystem = {
        add: (product) => {
            if (!product?.id) return;
            wishlist[String(product.id)] = product;
            saveWishlist();
            renderWishlist();
            syncWishlistButtons();
        },
        remove: (productId) => removeFromWishlist(productId),
        has: (productId) => isWishlisted(productId),
        wishlist,
        updateNavbarButton: () => {
            try {
                const count = Object.keys(wishlist).length;
                if (wishlistNavItem) wishlistNavItem.hidden = count === 0;
                if (wishlistNavCount) {
                    wishlistNavCount.hidden = count === 0;
                    wishlistNavCount.textContent = String(count);
                }
                if (wishlistFloatingBtn) wishlistFloatingBtn.hidden = count === 0;
                if (wishlistFloatingCount) {
                    wishlistFloatingCount.hidden = count === 0;
                    wishlistFloatingCount.textContent = String(count);
                }
                if (count === 0) closeWishlistPopup();
            } catch { }
        }
    };

    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
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

    // Observe gallery items for animation
    function observeItems(items) {
        // Obsolete function since scroll animations are handled differently now.
    }
    observeItems(galleryItems);

    // Add click effects to gallery items
    function bindRipple(items) {
        items.forEach(item => {
            item.addEventListener('click', function (e) {
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
        searchInput.addEventListener('input', function () {
            currentSearch = this.value.toLowerCase();
            updateClearButton();
            applyFilters();
        });
    }

    // Clear search button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function () {
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
        img.addEventListener('load', function () {
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
        img.addEventListener('error', function () {
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
    document.addEventListener('keydown', function (e) {
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
        button.addEventListener('click', function () {
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
        button.addEventListener('click', function () {
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
            });
            updateResultsCounter(galleryItems.length);
        }
    }, 3000);








    // Price range filter
    if (priceRange) {
        priceRange.addEventListener('input', function () {
            currentMaxPrice = parseFloat(this.value);
            priceValue.textContent = `₹0 - ₹${currentMaxPrice.toLocaleString('en-IN')}`;
            maxPriceInput.value = currentMaxPrice;
            applyFilters();
        });
    }

    // Min price input
    if (minPriceInput) {
        minPriceInput.addEventListener('input', function () {
            currentMinPrice = parseFloat(this.value) || 0;
            applyFilters();
        });
    }

    // Max price input
    if (maxPriceInput) {
        maxPriceInput.addEventListener('input', function () {
            currentMaxPrice = parseFloat(this.value) || 90000;
            priceRange.value = currentMaxPrice;
            priceValue.textContent = `₹0 - ₹${currentMaxPrice.toLocaleString('en-IN')}`;
            applyFilters();
        });
    }

    // Sort functionality
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            currentSort = this.value;
            applyFilters();
        });
    }

    function sortItems(items, criteria) {
        return items.sort((a, b) => {
            if (criteria === 'price-low') {
                const priceA = getPriceFromCard(a);
                const priceB = getPriceFromCard(b);
                return priceA - priceB;
            } else if (criteria === 'price-high') {
                const priceA = getPriceFromCard(a);
                const priceB = getPriceFromCard(b);
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
            const is3d = item.getAttribute('data-is-3d') === '1';
            const title = item.querySelector('.product-title').textContent.toLowerCase();
            const priceText = getPriceTextFromCard(item);
            const price = getPriceFromCard(item);
            const brand = item.getAttribute('data-brand') || '';
            const material = item.getAttribute('data-material') || '';

            // Check category filter (special handling for 3D filter)
            let categoryMatch = false;
            if (currentFilter === 'all') {
                categoryMatch = true;
            } else if (currentFilter === '3d') {
                // Show only 3D items in 3D Models filter
                categoryMatch = !!is3d;
            } else {
                categoryMatch = category === currentFilter;
            }

            // Check search filter
            const searchMatch = currentSearch === '' ||
                title.includes(currentSearch) ||
                priceText.toLowerCase().includes(currentSearch);

            // Check price filter
            const priceMatch = price >= currentMinPrice && price <= currentMaxPrice;

            if (categoryMatch && searchMatch && priceMatch) {
                item.style.display = 'block';
                item.style.opacity = '1';
                visibleItems.push(item);
            } else {
                item.style.opacity = '0';
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

        // Apply sorting rules
        if (currentFilter === 'all') {
            if (currentSort) {
                // Respect sort selection in "All Items" view
                visibleItems = sortItems(visibleItems, currentSort);
            } else {
                // Default: category → is3D (false first) → optional priority
                visibleItems = sortAllItemsForAllFilter(visibleItems);
            }
            visibleItems.forEach(item => galleryContainer.appendChild(item));
        } else if (currentSort) {
            // Fallback to existing sort for other filters if set
            visibleItems = sortItems(visibleItems, currentSort);
            visibleItems.forEach(item => galleryContainer.appendChild(item));
        }

        // Update results counter
        updateResultsCounter(visibleItems.length);
    }

    // Sorting for "All Items" view: group by category, then normal before 3D, then by optional priority
    function sortAllItemsForAllFilter(items) {
        return items.slice().sort((a, b) => {
            const catA = (a.getAttribute('data-category') || '').toLowerCase();
            const catB = (b.getAttribute('data-category') || '').toLowerCase();
            const catCmp = catA.localeCompare(catB, undefined, { sensitivity: 'base' });
            if (catCmp !== 0) return catCmp;

            const a3d = a.getAttribute('data-is-3d') === '1' ? 1 : 0;
            const b3d = b.getAttribute('data-is-3d') === '1' ? 1 : 0;
            if (a3d !== b3d) return a3d - b3d; // normal first (0), then 3D (1)

            const priA = parseInt(a.getAttribute('data-priority') || a.getAttribute('data-order') || '0', 10);
            const priB = parseInt(b.getAttribute('data-priority') || b.getAttribute('data-order') || '0', 10);
            return (isNaN(priA) ? 0 : priA) - (isNaN(priB) ? 0 : priB);
        });
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
            const price = getPriceFromCard(item);
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
    function bindCardButtons(context) {
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
        const actionDetailsBtns = [];
        const actionCartBtns = [];
        const action3DBtns = [];
        const actionWishlistBtns = [];

        scopes.forEach(root => {
            if (!root || !root.querySelectorAll) return;
            actionDetailsBtns.push(...root.querySelectorAll('.action-details-btn'));
            actionCartBtns.push(...root.querySelectorAll('.action-cart-btn'));
            action3DBtns.push(...root.querySelectorAll('.action-3d-btn'));
            actionWishlistBtns.push(...root.querySelectorAll('.action-wishlist-btn'));
        });

        // Details button: navigate to product details page
        actionDetailsBtns.forEach(btn => {
            if (btn.dataset.boundActionDetails === '1') return;
            btn.dataset.boundActionDetails = '1';
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                if (href) window.location.href = href;
            });
        });

        // Cart button: handled by delegated listener in cart-popup.js
        actionCartBtns.forEach(btn => {
            if (btn.dataset.boundActionCart === '1') return;
            btn.dataset.boundActionCart = '1';
            // No need to bind listener - delegated listener in cart-popup.js handles this
        });

        // 3D View button: open 3D viewer modal
        action3DBtns.forEach(btn => {
            if (btn.dataset.boundAction3D === '1') return;
            btn.dataset.boundAction3D = '1';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productCard = btn.closest('.product-card');
                const productTitle = productCard.querySelector('.product-title').textContent;
                const modelSrc = normalizeModelSrc(btn.getAttribute('data-model-src') || '');
                const usdzSrc = normalizeModelSrc(btn.getAttribute('data-usdz-src') || productCard?.getAttribute('data-usdz-src') || '');
                const productId = btn.getAttribute('data-product-id');
                const mvOnCard = productCard.querySelector('model-viewer');
                const started = launchNativeAR({
                    productTitle,
                    modelSrc,
                    usdzSrc,
                    modelViewer: mvOnCard,
                    productId
                });
                if (!started) {
                    showGalleryARExperience(productTitle, modelSrc, productId, usdzSrc);
                }
            });
        });

        // Wishlist button functionality with persistence
        actionWishlistBtns.forEach(btn => {
            if (btn.dataset.boundActionWishlist === '1') return;
            btn.dataset.boundActionWishlist = '1';
            btn.addEventListener('click', function (e) {
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
                // Ensure button UI updates
                syncWishlistButtons();
            });
        });
    }

    bindCardButtons(document);

    // Make the entire product card clickable to open product details
    function bindCardNavigation(context) {
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

        scopes.forEach(root => {
            if (!root || !root.querySelectorAll) return;
            root.querySelectorAll('.product-card').forEach(card => {
                if (card.dataset.navBound === '1') return;
                card.dataset.navBound = '1';
                card.addEventListener('click', (e) => {
                    // Skip clicks on any actionable buttons/links inside the card
                    if (e.target.closest('.action-btn') || e.target.closest('a') || e.target.closest('.action-cart-btn')) return;
                    const pid = card.getAttribute('data-product-id');
                    if (!pid) return;
                    window.location.href = `product-details.html?id=${encodeURIComponent(pid)}`;
                });
            });
        });
    }

    bindCardNavigation(document);

    // Delegated handlers as a safety net: ensures clicks work even if buttons are added later
    if (galleryContainer) {
        galleryContainer.addEventListener('click', (e) => {
            // 1. Handle Quick View
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

            // 2. Handle View in Room (AR)
            const arBtn = e.target.closest('.view-in-room-btn');
            if (arBtn && galleryContainer.contains(arBtn)) {
                e.preventDefault();
                const card = arBtn.closest('.product-card');
                const title = card?.querySelector('.product-title')?.textContent || 'Item';
                const rawSrc = arBtn.getAttribute('data-model-src') || '';
                const modelSrc = normalizeModelSrc(rawSrc);
                const usdzSrc = normalizeModelSrc(arBtn.getAttribute('data-usdz-src') || card?.getAttribute('data-usdz-src') || '');
                const id = arBtn.getAttribute('data-product-id') || card?.getAttribute('data-product-id');
                const mv = card?.querySelector('model-viewer');
                const started = launchNativeAR({
                    productTitle: title,
                    modelSrc,
                    usdzSrc,
                    modelViewer: mv,
                    productId: id
                });
                if (!started) {
                    showGalleryARExperience(title, modelSrc, id, usdzSrc);
                }
                return;
            }

            // 3. Handle Card Navigation (only if not an action button)
            const card = e.target.closest('.product-card');
            if (card && galleryContainer.contains(card)) {
                const isAction = e.target.closest('.action-btn') ||
                    e.target.closest('a') ||
                    e.target.closest('.action-cart-btn') ||
                    e.target.closest('.variant-select');

                if (isAction) {
                    // Let specific handlers take care of it, don't navigate
                    return;
                }

                const id = card.getAttribute('data-product-id');
                if (id) {
                    window.location.href = `product-details.html?id=${encodeURIComponent(id)}`;
                    return;
                }
            }
        });
    }

    // Initialize wishlist state immediately so buttons reflect saved items
    try {
        
         // safe no-op if section doesn't exist
        window.wishlistSystem && window.wishlistSystem.updateNavbarButton();
    } catch (e) { console.debug('Wishlist init skipped:', e); }

    // Fetch products from API and append to gallery (if any)
    async function fetchAndAppendProducts() {
        if (!galleryContainer) return;
        const hadNoCards = galleryContainer.querySelectorAll('.product-card').length === 0;
        const skeletonStart = Date.now();
        if (hadNoCards) {
            renderSkeletonCards(8);
        }

        // Staggered reveal helper — fades cards in one by one
        function revealCardsStaggered(cards) {
            cards.forEach((card, i) => {
                setTimeout(() => {
                    card.classList.add('card-revealed');
                }, i * 80); // 80ms gap between each card
            });
        }

        try {
            const res = await fetch('/api/products', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            const products = (data.products || []);
            if (!products.length) return;
            const created = [];
            products.forEach(p => {
                // Normalize new + legacy fields
                const imgSrc = normalizeMediaUrl(p.thumbnail || p.image || 'image/Logo maker project.webp');
                const is3D = !!(p.model_3d?.enabled || p.is_3d);
                const modelSrc = normalizeMediaUrl(p.model_3d?.file_url || p.model_src || '');
                const usdzSrc = normalizeMediaUrl(p.model_3d?.usdz_url || p.model_3d?.ios_url || p.usdz_src || p.ios_model_src || deriveUsdzUrl(modelSrc) || '');
                const iosSrcAttr = usdzSrc ? ` ios-src="${usdzSrc}"` : '';

                const existing = galleryContainer.querySelector(`.product-card[data-product-id="${p.id}"]`);
                const priceHtml = `<span class="current-price">₹${Number(p.price || 0).toLocaleString('en-IN')}</span>`;
                const originalHtml = p.original_price ? `<span class=\"original-price\">₹${Number(p.original_price).toLocaleString('en-IN')}</span>` : '';
                const discountHtml = p.discount ? `<span class=\"discount\">-${p.discount}%</span>` : '';
                const badgeHtml = p.badge ? `<div class=\"product-badge\">${p.badge}</div>` : '';

                // ── Build unique slide items (dedup thumbnail vs gallery) ──
                const normalizeUrl = (u) => {
                    if (!u) return '';
                    return u.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\?.*$/, '').toLowerCase().trim();
                };
                const addedUrls = new Set();
                const slideItems = [];

                const tryAdd = (url) => {
                    const key = normalizeUrl(url);
                    if (!key || addedUrls.has(key)) return false;
                    addedUrls.add(key);
                    return true;
                };

                // For 3D products: model-viewer is always slide 1, poster counts as "used"
                if (is3D && modelSrc) {
                    slideItems.push(`<div class="slide-item" style="flex:0 0 100%;scroll-snap-align:start;width:100%;height:100%;position:relative;"><model-viewer src="${modelSrc}"${iosSrcAttr} poster="${imgSrc}" shadow-intensity="1" alt="${p.name}" camera-controls auto-rotate disable-zoom ar ar-modes="scene-viewer quick-look webxr" style="width:100%;height:100%;touch-action:pan-y;"></model-viewer></div>`);
                    // poster already shows the thumbnail, so mark it used
                    tryAdd(imgSrc);
                }

                // Non-3D or extra thumbnail (skipped if already used as poster above)
                if (imgSrc && tryAdd(imgSrc)) {
                    slideItems.push(`<div class="slide-item" style="flex:0 0 100%;scroll-snap-align:start;width:100%;height:100%;position:relative;"><img src="${imgSrc}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.src='image/Logo maker project.webp';"></div>`);
                }

                // Gallery images (deduplicated against thumbnail + poster)
                if (Array.isArray(p.gallery) && p.gallery.length > 0) {
                    p.gallery.forEach(gImg => {
                        const safeGalleryImg = normalizeMediaUrl(gImg);
                        if (safeGalleryImg && tryAdd(safeGalleryImg)) {
                            slideItems.push(`<div class="slide-item" style="flex:0 0 100%;scroll-snap-align:start;width:100%;height:100%;position:relative;"><img src="${safeGalleryImg}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.src='image/Logo maker project.webp';"></div>`);
                        }
                    });
                }

                let mediaHtml = '';
                if (slideItems.length > 1) {
                    const isMobileViewport = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
                    const dotSize = isMobileViewport ? 5 : 8;
                    const dotGap = isMobileViewport ? 3 : 5;
                    mediaHtml = `
                        <div class="product-slider-wrapper" style="position:relative;width:100%;height:100%;overflow:hidden;touch-action:pan-y;">
                            <div class="product-slider-container" data-slide-count="${slideItems.length}" style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none;width:100%;height:100%;touch-action:pan-y;">
                                ${slideItems.join('')}
                            </div>
                            <button class="slider-nav prev" aria-label="Previous" style="position:absolute;left:4px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.85);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px;font-weight:bold;color:#333;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.4);z-index:3;opacity:0;transition:opacity .2s;">&#10094;</button>
                            <button class="slider-nav next" aria-label="Next" style="position:absolute;right:4px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.85);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px;font-weight:bold;color:#333;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.4);z-index:3;opacity:0;transition:opacity .2s;">&#10095;</button>
                            <div class="slider-dots" style="position:absolute;bottom:8px;left:0;right:0;display:flex;justify-content:center;gap:${dotGap}px;z-index:4;">
                                ${slideItems.map((_, i) => `<button class="slider-dot" data-index="${i}" aria-label="Go to slide ${i + 1}" style="width:${dotSize}px;height:${dotSize}px;min-width:${dotSize}px;min-height:${dotSize}px;max-width:${dotSize}px;max-height:${dotSize}px;padding:0;border:none;border-radius:50%;background:${i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'};box-shadow:0 1px 2px rgba(0,0,0,0.3);cursor:pointer;transition:background .3s, transform .2s;"></button>`).join('')}
                            </div>
                        </div>
                    `;
                } else if (slideItems.length === 1) {
                    // Single slide — no slider UI needed (handles both 3D-only and normal single-image)
                    mediaHtml = slideItems[0];
                } else {
                    mediaHtml = `<div style="width:100%;height:100%;"><img src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='image/Logo maker project.webp';"></div>`;
                }
                if (existing) {
                    existing.setAttribute('data-is-3d', is3D ? '1' : '0');
                    existing.setAttribute('data-model-src', modelSrc);
                    if (usdzSrc) existing.setAttribute('data-usdz-src', usdzSrc); else existing.removeAttribute('data-usdz-src');
                    existing.setAttribute('data-price', String(Number(p.price || 0)));
                    if (imgSrc) existing.setAttribute('data-image', imgSrc); else existing.removeAttribute('data-image');
                    // Update existing static card with latest DB data
                    existing.setAttribute('data-category', p.category || '');
                    // Priority / order
                    const priorityVal = (p.priority !== undefined ? p.priority : (p.order !== undefined ? p.order : undefined));
                    if (priorityVal !== undefined) existing.setAttribute('data-priority', String(priorityVal)); else existing.removeAttribute('data-priority');
                    if (p.brand) existing.setAttribute('data-brand', p.brand); else existing.removeAttribute('data-brand');
                    if (p.material) existing.setAttribute('data-material', p.material); else existing.removeAttribute('data-material');
                    const imgWrap = existing.querySelector('.product-image');
                    if (imgWrap) {
                        const overlay = imgWrap.querySelector('.product-overlay');
                        imgWrap.innerHTML = `${mediaHtml}${overlay ? overlay.outerHTML : ''}${badgeHtml}`;
                    }
                    const titleEl = existing.querySelector('.product-title');
                    if (titleEl) titleEl.textContent = p.name;
                    const existingArBtn = existing.querySelector('.view-in-room-btn');
                    if (existingArBtn) {
                        existingArBtn.setAttribute('data-model-src', modelSrc);
                        if (usdzSrc) existingArBtn.setAttribute('data-usdz-src', usdzSrc); else existingArBtn.removeAttribute('data-usdz-src');
                    }
                    const ratingWrap = existing.querySelector('.product-rating');
                    if (ratingWrap) {
                        const starsHtml = renderStars(p.rating || 0);
                        ratingWrap.innerHTML = `<span class="stars">${starsHtml}</span>`;
                        const countSpan = document.createElement('span');
                        countSpan.className = 'rating-count';
                        countSpan.textContent = `(${(p.rating || 0).toFixed(1)}) ${p.rating_count || 0} reviews`;
                        ratingWrap.appendChild(countSpan);
                    }
                    const priceWrap = existing.querySelector('.product-price');
                    if (priceWrap) priceWrap.innerHTML = `${priceHtml}${originalHtml}${discountHtml}`;
                    // Re-bind buttons on this card
                    bindCardButtons(existing);
                } else {
                    // Create a new card if it doesn't exist in static markup
                    const card = document.createElement('div');
                    card.className = 'product-card' + (is3D ? ' product-card-3d' : '');
                    card.setAttribute('data-category', p.category || '');
                    card.setAttribute('data-product-id', p.id);
                    card.setAttribute('data-is-3d', is3D ? '1' : '0');
                    card.setAttribute('data-model-src', modelSrc);
                    if (usdzSrc) card.setAttribute('data-usdz-src', usdzSrc);
                    card.setAttribute('data-price', String(Number(p.price || 0)));
                    if (imgSrc) card.setAttribute('data-image', imgSrc);
                    if (p.brand) card.setAttribute('data-brand', p.brand);
                    if (p.material) card.setAttribute('data-material', p.material);
                    const priorityCardVal = (p.priority !== undefined ? p.priority : (p.order !== undefined ? p.order : undefined));
                    if (priorityCardVal !== undefined) card.setAttribute('data-priority', String(priorityCardVal));
                    card.innerHTML = `
                        <div class="product-image">
                            ${mediaHtml}
                            <div class="badge-container">
                                ${is3D && modelSrc ? `<div class="product-badge product-3d-badge">View in 3D</div>` : ''}
                                ${badgeHtml ? badgeHtml.replace('product-badge', 'product-badge new') : ''}
                            </div>
                            <div class="product-actions">
                                <button class="action-btn action-wishlist-btn" data-product-id="${p.id}" title="Add to Wishlist">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                    </svg>
                                </button>
                                ${is3D ? `
                                <button class="action-btn view-in-room-btn" data-product-id="${p.id}" data-model-src="${modelSrc}" data-usdz-src="${usdzSrc}" title="View in Room">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                                    </svg>
                                </button>
                                ` : ''}
                                <a href="product-details.html?id=${p.id}" class="action-btn action-details-btn" title="View Details">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div class="product-info">
                            <div class="product-category">${p.category || 'Furniture'}</div>
                            <h3 class="product-title">${p.name}</h3>
                            <div class="product-rating">
                                <span class="stars">${renderStars(p.rating || 0)}</span>
                                <span class="rating-count">(${(p.rating || 0).toFixed(1)})</span>
                            </div>
                            <div class="product-price-row">
                                <div class="product-price">
                                    ${priceHtml}
                                    ${originalHtml}
                                </div>
                                ${discountHtml}
                            </div>
                            <button class="product-add-btn action-cart-btn" data-product-id="${p.id}">
                                Add to Cart
                            </button>
                        </div>`;
                    galleryContainer.appendChild(card);
                    created.push(card);
                }
            });
            if (created.length) {
                // Enforce a minimum skeleton display of 800ms so user sees loading effect
                const elapsed = Date.now() - skeletonStart;
                const remainingWait = Math.max(0, 800 - elapsed);

                await new Promise(resolve => setTimeout(resolve, remainingWait));

                // Remove skeletons
                clearSkeletonCards();

                galleryItems = Array.from(document.querySelectorAll('.product-card')).filter((card) => !card.classList.contains('skeleton-card'));
                observeItems(created);
                bindRipple(created);
                // Bind only the newly created cards to avoid double-binding existing buttons
                bindCardButtons(created);
                bindCardNavigation(created);

                // Staggered reveal animation
                revealCardsStaggered(created);

                // Initialize internal sliders
                function initSliders(cards) {
                    cards.forEach(card => {
                        const wrappers = card.querySelectorAll('.product-slider-wrapper:not([data-slider-init])');
                        wrappers.forEach(wrapper => {
                            wrapper.dataset.sliderInit = 'true';
                            const scroller = wrapper.querySelector('.product-slider-container');
                            const dots = wrapper.querySelectorAll('.slider-dot');
                            const prevBtn = wrapper.querySelector('.slider-nav.prev');
                            const nextBtn = wrapper.querySelector('.slider-nav.next');
                            const slideCount = parseInt(scroller?.dataset.slideCount || dots.length, 10);
                            if (!scroller || slideCount <= 1) return;

                            let currentIndex = 0;
                            let autoPlayTimer = null;
                            const isMobileViewport = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;

                            const updateDots = (idx) => {
                                dots.forEach((d, i) => {
                                    d.style.background = i === idx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)';
                                    d.style.transform = i === idx ? (isMobileViewport ? 'scale(1.1)' : 'scale(1.3)') : 'scale(1)';
                                });
                            };

                            const goToSlide = (idx) => {
                                currentIndex = ((idx % slideCount) + slideCount) % slideCount; // wraps around
                                const w = scroller.clientWidth;
                                scroller.scrollTo({ left: w * currentIndex, behavior: 'smooth' });
                                updateDots(currentIndex);
                            };

                            // Prev / Next buttons
                            if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); goToSlide(currentIndex - 1); resetAuto(); });
                            if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); goToSlide(currentIndex + 1); resetAuto(); });

                            // Clickable dots
                            dots.forEach(dot => {
                                dot.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const idx = parseInt(dot.dataset.index, 10);
                                    if (!isNaN(idx)) { goToSlide(idx); resetAuto(); }
                                });
                            });

                            // Sync dots on manual scroll / swipe
                            scroller.addEventListener('scroll', () => {
                                const w = scroller.clientWidth;
                                if (w > 0) {
                                    const idx = Math.round(scroller.scrollLeft / w);
                                    if (idx !== currentIndex && idx >= 0 && idx < slideCount) {
                                        currentIndex = idx;
                                        updateDots(currentIndex);
                                    }
                                }
                            }, { passive: true });

                            // Auto-play at a comfortable 6-second interval
                            const startAuto = () => {
                                stopAuto();
                                autoPlayTimer = setInterval(() => goToSlide(currentIndex + 1), 6000);
                            };
                            const stopAuto = () => { if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; } };
                            const resetAuto = () => { stopAuto(); startAuto(); };

                            // Pause on hover, resume on leave
                            wrapper.addEventListener('mouseenter', stopAuto);
                            wrapper.addEventListener('mouseleave', startAuto);

                            // If slider has a 3D model, delay auto-play so model loads first
                            const has3DSlide = !!scroller.querySelector('model-viewer');
                            if (has3DSlide) {
                                setTimeout(startAuto, 4000);
                            } else {
                                startAuto();
                            }
                        });
                    });
                }
                initSliders(created);

                updatePriceRange();
                applyFilters();
                window.wishlistSystem && window.wishlistSystem.updateNavbarButton();

                // Also reveal any existing cards that were updated (not newly created)
                const allRealCards = galleryContainer.querySelectorAll('.product-card:not(.skeleton-card):not(.card-revealed)');
                revealCardsStaggered(Array.from(allRealCards));
            }
        } catch (e) {
            console.warn('Failed to fetch products', e);
        } finally {
            clearSkeletonCards();
            // Reveal any cards that may not have been marked yet
            const unrevealed = galleryContainer?.querySelectorAll('.product-card:not(.skeleton-card):not(.card-revealed)');
            if (unrevealed) revealCardsStaggered(Array.from(unrevealed));
        }
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
            const modelSrc = normalizeModelSrc(btn.getAttribute('data-model-src') || '');
            const usdzSrc = normalizeModelSrc(btn.getAttribute('data-usdz-src') || productCard?.getAttribute('data-usdz-src') || '');
            const productId = btn.getAttribute('data-product-id');
            const mvOnCard = productCard.querySelector('model-viewer');
            const started = launchNativeAR({
                productTitle,
                modelSrc,
                usdzSrc,
                modelViewer: mvOnCard,
                productId
            });
            if (!started) {
                showGalleryARExperience(productTitle, modelSrc, productId, usdzSrc);
            }
        });
    });

    // Function to show AR experience from gallery
    function showGalleryARExperience(productTitle, modelSrc, productId, usdzSrc = '') {
        const esc = (s) => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
        const iosSrcAttr = usdzSrc ? ` ios-src="${esc(usdzSrc)}"` : '';
        const modal = document.createElement('div');
        modal.className = 'gallery-ar-modal';
        modal.innerHTML = `
            <div class="gallery-ar-overlay"></div>
            <div class="gallery-ar-content">
                <div class="gallery-ar-header">
                    <h3>View ${esc(productTitle)} in Your Room</h3>
                    <button class="gallery-ar-close">&times;</button>
                </div>
                <div class="gallery-ar-body">
                    <model-viewer src="${esc(modelSrc)}"${iosSrcAttr} alt="${esc(productTitle)}" camera-controls auto-rotate background-color="#121419" ar ar-modes="scene-viewer quick-look webxr" style="width:100%;height:400px;border-radius:1.2rem;box-shadow:0 2px 12px rgba(0,0,0,0.35);"></model-viewer>
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
            
            /* Minimalist AR Modal Styles */
            .gallery-ar-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.4); /* Lighter, smoother backdrop */
                backdrop-filter: blur(8px);
                z-index: 1000;
                transition: opacity 0.3s ease;
            }
            
            .gallery-ar-content {
                position: relative;
                background: var(--g-surface, #ffffff);
                border-radius: 24px;
                padding: 40px;
                max-width: 650px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                animation: galleryArModalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 1001;
                border: 1px solid var(--g-border, #e5e7eb);
            }

            /* Dark Mode for AR Modal */
            body.dark-mode .gallery-ar-content {
                background: #16181d;
                border-color: #24262c;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
            
            @keyframes galleryArModalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .gallery-ar-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 2rem;
                padding-bottom: 0;
                border-bottom: none;
            }
            
            .gallery-ar-header h3 {
                margin: 0;
                color: var(--g-text, #111827);
                font-size: 1.75rem;
                font-weight: 700;
                letter-spacing: -0.02em;
                line-height: 1.2;
            }

            body.dark-mode .gallery-ar-header h3 {
                color: #f3f4f6;
            }
            
            .gallery-ar-close {
                background: transparent;
                border: none;
                font-size: 1.5rem;
                color: var(--g-text-light, #6b7280);
                cursor: pointer;
                padding: 8px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                margin-left: 1rem;
                margin-top: -8px;
            }
            
            .gallery-ar-close:hover {
                background: var(--g-bg, #f3f4f6);
                color: var(--g-text, #111827);
            }

            body.dark-mode .gallery-ar-close:hover {
                background: #24262c;
                color: #f3f4f6;
            }
            
            .gallery-ar-body {
                margin-bottom: 2rem;
            }
            
            /* Instructions Box */
            .gallery-ar-instructions {
                margin-top: 2rem;
                padding: 1.5rem;
                background: var(--g-bg, #f9fafb);
                border-radius: 16px;
                border: 1px solid var(--g-border, #e5e7eb);
            }

            body.dark-mode .gallery-ar-instructions {
                background: #0f0f11;
                border: 1px solid #24262c;
            }
            
            .gallery-ar-instructions h4 {
                margin: 0 0 0.75rem 0;
                color: var(--g-text, #111827);
                font-size: 1rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            body.dark-mode .gallery-ar-instructions h4 {
                color: #e5e7eb;
            }
            
            .gallery-ar-instructions ol {
                margin: 0;
                padding-left: 1.25rem;
                color: var(--g-text-light, #4b5563);
                line-height: 1.6;
                font-size: 0.95rem;
            }

            body.dark-mode .gallery-ar-instructions ol {
                color: #9ca3af;
            }
            
            .gallery-ar-instructions li {
                margin-bottom: 0.5rem;
            }
            
            .gallery-ar-footer {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                margin-top: 2rem;
            }
            
            /* Minimalist Buttons */
            .gallery-ar-start-btn,
            .gallery-ar-view-details-btn {
                padding: 12px 24px;
                border-radius: 100px; /* Pill shape */
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .gallery-ar-start-btn {
                background: var(--g-text, #111827);
                color: white;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }

            body.dark-mode .gallery-ar-start-btn {
                background: #d4a373; /* Accent color */
                color: #111;
            }
            
            .gallery-ar-start-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            
            .gallery-ar-view-details-btn {
                background: transparent;
                color: var(--g-text, #111827);
                border: 1px solid var(--g-border, #e5e7eb);
            }

            body.dark-mode .gallery-ar-view-details-btn {
                color: #e5e7eb;
                border-color: #374151;
            }
            
            .gallery-ar-view-details-btn:hover {
                border-color: var(--g-text, #111827);
                background: var(--g-bg, #f9fafb);
            }

            body.dark-mode .gallery-ar-view-details-btn:hover {
                border-color: #d4a373;
                background: #1f2937;
                color: #d4a373;
            }
            
            @media (max-width: 768px) {
                .gallery-ar-content {
                    padding: 24px;
                    width: 95%;
                    margin: 10px;
                }
                
                .gallery-ar-header h3 {
                    font-size: 1.5rem;
                }
                
                .gallery-ar-footer {
                    flex-direction: column-reverse;
                    gap: 12px;
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

        const closeModal = () => { try { document.body.classList.remove('no-scroll'); } catch { } modal.remove(); };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        startBtn.addEventListener('click', () => {
            const started = launchNativeAR({
                productTitle,
                modelSrc,
                usdzSrc,
                modelViewer,
                productId
            });
            if (!started) {
                if (window.cartPopupSystem) {
                    const { isIOS } = getDeviceInfo();
                    const msg = isIOS
                        ? 'This iPhone/iPad needs a USDZ model file for AR. Please open product details.'
                        : 'AR is not available on this device/browser. Please open product details.';
                    window.cartPopupSystem.showNotification(msg, 'warning');
                }
            }
        });

        viewDetailsBtn.addEventListener('click', () => {
            // Close modal and let the anchor navigate
            closeModal();
        });

        document.body.appendChild(modal);
        try { document.body.classList.add('no-scroll'); } catch { }
    }

    // --- Initialize wishlist UI ---
    if (wishlistSection) {
        wishlistSection.inert = true;
        loadWishlist();
        renderWishlist();
        syncWishlistButtons();
        
        if (window.location.hash === '#wishlist') {
            setTimeout(() => {
                openWishlistPopup();
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }, 300);
        }

        if (wishlistNavButton) {
            wishlistNavButton.addEventListener('click', (e) => {
                e.preventDefault();
                openWishlistPopup();
            });
        }

        if (wishlistFloatingBtn) {
            wishlistFloatingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openWishlistPopup();
            });
        }

        if (closeWishlistBtn) {
            closeWishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeWishlistPopup();
            });
        }

        if (wishlistBackdrop) {
            wishlistBackdrop.addEventListener('click', (e) => {
                e.preventDefault();
                closeWishlistPopup();
            });
        }

        wishlistSection?.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const handleWishlistOutsideClose = (e) => {
            if (!document.body.classList.contains('wishlist-popup-open')) return;
            const target = e.target;
            const clickedInsidePopup = !!target.closest('.wishlist-popup');
            const clickedWishlistButton = !!target.closest('#wishlistNavButton');
            if (!clickedInsidePopup && !clickedWishlistButton) {
                closeWishlistPopup();
            }
        };

        document.addEventListener('click', handleWishlistOutsideClose, true);
        document.addEventListener('touchstart', handleWishlistOutsideClose, { passive: true, capture: true });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('wishlist-popup-open')) {
                closeWishlistPopup();
            }
        });

        // Clear all
        if (clearWishlistBtn) {
            clearWishlistBtn.addEventListener('click', () => {
                wishlist = {};
                saveWishlist();
                renderWishlist();
                syncWishlistButtons();
                closeWishlistPopup();
                
                if (window.cartPopupSystem) {
                    window.cartPopupSystem.showNotification('Wishlist cleared', 'info');
                }
            });
        }

        // Remove single via delegation
        if (wishlistItemsEl) {
            wishlistItemsEl.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.wishlist-remove');
                const addBtn = e.target.closest('.wishlist-move-btn');
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
                        image: (data.image && String(data.image).trim()) ? data.image : (data.is_3d || data.model_src ? 'image/Logo maker project.webp' : 'image/Logo maker project.webp'),
                        is_3d: !!data.is_3d,
                        model_src: data.model_src || ''
                    };
                    if (window.cartPopupSystem && typeof window.cartPopupSystem.addToCartFromProductDetails === 'function') {
                        window.cartPopupSystem.addToCartFromProductDetails(product, 1);
                        window.cartPopupSystem.showNotification(`${product.name} added to cart!`, 'success');
                    } else {
                        // Fallback: create a hidden button-like context
                        const fakeBtn = document.createElement('button');
                        fakeBtn.setAttribute('data-product-id', String(product.id));
                        document.body.appendChild(fakeBtn);
                        try { window.cartPopupSystem?.addToCart(fakeBtn); } catch { }
                        try { document.body.removeChild(fakeBtn); } catch { }
                    }
                }
            });
        }
    }

}); 