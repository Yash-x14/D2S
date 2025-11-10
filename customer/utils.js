// Shared utility functions used across multiple pages

// --- Cart System (Shared) ---
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);

// Update cart count display
function updateCartCount() {
    const cartCountElems = document.querySelectorAll('.cart-count');
    cartCountElems.forEach(elem => {
        elem.textContent = String(cartCount);
    });
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Add item to cart
function addToCart(productName, price, image, weight = '200 Gms') {
    const existingItem = cart.find(item =>
        item.name === productName && item.weight === weight
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: parseFloat(price.replace('Rs. ', '').replace('₹', '')),
            image: image,
            weight: weight,
            quantity: 1
        });
    }

    cartCount++;
    saveCart();
    return true;
}

// Remove item from cart
function removeFromCart(index) {
    cartCount -= cart[index].quantity;
    cart.splice(index, 1);
    saveCart();
}

// Update item quantity
function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) return;

    const oldQuantity = cart[index].quantity;
    cart[index].quantity = newQuantity;
    cartCount += (newQuantity - oldQuantity);

    saveCart();
}

// Calculate cart totals
function calculateTotals() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 599 ? 0 : 50; // Free shipping above ₹599
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + shipping + tax;

    return {
        subtotal,
        shipping,
        tax,
        total
    };
}

// Get cart data
function getCart() {
    return cart;
}

// Set cart data
function setCart(newCart) {
    cart = newCart;
    cartCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    saveCart();
}

// Clear cart
function clearCart() {
    cart = [];
    cartCount = 0;
    saveCart();
}

// --- Helper Functions ---
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

function showInfoMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'info-message';
    messageDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;

    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #17a2b8;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Order helper functions
function getOrderData(orderId) {
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    return orderHistory.find(order => order.id === orderId) || null;
}

function updateOrderStatus(orderId, newStatus) {
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    const order = orderHistory.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    }
}

// Authentication helper functions
function getToken() {
    return localStorage.getItem('token') || '';
}

function getUserId() {
    return localStorage.getItem('userId') || '';
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});