const furnitureData = [
    {
        id: 1,
        name: 'Comfortable Sofa',
        price: 499.99,
        image: 'image/toa-heftiba-FV3GConVSss-unsplash.jpg',
        dimensions: { width: 200, height: 90, depth: 100 }
    },
    {
        id: 2,
        name: 'Modern Armchair',
        price: 249.99,
        image: 'image/becca-tapert-dO3qTKxwik0-unsplash.jpg',
        dimensions: { width: 80, height: 100, depth: 90 }
    },
    {
        id: 3,
        name: 'Wooden Coffee Table',
        price: 149.99,
        image: 'image/christopher-jolly-GqbU78bdJFM-unsplash.jpg',
        dimensions: { width: 120, height: 45, depth: 60 }
    },
    {
        id: 4,
        name: 'Dining Table',
        price: 399.99,
        image: 'image/davide-cantelli-ajisKc2uuFk-unsplash.jpg',
        dimensions: { width: 180, height: 75, depth: 90 }
    },
    {
        id: 5,
        name: 'Bookshelf',
        price: 199.99,
        image: 'image/denys-striyeshyn-wJ7yGwz2-00-unsplash.jpg',
        dimensions: { width: 90, height: 180, depth: 30 }
    },
    {
        id: 6,
        name: 'Queen Size Bed',
        price: 599.99,
        image: 'image/hutomo-abrianto-X5BWooeO4Cw-unsplash.jpg',
        dimensions: { width: 160, height: 120, depth: 200 }
    },
    {
        id: 7,
        name: 'Office Chair',
        price: 129.99,
        image: 'image/inside-weather-Uxqlfigh6oE-unsplash.jpg',
        dimensions: { width: 60, height: 110, depth: 65 }
    },
    {
        id: 8,
        name: 'Side Table',
        price: 89.99,
        image: 'image/kari-shea-AMyjxxLEHU4-unsplash.jpg',
        dimensions: { width: 50, height: 60, depth: 50 }
    },
    {
        id: 9,
        name: 'Dresser',
        price: 349.99,
        image: 'image/kari-shea-ItMggD0EguY-unsplash.jpg',
        dimensions: { width: 140, height: 90, depth: 50 }
    },
    {
        id: 10,
        name: 'Bar Stool',
        price: 79.99,
        image: 'image/kari-shea-tOVmshavtoo-unsplash.jpg',
        dimensions: { width: 40, height: 105, depth: 40 }
    },
    {
        id: 11,
        name: 'L-shaped Sofa',
        price: 899.99,
        image: 'image/kirill-9uH-hM0VwPg-unsplash.jpg',
        dimensions: { width: 250, height: 90, depth: 160 }
    },
    {
        id: 12,
        name: 'Accent Chair',
        price: 199.99,
        image: 'image/olena-bohovyk-gxKL334bUK4-unsplash.jpg',
        dimensions: { width: 70, height: 85, depth: 80 }
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const galleryContainer = document.querySelector('.gallery-container');

    function renderGallery(items) {
        galleryContainer.innerHTML = '';
        items.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.dataset.id = item.id;
            galleryItem.dataset.width = item.dimensions.width;
            galleryItem.dataset.height = item.dimensions.height;
            galleryItem.dataset.depth = item.dimensions.depth;

            galleryItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p class="price">$${item.price.toFixed(2)}</p>
                <button class="add-to-wishlist"><i class="fas fa-heart"></i> Add to Wishlist</button>
            `;
            galleryContainer.appendChild(galleryItem);
        });
    }

    renderGallery(furnitureData);

    // Size Filter
    const sizeFilter = document.getElementById('size-filter');
    sizeFilter.addEventListener('submit', (e) => {
        e.preventDefault();
        const maxWidth = document.getElementById('max-width').value;
        const maxHeight = document.getElementById('max-height').value;
        const maxDepth = document.getElementById('max-depth').value;

        const filteredData = furnitureData.filter(item => {
            return (!maxWidth || item.dimensions.width <= maxWidth) &&
                   (!maxHeight || item.dimensions.height <= maxHeight) &&
                   (!maxDepth || item.dimensions.depth <= maxDepth);
        });
        renderGallery(filteredData);
    });

    sizeFilter.addEventListener('reset', () => {
        renderGallery(furnitureData);
    });

    // Wishlist
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const wishlistModal = document.getElementById('wishlist-modal');
    const wishlistToggle = document.getElementById('wishlist-toggle');
    const closeButton = document.querySelector('.close-button');
    const wishlistItemsContainer = document.getElementById('wishlist-items');
    const wishlistCount = document.getElementById('wishlist-count');
    const galleryContainer = document.querySelector('.gallery-container');

    function updateWishlistCount() {
        wishlistCount.textContent = wishlist.length;
    }

    function renderWishlist() {
        wishlistItemsContainer.innerHTML = '';
        if (wishlist.length === 0) {
            wishlistItemsContainer.innerHTML = '<p>Your wishlist is empty.</p>';
            return;
        }
        wishlist.forEach(item => {
            const wishlistItem = document.createElement('div');
            wishlistItem.className = 'wishlist-item';
            wishlistItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <span>${item.name} - $${item.price.toFixed(2)}</span>
                <button class="remove-from-wishlist" data-id="${item.id}">&times;</button>
            `;
            wishlistItemsContainer.appendChild(wishlistItem);
        });
    }

    galleryContainer.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-wishlist')) {
            const galleryItem = e.target.closest('.gallery-item');
            const itemId = parseInt(galleryItem.dataset.id);
            const item = furnitureData.find(i => i.id === itemId);

            if (!wishlist.find(i => i.id === itemId)) {
                wishlist.push(item);
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                updateWishlistCount();
                alert(`${item.name} has been added to your wishlist!`);
            } else {
                alert(`${item.name} is already in your wishlist.`);
            }
        }
    });

    wishlistItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-from-wishlist')) {
            const itemId = parseInt(e.target.dataset.id);
            wishlist = wishlist.filter(i => i.id !== itemId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            renderWishlist();
            updateWishlistCount();
        }
    });

    wishlistToggle.onclick = () => {
        renderWishlist();
        wishlistModal.style.display = 'block';
    }
    closeButton.onclick = () => {
        wishlistModal.style.display = 'none';
    }
    window.onclick = (e) => {
        if (e.target == wishlistModal) {
            wishlistModal.style.display = 'none';
        }
    }
    
    // Budget Planner
    const budgetForm = document.getElementById('budget-form');
    const budgetFeedback = document.getElementById('budget-feedback');
    let budget = JSON.parse(localStorage.getItem('budget')) || 0;

    function updateBudgetFeedback() {
        const wishlistTotal = wishlist.reduce((acc, item) => acc + item.price, 0);
        if (budget > 0) {
            const remaining = budget - wishlistTotal;
            budgetFeedback.innerHTML = `Wishlist Total: $${wishlistTotal.toFixed(2)}. Remaining Budget: $${remaining.toFixed(2)}`;
            budgetFeedback.style.color = remaining < 0 ? 'red' : 'green';
        } else {
            budgetFeedback.innerHTML = '';
        }
    }

    budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        budget = document.getElementById('budget-input').value;
        localStorage.setItem('budget', JSON.stringify(budget));
        updateBudgetFeedback();
    });

    // Initial Load
    updateWishlistCount();
    updateBudgetFeedback();
    wishlistItemsContainer.addEventListener('click', updateBudgetFeedback);
    galleryContainer.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-wishlist')) {
            updateBudgetFeedback();
        }
    });
}); 