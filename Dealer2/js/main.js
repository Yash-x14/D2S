// Main Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();

    // Load dealer info
    loadDealerInfo();

    // Initialize sidebar navigation (already initialized in sidebar.js)
    // All page classes are already initialized
});

function checkAuth() {
    const token = getToken();
    const role = localStorage.getItem('role');

    if (!token || role !== 'dealer') {
        console.log('Dealer not authenticated, redirecting to login...');
        window.location.href = '/auth?role=dealer';
        return false;
    }

    return true;
}

function loadDealerInfo() {
    const dealerData = localStorage.getItem('dealerData');
    if (dealerData) {
        try {
            const dealer = JSON.parse(dealerData);
            const dealerNameEl = document.getElementById('dealer-name-nav');
            const dealerAvatarEl = document.getElementById('dealer-avatar-nav');

            if (dealerNameEl) {
                dealerNameEl.textContent = dealer.name || dealer.companyName || 'Dealer';
            }

            if (dealerAvatarEl) {
                dealerAvatarEl.textContent = (dealer.name || dealer.companyName || 'D').charAt(0).toUpperCase();
            }
        } catch (error) {
            console.error('Error loading dealer info:', error);
        }
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('dealerToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('dealerData');

    window.location.href = '/auth?role=dealer';
}

// Make logout function globally available
window.handleLogout = handleLogout;