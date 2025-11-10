// Authentication Handler
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';

// Generate stars in background
function generateStars() {
    const starsContainer = document.getElementById('stars');
    const starsCount = 100;

    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Role Selection
let currentRole = 'customer';

function selectRole(role, formType = 'signup') {
    currentRole = role;
    const buttons = document.querySelectorAll(`#${formType}-form .role-btn`);
    buttons.forEach(btn => {
        if (btn.dataset.role === role) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    const roleInput = document.getElementById(`${formType}-role`);
    if (roleInput) {
        roleInput.value = role;
        if (formType === 'signup') {
            console.log(`✓ Role selected for ${formType}:`, role.toUpperCase());
            console.log(`  Account will be created as: ${role.toUpperCase()}`);
            console.log(`  Will save to MongoDB: ${role === 'customer' ? 'customers' : 'dealers'} collection`);
        } else if (formType === 'signin') {
            console.log(`✓ Role selected for ${formType}:`, role.toUpperCase());
            console.log(`  User will login as: ${role.toUpperCase()}`);
            console.log(`  Will redirect to: ${role === 'customer' ? 'Main-site (/index.html)' : 'Dealer Dashboard (/dealer)'}`);
        }
    }

    // Update label for name field based on role (only for signup form)
    if (formType === 'signup') {
        const nameLabel = document.getElementById('signup-name-label');
        const nameInput = document.getElementById('signup-name');
        if (nameLabel && nameInput) {
            if (role === 'dealer') {
                nameLabel.textContent = 'Company Name';
                nameInput.placeholder = 'Your Company Name';
            } else {
                nameLabel.textContent = 'Name';
                nameInput.placeholder = 'Your Name';
            }
        }
    }
}

// Switch between Sign Up and Sign In
function switchToSignup() {
    document.getElementById('signup-form').classList.add('active');
    document.getElementById('signin-form').classList.remove('active');
    clearMessages();
}

function switchToSignin() {
    document.getElementById('signin-form').classList.add('active');
    document.getElementById('signup-form').classList.remove('active');
    clearMessages();
}

// Clear error/success messages
function clearMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(msg => {
        msg.classList.remove('show');
        msg.textContent = '';
    });
}

// Show error message
function showError(formType, message) {
    const errorEl = document.getElementById(`${formType}-error`);
    errorEl.textContent = message;
    errorEl.classList.add('show');

    // Hide after 5 seconds
    setTimeout(() => {
        errorEl.classList.remove('show');
    }, 5000);
}

// Show success message
function showSuccess(formType, message) {
    const successEl = document.getElementById(`${formType}-success`);
    successEl.textContent = message;
    successEl.classList.add('show');
}

// Handle Sign Up
async function handleSignup(event) {
    event.preventDefault();
    clearMessages();

    const form = event.target;
    const submitBtn = document.getElementById('signup-submit-btn');
    const originalText = submitBtn.textContent;

    // Get the selected role
    const selectedRole = document.getElementById('signup-role').value;

    // Get form data
    const nameValue = document.getElementById('signup-name').value.trim();
    const formData = {
        name: nameValue,
        email: document.getElementById('signup-email').value.trim(),
        password: document.getElementById('signup-password').value,
        role: selectedRole
    };

    // For dealer, add companyName (use name as companyName for dealers)
    // For customer, name field is used as-is
    if (selectedRole === 'dealer') {
        formData.companyName = nameValue;
        // Remove name field for dealer as backend expects companyName
        delete formData.name;
    }

    // Validate
    const nameToCheck = selectedRole === 'dealer' ? formData.companyName : formData.name;
    if (!nameToCheck || !formData.email || !formData.password) {
        showError('signup', 'Please fill in all fields');
        return;
    }

    if (formData.password.length < 6) {
        showError('signup', 'Password must be at least 6 characters');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showError('signup', 'Please enter a valid email address');
        return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    // Log the data being sent (for debugging)
    console.log('=== Account Registration ===');
    console.log('Selected Role:', selectedRole);
    console.log('Account Type:', selectedRole === 'customer' ? 'CUSTOMER' : 'DEALER');
    console.log('Form data being sent:', {
        ...formData,
        password: '***'
    });
    console.log('Will create account in MongoDB:', selectedRole === 'customer' ? 'customers collection' : 'dealers collection');

    try {
        // Use /api/signup endpoint
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Success
        console.log('=== Registration Successful ===');
        const responseData = data.data || data;
        const accountRole = responseData.role || selectedRole;

        console.log('Account created in MongoDB:', accountRole);
        console.log('User ID:', responseData.userId || data.userId);
        console.log('Token received:', responseData.token ? 'Yes' : 'No');

        // Determine redirect URL based on role
        // Customer → Customer frontend homepage (/index.html)
        // Dealer → Dealer2 frontend dashboard (/dealer2)
        let redirectUrl;
        if (accountRole === 'customer') {
            redirectUrl = '/index.html'; // Customer frontend homepage
            console.log('✅ Customer account created - Redirecting to Customer Frontend');
        } else if (accountRole === 'dealer') {
            redirectUrl = '/dealer2'; // Dealer2 frontend dashboard
            console.log('✅ Dealer account created - Redirecting to Dealer2 Frontend');
        } else {
            // Fallback to backend redirectUrl if provided
            redirectUrl = responseData.redirectUrl || '/index.html';
        }

        showSuccess('signup', `✅ Account created successfully as ${accountRole.toUpperCase()}! Redirecting to ${accountRole === 'customer' ? 'Customer Homepage' : 'Dealer2 Dashboard'}...`);

        // Store token and role
        localStorage.setItem('token', responseData.token || data.token);
        localStorage.setItem('role', accountRole);
        localStorage.setItem('userId', responseData.userId || data.userId);
        
        // Store registration data for personal information page
        if (accountRole === 'customer') {
            localStorage.setItem('customerName', formData.name || '');
            localStorage.setItem('customerEmail', formData.email || '');
            // Note: Password is not stored for security reasons
        }

        console.log('Stored in localStorage:', {
            role: accountRole,
            userId: responseData.userId || data.userId,
            hasToken: !!(responseData.token || data.token),
            redirectDestination: accountRole === 'customer' ? 'Customer Frontend (/index.html)' : 'Dealer2 Frontend (/dealer2)'
        });

        // Redirect based on user role
        setTimeout(() => {
            console.log(`🚀 Redirecting ${accountRole.toUpperCase()} to: ${redirectUrl}`);
            window.location.href = redirectUrl;
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);
        showError('signup', error.message || 'Failed to create account. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle Sign In
async function handleSignin(event) {
    event.preventDefault();
    clearMessages();

    const form = event.target;
    const submitBtn = document.getElementById('signin-submit-btn');
    const originalText = submitBtn.textContent;

    // Get the selected role from the hidden input
    const selectedRole = document.getElementById('signin-role').value;
    
    // Validate role is selected
    if (!selectedRole || (selectedRole !== 'customer' && selectedRole !== 'dealer')) {
        showError('signin', 'Please select Customer or Dealer role');
        return;
    }

    // Get form data
    const formData = {
        email: document.getElementById('signin-email').value.trim(),
        password: document.getElementById('signin-password').value,
        role: selectedRole
    };

    // Validate
    if (!formData.email || !formData.password) {
        showError('signin', 'Please fill in all fields');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showError('signin', 'Please enter a valid email address');
        return;
    }

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';

    // Log the data being sent (for debugging)
    console.log('=== Sign In Request ===');
    console.log('Selected Role Button:', selectedRole.toUpperCase());
    console.log('Email:', formData.email);
    console.log('Account Type:', selectedRole === 'customer' ? 'CUSTOMER (will login to Main-site)' : 'DEALER (will login to Dealer Dashboard)');
    console.log('Sending login request to backend...');

    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Success
        console.log('=== Login Successful ===');
        const responseData = data.data || data;
        const accountRole = responseData.role || data.role;

        console.log('✅ User authenticated successfully!');
        console.log('User role from server:', accountRole.toUpperCase());
        console.log('User account type:', accountRole === 'customer' ? 'CUSTOMER' : 'DEALER');
        console.log('Selected role button matched:', selectedRole === accountRole ? '✅ YES' : '❌ NO');

        // Determine redirect URL based on role
        // Customer → Customer frontend homepage (/index.html)
        // Dealer → Dealer2 frontend dashboard (/dealer2)
        let redirectUrl;
        if (accountRole === 'customer') {
            redirectUrl = '/index.html'; // Customer frontend homepage
            console.log('✅ Customer login successful - Redirecting to CUSTOMER FRONTEND');
            console.log('   Destination: /index.html (Customer Homepage)');
        } else if (accountRole === 'dealer') {
            redirectUrl = '/dealer2'; // Dealer2 frontend dashboard
            console.log('✅ Dealer login successful - Redirecting to DEALER2 FRONTEND');
            console.log('   Destination: /dealer2 (Dealer2 Dashboard)');
        } else {
            // Fallback to backend redirectUrl if provided
            redirectUrl = responseData.redirectUrl || '/index.html';
            console.log('⚠️ Using fallback redirect URL:', redirectUrl);
        }

        showSuccess('signin', `✅ Login successful as ${accountRole.toUpperCase()}! Redirecting to ${accountRole === 'customer' ? 'Customer Homepage' : 'Dealer2 Dashboard'}...`);

        // Store token and role
        localStorage.setItem('token', responseData.token || data.token);
        localStorage.setItem('role', accountRole);
        localStorage.setItem('userId', responseData.userId || data.userId || '');
        
        // Store user data for personal information page (if available in response)
        if (accountRole === 'customer' && responseData.user) {
            if (responseData.user.name) localStorage.setItem('customerName', responseData.user.name);
            if (responseData.user.email) localStorage.setItem('customerEmail', responseData.user.email);
        }

        console.log('💾 Stored in localStorage:', {
            role: accountRole,
            userId: responseData.userId || data.userId,
            hasToken: !!(responseData.token || data.token),
            redirectDestination: accountRole === 'customer' ? 'Customer Frontend (/index.html)' : 'Dealer2 Frontend (/dealer2)'
        });

        // Redirect based on user role
        // Customer → Customer frontend (/index.html)
        // Dealer → Dealer2 frontend (/dealer2)
        setTimeout(() => {
            console.log(`🚀 Redirecting ${accountRole.toUpperCase()} user now...`);
            console.log(`   Final Destination: ${redirectUrl}`);
            if (accountRole === 'customer') {
                console.log('   → Customer will be logged in to Customer Frontend (index.html)');
                console.log('   → Redirecting to: /index.html');
                window.location.href = '/index.html';
            } else {
                console.log('   → Dealer will be logged in to Dealer2 Frontend Dashboard');
                console.log('   → Redirecting to: /dealer2');
                window.location.href = '/dealer2';
            }
        }, 1500);

    } catch (error) {
        console.error('Signin error:', error);
        showError('signin', error.message || 'Invalid credentials. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle Social Login (placeholder)
function handleSocialLogin(provider) {
    alert(`${provider} login is coming soon!`);
    // TODO: Implement OAuth for Google and GitHub
}

// Handle Logout
function handleLogout() {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('dealerToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');

    // Redirect to login page
    window.location.href = '/auth';
}

// Check authentication and redirect if not logged in (for protected pages)
function checkAuth(requiredRole = null) {
    const token = localStorage.getItem('token') || localStorage.getItem('dealerToken');
    const role = localStorage.getItem('role');

    if (!token) {
        // Not logged in, redirect to auth page
        if (requiredRole) {
            window.location.href = `/auth?role=${requiredRole}`;
        } else {
            window.location.href = '/auth';
        }
        return false;
    }

    if (requiredRole && role !== requiredRole) {
        // Wrong role, redirect to appropriate page
        if (role === 'customer') {
            window.location.href = '/index.html';
        } else if (role === 'dealer') {
            window.location.href = '/dealer2';
        }
        return false;
    }

    return true;
}

// Make functions globally available
window.handleLogout = handleLogout;
window.checkAuth = checkAuth;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    generateStars();

    // Check URL parameter for pre-selected role
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedRole = urlParams.get('role');

    if (preSelectedRole === 'dealer') {
        selectRole('dealer', 'signup');
        selectRole('dealer', 'signin');
    }

    // Don't auto-redirect if user is already logged in
    // Users can stay on the login form even if they have a token
    // They can manually navigate to their dashboard if needed
});