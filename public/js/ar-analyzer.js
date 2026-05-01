/**
 * AR Room Stager v3.0 — Mobile-Only AR Furniture Experience
 * WebXR Hit-Test, Multi-Item Staging, Screenshot & Share,
 * Size Visualizer, Wishlist Integration.
 * Works ONLY on mobile devices.
 */

class ARRoomStager {
    constructor() {
        this.allProducts = [];
        this.stagedItems = [];
        this.activeProduct = null;
        this.isOpen = false;
        this.WISHLIST_KEY = 'hd_wishlist';
        this.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1024);

        this.categoryDimensions = {
            sofa:  { w: 200, d: 90, h: 85 },
            chair: { w: 65,  d: 60, h: 90 },
            table: { w: 120, d: 75, h: 75 },
            bed:   { w: 200, d: 160, h: 45 },
            decor: { w: 30,  d: 30, h: 40 },
            storage: { w: 80, d: 45, h: 180 },
            default: { w: 80, d: 60, h: 75 }
        };

        this.init();
    }

    init() {
        this.loadModelViewerScript();
        this.injectHTML();
        this.bindEvents();
        this.prefetchProducts();
    }

    loadModelViewerScript() {
        if (!document.querySelector('script[src*="model-viewer"]')) {
            const s = document.createElement('script');
            s.type = 'module';
            s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
            document.head.appendChild(s);
        }
    }

    async prefetchProducts() {
        try {
            const res = await fetch('/api/products?limit=100', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            this.allProducts = (data.products || []).filter(p => {
                const src = p.model_src || (p.model_3d && p.model_3d.file_url) || '';
                return !!(p.is_3d || (p.model_3d && p.model_3d.enabled)) && src;
            }).map(p => ({
                id: p.id,
                title: p.name,
                category: (p.category || 'decor').toLowerCase(),
                price: p.price,
                priceFormatted: `₹${Number(p.price || 0).toLocaleString('en-IN')}`,
                image: p.image || p.thumbnail || 'image/Logo maker project.webp',
                modelSrc: p.model_src || (p.model_3d && p.model_3d.file_url) || '',
                url: `product-details.html?id=${encodeURIComponent(p.id)}`,
                rating: p.rating || 4.5,
                dimensions: p.dimensions || null
            }));
        } catch (e) { console.warn('AR Stager: prefetch failed', e); }
    }

    getDimensions(product) {
        if (product.dimensions) return product.dimensions;
        const cat = product.category.toLowerCase();
        for (const key of Object.keys(this.categoryDimensions)) {
            if (cat.includes(key)) return this.categoryDimensions[key];
        }
        return this.categoryDimensions.default;
    }

    /* ── Wishlist helpers (syncs with gallery.js localStorage) ── */
    getWishlist() {
        try { return JSON.parse(localStorage.getItem(this.WISHLIST_KEY) || '{}'); } catch { return {}; }
    }
    isWishlisted(id) { return !!this.getWishlist()[String(id)]; }
    toggleWishlist(product) {
        const wl = this.getWishlist();
        const key = String(product.id);
        const adding = !wl[key];
        if (adding) {
            wl[key] = { id: product.id, name: product.title, price: product.price, image: product.image, model_src: product.modelSrc };
        } else {
            delete wl[key];
        }
        localStorage.setItem(this.WISHLIST_KEY, JSON.stringify(wl));
        this.syncAllHearts();
        // Dispatch event so gallery.js etc. can pick up changes
        window.dispatchEvent(new CustomEvent('wishlist-changed'));
        this.showToast(adding ? `♥ ${product.title} added to wishlist` : `${product.title} removed from wishlist`);
        return adding;
    }

    syncAllHearts() {
        document.querySelectorAll('.ars-heart-btn').forEach(btn => {
            const id = btn.dataset.productId;
            btn.classList.toggle('active', this.isWishlisted(id));
        });
    }

    /* ── Inject HTML ── */
    injectHTML() {
        const html = `
        <div id="arsContainer" class="ars-container">
            <!-- Desktop blocker -->
            <div class="ars-desktop-msg" id="arsDesktopMsg">
                <div class="ars-desktop-inner">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    <h3>Mobile Only Feature</h3>
                    <p>Open this page on your phone or tablet to use the AR Room Stager and place furniture in your real space.</p>
                    <button class="ars-desktop-close" id="arsDesktopClose">Got it</button>
                </div>
            </div>

            <!-- Mobile AR UI -->
            <div class="ars-mobile-ui" id="arsMobileUI">
                <!-- Top bar -->
                <div class="ars-topbar">
                    <button class="ars-topbar-btn" id="arsCloseBtn" aria-label="Close">
                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    <span class="ars-topbar-title">AR Room Stager</span>
                    <button class="ars-topbar-btn ars-heart-btn" id="arsActiveHeart" aria-label="Wishlist" style="display:none;">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                </div>

                <!-- Model viewer area -->
                <div class="ars-viewer-area" id="arsViewerArea">
                    <div class="ars-placeholder" id="arsPlaceholder">
                        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        <p>Select a product below to preview in 3D</p>
                    </div>
                    <div id="arsModelContainer" class="ars-model-container"></div>

                    <!-- Floating action buttons over model viewer -->
                    <div class="ars-viewer-actions" id="arsViewerActions" style="display:none;">
                        <button class="ars-fab" id="arsPlaceBtn" title="Place in Room">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                            <span>Place in Room</span>
                        </button>
                        <button class="ars-fab" id="arsScreenshotBtn" title="Screenshot">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Size Visualizer (collapsible) -->
                <div class="ars-size-panel" id="arsSizePanel" style="display:none;">
                    <button class="ars-size-toggle" id="arsSizeToggle">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 3H3v18h18V3zM9 3v18M3 9h18"/></svg>
                        <span>Does It Fit?</span>
                        <svg class="ars-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div class="ars-size-details" id="arsSizeDetails">
                        <div class="ars-dim"><span class="ars-dim-label">Width</span><span class="ars-dim-value" id="arsDimW">—</span></div>
                        <div class="ars-dim"><span class="ars-dim-label">Depth</span><span class="ars-dim-value" id="arsDimD">—</span></div>
                        <div class="ars-dim"><span class="ars-dim-label">Height</span><span class="ars-dim-value" id="arsDimH">—</span></div>
                    </div>
                </div>

                <!-- Staged items tray -->
                <div class="ars-stage-tray" id="arsStageTray" style="display:none;">
                    <div class="ars-tray-header">
                        <span class="ars-tray-title">Staged Items (<span id="arsStageCount">0</span>)</span>
                        <button class="ars-tray-clear" id="arsStageClear">Clear All</button>
                    </div>
                    <div class="ars-tray-scroll" id="arsTrayScroll"></div>
                </div>

                <!-- Product catalog -->
                <div class="ars-catalog" id="arsCatalog">
                    <div class="ars-catalog-header">
                        <span>3D Furniture</span>
                        <span class="ars-catalog-count" id="arsCatalogCount">0 items</span>
                    </div>
                    <div class="ars-catalog-scroll" id="arsCatalogScroll">
                        <!-- Products rendered here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast -->
        <div class="ars-toast" id="arsToast"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    /* ── Events ── */
    bindEvents() {
        // Open triggers (same as old: .hero-ar-button, #navbarARBtn, #checkoutAnalyzeRoomBtn)
        document.addEventListener('click', e => {
            if (e.target.closest('.hero-ar-button') || e.target.closest('#navbarARBtn') || e.target.closest('#checkoutAnalyzeRoomBtn')) {
                e.preventDefault();
                this.open();
            }
        });

        document.getElementById('arsCloseBtn').addEventListener('click', () => this.close());
        document.getElementById('arsDesktopClose').addEventListener('click', () => this.close());
        document.getElementById('arsPlaceBtn').addEventListener('click', () => this.placeInRoom());
        document.getElementById('arsScreenshotBtn').addEventListener('click', () => this.takeScreenshot());
        document.getElementById('arsSizeToggle').addEventListener('click', () => this.toggleSizePanel());
        document.getElementById('arsStageClear').addEventListener('click', () => this.clearStage());

        document.getElementById('arsActiveHeart').addEventListener('click', () => {
            if (this.activeProduct) this.toggleWishlist(this.activeProduct);
        });
    }

    /* ── Open / Close ── */
    open() {
        this.isOpen = true;
        const container = document.getElementById('arsContainer');
        container.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('ar-active');

        if (!this.isMobile) {
            document.getElementById('arsDesktopMsg').style.display = 'flex';
            document.getElementById('arsMobileUI').style.display = 'none';
        } else {
            document.getElementById('arsDesktopMsg').style.display = 'none';
            document.getElementById('arsMobileUI').style.display = 'flex';
            this.renderCatalog();
        }
    }

    close() {
        this.isOpen = false;
        const container = document.getElementById('arsContainer');
        container.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('ar-active');
    }

    /* ── Render product catalog ── */
    renderCatalog() {
        const scroll = document.getElementById('arsCatalogScroll');
        const count = document.getElementById('arsCatalogCount');

        if (!this.allProducts.length) {
            scroll.innerHTML = '<div class="ars-empty">No 3D products available yet.</div>';
            count.textContent = '0 items';
            return;
        }

        count.textContent = `${this.allProducts.length} items`;
        scroll.innerHTML = this.allProducts.map(p => `
            <div class="ars-product-card" data-id="${p.id}">
                <div class="ars-card-img">
                    <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='image/Logo maker project.webp'">
                </div>
                <div class="ars-card-info">
                    <span class="ars-card-cat">${p.category}</span>
                    <h4 class="ars-card-title">${p.title}</h4>
                    <span class="ars-card-price">${p.priceFormatted}</span>
                </div>
                <div class="ars-card-actions">
                    <button class="ars-btn-stage" data-id="${p.id}" title="Add to Stage">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Stage
                    </button>
                    <button class="ars-heart-btn" data-product-id="${p.id}" title="Wishlist">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                </div>
            </div>
        `).join('');

        this.syncAllHearts();

        // Bind card clicks
        scroll.querySelectorAll('.ars-product-card').forEach(card => {
            card.addEventListener('click', e => {
                if (e.target.closest('.ars-btn-stage') || e.target.closest('.ars-heart-btn')) return;
                const id = card.dataset.id;
                const product = this.allProducts.find(p => p.id === id);
                if (product) this.previewProduct(product);
            });
        });

        // Stage buttons
        scroll.querySelectorAll('.ars-btn-stage').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const product = this.allProducts.find(p => p.id === id);
                if (product) this.addToStage(product);
            });
        });

        // Heart buttons
        scroll.querySelectorAll('.ars-heart-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.productId;
                const product = this.allProducts.find(p => p.id === id);
                if (product) {
                    const added = this.toggleWishlist(product);
                    if (added) btn.classList.add('pop');
                    setTimeout(() => btn.classList.remove('pop'), 400);
                }
            });
        });
    }

    /* ── Preview product in model-viewer ── */
    previewProduct(product) {
        this.activeProduct = product;
        const container = document.getElementById('arsModelContainer');
        const placeholder = document.getElementById('arsPlaceholder');
        const actions = document.getElementById('arsViewerActions');
        const sizePanel = document.getElementById('arsSizePanel');
        const heartBtn = document.getElementById('arsActiveHeart');

        placeholder.style.display = 'none';
        actions.style.display = 'flex';
        sizePanel.style.display = 'block';
        heartBtn.style.display = 'flex';
        heartBtn.dataset.productId = product.id;
        heartBtn.classList.toggle('active', this.isWishlisted(product.id));

        container.innerHTML = `
            <model-viewer
                id="arsModelViewer"
                src="${product.modelSrc}"
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                auto-rotate-delay="1500"
                shadow-intensity="1.2"
                environment-image="neutral"
                exposure="1.1"
                style="width:100%;height:100%;background:transparent;"
            >
                <button slot="ar-button" class="ars-ar-slot-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    View in AR
                </button>
            </model-viewer>
        `;

        // Update dimensions
        const dims = this.getDimensions(product);
        document.getElementById('arsDimW').textContent = `${dims.w} cm`;
        document.getElementById('arsDimD').textContent = `${dims.d} cm`;
        document.getElementById('arsDimH').textContent = `${dims.h} cm`;

        // Highlight active card
        document.querySelectorAll('.ars-product-card').forEach(c => c.classList.remove('active'));
        const activeCard = document.querySelector(`.ars-product-card[data-id="${product.id}"]`);
        if (activeCard) activeCard.classList.add('active');
    }

    /* ── Place in Room (WebXR / Quick Look / Scene Viewer) ── */
    placeInRoom() {
        if (!this.activeProduct) return;
        const mv = document.getElementById('arsModelViewer');
        if (mv) {
            // model-viewer handles AR activation automatically via its AR button
            // We programmatically activate it
            try { mv.activateAR(); } catch (e) {
                // Fallback: click the slot button
                const arBtn = mv.querySelector('[slot="ar-button"]');
                if (arBtn) arBtn.click();
            }
        }
    }

    /* ── Screenshot & Share ── */
    async takeScreenshot() {
        const mv = document.getElementById('arsModelViewer');
        if (!mv) return;

        try {
            const blob = await mv.toBlob({ mimeType: 'image/png', idealAspect: true });
            const file = new File([blob], `ar-${this.activeProduct?.title || 'furniture'}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `${this.activeProduct?.title || 'Furniture'} — Home Decor Furniture`,
                    text: 'Check out this furniture in AR!',
                    files: [file]
                });
                this.showToast('Shared successfully!');
            } else {
                // Desktop fallback: download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(url);
                this.showToast('Screenshot saved!');
            }
        } catch (e) {
            console.warn('Screenshot failed:', e);
            this.showToast('Could not capture screenshot');
        }
    }

    /* ── Size panel toggle ── */
    toggleSizePanel() {
        const details = document.getElementById('arsSizeDetails');
        const panel = document.getElementById('arsSizePanel');
        panel.classList.toggle('expanded');
        details.style.display = panel.classList.contains('expanded') ? 'flex' : 'none';
    }

    /* ── Stage management ── */
    addToStage(product) {
        if (this.stagedItems.find(p => p.id === product.id)) {
            this.showToast(`${product.title} is already staged`);
            return;
        }
        this.stagedItems.push(product);
        this.renderStageTray();
        this.previewProduct(product);
        this.showToast(`${product.title} added to stage`);
        if (navigator.vibrate) navigator.vibrate(15);
    }

    removeFromStage(id) {
        this.stagedItems = this.stagedItems.filter(p => p.id !== id);
        this.renderStageTray();
        if (this.activeProduct && this.activeProduct.id === id) {
            if (this.stagedItems.length) {
                this.previewProduct(this.stagedItems[this.stagedItems.length - 1]);
            } else {
                this.clearViewer();
            }
        }
    }

    clearStage() {
        this.stagedItems = [];
        this.renderStageTray();
        this.clearViewer();
        this.showToast('Stage cleared');
    }

    clearViewer() {
        this.activeProduct = null;
        document.getElementById('arsModelContainer').innerHTML = '';
        document.getElementById('arsPlaceholder').style.display = 'flex';
        document.getElementById('arsViewerActions').style.display = 'none';
        document.getElementById('arsSizePanel').style.display = 'none';
        document.getElementById('arsActiveHeart').style.display = 'none';
    }

    renderStageTray() {
        const tray = document.getElementById('arsStageTray');
        const scroll = document.getElementById('arsTrayScroll');
        const count = document.getElementById('arsStageCount');

        if (!this.stagedItems.length) {
            tray.style.display = 'none';
            return;
        }

        tray.style.display = 'block';
        count.textContent = this.stagedItems.length;

        scroll.innerHTML = this.stagedItems.map(p => `
            <div class="ars-tray-item ${this.activeProduct && this.activeProduct.id === p.id ? 'active' : ''}" data-id="${p.id}">
                <img src="${p.image}" alt="${p.title}" onerror="this.src='image/Logo maker project.webp'">
                <button class="ars-tray-remove" data-id="${p.id}" title="Remove">×</button>
            </div>
        `).join('');

        // Bind tray item clicks
        scroll.querySelectorAll('.ars-tray-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('.ars-tray-remove')) return;
                const product = this.stagedItems.find(p => p.id === item.dataset.id);
                if (product) this.previewProduct(product);
            });
        });

        scroll.querySelectorAll('.ars-tray-remove').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this.removeFromStage(btn.dataset.id);
            });
        });
    }

    /* ── Toast ── */
    showToast(msg) {
        const toast = document.getElementById('arsToast');
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.arStager = new ARRoomStager();
});
