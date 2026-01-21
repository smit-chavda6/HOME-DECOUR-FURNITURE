// Product Details Page - Consolidated Working Version
console.log("Product Details JS loaded");

let currentProduct = null;
let productQuantity = 1;

// Initialize on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeProductDetails);
} else {
    initializeProductDetails();
}

async function initializeProductDetails() {
    console.log("Initializing product details...");
    
    try {
        await waitForCartSystem();
        
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get("id");
        
        if (!productId) {
            showProductNotFound("No product ID provided");
            return;
        }
        
        console.log("Product ID from URL:", productId);
        
        const response = await fetch(`/api/products/${productId}`, {
            credentials: "include"
        });
        
        if (!response.ok) {
            console.error("Product fetch failed with status:", response.status);
            showProductNotFound("Product not found");
            return;
        }
        
        const data = await response.json();
        const product = data.product;
        
        if (!product) {
            showProductNotFound("Product data is empty");
            return;
        }
        
        console.log("Product loaded:", product);
        currentProduct = product;
        
        displayProductDetails(product);
        initializeEventListeners();
        
        if (typeof window.initializeReviews === "function") {
            try {
                await window.initializeReviews(productId);
            } catch (reviewError) {
                console.warn("Reviews failed to load:", reviewError);
            }
        }
        
    } catch (error) {
        console.error("Error initializing product details:", error);
        showProductNotFound("Error loading product: " + error.message);
    }
}

function waitForCartSystem() {
    return new Promise((resolve) => {
        if (window.cartPopupSystem) {
            resolve();
            return;
        }
        
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.cartPopupSystem) {
                clearInterval(checkInterval);
                resolve();
            }
            if (attempts > 20) {
                clearInterval(checkInterval);
                console.warn("CartPopupSystem not available");
                resolve();
            }
        }, 100);
    });
}

function displayProductDetails(product) {
    console.log("Displaying product details for:", product.name);
    
    document.title = `${product.name} - HOME DECOR FURNITURE`;
    
    const breadcrumb = document.getElementById("breadcrumb-product-name");
    if (breadcrumb) breadcrumb.textContent = product.name;
    
    const nameEl = document.getElementById("product-name");
    if (nameEl) nameEl.textContent = product.name;
    
    const priceEl = document.getElementById("product-price");
    if (priceEl) {
        priceEl.textContent = `₹${Number(product.price || 0).toLocaleString("en-IN")}`;
    }
    
    const originalPriceEl = document.getElementById("original-price");
    if (originalPriceEl && product.original_price) {
        originalPriceEl.textContent = `₹${Number(product.original_price).toLocaleString("en-IN")}`;
        originalPriceEl.style.display = "inline";
    } else if (originalPriceEl) {
        originalPriceEl.style.display = "none";
    }
    
    const discountEl = document.getElementById("discount-badge");
    if (discountEl && product.discount) {
        discountEl.textContent = `-${product.discount}%`;
        discountEl.style.display = "inline";
    } else if (discountEl) {
        discountEl.style.display = "none";
    }
    
    const mediaContainer = document.getElementById("media-container");
    if (mediaContainer) {
        mediaContainer.innerHTML = "";
        
        if (product.is_3d && product.model_src) {
            const modelViewer = document.createElement("model-viewer");
            modelViewer.setAttribute("src", product.model_src);
            modelViewer.setAttribute("alt", product.name);
            modelViewer.setAttribute("camera-controls", "");
            modelViewer.setAttribute("auto-rotate", "");
            modelViewer.setAttribute("ar", "");
            modelViewer.style.width = "100%";
            modelViewer.style.height = "400px";
            modelViewer.style.borderRadius = "12px";
            mediaContainer.appendChild(modelViewer);
            
            const viewInRoomBtn = document.getElementById("view-in-room-btn");
            if (viewInRoomBtn) viewInRoomBtn.style.display = "flex";
        } else if (product.image) {
            const img = document.createElement("img");
            img.src = product.image;
            img.alt = product.name;
            img.style.width = "100%";
            img.style.borderRadius = "12px";
            img.onerror = function() {
                this.src = "image/Logo maker project.webp";
            };
            mediaContainer.appendChild(img);
        } else {
            const img = document.createElement("img");
            img.src = "image/Logo maker project.webp";
            img.alt = "Product image";
            img.style.width = "100%";
            img.style.borderRadius = "12px";
            mediaContainer.appendChild(img);
        }
    }
    
    const descEl = document.getElementById("product-description");
    if (descEl) {
        if (product.description && product.description.trim()) {
            descEl.textContent = product.description;
        } else {
            descEl.innerHTML = `<p style="color:#999;font-style:italic;margin-bottom:15px;">No description available.</p><button class="btn primary btn-sm" id="generate-description-btn" style="padding:8px 16px;font-size:13px;">Generate AI Description</button>`;
            
            setTimeout(() => {
                const generateBtn = document.getElementById("generate-description-btn");
                if (generateBtn) {
                    generateBtn.addEventListener("click", () => generateAIDescription(product));
                }
            }, 100);
        }
    }
    
    const materialEl = document.getElementById("product-material");
    if (materialEl) materialEl.textContent = product.material || "-";
    
    const dimEl = document.getElementById("product-dimensions");
    if (dimEl) dimEl.textContent = product.dimensions || "-";
    
    const weightEl = document.getElementById("product-weight");
    if (weightEl) weightEl.textContent = product.weight || "-";
    
    const colorEl = document.getElementById("product-color");
    if (colorEl) colorEl.textContent = product.color || "-";
    
    const warrantyEl = document.getElementById("product-warranty");
    if (warrantyEl) warrantyEl.textContent = product.warranty || "2 Years";
    
    const ratingVal = product.rating || 0;
    const ratingCountVal = product.rating_count || 0;
    
    // Update rating stars display with real data
    const starsContainer = document.querySelector(".product-rating .stars");
    if (starsContainer) {
        const fullStars = Math.floor(ratingVal);
        const hasHalfStar = ratingVal % 1 >= 0.5;
        starsContainer.innerHTML = "";
        
        for (let i = 0; i < 5; i++) {
            const star = document.createElement("span");
            star.className = "star";
            if (i < fullStars) {
                star.classList.add("filled");
                star.textContent = "★";
            } else if (i === fullStars && hasHalfStar) {
                star.classList.add("half");
                star.textContent = "★";
            } else {
                star.textContent = "★";
            }
            starsContainer.appendChild(star);
        }
    }
    
    const ratingCountEl = document.querySelector(".rating-count");
    if (ratingCountEl) {
        ratingCountEl.textContent = `(${ratingVal.toFixed(1)}/5)`;
    }
    const reviewCountEl = document.querySelector(".review-count");
    if (reviewCountEl) {
        reviewCountEl.textContent = `• ${ratingCountVal} reviews`;
    }
    
    console.log("Product details displayed successfully");
}

function initializeEventListeners() {
    // Initialize tab navigation
    initializeTabNavigation();
    
    const quantityInput = document.getElementById("quantity");
    const decreaseBtn = document.getElementById("decrease-btn");
    const increaseBtn = document.getElementById("increase-btn");
    const addToCartBtn = document.getElementById("add-to-cart-btn");
    const contactBtn = document.getElementById("contact-btn");
    const viewInRoomBtn = document.getElementById("view-in-room-btn");
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener("click", () => {
            if (quantityInput && parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
                productQuantity = parseInt(quantityInput.value);
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener("click", () => {
            if (quantityInput && parseInt(quantityInput.value) < 10) {
                quantityInput.value = parseInt(quantityInput.value) + 1;
                productQuantity = parseInt(quantityInput.value);
            }
        });
    }
    
    if (quantityInput) {
        quantityInput.addEventListener("change", () => {
            let val = parseInt(quantityInput.value) || 1;
            if (val < 1) val = 1;
            if (val > 10) val = 10;
            quantityInput.value = val;
            productQuantity = val;
        });
    }
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener("click", () => {
            addToCart();
        });
    }
    
    if (contactBtn) {
        contactBtn.addEventListener("click", () => {
            if (currentProduct) {
                window.location.href = `contact.html?product=${encodeURIComponent(currentProduct.name)}`;
            }
        });
    }
    
    if (viewInRoomBtn) {
        viewInRoomBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (!currentProduct || !currentProduct.model_src) {
                if (window.cartPopupSystem) {
                    window.cartPopupSystem.showNotification("3D model not available for this product", "warning");
                } else {
                    alert("3D model not available for this product");
                }
                return;
            }
            const modelViewer = document.querySelector("model-viewer");
            if (modelViewer && modelViewer.canActivateAR) {
                try {
                    modelViewer.activateAR();
                    return;
                } catch (e) {
                    console.warn("AR activation failed, falling back to modal:", e);
                }
            }
            // Fallback: open modal with 3D viewer
            showProductARExperience(currentProduct.name || "Product", String(currentProduct.model_src).replace(/\s/g, "%20"), currentProduct.id || currentProduct._id);
        });
    }
}

function addToCart() {
    if (!currentProduct) {
        alert("Product data not available");
        return;
    }
    
    const quantity = productQuantity;
    
    if (window.cartPopupSystem && typeof window.cartPopupSystem.addToCartFromProductDetails === "function") {
        try {
            window.cartPopupSystem.addToCartFromProductDetails(currentProduct, quantity);
            const quantityInput = document.getElementById("quantity");
            if (quantityInput) {
                quantityInput.value = 1;
                productQuantity = 1;
            }
            return;
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    }
    
    const cartItem = {
        id: currentProduct.id || currentProduct._id,
        name: currentProduct.name,
        price: currentProduct.price,
        // Use product image if available; otherwise fall back for 3D models
        image: (currentProduct.image && String(currentProduct.image).trim())
            ? currentProduct.image
            : (currentProduct.is_3d ? "image/Logo maker project.webp" : "image/Logo maker project.webp"),
        quantity: quantity,
        // Preserve 3D flags and source so checkout can render appropriate thumbnails
        is_3d: !!currentProduct.is_3d,
        model_src: currentProduct.model_src || null
    };
    
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find(item => item.id === cartItem.id);
    
    if (existingItem) {
        existingItem.quantity += cartItem.quantity;
    } else {
        cart.push(cartItem);
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    
    if (window.cartPopupSystem && typeof window.cartPopupSystem.updateCartCount === "function") {
        window.cartPopupSystem.updateCartCount();
    }
    
    showNotification(`${currentProduct.name} added to cart!`);
    
    const quantityInput = document.getElementById("quantity");
    if (quantityInput) {
        quantityInput.value = 1;
        productQuantity = 1;
    }
}

function showNotification(message) {
    if (window.cartPopupSystem && window.cartPopupSystem.showNotification) {
        window.cartPopupSystem.showNotification(message, "success");
        return;
    }
    
    const notification = document.createElement("div");
    notification.style.cssText = "position:fixed;top:80px;right:20px;background:#D2691E;color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:10000;font-weight:500;";
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");
    
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const tabName = button.getAttribute("data-tab");
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabPanes.forEach(pane => pane.classList.remove("active"));
            
            // Add active class to clicked button
            button.classList.add("active");
            
            // Show corresponding pane
            const activePane = document.getElementById(`${tabName}-tab`);
            if (activePane) {
                activePane.classList.add("active");
            }
        });
    });
}

function showProductNotFound(message) {
    const container = document.querySelector(".product-details") || document.querySelector("main");
    if (container) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;min-height:60vh;display:flex;align-items:center;justify-content:center;"><div><h1 style="color:#D2691E;margin-bottom:20px;font-size:48px;"> Product Not Found</h1><p style="margin-bottom:30px;font-size:18px;color:#666;">${message}</p><a href="gallery.html" style="display:inline-block;padding:12px 30px;background:#D2691E;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Back to Gallery</a></div></div>`;
    }
}

// Show AR/3D experience in a modal on Product Details page
function showProductARExperience(productTitle, modelSrc, productId) {
    const esc = (s) => String(s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    const modal = document.createElement("div");
    modal.className = "product-ar-modal";
    modal.innerHTML = `
        <div class="product-ar-overlay"></div>
        <div class="product-ar-content">
            <div class="product-ar-header">
                <h3>View ${esc(productTitle)} in Your Room</h3>
                <button class="product-ar-close" aria-label="Close">&times;</button>
            </div>
            <div class="product-ar-body">
                <model-viewer src="${esc(modelSrc)}" alt="${esc(productTitle)}" camera-controls auto-rotate background-color="#121419" ar ar-modes="scene-viewer quick-look webxr" style="width:100%;height:420px;border-radius:1.2rem;box-shadow:0 2px 12px rgba(0,0,0,0.35);"></model-viewer>
                <div class="product-ar-instructions">
                    <h4>How to use AR:</h4>
                    <ol>
                        <li>Point your camera at a flat surface</li>
                        <li>Tap to place the furniture</li>
                        <li>Move around to see different angles</li>
                        <li>Resize and rotate as needed</li>
                    </ol>
                </div>
            </div>
            <div class="product-ar-footer">
                <button class="product-ar-start-btn">Start AR Experience</button>
                <button class="product-ar-close-btn">Close</button>
            </div>
        </div>
    `;

    const styles = document.createElement("style");
    styles.textContent = `
        .product-ar-modal { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; }
        .product-ar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); }
        .product-ar-content { position: relative; background: #fff; border-radius: 20px; padding: 28px; max-width: 640px; width: 92%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: productArModalIn 0.25s ease-out; }
        @keyframes productArModalIn { from { opacity: 0; transform: translateY(-24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .product-ar-header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #f0f0f0; }
        .product-ar-header h3 { margin:0; color:#2c3e50; font-size:1.3rem; font-weight:700; }
        .product-ar-close { background:none; border:none; font-size:2rem; color:#999; cursor:pointer; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition: all 0.3s ease; }
        .product-ar-close:hover { background:#f0f0f0; color:#333; }
        .product-ar-body { margin-bottom: 18px; }
        .product-ar-instructions { margin-top: 16px; padding: 14px; background: linear-gradient(135deg, #fff8f3 0%, #ffe5c1 100%); border-radius: 12px; border-left: 4px solid #8B4513; }
        .product-ar-instructions h4 { margin:0 0 10px 0; color:#2c3e50; font-size:1.05rem; }
        .product-ar-instructions ol { margin:0; padding-left:20px; color:#2c3e50; line-height:1.6; }
        .product-ar-footer { display:flex; gap:12px; justify-content:center; }
        .product-ar-start-btn { padding: 12px 22px; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: none; background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: #fff; box-shadow: 0 4px 15px rgba(139,69,19,0.3); }
        .product-ar-start-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139,69,19,0.4); }
        .product-ar-close-btn { padding: 12px 22px; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: 2px solid #8B4513; background: linear-gradient(135deg, #ffe5c1 0%, #f5e6d3 100%); color: #8B4513; }
        .product-ar-close-btn:hover { background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%); color: #fff; transform: translateY(-2px); }
        @media (max-width: 768px) { .product-ar-content { padding: 20px; margin: 20px; } .product-ar-header h3 { font-size: 1.15rem; } .product-ar-footer { flex-direction: column; } .product-ar-start-btn, .product-ar-close-btn { width: 100%; } }
    `;
    document.head.appendChild(styles);

    const closeModal = () => { try { document.body.classList.remove('no-scroll'); } catch {} modal.remove(); };
    const closeBtn = modal.querySelector('.product-ar-close');
    const overlay = modal.querySelector('.product-ar-overlay');
    const startBtn = modal.querySelector('.product-ar-start-btn');
    const closeFooterBtn = modal.querySelector('.product-ar-close-btn');

    // Append first so we can query the model-viewer inside
    document.body.appendChild(modal);
    try { document.body.classList.add('no-scroll'); } catch {}

    const modelViewer = modal.querySelector('model-viewer');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    closeFooterBtn.addEventListener('click', closeModal);

    startBtn.addEventListener('click', () => {
        if (modelViewer && modelViewer.canActivateAR) {
            try { modelViewer.activateAR(); } catch (e) {
                if (window.cartPopupSystem) {
                    window.cartPopupSystem.showNotification('AR not supported on this device', 'warning');
                } else {
                    alert('AR not supported on this device');
                }
            }
        } else {
            if (window.cartPopupSystem) {
                window.cartPopupSystem.showNotification('AR not supported on this device', 'warning');
            } else {
                alert('AR not supported on this device');
            }
        }
    });
}

async function generateAIDescription(product) {
    const generateBtn = document.getElementById("generate-description-btn");
    const descEl = document.getElementById("product-description");
    
    if (!generateBtn || !descEl) return;
    
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    
    try {
        const templates = [
            `Discover the perfect blend of style and functionality with our ${product.name}. `,
            `Elevate your home decor with the exquisite ${product.name}. `,
            `Transform your living space with our premium ${product.name}. `
        ];
        
        const features = [];
        
        if (product.material) {
            features.push(`Crafted from high-quality ${product.material.toLowerCase()}, this piece combines durability with timeless appeal.`);
        }
        
        if (product.category) {
            const categoryDescriptions = {
                "living": "Perfect for your living room, adding both comfort and sophistication to your space.",
                "bedroom": "Designed to create a serene and stylish bedroom environment.",
                "dining": "Ideal for gathering family and friends, making every meal a special occasion.",
                "office": "Enhances productivity while maintaining professional aesthetics.",
                "3d": "Features cutting-edge 3D visualization for a complete preview before purchase."
            };
            features.push(categoryDescriptions[product.category] || "A versatile addition to any room in your home.");
        }
        
        if (product.brand) {
            features.push(`From the trusted ${product.brand} collection, known for exceptional craftsmanship.`);
        }
        
        features.push("Whether you are furnishing a new space or updating your current decor, this piece offers the perfect balance of form and function.");
        
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        const generatedDesc = randomTemplate + features.join(" ");
        
        descEl.textContent = generatedDesc;
        currentProduct.description = generatedDesc;
        
        if (window.cartPopupSystem && window.cartPopupSystem.showNotification) {
            window.cartPopupSystem.showNotification("Description generated successfully!", "success");
        }
    } catch (error) {
        console.error("Error generating description:", error);
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate AI Description";
        alert("Failed to generate description. Please try again.");
    }
}
