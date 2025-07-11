const productData = {
    1: {
        name: 'Comfortable Sofa',
        price: 41500,
        image: 'image/toa-heftiba-FV3GConVSss-unsplash.webp',
        description: 'A luxurious and comfortable sofa perfect for your living room. This elegant piece features premium fabric upholstery and sturdy construction for lasting comfort and style.',
        material: 'Premium Fabric, Solid Wood Frame',
        dimensions: '200cm W x 90cm H x 100cm D',
        weight: '45 kg',
        color: 'Beige',
        warranty: '3 Years'
    },
    2: {
        name: 'Modern Armchair',
        price: 20750,
        image: 'image/becca-tapert-dO3qTKxwik0-unsplash.webp',
        description: 'Contemporary armchair with sleek design and exceptional comfort. Perfect as an accent piece or for creating a cozy reading corner.',
        material: 'Leather, Metal Frame',
        dimensions: '80cm W x 100cm H x 90cm D',
        weight: '25 kg',
        color: 'Brown',
        warranty: '2 Years'
    },
    3: {
        name: 'Wooden Coffee Table',
        price: 12450,
        image: 'image/christopher-jolly-GqbU78bdJFM-unsplash.webp',
        description: 'Handcrafted wooden coffee table with natural finish. Features elegant design and durable construction perfect for any living space.',
        material: 'Solid Oak Wood',
        dimensions: '120cm W x 45cm H x 60cm D',
        weight: '30 kg',
        color: 'Natural Oak',
        warranty: '5 Years'
    },
    4: {
        name: 'Dining Table',
        price: 33200,
        image: 'image/davide-cantelli-ajisKc2uuFk-unsplash.webp',
        description: 'Elegant dining table perfect for family gatherings and dinner parties. Seats 6-8 people comfortably with a timeless design.',
        material: 'Solid Wood, Glass Top',
        dimensions: '180cm W x 75cm H x 90cm D',
        weight: '60 kg',
        color: 'Walnut',
        warranty: '3 Years'
    },
    5: {
        name: 'Bookshelf',
        price: 16600,
        image: 'image/denys-striyeshyn-wJ7yGwz2-00-unsplash.webp',
        description: 'Versatile bookshelf with multiple shelves for organizing books, decorative items, and more. Sturdy construction with adjustable shelves.',
        material: 'Engineered Wood, Metal Hardware',
        dimensions: '90cm W x 180cm H x 30cm D',
        weight: '35 kg',
        color: 'White',
        warranty: '2 Years'
    },
    6: {
        name: 'Queen Size Bed',
        price: 49800,
        image: 'image/hutomo-abrianto-X5BWooeO4Cw-unsplash.webp',
        description: 'Elegant queen-size bed frame with upholstered headboard. Creates a sophisticated bedroom atmosphere with premium materials.',
        material: 'Upholstered Fabric, Wood Frame',
        dimensions: '160cm W x 120cm H x 200cm D',
        weight: '50 kg',
        color: 'Grey',
        warranty: '5 Years'
    },
    7: {
        name: 'Office Chair',
        price: 10790,
        image: 'image/inside-weather-Uxqlfigh6oE-unsplash.webp',
        description: 'Ergonomic office chair designed for comfort during long work hours. Features adjustable height and lumbar support.',
        material: 'Mesh Fabric, Aluminum Base',
        dimensions: '60cm W x 110cm H x 65cm D',
        weight: '15 kg',
        color: 'Black',
        warranty: '1 Year'
    },
    8: {
        name: 'Side Table',
        price: 7470,
        image: 'image/kari-shea-AMyjxxLEHU4-unsplash.webp',
        description: 'Compact side table perfect for holding lamps, books, or drinks. Versatile design that fits any room style.',
        material: 'Solid Wood',
        dimensions: '50cm W x 60cm H x 50cm D',
        weight: '8 kg',
        color: 'Natural',
        warranty: '2 Years'
    },
    9: {
        name: 'Dresser',
        price: 29050,
        image: 'image/kari-shea-ItMggD0EguY-unsplash.webp',
        description: 'Spacious dresser with multiple drawers for organized storage. Classic design with smooth-gliding drawers.',
        material: 'Solid Wood, Brass Hardware',
        dimensions: '140cm W x 90cm H x 50cm D',
        weight: '40 kg',
        color: 'Cherry',
        warranty: '3 Years'
    },
    10: {
        name: 'Bar Stool',
        price: 6640,
        image: 'image/kari-shea-tOVmshavtoo-unsplash.webp',
        description: 'Modern bar stool with comfortable seating and sleek design. Perfect for kitchen islands or home bars.',
        material: 'Fabric Upholstery, Metal Frame',
        dimensions: '40cm W x 105cm H x 40cm D',
        weight: '12 kg',
        color: 'Black',
        warranty: '1 Year'
    },
    11: {
        name: 'L-shaped Sofa',
        price: 74700,
        image: 'image/kirill-9uH-hM0VwPg-unsplash.webp',
        description: 'Spacious L-shaped sofa perfect for large living rooms. Offers maximum seating comfort and contemporary style.',
        material: 'Premium Fabric, Solid Frame',
        dimensions: '250cm W x 90cm H x 160cm D',
        weight: '80 kg',
        color: 'Navy Blue',
        warranty: '5 Years'
    },
    12: {
        name: 'Accent Chair',
        price: 16600,
        image: 'image/olena-bohovyk-gxKL334bUK4-unsplash.webp',
        description: 'Stylish accent chair that adds personality to any room. Comfortable seating with eye-catching design.',
        material: 'Velvet Fabric, Wooden Legs',
        dimensions: '70cm W x 85cm H x 80cm D',
        weight: '18 kg',
        color: 'Emerald Green',
        warranty: '2 Years'
    }
};

// Cart functionality
let cart = [];
let currentProduct = null;

// Initialize cart from localStorage
const initializeCart = () => {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('Cart initialized:', cart);
};

// Cache DOM elements for better performance
let cachedElements = {};

const loadProductDetails = () => {
    // Initialize cart first
    initializeCart();
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    // Get product data
    const product = productData[productId];
    
    if (product) {
        currentProduct = { ...product, id: productId };
        
        // Update page title
        document.title = `${product.name} - HOME DECOR FURNITURE`;
        
        // Cache DOM elements
        if (!cachedElements.productImg) {
            cachedElements.productImg = document.getElementById('product-img');
            cachedElements.productName = document.getElementById('product-name');
            cachedElements.productPrice = document.getElementById('product-price');
            cachedElements.productDescription = document.getElementById('product-description');
            cachedElements.productMaterial = document.getElementById('product-material');
            cachedElements.productDimensions = document.getElementById('product-dimensions');
            cachedElements.productWeight = document.getElementById('product-weight');
            cachedElements.productColor = document.getElementById('product-color');
            cachedElements.productWarranty = document.getElementById('product-warranty');
        }
        
        // Update product image with loading optimization
        cachedElements.productImg.src = product.image;
        cachedElements.productImg.alt = product.name;
        
        // Update product information
        cachedElements.productName.textContent = product.name;
        cachedElements.productPrice.textContent = `₹${product.price.toLocaleString('en-IN')}`;
        cachedElements.productDescription.textContent = product.description;
        cachedElements.productMaterial.textContent = product.material;
        cachedElements.productDimensions.textContent = product.dimensions;
        cachedElements.productWeight.textContent = product.weight;
        cachedElements.productColor.textContent = product.color;
        cachedElements.productWarranty.textContent = product.warranty;
        
        // Initialize cart count
        updateCartCount();
        
        // Initialize quantity controls
        initializeQuantityControls();
        
        // Initialize zoom functionality
        initializeZoomFunctionality();
        
        // Initialize cart functionality
        initializeCartFunctionality();
        
    } else {
        // Handle invalid product ID
        const container = document.querySelector('.product-details .container');
        if (container) {
            container.innerHTML = 
                '<h1>Product Not Found</h1><p>The requested product could not be found.</p><a href="gallery.html">Back to Gallery</a>';
        }
    }
};

// Initialize quantity controls
const initializeQuantityControls = () => {
    const quantityInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    
    if (decreaseBtn && increaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
            updateQuantityButtons();
        });
        
        increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue < 10) {
                quantityInput.value = currentValue + 1;
            }
            updateQuantityButtons();
        });
        
        quantityInput.addEventListener('input', updateQuantityButtons);
        updateQuantityButtons();
    }
};

// Update quantity buttons state
const updateQuantityButtons = () => {
    const quantityInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    
    if (quantityInput && decreaseBtn && increaseBtn) {
        const value = parseInt(quantityInput.value);
        decreaseBtn.disabled = value <= 1;
        increaseBtn.disabled = value >= 10;
    }
};

// Initialize zoom functionality
const initializeZoomFunctionality = () => {
    const zoomBtn = document.getElementById('zoom-btn');
    const imageModal = document.getElementById('image-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalImage = document.getElementById('modal-image');
    const productImg = document.getElementById('product-img');
    
    // Open modal when zoom button is clicked
    if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
            modalImage.src = productImg.src;
            modalImage.alt = productImg.alt;
            imageModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    // Close modal when overlay is clicked
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeImageModal);
    }
    
    // Close modal when close button is clicked
    if (modalClose) {
        modalClose.addEventListener('click', closeImageModal);
    }
    
    // Close modal when Escape key is pressed
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageModal.classList.contains('show')) {
            closeImageModal();
        }
    });
    
    function closeImageModal() {
        imageModal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    if (imageModal) {
        imageModal.setAttribute('role', 'dialog');
        imageModal.setAttribute('aria-modal', 'true');
        imageModal.setAttribute('tabindex', '-1');
    }
};

// Initialize cart functionality
const initializeCartFunctionality = () => {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const contactBtn = document.getElementById('contact-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addToCart();
        });
    }
    
    if (contactBtn) {
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'contact.html';
        });
    }
};

// Add to cart function
const addToCart = () => {
    if (!currentProduct) {
        console.error('No product loaded');
        return;
    }
    
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) {
        console.error('Quantity input not found');
        return;
    }
    
    // Get current cart from localStorage to ensure we have the latest data
    let currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const quantity = parseInt(quantityInput.value) || 1;
    const existingItemIndex = currentCart.findIndex(item => item.id === currentProduct.id);
    
    if (existingItemIndex > -1) {
        // Update existing item quantity
        currentCart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item to cart
        currentCart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image,
            quantity: quantity
        });
    }
    
    // Update the cart variable
    cart = currentCart;
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show success message
    showCartSuccess();
    
    // Add button animation
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            addToCartBtn.style.transform = 'scale(1)';
        }, 150);
    }
    
    console.log('Item added to cart:', currentProduct.name, 'Quantity:', quantity);
    console.log('Updated cart:', cart);
};

// Update cart count
const updateCartCount = () => {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
};

// Show cart success message
const showCartSuccess = () => {
    const successMessage = document.getElementById('cart-success');
    if (successMessage) {
        successMessage.classList.add('show');
        
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 3000);
    }
};

// Cart icon click handler
const initializeCartIcon = () => {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        // Remove any existing event listeners to prevent conflicts
        cartIcon.removeEventListener('click', handleCartClick);
        cartIcon.addEventListener('click', handleCartClick);
    }
};

// Handle cart icon click
const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the latest cart data from localStorage
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
    console.log('Cart clicked, current cart:', currentCart);
    
    if (currentCart.length > 0) {
        // Show cart modal with current cart data
        showCartModal(currentCart);
    } else {
        showNotification('Your cart is empty', 'info');
    }
};

// Show cart modal function
const showCartModal = (cartItems) => {
    // Remove existing modal if any
    const existingModal = document.querySelector('.cart-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="cart-modal-overlay"></div>
        <div class="cart-modal-content">
            <div class="cart-modal-header">
                <h3>Shopping Cart</h3>
                <button class="cart-modal-close">&times;</button>
            </div>
            <div class="cart-modal-body">
                ${cartItems.map(item => `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}" loading="lazy">
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>₹${item.price.toLocaleString('en-IN')} x ${item.quantity}</p>
                            <p class="cart-item-total">₹${(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                        <button class="cart-item-remove" data-id="${item.id}">&times;</button>
                    </div>
                `).join('')}
            </div>
            <div class="cart-modal-footer">
                                        <div class="cart-total">
                            <strong>Total: ₹${total.toLocaleString('en-IN')}</strong>
                        </div>
                <div class="cart-actions">
                    <button class="btn-secondary cart-clear">Clear Cart</button>
                    <button class="btn-primary cart-checkout">Checkout</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles if not already present
    if (!document.querySelector('#cart-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'cart-modal-styles';
        styles.textContent = `
            .cart-modal {
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
            
            .cart-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
            }
            
            .cart-modal-content {
                background: white;
                border-radius: 20px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                position: relative;
                z-index: 1;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .cart-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .cart-modal-header h3 {
                margin: 0;
                color: #2c3e50;
                font-family: 'Jost', sans-serif;
            }
            
            .cart-modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #666;
                padding: 5px;
            }
            
            .cart-modal-body {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .cart-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .cart-item:last-child {
                border-bottom: none;
            }
            
            .cart-item img {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 10px;
            }
            
            .cart-item-details {
                flex: 1;
            }
            
            .cart-item-details h4 {
                margin: 0 0 5px 0;
                color: #2c3e50;
                font-size: 1rem;
            }
            
            .cart-item-details p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
            }
            
            .cart-item-total {
                font-weight: 600;
                color: #8B4513 !important;
            }
            
            .cart-item-remove {
                background: #ff4757;
                color: white;
                border: none;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .cart-modal-footer {
                padding: 20px;
                border-top: 1px solid #f0f0f0;
                background: #f8f9fa;
            }
            
            .cart-total {
                text-align: right;
                margin-bottom: 15px;
                font-size: 1.2rem;
                color: #2c3e50;
            }
            
            .cart-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .cart-actions button {
                padding: 10px 20px;
                border-radius: 25px;
                border: none;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .cart-clear {
                background: #6c757d;
                color: white;
            }
            
            .cart-checkout {
                background: linear-gradient(135deg, #8B4513, #A0522D);
                color: white;
            }
            
            @media (max-width: 768px) {
                .cart-modal-content {
                    width: 95%;
                    margin: 20px;
                }
                
                .cart-actions {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Modal event listeners
    const closeBtn = modal.querySelector('.cart-modal-close');
    const overlay = modal.querySelector('.cart-modal-overlay');
    const clearBtn = modal.querySelector('.cart-clear');
    const checkoutBtn = modal.querySelector('.cart-checkout');
    const removeBtns = modal.querySelectorAll('.cart-item-remove');
    
    // Close modal
    const closeModal = () => modal.remove();
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Remove item
    removeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = parseInt(btn.getAttribute('data-id'));
            cart = cart.filter(item => item.id !== itemId);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            closeModal();
            showNotification('Item removed from cart');
        });
    });
    
    // Clear cart
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            closeModal();
            showNotification('Cart cleared');
        });
    }
    
    // Checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            closeModal();
            showNotification('Redirecting to checkout...', 'info');
            setTimeout(() => {
                window.location.href = 'checkout.html';
            }, 1000);
        });
    }
    
    // Focus trap for modal
    setTimeout(() => {
        const focusable = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) focusable[0].focus();
    }, 100);
};

// Notification function
const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const bgColor = type === 'success' ? '#27ae60' : type === 'info' ? '#3498db' : '#e74c3c';
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// Optimized loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadProductDetails();
        initializeCartIcon();
    });
} else {
    loadProductDetails();
    initializeCartIcon();
} 