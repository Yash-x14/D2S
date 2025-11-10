// Cart page (cart.html) specific functionality
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
    let cartItems = [];

    // Get authentication token
    function getToken() {
        return localStorage.getItem('token') || localStorage.getItem('dealerToken') || '';
    }

    // Get user ID
    function getUserId() {
        return localStorage.getItem('userId') || '';
    }

    // Load cart from backend API
    async function loadCartFromAPI() {
        const userId = getUserId();
        const token = getToken();

        if (!userId || !token) {
            console.log('User not logged in, cart will be empty');
            cartItems = [];
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const cart = data.data?.cart;
                
                if (cart && cart.items) {
                    // Convert cart items to format expected by render function
                    cartItems = cart.items.map(item => ({
                        productId: item.productId?._id || item.productId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image || item.productId?.imageURL || item.productId?.image || item.productId?.primaryImage || '',
                        category: item.productId?.category || 'General'
                    }));
                    console.log(`✅ Loaded ${cartItems.length} items from backend cart`);
                } else {
                    cartItems = [];
                }
            } else {
                console.error('Failed to load cart from API');
                cartItems = [];
            }
        } catch (error) {
            console.error('Error loading cart from API:', error);
            cartItems = [];
        }
    }

    // Render cart items dynamically
    function renderCartItems() {
        const cartContainer = document.querySelector('.cart-items-container');
        if (!cartContainer) return;

        if (cartItems.length === 0) {
            cartContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any items to your cart yet.</p>
                    <a href="variety.html" class="continue-shopping-btn" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px;">
                        <i class="fas fa-arrow-left"></i>
                        Continue Shopping
                    </a>
                </div>
            `;

            const orderSummary = document.querySelector('.order-summary');
            if (orderSummary) {
                orderSummary.innerHTML = `
                    <h3>Order Summary</h3>
                    <div class="summary-item">
                        <span>Subtotal (0 items)</span>
                        <span>Rs. 0.00</span>
                    </div>
                    <div class="summary-item">
                        <span>Shipping</span>
                        <span>Rs. 0.00</span>
                    </div>
                    <div class="summary-item">
                        <span>Tax</span>
                        <span>Rs. 0.00</span>
                    </div>
                    <div class="summary-item total">
                        <span>Total</span>
                        <span>Rs. 0.00</span>
                    </div>
                    <button class="checkout-btn" disabled style="opacity: 0.5; cursor: not-allowed; padding: 12px 24px; background-color: #ccc; color: #666; border: none; border-radius: 5px;">
                        <i class="fas fa-lock"></i>
                        Proceed to Checkout
                    </button>
                    <a href="variety.html" class="continue-shopping-btn" style="display: block; text-align: center; margin-top: 15px; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px;">
                        <i class="fas fa-arrow-left"></i>
                        Continue Shopping
                    </a>
                `;
            }
            return;
        }

        // Render cart items
        cartContainer.innerHTML = '';
        cartItems.forEach((item, index) => {
            const cartItemHTML = `
                <div class="cart-item" data-index="${index}" data-product-id="${item.productId}">
                    <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/100'">
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${item.name}</h3>
                        <p class="cart-item-category">${item.category || 'General'}</p>
                        <div class="cart-item-price">
                            <span class="current-price">Rs. ${item.price.toFixed(2)}</span>
                        </div>
                        <div class="cart-item-quantity">
                            <div class="quantity-control">
                                <button class="quantity-btn" data-action="decrease" data-index="${index}" data-product-id="${item.productId}">-</button>
                                <input type="number" value="${item.quantity}" min="1" class="quantity-display" data-index="${index}" data-product-id="${item.productId}">
                                <button class="quantity-btn" data-action="increase" data-index="${index}" data-product-id="${item.productId}">+</button>
                            </div>
                            <button class="remove-item" data-index="${index}" data-product-id="${item.productId}">Remove</button>
                        </div>
                    </div>
                </div>
            `;
            cartContainer.innerHTML += cartItemHTML;
        });

        // Enable checkout button when there are items
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.cursor = 'pointer';
            checkoutBtn.style.backgroundColor = '#ff6b35';
            checkoutBtn.style.color = 'white';
        }
    }

    // Update cart totals
    function updateCartTotals() {
        const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 599 ? 0 : 50.00;
        const tax = subtotal * 0.05;
        const total = subtotal + shipping + tax;

        const subtotalElement = document.querySelector('.summary-item:nth-child(2) span:last-child');
        const shippingElement = document.querySelector('.summary-item:nth-child(3) span:last-child');
        const taxElement = document.querySelector('.summary-item:nth-child(4) span:last-child');
        const totalElement = document.querySelector('.summary-item.total span:last-child');
        const itemCountElement = document.querySelector('.summary-item:nth-child(2) span:first-child');

        if (subtotalElement) subtotalElement.textContent = `Rs. ${subtotal.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = `Rs. ${shipping.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `Rs. ${tax.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `Rs. ${total.toFixed(2)}`;

        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        if (itemCountElement) itemCountElement.textContent = `Subtotal (${totalItems} items)`;

        // Update cart count in navbar
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(el => {
            el.textContent = totalItems;
        });
    }

    // Update quantity in backend
    async function updateQuantityInBackend(productId, newQuantity) {
        const userId = getUserId();
        const token = getToken();

        if (!userId || !token) {
            console.error('User not logged in');
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/item/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    quantity: newQuantity
                })
            });

            if (response.ok) {
                // Reload cart from API
                await loadCartFromAPI();
                renderCartItems();
                updateCartTotals();
                attachCartEventListeners();
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update quantity');
            }
        } catch (error) {
            console.error('Error updating quantity in backend:', error);
            return false;
        }
    }

    // Quantity control functions
    async function updateQuantity(index, change) {
        const item = cartItems[index];
        if (!item) return;

        const currentQuantity = item.quantity;
        const newQuantity = Math.max(1, currentQuantity + change);

        // Update local state immediately for better UX
        item.quantity = newQuantity;
        renderCartItems();
        updateCartTotals();
        attachCartEventListeners();

        // Update in backend
        await updateQuantityInBackend(item.productId, newQuantity);
    }

    // Remove item function
    async function removeItem(index) {
        const item = cartItems[index];
        if (!item) return;

        if (confirm('Are you sure you want to remove this item from your cart?')) {
            const userId = getUserId();
            const token = getToken();

            if (userId && token) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/item/${item.productId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Failed to remove item');
                    }
                } catch (error) {
                    console.error('Error removing item from backend:', error);
                    alert('Failed to remove item. Please try again.');
                    return;
                }
            }

            // Reload cart from API
            await loadCartFromAPI();
            renderCartItems();
            updateCartTotals();
            attachCartEventListeners();
        }
    }

    // Proceed to checkout function
    function proceedToCheckout() {
        if (cartItems.length === 0) {
            alert('Your cart is empty. Please add some items before proceeding to checkout.');
            return;
        }

        // Save cart items for checkout page
        localStorage.setItem('checkoutCart', JSON.stringify(cartItems));

        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            checkoutBtn.disabled = true;
        }

        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 500);
    }

    // Attach event listeners to cart elements
    function attachCartEventListeners() {
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const action = this.getAttribute('data-action');

                if (action === 'increase') {
                    updateQuantity(index, 1);
                } else if (action === 'decrease') {
                    updateQuantity(index, -1);
                }
            });
        });

        document.querySelectorAll('.quantity-display').forEach((input, index) => {
            input.addEventListener('change', async function() {
                const newQuantity = Math.max(1, parseInt(this.value) || 1);
                const item = cartItems[index];
                if (item) {
                    await updateQuantityInBackend(item.productId, newQuantity);
                }
            });
        });

        document.querySelectorAll('.remove-item').forEach((btn, index) => {
            btn.addEventListener('click', function() {
                removeItem(index);
            });
        });

        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn && !checkoutBtn.disabled) {
            checkoutBtn.replaceWith(checkoutBtn.cloneNode(true));
            const newCheckoutBtn = document.querySelector('.checkout-btn');
            newCheckoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                proceedToCheckout();
            });
        }

        const continueBtn = document.querySelector('.continue-shopping-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'variety.html';
            });
        }
    }

    // Initialize cart page functionality
    async function initializeCartPage() {
        // Show loading state
        const cartContainer = document.querySelector('.cart-items-container');
        if (cartContainer) {
            cartContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #ff6b35;"></i>
                    <p style="margin-top: 16px; color: #6b7280;">Loading cart...</p>
                </div>
            `;
        }

        await loadCartFromAPI();
        renderCartItems();
        updateCartTotals();
        attachCartEventListeners();
    }

    // Check if we're on the cart page and initialize
    if (document.querySelector('.cart-section')) {
        initializeCartPage();
    }
});
