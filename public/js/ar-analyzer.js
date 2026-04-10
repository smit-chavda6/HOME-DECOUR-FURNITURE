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
        this.analysisTimer = null;
        this.analysisIntervalMs = 500;
        this.captureCanvas = null;
        this.captureContext = null;
        this.visionReady = false;
        this.cocoModel = null;
        this.flashEnabled = false;
        this.lastRoomHint = 'living room';
        this.lastLightLabel = 'Balanced';
        this.lastPlacementHint = 'Center of the room';
        this.carouselDrag = { isDown: false, startX: 0, scrollLeft: 0 };

        this.init();
    }

    init() {
        this.injectHTML();
        this.loadModelViewerScript();
        this.loadVisionScripts();
        this.bindEvents();
        this.prefetchProducts();
    }

    /* ─── Prefetch all 3D products for intelligent filtering ─── */
    async prefetchProducts() {
        try {
            const res = await fetch('/api/products?limit=100', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                this.allProducts = (data.products || []).map(p => ({
                    id: p.id,
                    title: p.name,
                    category: (p.category || 'decor').toLowerCase(),
                    price: p.price,
                    priceFormatted: `₹${Number(p.price || 0).toLocaleString('en-IN')}`,
                    image: p.image || p.thumbnail || 'image/Logo maker project.webp',
                    modelSrc: p.model_src || (p.model_3d && p.model_3d.file_url) || '',
                    url: `product-details.html?id=${encodeURIComponent(p.id)}`,
                    rating: p.rating || 4.5,
                    brand: p.brand || '',
                    description: p.short_description || p.description || '',
                    colorHint: this.extractColorHint(p),
                    isThreeD: !!(p.is_3d || (p.model_3d && p.model_3d.enabled))
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

    loadVisionScripts() {
        const ensureScript = (src, type) => new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                if (type === 'module') existing.type = 'module';
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            if (type) script.type = type;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });

        this.visionReady = false;
        this.visionScriptsPromise = ensureScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js')
            .then(() => ensureScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js'))
            .then(() => {
            this.visionReady = true;
            return true;
            }).catch((err) => {
                console.warn('AR Analyzer: vision scripts failed to load', err);
                return false;
            });
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
                    <canvas id="ar-capture-canvas" class="ar-capture-canvas" aria-hidden="true"></canvas>

                    <div class="ar-detection-overlay" id="arDetectionOverlay" aria-hidden="true"></div>

                    <div class="ar-live-status" id="arLiveStatus">
                        <span class="ar-live-pill">Live</span>
                        <span id="arStatusText">Tap Analyze My Room to start the camera.</span>
                    </div>

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

                    <div class="ar-floating-controls">
                        <button type="button" class="ar-fab primary" id="arStartScanBtn" aria-label="Analyze room">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="8"></circle>
                                <path d="M12 8v8M8 12h8"></path>
                            </svg>
                        </button>
                        <button type="button" class="ar-fab" id="arResetBtn" aria-label="Reset analysis">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 .49-8.9L1 10"></path>
                            </svg>
                        </button>
                        <button type="button" class="ar-fab" id="arFlashBtn" aria-label="Toggle flash">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Capture Button -->
                <div class="ar-scan-action" id="arScanAction">
                    <button id="arAnalyzeBtn" class="ar-scan-btn">
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
                        <div class="ar-sheet-meta" id="arSheetMeta"></div>
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
            carousel.innerHTML = `<div class="ar-no-results">No products matched yet. Try a different angle or reset the scene.</div>`;
            return;
        }

        carousel.innerHTML = this.suggestedProducts.map(product => `
            <div class="ar-product-card" data-id="${product.id}">
                <div class="ar-card-img-wrap">
                    <img class="ar-product-img" src="${product.image}" alt="${product.title}" loading="lazy" onerror="this.src='image/Logo maker project.webp'">
                    ${product.isThreeD ? '<div class="ar-card-3d-tag">3D</div>' : ''}
                    ${product.bestFit ? '<div class="ar-card-best-fit">Best Fit</div>' : ''}
                </div>
                <div class="ar-product-info">
                    <span class="ar-product-category">${product.category}</span>
                    <h4>${product.title}</h4>
                    <div class="ar-product-meta">
                        <span class="ar-product-price">${product.priceFormatted}</span>
                        <span class="ar-product-rating">★ ${product.rating.toFixed(1)}</span>
                    </div>
                    <p class="ar-product-reason">${product.rationale || 'Recommended for your room'}</p>
                </div>
                <button class="ar-view-btn">Try in Room</button>
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
                if (product) {
                    if (product.modelSrc) this.showModelInAR(product);
                    else window.open(product.url, '_blank', 'noopener');
                }
            });
        });
    }

    /* ─── Events ─── */
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.hero-ar-button') || e.target.closest('#navbarARBtn') || e.target.closest('#checkoutAnalyzeRoomBtn')) {
                e.preventDefault();
                this.openAR();
            }
        });

        document.getElementById('arCloseBtn').addEventListener('click', () => this.closeAR());
        document.getElementById('arStartScanBtn').addEventListener('click', () => this.startLiveAnalysis());
        document.getElementById('arAnalyzeBtn').addEventListener('click', () => this.startLiveAnalysis());
        document.getElementById('arResetBtn').addEventListener('click', () => this.resetScene());
        document.getElementById('arFlashBtn').addEventListener('click', () => this.toggleFlash());
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
        this.container.classList.remove('active', 'scanning', 'results-open', 'showing-model', 'analysis-running', 'camera-ready');
        this.modelViewerContainer.innerHTML = '';
        document.querySelectorAll('.ar-product-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.ar-step').forEach(s => s.classList.remove('done', 'active'));
        document.body.style.overflow = '';
        document.body.classList.remove('ar-active');
        this.stopAnalysisLoop();
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
            this.container.classList.add('camera-ready');
            this.setStatus('Camera live. Move slowly around the room.');
            this.startLiveAnalysis();
        } catch (err) {
            // Fallback: if back camera isn't available (e.g. desktop), try any camera
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false
                });
                this.video.srcObject = this.stream;
                this.isCameraActive = true;
                this.container.classList.add('camera-ready');
                const track = this.stream.getVideoTracks()[0];
                const settings = track.getSettings();
                this.video.classList.toggle('environment', settings.facingMode !== 'user');
                this.setStatus('Camera live. Move slowly around the room.');
                this.startLiveAnalysis();
            } catch (error) {
                console.error('Camera error:', error);
                this.setStatus('Camera permission denied. Retry to continue.');
                this.showCameraError();
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

    stopAnalysisLoop() {
        if (this.analysisTimer) {
            clearInterval(this.analysisTimer);
            this.analysisTimer = null;
        }
        this.isScanning = false;
    }

    /* ─── Live AI Room Analysis ─── */
    async startLiveAnalysis() {
        if (!this.isCameraActive) {
            await this.openAR();
            return;
        }
        if (!this.isCameraActive || this.isScanning) return;
        this.isScanning = true;
        this.container.classList.add('scanning', 'analysis-running');
        this.setStatus('Analyzing room in real time...');

        const ready = await this.visionScriptsPromise;
        if (!ready || !window.cocoSsd) {
            this.setStatus('Live AI unavailable. Showing smart catalog suggestions instead.');
            this.isScanning = false;
            this.runFallbackAnalysis();
            return;
        }

        if (!this.cocoModel) {
            try {
                this.setStatus('Loading AI model...');
                if (window.tf?.ready) {
                    await window.tf.ready();
                }
                this.cocoModel = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
            } catch (error) {
                console.warn('AR Analyzer: coco-ssd failed to load', error);
                this.setStatus('AI model load failed. Using fallback analysis.');
                this.isScanning = false;
                this.runFallbackAnalysis();
                return;
            }
        }

        this.stopAnalysisLoop();
        const tick = async () => {
            if (!this.isCameraActive || !this.video || this.video.readyState < 2) return;
            try {
                const analysis = await this.analyzeCurrentFrame();
                if (analysis) this.applyAnalysis(analysis);
            } catch (error) {
                console.warn('AR Analyzer: frame analysis failed', error);
            }
        };

        await tick();
        this.analysisTimer = window.setInterval(tick, this.analysisIntervalMs);
    }

    async analyzeCurrentFrame() {
        const video = this.video;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        if (!this.captureCanvas) {
            this.captureCanvas = document.getElementById('ar-capture-canvas') || document.createElement('canvas');
            this.captureContext = this.captureCanvas.getContext('2d', { willReadFrequently: true });
        }

        const canvas = this.captureCanvas;
        const ctx = this.captureContext;
        const maxWidth = 480;
        const scale = Math.min(1, maxWidth / width);
        canvas.width = Math.max(160, Math.round(width * scale));
        canvas.height = Math.max(120, Math.round(height * scale));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const colorStats = this.getColorStats(imageData);

        let detections = [];
        try {
            detections = await this.cocoModel.detect(canvas);
        } catch (error) {
            console.warn('AR Analyzer: detection error', error);
        }

        return this.buildAnalysis(detections, { width: canvas.width, height: canvas.height, colorStats });
    }

    buildAnalysis(detections, frame) {
        const normalized = (detections || []).filter(det => det.score >= 0.45);
        const counts = normalized.reduce((acc, det) => {
            const label = String(det.class || '').toLowerCase();
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});

        const roomType = this.deriveRoomType(counts);
        const occupiedRatio = normalized.reduce((sum, det) => {
            const [x, y, w, h] = det.bbox || [0, 0, 0, 0];
            return sum + ((w * h) / Math.max(1, frame.width * frame.height));
        }, 0);

        const lightLabel = frame.colorStats.luminance < 82 ? 'Low light' : frame.colorStats.luminance > 170 ? 'Bright' : 'Balanced';
        const spaceLabel = occupiedRatio > 0.34 ? 'Compact' : occupiedRatio > 0.2 ? 'Moderate' : 'Open';
        const placementHint = this.getPlacementHint(roomType, normalized, frame);
        const palette = frame.colorStats.palette;
        const products = this.rankProducts(roomType, palette, placementHint, normalized);

        return {
            roomType,
            lightLabel,
            spaceLabel,
            placementHint,
            palette,
            detections: normalized,
            products
        };
    }

    deriveRoomType(counts) {
        const labels = Object.keys(counts);
        const has = (name) => labels.includes(name);
        if (has('bed') || has('pillow') || has('blanket')) return 'bedroom';
        if (has('couch') || has('sofa') || has('tv') || has('television')) return 'living room';
        if (has('dining table') || (has('chair') && (counts.chair || 0) >= 2)) return 'dining room';
        if (has('laptop') || has('keyboard') || has('mouse') || has('desk') || has('chair')) return 'office';
        if (has('sink') || has('toilet') || has('refrigerator')) return 'utility room';
        return 'living room';
    }

    getPlacementHint(roomType, detections, frame) {
        const leftLoad = detections.filter(d => (d.bbox?.[0] || 0) < frame.width * 0.4).length;
        const rightLoad = detections.filter(d => (d.bbox?.[0] || 0) > frame.width * 0.6).length;
        const topLoad = detections.filter(d => (d.bbox?.[1] || 0) < frame.height * 0.35).length;
        const openSide = Math.min(leftLoad, rightLoad) === leftLoad ? 'left wall' : 'right wall';
        if (roomType === 'bedroom') return `Best fit: ${openSide}, away from the door path`;
        if (roomType === 'office') return `Best fit: near the brightest wall and power source`;
        if (roomType === 'dining room') return `Best fit: center zone with clear chair pull-out space`;
        if (roomType === 'living room') return `Best fit: ${openSide}, leaving a clear walkway`;
        return topLoad < 2 ? 'Best fit: open wall segment' : 'Best fit: a clear corner zone';
    }

    getColorStats(data) {
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 16) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count += 1;
        }
        const avgR = count ? r / count : 0;
        const avgG = count ? g / count : 0;
        const avgB = count ? b / count : 0;
        const luminance = Math.round((0.2126 * avgR) + (0.7152 * avgG) + (0.0722 * avgB));
        const palette = luminance > 165 ? 'warm-neutral' : avgB > avgR ? 'cool-neutral' : 'earth-tone';
        return { luminance, palette };
    }

    extractColorHint(product) {
        const text = `${product.name || ''} ${product.short_description || ''} ${product.description || ''}`.toLowerCase();
        if (/(white|ivory|cream|beige|oak|natural|linen|sand)/.test(text)) return 'warm-neutral';
        if (/(grey|gray|graphite|charcoal|black|navy|blue|steel)/.test(text)) return 'cool-neutral';
        if (/(walnut|brown|tan|rust|terracotta|mustard|amber)/.test(text)) return 'earth-tone';
        return 'neutral';
    }

    rankProducts(roomType, palette, placementHint, detections) {
        const roomCategoryMap = {
            'bedroom': ['bed', 'nightstand', 'chair', 'storage'],
            'living room': ['sofa', 'chair', 'table', 'decor'],
            'office': ['chair', 'table', 'storage', 'lighting'],
            'dining room': ['table', 'chair', 'decor'],
            'utility room': ['storage', 'chair', 'decor']
        };
        const targetCategories = roomCategoryMap[roomType] || ['decor'];
        const roomNeed = detections.length > 6 ? 'small' : detections.length > 2 ? 'medium' : 'large';

        const scored = this.allProducts.map((product) => {
            let score = 0;
            const category = String(product.category || '').toLowerCase();
            const categoryIndex = targetCategories.findIndex(item => category.includes(item));
            if (categoryIndex === 0) score += 110;
            else if (categoryIndex === 1) score += 75;
            else if (categoryIndex === 2) score += 55;
            else if (categoryIndex >= 0) score += 35;

            if (String(product.colorHint || '').includes(palette)) score += 18;
            if (roomNeed === 'small' && /compact|small|nest|slim|mini/.test(`${product.title} ${product.description}`.toLowerCase())) score += 20;
            if (roomNeed === 'large' && /sectional|large|king|dining|long/.test(`${product.title} ${product.description}`.toLowerCase())) score += 16;
            score += (Number(product.rating) || 0) * 6;
            score += Math.max(0, 14 - (Number(product.price) || 0) / 20000);
            score += product.isThreeD ? 12 : 0;
            score += Math.random() * 5;
            return { ...product, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const count = Math.min(6, scored.length);
        this.suggestedProducts = scored.slice(0, count).map((product, index) => ({
            ...product,
            bestFit: index === 0,
            rationale: this.getRecommendationReason(roomType, product, placementHint)
        }));
        return this.suggestedProducts;
    }

    getRecommendationReason(roomType, product, placementHint) {
        const category = String(product.category || '').toLowerCase();
        if (roomType === 'bedroom' && category.includes('bed')) return `${placementHint} · built for bedrooms`;
        if (roomType === 'living room' && (category.includes('sofa') || category.includes('chair'))) return `${placementHint} · visual match for lounge seating`;
        if (roomType === 'office' && (category.includes('chair') || category.includes('table'))) return `${placementHint} · productivity-friendly sizing`;
        if (roomType === 'dining room' && category.includes('table')) return `${placementHint} · balanced dining layout`;
        return `${placementHint} · versatile fit`;
    }

    applyAnalysis(analysis) {
        this.analysisResults = analysis;
        this.lastRoomHint = analysis.roomType;
        this.lastLightLabel = analysis.lightLabel;
        this.lastPlacementHint = analysis.placementHint;

        this.renderDetections(analysis.detections);
        this.renderLiveSummary(analysis);
        this.renderCarousel();

        if (analysis.lightLabel === 'Low light') {
            this.setStatus('Low light detected. Turn on a lamp for better accuracy.');
        } else {
            this.setStatus(`Detected ${analysis.roomType} · ${analysis.spaceLabel} space · ${analysis.detections.length} objects`);
        }

        this.container.classList.add('results-open');
        this.container.classList.remove('scanning');
    }

    renderDetections(detections) {
        const overlay = document.getElementById('arDetectionOverlay');
        if (!overlay) return;
        overlay.innerHTML = detections.slice(0, 8).map((det) => {
            const [x, y, width, height] = det.bbox || [0, 0, 0, 0];
            const label = String(det.class || 'object').replace(/\b\w/g, c => c.toUpperCase());
            const confidence = Math.round((det.score || 0) * 100);
            return `<div class="ar-detection-box" style="left:${(x / this.captureCanvas.width) * 100}%; top:${(y / this.captureCanvas.height) * 100}%; width:${(width / this.captureCanvas.width) * 100}%; height:${(height / this.captureCanvas.height) * 100}%">
                <span>${label} ${confidence}%</span>
            </div>`;
        }).join('');
    }

    renderLiveSummary(analysis) {
        const subtitle = document.getElementById('arSheetSubtitle');
        const meta = document.getElementById('arSheetMeta');
        if (subtitle) {
            subtitle.textContent = `Detected ${analysis.roomType} · ${analysis.spaceLabel} space · ${analysis.lightLabel}`;
        }
        if (meta) {
            meta.innerHTML = `
                <span class="ar-meta-chip">Space: ${analysis.spaceLabel}</span>
                <span class="ar-meta-chip">Palette: ${analysis.palette}</span>
                <span class="ar-meta-chip">Placement: ${analysis.placementHint}</span>
            `;
        }
    }

    runFallbackAnalysis() {
        const roomType = this.lastRoomHint || 'living room';
        const palette = 'warm-neutral';
        const placementHint = this.lastPlacementHint || 'Center of the room';
        this.suggestedProducts = this.rankProducts(roomType, palette, placementHint, []);
        this.analysisResults = {
            roomType,
            lightLabel: 'Balanced',
            spaceLabel: 'Open',
            placementHint,
            palette,
            detections: [],
            products: this.suggestedProducts
        };
        this.renderLiveSummary(this.analysisResults);
        this.renderCarousel();
    }

    resetScene() {
        this.stopAnalysisLoop();
        this.container.classList.remove('results-open', 'scanning', 'analysis-running', 'showing-model');
        document.getElementById('arDetectionOverlay').innerHTML = '';
        document.getElementById('arSheetSubtitle').textContent = 'Based on your room analysis';
        document.getElementById('arSheetMeta').innerHTML = '';
        document.getElementById('arHudText').textContent = 'Point the camera at your room';
        if (this.isCameraActive) {
            this.startLiveAnalysis();
        }
        if (navigator.vibrate) navigator.vibrate(20);
    }

    toggleFlash() {
        this.flashEnabled = !this.flashEnabled;
        const track = this.stream?.getVideoTracks?.()[0];
        const capabilities = track?.getCapabilities?.() || {};
        if (track && capabilities.torch) {
            track.applyConstraints({ advanced: [{ torch: this.flashEnabled }] }).catch(() => {});
        }
        const button = document.getElementById('arFlashBtn');
        if (button) button.classList.toggle('active', this.flashEnabled);
        this.setStatus(this.flashEnabled ? 'Flash enabled' : 'Flash off');
        if (navigator.vibrate) navigator.vibrate(10);
    }

    setStatus(message) {
        const statusEl = document.getElementById('arStatusText');
        const hud = document.getElementById('arHud'); // Hide HUD so it doesn't overlap LIVE status
        if (statusEl) statusEl.textContent = message;
        if (hud) hud.style.display = 'none';
    }

    showCameraError() {
        const overlay = document.getElementById('arLiveStatus');
        if (overlay) overlay.classList.add('error');
        const button = document.getElementById('arAnalyzeBtn');
        if (button) {
            button.innerHTML = '<span style="font-size:12px;font-weight:700;">Retry</span>';
            button.setAttribute('aria-label', 'Retry camera access');
        }
        this.container.classList.remove('results-open');
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
