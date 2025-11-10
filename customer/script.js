// All JS runs after DOM is ready to avoid null-reference errors on pages
// where certain components don't exist
document.addEventListener('DOMContentLoaded', function() {
    // --- Cart System ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let cartCount = cart.reduce((total, item) => total + item.quantity, 0);

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
                price: parseFloat(price.replace('Rs. ', '')),
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
        renderCart();
    }

    // Update item quantity
    function updateQuantity(index, newQuantity) {
        if (newQuantity < 1) return;

        const oldQuantity = cart[index].quantity;
        cart[index].quantity = newQuantity;
        cartCount += (newQuantity - oldQuantity);

        saveCart();
        renderCart();
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

    // Render cart page
    function renderCart() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartSummaryContainer = document.querySelector('.cart-summary');

        if (!cartItemsContainer || !cartSummaryContainer) return;

        // Render cart items
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <a href="index.html" class="continue-shopping-btn">Start Shopping</a>
        </div>
      `;

            // Render empty cart summary
            cartSummaryContainer.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>Rs. 0.00</span>
        </div>
        <div class="summary-row">
          <span>Shipping:</span>
          <span>Rs. 0.00</span>
        </div>
        <div class="summary-row">
          <span>Tax:</span>
          <span>Rs. 0.00</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>Rs. 0.00</span>
        </div>
        
        <button class="checkout-btn" disabled>Proceed to Checkout</button>
        <a href="index.html" class="continue-shopping-btn">Continue Shopping</a>
      `;
            return;
        }

        cart.forEach((item, index) => {
            const cartItemHTML = `
        <div class="cart-item" data-index="${index}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <h3>${item.name}</h3>
            <p class="cart-item-price">Rs. ${item.price.toFixed(2)}</p>
            <p class="cart-item-weight">${item.weight}</p>
            <div class="cart-item-quantity">
              <button class="qty-btn" data-action="decrease" data-index="${index}">-</button>
              <input type="number" value="${item.quantity}" min="1" class="qty-input" data-index="${index}">
              <button class="qty-btn" data-action="increase" data-index="${index}">+</button>
            </div>
          </div>
          <button class="remove-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
        </div>
      `;
            cartItemsContainer.innerHTML += cartItemHTML;
        });

        // Render cart summary
        const totals = calculateTotals();
        cartSummaryContainer.innerHTML = `
      <h3>Order Summary</h3>
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>Rs. ${totals.subtotal.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping:</span>
        <span>${totals.shipping === 0 ? 'Free' : 'Rs. ' + totals.shipping.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Tax:</span>
        <span>Rs. ${totals.tax.toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span>Total:</span>
        <span>Rs. ${totals.total.toFixed(2)}</span>
      </div>
      
      <button class="checkout-btn">Proceed to Checkout</button>
      <a href="index.html" class="continue-shopping-btn">Continue Shopping</a>
    `;

        // Add event listeners to new elements
        addCartEventListeners();
    }

    // Add event listeners to cart elements
    function addCartEventListeners() {
        // Quantity buttons
        const qtyBtns = document.querySelectorAll('.cart-item .qty-btn');
        qtyBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const action = this.dataset.action;
                const input = this.parentNode.querySelector('.qty-input');
                let currentQty = parseInt(input.value);

                if (action === 'decrease' && currentQty > 1) {
                    currentQty--;
                } else if (action === 'increase') {
                    currentQty++;
                }

                input.value = currentQty;
                updateQuantity(index, currentQty);
            });
        });

        // Quantity input changes
        const qtyInputs = document.querySelectorAll('.cart-item .qty-input');
        qtyInputs.forEach(input => {
            input.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                const newQty = parseInt(this.value);
                if (newQty >= 1) {
                    updateQuantity(index, newQty);
                }
            });
        });

        // Remove buttons
        const removeBtns = document.querySelectorAll('.cart-item .remove-btn');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                removeFromCart(index);
            });
        });

        // Continue shopping button
        const continueBtn = document.querySelector('.continue-shopping-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', function() {
                window.location.href = 'index.html';
            });
        }

        // Checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                if (cart.length === 0) {
                    alert('Your cart is empty!');
                    return;
                }
                alert('Proceeding to checkout...');
                // Here you would typically redirect to a checkout page
            });
        }
    }

    // Initialize cart display
    updateCartCount();

    // Render cart if on cart page
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }

    // --- Cart count (navbar) ---
    const addCartBtns = document.querySelectorAll('.add-cart-btn');
    if (addCartBtns.length > 0) {
        addCartBtns.forEach((btn) => {
            btn.addEventListener('click', function() {
                const productCard = this.closest('.product-card');
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = productCard.querySelector('p').textContent;
                const productImage = productCard.querySelector('img').src;
                const weightSelect = productCard.querySelector('select');
                const weight = weightSelect ? weightSelect.value : '200 Gms';
                const quantityInput = productCard.querySelector('.qty-input');
                const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

                // Add the item to cart with the selected quantity
                for (let i = 0; i < quantity; i++) {
                    addToCart(productName, productPrice, productImage, weight);
                }

                // Show visual feedback
                this.textContent = 'Added!';
                this.style.backgroundColor = '#28a745';

                // Reset button after 1 second
                setTimeout(() => {
                    this.textContent = 'Add to cart';
                    this.style.backgroundColor = '';
                }, 1000);

                // Reset quantity to 1 after adding
                if (quantityInput) {
                    quantityInput.value = '1';
                }
            });
        });
    }

    // --- Quantity selector controls (product cards) ---
    const qtyRows = document.querySelectorAll('.quantity-row');
    if (qtyRows.length > 0) {
        qtyRows.forEach((row) => {
            const input = row.querySelector('.qty-input');
            const decBtn = row.querySelector('[data-action="decrease"]');
            const incBtn = row.querySelector('[data-action="increase"]');
            if (!input) return;
            if (decBtn) {
                decBtn.addEventListener('click', () => {
                    const currentValue = parseInt(input.value, 10) || 1;
                    if (currentValue > 1) input.value = String(currentValue - 1);
                });
            }
            if (incBtn) {
                incBtn.addEventListener('click', () => {
                    const currentValue = parseInt(input.value, 10) || 0;
                    input.value = String(currentValue + 1);
                });
            }
        });
    }

    // --- Filter buttons ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach((btn) => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                alert('Filter: ' + btn.textContent);
            });
        });
    }

    // --- Search button ---
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = prompt('Enter product name to search:');
            if (searchTerm && searchTerm.trim()) {
                // Search functionality - you can implement actual search logic here
                alert(`Searching for: ${searchTerm}`);
                // Redirect to homepage
                window.location.href = 'index.html';
            }
        });
    }

    // --- Clear cart functionality ---
    function clearCart() {
        cart = [];
        cartCount = 0;
        saveCart();
        if (window.location.pathname.includes('cart.html')) {
            renderCart();
        }
    }

    // Add clear cart button to cart page
    function addClearCartButton() {
        const cartSummary = document.querySelector('.cart-summary');
        if (cartSummary && cart.length > 0) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'clear-cart-btn';
            clearBtn.textContent = 'Clear Cart';
            clearBtn.style.cssText = `
        width: 100%;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.3s;
        margin-bottom: 15px;
      `;

            clearBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to clear your cart?')) {
                    clearCart();
                }
            });

            // Insert before the checkout button
            const checkoutBtn = cartSummary.querySelector('.checkout-btn');
            if (checkoutBtn) {
                checkoutBtn.parentNode.insertBefore(clearBtn, checkoutBtn);
            }
        }
    }

    // Initialize clear cart button if on cart page
    if (window.location.pathname.includes('cart.html')) {
        setTimeout(addClearCartButton, 100);
    }

    // --- Hero Slider Logic (scoped to .hero-slider) ---
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
        const slides = heroSlider.querySelectorAll('.slide');
        const indicators = heroSlider.querySelectorAll('.indicator');
        const leftArrow = heroSlider.querySelector('.slider-arrow.left');
        const rightArrow = heroSlider.querySelector('.slider-arrow.right');
        let currentSlide = 0;
        let heroSliderInterval;

        function showSlide(idx) {
            if (slides.length === 0) return;
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === idx);
            });
            indicators.forEach((ind, i) => {
                ind.classList.toggle('active', i === idx);
            });
            currentSlide = idx;
        }

        function nextSlide() {
            if (slides.length === 0) return;
            const next = (currentSlide + 1) % slides.length;
            showSlide(next);
        }

        function prevSlide() {
            if (slides.length === 0) return;
            const prev = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(prev);
        }

        if (rightArrow) {
            rightArrow.addEventListener('click', () => {
                nextSlide();
                resetHeroSliderInterval();
            });
        }
        if (leftArrow) {
            leftArrow.addEventListener('click', () => {
                prevSlide();
                resetHeroSliderInterval();
            });
        }
        indicators.forEach((ind, i) => {
            ind.addEventListener('click', () => {
                showSlide(i);
                resetHeroSliderInterval();
            });
        });

        function startHeroSliderInterval() {
            stopHeroSliderInterval();
            heroSliderInterval = setInterval(nextSlide, 6000);
        }

        function stopHeroSliderInterval() {
            if (heroSliderInterval) clearInterval(heroSliderInterval);
        }

        function resetHeroSliderInterval() {
            stopHeroSliderInterval();
            startHeroSliderInterval();
        }

        showSlide(0);
        startHeroSliderInterval();
    }

    // --- Product Slider Carousel (scoped to .product-slider-section) ---
    const productSection = document.querySelector('.product-slider-section');
    const MINI_IMAGES = [
        'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop&crop=center', // Chips (moved to first)
        'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=200&h=200&fit=crop&crop=center', // Chocolate
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop&crop=center', // Namkeen
        'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop&crop=center' // Juice
    ];

    const sliderData = [{
            price: '$32',
            title: 'Chocolate Delight',
            desc: 'Rich dark chocolate treat for a perfect snack time.',
            mainImg: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=400&fit=crop&crop=center',
            miniImgs: MINI_IMAGES
        },
        {
            price: '$28',
            title: 'Chiwda Mix',
            desc: 'Crispy, savory chiwda namkeen with nuts and spices.',
            mainImg: 'https://images.unsplash.com/photo-1515542706656-8e6ef17a1521?w=400&h=400&fit=crop&crop=center',
            miniImgs: MINI_IMAGES
        },
        {
            price: '$30',
            title: 'Traditional Namkeen',
            desc: 'Classic Indian savory snack mix for every occasion.',
            mainImg: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop&crop=center',
            miniImgs: MINI_IMAGES
        },
        {
            price: '$26',
            title: 'Fresh Fruit Juice',
            desc: 'Refreshing and healthy fruit juice to energize your day.',
            mainImg: 'https://images.unsplash.com/photo-1542444459-db63c6a0a03b?w=400&h=400&fit=crop&crop=center',
            miniImgs: MINI_IMAGES
        },
        {
            price: '$35',
            title: 'Premium Snack Pack',
            desc: 'A curated mix of popular snacks to enjoy anytime.',
            mainImg: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop&crop=center',
            miniImgs: MINI_IMAGES
        }
    ];
    if (productSection) {
        let sliderIndex = 0;

        function updateSlider() {
            const data = sliderData[sliderIndex];
            const priceEl = productSection.querySelector('.slider-left .slider-price');
            const titleEl = productSection.querySelector('.slider-left .slider-title');
            const descEl = productSection.querySelector('.slider-left .slider-desc');
            const mainImgEl = productSection.querySelector('.slider-right .slider-main-img');
            const miniImgs = productSection.querySelectorAll('.slider-right .slider-mini-img');
            if (priceEl) priceEl.textContent = data.price;
            if (titleEl) titleEl.innerHTML = data.title.replace(/\n/g, '<br>');
            if (descEl) descEl.textContent = data.desc;
            if (mainImgEl) mainImgEl.src = data.mainImg;
            if (miniImgs.length > 0) {
                miniImgs.forEach((img, i) => {
                    if (data.miniImgs[i]) img.src = data.miniImgs[i];
                });
            }
        }

        const leftArrow = productSection.querySelector('.slider-arrows .slider-arrow.left');
        const rightArrow = productSection.querySelector('.slider-arrows .slider-arrow.right');
        if (leftArrow) {
            leftArrow.addEventListener('click', () => {
                sliderIndex = (sliderIndex - 1 + sliderData.length) % sliderData.length;
                updateSlider();
            });
        }
        if (rightArrow) {
            rightArrow.addEventListener('click', () => {
                sliderIndex = (sliderIndex + 1) % sliderData.length;
                updateSlider();
            });
        }

        updateSlider();
    }

    // --- Cart UI (runs only if cart container exists on the page) ---
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartItemCount = document.getElementById('cartItemCount');
    const subtotalItems = document.getElementById('subtotalItems');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const totalPayable = document.getElementById('totalPayable');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const productModal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeModal');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // Tip controls
    const tipButtons = document.querySelectorAll('.tip-btn');
    const tipPercentageInput = document.querySelector('.tip-percentage');
    const tipAmountDisplay = document.querySelector('.tip-amount');
    const tipTotalDisplay = document.querySelector('.tip-total');

    // Only initialize cart logic if the main container exists
    if (cartItemsContainer) {
        // Initial cart state
        const initialCartItems = [{
                id: 1,
                name: 'Delightful Honey - Brown Contact Lenses',
                category: 'Canadian Footwear',
                originalPrice: 652.00,
                currentPrice: 652.00,
                discount: 20,
                quantity: 1,
                image: '👁',
                color: 'Blue, Brown',
                size: '6'
            },
            {
                id: 2,
                name: 'Acton Propulsion',
                category: 'Canadian Footwear',
                originalPrice: 652.00,
                currentPrice: 652.00,
                discount: 20,
                quantity: 1,
                image: '👟',
                color: 'Blue, Brown',
                size: '6'
            },
            {
                id: 3,
                name: 'Kodiak Trek',
                category: 'Canadian Footwear',
                originalPrice: 652.00,
                currentPrice: 652.00,
                discount: 20,
                quantity: 1,
                image: '🥾',
                color: 'Blue, Brown',
                size: '6'
            },
            {
                id: 4,
                name: 'Terra Crossbow',
                category: 'Canadian Footwear',
                originalPrice: 652.00,
                currentPrice: 652.00,
                discount: 20,
                quantity: 1,
                image: '👢',
                color: 'Blue, Brown',
                size: '6'
            }
        ];

        let cart = [...initialCartItems];
        let selectedTip = 4; // percent
        let deliveryFee = 7.99;
        let serviceFee = 1.50;
        let tax = 7.00;
        let credits = 8.00;

        // Event listeners for cart controls
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', handleCheckout);
        }
        if (closeModal && productModal) {
            closeModal.addEventListener('click', closeProductModal);
            productModal.addEventListener('click', function(e) {
                if (e.target === productModal) closeProductModal();
            });
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeProductModal();
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleCheckout();
            }
        });

        const applyCouponBtn = document.querySelector('.apply-coupon-btn');
        if (applyCouponBtn) applyCouponBtn.addEventListener('click', applyCoupon);

        const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
        if (deliveryOptions.length > 0) {
            deliveryOptions.forEach(option => {
                option.addEventListener('change', updateDeliveryOption);
            });
        }

        const creditsCheckbox = document.getElementById('useCredits');
        if (creditsCheckbox) creditsCheckbox.addEventListener('change', updateCredits);

        // Tip handlers
        if (tipButtons.length > 0) {
            tipButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    tipButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    selectedTip = parseFloat(this.dataset.tip || '0') || 0;
                    updateTipCalculations();
                });
            });
        }
        if (tipPercentageInput) {
            tipPercentageInput.addEventListener('input', function() {
                const percentage = parseFloat(this.value) || 0;
                const subtotal = calculateSubtotal();
                const tipAmount = (subtotal * percentage / 100);
                if (tipAmountDisplay) tipAmountDisplay.textContent = `$${tipAmount.toFixed(2)}`;
                updateTipCalculations();
            });
        }

        // Render cart
        loadCartFromStorage();
        updateCartDisplay();

        // Functions
        function displayCartItems() {
            if (!cartItemsContainer) return;
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `
          <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <button class="continue-shopping-btn" onclick="">
              <i class="fas fa-arrow-left"></i>
              Continue Shopping
            </button>
          </div>
        `;
            } else {
                cartItemsContainer.innerHTML = '';
                cart.forEach(item => {
                    const cartItem = createCartItem(item);
                    cartItemsContainer.appendChild(cartItem);
                });
            }
        }

        function createCartItem(item) {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
        <div class="cart-item-image">${item.image}</div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-category">${item.category}</div>
          <div class="cart-item-category">Color: ${item.color} | Size: ${item.size}</div>
          <div class="cart-item-price">
            <span class="original-price">$${item.originalPrice.toFixed(2)}</span>
            <span class="current-price">$${item.currentPrice.toFixed(2)}</span>
            <span class="discount-badge">${item.discount}% OFF</span>
          </div>
          <div class="cart-item-quantity">
            <div class="quantity-control">
              <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
              <input type="number" class="quantity-display" value="${item.quantity}" data-id="${item.id}" min="1">
              <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
            </div>
            <button class="remove-item" data-id="${item.id}"><i class="fas fa-times"></i> Remove</button>
          </div>
        </div>
      `;

            const decreaseBtn = cartItem.querySelector('[data-action="decrease"]');
            const increaseBtn = cartItem.querySelector('[data-action="increase"]');
            const removeBtn = cartItem.querySelector('.remove-item');
            const quantityInput = cartItem.querySelector('.quantity-display');

            if (decreaseBtn) decreaseBtn.addEventListener('click', () => updateQuantity(item.id, -1));
            if (increaseBtn) increaseBtn.addEventListener('click', () => updateQuantity(item.id, 1));
            if (removeBtn) removeBtn.addEventListener('click', () => removeFromCart(item.id));
            if (quantityInput) quantityInput.addEventListener('change', (e) => updateQuantityDirect(item.id, parseInt(e.target.value, 10)));

            return cartItem;
        }

        function updateQuantity(productId, change) {
            const item = cart.find(i => i.id === productId);
            if (!item) return;
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                updateCartDisplay();
                showToast(`Quantity updated for ${item.name}`);
            }
        }

        function updateQuantityDirect(productId, newQuantity) {
            const item = cart.find(i => i.id === productId);
            if (!item) return;
            if (newQuantity > 0) {
                item.quantity = newQuantity;
                updateCartDisplay();
                showToast(`Quantity updated for ${item.name}`);
            } else {
                removeFromCart(productId);
            }
        }

        function removeFromCart(productId) {
            const index = cart.findIndex(i => i.id === productId);
            if (index === -1) return;
            const removedItem = cart[index];
            cart.splice(index, 1);
            updateCartDisplay();
            showToast(`${removedItem.name} removed from cart`);
        }

        function updateCartSummary() {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const subtotal = calculateSubtotal();
            if (cartItemCount) cartItemCount.textContent = String(totalItems);
            if (subtotalItems) subtotalItems.textContent = String(totalItems);
            if (subtotalAmount) subtotalAmount.textContent = `$${subtotal.toFixed(2)}`;
            updateTotalPayable();
        }

        function calculateSubtotal() {
            return cart.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
        }

        function updateTipCalculations() {
            const subtotal = calculateSubtotal();
            const tipAmount = (subtotal * selectedTip / 100);
            if (tipAmountDisplay) tipAmountDisplay.textContent = `$${tipAmount.toFixed(2)}`;
            if (tipTotalDisplay) tipTotalDisplay.textContent = `Total: $${tipAmount.toFixed(2)}`;
            updateTotalPayable();
        }

        function updateTotalPayable() {
            if (!totalPayable) return;
            const subtotal = calculateSubtotal();
            const tipAmount = (subtotal * selectedTip / 100);
            const useCreditsEl = document.getElementById('useCredits');
            const creditsAmount = useCreditsEl && useCreditsEl.checked ? credits : 0;
            const total = subtotal + deliveryFee + serviceFee + tax + tipAmount - creditsAmount;
            totalPayable.textContent = `$${total.toFixed(2)}`;
        }

        function applyCoupon() {
            const couponInput = document.querySelector('.coupon-input');
            const couponCode = couponInput ? couponInput.value.trim() : '';
            if (couponCode) {
                showToast(`Coupon "${couponCode}" applied successfully!`);
                if (couponInput) couponInput.value = '';
            } else {
                showToast('Please enter a coupon code');
            }
        }

        function updateDeliveryOption() {
            const deliveryRadio = document.getElementById('delivery');
            const pickupRadio = document.getElementById('pickup');
            if (deliveryRadio && deliveryRadio.checked) deliveryFee = 7.99;
            else if (pickupRadio && pickupRadio.checked) deliveryFee = 0;
            updateTotalPayable();
            showToast('Delivery option updated');
        }

        function updateCredits() {
            updateTotalPayable();
            showToast('Credits option updated');
        }

        function handleCheckout() {
            if (cart.length === 0) {
                showToast('Your cart is empty!');
                return;
            }
            const subtotal = calculateSubtotal();
            const tipAmount = (subtotal * selectedTip / 100);
            const useCreditsEl = document.getElementById('useCredits');
            const creditsAmount = useCreditsEl && useCreditsEl.checked ? credits : 0;
            const total = subtotal + deliveryFee + serviceFee + tax + tipAmount - creditsAmount;

            if (modalBody && productModal) {
                modalBody.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 3rem; color: #4CAF50; margin-bottom: 1rem;">
              <i class="fas fa-credit-card"></i>
            </div>
            <h2 style="margin-bottom: 1rem;">Checkout Summary</h2>
            <div style="margin-bottom: 2rem;">
              <p><strong>Total Items:</strong> ${cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
              <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
              <p><strong>Delivery:</strong> $${deliveryFee.toFixed(2)}</p>
              <p><strong>Service Fee:</strong> $${serviceFee.toFixed(2)}</p>
              <p><strong>Tax:</strong> $${tax.toFixed(2)}</p>
              <p><strong>Tip:</strong> $${tipAmount.toFixed(2)}</p>
              <p><strong>Credits Applied:</strong> -$${creditsAmount.toFixed(2)}</p>
              <p><strong>Total Amount:</strong> $${total.toFixed(2)}</p>
            </div>
            <div style="background: #f0f0f0; padding: 1rem; border-radius: 10px; margin-bottom: 2rem;">
              <h3>Order Items:</h3>
              ${cart.map(item => `
                <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                  <span>${item.name} x${item.quantity}</span>
                  <span>$${(item.currentPrice * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <button class="checkout-btn" id="processCheckoutBtn">
              <i class="fas fa-lock"></i>
              Process Payment
            </button>
          </div>
        `;
                productModal.style.display = 'block';
                const processBtn = document.getElementById('processCheckoutBtn');
                if (processBtn) processBtn.addEventListener('click', processCheckout);
            }
        }

        function processCheckout() {
            showToast('Processing payment...');
            setTimeout(() => {
                closeProductModal();
                showToast('Payment successful! Order placed.');
                cart = [];
                updateCartDisplay();
                if (modalBody && productModal) {
                    modalBody.innerHTML = `
            <div style="text-align: center;">
              <div style="font-size: 4rem; color: #4CAF50; margin-bottom: 1rem;">
                <i class="fas fa-check-circle"></i>
              </div>
              <h2 style="margin-bottom: 1rem; color: #4CAF50;">Order Successful!</h2>
              <p style="color: #666; margin-bottom: 2rem;">Thank you for your purchase. You will receive an email confirmation shortly.</p>
              <button class="checkout-btn" id="closeModalBtn">Continue Shopping</button>
            </div>
          `;
                    productModal.style.display = 'block';
                    const closeBtn = document.getElementById('closeModalBtn');
                    if (closeBtn) closeBtn.addEventListener('click', closeProductModal);
                }
            }, 2000);
        }

        function closeProductModal() {
            if (productModal) productModal.style.display = 'none';
        }

        function showToast(message) {
            if (toast && toastMessage) {
                toastMessage.textContent = message;
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
            } else {
                // Fallback if toast UI not present
                console.log(message);
            }
        }

        function saveCartToStorage() {
            try {
                localStorage.setItem('cart', JSON.stringify(cart));
            } catch (_) {}
        }

        function loadCartFromStorage() {
            try {
                const savedCart = localStorage.getItem('cart');
                if (savedCart) cart = JSON.parse(savedCart);
            } catch (_) {}
        }

        function updateCartDisplay() {
            displayCartItems();
            updateCartSummary();
            updateTipCalculations();
            saveCartToStorage();
        }
    }

    // --- Back to Top Functionality ---
    window.scrollToTop = function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Show/hide back to top button based on scroll position
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.style.display = 'flex';
                backToTopBtn.style.opacity = '1';
            } else {
                backToTopBtn.style.display = 'none';
                backToTopBtn.style.opacity = '0';
            }
        });
    }

    // --- Cart Page Functionality ---
    // Load cart items from localStorage or initialize empty array
    let cartItems = [];

    // Load cart from localStorage
    function loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                cartItems = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            cartItems = [];
        }
    }

    // Render cart items dynamically
    function renderCartItems() {
        const cartContainer = document.querySelector('.cart-items-container');
        if (!cartContainer) return;

        if (cartItems.length === 0) {
            // Show empty cart message
            cartContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <a href="index.html" class="continue-shopping-btn" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px;">
            <i class="fas fa-arrow-left"></i>
            Continue Shopping
          </a>
        </div>
      `;

            // Update order summary for empty cart
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
          
          <a href="index.html" class="continue-shopping-btn" style="display: block; text-align: center; margin-top: 15px; padding: 12px 24px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px;">
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
        <div class="cart-item" data-index="${index}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <h3 class="cart-item-title">${item.name}</h3>
            <p class="cart-item-category">${item.category || 'General'}</p>
            <div class="cart-item-price">
              <span class="current-price">Rs. ${item.price.toFixed(2)}</span>
            </div>
            <div class="cart-item-quantity">
              <div class="quantity-control">
                <button class="quantity-btn" data-action="decrease" data-index="${index}">-</button>
                <input type="number" value="${item.quantity}" min="1" class="quantity-display" data-index="${index}">
                <button class="quantity-btn" data-action="increase" data-index="${index}">+</button>
              </div>
              <button class="remove-item" data-index="${index}">Remove</button>
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

    // Update cart totals for cart.html page
    function updateCartTotals() {
        const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 599 ? 0 : 50.00; // Free shipping above Rs. 599
        const tax = subtotal * 0.05; // 5% tax
        const total = subtotal + shipping + tax;

        // Update summary display
        const subtotalElement = document.querySelector('.summary-item:nth-child(2) span:last-child');
        const shippingElement = document.querySelector('.summary-item:nth-child(3) span:last-child');
        const taxElement = document.querySelector('.summary-item:nth-child(4) span:last-child');
        const totalElement = document.querySelector('.summary-item.total span:last-child');
        const itemCountElement = document.querySelector('.summary-item:nth-child(2) span:first-child');

        if (subtotalElement) subtotalElement.textContent = `Rs. ${subtotal.toFixed(2)}`;
        if (shippingElement) shippingElement.textContent = `Rs. ${shipping.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `Rs. ${tax.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `Rs. ${total.toFixed(2)}`;

        // Update item count
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        if (itemCountElement) itemCountElement.textContent = `Subtotal (${totalItems} items)`;
    }

    // Quantity control functions for cart.html page
    function updateQuantity(index, change) {
        const quantityInput = document.querySelectorAll('.quantity-display')[index];
        if (!quantityInput) return;

        const currentQuantity = parseInt(quantityInput.value);
        const newQuantity = Math.max(1, currentQuantity + change);

        quantityInput.value = newQuantity;
        cartItems[index].quantity = newQuantity;

        // Save updated cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cartItems));

        updateCartTotals();
    }

    // Remove item function for cart.html page
    function removeItem(index) {
        if (confirm('Are you sure you want to remove this item from your cart?')) {
            cartItems.splice(index, 1);

            // Save updated cart to localStorage
            localStorage.setItem('cart', JSON.stringify(cartItems));

            // Re-render cart items and update totals
            renderCartItems();
            updateCartTotals();

            // Re-attach event listeners after re-rendering
            attachCartEventListeners();
        }
    }

    // Proceed to checkout function for cart.html page
    function proceedToCheckout() {
        console.log('Proceed to checkout clicked');
        console.log('Cart items:', cartItems);

        if (cartItems.length === 0) {
            alert('Your cart is empty. Please add some items before proceeding to checkout.');
            return;
        }

        // Store cart data for checkout page
        localStorage.setItem('checkoutCart', JSON.stringify(cartItems));
        console.log('Cart data stored in localStorage');

        // Show loading message
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            checkoutBtn.disabled = true;
        }

        // Small delay to show loading state
        setTimeout(() => {
            // Redirect to checkout page
            window.location.href = 'checkout.html';
        }, 500);
    }

    // Continue shopping function for cart.html page
    function continueShopping() {
        window.location.href = 'index.html';
    }

    // Attach event listeners to cart elements
    function attachCartEventListeners() {
        // Add event listeners for quantity buttons
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

        // Add event listeners for quantity input changes
        document.querySelectorAll('.quantity-display').forEach((input, index) => {
            input.addEventListener('change', function() {
                const newQuantity = Math.max(1, parseInt(this.value) || 1);
                this.value = newQuantity;
                cartItems[index].quantity = newQuantity;

                // Save updated cart to localStorage
                localStorage.setItem('cart', JSON.stringify(cartItems));

                updateCartTotals();
            });
        });

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-item').forEach((btn, index) => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeItem(index);
            });
        });

        // Add event listener for checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            // Remove any existing event listeners
            checkoutBtn.replaceWith(checkoutBtn.cloneNode(true));
            const newCheckoutBtn = document.querySelector('.checkout-btn');

            newCheckoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                proceedToCheckout();
            });
        }

        // Add event listener for continue shopping button
        const continueBtn = document.querySelector('.continue-shopping-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', function(e) {
                e.preventDefault();
                continueShopping();
            });
        }
    }

    // Initialize cart page functionality
    function initializeCartPage() {
        // Load cart from localStorage
        loadCartFromStorage();

        // Render cart items dynamically
        renderCartItems();

        // Update cart totals
        updateCartTotals();

        // Attach event listeners
        attachCartEventListeners();
    }

    // Check if we're on the cart page and initialize
    if (document.querySelector('.cart-section')) {
        initializeCartPage();
    }

    // --- Checkout Page Functionality ---
    let checkoutCartItems = [];
    let orderHistory = [];

    // Load checkout cart from localStorage
    function loadCheckoutCart() {
        try {
            const savedCart = localStorage.getItem('checkoutCart');
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

        // Update totals display
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
        console.log('Processing order with data:', orderData);

        const orderId = generateOrderId();
        const totals = updateCheckoutTotals();

        console.log('Generated order ID:', orderId);
        console.log('Order totals:', totals);

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

        console.log('Complete order object:', order);

        // Add to order history (localStorage)
        orderHistory.unshift(order);
        saveOrderHistory();
        console.log('Order saved to history');

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
        console.log('Cart cleared from localStorage');

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
              <button onclick="viewOrderHistory()" class="btn-secondary">View Order History</button>
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', confirmationHTML);
    }

    // View order history
    function viewOrderHistory() {
        // Close confirmation modal
        const overlay = document.querySelector('.order-confirmation-overlay');
        if (overlay) overlay.remove();

        // Show order history (you can create a separate page for this)
        alert('Order history feature would be implemented here. Order ID: ' + orderHistory[0].id);
    }

    // Initialize checkout page
    function initializeCheckoutPage() {
        console.log('Initializing checkout page');

        // Load checkout cart and order history
        loadCheckoutCart();
        loadOrderHistory();

        console.log('Checkout cart items:', checkoutCartItems);

        // Check if cart is empty
        if (checkoutCartItems.length === 0) {
            console.log('Cart is empty, redirecting to products page');
            alert('Your cart is empty. Redirecting to products page.');
            window.location.href = 'index.html';
            return;
        }

        // Render checkout items and totals
        renderCheckoutItems();
        updateCheckoutTotals();

        // Handle payment method selection
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        const cardDetails = document.getElementById('card-details');

        paymentMethods.forEach(method => {
            method.addEventListener('change', function() {
                if (this.value === 'creditCard') {
                    if (cardDetails) cardDetails.style.display = 'block';
                    // Make card fields required
                    const cardNumber = document.getElementById('cardNumber');
                    const expiryDate = document.getElementById('expiryDate');
                    const cvv = document.getElementById('cvv');
                    const cardName = document.getElementById('cardName');
                    if (cardNumber) cardNumber.required = true;
                    if (expiryDate) expiryDate.required = true;
                    if (cvv) cvv.required = true;
                    if (cardName) cardName.required = true;
                } else {
                    if (cardDetails) cardDetails.style.display = 'none';
                    // Remove required from card fields
                    const cardNumber = document.getElementById('cardNumber');
                    const expiryDate = document.getElementById('expiryDate');
                    const cvv = document.getElementById('cvv');
                    const cardName = document.getElementById('cardName');
                    if (cardNumber) cardNumber.required = false;
                    if (expiryDate) expiryDate.required = false;
                    if (cvv) cvv.required = false;
                    if (cardName) cardName.required = false;
                }
            });
        });

        // Handle form submission
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function(e) {
                e.preventDefault();

                // Get form data
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

    // Check if we're on the personal information page and initialize
    if (document.querySelector('.personal-info-section')) {
        initializePersonalInfoPage();
    }

    // Check if we're on the order history page and initialize
    if (document.querySelector('.order-history-section')) {
        initializeOrderHistoryPage();
    }
});

// Personal Information Page Functions
function initializePersonalInfoPage() {
    console.log('Initializing Personal Information page');

    // Load user data from localStorage
    loadUserProfile();

    // Attach event listeners
    attachPersonalInfoEventListeners();

    // Update cart count
    updateCartCount();
}

function loadUserProfile() {
    // Load user profile data from localStorage
    const userProfile = JSON.parse(localStorage.getItem('userProfile')) || getDefaultUserProfile();

    // Update profile summary
    document.getElementById('profile-name').textContent = `${userProfile.firstName} ${userProfile.lastName}`;
    document.getElementById('profile-email').textContent = userProfile.email;
    document.getElementById('profile-member-since').textContent = `Member since ${userProfile.memberSince}`;

    // Update form fields
    const form = document.getElementById('personal-info-form');
    Object.keys(userProfile).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = userProfile[key];
            } else {
                field.value = userProfile[key];
            }
        }
    });

    // Update account statistics
    updateAccountStatistics(userProfile);
}

function getDefaultUserProfile() {
    return {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+91 98765 43210',
        dateOfBirth: '1990-01-15',
        address: '123 Main Street, Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
        language: 'en',
        currency: 'INR',
        newsletter: true,
        smsNotifications: false,
        emailNotifications: true,
        memberSince: 'January 2024',
        totalOrders: 12,
        totalSpent: 25450,
        loyaltyPoints: 1250,
        memberDays: 365
    };
}

function updateAccountStatistics(userProfile) {
    document.getElementById('total-orders').textContent = userProfile.totalOrders;
    document.getElementById('total-spent').textContent = `₹${userProfile.totalSpent.toLocaleString()}`;
    document.getElementById('loyalty-points').textContent = userProfile.loyaltyPoints.toLocaleString();
    document.getElementById('member-days').textContent = userProfile.memberDays;
}

function attachPersonalInfoEventListeners() {
    // Form submission
    const form = document.getElementById('personal-info-form');
    form.addEventListener('submit', handleProfileUpdate);

    // Cancel button
    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn.addEventListener('click', handleCancel);

    // Change avatar button
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    changeAvatarBtn.addEventListener('click', handleChangeAvatar);

    // Password validation
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    if (newPassword && confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
}

function handleProfileUpdate(e) {
    e.preventDefault();
    console.log('Updating profile...');

    const form = e.target;
    const formData = new FormData(form);
    const userProfile = {};

    // Collect form data
    for (let [key, value] of formData.entries()) {
        userProfile[key] = value;
    }

    // Handle checkboxes separately
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        userProfile[checkbox.name] = checkbox.checked;
    });

    // Validate password if provided
    const currentPassword = userProfile.currentPassword;
    const newPassword = userProfile.newPassword;
    const confirmPassword = userProfile.confirmPassword;

    if (newPassword && newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    if (newPassword && !currentPassword) {
        alert('Please enter your current password to change it.');
        return;
    }

    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    // Update profile summary
    document.getElementById('profile-name').textContent = `${userProfile.firstName} ${userProfile.lastName}`;
    document.getElementById('profile-email').textContent = userProfile.email;

    // Show success message
    showSuccessMessage('Profile updated successfully!');

    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function handleCancel() {
    // Reload the profile data to reset form
    loadUserProfile();
    showInfoMessage('Changes discarded.');
}

function handleChangeAvatar() {
    // Create file input for avatar upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            // In a real application, you would upload the file to a server
            // For now, we'll just show a message
            showSuccessMessage('Avatar upload feature coming soon!');
        }
    };

    input.click();
}

function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (confirmPassword && newPassword !== confirmPassword) {
        document.getElementById('confirmPassword').setCustomValidity('Passwords do not match');
    } else {
        document.getElementById('confirmPassword').setCustomValidity('');
    }
}

function showSuccessMessage(message) {
    // Create and show success message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.innerHTML = `
    <i class="fas fa-check-circle"></i>
    ${message}
  `;

    // Add styles
    messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
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

    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Order action functions
function reorderItems(orderId) {
    // Get order data from localStorage or mock data
    const orderData = getOrderData(orderId);
    if (!orderData) {
        showToast('Order not found!', 'error');
        return;
    }

    // Add items to cart
    let addedCount = 0;
    orderData.items.forEach(item => {
        if (addToCart(item.name, `Rs. ${item.price}`, item.image, item.weight)) {
            addedCount++;
        }
    });

    if (addedCount > 0) {
        showToast(`Added ${addedCount} items from ${orderId} to your cart!`, 'success');
        // Update cart count display
        updateCartCount();
    } else {
        showToast('Failed to add items to cart', 'error');
    }
}

function trackOrder(orderId) {
    // Create tracking modal
    const trackingModal = createTrackingModal(orderId);
    document.body.appendChild(trackingModal);

    // Show modal
    setTimeout(() => {
        trackingModal.classList.add('show');
    }, 10);
}

function cancelOrder(orderId) {
    if (confirm(`Are you sure you want to cancel order ${orderId}?`)) {
        // Update order status in localStorage
        updateOrderStatus(orderId, 'cancelled');

        // Update UI
        const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderElement) {
            const statusElement = orderElement.querySelector('.order-status');
            statusElement.className = 'order-status cancelled';
            statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Cancelled';

            // Update actions
            const actionsElement = orderElement.querySelector('.order-actions');
            actionsElement.innerHTML = `
                <button class="btn-secondary" onclick="reorderItems('${orderId}')">
                    <i class="fas fa-redo"></i>
                    Reorder
                </button>
                <button class="btn-primary" onclick="viewOrderDetails('${orderId}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
            `;
        }

        showToast(`Order ${orderId} has been cancelled successfully!`, 'success');
    }
}

function viewOrderDetails(orderId) {
    // Get order data
    const orderData = getOrderData(orderId);
    if (!orderData) {
        showToast('Order not found!', 'error');
        return;
    }

    // Create order details modal
    const detailsModal = createOrderDetailsModal(orderData);
    document.body.appendChild(detailsModal);

    // Show modal
    setTimeout(() => {
        detailsModal.classList.add('show');
    }, 10);
}

function loadMoreOrders() {
    // Show loading state
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    loadMoreBtn.disabled = true;

    // Simulate loading delay
    setTimeout(() => {
        // Add more mock orders
        addMockOrders();

        // Reset button
        loadMoreBtn.innerHTML = originalText;
        loadMoreBtn.disabled = false;

        showToast('More orders loaded successfully!', 'success');
    }, 1500);
}

// Helper functions
function getOrderData(orderId) {
    // Mock order data - in real app, this would come from API/localStorage
    const mockOrders = {
        'ORD-2024-001': {
            id: 'ORD-2024-001',
            date: '2024-01-15',
            status: 'delivered',
            items: [{
                    name: 'Amul Fresh Milk 1L',
                    price: 60,
                    image: 'img/products/amul-milk-1l.jpg',
                    weight: '1L'
                },
                {
                    name: 'Amul Butter 100g',
                    price: 50,
                    image: 'img/products/amul-butter-100g.jpg',
                    weight: '100g'
                }
            ],
            total: 345.60,
            paymentMethod: 'Credit Card',
            deliveryDate: '2024-01-17'
        },
        'ORD-2024-002': {
            id: 'ORD-2024-002',
            date: '2024-01-20',
            status: 'shipped',
            items: [{
                    name: 'Amul Processed Cheese 200g',
                    price: 90,
                    image: 'img/products/amul-cheese-200g.jpg',
                    weight: '200g'
                },
                {
                    name: 'Amul Masti Dahi 500g',
                    price: 40,
                    image: 'img/products/amul-yogurt-500g.jpg',
                    weight: '500g'
                }
            ],
            total: 795.60,
            paymentMethod: 'UPI',
            expectedDelivery: '2024-01-22'
        },
        'ORD-2024-003': {
            id: 'ORD-2024-003',
            date: '2024-01-25',
            status: 'processing',
            items: [{
                name: 'Amul Pure Ghee 500g',
                price: 280,
                image: 'img/products/amul-ghee-500g.jpg',
                weight: '500g'
            }],
            total: 337.90,
            paymentMethod: 'Wallet',
            status: 'processing'
        }
    };

    return mockOrders[orderId] || null;
}

function updateOrderStatus(orderId, newStatus) {
    // In real app, this would update the database
    console.log(`Updating order ${orderId} status to ${newStatus}`);
    // For now, we'll just log it
}

function createTrackingModal(orderId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-truck"></i> Track Order ${orderId}</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="tracking-timeline">
                    <div class="timeline-item completed">
                        <div class="timeline-icon">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Order Confirmed</h4>
                            <p>Your order has been confirmed and is being prepared</p>
                            <span class="timeline-date">Jan 25, 2024 10:30 AM</span>
                        </div>
                    </div>
                    <div class="timeline-item completed">
                        <div class="timeline-icon">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Order Packed</h4>
                            <p>Your order has been packed and is ready for dispatch</p>
                            <span class="timeline-date">Jan 25, 2024 2:15 PM</span>
                        </div>
                    </div>
                    <div class="timeline-item active">
                        <div class="timeline-icon">
                            <i class="fas fa-truck"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Out for Delivery</h4>
                            <p>Your order is out for delivery and will arrive soon</p>
                            <span class="timeline-date">Jan 26, 2024 9:00 AM</span>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-icon">
                            <i class="fas fa-home"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Delivered</h4>
                            <p>Your order has been delivered successfully</p>
                            <span class="timeline-date">Expected: Jan 26, 2024 6:00 PM</span>
                        </div>
                    </div>
                </div>
                <div class="tracking-actions">
                    <button class="btn-primary" onclick="viewOrderDetails('${orderId}')">
                        <i class="fas fa-eye"></i> View Order Details
                    </button>
                    <button class="btn-secondary" onclick="closeModal(this)">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

function createOrderDetailsModal(orderData) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3><i class="fas fa-receipt"></i> Order Details - ${orderData.id}</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-details-grid">
                    <div class="order-info-section">
                        <h4>Order Information</h4>
                        <div class="info-row">
                            <span>Order ID:</span>
                            <span>${orderData.id}</span>
                        </div>
                        <div class="info-row">
                            <span>Order Date:</span>
                            <span>${new Date(orderData.date).toLocaleDateString()}</span>
                        </div>
                        <div class="info-row">
                            <span>Status:</span>
                            <span class="status-badge ${orderData.status}">${orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}</span>
                        </div>
                        <div class="info-row">
                            <span>Payment Method:</span>
                            <span>${orderData.paymentMethod}</span>
                        </div>
                        ${orderData.deliveryDate ? `
                        <div class="info-row">
                            <span>Delivered:</span>
                            <span>${orderData.deliveryDate}</span>
                        </div>
                        ` : ''}
                        ${orderData.expectedDelivery ? `
                        <div class="info-row">
                            <span>Expected Delivery:</span>
                            <span>${orderData.expectedDelivery}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="order-items-section">
                        <h4>Order Items</h4>
                        ${orderData.items.map(item => `
                            <div class="order-item-detail">
                                <img src="${item.image}" alt="${item.name}" class="item-image">
                                <div class="item-info">
                                    <h5>${item.name}</h5>
                                    <p>Weight: ${item.weight}</p>
                                    <p>Price: Rs. ${item.price}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-summary-section">
                        <h4>Order Summary</h4>
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>Rs. ${(orderData.total * 0.9).toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Delivery:</span>
                            <span>Rs. 30.00</span>
                        </div>
                        <div class="summary-row">
                            <span>Tax:</span>
                            <span>Rs. ${(orderData.total * 0.1).toFixed(2)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span>Rs. ${orderData.total}</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-primary" onclick="reorderItems('${orderData.id}')">
                        <i class="fas fa-redo"></i> Reorder Items
                    </button>
                    <button class="btn-secondary" onclick="closeModal(this)">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

function addMockOrders() {
    // Add more mock orders to the page
    const ordersContainer = document.querySelector('.orders-container');
    if (!ordersContainer) return;

    const newOrders = [{
            id: 'ORD-2024-004',
            date: '2024-01-10',
            status: 'delivered',
            items: [{
                    name: 'Amul Lassi 200ml',
                    price: 25,
                    image: 'img/products/amul-lassi.jpg',
                    weight: '200ml'
                },
                {
                    name: 'Amul Paneer 200g',
                    price: 120,
                    image: 'img/products/amul-paneer.jpg',
                    weight: '200g'
                }
            ],
            total: 175.50
        },
        {
            id: 'ORD-2024-005',
            date: '2024-01-05',
            status: 'delivered',
            items: [{
                name: 'Amul Ice Cream 1L',
                price: 150,
                image: 'img/products/amul-ice-cream.jpg',
                weight: '1L'
            }],
            total: 180.00
        }
    ];

    newOrders.forEach(order => {
        const orderElement = createOrderElement(order);
        ordersContainer.appendChild(orderElement);
    });
}

function createOrderElement(orderData) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    orderElement.setAttribute('data-status', orderData.status);
    orderElement.setAttribute('data-date', orderData.date);
    orderElement.setAttribute('data-order-id', orderData.id);

    const statusClass = orderData.status === 'delivered' ? 'delivered' :
        orderData.status === 'shipped' ? 'shipped' :
        orderData.status === 'processing' ? 'processing' : 'cancelled';

    const statusIcon = orderData.status === 'delivered' ? 'check-circle' :
        orderData.status === 'shipped' ? 'truck' :
        orderData.status === 'processing' ? 'clock' : 'times-circle';

    orderElement.innerHTML = `
        <div class="order-header">
            <div class="order-info">
                <h3 class="order-id">Order #${orderData.id}</h3>
                <p class="order-date">
                    <i class="fas fa-calendar"></i>
                    Placed on ${new Date(orderData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            <div class="order-status ${statusClass}">
                <i class="fas fa-${statusIcon}"></i>
                ${orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
            </div>
        </div>
        
        <div class="order-details">
            <div class="order-products">
                <h4>Products Ordered:</h4>
                <div class="product-list">
                    ${orderData.items.map(item => `
                        <div class="product-item">
                            <img src="${item.image}" alt="${item.name}" class="product-image">
                            <div class="product-info">
                                <h5>${item.name}</h5>
                                <p class="product-category">Dairy Products</p>
                                <p class="product-quantity">Weight: ${item.weight}</p>
                                <p class="product-price">Rs. ${item.price}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="order-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>Rs. ${(orderData.total * 0.9).toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery Charges:</span>
                    <span>Rs. 30.00</span>
                </div>
                <div class="summary-row">
                    <span>Tax (GST):</span>
                    <span>Rs. ${(orderData.total * 0.1).toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total Amount:</span>
                    <span>Rs. ${orderData.total}</span>
                </div>
                <div class="payment-info">
                    <p><i class="fas fa-credit-card"></i> Payment Mode: Credit Card</p>
                    <p><i class="fas fa-calendar-check"></i> ${orderData.status === 'delivered' ? 'Delivered on ' + orderData.date : 'Expected delivery soon'}</p>
                </div>
            </div>
        </div>
        
        <div class="order-actions">
            ${orderData.status === 'processing' ? `
                <button class="btn-danger" onclick="cancelOrder('${orderData.id}')">
                    <i class="fas fa-times"></i>
                    Cancel Order
                </button>
            ` : orderData.status === 'shipped' ? `
                <button class="btn-secondary" onclick="trackOrder('${orderData.id}')">
                    <i class="fas fa-map-marker-alt"></i>
                    Track Order
                </button>
            ` : `
                <button class="btn-secondary" onclick="reorderItems('${orderData.id}')">
                    <i class="fas fa-redo"></i>
                    Reorder
                </button>
            `}
            <button class="btn-primary" onclick="viewOrderDetails('${orderData.id}')">
                <i class="fas fa-eye"></i>
                View Details
            </button>
        </div>
    `;

    return orderElement;
}

function closeModal(button) {
    const modal = button.closest('.modal-overlay');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles
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

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Order History Page Functions
function initializeOrderHistoryPage() {
    console.log('Initializing Order History page');

    // Filter functionality
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchInput = document.getElementById('order-search');

    if (statusFilter && dateFilter && searchInput) {
        function filterOrders() {
            const orders = document.querySelectorAll('.order-item');
            const statusValue = statusFilter.value;
            const dateValue = dateFilter.value;
            const searchValue = searchInput.value.toLowerCase();

            orders.forEach(order => {
                const orderStatus = order.dataset.status;
                const orderDate = new Date(order.dataset.date);
                const orderText = order.textContent.toLowerCase();

                let showOrder = true;

                // Filter by status
                if (statusValue !== 'all' && orderStatus !== statusValue) {
                    showOrder = false;
                }

                // Filter by date
                if (dateValue !== 'all') {
                    const now = new Date();
                    let cutoffDate;

                    switch (dateValue) {
                        case 'last-month':
                            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                            break;
                        case 'last-3-months':
                            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                            break;
                        case 'last-6-months':
                            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                            break;
                        case 'last-year':
                            cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                            break;
                    }

                    if (cutoffDate && orderDate < cutoffDate) {
                        showOrder = false;
                    }
                }

                // Filter by search
                if (searchValue && !orderText.includes(searchValue)) {
                    showOrder = false;
                }

                order.style.display = showOrder ? 'block' : 'none';
            });
        }

        statusFilter.addEventListener('change', filterOrders);
        dateFilter.addEventListener('change', filterOrders);
        searchInput.addEventListener('input', filterOrders);
    }
}


function showInfoMessage(message) {
    // Create and show info message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'info-message';
    messageDiv.innerHTML = `
    <i class="fas fa-info-circle"></i>
    ${message}
  `;

    // Add styles
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

    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Order action functions
function reorderItems(orderId) {
    // Get order data from localStorage or mock data
    const orderData = getOrderData(orderId);
    if (!orderData) {
        showToast('Order not found!', 'error');
        return;
    }

    // Add items to cart
    let addedCount = 0;
    orderData.items.forEach(item => {
        if (addToCart(item.name, `Rs. ${item.price}`, item.image, item.weight)) {
            addedCount++;
        }
    });

    if (addedCount > 0) {
        showToast(`Added ${addedCount} items from ${orderId} to your cart!`, 'success');
        // Update cart count display
        updateCartCount();
    } else {
        showToast('Failed to add items to cart', 'error');
    }
}

function trackOrder(orderId) {
    // Create tracking modal
    const trackingModal = createTrackingModal(orderId);
    document.body.appendChild(trackingModal);

    // Show modal
    setTimeout(() => {
        trackingModal.classList.add('show');
    }, 10);
}

function cancelOrder(orderId) {
    if (confirm(`Are you sure you want to cancel order ${orderId}?`)) {
        // Update order status in localStorage
        updateOrderStatus(orderId, 'cancelled');

        // Update UI
        const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderElement) {
            const statusElement = orderElement.querySelector('.order-status');
            statusElement.className = 'order-status cancelled';
            statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Cancelled';

            // Update actions
            const actionsElement = orderElement.querySelector('.order-actions');
            actionsElement.innerHTML = `
                <button class="btn-secondary" onclick="reorderItems('${orderId}')">
                    <i class="fas fa-redo"></i>
                    Reorder
                </button>
                <button class="btn-primary" onclick="viewOrderDetails('${orderId}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
            `;
        }

        showToast(`Order ${orderId} has been cancelled successfully!`, 'success');
    }
}

function viewOrderDetails(orderId) {
    // Get order data
    const orderData = getOrderData(orderId);
    if (!orderData) {
        showToast('Order not found!', 'error');
        return;
    }

    // Create order details modal
    const detailsModal = createOrderDetailsModal(orderData);
    document.body.appendChild(detailsModal);

    // Show modal
    setTimeout(() => {
        detailsModal.classList.add('show');
    }, 10);
}

function loadMoreOrders() {
    // Show loading state
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    loadMoreBtn.disabled = true;

    // Simulate loading delay
    setTimeout(() => {
        // Add more mock orders
        addMockOrders();

        // Reset button
        loadMoreBtn.innerHTML = originalText;
        loadMoreBtn.disabled = false;

        showToast('More orders loaded successfully!', 'success');
    }, 1500);
}

// Helper functions
function getOrderData(orderId) {
    // Mock order data - in real app, this would come from API/localStorage
    const mockOrders = {
        'ORD-2024-001': {
            id: 'ORD-2024-001',
            date: '2024-01-15',
            status: 'delivered',
            items: [{
                    name: 'Amul Fresh Milk 1L',
                    price: 60,
                    image: 'img/products/amul-milk-1l.jpg',
                    weight: '1L'
                },
                {
                    name: 'Amul Butter 100g',
                    price: 50,
                    image: 'img/products/amul-butter-100g.jpg',
                    weight: '100g'
                }
            ],
            total: 345.60,
            paymentMethod: 'Credit Card',
            deliveryDate: '2024-01-17'
        },
        'ORD-2024-002': {
            id: 'ORD-2024-002',
            date: '2024-01-20',
            status: 'shipped',
            items: [{
                    name: 'Amul Processed Cheese 200g',
                    price: 90,
                    image: 'img/products/amul-cheese-200g.jpg',
                    weight: '200g'
                },
                {
                    name: 'Amul Masti Dahi 500g',
                    price: 40,
                    image: 'img/products/amul-yogurt-500g.jpg',
                    weight: '500g'
                }
            ],
            total: 795.60,
            paymentMethod: 'UPI',
            expectedDelivery: '2024-01-22'
        },
        'ORD-2024-003': {
            id: 'ORD-2024-003',
            date: '2024-01-25',
            status: 'processing',
            items: [{
                name: 'Amul Pure Ghee 500g',
                price: 280,
                image: 'img/products/amul-ghee-500g.jpg',
                weight: '500g'
            }],
            total: 337.90,
            paymentMethod: 'Wallet',
            status: 'processing'
        }
    };

    return mockOrders[orderId] || null;
}

function updateOrderStatus(orderId, newStatus) {
    // In real app, this would update the database
    console.log(`Updating order ${orderId} status to ${newStatus}`);
    // For now, we'll just log it
}

function createTrackingModal(orderId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-truck"></i> Track Order ${orderId}</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="tracking-timeline">
                    <div class="timeline-item completed">
                        <div class="timeline-icon">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Order Confirmed</h4>
                            <p>Your order has been confirmed and is being prepared</p>
                            <span class="timeline-date">Jan 25, 2024 10:30 AM</span>
                        </div>
                    </div>
                    <div class="timeline-item completed">
                        <div class="timeline-icon">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Order Packed</h4>
                            <p>Your order has been packed and is ready for dispatch</p>
                            <span class="timeline-date">Jan 25, 2024 2:15 PM</span>
                        </div>
                    </div>
                    <div class="timeline-item active">
                        <div class="timeline-icon">
                            <i class="fas fa-truck"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Out for Delivery</h4>
                            <p>Your order is out for delivery and will arrive soon</p>
                            <span class="timeline-date">Jan 26, 2024 9:00 AM</span>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-icon">
                            <i class="fas fa-home"></i>
                        </div>
                        <div class="timeline-content">
                            <h4>Delivered</h4>
                            <p>Your order has been delivered successfully</p>
                            <span class="timeline-date">Expected: Jan 26, 2024 6:00 PM</span>
                        </div>
                    </div>
                </div>
                <div class="tracking-actions">
                    <button class="btn-primary" onclick="viewOrderDetails('${orderId}')">
                        <i class="fas fa-eye"></i> View Order Details
                    </button>
                    <button class="btn-secondary" onclick="closeModal(this)">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

function createOrderDetailsModal(orderData) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3><i class="fas fa-receipt"></i> Order Details - ${orderData.id}</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-details-grid">
                    <div class="order-info-section">
                        <h4>Order Information</h4>
                        <div class="info-row">
                            <span>Order ID:</span>
                            <span>${orderData.id}</span>
                        </div>
                        <div class="info-row">
                            <span>Order Date:</span>
                            <span>${new Date(orderData.date).toLocaleDateString()}</span>
                        </div>
                        <div class="info-row">
                            <span>Status:</span>
                            <span class="status-badge ${orderData.status}">${orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}</span>
                        </div>
                        <div class="info-row">
                            <span>Payment Method:</span>
                            <span>${orderData.paymentMethod}</span>
                        </div>
                        ${orderData.deliveryDate ? `
                        <div class="info-row">
                            <span>Delivered:</span>
                            <span>${orderData.deliveryDate}</span>
                        </div>
                        ` : ''}
                        ${orderData.expectedDelivery ? `
                        <div class="info-row">
                            <span>Expected Delivery:</span>
                            <span>${orderData.expectedDelivery}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="order-items-section">
                        <h4>Order Items</h4>
                        ${orderData.items.map(item => `
                            <div class="order-item-detail">
                                <img src="${item.image}" alt="${item.name}" class="item-image">
                                <div class="item-info">
                                    <h5>${item.name}</h5>
                                    <p>Weight: ${item.weight}</p>
                                    <p>Price: Rs. ${item.price}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-summary-section">
                        <h4>Order Summary</h4>
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>Rs. ${(orderData.total * 0.9).toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Delivery:</span>
                            <span>Rs. 30.00</span>
                        </div>
                        <div class="summary-row">
                            <span>Tax:</span>
                            <span>Rs. ${(orderData.total * 0.1).toFixed(2)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span>Rs. ${orderData.total}</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-primary" onclick="reorderItems('${orderData.id}')">
                        <i class="fas fa-redo"></i> Reorder Items
                    </button>
                    <button class="btn-secondary" onclick="closeModal(this)">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

function addMockOrders() {
    // Add more mock orders to the page
    const ordersContainer = document.querySelector('.orders-container');
    if (!ordersContainer) return;

    const newOrders = [{
            id: 'ORD-2024-004',
            date: '2024-01-10',
            status: 'delivered',
            items: [{
                    name: 'Amul Lassi 200ml',
                    price: 25,
                    image: 'img/products/amul-lassi.jpg',
                    weight: '200ml'
                },
                {
                    name: 'Amul Paneer 200g',
                    price: 120,
                    image: 'img/products/amul-paneer.jpg',
                    weight: '200g'
                }
            ],
            total: 175.50
        },
        {
            id: 'ORD-2024-005',
            date: '2024-01-05',
            status: 'delivered',
            items: [{
                name: 'Amul Ice Cream 1L',
                price: 150,
                image: 'img/products/amul-ice-cream.jpg',
                weight: '1L'
            }],
            total: 180.00
        }
    ];

    newOrders.forEach(order => {
        const orderElement = createOrderElement(order);
        ordersContainer.appendChild(orderElement);
    });
}

function createOrderElement(orderData) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    orderElement.setAttribute('data-status', orderData.status);
    orderElement.setAttribute('data-date', orderData.date);
    orderElement.setAttribute('data-order-id', orderData.id);

    const statusClass = orderData.status === 'delivered' ? 'delivered' :
        orderData.status === 'shipped' ? 'shipped' :
        orderData.status === 'processing' ? 'processing' : 'cancelled';

    const statusIcon = orderData.status === 'delivered' ? 'check-circle' :
        orderData.status === 'shipped' ? 'truck' :
        orderData.status === 'processing' ? 'clock' : 'times-circle';

    orderElement.innerHTML = `
        <div class="order-header">
            <div class="order-info">
                <h3 class="order-id">Order #${orderData.id}</h3>
                <p class="order-date">
                    <i class="fas fa-calendar"></i>
                    Placed on ${new Date(orderData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            <div class="order-status ${statusClass}">
                <i class="fas fa-${statusIcon}"></i>
                ${orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
            </div>
        </div>
        
        <div class="order-details">
            <div class="order-products">
                <h4>Products Ordered:</h4>
                <div class="product-list">
                    ${orderData.items.map(item => `
                        <div class="product-item">
                            <img src="${item.image}" alt="${item.name}" class="product-image">
                            <div class="product-info">
                                <h5>${item.name}</h5>
                                <p class="product-category">Dairy Products</p>
                                <p class="product-quantity">Weight: ${item.weight}</p>
                                <p class="product-price">Rs. ${item.price}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="order-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>Rs. ${(orderData.total * 0.9).toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery Charges:</span>
                    <span>Rs. 30.00</span>
                </div>
                <div class="summary-row">
                    <span>Tax (GST):</span>
                    <span>Rs. ${(orderData.total * 0.1).toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total Amount:</span>
                    <span>Rs. ${orderData.total}</span>
                </div>
                <div class="payment-info">
                    <p><i class="fas fa-credit-card"></i> Payment Mode: Credit Card</p>
                    <p><i class="fas fa-calendar-check"></i> ${orderData.status === 'delivered' ? 'Delivered on ' + orderData.date : 'Expected delivery soon'}</p>
                </div>
            </div>
        </div>
        
        <div class="order-actions">
            ${orderData.status === 'processing' ? `
                <button class="btn-danger" onclick="cancelOrder('${orderData.id}')">
                    <i class="fas fa-times"></i>
                    Cancel Order
                </button>
            ` : orderData.status === 'shipped' ? `
                <button class="btn-secondary" onclick="trackOrder('${orderData.id}')">
                    <i class="fas fa-map-marker-alt"></i>
                    Track Order
                </button>
            ` : `
                <button class="btn-secondary" onclick="reorderItems('${orderData.id}')">
                    <i class="fas fa-redo"></i>
                    Reorder
                </button>
            `}
            <button class="btn-primary" onclick="viewOrderDetails('${orderData.id}')">
                <i class="fas fa-eye"></i>
                View Details
            </button>
        </div>
    `;

    return orderElement;
}

function closeModal(button) {
    const modal = button.closest('.modal-overlay');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles
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

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Order History Page Functions
function initializeOrderHistoryPage() {
    console.log('Initializing Order History page');

    // Filter functionality
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchInput = document.getElementById('order-search');

    if (statusFilter && dateFilter && searchInput) {
        function filterOrders() {
            const orders = document.querySelectorAll('.order-item');
            const statusValue = statusFilter.value;
            const dateValue = dateFilter.value;
            const searchValue = searchInput.value.toLowerCase();

            orders.forEach(order => {
                const orderStatus = order.dataset.status;
                const orderDate = new Date(order.dataset.date);
                const orderText = order.textContent.toLowerCase();

                let showOrder = true;

                // Filter by status
                if (statusValue !== 'all' && orderStatus !== statusValue) {
                    showOrder = false;
                }

                // Filter by date
                if (dateValue !== 'all') {
                    const now = new Date();
                    let cutoffDate;

                    switch (dateValue) {
                        case 'last-month':
                            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                            break;
                        case 'last-3-months':
                            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                            break;
                        case 'last-6-months':
                            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                            break;
                        case 'last-year':
                            cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                            break;
                    }

                    if (cutoffDate && orderDate < cutoffDate) {
                        showOrder = false;
                    }
                }

                // Filter by search
                if (searchValue && !orderText.includes(searchValue)) {
                    showOrder = false;
                }

                order.style.display = showOrder ? 'block' : 'none';
            });
        }

        statusFilter.addEventListener('change', filterOrders);
        dateFilter.addEventListener('change', filterOrders);
        searchInput.addEventListener('input', filterOrders);
    }
}