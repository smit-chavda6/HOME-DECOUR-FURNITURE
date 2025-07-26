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
    },
    13: {
        name: 'Modern Minimalist Chair',
        price: 8500,
        image: 'image/quino-al-4SNUcHPiC8c-unsplash.jpg',
        description: 'A sleek, minimalist chair perfect for modern interiors.',
        material: 'Metal, Fabric',
        dimensions: '60cm W x 80cm H x 60cm D',
        weight: '10 kg',
        color: 'Grey',
        warranty: '2 Years'
    },
    14: {
        name: 'Elegant Lounge Chair',
        price: 12000,
        image: 'image/alexander-andrews-JYGnB9gTCls-unsplash.jpg',
        description: 'An elegant lounge chair for stylish living rooms.',
        material: 'Wood, Leather',
        dimensions: '70cm W x 90cm H x 80cm D',
        weight: '12 kg',
        color: 'Brown',
        warranty: '3 Years'
    },
    101: {
        name: 'Modern Sofa 43 (3D Model)',
        price: 4500,
        image: 'image/1.png',
        description: 'Explore this 3D model of a modern sofa, perfect for virtual staging or AR experiences. High-quality geometry and realistic textures.',
        material: '3D Model (GLB)',
        dimensions: 'Virtual',
        weight: '-',
        color: '-',
        warranty: '-',
        features: [
            'High-quality, optimized 3D geometry',
            'Realistic PBR textures (if available)',
            'Ready for AR/VR and virtual staging',
            'Lightweight and easy to use in any project',
            'Compatible with major 3D and AR platforms'
        ]
    },
    102: {
        name: 'Sofa Chair (3D Model)',
        price: 3200,
        image: 'image/2.png',
        description: 'A detailed 3D model of a sofa chair, ideal for AR, VR, or design visualization. Includes textures and optimized mesh.',
        material: '3D Model (GLB)',
        dimensions: 'Virtual',
        weight: '-',
        color: '-',
        warranty: '-',
        features: [
            'Detailed mesh and textures',
            'Optimized for AR/VR',
            'Easy to use in any 3D project',
            'Compatible with major 3D and AR platforms'
        ]
    },
    103: {
        name: 'Low Poly Modern Sofa (3D Model)',
        price: 2500,
        image: 'image/3.png',
        description: 'Low poly 3D model of a modern sofa, suitable for games, AR, or quick visualizations. Lightweight and easy to use.',
        material: '3D Model (GLB)',
        dimensions: 'Virtual',
        weight: '-',
        color: '-',
        warranty: '-',
        features: [
            'Low poly, lightweight mesh',
            'Ideal for games and AR',
            'Quick to load and render',
            'Compatible with major 3D and AR platforms'
        ]
    },
    104: {
        name: 'Old Sofa (3D Model)',
        price: 2900,
        image: 'image/4.png',
        description: 'A classic old sofa 3D model, perfect for vintage scenes or AR/VR projects. Includes detailed mesh and textures.',
        material: '3D Model (GLB)',
        dimensions: 'Virtual',
        weight: '-',
        color: '-',
        warranty: '-',
        features: [
            'Classic/vintage design',
            'Detailed mesh and textures',
            'Ready for AR/VR and virtual staging',
            'Compatible with major 3D and AR platforms'
        ]
    },
    105: {
        name: 'Leather Sofa Stool (3D Model)',
        price: 3200,
        image: 'image/5.png',
        description: 'A 3D model of a leather sofa stool, perfect for AR/VR.',
        material: '3D Model (GLB)',
        dimensions: 'Virtual',
        weight: '-',
        color: '-',
        warranty: '-',
        features: [
            'High-quality 3D geometry',
            'Realistic textures',
            'Ready for AR/VR',
            'Compatible with major 3D platforms'
        ]
    },
    106: {
        name: 'White Chair (3D Model)',
        price: 4500,
        image: 'image/6.png',
        description: 'A 3D model of a white chair, ideal for modern spaces.',
        material: '3D Model (GLB)',
        dimensions: 'Virtual',
        weight: '-',
        color: '-',
        warranty: '-',
        features: [
            'Detailed mesh',
            'Optimized for AR/VR',
            'Easy to use in any 3D project',
            'Compatible with major 3D and AR platforms'
        ]
    },
    107: {
        name: 'Simple Modern Chair (3D Model)',
        price: 2800,
        image: 'image/7.png',
        description: 'A simple modern chair 3D model for visualization.',
        material: '3D Model (GLB)',
        dimensions: 'Virtual',
        weight: '-',
        color: '-',
        warranty: '-',
        features: [
            'Low poly, lightweight',
            'Ideal for games and AR',
            'Quick to load and render',
            'Compatible with major 3D and AR platforms'
        ]
    },
    108: {
        name: 'Modern Table (3D Model)',
        price: 5200,
        image: 'image/8.png',
        description: 'A modern table 3D model for AR/VR and design projects.',
        material: '3D Model (GLB)',
        dimensions: 'Virtual',
        weight: '-',
        color: '-',
        warranty: '-',
        features: [
            'Modern design',
            'Detailed mesh and textures',
            'Ready for AR/VR',
            'Compatible with major 3D and AR platforms'
        ]
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
        if (!cachedElements.productName) {
            cachedElements.productName = document.getElementById('product-name');
            cachedElements.productPrice = document.getElementById('product-price');
            cachedElements.productDescription = document.getElementById('product-description');
            cachedElements.productMaterial = document.getElementById('product-material');
            cachedElements.productDimensions = document.getElementById('product-dimensions');
            cachedElements.productWeight = document.getElementById('product-weight');
            cachedElements.productColor = document.getElementById('product-color');
            cachedElements.productWarranty = document.getElementById('product-warranty');
            cachedElements.mediaContainer = document.getElementById('media-container');
        }
        // Render media (image or 3D model)
        if ([101,102,103,104,105,106,107,108].includes(productId)) {
            // 3D Model: use model-viewer
            let modelSrc = '';
            if (productId === 101) modelSrc = '3d models/no_43.glb';
            if (productId === 102) modelSrc = '3d models/sofa_chair.glb';
            if (productId === 103) modelSrc = '3d models/low_poly_modern_sofa_free_model.glb';
            if (productId === 104) modelSrc = '3d models/old_sofa_free.glb';
            if (productId === 105) modelSrc = '3d models/free_leather_sofa_stool.glb';
            if (productId === 106) modelSrc = '3d models/white_chair.glb';
            if (productId === 107) modelSrc = '3d models/simple_modern_chair_free_model.glb';
            if (productId === 108) modelSrc = '3d models/table_mr_ft.glb';
            cachedElements.mediaContainer.innerHTML = `
                <model-viewer id="product-model-viewer" src="${modelSrc}" alt="${product.name}" camera-controls auto-rotate background-color="#fff8f3" ar ar-modes="scene-viewer quick-look webxr" style="width:100%;height:320px;border-radius:1.2rem;box-shadow:0 2px 12px #ffe5c1aa;margin-bottom:1rem;"></model-viewer>
            `;
        } else {
            // Standard product: show image and zoom button
            cachedElements.mediaContainer.innerHTML = `
                <img id="product-img" src="${product.image}" alt="${product.name}" loading="lazy">
                <button class="zoom-btn" id="zoom-btn" title="View Full Size">
                    <svg viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                </button>
            `;
        }
        
        // Update product information
        cachedElements.productName.textContent = product.name;
        cachedElements.productPrice.textContent = typeof product.price === 'number' ? `₹${product.price.toLocaleString('en-IN')}` : product.price;
        cachedElements.productDescription.textContent = product.description;
        cachedElements.productMaterial.textContent = product.material;
        cachedElements.productDimensions.textContent = product.dimensions;
        cachedElements.productWeight.textContent = product.weight;
        cachedElements.productColor.textContent = product.color;
        cachedElements.productWarranty.textContent = product.warranty;
        // Render features (for both standard and 3D model products)
        const featuresList = document.querySelector('.features-list');
        if (featuresList) {
            featuresList.innerHTML = '';
            const features = product.features || [
                'Premium Quality',
                'Durable Construction',
                'Elegant Design',
                'Easy Assembly'
            ];
            features.forEach(f => {
                const div = document.createElement('div');
                div.className = 'feature-item';
                div.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span>${f}</span>`;
                featuresList.appendChild(div);
            });
        }
        
        // Initialize cart count
        updateCartCount();
        
        // Initialize quantity controls
        initializeQuantityControls();
        
        // Initialize zoom functionality (only for standard products)
        if (![101,102,103,104].includes(productId)) {
            initializeZoomFunctionality();
        }
        
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
                ${cartItems.map(item => {
                    // Always use the latest image from productData if available
                    const latest = productData[item.id];
                    const imgSrc = latest && latest.image ? latest.image : item.image;
                    return `
                    <div class="cart-item">
                        <img src="${imgSrc}" alt="${item.name}" loading="lazy">
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>₹${item.price.toLocaleString('en-IN')} x ${item.quantity}</p>
                            <p class="cart-item-total">₹${(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                        <button class="cart-item-remove" data-id="${item.id}">&times;</button>
                    </div>
                `; 
                }).join('')}
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
    // Remove any existing notification first
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(existing)) {
                document.body.removeChild(existing);
            }
        }, 300);
    }
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