// Login functionality
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnLoader = document.getElementById('loginBtnLoader');
    const alertContainer = document.getElementById('alertContainer');

    // Check if user is already logged in
    checkAuthStatus();

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showAlert('Please fill in all fields', 'error');
            return;
        }

        // Show loading state
        setLoadingState(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAlert('Login successful! Redirecting...', 'success');

                // Store user info in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isLoggedIn', 'true');
                // Determine where to go next: redirect param > role-based default
                const params = new URLSearchParams(window.location.search);
                let redirect = params.get('redirect');
                let target = null;
                // Validate redirect URL to prevent open redirect
                if (redirect && isValidRedirectUrl(redirect)) {
                    target = redirect;
                } else if (data.user && data.user.role === 'admin') {
                    target = 'admin.html';
                } else {
                    target = 'profile.html';
                }
                // Redirect after short delay for UX
                setTimeout(() => { window.location.href = target; }, 800);
            } else {
                showAlert(data.error || 'Login failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Connection error. Please make sure the server is running.', 'error');
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(loading) {
        if (loading) {
            loginBtn.disabled = true;
            loginBtnText.style.display = 'none';
            loginBtnLoader.style.display = 'inline-block';
            loginBtnText.textContent = 'Logging in...';
        } else {
            loginBtn.disabled = false;
            loginBtnText.style.display = 'inline';
            loginBtnLoader.style.display = 'none';
            loginBtnText.textContent = 'Login';
        }
    }

    function showAlert(message, type) {
        const wrapper = document.createElement('div');
        wrapper.className = `alert alert-${type}`;
        wrapper.textContent = String(message || '');
        alertContainer.innerHTML = '';
        alertContainer.appendChild(wrapper);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }

    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/check-auth', {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.authenticated) {
                // Already logged in: honor redirect param or route by role
                const params = new URLSearchParams(window.location.search);
                let redirect = params.get('redirect');
                if (redirect && isValidRedirectUrl(redirect)) {
                    window.location.href = redirect;
                } else if (data.user && data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'profile.html';
                }
            }
        } catch (error) {
            console.log('Auth check failed:', error);
        }
    }

    // Validate redirect URL to prevent open redirect vulnerability
    function isValidRedirectUrl(url) {
        if (!url || typeof url !== 'string') return false;
        // Only allow relative URLs or same-origin URLs
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
            try {
                const urlObj = new URL(url, window.location.origin);
                return urlObj.origin === window.location.origin;
            } catch { return false; }
        }
        // Allow relative paths to same origin (profile.html, /contact.html, etc.)
        return /^[\/]?[a-zA-Z0-9._\-\/]+\.html(\?.*)?$/.test(url);
    }


    // Password show/hide toggle
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function () {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';

            // Toggle icon visibility
            const eyeIcon = this.querySelector('.eye-icon');
            const eyeOffIcon = this.querySelector('.eye-off-icon');
            eyeIcon.style.display = isPassword ? 'none' : 'block';
            eyeOffIcon.style.display = isPassword ? 'block' : 'none';

            // Toggle active class for styling
            this.classList.toggle('active', isPassword);

            // Update aria-label
            this.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
    }

});
