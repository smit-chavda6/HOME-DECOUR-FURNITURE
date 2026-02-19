// ============================================================
// CONTACT PAGE — Premium Split Layout
// ============================================================
// Handles:
//   1. Entrance animations (staggered reveal)
//   2. Textarea auto-resize
//   3. Floating label logic for all inputs
//   4. Form submission with auth check
//   5. Login modal (show/hide + redirect)
//   6. Form data persistence (sessionStorage)
//   7. Error toast notifications
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    initEntranceAnimations();
    initTextareaAutoResize();
    initFloatingLabels();
    initFormHandler();
});


// ─── 1. ENTRANCE ANIMATIONS ───────────────────────────────

function initEntranceAnimations() {
    // Stagger animate elements on the left panel
    const leftItems = document.querySelectorAll('.v-info-item, .v-social-link');
    leftItems.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(15px)';
        el.style.transition = `opacity 0.5s ease ${0.3 + i * 0.1}s, transform 0.5s ease ${0.3 + i * 0.1}s`;
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    });

    // Animate form groups on the right
    const formGroups = document.querySelectorAll('.pf-group, .premium-submit-btn');
    formGroups.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
        el.style.transition = `opacity 0.4s ease ${0.4 + i * 0.08}s, transform 0.4s ease ${0.4 + i * 0.08}s`;
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    });

    // Animate hours cards
    const hoursCards = document.querySelectorAll('.hm-card');
    hoursCards.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        el.style.transition = `opacity 0.4s ease ${0.6 + i * 0.1}s, transform 0.4s ease ${0.6 + i * 0.1}s`;
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    });
}


// ─── 2. TEXTAREA AUTO-RESIZE ──────────────────────────────

function initTextareaAutoResize() {
    const textarea = document.getElementById('message');
    if (!textarea) return;

    function resize() {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    textarea.addEventListener('input', resize);
    // Also resize on focus in case of restored data
    textarea.addEventListener('focus', resize);
}


// ─── 3. FLOATING LABELS ──────────────────────────────────

function initFloatingLabels() {
    const groups = document.querySelectorAll('.pf-group');

    groups.forEach(group => {
        const input = group.querySelector('input, textarea, select');
        if (!input) return;

        // Check initial value (for browser autofill or restored data)
        function checkValue() {
            if (input.value && input.value.trim() !== '') {
                group.classList.add('focused');
                input.classList.add('has-value');
            }
        }

        // Delay check for browser autofill
        setTimeout(checkValue, 200);

        input.addEventListener('focus', () => {
            group.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (!input.value || input.value.trim() === '') {
                group.classList.remove('focused');
                input.classList.remove('has-value');
            }
        });

        input.addEventListener('input', () => {
            if (input.value && input.value.trim() !== '') {
                input.classList.add('has-value');
                group.classList.add('focused');
            } else {
                input.classList.remove('has-value');
            }
        });

        // Special handling for <select>
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', () => {
                if (input.value) {
                    group.classList.add('focused');
                    input.classList.add('has-value');
                }
            });
        }
    });
}


// ─── 4. FORM HANDLER (with Auth + Modal) ─────────────────

function initFormHandler() {
    'use strict';

    // DOM Elements
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const loginModal = document.getElementById('loginRequiredModal');
    const modalOverlay = loginModal?.querySelector('.modal-overlay');
    const modalCancelBtn = loginModal?.querySelector('.modal-cancel-btn');
    const modalCloseBtn = loginModal?.querySelector('.modal-close');
    const modalOkBtn = loginModal?.querySelector('.modal-ok-btn');

    // Storage keys
    const FORM_DATA_KEY = 'contactFormData';
    const REDIRECT_KEY = 'contactRedirect';

    // ── Modal Functions ──

    function showLoginModal() {
        if (loginModal) {
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function hideLoginModal() {
        if (loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ── Form Data Persistence ──

    function saveFormData() {
        if (!contactForm) return;
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        sessionStorage.setItem(FORM_DATA_KEY, JSON.stringify(data));
        sessionStorage.setItem(REDIRECT_KEY, 'true');
    }

    function restoreFormData() {
        if (!contactForm) return;
        const savedData = sessionStorage.getItem(FORM_DATA_KEY);
        const shouldRestore = sessionStorage.getItem(REDIRECT_KEY);

        if (savedData && shouldRestore) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const field = contactForm.querySelector(`[name="${key}"]`);
                    if (field) {
                        field.value = data[key];
                        // Trigger floating label
                        const group = field.closest('.pf-group');
                        if (group && field.value) {
                            group.classList.add('focused');
                            field.classList.add('has-value');
                        }
                    }
                });
                sessionStorage.removeItem(FORM_DATA_KEY);
                sessionStorage.removeItem(REDIRECT_KEY);
            } catch (err) {
                console.error('Error restoring form data:', err);
            }
        }
    }

    function redirectToLogin() {
        saveFormData();
        hideLoginModal();
        window.location.href = '/login.html?redirect=/contact.html';
    }

    // ── Modal Event Listeners ──

    if (modalCancelBtn) modalCancelBtn.addEventListener('click', hideLoginModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideLoginModal);
    if (modalOverlay) modalOverlay.addEventListener('click', hideLoginModal);
    if (modalOkBtn) modalOkBtn.addEventListener('click', redirectToLogin);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && loginModal?.classList.contains('active')) {
            hideLoginModal();
        }
    });

    // ── Form Submission ──

    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('.premium-submit-btn');
            const btnText = submitBtn?.querySelector('.btn-text');
            const btnArrow = submitBtn?.querySelector('.btn-arrow');
            const originalText = btnText?.textContent || 'Send Message';

            // Step 1: Check auth
            let isAuthenticated = false;
            try {
                const authCheck = await fetch('/api/check-auth', { credentials: 'include' });
                const authData = await authCheck.json();
                isAuthenticated = authData.authenticated;
            } catch (err) {
                console.error('Auth check failed:', err);
            }

            // Step 2: Not logged in → show modal
            if (!isAuthenticated) {
                showLoginModal();
                return;
            }

            // Step 3: Loading state
            if (submitBtn) submitBtn.classList.add('loading');
            if (btnText) btnText.textContent = 'Sending...';
            if (btnArrow) btnArrow.style.opacity = '0';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (!response.ok) {
                    resetButton();
                    showErrorToast('Error: ' + (result.error || 'Unknown error'));
                    return;
                }

                // Step 4: Success — fade out form, show success
                contactForm.style.opacity = '0';
                contactForm.style.transition = 'opacity 0.3s ease';

                setTimeout(() => {
                    contactForm.style.display = 'none';
                    if (formSuccess) formSuccess.removeAttribute('hidden');
                }, 300);

                // Auto-reset after 5 seconds
                setTimeout(() => {
                    if (formSuccess) formSuccess.setAttribute('hidden', '');
                    contactForm.reset();
                    contactForm.style.display = '';
                    contactForm.style.opacity = '1';
                    resetButton();

                    // Reset all floating labels
                    document.querySelectorAll('.pf-group').forEach(g => {
                        g.classList.remove('focused');
                        const inp = g.querySelector('input, textarea, select');
                        if (inp) inp.classList.remove('has-value');
                    });
                }, 5000);

            } catch (err) {
                console.error('Form submission error:', err);
                resetButton();
                showErrorToast('Error sending message. Please try again.');
            }

            function resetButton() {
                if (submitBtn) submitBtn.classList.remove('loading');
                if (btnText) btnText.textContent = originalText;
                if (btnArrow) btnArrow.style.opacity = '1';
            }
        });
    }

    // ── Error Toast ──

    function showErrorToast(message) {
        const toast = document.createElement('div');
        toast.className = 'contact-toast error';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // ── Init: restore saved data ──
    restoreFormData();
}
