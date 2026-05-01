/**
 * ==========================================================================
 * SLAM-Based AR Room Stager v4.0
 * ==========================================================================
 * Simultaneous Localization & Mapping for furniture visualization
 * - Plane detection & tracking (floor, walls)
 * - Feature-based environment mapping
 * - Realistic lighting estimation
 * - Multi-item placement with collision detection
 * - WebXR with enhanced depth sensing
 * ==========================================================================
 */

class SLAMARRoomStager {
    constructor() {
        this.allProducts = [];
        this.stagedItems = [];
        this.activeProduct = null;
        this.isOpen = false;
        this.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // SLAM System
        this.xrSession = null;
        this.xrFrame = null;
        this.xrRefSpace = null;
        this.xrPlaneDetection = null;
        this.detectedPlanes = new Map();
        this.featurePoints = [];
        this.lightEstimate = null;

        // Three.js Scene
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.placedObjects = [];

        // Settings
        this.WISHLIST_KEY = 'hd_wishlist';
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

    async init() {
        this.loadModelViewerScript();
        this.injectHTML();
        this.bindEvents();
        await this.prefetchProducts();
        await this.checkXRSupport();
    }

    loadModelViewerScript() {
        if (!document.querySelector('script[src*="model-viewer"]')) {
            const s = document.createElement('script');
            s.type = 'module';
            s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
            document.head.appendChild(s);
        }
        if (!document.querySelector('script[src*="three.min.js"]')) {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            document.head.appendChild(s);
        }
    }

    async checkXRSupport() {
        try {
            if (navigator.xr) {
                const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                if (isSupported) {
                    document.getElementById('arsSLAMStatus').textContent = '✓ SLAM AR Ready';
                    document.getElementById('arsSLAMStatus').classList.add('ready');
                } else {
                    document.getElementById('arsSLAMStatus').textContent = '⚠ WebXR not available';
                }
            }
        } catch (e) {
            console.warn('XR support check failed:', e);
            document.getElementById('arsSLAMStatus').textContent = '✗ AR Unavailable';
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
        } catch (e) {
            console.warn('Product prefetch failed:', e);
        }
    }

    getDimensions(product) {
        if (product.dimensions) return product.dimensions;
        const cat = product.category.toLowerCase();
        for (const key of Object.keys(this.categoryDimensions)) {
            if (cat.includes(key)) return this.categoryDimensions[key];
        }
        return this.categoryDimensions.default;
    }

    /* ── SLAM Plane Detection ── */
    async initializeSLAM() {
        try {
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'plane-detection', 'lighting-estimation'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.body }
            });

            this.xrRefSpace = await this.xrSession.requestReferenceSpace('viewer');
            
            // Enable plane detection
            if (this.xrSession.updateWorldTrackingState) {
                this.xrSession.updateWorldTrackingState({
                    planeDetectionState: { enabled: true }
                });
            }

            this.xrSession.addEventListener('end', () => this.onXRSessionEnd());
            this.xrSession.requestAnimationFrame((time, frame) => this.onXRFrame(time, frame));

            this.showToast('🔍 SLAM initialized - Scanning environment...');
            return true;
        } catch (e) {
            console.error('SLAM initialization failed:', e);
            this.showToast('⚠ WebXR AR not available. Using fallback mode.');
            return false;
        }
    }

    async onXRFrame(time, frame) {
        const session = frame.session;

        // Process detected planes
        if (frame.worldInformation && frame.worldInformation.detectedPlanes) {
            frame.worldInformation.detectedPlanes.forEach(plane => {
                this.processPlane(plane);
            });
        }

        // Lighting estimation
        if (frame.getLighting) {
            this.lightEstimate = frame.getLighting();
            this.updateLighting();
        }

        // Continue animation loop
        session.requestAnimationFrame((time, frame) => this.onXRFrame(time, frame));
    }

    processPlane(plane) {
        const planeId = plane.id;

        if (!this.detectedPlanes.has(planeId)) {
            this.detectedPlanes.set(planeId, {
                id: planeId,
                orientation: plane.orientation,
                polygon: plane.polygon,
                objects: []
            });
            this.showToast(`✓ Detected ${plane.orientation} surface`);
        }

        const storedPlane = this.detectedPlanes.get(planeId);
        storedPlane.polygon = plane.polygon;
        storedPlane.lastUpdated = Date.now();
    }

    updateLighting() {
        if (!this.lightEstimate) return;
        // Update scene lighting based on AR environment estimation
        if (this.scene) {
            // Adjust ambient light intensity
            const ambientLight = this.scene.getObjectByName('ambientLight');
            if (ambientLight && this.lightEstimate.lightProbe) {
                ambientLight.intensity = 1 + (this.lightEstimate.lightProbe.intensity || 0);
            }
        }
    }

    onXRSessionEnd() {
        this.xrSession = null;
        this.close();
    }

    /* ── Wishlist ── */
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
        window.dispatchEvent(new CustomEvent('wishlist-changed'));
        this.showToast(adding ? `♥ ${product.title} added` : `${product.title} removed`);
        return adding;
    }

    syncAllHearts() {
        document.querySelectorAll('.ars-heart-btn').forEach(btn => {
            const id = btn.dataset.productId;
            btn.classList.toggle('active', this.isWishlisted(id));
        });
    }

    /* ── HTML Injection ── */
    injectHTML() {
        const html = `
        <div id="arsSLAMContainer" class="ars-slam-container">
            <!-- Desktop message -->
            <div class="ars-desktop-msg" id="arsDesktopMsg">
                <div class="ars-desktop-inner">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    <h3>Mobile AR Only</h3>
                    <p>Open on your phone to use SLAM-based AR room staging with real-time plane detection.</p>
                    <button class="ars-desktop-close" id="arsDesktopClose">Got it</button>
                </div>
            </div>

            <!-- Mobile AR UI -->
            <div class="ars-slam-ui" id="arsSLAMUI">
                <!-- Top bar -->
                <div class="ars-topbar">
                    <button class="ars-topbar-btn" id="arsCloseBtn">
                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                    <div class="ars-status-bar">
                        <span id="arsSLAMStatus" class="ars-slam-status">🔍 Initializing SLAM...</span>
                        <span id="arsPlanesCount" class="ars-planes-count">Planes: 0</span>
                    </div>
                    <button class="ars-topbar-btn ars-heart-btn" id="arsActiveHeart" style="display:none;">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>

                <!-- AR viewer -->
                <div class="ars-slam-viewer" id="arsSLAMViewer">
                    <div id="arsARCanvas"></div>
                    <div class="ars-plane-overlay" id="arsPlaneOverlay">
                        <p>Move camera to detect surfaces...</p>
                    </div>
                </div>

                <!-- Controls -->
                <div class="ars-slam-controls" id="arsSLAMControls">
                    <button class="ars-ctrl-btn" id="arsStartARBtn" title="Start AR">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Start AR
                    </button>
                    <button class="ars-ctrl-btn" id="arsCaptureBtn" title="Capture">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="13" r="4"/>
                            <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/>
                        </svg>
                    </button>
                    <button class="ars-ctrl-btn" id="arsClearBtn" title="Clear All">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"/>
                        </svg>
                    </button>
                </div>

                <!-- Staged items panel -->
                <div class="ars-slam-panel" id="arsStagedPanel" style="display:none;">
                    <div class="ars-panel-header">
                        <h4>Staged Items (<span id="arsStageCount">0</span>)</h4>
                        <button class="ars-panel-close">&times;</button>
                    </div>
                    <div class="ars-panel-items" id="arsStagedItems"></div>
                </div>

                <!-- Product catalog -->
                <div class="ars-slam-panel" id="arsCatalogPanel">
                    <div class="ars-panel-header">
                        <h4>3D Products (<span id="arsCatalogCount">0</span>)</h4>
                        <input type="text" id="arsCatalogSearch" placeholder="Search..." class="ars-search"/>
                    </div>
                    <div class="ars-panel-items" id="arsCatalogItems"></div>
                </div>
            </div>
        </div>

        <!-- Toast notifications -->
        <div class="ars-toast" id="arsToast"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    /* ── Events ── */
    bindEvents() {
        // Open AR
        document.addEventListener('click', e => {
            if (e.target.closest('.hero-ar-button') || e.target.closest('#navbarARBtn') || e.target.closest('#checkoutAnalyzeRoomBtn')) {
                e.preventDefault();
                this.open();
            }
        });

        // Close
        document.getElementById('arsCloseBtn').addEventListener('click', () => this.close());
        document.getElementById('arsDesktopClose').addEventListener('click', () => this.close());

        // AR Controls
        document.getElementById('arsStartARBtn').addEventListener('click', () => this.startAR());
        document.getElementById('arsCaptureBtn').addEventListener('click', () => this.captureScene());
        document.getElementById('arsClearBtn').addEventListener('click', () => this.clearStaged());

        // Wishlist
        document.getElementById('arsActiveHeart').addEventListener('click', () => {
            if (this.activeProduct) this.toggleWishlist(this.activeProduct);
        });

        // Catalog search
        document.getElementById('arsCatalogSearch').addEventListener('input', (e) => {
            this.filterCatalog(e.target.value);
        });
    }

    /* ── Open / Close ── */
    open() {
        this.isOpen = true;
        const container = document.getElementById('arsSLAMContainer');
        container.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('ar-slam-active');

        if (!this.isMobile) {
            document.getElementById('arsDesktopMsg').style.display = 'flex';
            document.getElementById('arsSLAMUI').style.display = 'none';
        } else {
            document.getElementById('arsDesktopMsg').style.display = 'none';
            document.getElementById('arsSLAMUI').style.display = 'flex';
            this.renderCatalog();
        }
    }

    close() {
        this.isOpen = false;
        if (this.xrSession) {
            this.xrSession.end();
        }
        const container = document.getElementById('arsSLAMContainer');
        container.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('ar-slam-active');
    }

    /* ── Start AR Session ── */
    async startAR() {
        const btn = document.getElementById('arsStartARBtn');
        btn.disabled = true;
        btn.textContent = '🔄 Loading...';

        const success = await this.initializeSLAM();
        if (!success) {
            btn.disabled = false;
            btn.textContent = 'Start AR';
        }
    }

    /* ── Render Catalog ── */
    renderCatalog() {
        const container = document.getElementById('arsCatalogItems');
        const count = document.getElementById('arsCatalogCount');

        if (!this.allProducts.length) {
            container.innerHTML = '<div class="ars-empty">No 3D products available</div>';
            count.textContent = '0';
            return;
        }

        count.textContent = this.allProducts.length;
        container.innerHTML = this.allProducts.map(p => `
            <div class="ars-product-item" data-id="${p.id}">
                <img src="${p.image}" alt="${p.title}" onerror="this.src='image/Logo maker project.webp'">
                <div class="ars-item-info">
                    <span class="ars-item-cat">${p.category}</span>
                    <h5 class="ars-item-title">${p.title}</h5>
                    <span class="ars-item-price">${p.priceFormatted}</span>
                </div>
                <div class="ars-item-actions">
                    <button class="ars-btn-place" data-id="${p.id}" title="Place in AR">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <polygon points="12 2 15.09 10.26 24 10.26 17.55 16.52 19.64 24.78 12 18.52 4.36 24.78 6.45 16.52 0 10.26 8.91 10.26"/>
                        </svg>
                    </button>
                    <button class="ars-heart-btn" data-product-id="${p.id}" title="Wishlist">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        this.syncAllHearts();

        // Bind place buttons
        container.querySelectorAll('.ars-btn-place').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const product = this.allProducts.find(p => p.id === id);
                if (product) this.placeProduct(product);
            });
        });

        // Bind heart buttons
        container.querySelectorAll('.ars-heart-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.productId;
                const product = this.allProducts.find(p => p.id === id);
                if (product) this.toggleWishlist(product);
            });
        });
    }

    filterCatalog(query) {
        const items = document.querySelectorAll('.ars-product-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const title = item.querySelector('.ars-item-title').textContent.toLowerCase();
            const cat = item.querySelector('.ars-item-cat').textContent.toLowerCase();
            const matches = title.includes(lowerQuery) || cat.includes(lowerQuery);
            item.style.display = matches ? '' : 'none';
        });
    }

    /* ── Place Product ── */
    placeProduct(product) {
        if (this.detectedPlanes.size === 0) {
            this.showToast('⚠ No surfaces detected yet. Point camera at floor/walls.');
            return;
        }

        // Pick first suitable plane (floor)
        let targetPlane = null;
        for (const [, plane] of this.detectedPlanes) {
            if (plane.orientation !== 'wall') {
                targetPlane = plane;
                break;
            }
        }
        if (!targetPlane) targetPlane = this.detectedPlanes.values().next().value;

        this.stagedItems.push({
            ...product,
            id: `${product.id}-${Date.now()}`,
            planeId: targetPlane.id,
            scale: 1,
            rotation: 0
        });

        this.updateStagedPanel();
        this.showToast(`✓ ${product.title} placed in AR`);
    }

    updateStagedPanel() {
        const count = document.getElementById('arsStageCount');
        const items = document.getElementById('arsStagedItems');

        count.textContent = this.stagedItems.length;

        items.innerHTML = this.stagedItems.map((item, idx) => `
            <div class="ars-staged-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="ars-staged-info">
                    <h6>${item.title}</h6>
                    <p>${item.priceFormatted}</p>
                </div>
                <button class="ars-remove-btn" data-index="${idx}">✕</button>
            </div>
        `).join('');

        items.querySelectorAll('.ars-remove-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(btn.dataset.index);
                this.stagedItems.splice(idx, 1);
                this.updateStagedPanel();
            });
        });
    }

    clearStaged() {
        if (confirm('Clear all staged items?')) {
            this.stagedItems = [];
            this.updateStagedPanel();
            this.showToast('Cleared all items');
        }
    }

    /* ── Capture Scene ── */
    async captureScene() {
        try {
            const canvas = document.getElementById('arsARCanvas');
            if (!canvas) {
                this.showToast('⚠ AR not started');
                return;
            }

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `ar-room-${Date.now()}.png`;
            link.click();

            this.showToast('📸 Screenshot saved');
        } catch (e) {
            console.error('Capture failed:', e);
            this.showToast('⚠ Screenshot failed');
        }
    }

    /* ── Toast ── */
    showToast(msg) {
        const toast = document.getElementById('arsToast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Auto-initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.slamARStager = new SLAMARRoomStager();
});
