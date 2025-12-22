// Reviews System for Product Details Page
console.log('Reviews system loaded');

class ReviewsSystem {
    constructor(productId) {
        this.productId = productId;
        this.reviews = [];
        this.averageRating = 0;
        this.totalReviews = 0;
        this.ratingDistribution = [0, 0, 0, 0, 0];
        this.currentUserReview = null;
        this.isAuthenticated = false;
    }

    async init() {
        // Check if user is authenticated
        await this.checkAuth();
        // Load reviews
        await this.loadReviews();
        // Render reviews (view only on product details page)
        this.renderReviews();
        // Initialize tab navigation
        this.initializeTabs();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/check-auth', { credentials: 'include' });
            const data = await response.json();
            this.isAuthenticated = data.authenticated || false;
            this.currentUser = data.user || null;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.isAuthenticated = false;
        }
    }

    async loadReviews() {
        try {
            const response = await fetch(`/api/products/${this.productId}/reviews`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.error('Failed to load reviews');
                return;
            }

            const data = await response.json();
            this.reviews = data.reviews || [];
            this.averageRating = data.averageRating || 0;
            this.totalReviews = data.totalReviews || 0;
            this.ratingDistribution = data.ratingDistribution || [0, 0, 0, 0, 0];

            // Find current user's review if exists
            if (this.isAuthenticated && this.currentUser) {
                this.currentUserReview = this.reviews.find(r => r.user_id === this.currentUser.id);
            }

            console.log('Loaded reviews:', this.reviews.length);
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    renderReviews() {
        const reviewsTab = document.getElementById('reviews-tab');
        if (!reviewsTab) {
            console.warn('Reviews tab not found');
            return;
        }

        // Clear existing content
        reviewsTab.innerHTML = '<h3>Customer Reviews</h3>';

        if (this.totalReviews === 0) {
            reviewsTab.innerHTML += `
                <div class="no-reviews">
                    <p>No reviews yet. Be the first to review this product from your orders!</p>
                    <p><a href="profile.html">Go to My Orders</a> to write a review after purchase</p>
                </div>
            `;
            return;
        }

        // Reviews summary (no write button - reviews are written from My Orders)
        const summaryHTML = `
            <div class="reviews-summary">
                <div class="overall-rating">
                    <div class="rating-number">${this.averageRating.toFixed(1)}</div>
                    <div class="rating-stars">${this.renderStars(this.averageRating)}</div>
                    <div class="rating-text">Based on ${this.totalReviews} review${this.totalReviews !== 1 ? 's' : ''}</div>
                </div>
                <div class="rating-bars">
                    ${this.renderRatingBars()}
                </div>
            </div>
        `;

        reviewsTab.innerHTML += summaryHTML;

        // Individual reviews
        const reviewsListHTML = `
            <div class="reviews-list">
                <h4>Customer Reviews</h4>
                ${this.reviews.map(review => this.renderReview(review)).join('')}
            </div>
        `;

        reviewsTab.innerHTML += reviewsListHTML;
    }

    renderStars(rating, allowHalf = true) {
        const fullStars = Math.floor(rating);
        const hasHalf = allowHalf && (rating - fullStars >= 0.5);
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

        let html = '';
        for (let i = 0; i < fullStars; i++) {
            html += '<span class="star full">★</span>';
        }
        if (hasHalf) {
            html += '<span class="star half">⯪</span>';
        }
        for (let i = 0; i < emptyStars; i++) {
            html += '<span class="star empty">☆</span>';
        }
        return html;
    }

    renderRatingBars() {
        const total = this.totalReviews;
        let html = '';
        
        for (let i = 4; i >= 0; i--) { // 5 stars to 1 star
            const count = this.ratingDistribution[i];
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            
            html += `
                <div class="rating-bar">
                    <span>${i + 1}★</span>
                    <div class="bar"><div class="bar-fill" style="width: ${percentage}%"></div></div>
                    <span>${percentage}%</span>
                </div>
            `;
        }
        
        return html;
    }

    renderReview(review) {
        const date = new Date(review.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const isCurrentUser = this.isAuthenticated && this.currentUser && review.user_id === this.currentUser.id;

        return `
            <div class="review-item ${isCurrentUser ? 'my-review' : ''}">
                <div class="review-header">
                    <div class="review-author">
                        <div class="author-avatar">${this.getInitials(review.username)}</div>
                        <div class="author-info">
                            <div class="author-name">${this.escapeHtml(review.username)}${review.verified_purchase ? ' <span class="verified-badge">✓ Verified Purchase</span>' : ''}</div>
                            <div class="review-date">${date}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${this.renderStars(review.rating)}
                        <span class="rating-value">${review.rating.toFixed(1)}</span>
                    </div>
                </div>
                ${review.comment ? `<div class="review-comment">${this.escapeHtml(review.comment)}</div>` : ''}
                <div class="review-actions">
                    ${review.helpful_count > 0 ? `<span class="helpful-count">${review.helpful_count} found helpful</span>` : ''}
                </div>
            </div>
        `;
    }

    getInitials(name) {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openReviewModal(existingReview = null) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('review-modal');
        if (!modal) {
            modal = this.createReviewModal();
            document.body.appendChild(modal);
        }

        // Populate form if editing
        const ratingInput = document.getElementById('review-rating-input');
        const commentInput = document.getElementById('review-comment-input');
        const modalTitle = document.getElementById('review-modal-title');

        if (existingReview) {
            modalTitle.textContent = 'Edit Your Review';
            ratingInput.value = existingReview.rating;
            commentInput.value = existingReview.comment || '';
            this.updateStarDisplay(existingReview.rating);
        } else {
            modalTitle.textContent = 'Write a Review';
            ratingInput.value = '0';
            commentInput.value = '';
            this.updateStarDisplay(0);
        }

        // Show modal
        modal.classList.add('active');
    }

    createReviewModal() {
        const modal = document.createElement('div');
        modal.id = 'review-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content review-modal">
                <div class="modal-header">
                    <h3 id="review-modal-title">Write a Review</h3>
                    <button class="modal-close" id="close-review-modal">&times;</button>
                </div>
                <form id="review-form" class="review-form">
                    <div class="form-group">
                        <label for="review-rating">Your Rating *</label>
                        <div class="star-rating" id="star-rating">
                            ${[1, 2, 3, 4, 5].map(i => `
                                <button type="button" class="star-btn" data-rating="${i}">★</button>
                            `).join('')}
                        </div>
                        <div class="half-star-note">Click between stars for half ratings (e.g., 3.5★)</div>
                        <input type="hidden" id="review-rating-input" name="rating" required>
                        <div class="rating-display" id="rating-display">Rating: <span id="rating-value">0</span> / 5</div>
                    </div>
                    <div class="form-group">
                        <label for="review-comment-input">Your Review (optional)</label>
                        <textarea id="review-comment-input" name="comment" rows="5" placeholder="Share your thoughts about this product..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn secondary" id="cancel-review-btn">Cancel</button>
                        <button type="submit" class="btn primary">Submit Review</button>
                    </div>
                    <div id="review-error" class="error-message" style="display: none;"></div>
                </form>
            </div>
        `;

        // Event listeners
        const closeBtn = modal.querySelector('#close-review-modal');
        const cancelBtn = modal.querySelector('#cancel-review-btn');
        const form = modal.querySelector('#review-form');
        const starRating = modal.querySelector('#star-rating');

        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        // Star rating with half-star support
        starRating.addEventListener('click', (e) => {
            const starBtn = e.target.closest('.star-btn');
            if (!starBtn) return;

            const rating = parseFloat(starBtn.dataset.rating);
            const rect = starBtn.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            
            // If clicked on left half, give half star
            const finalRating = clickX < width / 2 ? rating - 0.5 : rating;
            
            this.setRating(finalRating);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitReview();
        });

        return modal;
    }

    setRating(rating) {
        const ratingInput = document.getElementById('review-rating-input');
        ratingInput.value = rating;
        this.updateStarDisplay(rating);
    }

    updateStarDisplay(rating) {
        const stars = document.querySelectorAll('.star-btn');
        const ratingValue = document.getElementById('rating-value');
        
        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (rating >= starRating) {
                star.classList.add('active');
                star.classList.remove('half');
            } else if (rating >= starRating - 0.5) {
                star.classList.add('half');
                star.classList.remove('active');
            } else {
                star.classList.remove('active', 'half');
            }
        });

        if (ratingValue) {
            ratingValue.textContent = rating.toFixed(1);
        }
    }

    async submitReview() {
        const ratingInput = document.getElementById('review-rating-input');
        const commentInput = document.getElementById('review-comment-input');
        const errorDiv = document.getElementById('review-error');

        const rating = parseFloat(ratingInput.value);
        const comment = commentInput.value.trim();

        if (!rating || rating < 0.5 || rating > 5) {
            errorDiv.textContent = 'Please select a rating between 0.5 and 5 stars';
            errorDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('/api/my/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    product_id: this.productId,
                    rating: rating,
                    comment: comment
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit review');
            }

            // Close modal
            const modal = document.getElementById('review-modal');
            if (modal) modal.classList.remove('active');

            // Reload reviews
            await this.loadReviews();
            this.renderReviews();

            // Show success message
            if (window.cartPopupSystem && window.cartPopupSystem.showNotification) {
                window.cartPopupSystem.showNotification('Review submitted successfully!', 'success');
            } else {
                alert('Review submitted successfully!');
            }

        } catch (error) {
            console.error('Error submitting review:', error);
            errorDiv.textContent = error.message || 'Failed to submit review';
            errorDiv.style.display = 'block';
        }
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                // Remove active class from all buttons and panes
                tabButtons.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                // Add active class to clicked button and corresponding pane
                btn.classList.add('active');
                const targetPane = document.getElementById(`${tabName}-tab`);
                if (targetPane) targetPane.classList.add('active');
            });
        });
    }
}

// Initialize reviews when product details are loaded
if (typeof window.initializeReviews === 'undefined') {
    window.initializeReviews = async function(productId) {
        if (!productId) {
            console.warn('No product ID provided for reviews');
            return;
        }

        const reviewsSystem = new ReviewsSystem(productId);
        await reviewsSystem.init();
        
        // Make it available globally if needed
        window.currentReviewsSystem = reviewsSystem;
    };
}

// Global function to refresh product reviews after submission
window.refreshProductReviews = async function(productId) {
    if (window.currentReviewsSystem && window.currentReviewsSystem.productId == productId) {
        await window.currentReviewsSystem.loadReviews();
        window.currentReviewsSystem.renderReviews();
        window.currentReviewsSystem.updateStarDisplay();
    }
};

// Global function to update product card rating in gallery
window.updateProductCardRating = function(productId) {
    // Update gallery cards
    document.querySelectorAll(`.product-card[data-product-id="${productId}"]`).forEach(card => {
        const ratingElement = card.querySelector('.product-rating');
        if (ratingElement && window.currentReviewsSystem && window.currentReviewsSystem.productId == productId) {
            const rating = window.currentReviewsSystem.averageRating;
            const reviewCount = window.currentReviewsSystem.totalReviews;
            
            // Render half-stars
            const fullStars = Math.floor(rating);
            const hasHalf = (rating - fullStars >= 0.5);
            const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
            
            let starsHtml = '';
            for (let i = 0; i < fullStars; i++) starsHtml += '★';
            if (hasHalf) starsHtml += '⯨';
            for (let i = 0; i < emptyStars; i++) starsHtml += '☆';
            
            // Update rating element
            ratingElement.innerHTML = `<span class="stars">${starsHtml}</span><span class="rating-count">(${rating.toFixed(1)}) ${reviewCount} reviews</span>`;
        }
    });
};

