// Purchase Success Animation Manager
class PurchaseSuccessAnimation {
    constructor() {
        this.overlay = document.getElementById('purchaseSuccessOverlay');
        this.confettiContainer = document.getElementById('confettiContainer');
        this.productNameElement = document.getElementById('successProductName');
        this.confettiInterval = null;
    }

    // Show success animation with product name
    show(productName = 'Product') {
        // Set product name
        this.productNameElement.textContent = productName;
        
        // Show overlay
        this.overlay.classList.add('active');
        
        // Start confetti animation
        this.startConfetti();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    // Hide success animation
    hide() {
        // Stop confetti
        this.stopConfetti();
        
        // Hide overlay
        this.overlay.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    // Start confetti animation
    startConfetti() {
        // Clear existing confetti
        this.confettiContainer.innerHTML = '';
        
        // Create confetti pieces
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 4 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            this.confettiContainer.appendChild(confetti);
        }
        
        // Continue creating confetti every 3 seconds
        this.confettiInterval = setInterval(() => {
            // Remove old confetti
            const oldConfetti = this.confettiContainer.querySelectorAll('.confetti');
            oldConfetti.forEach(conf => conf.remove());
            
            // Create new confetti
            for (let i = 0; i < 20; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 4 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                this.confettiContainer.appendChild(confetti);
            }
        }, 3000);
    }

    // Stop confetti animation
    stopConfetti() {
        if (this.confettiInterval) {
            clearInterval(this.confettiInterval);
            this.confettiInterval = null;
        }
        this.confettiContainer.innerHTML = '';
    }
}

// Global instance
const purchaseSuccess = new PurchaseSuccessAnimation();

// Global functions for onclick handlers
function showPurchaseSuccess(productName) {
    purchaseSuccess.show(productName);
}

function hideSuccessAnimation() {
    purchaseSuccess.hide();
}

function continueShopping() {
    purchaseSuccess.hide();
    // Navigate to home page
    window.location.href = 'index.html';
}

// Function to trigger success animation (can be called from any page)
function triggerPurchaseSuccess(productName = 'Amazing Furniture') {
    showPurchaseSuccess(productName);
}

// Note: Success animation will stay open until user clicks "Continue Shopping" 