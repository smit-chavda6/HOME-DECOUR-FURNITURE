/**
 * Admin Products Management — admin-products.js
 * Complete product CRUD with tabbed form, drag-and-drop uploads,
 * search, filter, sort, pagination, and 3D model support.
 */
(function () {
    'use strict';

    // ===== State =====
    let products = [];
    let currentPage = 1;
    let totalPages = 1;
    let totalProducts = 0;
    const LIMIT = 15;
    let editingId = null;
    let confirmCallback = null;
    let galleryUrls = []; // Track gallery images for current form

    // ===== DOM Refs =====
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const productBody = $('#productBody');
    const emptyState = $('#emptyState');
    const loadingState = $('#loadingState');
    const paginationBar = $('#paginationBar');
    const paginationInfo = $('#paginationInfo');
    const paginationBtns = $('#paginationBtns');
    const productCount = $('#productCount');
    const searchInput = $('#searchInput');
    const filterCategory = $('#filterCategory');
    const sortSelect = $('#sortSelect');

    // Modal
    const productModal = $('#productModal');
    const modalTitle = $('#modalTitle');
    const productForm = $('#productForm');
    const editIdInput = $('#editId');

    // Stats
    const statTotal = $('#statTotal');
    const statActive = $('#statActive');
    const statFeatured = $('#statFeatured');
    const stat3D = $('#stat3D');

    // Toast
    const toastEl = $('#apToast');

    // Confirm
    const confirmOverlay = $('#confirmOverlay');

    // ===== Auth Check =====
    async function checkAdmin() {
        try {
            const res = await fetch('/api/admin/check', { credentials: 'same-origin' });
            if (!res.ok) {
                window.location.href = '/login.html?redirect=admin-products.html';
                return false;
            }
            return true;
        } catch {
            window.location.href = '/login.html?redirect=admin-products.html';
            return false;
        }
    }

    // ===== Toast =====
    function showToast(msg, type = 'info') {
        toastEl.textContent = msg;
        toastEl.className = 'ap-toast ' + type;
        requestAnimationFrame(() => toastEl.classList.add('visible'));
        clearTimeout(toastEl._timer);
        toastEl._timer = setTimeout(() => toastEl.classList.remove('visible'), 3500);
    }

    // ===== Confirm Dialog =====
    function showConfirm(title, message, okLabel, callback) {
        $('#confirmTitle').textContent = title;
        $('#confirmMessage').textContent = message;
        $('#confirmOk').textContent = okLabel || 'Delete';
        confirmCallback = callback;
        confirmOverlay.classList.add('visible');
    }

    $('#confirmCancel').addEventListener('click', () => confirmOverlay.classList.remove('visible'));
    $('#confirmOk').addEventListener('click', () => {
        confirmOverlay.classList.remove('visible');
        if (confirmCallback) confirmCallback();
    });

    // ===== Modal Controls =====
    function openModal(isEdit = false) {
        modalTitle.textContent = isEdit ? 'Edit Product' : 'Add New Product';
        productModal.classList.add('visible');
        // Reset to first tab
        activateTab('basic');
    }

    function closeModal() {
        productModal.classList.remove('visible');
        resetForm();
    }

    $('#modalClose').addEventListener('click', closeModal);
    $('#btnCancel').addEventListener('click', closeModal);
    productModal.addEventListener('click', e => {
        if (e.target === productModal) closeModal();
    });

    // ===== Tabs =====
    function activateTab(tabName) {
        $$('.ap-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
        $$('.ap-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tabName));
    }

    $$('.ap-tab').forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    });

    // ===== Format Price =====
    function fmtPrice(n) {
        return '₹' + Number(n || 0).toLocaleString('en-IN');
    }

    // ===== Load Products =====
    async function loadProducts() {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        productBody.innerHTML = '';

        const q = searchInput.value.trim();
        const category = filterCategory.value;
        const [sortField, sortOrder] = sortSelect.value.split('-');

        const params = new URLSearchParams({
            page: currentPage,
            limit: LIMIT,
            sort: sortField,
            order: sortOrder
        });

        if (q) params.set('q', q);
        if (category) params.set('category', category);

        try {
            const res = await fetch('/api/products?' + params.toString(), { credentials: 'same-origin' });
            const data = await res.json();

            products = data.products || [];
            const pagination = data.pagination || {};
            totalProducts = pagination.total || products.length;
            totalPages = pagination.pages || 1;
            currentPage = pagination.page || 1;

            renderProducts();
            renderPagination();
            updateStats();
        } catch (err) {
            showToast('Failed to load products', 'error');
        } finally {
            loadingState.style.display = 'none';
        }
    }

    // ===== Render Products Table =====
    function renderProducts() {
        productBody.innerHTML = '';

        if (!products.length) {
            emptyState.style.display = 'block';
            paginationBar.style.display = 'none';
            productCount.textContent = '';
            return;
        }

        emptyState.style.display = 'none';
        paginationBar.style.display = 'flex';
        productCount.textContent = `(${totalProducts})`;

        products.forEach(p => {
            const tr = document.createElement('tr');
            const thumb = p.thumbnail || p.image || '';
            const imgHtml = thumb
                ? `<img class="ap-product-thumb" src="${escHtml(thumb)}" alt="${escHtml(p.name)}" loading="lazy">`
                : `<div class="ap-product-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--ap-text-muted);">No img</div>`;

            const flags = [];
            if (p.is_featured) flags.push('<span class="ap-badge featured">Featured</span>');
            if (p.is_trending) flags.push('<span class="ap-badge trending">Trending</span>');
            if (p.is_new_arrival) flags.push('<span class="ap-badge new">New</span>');
            if (p.stock <= 0) flags.push('<span class="ap-badge out-of-stock">Out of Stock</span>');

            const has3D = p.model_3d?.enabled || p.is_3d;
            const model3D = has3D ? '<span class="ap-badge has-3d">3D</span>' : '—';

            const statusBadge = p.is_active !== false
                ? '<span class="ap-badge active">Active</span>'
                : '<span class="ap-badge inactive">Inactive</span>';

            const flagsHtml = flags.length > 0 ? `<div style="display:flex; flex-wrap:wrap; gap:6px;">${flags.join('')}</div>` : '—';

            tr.innerHTML = `
                <td>${imgHtml}</td>
                <td>
                    <div class="ap-product-name">${escHtml(p.name)}</div>
                    <div class="ap-product-sku">${escHtml(p.sku || '')}</div>
                </td>
                <td class="ap-product-sku">${escHtml(p.sku || '—')}</td>
                <td>${escHtml(capitalize(p.category || '—'))}</td>
                <td><strong>${fmtPrice(p.price)}</strong></td>
                <td>${p.stock ?? 0}</td>
                <td>${flagsHtml}</td>
                <td>${model3D}</td>
                <td>
                    <div class="ap-actions-cell" style="display:flex; gap:6px; align-items:center;">
                        <button class="ap-btn sm" title="Edit" data-edit="${p.id}">Edit</button>
                        <button class="ap-btn sm danger" title="Delete" data-delete="${p.id}" data-name="${escHtml(p.name)}">Delete</button>
                        <a class="ap-btn sm" href="/product-details.html?id=${p.id}" target="_blank" title="View">View</a>
                    </div>
                </td>
            `;
            productBody.appendChild(tr);
        });

        // Bind edit/delete buttons
        productBody.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => startEdit(btn.dataset.edit));
        });
        productBody.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                showConfirm(
                    'Delete Product',
                    `Delete "${btn.dataset.name}"? This cannot be undone.`,
                    'Delete',
                    () => deleteProduct(btn.dataset.delete)
                );
            });
        });
    }

    // ===== Pagination =====
    function renderPagination() {
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages} — ${totalProducts} products`;
        paginationBtns.innerHTML = '';

        if (totalPages <= 1) return;

        // Prev
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '←';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.addEventListener('click', () => { currentPage--; loadProducts(); });
        paginationBtns.appendChild(prevBtn);

        // Pages
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        for (let i = start; i <= end; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === currentPage) btn.className = 'active';
            btn.addEventListener('click', () => { currentPage = i; loadProducts(); });
            paginationBtns.appendChild(btn);
        }

        // Next
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '→';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.addEventListener('click', () => { currentPage++; loadProducts(); });
        paginationBtns.appendChild(nextBtn);
    }

    // ===== Stats =====
    async function updateStats() {
        try {
            const res = await fetch('/api/products?limit=1000', { credentials: 'same-origin' });
            const data = await res.json();
            const all = data.products || [];

            statTotal.textContent = all.length;
            statActive.textContent = all.filter(p => p.is_active !== false).length;
            statFeatured.textContent = all.filter(p => p.is_featured).length;
            stat3D.textContent = all.filter(p => p.model_3d?.enabled || p.is_3d).length;
        } catch { /* ignore */ }
    }

    // ===== Search / Filter / Sort =====
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { currentPage = 1; loadProducts(); }, 300);
    });

    filterCategory.addEventListener('change', () => { currentPage = 1; loadProducts(); });
    sortSelect.addEventListener('change', () => { currentPage = 1; loadProducts(); });

    // Column sort
    $$('.ap-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            const current = sortSelect.value;
            const [cf, co] = current.split('-');
            if (cf === field) {
                sortSelect.value = field + '-' + (co === 'asc' ? 'desc' : 'asc');
            } else {
                sortSelect.value = field + '-asc';
            }
            currentPage = 1;
            loadProducts();
        });
    });

    // ===== Drag & Drop Uploads =====
    function setupDropzone(dropzoneEl, inputEl, onUpload) {
        dropzoneEl.addEventListener('click', () => inputEl.click());

        dropzoneEl.addEventListener('dragover', e => {
            e.preventDefault();
            dropzoneEl.classList.add('dragover');
        });

        dropzoneEl.addEventListener('dragleave', () => {
            dropzoneEl.classList.remove('dragover');
        });

        dropzoneEl.addEventListener('drop', e => {
            e.preventDefault();
            dropzoneEl.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length) onUpload(files);
        });

        inputEl.addEventListener('change', () => {
            if (inputEl.files.length) onUpload(inputEl.files);
            inputEl.value = '';
        });
    }

    // Thumbnail Upload
    setupDropzone($('#thumbDropzone'), $('#thumbInput'), async (files) => {
        const file = files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);

        try {
            showToast('Uploading thumbnail...', 'info');
            const res = await fetch('/api/admin/upload-image', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            const data = await res.json();
            if (data.success) {
                $('#fThumbnail').value = data.url;
                $('#thumbImg').src = data.url;
                $('#thumbPreview').style.display = 'flex';
                showToast('Thumbnail uploaded!', 'success');
            } else {
                showToast(data.error || 'Upload failed', 'error');
            }
        } catch {
            showToast('Upload failed', 'error');
        }
    });

    // Thumbnail remove
    $('#thumbRemove').addEventListener('click', () => {
        $('#fThumbnail').value = '';
        $('#thumbPreview').style.display = 'none';
    });

    // Gallery Upload
    setupDropzone($('#galleryDropzone'), $('#galleryInput'), async (files) => {
        const formData = new FormData();
        for (const file of files) {
            formData.append('images', file);
        }

        try {
            showToast('Uploading gallery images...', 'info');
            const res = await fetch('/api/admin/upload-gallery', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            const data = await res.json();
            if (data.success) {
                galleryUrls.push(...data.urls);
                renderGalleryPreview();
                showToast(`${data.urls.length} image(s) uploaded!`, 'success');
            } else {
                showToast(data.error || 'Upload failed', 'error');
            }
        } catch {
            showToast('Gallery upload failed', 'error');
        }
    });

    function renderGalleryPreview() {
        const container = $('#galleryPreview');
        container.innerHTML = '';
        galleryUrls.forEach((url, idx) => {
            const div = document.createElement('div');
            div.className = 'ap-gallery-item';
            div.innerHTML = `
                <img src="${escHtml(url)}" alt="Gallery ${idx + 1}" loading="lazy">
                <button type="button" class="remove-btn" data-idx="${idx}">&times;</button>
            `;
            container.appendChild(div);
        });

        container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                galleryUrls.splice(parseInt(btn.dataset.idx), 1);
                renderGalleryPreview();
            });
        });
    }

    // 3D Model Upload
    setupDropzone($('#modelDropzone'), $('#modelInput'), async (files) => {
        const file = files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('model', file);

        try {
            showToast('Uploading 3D model...', 'info');
            const res = await fetch('/api/admin/upload-model', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            const data = await res.json();
            if (data.success) {
                $('#fModelUrl').value = data.url;
                $('#fModelFormat').value = data.format;
                $('#modelFileName').textContent = '3D Model: ' + data.filename;
                $('#modelStatus').style.display = 'flex';
                $('#fModelEnabled').checked = true;
                showToast('3D model uploaded!', 'success');
            } else {
                showToast(data.error || 'Upload failed', 'error');
            }
        } catch {
            showToast('Model upload failed', 'error');
        }
    });

    $('#modelRemove').addEventListener('click', () => {
        $('#fModelUrl').value = '';
        $('#fModelFormat').value = '';
        $('#modelStatus').style.display = 'none';
        $('#fModelEnabled').checked = false;
    });

    // ===== Form Reset =====
    function resetForm() {
        editingId = null;
        editIdInput.value = '';
        productForm.reset();
        $('#fActive').checked = true;
        $('#fThumbnail').value = '';
        $('#thumbPreview').style.display = 'none';
        galleryUrls = [];
        renderGalleryPreview();
        $('#fModelUrl').value = '';
        $('#fModelFormat').value = '';
        $('#modelStatus').style.display = 'none';
    }

    // ===== Save Product =====
    $('#btnSave').addEventListener('click', async () => {
        // Validate required fields
        const name = $('#fName').value.trim();
        const price = $('#fPrice').value;
        const category = $('#fCategory').value;

        if (!name) { showToast('Product name is required', 'error'); activateTab('basic'); return; }
        if (!price || parseInt(price) <= 0) { showToast('Valid price is required', 'error'); activateTab('basic'); return; }
        if (!category) { showToast('Category is required', 'error'); activateTab('basic'); return; }

        const body = {
            name,
            category,
            brand: $('#fBrand').value.trim(),
            material: $('#fMaterial').value.trim(),
            price: parseInt(price),
            original_price: $('#fOriginalPrice').value ? parseInt($('#fOriginalPrice').value) : null,
            discount: $('#fDiscount').value ? parseInt($('#fDiscount').value) : null,
            stock: parseInt($('#fStock').value || 0),
            badge: $('#fBadge').value.trim() || null,
            color_variants: $('#fColors').value.trim(),
            weight: $('#fWeight').value ? parseFloat($('#fWeight').value) : null,
            dim_length: parseFloat($('#fDimL').value || 0),
            dim_width: parseFloat($('#fDimW').value || 0),
            dim_height: parseFloat($('#fDimH').value || 0),
            short_description: $('#fShortDesc').value.trim(),
            description: $('#fDescription').value.trim(),
            is_featured: $('#fFeatured').checked,
            is_trending: $('#fTrending').checked,
            is_new_arrival: $('#fNewArrival').checked,
            is_active: $('#fActive').checked,
            thumbnail: $('#fThumbnail').value,
            gallery: galleryUrls,
            model_3d_url: $('#fModelUrl').value,
            model_3d_format: $('#fModelFormat').value,
            model_3d_enabled: $('#fModelEnabled').checked,
            slug: $('#fSlug').value.trim() || '',
            seo_title: $('#fSeoTitle').value.trim(),
            seo_description: $('#fSeoDesc').value.trim(),
            seo_keywords: $('#fSeoKeywords').value.trim()
        };

        try {
            const isEdit = !!editingId;
            const url = isEdit ? `/api/admin/products/${editingId}` : '/api/admin/products';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'same-origin'
            });

            const data = await res.json();
            if (data.success) {
                showToast(isEdit ? 'Product updated!' : 'Product created!', 'success');
                closeModal();
                loadProducts();
            } else {
                showToast(data.error || 'Failed to save', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    });

    // ===== Edit Product =====
    async function startEdit(id) {
        try {
            const res = await fetch(`/api/products/${id}`, { credentials: 'same-origin' });
            const data = await res.json();
            if (!data.product) { showToast('Product not found', 'error'); return; }

            const p = data.product;
            editingId = p.id || p._id;
            editIdInput.value = editingId;

            // Basic Info
            $('#fName').value = p.name || '';
            $('#fCategory').value = p.category || '';
            $('#fBrand').value = p.brand || '';
            $('#fMaterial').value = p.material || '';
            $('#fPrice').value = p.price || '';
            $('#fOriginalPrice').value = p.original_price || '';
            $('#fDiscount').value = p.discount || '';
            $('#fStock').value = p.stock || 0;
            $('#fBadge').value = p.badge || '';
            $('#fColors').value = (p.color_variants || []).join(', ');
            $('#fWeight').value = p.weight || '';
            $('#fDimL').value = p.dimensions?.length || '';
            $('#fDimW').value = p.dimensions?.width || '';
            $('#fDimH').value = p.dimensions?.height || '';
            $('#fShortDesc').value = p.short_description || '';
            $('#fDescription').value = p.description || '';
            $('#fFeatured').checked = !!p.is_featured;
            $('#fTrending').checked = !!p.is_trending;
            $('#fNewArrival').checked = !!p.is_new_arrival;
            $('#fActive').checked = p.is_active !== false;

            // Images
            const thumb = p.thumbnail || p.image || '';
            $('#fThumbnail').value = thumb;
            if (thumb) {
                $('#thumbImg').src = thumb;
                $('#thumbPreview').style.display = 'flex';
            } else {
                $('#thumbPreview').style.display = 'none';
            }

            galleryUrls = Array.isArray(p.gallery) ? [...p.gallery] : [];
            renderGalleryPreview();

            // 3D Model
            const modelUrl = p.model_3d?.file_url || p.model_src || '';
            $('#fModelUrl').value = modelUrl;
            $('#fModelFormat').value = p.model_3d?.format || '';
            $('#fModelEnabled').checked = !!(p.model_3d?.enabled || p.is_3d);
            if (modelUrl) {
                $('#modelFileName').textContent = '3D Model: ' + modelUrl.split('/').pop();
                $('#modelStatus').style.display = 'flex';
            } else {
                $('#modelStatus').style.display = 'none';
            }

            // SEO
            $('#fSeoTitle').value = p.seo?.meta_title || '';
            $('#fSeoDesc').value = p.seo?.meta_description || '';
            $('#fSeoKeywords').value = (p.seo?.meta_keywords || []).join(', ');
            $('#fSlug').value = p.slug || '';

            openModal(true);
        } catch {
            showToast('Failed to load product', 'error');
        }
    }

    // ===== Delete Product =====
    async function deleteProduct(id) {
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            const data = await res.json();
            if (data.success) {
                showToast('Product deleted', 'success');
                loadProducts();
            } else {
                showToast(data.error || 'Delete failed', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    }

    // ===== Reset All Products =====
    $('#btnResetAll').addEventListener('click', () => {
        showConfirm(
            'Reset All Products',
            'This will permanently delete ALL products and reviews. This cannot be undone!',
            'Delete All',
            async () => {
                try {
                    const res = await fetch('/api/admin/products-reset', {
                        method: 'DELETE',
                        credentials: 'same-origin'
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast(`Deleted ${data.deleted} products`, 'success');
                        loadProducts();
                    } else {
                        showToast(data.error || 'Reset failed', 'error');
                    }
                } catch {
                    showToast('Network error', 'error');
                }
            }
        );
    });

    $('#btnAddProduct')?.addEventListener('click', () => { resetForm(); openModal(false); });
    $('#btnAddFirst')?.addEventListener('click', () => { resetForm(); openModal(false); });

    $('#btn-logout')?.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
        } catch { /* ignore */ }
        window.location.href = '/login.html';
    });

    // Sidebar toggle (mobile)
    const sidebarToggle = $('#btnToggleSidebar');
    if (sidebarToggle) {
        if (window.innerWidth <= 1024) {
            sidebarToggle.style.display = 'inline-flex';
        }
        sidebarToggle.addEventListener('click', () => {
            $('#apSidebar')?.classList.toggle('open');
        });
    }
    window.addEventListener('resize', () => {
        if (sidebarToggle) {
            sidebarToggle.style.display = window.innerWidth <= 1024 ? 'inline-flex' : 'none';
        }
        if (window.innerWidth > 1024) {
            $('#apSidebar')?.classList.remove('open');
        }
    });

    // ===== Helpers =====
    function escHtml(str) {
        const d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    function capitalize(str) {
        return String(str || '').charAt(0).toUpperCase() + String(str || '').slice(1);
    }

    // ===== Init =====
    async function init() {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return;
        loadProducts();
    }

    init();
})();
