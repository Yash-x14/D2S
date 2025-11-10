// Authentication Check for Customer Frontend
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';

// Get authentication token
function getToken() {
    return localStorage.getItem('token') || '';
}

// Get user role
function getRole() {
    return localStorage.getItem('role') || '';
}

// Check if user is authenticated as customer
function checkCustomerAuth() {
    const token = getToken();
    const role = getRole();

    // If no token, user is not logged in (allow guest access for customer site)
    if (!token) {
        return false;
    }

    // If token exists but role is dealer, redirect to dealer dashboard
    if (role === 'dealer') {
        console.log('⚠️ Dealer detected on customer site, redirecting to dealer dashboard...');
        window.location.href = '/dealer2';
        return false;
    }

    // Customer is authenticated
    return true;
}

// Verify token with backend (optional - for protected pages)
async function verifyToken() {
    const token = getToken();
    if (!token) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/verify-token`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.valid === true && data.role === 'customer';
        }
    } catch (error) {
        console.error('Token verification error:', error);
    }

    return false;
}

// Handle logout for customer
function handleCustomerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('dealerData');
    
    // Redirect to homepage
    window.location.href = '/index.html';
}

// Export functions
window.checkCustomerAuth = checkCustomerAuth;
window.verifyToken = verifyToken;
window.handleCustomerLogout = handleCustomerLogout;
window.getToken = getToken;
window.getRole = getRole;

// Auto-check on page load (optional - uncomment if you want to protect all pages)
// document.addEventListener('DOMContentLoaded', () => {
//     checkCustomerAuth();
// });

