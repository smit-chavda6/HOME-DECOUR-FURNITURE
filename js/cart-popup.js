// Cart Popup System - Shared across all pages
class CartPopupSystem {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    init() {
        this.updateCartCount();
        this.setupCartIcon();
        this.setupCartPopup();
        this.setupAddToCartButtons();
    }

    // Update cart count in navbar
    updateCartCount() {
        const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'flex' : 'none';
        });
        
        // Also update checkout button state
        this.updateCheckoutButtonState();
    }

    // Update checkout button state based on cart
    updateCheckoutButtonState() {
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');
        if (proceedToCheckoutBtn) {
            if (this.cart.length === 0) {
                proceedToCheckoutBtn.disabled = true;
                proceedToCheckoutBtn.classList.add('disabled');
                proceedToCheckoutBtn.textContent = 'Cart Empty';
            } else {
                proceedToCheckoutBtn.disabled = false;
                proceedToCheckoutBtn.classList.remove('disabled');
                proceedToCheckoutBtn.textContent = 'Proceed to Checkout';
            }
        }
    }

    // Setup cart icon click handler
    setupCartIcon() {
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.cart.length > 0) {
                    this.showCartPopup();
                } else {
                    this.showNotification('Your cart is empty!', 'info');
                }
            });
        }
    }

    // Setup cart popup functionality
    setupCartPopup() {
        const cartPopupOverlay = document.getElementById('cartPopupOverlay');
        const closeCartBtn = document.getElementById('closeCartBtn');
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

        // Close cart popup
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => this.hideCartPopup());
        }

        // Continue shopping
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => this.hideCartPopup());
        }

        // Proceed to checkout - only enabled when cart has items
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', () => {
                if (this.cart.length > 0) {
                    window.location.href = 'checkout.html';
                } else {
                    this.showNotification('Your cart is empty! Please add items before checkout.', 'warning');
                }
            });
        }

        // Close popup when clicking outside
        if (cartPopupOverlay) {
            cartPopupOverlay.addEventListener('click', (e) => {
                if (e.target === cartPopupOverlay) {
                    this.hideCartPopup();
                }
            });
        }

        // Close popup with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && cartPopupOverlay && cartPopupOverlay.classList.contains('active')) {
                this.hideCartPopup();
            }
        });
    }

    // Setup add to cart buttons
    setupAddToCartButtons() {
        const addToCartButtons = document.querySelectorAll('[data-add-to-cart="true"], .add-to-cart-btn, #add-to-cart-btn');
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.addToCart(button);
            });
        });
    }

    // Add item to cart
    addToCart(button) {
        let productId, productName, productPrice, productImage;

        // Handle different button types
        if (button.id === 'add-to-cart-btn') {
            // Product details page
            const productTitle = document.querySelector('.product-title');
            const productPriceElement = document.querySelector('.product-price .current-price');
            const productImageElement = document.querySelector('.product-image img');
            
            productId = this.generateProductId();
            productName = productTitle ? productTitle.textContent : 'Product';
            productPrice = productPriceElement ? parseFloat(productPriceElement.textContent.replace(/[^\d]/g, '')) : 0;
            productImage = productImageElement ? productImageElement.src : '';
        } else {
            // Gallery or other pages
            productId = button.getAttribute('data-product-id') || this.generateProductId();
            const productCard = button.closest('.product-card');
            
            if (productCard) {
                const titleElement = productCard.querySelector('.product-title');
                const priceElement = productCard.querySelector('.current-price');
                const imageElement = productCard.querySelector('img');
                const modelViewer = productCard.querySelector('model-viewer');
                
                productName = titleElement ? titleElement.textContent : 'Product';
                productPrice = priceElement ? parseFloat(priceElement.textContent.replace(/[^\d]/g, '')) : 0;
                
                if (imageElement) {
                    productImage = imageElement.src;
                } else if (modelViewer) {
                    // For 3D models, get the specific 3D model image
                    productImage = this.get3DModelImage(productCard);
                }
            } else {
                productName = button.textContent.replace('Add to Cart', '').trim() || 'Product';
                productPrice = 0;
                productImage = '';
            }
        }

        // Check if item already exists in cart
        const existingItemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex > -1) {
            this.cart[existingItemIndex].quantity += 1;
        } else {
            this.cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            });
        }

        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(this.cart));
        
        // Update cart count
        this.updateCartCount();
        
        // Show success message
        this.showNotification(`${productName} added to cart!`, 'success');
        
        // Add animation effect
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    // Generate unique product ID
    generateProductId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Get 3D model image for cart items
    get3DModelImage(productCard) {
        // Get the model-viewer element to check the 3D model source
        const modelViewer = productCard.querySelector('model-viewer');
        if (!modelViewer) {
            return this.create3DIcon(); // Fallback to 3D icon
        }

        // Get the 3D model source file name
        const modelSrc = modelViewer.getAttribute('src');
        const productName = productCard.querySelector('.product-title')?.textContent.toLowerCase() || '';

        // Map 3D models to their corresponding images
        const modelImageMap = {
            // Modern Sofa (no_43.glb) -> image/1.png
            'no_43.glb': 'image/1.png',
            // Sofa Chair (sofa_chair.glb) -> image/4.png
            'sofa_chair.glb': 'image/4.png',
            // Low Poly Modern Sofa (low_poly_modern_sofa_free_model.glb) -> image/2.png
            'low_poly_modern_sofa_free_model.glb': 'image/2.png',
            // Old Sofa (old_sofa_free.glb) -> image/3.png
            'old_sofa_free.glb': 'image/3.png',
            // Leather Sofa Stool (free_leather_sofa_stool.glb) -> image/5.png
            'free_leather_sofa_stool.glb': 'image/5.png',
            // White Chair (white_chair.glb) -> image/6.png
            'white_chair.glb': 'image/6.png',
            // Simple Modern Chair (simple_modern_chair_free_model.glb) -> image/7.png
            'simple_modern_chair_free_model.glb': 'image/7.png',
            // Modern Table (table_mr_ft.glb) -> image/8.png
            'table_mr_ft.glb': 'image/8.png'
        };

        // Extract the filename from the model source
        const fileName = modelSrc.split('/').pop();
        
        // Check if we have a mapping for this model
        if (fileName && modelImageMap[fileName]) {
            return modelImageMap[fileName];
        }

        // Fallback: try to match by product name if filename doesn't match
        if (productName.includes('modern sofa') || productName.includes('sofa')) {
            return 'image/1.png';
        } else if (productName.includes('sofa chair')) {
            return 'image/4.png';
        } else if (productName.includes('low poly')) {
            return 'image/2.png';
        } else if (productName.includes('old sofa')) {
            return 'image/3.png';
        } else if (productName.includes('stool')) {
            return 'image/5.png';
        } else if (productName.includes('white chair')) {
            return 'image/6.png';
        } else if (productName.includes('modern chair')) {
            return 'image/7.png';
        } else if (productName.includes('table')) {
            return 'image/8.png';
        }

        // Final fallback to 3D icon
        return this.create3DIcon();
    }

    // Create 3D icon for cart items (fallback)
    create3DIcon() {
        // Create a simple 3D cube icon using SVG data URL
        const svg = `
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="8" fill="#F8F8F8"/>
                <path d="M30 15L10 30V25L30 10V55L30 30L30 15Z" fill="#D2691E"/>
                <path d="M30 15L50 30V25L30 10V55L30 30L30 15Z" fill="#CD853F"/>
                <path d="M10 30L50 30L30 45L10 30Z" fill="#8B4513"/>
                <text x="30" y="35" text-anchor="middle" font-family="Arial" font-size="8" fill="#333">3D</text>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    // Show cart popup
    showCartPopup() {
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const cartTotalPrice = document.getElementById('cartTotalPrice');
        const cartPopupOverlay = document.getElementById('cartPopupOverlay');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');
        
        if (cartItemsContainer && cartTotalPrice) {
            if (this.cart.length === 0) {
                cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty</div>';
                cartTotalPrice.textContent = '₹0';
                
                // Disable checkout button when cart is empty
                if (proceedToCheckoutBtn) {
                    proceedToCheckoutBtn.disabled = true;
                    proceedToCheckoutBtn.classList.add('disabled');
                    proceedToCheckoutBtn.textContent = 'Cart Empty';
                }
            } else {
                this.renderCartItems(cartItemsContainer);
                this.updateCartTotal(cartTotalPrice);
                
                // Add clear cart button
                const clearCartBtn = document.createElement('button');
                clearCartBtn.className = 'clear-cart-btn';
                clearCartBtn.textContent = 'Clear Cart';
                clearCartBtn.onclick = () => this.clearCart();
                cartItemsContainer.appendChild(clearCartBtn);
                
                // Enable checkout button when cart has items
                if (proceedToCheckoutBtn) {
                    proceedToCheckoutBtn.disabled = false;
                    proceedToCheckoutBtn.classList.remove('disabled');
                    proceedToCheckoutBtn.textContent = 'Proceed to Checkout';
                }
            }
        }
        
        if (cartPopupOverlay) {
            cartPopupOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide cart popup
    hideCartPopup() {
        const cartPopupOverlay = document.getElementById('cartPopupOverlay');
        if (cartPopupOverlay) {
            cartPopupOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    // Render cart items
    renderCartItems(container) {
        container.innerHTML = '';
        
        this.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            
            // Check if this is a 3D model item (has 3D image path or specific pattern)
            const is3DModel = item.image && (item.image.includes('image/1.png') || item.image.includes('image/2.png') || item.image.includes('image/3.png') || item.image.includes('image/4.png') || item.image.includes('image/5.png') || item.image.includes('image/6.png') || item.image.includes('image/7.png') || item.image.includes('image/8.png') || item.name.toLowerCase().includes('3d'));
            
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" 
                     onerror="this.src='image/1.png'"
                     style="${is3DModel ? 'background: #f8f8f8; border-radius: 8px;' : ''}">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="cartPopupSystem.updateQuantity('${item.id}', -1)">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="cartPopupSystem.updateQuantity('${item.id}', 1)">+</button>
                    </div>
                </div>
                <button class="remove-item-btn" onclick="cartPopupSystem.removeFromCart('${item.id}')">Remove</button>
            `;
            container.appendChild(cartItem);
        });
    }

    // Update cart total
    updateCartTotal(totalElement) {
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalElement.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    // Update quantity
    updateQuantity(productId, change) {
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            this.cart[itemIndex].quantity += change;
            
            if (this.cart[itemIndex].quantity <= 0) {
                this.cart.splice(itemIndex, 1);
            }
            
            localStorage.setItem('cart', JSON.stringify(this.cart));
            this.updateCartCount();
            
            // Refresh cart popup if open
            const cartPopupOverlay = document.getElementById('cartPopupOverlay');
            if (cartPopupOverlay && cartPopupOverlay.classList.contains('active')) {
                if (this.cart.length === 0) {
                    // Close popup if cart becomes empty
                    this.hideCartPopup();
                    this.showNotification('Cart is now empty', 'info');
                } else {
                    this.showCartPopup();
                }
            }
        }
    }

    // Remove from cart
    removeFromCart(productId) {
        const removedItem = this.cart.find(item => item.id === productId);
        this.cart = this.cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
        
        // Refresh cart popup if open
        const cartPopupOverlay = document.getElementById('cartPopupOverlay');
        if (cartPopupOverlay && cartPopupOverlay.classList.contains('active')) {
            if (this.cart.length === 0) {
                // Close popup if cart becomes empty
                this.hideCartPopup();
                this.showNotification('Cart is now empty', 'info');
            } else {
                this.showCartPopup();
            }
        }
        
        if (removedItem) {
            this.showNotification(`${removedItem.name} removed from cart!`, 'info');
        }
    }

    // Clear entire cart
    clearCart() {
        this.cart = [];
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
        this.hideCartPopup();
        this.showNotification('Cart cleared successfully', 'success');
    }

    // Show notification
    showNotification(message, type = 'info') {
        
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add SVG icon based on type
        let iconSvg = '';
        switch(type) {
            case 'success':
                iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
                break;
            case 'error':
                iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
                break;
            case 'warning':
                iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
                break;
            case 'info':
            default:
                iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
                break;
        }
        
        notification.innerHTML = `
            <span style="flex-shrink: 0;">${iconSvg}</span>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Force reflow to ensure animation works
        notification.offsetHeight;
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
        
        // Allow manual close on click
        notification.addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
}

// Initialize cart popup system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartPopupSystem = new CartPopupSystem();
}); 