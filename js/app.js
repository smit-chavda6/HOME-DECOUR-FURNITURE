// Modern Navbar JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navbarMenu = document.querySelector('.navbar-menu');
    const cartCount = document.querySelector('.cart-count');
    
    // Initialize cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Hamburger menu functionality
    if (hamburger && navbarMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link (improved for mobile)
        const navbarLinks = document.querySelectorAll('.navbar-link');
        navbarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    hamburger.classList.remove('active');
                    navbarMenu.classList.remove('active');
                }
            });
        });
    }
    
    // Scroll effect for navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Function to update cart count
    function updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }
    
    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.btn-primary, .add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Check if this is a product page button
            if (button.id === 'add-to-cart-btn') {
                // This will be handled by product-details.js
                return;
            }
            
            // For other pages, add a generic item
            const productName = button.getAttribute('data-product-name') || 'Furniture Item';
            const productPrice = parseFloat(button.getAttribute('data-product-price')) || 24900;
            const productImage = button.getAttribute('data-product-image') || 'image/toa-heftiba-FV3GConVSss-unsplash.webp';
            
            // Check if item already exists in cart
            const existingItemIndex = cart.findIndex(item => item.name === productName);
            
            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({
                    id: Date.now(), // Generate unique ID
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
            }
            
            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update cart count
            updateCartCount();
            
            // Add animation effect
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
            
            // Show success message
            showNotification('Item added to cart!');
        });
    });
    
    // Cart icon click handler
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            if (cart.length > 0) {
                const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                showCartModal(cart, total);
            } else {
                showNotification('Your cart is empty', 'info');
            }
        });
    }
    
    // Cart modal functionality
    function showCartModal(cartItems, total) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.cart-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'cart-modal';
        modal.innerHTML = `
            <div class="cart-modal-overlay"></div>
            <div class="cart-modal-content">
                <div class="cart-modal-header">
                    <h3>Shopping Cart</h3>
                    <button class="cart-modal-close">&times;</button>
                </div>
                <div class="cart-modal-body">
                    ${cartItems.length === 0 ? '<p>Your cart is empty</p>' : ''}
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
                ${cartItems.length > 0 ? `
                    <div class="cart-modal-footer">
                        <div class="cart-total">
                            <strong>Total: ₹${total.toLocaleString('en-IN')}</strong>
                        </div>
                        <div class="cart-actions">
                            <button class="btn-secondary cart-clear">Clear Cart</button>
                            <button class="btn-primary cart-checkout">Checkout</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add modal styles
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
    }
    
    // Notification function
    function showNotification(message, type = 'success') {
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Initialize cart count
    updateCartCount();
    
    // Active page highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navbarLinks = document.querySelectorAll('.navbar-link');
    
    navbarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target) && navbarMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
        }
    });
    
    // Keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navbarMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
        }
    });
}); 