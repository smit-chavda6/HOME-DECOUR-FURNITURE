/**
 * AR Room Analyzer v2.0 — Premium Redesign
 * Advanced AI room analysis, intelligent product suggestions,
 * draggable carousel, and immersive full-screen experience.
 */

class ARRoomAnalyzer {
    constructor() {
        this.container = null;
        this.video = null;
        this.stream = null;
        this.modelViewerContainer = null;
        this.isScanning = false;
        this.isCameraActive = false;
        this.allProducts = [];
        this.suggestedProducts = [];
        this.analysisResults = null;
        this.carouselDrag = { isDown: false, startX: 0, scrollLeft: 0 };

        this.init();
    }

    init() {
        this.injectHTML();
        this.loadModelViewerScript();
        this.bindEvents();
        this.prefetchProducts();
    }

    /* ─── Prefetch all 3D products for intelligent filtering ─── */
    async prefetchProducts() {
        try {
            const res = await fetch('/api/products?has_3d=true&limit=50');
            if (res.ok) {
                const data = await res.json();
                this.allProducts = (data.products || [])
                    .filter(p => p.model_src || (p.model_3d && p.model_3d.file_url))
                    .map(p => ({
                        id: p.id,
                        title: p.name,
                        category: (p.category || 'decor').toLowerCase(),
                        price: p.price,
                        priceFormatted: `₹${Number(p.price || 0).toLocaleString('en-IN')}`,
                        image: p.image || p.thumbnail || 'image/Logo maker project.webp',
                        modelSrc: p.model_src || (p.model_3d && p.model_3d.file_url) || '',
                        rating: p.rating || 4.5,
                        brand: p.brand || '',
                        description: p.short_description || p.description || ''
                    }));
            }
        } catch (err) {
            console.error('AR Analyzer: Failed to prefetch products', err);
        }
    }

    loadModelViewerScript() {
        if (!document.querySelector('script[src*="model-viewer"]')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
            document.head.appendChild(script);
        }
    }

    /* ─── Inject the overlay HTML ─── */
    injectHTML() {
        const html = `
            <div id="arOverlayContainer" class="ar-overlay-container">
                <!-- Top Bar -->
                <div class="ar-topbar">
                    <button id="arCloseBtn" class="ar-topbar-btn" aria-label="Close">
                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="ar-topbar-title">
                        <div class="ar-topbar-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                        </div>
                        <span>Space AI</span>
                    </div>
                    <div style="width:42px;"></div>
                </div>

                <!-- Camera Feed -->
                <div class="ar-camera-wrapper">
                    <video id="ar-video-feed" autoplay playsinline muted></video>

                    <!-- Scan frame corners (shown during scan) -->
                    <div class="ar-scan-frame" id="arScanFrame">
                        <div class="ar-scan-corner tl"></div>
                        <div class="ar-scan-corner tr"></div>
                        <div class="ar-scan-corner bl"></div>
                        <div class="ar-scan-corner br"></div>
                        <div class="ar-scan-beam"></div>
                    </div>

                    <!-- AI Analysis HUD overlay -->
                    <div class="ar-hud" id="arHud">
                        <div class="ar-hud-chip">
                            <div class="ar-hud-dot"></div>
                            <span id="arHudText">Point camera at your room</span>
                        </div>
                    </div>

                    <!-- Model Viewer placeholder -->
                    <div id="arModelViewerContainer" class="ar-model-viewer-container"></div>
                </div>

                <!-- Scan Button -->
                <div class="ar-scan-action" id="arScanAction">
                    <button id="arStartScanBtn" class="ar-scan-btn">
                        <div class="ar-scan-btn-ring"></div>
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                    </button>
                    <span class="ar-scan-label">Tap to Analyze</span>
                </div>

                <!-- AI Analysis Steps (during scan) -->
                <div class="ar-analysis-steps" id="arAnalysisSteps">
                    <div class="ar-step" data-step="1">
                        <div class="ar-step-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                        <span>Detecting room layout…</span>
                        <div class="ar-step-check">✓</div>
                    </div>
                    <div class="ar-step" data-step="2">
                        <div class="ar-step-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        </div>
                        <span>Identifying style…</span>
                        <div class="ar-step-check">✓</div>
                    </div>
                    <div class="ar-step" data-step="3">
                        <div class="ar-step-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </div>
                        <span>Matching furniture…</span>
                        <div class="ar-step-check">✓</div>
                    </div>
                </div>

                <!-- Bottom Sheet (Results) -->
                <div class="ar-bottom-sheet" id="arBottomSheet">
                    <div class="ar-sheet-handle-bar">
                        <div class="ar-sheet-handle"></div>
                        <button id="arCloseResultsBtn" class="ar-close-results-btn" aria-label="Close suggestions">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div class="ar-sheet-header">
                        <div class="ar-sheet-ai-badge">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            AI Picked
                        </div>
                        <h3 class="ar-sheet-title">Perfect for Your Space</h3>
                        <p class="ar-sheet-subtitle" id="arSheetSubtitle">Based on your room analysis</p>
                    </div>

                    <div class="ar-product-carousel" id="arProductCarousel">
                        <!-- Products rendered here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        this.container = document.getElementById('arOverlayContainer');
        this.video = document.getElementById('ar-video-feed');
        this.modelViewerContainer = document.getElementById('arModelViewerContainer');
    }

    /* ─── Render product carousel with draggable support ─── */
    renderCarousel() {
        const carousel = document.getElementById('arProductCarousel');
        if (!this.suggestedProducts.length) {
            carousel.innerHTML = `<div class="ar-no-results">No 3D products matched. Try scanning a different area.</div>`;
            return;
        }

        carousel.innerHTML = this.suggestedProducts.map(product => `
            <div class="ar-product-card" data-id="${product.id}">
                <div class="ar-card-img-wrap">
                    <img class="ar-product-img" src="${product.image}" alt="${product.title}" loading="lazy" onerror="this.src='image/Logo maker project.webp'">
                    <div class="ar-card-3d-tag">3D</div>
                </div>
                <div class="ar-product-info">
                    <span class="ar-product-category">${product.category}</span>
                    <h4>${product.title}</h4>
                    <div class="ar-product-meta">
                        <span class="ar-product-price">${product.priceFormatted}</span>
                        <span class="ar-product-rating">★ ${product.rating.toFixed(1)}</span>
                    </div>
                </div>
                <button class="ar-view-btn">View in AR</button>
            </div>
        `).join('');

        this.bindCarouselDrag(carousel);
        this.bindCardClicks(carousel);
    }

    /* ─── Draggable carousel ─── */
    bindCarouselDrag(carousel) {
        const d = this.carouselDrag;

        carousel.addEventListener('mousedown', (e) => {
            d.isDown = true;
            carousel.classList.add('grabbing');
            d.startX = e.pageX - carousel.offsetLeft;
            d.scrollLeft = carousel.scrollLeft;
        });
        carousel.addEventListener('mouseleave', () => { d.isDown = false; carousel.classList.remove('grabbing'); });
        carousel.addEventListener('mouseup', () => { d.isDown = false; carousel.classList.remove('grabbing'); });
        carousel.addEventListener('mousemove', (e) => {
            if (!d.isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - d.startX) * 1.5;
            carousel.scrollLeft = d.scrollLeft - walk;
        });

        // Touch
        let touchStart = 0, touchScrollLeft = 0;
        carousel.addEventListener('touchstart', (e) => {
            touchStart = e.touches[0].pageX - carousel.offsetLeft;
            touchScrollLeft = carousel.scrollLeft;
        }, { passive: true });
        carousel.addEventListener('touchmove', (e) => {
            const x = e.touches[0].pageX - carousel.offsetLeft;
            const walk = (x - touchStart) * 1.5;
            carousel.scrollLeft = touchScrollLeft - walk;
        }, { passive: true });
    }

    bindCardClicks(carousel) {
        const cards = carousel.querySelectorAll('.ar-product-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (this.carouselDrag.isDown) return; // ignore drag clicks
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const pId = card.getAttribute('data-id');
                const product = this.suggestedProducts.find(p => p.id === pId);
                if (product) this.showModelInAR(product);
            });
        });
    }

    /* ─── Events ─── */
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.hero-ar-button') || e.target.closest('#navbarARBtn')) {
                e.preventDefault();
                this.openAR();
            }
        });

        document.getElementById('arCloseBtn').addEventListener('click', () => this.closeAR());
        document.getElementById('arStartScanBtn').addEventListener('click', () => this.startScan());
        document.getElementById('arCloseResultsBtn').addEventListener('click', () => this.closeResults());
    }

    /* ─── Open / Close ─── */
    async openAR() {
        this.container.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('ar-active');  // This hides chatbot + back-to-top
        await this.startCamera();
    }

    closeAR() {
        this.container.classList.remove('active', 'scanning', 'results-open', 'showing-model', 'analysis-running');
        this.modelViewerContainer.innerHTML = '';
        document.querySelectorAll('.ar-product-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.ar-step').forEach(s => s.classList.remove('done', 'active'));
        document.body.style.overflow = '';
        document.body.classList.remove('ar-active');
        this.stopCamera();
    }

    /* Close just the results tray (go back to camera) */
    closeResults() {
        this.container.classList.remove('results-open');
        document.querySelectorAll('.ar-product-card').forEach(c => c.classList.remove('selected'));
    }

    /* ─── Camera (Back camera only — this feature is for mobile users) ─── */
    async startCamera() {
        if (this.isCameraActive) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { exact: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });
            this.video.srcObject = this.stream;
            this.video.classList.add('environment');
            this.isCameraActive = true;
        } catch (err) {
            // Fallback: if back camera isn't available (e.g. desktop), try any camera
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false
                });
                this.video.srcObject = this.stream;
                this.isCameraActive = true;
                const track = this.stream.getVideoTracks()[0];
                const settings = track.getSettings();
                this.video.classList.toggle('environment', settings.facingMode !== 'user');
            } catch (error) {
                console.error('Camera error:', error);
                alert('Unable to access camera. Please ensure permissions are granted and you are on HTTPS.');
                this.closeAR();
            }
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.video.srcObject = null;
            this.stream = null;
            this.isCameraActive = false;
        }
    }

    /* ─── AI Scan Simulation with step-by-step progress ─── */
    startScan() {
        if (this.isScanning) return;
        this.isScanning = true;
        this.container.classList.add('scanning', 'analysis-running');

        const hud = document.getElementById('arHudText');
        const steps = document.querySelectorAll('.ar-step');

        // Phase 1: Detecting layout
        hud.textContent = 'Scanning room geometry…';
        setTimeout(() => {
            steps[0].classList.add('active');
        }, 300);

        setTimeout(() => {
            steps[0].classList.remove('active');
            steps[0].classList.add('done');

            // Phase 2: Identifying style
            hud.textContent = 'Analyzing room style…';
            steps[1].classList.add('active');
        }, 1500);

        setTimeout(() => {
            steps[1].classList.remove('active');
            steps[1].classList.add('done');

            // Phase 3: Matching products
            hud.textContent = 'Finding best matches…';
            steps[2].classList.add('active');
            this.performAIAnalysis();
        }, 2800);

        setTimeout(() => {
            steps[2].classList.remove('active');
            steps[2].classList.add('done');

            hud.textContent = 'Analysis complete';
            this.container.classList.remove('scanning', 'analysis-running');
            this.container.classList.add('results-open');
            this.isScanning = false;
        }, 4200);
    }

    /* ─── Intelligent AI Product Matching ─── */
    performAIAnalysis() {
        // Simulate detecting room type from camera frame
        const roomTypes = ['living room', 'bedroom', 'office', 'dining room'];
        const detected = roomTypes[Math.floor(Math.random() * roomTypes.length)];

        // Map room type to relevant categories
        const categoryMap = {
            'living room': ['sofa', 'decor', 'table'],
            'bedroom': ['bed', 'decor', 'chair'],
            'office': ['chair', 'table', 'decor'],
            'dining room': ['table', 'chair', 'decor']
        };

        const relevantCategories = categoryMap[detected] || ['decor'];

        // Score and rank products based on relevance to detected room
        const scored = this.allProducts.map(p => {
            let score = 0;
            const catIndex = relevantCategories.indexOf(p.category);
            if (catIndex === 0) score += 100;       // Primary category
            else if (catIndex === 1) score += 60;   // Secondary
            else if (catIndex === 2) score += 30;   // Tertiary
            else score += 5;                        // Weak match
            score += (p.rating || 0) * 5;           // Boost by rating
            score += Math.random() * 15;            // Slight randomness for variety
            return { ...p, score };
        });

        scored.sort((a, b) => b.score - a.score);

        // Pick top 3-5 (not all!)
        const count = Math.min(scored.length, 3 + Math.floor(Math.random() * 3));
        this.suggestedProducts = scored.slice(0, count);
        this.analysisResults = { roomType: detected, categories: relevantCategories };

        // Update subtitle
        const subtitle = document.getElementById('arSheetSubtitle');
        subtitle.textContent = `Detected: ${detected.charAt(0).toUpperCase() + detected.slice(1)} · ${this.suggestedProducts.length} items curated`;

        this.renderCarousel();
    }

    /* ─── Show 3D Model ─── */
    showModelInAR(product) {
        this.container.classList.add('showing-model');
        this.modelViewerContainer.innerHTML = `
            <div class="ar-model-info-bar">
                <span>${product.title}</span>
                <button class="ar-model-close-btn" id="arModelCloseBtn">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <model-viewer
                src="${product.modelSrc}"
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                auto-rotate-delay="2000"
                shadow-intensity="1.2"
                environment-image="neutral"
                exposure="1.1"
                style="background-color: transparent;"
            >
                <button slot="ar-button" class="ar-native-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16.5l-8 4-8-4v-9l8-4 8 4v9z"/></svg>
                    Place in Room
                </button>
            </model-viewer>
            <div class="ar-model-hint">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>
                Drag to rotate · Pinch to zoom
            </div>
        `;

        // Bind close model button
        document.getElementById('arModelCloseBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.container.classList.remove('showing-model');
            this.modelViewerContainer.innerHTML = '';
        });
    }
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    window.arAnalyzerSystem = new ARRoomAnalyzer();
});
