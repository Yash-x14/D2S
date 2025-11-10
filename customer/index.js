// Home page (index.html) specific functionality
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
let socket = null;
let allProducts = [];

// Initialize Socket.IO for real-time product updates
function initSocket() {
    try {
        if (typeof io === 'undefined') {
            console.warn('⚠️ Socket.IO library not loaded. Real-time updates disabled.');
            return;
        }

        console.log(`🔌 Connecting to Socket.IO server at: ${API_BASE_URL}`);
        socket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('✅ Socket.IO: Connected to server', socket.id);
            console.log('✅ Homepage ready to receive real-time product updates from dealer site');
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket.IO: Disconnected from server');
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error);
        });

        // Listen for real-time product updates
        socket.on('productAdded', (product) => {
            console.log('🆕 Socket.IO: New product added on homepage from dealer site:', product);
            console.log('📦 Product details:', {
                id: product._id,
                name: product.name,
                price: product.price,
                category: product.category
            });

            if (product && product._id && product.isActive !== false) {
                // Check if product already exists
                const exists = allProducts.find(p => p._id === product._id);
                if (!exists) {
                    // Add new product at the beginning (it's the newest)
                    allProducts.unshift(product);
                    // Keep only latest 8 products
                    if (allProducts.length > 8) {
                        allProducts = allProducts.slice(0, 8);
                    }
                    console.log('✅ Product automatically added to homepage - NO PAGE RELOAD NEEDED!');
                    renderFeaturedProducts();
                } else {
                    console.log('🔄 Product already exists on homepage, updating...');
                    renderFeaturedProducts();
                }
            } else {
                console.log('⏸️ Product is inactive or invalid, not showing on homepage');
            }
        });

        socket.on('productUpdated', (product) => {
            console.log('🔄 Socket.IO: Product updated on homepage:', product);
            if (product && product._id) {
                const index = allProducts.findIndex(p => p._id === product._id);
                if (index !== -1) {
                    allProducts[index] = product;
                } else if (product.isActive !== false) {
                    allProducts.push(product);
                }
                renderFeaturedProducts();
            }
        });

        socket.on('productDeleted', (data) => {
            console.log('🗑️ Socket.IO: Product deleted on homepage:', data);

            // Safely extract the product ID (supporting multiple formats)
            const productId = (data && (data.id || data._id)) || data;

            if (productId) {
                allProducts = allProducts.filter(p => p._id !== productId);
                renderFeaturedProducts();
            }
        });


        // Load products from API (make it globally accessible)
        window.loadProducts = async function loadProducts() {
            const container = document.getElementById('featured-products-grid');
            if (!container) {
                console.warn('⚠️ Featured products grid not found');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/products`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    mode: 'cors'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                let products = [];

                if (data.data?.products && Array.isArray(data.data.products)) {
                    products = data.data.products;
                } else if (data.products && Array.isArray(data.products)) {
                    products = data.products;
                } else if (Array.isArray(data)) {
                    products = data;
                }

                // Filter to only active products and sort by creation date (newest first)
                products = products
                    .filter(p => p && p._id && p.isActive !== false)
                    .sort((a, b) => {
                        // Sort by createdAt (newest first)
                        const dateA = new Date(a.createdAt || a.updatedAt || 0);
                        const dateB = new Date(b.createdAt || b.updatedAt || 0);
                        return dateB - dateA;
                    });

                // Limit to latest 8 products for homepage
                allProducts = products.slice(0, 8);
                console.log(`✅ Loaded ${allProducts.length} products for homepage`);

                renderFeaturedProducts();
            } catch (error) {
                console.error('❌ Error loading products:', error);
                container.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 16px;"></i>
                <h3 style="color: #1f2937; margin-bottom: 8px;">Failed to load products</h3>
                <p style="color: #6b7280;">${error.message || 'Please check your connection and try again.'}</p>
                <button onclick="loadProducts()" style="margin-top: 16px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
            }
        }

        // Render featured products
        function renderFeaturedProducts() {
            const container = document.getElementById('featured-products-grid');
            if (!container) return;

            if (allProducts.length === 0) {
                container.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                <i class="fas fa-box-open" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
                <h3 style="color: #1f2937; margin-bottom: 8px;">No Products Available</h3>
                <p style="color: #6b7280;">Check back soon for new products!</p>
            </div>
        `;
                return;
            }

            // Clear loading state
            const loading = container.querySelector('.loading');
            if (loading) loading.remove();

            // Build product cards
            container.innerHTML = allProducts.map(product => `
        <div class="product-card-homepage" data-id="${product._id}" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); transition: transform 0.2s, box-shadow 0.2s; opacity: 0;">
            <img src="${product.imageURL || product.image || product.primaryImage || 'https://via.placeholder.com/250x200'}" 
                 alt="${product.name}"
                 style="width: 100%; height: 200px; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/250x200'">
            <div style="padding: 20px;">
                <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 10px 0;">${product.name}</h3>
                <span style="display: inline-block; padding: 4px 12px; background: #f3f4f6; border-radius: 4px; font-size: 12px; color: #6b7280; margin-bottom: 10px;">${product.category || 'General'}</span>
                <p style="font-size: 24px; font-weight: 700; color: #3b82f6; margin: 10px 0;">₹${product.price || 0}</p>
                <button onclick="addToCartHomepage('${product._id}')" style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');

            // Fade in animation
            const cards = container.querySelectorAll('.product-card-homepage');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.transition = 'opacity 0.3s ease';
                    card.style.opacity = '1';
                }, index * 50);
            });
        }

        // Add to cart function for homepage
        async function addToCartHomepage(productId) {
            const userId = localStorage.getItem('userId') || '';
            const token = localStorage.getItem('token') || '';

            if (!userId || !token) {
                alert('Please login to add products to cart');
                setTimeout(() => {
                    window.location.href = '/auth';
                }, 1000);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/cart`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId,
                        quantity: 1
                    })
                });

                if (response.ok) {
                    alert('Product added to cart!');
                    // Update cart count
                    updateCartCount();
                } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to add to cart');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                alert('Failed to add to cart');
            }
        }

        // Update cart count
        async function updateCartCount() {
            const userId = localStorage.getItem('userId') || '';
            const token = localStorage.getItem('token') || '';

            if (!userId || !token) return;

            try {
                const response = await fetch(`${API_BASE_URL}/api/cart/${userId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const cart = data.data?.cart;
                    const count = cart?.items?.length || 0;
                    const cartCountEl = document.querySelector('.cart-count');
                    if (cartCountEl) cartCountEl.textContent = count;
                }
            } catch (error) {
                console.error('Error updating cart count:', error);
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            // Initialize Socket.IO and load products
            initSocket();
            loadProducts();

            // Update cart count on load
            updateCartCount();

            // Fallback: Reload products every 30 seconds
            setInterval(() => {
                console.log('🔄 Periodic product refresh on homepage (fallback)');
                loadProducts();
            }, 30000);
            // --- Hero Slider Logic ---
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

            // --- Product Slider Carousel ---
            const productSection = document.querySelector('.product-slider-section');
            const MINI_IMAGES = [
                'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop&crop=center',
                'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=200&h=200&fit=crop&crop=center',
                'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop&crop=center',
                'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop&crop=center'
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
                        alert(`Searching for: ${searchTerm}`);
                        window.location.href = 'index.html';
                    }
                });
            }

            // --- Back to Top Functionality ---
            window.scrollToTop = function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            };

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
        });