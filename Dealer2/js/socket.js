// Socket.IO Configuration
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
let socket = null;

function initSocket() {
    if (typeof io === 'undefined') {
        console.warn('Socket.IO not loaded');
        return;
    }

    socket = io(API_BASE_URL);

    socket.on('connect', () => {
        console.log('✅ Connected to server via Socket.IO');
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
    });

    // Product events
    socket.on('productAdded', (product) => {
        console.log('🆕 Socket.IO: New product added:', product);
        if (window.productsPage) {
            if (typeof window.productsPage.updateOrInsertProduct === 'function') {
                window.productsPage.updateOrInsertProduct(product);
            }
            // Also reload products to ensure full sync
            if (typeof window.productsPage.loadProducts === 'function') {
                setTimeout(() => {
                    window.productsPage.loadProducts();
                }, 500);
            }
        }
    });

    socket.on('productUpdated', (product) => {
        console.log('🔄 Socket.IO: Product updated:', product);
        if (window.productsPage && typeof window.productsPage.updateOrInsertProduct === 'function') {
            window.productsPage.updateOrInsertProduct(product);
        }
    });

    socket.on('productDeleted', (data) => {
        console.log('🗑️ Socket.IO: Product deleted:', data.id || data);
        if (window.productsPage && typeof window.productsPage.removeProduct === 'function') {
            window.productsPage.removeProduct(data.id || data);
        }
    });

    return socket;
}

// Initialize socket on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSocket);
} else {
    initSocket();
}

window.socket = socket;