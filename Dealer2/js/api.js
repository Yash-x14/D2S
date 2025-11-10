// API Configuration and Helper Functions
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';

// Get authentication token
function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('dealerToken') || '';
}

// Get user ID
function getUserId() {
    return localStorage.getItem('userId') || '';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// API Call Helper
async function apiCall(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`❌ API Error (${response.status}):`, data);
            throw new Error(data.error || `API request failed with status ${response.status}`);
        }

        console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
        return data;
    } catch (error) {
        console.error('❌ API call error:', error);
        throw error;
    }
}

// Products API
const productsAPI = {
    // Get only this dealer's products
    getAll: () => apiCall('/api/dealer/products'),
    getById: (id) => apiCall(`/api/products/${id}`),
    create: (data) => apiCall('/api/dealer/products', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiCall(`/api/dealer/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiCall(`/api/dealer/products/${id}`, {
        method: 'DELETE'
    })
};

// Orders API
const ordersAPI = {
    getAll: () => apiCall('/api/admin/dealer/orders'),
    getById: (id) => apiCall(`/api/orders/${id}`),
    update: (id, data) => apiCall(`/api/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
};

// Customers API
const customersAPI = {
    getAll: () => apiCall('/api/customers'),
    getFeedback: (customerId) => apiCall(`/api/dealer/customers/${customerId}/feedback`)
};

// Analytics API
const analyticsAPI = {
    getSales: () => apiCall('/api/analytics/sales'),
    getOrders: () => apiCall('/api/analytics/orders')
};

// Dealer Profile API
const dealerAPI = {
    updateProfile: (data) => apiCall('/api/dealer/update-profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    })
};

// Export APIs
window.productsAPI = productsAPI;
window.ordersAPI = ordersAPI;
window.customersAPI = customersAPI;
window.analyticsAPI = analyticsAPI;
window.dealerAPI = dealerAPI;
window.showNotification = showNotification;
window.getToken = getToken;
window.getUserId = getUserId;