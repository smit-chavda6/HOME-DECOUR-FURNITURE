// Multi-Step Registration Wizard
document.addEventListener('DOMContentLoaded', function () {
    let currentStep = 1;
    const totalSteps = 3;

    // DOM elements
    const form = document.getElementById('registerForm');
    const btnBack = document.getElementById('btnBack');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');
    const registerBtnText = document.getElementById('registerBtnText');
    const registerBtnLoader = document.getElementById('registerBtnLoader');
    const alertContainer = document.getElementById('alertContainer');
    const stepPanels = document.querySelectorAll('.step-panel');
    const stepperSteps = document.querySelectorAll('.stepper-step');
    const stepperLineFills = document.querySelectorAll('.stepper-line-fill');

    // Field references
    const fields = {
        username: document.getElementById('username'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        fullName: document.getElementById('fullName'),
        phone: document.getElementById('phone'),
        addressLine1: document.getElementById('addressLine1'),
        addressLine2: document.getElementById('addressLine2'),
        city: document.getElementById('city'),
        state: document.getElementById('state'),
        country: document.getElementById('country'),
        postalCode: document.getElementById('postalCode')
    };

    // Steps → fields mapping
    const stepFields = {
        1: ['username', 'email', 'password', 'confirmPassword'],
        2: ['fullName', 'phone'],
        3: ['addressLine1', 'city', 'state', 'country', 'postalCode']
    };

    // Initialize events
    Object.keys(fields).forEach(key => {
        if (fields[key]) {
            fields[key].addEventListener('blur', () => validateField(key));
            fields[key].addEventListener('input', () => {
                clearFieldError(key);
                fields[key].classList.remove('input-error');
            });
        }
    });

    // Password requirements live checker
    const passwordInput = fields.password;
    const confirmInput = fields.confirmPassword;
    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordRequirements);
    }
    if (confirmInput) {
        confirmInput.addEventListener('input', updatePasswordRequirements);
    }

    function updatePasswordRequirements() {
        const pw = fields.password.value;
        const cpw = fields.confirmPassword.value;
        const reqLength = document.getElementById('req-length');
        const reqMatch = document.getElementById('req-match');

        if (reqLength) {
            if (pw.length >= 6) {
                reqLength.className = 'req-pass';
            } else if (pw.length > 0) {
                reqLength.className = 'req-fail';
            } else {
                reqLength.className = 'req-pending';
            }
        }
        if (reqMatch) {
            if (cpw && pw === cpw) {
                reqMatch.className = 'req-pass';
            } else if (cpw) {
                reqMatch.className = 'req-fail';
            } else {
                reqMatch.className = 'req-pending';
            }
        }
    }

    // PIN Code: only allow numbers
    if (fields.postalCode) {
        fields.postalCode.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
        });
    }

    // Navigation
    btnNext.addEventListener('click', () => {
        if (validateCurrentStep()) {
            goToStep(currentStep + 1);
        }
    });

    btnBack.addEventListener('click', () => {
        goToStep(currentStep - 1);
    });

    // Form submit (only on last step)
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!validateCurrentStep()) return;

        setLoadingState(true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: fields.username.value.trim(),
                    email: fields.email.value.trim(),
                    password: fields.password.value,
                    full_name: fields.fullName.value.trim(),
                    phone: fields.phone.value.trim(),
                    address_line1: fields.addressLine1.value.trim(),
                    address_line2: fields.addressLine2.value.trim(),
                    city: fields.city.value.trim(),
                    state: fields.state.value.trim(),
                    country: fields.country.value.trim(),
                    postal_code: fields.postalCode.value.trim()
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAlert('🎉 Account created successfully! Redirecting to login...', 'success');
                // Show success state
                btnSubmit.classList.add('btn-success-state');
                btnSubmit.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg> Success!';

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                const errorMsg = data.error || 'Registration failed. Please try again.';
                showAlert(errorMsg, 'error');

                // Navigate to the relevant step on specific errors
                if (errorMsg.toLowerCase().includes('username')) {
                    goToStep(1);
                    showFieldError('username', errorMsg);
                    fields.username.focus();
                } else if (errorMsg.toLowerCase().includes('email')) {
                    goToStep(1);
                    showFieldError('email', errorMsg);
                    fields.email.focus();
                } else if (errorMsg.toLowerCase().includes('phone')) {
                    goToStep(2);
                    showFieldError('phone', errorMsg);
                    fields.phone.focus();
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Connection error. Please make sure the server is running.', 'error');
        } finally {
            setLoadingState(false);
        }
    });

    // Go to a specific step
    function goToStep(step) {
        if (step < 1 || step > totalSteps) return;

        // Determine direction
        const direction = step > currentStep ? 'forward' : 'backward';
        const currentPanel = document.querySelector(`.step-panel[data-step="${currentStep}"]`);
        const nextPanel = document.querySelector(`.step-panel[data-step="${step}"]`);

        // Animate out
        currentPanel.classList.add(direction === 'forward' ? 'slide-out-left' : 'slide-out-right');

        setTimeout(() => {
            currentPanel.classList.remove('active', 'slide-out-left', 'slide-out-right');

            // Animate in
            nextPanel.classList.add('active', direction === 'forward' ? 'slide-in-right' : 'slide-in-left');

            setTimeout(() => {
                nextPanel.classList.remove('slide-in-right', 'slide-in-left');
            }, 400);

            currentStep = step;
            updateUI();
        }, 300);
    }

    // Update stepper UI, buttons
    function updateUI() {
        // Update stepper
        stepperSteps.forEach((el, i) => {
            const stepNum = i + 1;
            el.classList.remove('active', 'completed');
            if (stepNum === currentStep) {
                el.classList.add('active');
            } else if (stepNum < currentStep) {
                el.classList.add('completed');
            }
        });

        // Update stepper lines
        stepperLineFills.forEach((fill, i) => {
            if (i + 1 < currentStep) {
                fill.style.width = '100%';
            } else {
                fill.style.width = '0%';
            }
        });

        // Update buttons
        btnBack.style.display = currentStep === 1 ? 'none' : 'flex';
        btnNext.style.margin = currentStep === 1 ? '0 auto' : '0 0 0 auto';
        btnSubmit.style.margin = '0 0 0 auto';

        if (currentStep === totalSteps) {
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'flex';
        } else {
            btnNext.style.display = 'flex';
            btnSubmit.style.display = 'none';
        }

        // Scroll to top of card
        document.querySelector('.register-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Validate current step fields
    function validateCurrentStep() {
        const fieldsToValidate = stepFields[currentStep] || [];
        let isValid = true;
        let firstErrorField = null;

        fieldsToValidate.forEach(key => {
            if (!validateField(key)) {
                isValid = false;
                if (!firstErrorField) firstErrorField = fields[key];
            }
        });

        if (!isValid && firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => firstErrorField.focus(), 300);
        }

        return isValid;
    }

    // Field validation
    function validateField(key) {
        const field = fields[key];
        if (!field) return true;
        const value = field.value.trim();

        switch (key) {
            case 'username':
                if (!value) { showFieldError(key, 'Username is required'); return false; }
                if (value.length < 3) { showFieldError(key, 'Must be at least 3 characters'); return false; }
                if (!/^[a-zA-Z0-9_]+$/.test(value)) { showFieldError(key, 'Only letters, numbers & underscores'); return false; }
                break;
            case 'email':
                if (!value) { showFieldError(key, 'Email is required'); return false; }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showFieldError(key, 'Enter a valid email'); return false; }
                break;
            case 'password':
                if (!value) { showFieldError(key, 'Password is required'); return false; }
                if (value.length < 6) { showFieldError(key, 'At least 6 characters required'); return false; }
                break;
            case 'confirmPassword':
                if (!value) { showFieldError(key, 'Please confirm password'); return false; }
                if (value !== fields.password.value) { showFieldError(key, 'Passwords do not match'); return false; }
                break;
            case 'fullName':
                if (!value) { showFieldError(key, 'Full name is required'); return false; }
                if (value.length < 3) { showFieldError(key, 'At least 3 characters'); return false; }
                break;
            case 'phone':
                if (!value) { showFieldError(key, 'Phone number is required'); return false; }
                if (!/^[+]?[0-9\s-]{10,15}$/.test(value)) { showFieldError(key, 'Enter a valid phone (10-15 digits)'); return false; }
                break;
            case 'addressLine1':
                if (!value) { showFieldError(key, 'Address is required'); return false; }
                break;
            case 'city':
                if (!value) { showFieldError(key, 'City is required'); return false; }
                break;
            case 'state':
                if (!value) { showFieldError(key, 'State is required'); return false; }
                break;
            case 'country':
                if (!value) { showFieldError(key, 'Country is required'); return false; }
                break;
            case 'postalCode':
                if (!value) { showFieldError(key, 'PIN Code is required'); return false; }
                if (!/^[0-9]{6}$/.test(value)) { showFieldError(key, 'Must be exactly 6 digits'); return false; }
                break;
        }

        clearFieldError(key);
        return true;
    }

    function showFieldError(key, message) {
        const field = fields[key];
        const errorEl = document.getElementById(key + 'Error');
        if (field) field.classList.add('input-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    function clearFieldError(key) {
        const field = fields[key];
        const errorEl = document.getElementById(key + 'Error');
        if (field) field.classList.remove('input-error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    function setLoadingState(loading) {
        if (loading) {
            btnSubmit.disabled = true;
            registerBtnText.style.display = 'none';
            registerBtnLoader.style.display = 'inline-block';
        } else {
            btnSubmit.disabled = false;
            registerBtnText.style.display = 'inline';
            registerBtnLoader.style.display = 'none';
        }
    }

    function showAlert(message, type) {
        alertContainer.innerHTML = `
            <div class="alert alert-${type}">
                ${message}
            </div>
        `;
        alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => { alertContainer.innerHTML = ''; }, 6000);
    }

    // Password show/hide toggle
    function setupPasswordToggle(toggleId, inputId) {
        const toggleBtn = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (toggleBtn && input) {
            toggleBtn.addEventListener('click', function () {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                const eyeIcon = this.querySelector('.eye-icon');
                const eyeOffIcon = this.querySelector('.eye-off-icon');
                eyeIcon.style.display = isPassword ? 'none' : 'block';
                eyeOffIcon.style.display = isPassword ? 'block' : 'none';
                this.classList.toggle('active', isPassword);
                this.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            });
        }
    }

    setupPasswordToggle('togglePassword', 'password');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    // Keyboard: Enter to go next
    form.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && currentStep < totalSteps) {
            e.preventDefault();
            btnNext.click();
        }
    });

    // Initialize
    updateUI();
});
