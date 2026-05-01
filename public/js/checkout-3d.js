/**
 * ==========================================================================
 * Interactive 3D Credit Card Logic
 * Maps the checkout form inputs directly to the 3D card visualizer.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Input Fields
    const inputName = document.getElementById('inputCardName');
    const inputNumber = document.getElementById('inputCardNumber');
    const inputExpiry = document.getElementById('inputCardExpiry');
    const inputCVC = document.getElementById('inputCardCVC');
    
    // Display Fields on the 3D Card
    const displayName = document.getElementById('displayCardName');
    const displayNumber = document.getElementById('displayCardNumber');
    const displayExpiry = document.getElementById('displayCardExpiry');
    const displayCVC = document.getElementById('displayCardCVC');
    
    // The completely 3D card element
    const cardEl = document.getElementById('interactive3dCard');

    // Make sure we have the DOM elements before attaching events
    if (!cardEl || !inputNumber) return;

    // --- 1. Mapping Functions ---

    // Format Card Number (adds spaces every 4 digits)
    inputNumber.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
        // Add space every 4 digits
        val = val.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = val;
        
        displayNumber.textContent = val || '#### #### #### ####';
    });

    // Format Cardholder Name
    inputName.addEventListener('input', (e) => {
        displayName.textContent = e.target.value || 'JOHN DOE';
    });

    // Format Expiry Date (MM/YY)
    inputExpiry.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        e.target.value = val;
        
        displayExpiry.textContent = val || 'MM/YY';
    });

    // Format CVC
    let isCVVVisible = false;
    let currentCVV = '';

    function updateCVCDisplay() {
        if (!currentCVV) {
            displayCVC.textContent = '***';
        } else {
            // Display either real digits or secure bullets depending on toggle state
            displayCVC.textContent = isCVVVisible ? currentCVV : '•'.repeat(currentCVV.length);
        }
    }

    inputCVC.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        e.target.value = val;
        currentCVV = val;
        updateCVCDisplay();
    });

    // Eye Icon Visibility Toggle Hook
    const toggleBtn = document.getElementById('toggleCVV');
    if (toggleBtn) {
        // CRITICAL FIX: Intercept the mousedown event and prevent default.
        // This stops the browser from moving focus away from the CVV input
        // when the eye button is clicked, so the blur/focus cycle never fires
        // and the card never performs the glitchy double-flip animation.
        toggleBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        toggleBtn.addEventListener('click', () => {
            isCVVVisible = !isCVVVisible;
            inputCVC.type = isCVVVisible ? 'text' : 'password';
            
            // Swap SVG Eye/Eye-off icons
            toggleBtn.innerHTML = isCVVVisible 
                ? '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
                : '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                
            updateCVCDisplay();
        });
    }

    // --- 2. 3D Flipping Animation Hooks ---

    // When user types in CVC, smoothly flip the card 180deg to back
    inputCVC.addEventListener('focus', () => {
        cardEl.classList.add('flipped');
    });

    // When user leaves CVC, flip it back to front
    inputCVC.addEventListener('blur', () => {
        cardEl.classList.remove('flipped');
    });
});
