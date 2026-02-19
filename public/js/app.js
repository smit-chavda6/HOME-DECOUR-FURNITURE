// Modern Navbar JavaScript
document.addEventListener('DOMContentLoaded', function() {
    if (window.__navbarInit) return; // prevent double init if script included twice
    window.__navbarInit = true;
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navbarMenu = document.querySelector('.navbar-menu');
    let backdrop = null;
    // Ensure a mobile cart icon exists next to hamburger for small screens
    const ensureMobileCartIcon = () => {
        const container = document.querySelector('.navbar-container');
        const existingMobileCart = document.querySelector('.mobile-cart-icon');
        const desktopCart = document.querySelector('.navbar-menu .cart-icon');
        if (!container || !desktopCart) return;
        // Only add on small screens and if missing
        if (window.innerWidth <= 768 && !existingMobileCart) {
            const mobileCart = desktopCart.cloneNode(true);
            mobileCart.classList.add('mobile-cart-icon');
            // Remove active class to avoid layout issues
            mobileCart.classList.remove('cart-icon');
            // Keep count element
            const count = mobileCart.querySelector('.cart-count');
            if (count) { count.style.display = count.textContent !== '0' ? 'flex' : 'none'; }
            // Insert after hamburger
            if (hamburger && hamburger.parentNode === container) {
                container.insertBefore(mobileCart, hamburger.nextSibling);
            } else {
                container.appendChild(mobileCart);
            }
            // Let cart popup system rebind later
        }
        // If returning to desktop, remove the mobile clone if present
        if (window.innerWidth > 768 && existingMobileCart && existingMobileCart.parentNode) {
            existingMobileCart.parentNode.removeChild(existingMobileCart);
        }
    };
    ensureMobileCartIcon();
    
    // Check authentication status and update navbar
    checkAuthAndUpdateNavbar();
    
    // Hamburger menu functionality
    function setMenuOpen(open){
        if (!hamburger || !navbarMenu) return;
        hamburger.classList.toggle('active', !!open);
        navbarMenu.classList.toggle('active', !!open);
        hamburger.setAttribute('aria-expanded', !!open);
        document.body.classList.toggle('no-scroll', !!open);
        // Create/remove backdrop
        if (open) {
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'navbar-backdrop active';
                document.body.appendChild(backdrop);
                backdrop.addEventListener('click', () => setMenuOpen(false));
            } else {
                backdrop.classList.add('active');
            }
        } else if (backdrop) {
            backdrop.classList.remove('active');
        }
    }

    if (hamburger && navbarMenu) {
        hamburger.setAttribute('aria-controls', 'primary-navigation');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.addEventListener('click', () => {
            const isOpen = navbarMenu.classList.contains('active');
            setMenuOpen(!isOpen);
        });
    // Recreate/ensure mobile cart if viewport changed
    window.addEventListener('resize', ensureMobileCartIcon);
        
        // Close menu when clicking on a link (improved for mobile)
        const navbarLinks = document.querySelectorAll('.navbar-link');
        navbarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) setMenuOpen(false);
            });
        });
    }
    
    // Scroll effect for navbar
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // Active page highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navbarLinks = document.querySelectorAll('.navbar-link');
    
    navbarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
    
    // Smooth scrolling for anchor links (ignore bare '#')
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href') || '';
            // Ignore or safely handle anchors with just '#'
            if (href.trim() === '#' || href.trim() === '') {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            const id = href.slice(1);
            if (!id) return;
            const target = document.getElementById(id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navbar && navbarMenu && !navbar.contains(e.target) && navbarMenu.classList.contains('active')) {
            setMenuOpen(false);
        }
    });
    
    // Keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navbarMenu && navbarMenu.classList.contains('active')) setMenuOpen(false);
    });

    // Close menu when resizing to desktop to avoid stuck state
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navbarMenu && navbarMenu.classList.contains('active')) {
            setMenuOpen(false);
        }
    ensureMobileCartIcon();
    });
    
    // Authentication functions
    async function checkAuthAndUpdateNavbar() {
        try {
            const response = await fetch('/api/check-auth', {
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.authenticated) {
                updateNavbarForLoggedInUser(data.user);
            } else {
                updateNavbarForLoggedOutUser();
            }
        } catch (error) {
            console.log('Auth check failed:', error);
            updateNavbarForLoggedOutUser();
        }
    }
    
    function updateNavbarForLoggedInUser(user) {
        const loginBtn = document.getElementById('navbar-login-btn');
        if (loginBtn) {
            loginBtn.innerHTML = `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
            loginBtn.title = `Welcome, ${user.username}`;
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showLoginPopup(user);
            });
        }
    }
    
    function updateNavbarForLoggedOutUser() {
        const loginBtn = document.getElementById('navbar-login-btn');
        if (loginBtn) {
            loginBtn.innerHTML = `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 8-4 8-4s8 0 8 4v1H4v-1z"/>
                </svg>
            `;
            loginBtn.title = 'Login';
            try {
                const current = window.location.pathname.split('/').pop() || 'index.html';
                const qs = window.location.search || '';
                const target = encodeURIComponent(current + qs);
                loginBtn.href = `login.html?redirect=${target}`;
            } catch {
                loginBtn.href = 'login.html';
            }
        }
    }
    
    function showLoginPopup(user) {
        // Remove existing popup
        const existingPopup = document.querySelector('.user-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        const popup = document.createElement('div');
        popup.className = 'user-popup';
        popup.innerHTML = `
            <div class="user-popup-content">
                <div class="user-info">
                    <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div>
                        <h3>${user.username}</h3>
                        <p class="user-email">${user.email || 'No email'}</p>
                    </div>
                </div>
                
                <div class="user-actions">
                    <button class="btn-popup" id="popup-my-orders">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        My Orders & Reviews
                    </button>
                    <button class="btn-popup" id="popup-profile">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Profile
                    </button>
                    ${user.role === 'admin' ? `<button class="btn-popup" id="popup-admin">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                        Admin Panel
                    </button>` : ''}
                    <button class="btn-popup btn-logout" id="popup-logout">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Add event listeners for main buttons
        document.getElementById('popup-my-orders')?.addEventListener('click', () => {
            popup.remove();
            showOrdersAndReviewsModal();
        });
        
        document.getElementById('popup-profile')?.addEventListener('click', () => {
            window.location.href = 'profile.html';
            popup.remove();
        });
        
        document.getElementById('popup-admin')?.addEventListener('click', () => {
            window.location.href = 'admin.html';
            popup.remove();
        });
        
        document.getElementById('popup-logout')?.addEventListener('click', logout);
        
        // Close popup when clicking outside
        function closePopupOnClickOutside(e) {
            if (!popup.contains(e.target) && !document.getElementById('navbar-login-btn').contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', closePopupOnClickOutside);
            }
        }
        
        setTimeout(() => {
            document.addEventListener('click', closePopupOnClickOutside);
        }, 100);
    }
    
    function showOrdersAndReviewsModal() {
        const modal = document.createElement('div');
        modal.className = 'orders-reviews-modal-overlay';
        modal.innerHTML = `
            <div class="orders-reviews-modal">
                <div class="modal-header">
                    <h3>My Orders & Reviews</h3>
                    <button class="modal-close-btn" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999;">×</button>
                </div>
                
                <div class="modal-tabs">
                    <button class="modal-tab-btn active" data-tab="orders">Orders</button>
                    <button class="modal-tab-btn" data-tab="reviews">My Reviews</button>
                </div>
                
                <div class="modal-content">
                    <div id="orders-tab-modal" class="modal-tab-content active">
                        <div id="modal-orders-list" style="max-height:500px;overflow-y:auto;">
                            <p style="text-align:center;color:#999;padding:20px;">Loading orders...</p>
                        </div>
                    </div>
                    <div id="reviews-tab-modal" class="modal-tab-content">
                        <div id="modal-reviews-list" style="max-height:500px;overflow-y:auto;">
                            <p style="text-align:center;color:#999;padding:20px;">Loading reviews...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close button
        modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
        
        // Overlay close - click on the overlay background to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Tab switching
        modal.querySelectorAll('.modal-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                modal.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                modal.querySelector('#' + tabName + '-tab-modal').classList.add('active');
            });
        });
        
        // Load data asynchronously
        (async () => {
            await loadOrdersForModal(modal);
            await loadReviewsForModal(modal);
        })();
    }
    
    async function loadOrdersForModal(modal) {
        const ordersList = modal.querySelector('#modal-orders-list');
        try {
            console.log('Fetching orders...');
            const response = await fetch('/api/my/orders', { credentials: 'include' });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Orders data received:', data);
            const orders = data.orders || [];
            
            if (!orders.length) {
                ordersList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No orders yet.</p>';
                return;
            }
            
            // Create table format
            ordersList.innerHTML = `
                <table style="width:100%;border-collapse:collapse;font-size:13px;background:white;">
                    <thead>
                        <tr style="background:#f8f9fa;border-bottom:2px solid #dee2e6;">
                            <th style="padding:12px 8px;text-align:left;font-weight:600;color:#495057;width:60px;">Order</th>
                            <th style="padding:12px 8px;text-align:left;font-weight:600;color:#495057;">Product Details</th>
                            <th style="padding:12px 8px;text-align:center;font-weight:600;color:#495057;width:100px;">Quantity</th>
                            <th style="padding:12px 8px;text-align:right;font-weight:600;color:#495057;width:120px;">Price</th>
                            <th style="padding:12px 8px;text-align:center;font-weight:600;color:#495057;width:140px;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map((order, orderIndex) => {
                            const items = order.items || [];
                            return items.map((item, itemIndex) => `
                                <tr style="border-bottom:1px solid #e9ecef;">
                                    ${itemIndex === 0 ? `
                                        <td rowspan="${items.length}" style="padding:12px 8px;vertical-align:top;border-right:1px solid #e9ecef;">
                                            <div style="font-weight:600;color:#D2691E;font-size:16px;">#${orderIndex + 1}</div>
                                            <div style="font-size:11px;color:#6c757d;margin-top:4px;">${order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB') : 'N/A'}</div>
                                            <div style="font-size:11px;color:#28a745;font-weight:600;margin-top:4px;text-transform:capitalize;">${order.status || 'pending'}</div>
                                        </td>
                                    ` : ''}
                                    <td style="padding:12px 8px;">
                                        <div class="product-name" style="font-weight:600;color:#212529;margin-bottom:4px;">${item.name || item.product_name || 'Product'}</div>
                                        <div class="product-meta" style="color:#6c757d;font-size:11px;">₹${item.price ? item.price.toLocaleString() : 0} per unit</div>
                                    </td>
                                    <td style="padding:12px 8px;text-align:center;color:#495057;font-weight:500;">
                                        <span class="qty-chip" style="background:#e9ecef;padding:4px 12px;border-radius:4px;">${item.quantity}</span>
                                    </td>
                                    <td style="padding:12px 8px;text-align:right;font-weight:600;color:#D2691E;font-size:14px;">
                                        ₹${item.quantity && item.price ? (item.quantity * item.price).toLocaleString() : 0}
                                    </td>
                                    <td style="padding:12px 8px;text-align:center;">
                                        <button class="review-btn-modal" data-product-id="${item.product_id}" data-order-id="${order._id || order.id}" data-product-name="${item.name || item.product_name}" 
                                        style="padding:8px 16px;background:linear-gradient(135deg, #D2691E 0%, #8B4513 100%);color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.3s;box-shadow:0 2px 4px rgba(210,105,30,0.2);">
                                            ⭐ Write Review
                                        </button>
                                    </td>
                                </tr>
                            `).join('');
                        }).join('')}
                        <tr class="orders-total-row" style="background:#f8f9fa;border-top:2px solid #dee2e6;">
                            <td colspan="3" style="padding:12px 8px;text-align:right;font-weight:600;color:#495057;">Total Amount:</td>
                            <td style="padding:12px 8px;text-align:right;font-weight:700;color:#D2691E;font-size:16px;">
                                ₹${orders.reduce((sum, order) => sum + (order.total || 0), 0).toLocaleString()}
                            </td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            `;
            
            // Get existing reviews to check for duplicates
            try {
                const reviewsResponse = await fetch('/api/my/reviews', { credentials: 'include' });
                const reviewsData = await reviewsResponse.json();
                const userReviews = reviewsData.reviews || [];
                const reviewedProducts = new Set(userReviews.map(r => String(r.product_id)));
                
                // Add review button listeners
                ordersList.querySelectorAll('.review-btn-modal').forEach(btn => {
                    const productId = btn.getAttribute('data-product-id');
                    const hasReviewed = reviewedProducts.has(String(productId));
                    
                    if (hasReviewed) {
                        btn.textContent = '✓ Already Reviewed';
                        btn.disabled = true;
                        btn.style.background = '#6c757d';
                        btn.style.cursor = 'not-allowed';
                        btn.style.opacity = '0.7';
                        btn.title = 'You have already reviewed this product';
                    } else {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const orderId = btn.getAttribute('data-order-id');
                            const productName = btn.getAttribute('data-product-name');
                            openReviewModalWithHalfStars(productId, orderId, productName, modal);
                        });
                    }
                });
            } catch (error) {
                console.warn('Could not check existing reviews:', error);
                // Fallback: allow review button to work anyway
                ordersList.querySelectorAll('.review-btn-modal').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const productId = btn.getAttribute('data-product-id');
                        const orderId = btn.getAttribute('data-order-id');
                        const productName = btn.getAttribute('data-product-name');
                        openReviewModalWithHalfStars(productId, orderId, productName, modal);
                    });
                });
            }
            
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersList.innerHTML = '<p style="text-align:center;color:red;padding:20px;">Error loading orders: ' + error.message + '</p>';
        }
    }
    
    async function loadReviewsForModal(modal) {
        const reviewsList = modal.querySelector('#modal-reviews-list');
        try {
            console.log('Fetching reviews...');
            const response = await fetch('/api/my/reviews', { credentials: 'include' });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Reviews data received:', data);
            const reviews = data.reviews || [];
            
            if (!reviews.length) {
                reviewsList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No reviews yet.</p>';
                return;
            }
            
            reviewsList.innerHTML = reviews.map(review => `
                <div style="border-bottom:1px solid #e9ecef;padding:16px 0;font-size:13px;display:flex;gap:12px;align-items:flex-start;">
                    <!-- Product Image -->
                    <div style="flex-shrink:0;width:60px;height:60px;background:#f0f0f0;border-radius:6px;overflow:hidden;">
                        ${review.product_image ? `
                            <img src="${review.product_image}" alt="${review.product_name}" style="width:100%;height:100%;object-fit:cover;">
                        ` : `
                            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e9ecef;color:#999;font-size:24px;">📦</div>
                        `}
                    </div>
                    
                    <!-- Review Details -->
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;gap:8px;">
                            <div style="flex:1;">
                                <strong style="color:#212529;display:block;margin-bottom:4px;">${review.product_name || 'Product'}</strong>
                                <span style="color:#6c757d;font-size:11px;">ID: ${review.product_id ? review.product_id.toString().slice(-8) : 'N/A'}</span>
                            </div>
                            <span style="color:#D2691E;font-weight:600;font-size:14px;white-space:nowrap;">${renderHalfStars(review.rating)}</span>
                        </div>
                        <p style="margin:8px 0;color:#495057;font-size:12px;line-height:1.4;">${review.comment || '<em style="color:#999;">No comment</em>'}</p>
                        <div style="color:#999;font-size:11px;">${new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewsList.innerHTML = '<p style="text-align:center;color:red;padding:20px;">Error loading reviews: ' + error.message + '</p>';
        }
    }
    
    function renderHalfStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '★';
        if (hasHalf) stars += '⯪';
        return stars;
    }
    
    function escapeHTML(s){
        return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    }

    function openReviewModalWithHalfStars(productId, orderId, productName, parentModal) {
        const reviewModal = document.createElement('div');
        reviewModal.className = 'review-modal-overlay';
        reviewModal.innerHTML = `
            <div class="review-modal" style="max-width:500px;background:white;border-radius:12px;padding:0;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
                <div style="background:linear-gradient(135deg, #D2691E 0%, #8B4513 100%);color:white;padding:20px;border-radius:12px 12px 0 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <h3 style="margin:0;font-size:20px;font-weight:600;">Write a Review</h3>
                        <button class="review-modal-close" style="background:rgba(255,255,255,0.2);border:none;width:32px;height:32px;border-radius:50%;font-size:20px;cursor:pointer;color:white;transition:all 0.3s;">×</button>
                    </div>
                    <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9;">${escapeHTML(productName)}</p>
                </div>
                
                <div style="padding:24px;">
                    <div style="margin-bottom:24px;">
                        <label style="display:block;margin-bottom:12px;font-weight:600;color:#212529;font-size:15px;">How would you rate this product?</label>
                        <div class="rating-card" style="background:#f8f9fa;padding:20px;border-radius:8px;text-align:center;">
                            <div class="review-stars-half" id="review-stars-half" style="display:inline-flex;gap:8px;font-size:48px;margin-bottom:12px;">
                                ${[1, 2, 3, 4, 5].map(i => `
                                    <div class="star-wrapper" data-rating="${i}" style="position:relative;cursor:pointer;transition:all 0.2s;">
                                        <span class="star-bg" style="color:#e4e5e9;">★</span>
                                        <span class="star-fill" style="position:absolute;left:0;top:0;color:#ffc107;overflow:hidden;width:0%;transition:width 0.2s;">★</span>
                                    </div>
                                `).join('')}
                            </div>
                            <input type="hidden" id="review-rating-half" value="0">
                            <div id="rating-display" style="font-size:16px;font-weight:600;color:#D2691E;min-height:24px;">
                                <span style="color:#6c757d;">Click on stars to rate</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block;margin-bottom:8px;font-weight:600;color:#212529;font-size:15px;">Share your thoughts (optional)</label>
                        <textarea id="review-comment-half" placeholder="What did you like or dislike about this product?" 
                        style="width:100%;padding:12px;border:2px solid #e9ecef;border-radius:8px;font-family:inherit;font-size:14px;resize:vertical;transition:border-color 0.3s;" 
                        rows="4"></textarea>
                    </div>
                    
                    <div style="display:flex;gap:12px;">
                        <button class="review-modal-cancel" 
                        style="flex:1;padding:12px;background:#f8f9fa;color:#495057;border:2px solid #dee2e6;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;transition:all 0.3s;">
                            Cancel
                        </button>
                        <button class="review-modal-submit" 
                        style="flex:1;padding:12px;background:linear-gradient(135deg, #D2691E 0%, #8B4513 100%);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;transition:all 0.3s;box-shadow:0 4px 12px rgba(210,105,30,0.3);">
                            Submit Review
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(reviewModal);
        
        let selectedRating = 0;
        const starsContainer = reviewModal.querySelector('#review-stars-half');
        
        // Modern star rating system - each star can be half or full
        const starWrappers = reviewModal.querySelectorAll('.star-wrapper');
        
        starWrappers.forEach((wrapper, index) => {
            const starNumber = index + 1;
            const starFill = wrapper.querySelector('.star-fill');
            
            // Click handler
            wrapper.addEventListener('click', (e) => {
                const rect = wrapper.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const halfWidth = rect.width / 2;
                
                // Determine if left half (0.5) or right half (full star)
                if (clickX < halfWidth) {
                    selectedRating = starNumber - 0.5;
                } else {
                    selectedRating = starNumber;
                }
                
                reviewModal.querySelector('#review-rating-half').value = selectedRating;
                updateStarDisplay(reviewModal, selectedRating);
            });
            
            // Hover handler
            wrapper.addEventListener('mousemove', (e) => {
                const rect = wrapper.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const halfWidth = rect.width / 2;
                
                let hoverRating;
                if (mouseX < halfWidth) {
                    hoverRating = starNumber - 0.5;
                } else {
                    hoverRating = starNumber;
                }
                
                updateStarDisplay(reviewModal, hoverRating, true);
            });
        });
        
        starsContainer.addEventListener('mouseleave', () => {
            updateStarDisplay(reviewModal, selectedRating);
        });
        
        function updateStarDisplay(modal, rating, isHover = false) {
            const wrappers = modal.querySelectorAll('.star-wrapper');
            
            wrappers.forEach((wrapper, index) => {
                const starNumber = index + 1;
                const starFill = wrapper.querySelector('.star-fill');
                
                if (rating >= starNumber) {
                    // Full star
                    starFill.style.width = '100%';
                    wrapper.style.transform = isHover ? 'scale(1.1)' : 'scale(1)';
                } else if (rating >= starNumber - 0.5) {
                    // Half star
                    starFill.style.width = '50%';
                    wrapper.style.transform = isHover ? 'scale(1.1)' : 'scale(1)';
                } else {
                    // Empty star
                    starFill.style.width = '0%';
                    wrapper.style.transform = 'scale(1)';
                }
            });
            
            if (!isHover) {
                const display = modal.querySelector('#rating-display');
                if (rating > 0) {
                    const starText = '★'.repeat(Math.floor(rating)) + (rating % 1 !== 0 ? '⯨' : '');
                    display.innerHTML = `<span style="color:#ffc107;font-size:20px;">${starText}</span> <span style="color:#212529;margin-left:8px;">${rating} out of 5</span>`;
                } else {
                    display.textContent = 'No rating selected';
                }
            }
        }
        
        // Close modal
        reviewModal.querySelector('.review-modal-close').addEventListener('click', () => reviewModal.remove());
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) {
                reviewModal.remove();
            }
        });
        reviewModal.querySelector('.review-modal-cancel').addEventListener('click', () => reviewModal.remove());
        
        // Add hover effects for better UX
        const submitBtn = reviewModal.querySelector('.review-modal-submit');
        const cancelBtn = reviewModal.querySelector('.review-modal-cancel');
        const textarea = reviewModal.querySelector('#review-comment-half');
        
        submitBtn.addEventListener('mouseenter', () => {
            submitBtn.style.transform = 'translateY(-2px)';
            submitBtn.style.boxShadow = '0 6px 20px rgba(210,105,30,0.4)';
        });
        submitBtn.addEventListener('mouseleave', () => {
            submitBtn.style.transform = 'translateY(0)';
            submitBtn.style.boxShadow = '0 4px 12px rgba(210,105,30,0.3)';
        });
        
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = '#e9ecef';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = '#f8f9fa';
        });
        
        textarea.addEventListener('focus', () => {
            textarea.style.borderColor = '#D2691E';
        });
        textarea.addEventListener('blur', () => {
            textarea.style.borderColor = '#e9ecef';
        });
        
        // Submit review
        reviewModal.querySelector('.review-modal-submit').addEventListener('click', async () => {
            const rating = parseFloat(reviewModal.querySelector('#review-rating-half').value);
            const comment = reviewModal.querySelector('#review-comment-half').value.trim();
            
            if (!rating || rating === 0) {
                if (window.cartPopupSystem && window.cartPopupSystem.showNotification) {
                    window.cartPopupSystem.showNotification('Please select a rating', 'warning');
                } else {
                    alert('Please select a rating');
                }
                return;
            }
            
            try {
                const response = await fetch('/api/my/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ product_id: productId, order_id: orderId, rating, comment })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const message = result.updated ? 'Review updated successfully!' : 'Review submitted successfully!';
                    
                    if (window.cartPopupSystem && window.cartPopupSystem.showNotification) {
                        window.cartPopupSystem.showNotification(message, 'success');
                    } else {
                        alert(message);
                    }
                    
                    reviewModal.remove();
                    
                    // Reload parent modal reviews and orders
                    if (parentModal) {
                        await loadReviewsForModal(parentModal);
                        await loadOrdersForModal(parentModal);
                    }
                    
                    // Update product reviews globally
                    if (window.refreshProductReviews) {
                        window.refreshProductReviews(productId);
                    }
                    
                    // Update gallery cards
                    if (window.updateProductCardRating) {
                        window.updateProductCardRating(productId);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = 'Failed to submit review: ' + (errorData.message || 'Unknown error');
                    if (window.cartPopupSystem && window.cartPopupSystem.showNotification) {
                        window.cartPopupSystem.showNotification(errorMessage, 'error');
                    } else {
                        alert(errorMessage);
                    }
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                if (window.cartPopupSystem && window.cartPopupSystem.showNotification) {
                    window.cartPopupSystem.showNotification('Error submitting review', 'error');
                } else {
                    alert('Error submitting review');
                }
            }
        });
    }

    
    // Global logout function
    window.logout = async function() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };
    
    // === Dark Mode Toggle & Persistence ===
    (function setupThemeToggle(){
        const THEME_KEY = 'hdf-theme';
        const ACCENT_KEY = 'hdf-accent';
        const ACCENTS = ['accent-amber','accent-emerald','accent-rose','accent-sapphire'];
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const saved = localStorage.getItem(THEME_KEY);
        let theme = saved || (prefersDark ? 'dark' : 'light');
        let accent = localStorage.getItem(ACCENT_KEY) || 'accent-amber';

        // Ensure dark-mode stylesheet is present
        const hasDarkCss = Array.from(document.styleSheets).some(ss => {
            try { return (ss.href||'').endsWith('CSS/dark-mode.css') || (ss.href||'').includes('dark-mode.css'); } catch { return false; }
        });
        if (!hasDarkCss) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'CSS/dark-mode.css';
            document.head.appendChild(link);
        }

        const FAVICON_PATHS = {
            light: {
                ico: 'image/favicon_light/favicon.ico',
                icon16: 'image/favicon_light/favicon-16x16.png',
                icon32: 'image/favicon_light/favicon-32x32.png',
                apple: 'image/favicon_light/apple-touch-icon.png',
                android192: 'image/favicon_light/android-chrome-192x192.png',
                android512: 'image/favicon_light/android-chrome-512x512.png',
                manifest: 'image/favicon_light/site.webmanifest'
            },
            dark: {
                ico: 'image/favicon_dark/favicon.ico',
                icon16: 'image/favicon_dark/favicon-16x16.png',
                icon32: 'image/favicon_dark/favicon-32x32.png',
                apple: 'image/favicon_dark/apple-touch-icon.png',
                android192: 'image/favicon_dark/android-chrome-192x192.png',
                android512: 'image/favicon_dark/android-chrome-512x512.png',
                manifest: 'image/favicon_dark/site.webmanifest'
            }
        };

        const LIGHT_LOGO = FAVICON_PATHS.light.apple;
        const DARK_LOGO = FAVICON_PATHS.dark.apple;

        function updateFavicons(themeMode){
            const paths = FAVICON_PATHS[themeMode] || FAVICON_PATHS.light;
            const selectors = [
                'link[rel="icon"]',
                'link[rel="shortcut icon"]',
                'link[rel="apple-touch-icon"]',
                'link[rel="manifest"]'
            ];

            selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.remove());
            });

            const head = document.head;
            const createLink = (rel, href, sizes, type) => {
                const link = document.createElement('link');
                link.rel = rel;
                link.href = href;
                if (sizes) link.sizes = sizes;
                if (type) link.type = type;
                head.appendChild(link);
            };

            createLink('icon', paths.ico, null, 'image/x-icon');
            createLink('icon', paths.icon16, '16x16', 'image/png');
            createLink('icon', paths.icon32, '32x32', 'image/png');
            createLink('icon', paths.android192, '192x192', 'image/png');
            createLink('icon', paths.android512, '512x512', 'image/png');
            createLink('apple-touch-icon', paths.apple, '180x180', 'image/png');
            createLink('manifest', paths.manifest);

            let msTile = document.querySelector('meta[name="msapplication-TileImage"]');
            if (!msTile) {
                msTile = document.createElement('meta');
                msTile.name = 'msapplication-TileImage';
                head.appendChild(msTile);
            }
            msTile.setAttribute('content', paths.apple);
        }

    function applyTheme(t){
            document.body.classList.toggle('dark-mode', t === 'dark');
            const btn = document.getElementById('themeToggle');
            const icon = document.getElementById('themeIcon');
            if (btn && icon) {
                btn.title = (t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
                btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
                // Icon: dark mode = half-moon (crescent), light mode = sun
                icon.innerHTML = t === 'dark'
                    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
                    : '<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.48 0l1.79-1.79 1.41 1.41-1.79 1.8-1.41-1.42zM12 4V1h-2v3h2zm0 19v-3h-2v3h2zm8-9h3v-2h-3v2zM1 12H4v-2H1v2zm15.24 7.16l1.79 1.79 1.41-1.41-1.79-1.8-1.41 1.42zM4.22 18.95l-1.79 1.79 1.41 1.41 1.8-1.79-1.42-1.41zM18 12a6 6 0 1 1-6-6 6 6 0  0 1 6 6z"/>';
            }

            // Swap navbar brand logo based on theme
            const logoEls = document.querySelectorAll('img.navbar-logo');
            logoEls.forEach(img => {
                img.setAttribute('src', t === 'dark' ? DARK_LOGO : LIGHT_LOGO);
            });

            updateFavicons(t);
        }

    function applyAccent(a){
        // Remove any previous accent class
        ACCENTS.forEach(c => document.body.classList.remove(c));
        if (!ACCENTS.includes(a)) a = 'accent-amber';
        document.body.classList.add(a);
    }

        // Create toggle button if missing
        let toggle = document.getElementById('themeToggle');
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.id = 'themeToggle';
            toggle.className = 'theme-toggle';
            toggle.type = 'button';
            toggle.setAttribute('aria-label', 'Toggle dark mode');
            toggle.innerHTML = '<svg id="themeIcon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.64 13a1 1 0 0 0-1.05-.14A8 8 0 1 1 11.14 3.41a1 1 0 0 0-.14-1.05 1 1 0 0 0-1.09-.33A10 10 0 1 0 22 14.09a1 1 0 0 0-.36-1.09z"/></svg>';
            document.body.appendChild(toggle);
        }
        toggle.hidden = false;

        // Initial apply
        applyTheme(theme);
        applyAccent(accent);

        // Toggle handler (no Shift-click accent switching)
        toggle.addEventListener('click', () => {
            theme = theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem(THEME_KEY, theme);
            applyTheme(theme);
        });
    })();
    });

    /* ========================================
       MOBILE ENHANCEMENTS
       ======================================== */

    document.addEventListener('DOMContentLoaded', function() {
        // Only run mobile enhancements on mobile devices
        const isMobile = () => window.innerWidth <= 768;

        // ==========================================
        // 1. LOGIN BUTTON - Direct Navigation (No Popup Overlay)
        // ==========================================
    
        function initMobileLoginButton() {
            const loginBtn = document.querySelector('.navbar-login-btn');
            
            // Simply navigate to login page on click
            if (loginBtn) {
                loginBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.href = 'login.html';
                });
            }
        }

        // ==========================================
        // 2. ADMIN PANEL - MOBILE TOGGLE MENU
        // ==========================================
    
        function initAdminMobileMenu() {
            if (!isMobile()) return;

            const adminLayout = document.querySelector('.admin-layout');
            const adminSidebar = document.querySelector('.admin-sidebar');
        
            if (!adminLayout || !adminSidebar) return;

            // Create toggle button
            let toggleBtn = document.querySelector('.admin-mobile-toggle');
            if (!toggleBtn) {
                toggleBtn = document.createElement('button');
                toggleBtn.className = 'admin-mobile-toggle';
                toggleBtn.innerHTML = '<span></span><span></span><span></span>';
                toggleBtn.setAttribute('aria-label', 'Toggle admin menu');
                document.body.appendChild(toggleBtn);
            }

            // Create overlay
            let overlay = document.querySelector('.admin-sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'admin-sidebar-overlay';
                document.body.appendChild(overlay);
            }

            // Toggle menu
            function toggleAdminMenu() {
                const isActive = adminSidebar.classList.contains('active');
                adminSidebar.classList.toggle('active', !isActive);
                overlay.classList.toggle('active', !isActive);
                toggleBtn.classList.toggle('active', !isActive);
                document.body.classList.toggle('no-scroll', !isActive);
            }

            // Close menu
            function closeAdminMenu() {
                adminSidebar.classList.remove('active');
                overlay.classList.remove('active');
                toggleBtn.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }

            // Toggle button click
            toggleBtn.addEventListener('click', toggleAdminMenu);

            // Overlay click to close
            overlay.addEventListener('click', closeAdminMenu);

            // Close menu when clicking on nav link
            const navLinks = adminSidebar.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', closeAdminMenu);
            });
        }

        // ==========================================
        // 3. INITIALIZE ALL MOBILE FEATURES
        // ==========================================
    
        if (isMobile()) {
            initMobileLoginButton();
            initAdminMobileMenu();
        }

        // Re-initialize on resize (if switching between mobile/desktop)
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (isMobile()) {
                    initMobileLoginButton();
                    initAdminMobileMenu();
                }
            }, 250);
        });

        // ==========================================
        // 4. GENERAL MOBILE UX IMPROVEMENTS
        // ==========================================
    
        if (isMobile()) {
            // Prevent horizontal scroll
            document.body.style.overflowX = 'hidden';
            document.documentElement.style.overflowX = 'hidden';

            // Improve touch scrolling
            document.body.style.webkitOverflowScrolling = 'touch';

            // Add touch-friendly class to buttons
            const buttons = document.querySelectorAll('button, .btn, .cart-btn, .quantity-btn');
            buttons.forEach(btn => {
                btn.style.cursor = 'pointer';
                btn.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
            });
        }
    });