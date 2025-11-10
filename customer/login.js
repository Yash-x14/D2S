(() => {
    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('error');

    function showError(message) {
        if (!errorBox) return;
        errorBox.textContent = message || 'Something went wrong';
        errorBox.style.display = 'block';
    }

    function clearError() {
        if (!errorBox) return;
        errorBox.textContent = '';
        errorBox.style.display = 'none';
    }

    async function login(evt) {
        evt.preventDefault();
        clearError();

        const email = (document.getElementById('email')?.value || '').trim();
        const password = document.getElementById('password')?.value || '';
        const role = document.getElementById('role')?.value || '';

        if (!email || !password || !role) {
            showError('Please fill in all the fields.');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                showError(data?.error || 'Invalid credentials');
                return;
            }

            const { token, role: returnedRole } = data;
            if (!token || !returnedRole) {
                showError('Malformed response from server');
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('role', returnedRole);

            if (returnedRole === 'customer') {
                window.location.href = '/index.html';
            } else if (returnedRole === 'dealer') {
                window.location.href = '/Dealer/index1.html';
            } else {
                showError('Unknown role');
            }
        } catch (err) {
            showError('Network error. Is the backend running?');
        }
    }

    if (form) form.addEventListener('submit', login);
})();

// Login page (login.html) specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Login form submission is handled in login.html itself
    // This file is here for consistency and future enhancements
});