// Checkout page (checkout.html) specific functionality
document.addEventListener('DOMContentLoaded', function() {
    let checkoutCartItems = [];
    let orderHistory = [];

    // Load checkout cart from localStorage
    function loadCheckoutCart() {
        try {
            const savedCart = localStorage.getItem('checkoutCart') || localStorage.getItem('cart');
            if (savedCart) {
                checkoutCartItems = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading checkout cart:', error);
            checkoutCartItems = [];
        }
    }

    // Load order history from localStorage
    function loadOrderHistory() {
        try {
            const savedHistory = localStorage.getItem('orderHistory');
            if (savedHistory) {
                orderHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Error loading order history:', error);
            orderHistory = [];
        }
    }

    // Save order history to localStorage
    function saveOrderHistory() {
        try {
            localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        } catch (error) {
            console.error('Error saving order history:', error);
        }
    }

    // Render checkout items
    function renderCheckoutItems() {
        const checkoutContainer = document.querySelector('.checkout-items-container');
        if (!checkoutContainer) return;

        checkoutContainer.innerHTML = '';
        checkoutCartItems.forEach((item, index) => {
            const itemHTML = `
                <div class="checkout-item">
                    <img src="${item.image}" alt="${item.name}" class="checkout-item-image">
                    <div class="checkout-item-details">
                        <h4 class="checkout-item-name">${item.name}</h4>
                        <p class="checkout-item-category">${item.category || 'General'}</p>
                        <div class="checkout-item-quantity">Qty: ${item.quantity}</div>
                        <div class="checkout-item-price">Rs. ${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                </div>
            `;
            checkoutContainer.innerHTML += itemHTML;
        });
    }

    // Update checkout totals
    function updateCheckoutTotals() {
        const subtotal = checkoutCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 599 ? 0 : 50.00;
        const tax = subtotal * 0.05;
        const total = subtotal + shipping + tax;

        const subtotalElement = document.getElementById('checkout-subtotal');
        const shippingElement = document.getElementById('checkout-shipping');
        const taxElement = document.getElementById('checkout-tax');
        const totalElement = document.getElementById('checkout-total');

        if (subtotalElement) subtotalElement.textContent = `Rs. ${subtotal.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = `Rs. ${shipping.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `Rs. ${tax.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `Rs. ${total.toFixed(2)}`;

        return {
            subtotal,
            shipping,
            tax,
            total
        };
    }

    // Generate order ID
    function generateOrderId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `ORD-${timestamp}-${random}`;
    }

    // Process order
    async function processOrder(orderData) {
        const orderId = generateOrderId();
        const totals = updateCheckoutTotals();

        const order = {
            id: orderId,
            date: new Date().toISOString(),
            status: 'confirmed',
            items: [...checkoutCartItems],
            customer: {
                firstName: orderData.firstName,
                lastName: orderData.lastName,
                email: orderData.email,
                phone: orderData.phone,
                address: {
                    street: orderData.address,
                    city: orderData.city,
                    state: orderData.state,
                    zipCode: orderData.zipCode,
                    country: orderData.country
                }
            },
            payment: {
                method: orderData.paymentMethod,
                cardNumber: orderData.cardNumber ? orderData.cardNumber.replace(/\d(?=\d{4})/g, "*") : null,
                cardName: orderData.cardName || null
            },
            totals: totals,
            notes: orderData.orderNotes || '',
            newsletter: orderData.newsletter || false
        };

        // Add to order history (localStorage)
        orderHistory.unshift(order);
        saveOrderHistory();

        // Send order to backend API
        try {
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            const token = localStorage.getItem('token');

            // Prepare order data for backend
            const backendOrderData = {
                items: checkoutCartItems.map(item => ({
                    productId: item.productId || null,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                shippingAddress: {
                    name: `${orderData.firstName} ${orderData.lastName}`,
                    address: orderData.address,
                    city: orderData.city,
                    state: orderData.state,
                    zipCode: orderData.zipCode,
                    phone: orderData.phone
                },
                paymentMethod: orderData.paymentMethod || 'COD',
                notes: orderData.orderNotes || ''
            };

            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(backendOrderData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Order successfully sent to backend:', result);
                // Update order ID if backend returned one
                if (result.data && result.data.order && result.data.order._id) {
                    order.id = result.data.order._id;
                }
            } else {
                console.warn('Failed to send order to backend, but order saved locally');
            }
        } catch (error) {
            console.error('Error sending order to backend:', error);
            // Continue with order confirmation even if backend call fails
        }

        // Clear cart
        localStorage.removeItem('cart');
        localStorage.removeItem('checkoutCart');

        // Show success message and redirect
        showOrderConfirmation(orderId);
    }

    // Show order confirmation
    function showOrderConfirmation(orderId) {
        const confirmationHTML = `
            <div class="order-confirmation-overlay">
                <div class="order-confirmation-modal">
                    <div class="confirmation-header">
                        <i class="fas fa-check-circle"></i>
                        <h2>Order Placed Successfully!</h2>
                    </div>
                    <div class="confirmation-content">
                        <p><strong>Order ID:</strong> ${orderId}</p>
                        <p>Thank you for your order! We've sent a confirmation email to your registered email address.</p>
                        <p>Your order will be processed and shipped within 2-3 business days.</p>
                        <div class="confirmation-actions">
                            <button onclick="window.location.href='index.html'" class="btn-primary">Continue Shopping</button>
                            <button onclick="window.location.href='order-history.html'" class="btn-secondary">View Order History</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', confirmationHTML);
    }

    // Initialize checkout page
    function initializeCheckoutPage() {
        loadCheckoutCart();
        loadOrderHistory();

        if (checkoutCartItems.length === 0) {
            alert('Your cart is empty. Redirecting to products page.');
            window.location.href = 'index.html';
            return;
        }

        renderCheckoutItems();
        updateCheckoutTotals();

        // Handle payment method selection
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        const cardDetails = document.getElementById('card-details');

        paymentMethods.forEach(method => {
            method.addEventListener('change', function() {
                if (this.value === 'creditCard') {
                    if (cardDetails) cardDetails.style.display = 'block';
                    document.getElementById('cardNumber').required = true;
                    document.getElementById('expiryDate').required = true;
                    document.getElementById('cvv').required = true;
                    document.getElementById('cardName').required = true;
                } else {
                    if (cardDetails) cardDetails.style.display = 'none';
                    document.getElementById('cardNumber').required = false;
                    document.getElementById('expiryDate').required = false;
                    document.getElementById('cvv').required = false;
                    document.getElementById('cardName').required = false;
                }
            });
        });

        // Handle form submission
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function(e) {
                e.preventDefault();

                const formData = new FormData(this);
                const orderData = {};

                for (let [key, value] of formData.entries()) {
                    orderData[key] = value;
                }

                // Validate form
                if (!orderData.firstName || !orderData.lastName || !orderData.email || !orderData.phone) {
                    alert('Please fill in all required personal information fields.');
                    return;
                }

                if (!orderData.address || !orderData.city || !orderData.state || !orderData.zipCode || !orderData.country) {
                    alert('Please fill in all required address fields.');
                    return;
                }

                if (!orderData.paymentMethod) {
                    alert('Please select a payment method.');
                    return;
                }

                if (orderData.paymentMethod === 'creditCard') {
                    if (!orderData.cardNumber || !orderData.expiryDate || !orderData.cvv || !orderData.cardName) {
                        alert('Please fill in all card details.');
                        return;
                    }
                }

                if (!orderData.terms) {
                    alert('Please accept the Terms and Conditions to proceed.');
                    return;
                }

                // Process order
                processOrder(orderData);
            });
        }
    }

    // Check if we're on the checkout page and initialize
    if (document.querySelector('.checkout-section')) {
        initializeCheckoutPage();
    }
});