// Dealer Dashboard JavaScript
class DealerDashboard {
    constructor() {
        this.orders = [];
        this.processingOrders = [];
        this.customers = [];
        this.currentSection = 'dashboard';
        this.selectedOrders = new Set();
        this.selectedProcessingOrders = new Set();
        this.inventory = [];
        this.selectedInventoryItems = new Set();
        this.transactions = [];
        this.selectedTransactions = new Set();
        this.orderPollInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDealerInfo();
        // Show dashboard section by default
        this.showSection('dashboard');
        this.loadOrders();
        this.loadProcessingOrders(); // Load processing orders on init
        this.loadSettingsData();
        this.loadInventory();
        this.loadTransactions();
        this.startOrderPolling(); // Start polling for new orders
    }

    setupEventListeners() {
        // Menu navigation
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                // Allow external links (starting with / or http) to navigate normally
                if (href && (href.startsWith('/') || href.startsWith('http'))) {
                    // External link - allow normal navigation
                    return;
                }
                // Hash-based section navigation
                e.preventDefault();
                const section = href.substring(1);
                this.showSection(section);
            });
        });

        // Order filters
        document.getElementById('status-filter').addEventListener('change', () => {
            this.filterOrders();
        });

        document.getElementById('date-filter').addEventListener('change', () => {
            this.filterOrders();
        });

        document.getElementById('refresh-orders').addEventListener('click', () => {
            this.loadOrders();
        });

        // Bulk actions
        document.getElementById('select-all-orders').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        document.getElementById('bulk-process').addEventListener('click', () => {
            this.bulkUpdateStatus('processing');
        });

        document.getElementById('bulk-ship').addEventListener('click', () => {
            this.bulkUpdateStatus('shipped');
        });

        document.getElementById('bulk-cancel').addEventListener('click', () => {
            this.bulkUpdateStatus('cancelled');
        });

        // Status update modal
        document.getElementById('confirm-status-update').addEventListener('click', () => {
            this.updateOrderStatus();
        });


        // Order Processing event listeners
        document.getElementById('refresh-processing-orders').addEventListener('click', () => {
            this.loadProcessingOrders();
        });

        document.getElementById('processing-status-filter').addEventListener('change', () => {
            this.filterProcessingOrders();
        });

        // Clear all orders button
        document.getElementById('clear-all-orders').addEventListener('click', () => {
            this.clearAllProcessingOrders();
        });

        // Order Processing modal event listeners
        document.getElementById('accept-order').addEventListener('click', () => {
            this.acceptOrder();
        });

        document.getElementById('reject-order').addEventListener('click', () => {
            this.showOrderRejectionModal();
        });

        document.getElementById('confirm-rejection').addEventListener('click', () => {
            this.rejectOrder();
        });

        // Bulk processing actions
        document.getElementById('bulk-accept').addEventListener('click', () => {
            this.bulkAcceptOrders();
        });

        document.getElementById('bulk-reject').addEventListener('click', () => {
            this.bulkRejectOrders();
        });

        // Customer Management event listeners
        document.getElementById('add-customer-btn').addEventListener('click', () => {
            this.showAddCustomerModal();
        });

        document.getElementById('confirm-add-customer').addEventListener('click', () => {
            this.addNewCustomer();
        });

        document.getElementById('customer-search').addEventListener('input', () => {
            this.filterCustomers();
        });

        document.getElementById('customer-sort').addEventListener('change', () => {
            this.sortCustomers();
        });

        // Customer credentials event listeners
        document.getElementById('view-credentials-btn').addEventListener('click', () => {
            this.showCustomerCredentials();
        });

        document.getElementById('reset-password-btn').addEventListener('click', () => {
            this.resetCustomerPassword();
        });

        // Username availability check
        document.getElementById('customer-username').addEventListener('input', () => {
            this.checkUsernameAvailability();
        });

        // Password strength check
        document.getElementById('customer-password').addEventListener('input', () => {
            this.checkPasswordStrength();
        });

        // Inventory Management event listeners
        this.setupInventoryEventListeners();

        // Bookkeeping Management event listeners
        this.setupBookkeepingEventListeners();
    }

    setupMenuNavigation() {
        // Set active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Find and activate the menu item for current section
        // Handle both hash-based links (#section) and external links
        if (this.currentSection) {
            const menuLink = document.querySelector(`[href="#${this.currentSection}"]`);
            if (menuLink && menuLink.parentElement) {
                menuLink.parentElement.classList.add('active');
            }
        }
    }

    loadDealerInfo() {
        // Load dealer information from localStorage
        const dealerData = localStorage.getItem('dealerData');
        if (dealerData) {
            const dealer = JSON.parse(dealerData);
            document.getElementById('dealerName').textContent = dealer.fullName || dealer.businessName || 'Dealer';
        }
    }

    updateDashboardStats() {
        // Get dealer data to determine if they're new
        const dealerData = localStorage.getItem('dealerData');
        const isNewDealer = dealerData ? this.isNewDealer(JSON.parse(dealerData)) : false;

        // Update stats based on dealer status
        const totalOrders = this.orders.length;
        const totalRevenue = this.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const pendingOrders = this.orders.filter(order => order.status === 'pending').length;
        const averageRating = 4.8; // Default rating

        // Update the stats cards with IDs
        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('total-revenue').textContent = `₹${totalRevenue.toLocaleString()}`;
        document.getElementById('pending-orders').textContent = pendingOrders;
        document.getElementById('average-rating').textContent = averageRating;

        // Update change indicators based on dealer status
        if (isNewDealer) {
            document.getElementById('orders-change').textContent = 'New!';
            document.getElementById('orders-change').className = 'stat-change positive';
            document.getElementById('revenue-change').textContent = 'New!';
            document.getElementById('revenue-change').className = 'stat-change positive';
            document.getElementById('pending-change').textContent = 'New!';
            document.getElementById('pending-change').className = 'stat-change positive';
            document.getElementById('rating-change').textContent = 'New!';
            document.getElementById('rating-change').className = 'stat-change positive';
        } else {
            document.getElementById('orders-change').textContent = '+12%';
            document.getElementById('revenue-change').textContent = '+8%';
            document.getElementById('pending-change').textContent = '+2';
            document.getElementById('rating-change').textContent = '+0.2';
        }

        // Show welcome message for new dealers
        if (isNewDealer) {
            this.showNewDealerWelcome();
        }
    }

    isNewDealer(dealer) {
        if (!dealer.createdAt) return false;
        const registrationDate = new Date(dealer.createdAt);
        const now = new Date();
        const daysDifference = (now - registrationDate) / (1000 * 60 * 60 * 24);
        return daysDifference <= 7; // Consider new if registered within last 7 days
    }

    showNewDealerWelcome() {
        // Create welcome message
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'alert alert-info';
        welcomeDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="fas fa-star" style="font-size: 2rem; color: #ffc107;"></i>
                <div>
                    <h4 style="margin: 0; color: #0c5460;">Welcome to Svasthyaa Dealer Portal!</h4>
                    <p style="margin: 0.5rem 0 0 0; color: #0c5460;">Your account is now active. Start managing your orders and grow your business with us.</p>
                </div>
            </div>
        `;

        // Insert at the top of the dashboard section
        const dashboardSection = document.getElementById('dashboard');
        dashboardSection.insertBefore(welcomeDiv, dashboardSection.firstChild);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            welcomeDiv.style.opacity = '0';
            welcomeDiv.style.transition = 'opacity 0.5s ease';
            setTimeout(() => welcomeDiv.remove(), 500);
        }, 10000);
    }











    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(section);
        if (!targetSection) {
            console.warn(`Section "${section}" not found`);
            return;
        }
        targetSection.style.display = 'block';

        // Update current section
        this.currentSection = section;

        // Update menu active state
        this.setupMenuNavigation();

        // Load section-specific data
        switch (section) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'order-processing':
                this.loadProcessingOrders();
                break;
            case 'inventory':
                this.loadInventory();
                this.renderInventory();
                break;
            case 'bookkeeping':
                this.loadTransactions();
                this.renderTransactions();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'settings':
                this.loadSettingsData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            // Simulate API call
            const response = await this.fetchOrders();
            this.orders = response;
            this.renderRecentOrders();
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadOrders() {
        try {
            const response = await this.fetchOrders();
            this.orders = response;
            this.renderOrdersTable();
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Error loading orders', 'error');
        }
    }

    async fetchOrders() {
        // Simulate API call with mock data
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate fresh, date-wise organized orders
                const orders = this.generateFreshOrders();
                resolve(orders);
            }, 1000);
        });
    }

    generateFreshOrders() {
        // Return empty array for new dealers - no order history
        return [];
    }

    generateSingleOrder(dateString, dayOffset, orderIndex) {
        const customers = [
            'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Singh', 'Vikram Gupta',
            'Anita Reddy', 'Rohit Verma', 'Kavya Nair', 'Suresh Joshi', 'Meera Iyer',
            'Arjun Malhotra', 'Deepika Agarwal', 'Ravi Khanna', 'Sunita Mehta', 'Kiran Rao'
        ];

        const products = [{
                name: 'Lays Classic Chips',
                price: 20,
                image: '../img/chips2.jpg'
            },
            {
                name: 'Coca Cola 500ml',
                price: 30,
                image: '../img/cold_drinks.jpg'
            },
            {
                name: 'Britannia Good Day',
                price: 25,
                image: '../img/biscuit.jpg'
            },
            {
                name: 'Amul Dark Chocolate',
                price: 50,
                image: '../img/chocolate.jpg'
            },
            {
                name: 'Haldiram Namkeen Mix',
                price: 40,
                image: '../img/namkeen.jpg'
            },
            {
                name: 'Parle G Biscuits',
                price: 15,
                image: '../img/biscuit.jpg'
            },
            {
                name: 'Nestle KitKat',
                price: 35,
                image: '../img/chocolate.jpg'
            },
            {
                name: 'Pepsi 500ml',
                price: 30,
                image: '../img/cold_drinks.jpg'
            }
        ];

        const statuses = ['pending', 'processing', 'shipped', 'delivered'];
        const statusWeights = [0.3, 0.2, 0.2, 0.3]; // More pending and delivered

        // Weighted random status selection
        const random = Math.random();
        let status = 'pending';
        let cumulative = 0;
        for (let i = 0; i < statuses.length; i++) {
            cumulative += statusWeights[i];
            if (random <= cumulative) {
                status = statuses[i];
                break;
            }
        }

        // Generate 1-3 products per order
        const numProducts = Math.floor(Math.random() * 3) + 1;
        const selectedProducts = [];
        const usedIndices = new Set();

        for (let i = 0; i < numProducts; i++) {
            let productIndex;
            do {
                productIndex = Math.floor(Math.random() * products.length);
            } while (usedIndices.has(productIndex));

            usedIndices.add(productIndex);
            const product = products[productIndex];
            const quantity = Math.floor(Math.random() * 3) + 1;

            selectedProducts.push({
                name: product.name,
                quantity: quantity,
                price: product.price,
                image: product.image
            });
        }

        const totalAmount = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);

        return {
            id: `ORD-${dateString.replace(/-/g, '')}-${String(orderIndex + 1).padStart(2, '0')}`,
            customer: customers[Math.floor(Math.random() * customers.length)],
            email: `customer${Math.floor(Math.random() * 1000)}@example.com`,
            phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            products: selectedProducts,
            totalAmount: totalAmount,
            status: status,
            orderDate: dateString,
            shippingAddress: this.generateRandomAddress(),
            orderTime: this.generateRandomTime(),
            paymentMethod: ['UPI', 'Card', 'Cash', 'Net Banking'][Math.floor(Math.random() * 4)]
        };
    }

    generateRandomAddress() {
        const streets = ['MG Road', 'Park Street', 'Main Road', 'Station Road', 'Church Street'];
        const areas = ['Downtown', 'Uptown', 'Central', 'East Side', 'West Side'];
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];

        const street = streets[Math.floor(Math.random() * streets.length)];
        const area = areas[Math.floor(Math.random() * areas.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const pincode = Math.floor(Math.random() * 900000) + 100000;

        return `${Math.floor(Math.random() * 999) + 1}, ${street}, ${area}, ${city} - ${pincode}`;
    }

    generateRandomTime() {
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    renderRecentOrders() {
        const tbody = document.getElementById('recent-orders-tbody');
        const recentOrders = this.orders.slice(0, 5);

        if (recentOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-shopping-bag" style="font-size: 2rem; color: #ddd; margin-bottom: 1rem;"></i>
                        <p style="margin: 0;">No recent orders</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recentOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.products.length} items</td>
                <td>₹${order.totalAmount}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${this.formatDate(order.orderDate)}</td>
                <td>
                    <button class="btn-action btn-view" onclick="dealerDashboard.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderOrdersTable() {
        const tbody = document.getElementById('orders-tbody');

        if (this.orders.length === 0) {
            // Show empty state
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <div style="text-align: center; padding: 3rem; color: #666;">
                            <i class="fas fa-shopping-bag" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                            <h3 style="color: #333; margin-bottom: 1rem;">No Orders Yet</h3>
                            <p style="margin-bottom: 2rem;">You haven't received any orders yet. Once customers start placing orders, they'll appear here.</p>
                            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 0 auto; max-width: 500px;">
                                <h5 style="color: #667eea; margin-bottom: 1rem;">
                                    <i class="fas fa-lightbulb me-2"></i>
                                    Getting Started Tips
                                </h5>
                                <ul style="text-align: left; color: #666; margin: 0;">
                                    <li>Make sure your products are properly listed</li>
                                    <li>Check your inventory levels</li>
                                    <li>Verify your business information is complete</li>
                                    <li>Contact support if you need help</li>
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Group orders by date
        const groupedOrders = this.groupOrdersByDate(this.orders);

        let html = '';

        // Render each date group
        Object.keys(groupedOrders).forEach(date => {
            const ordersForDate = groupedOrders[date];

            // Add date header
            html += `
                <tr class="date-header">
                    <td colspan="9" style="background: #f8f9fa; font-weight: 600; color: #333; padding: 1rem;">
                        <i class="fas fa-calendar-alt me-2"></i>
                        ${this.formatDateWithDay(date)} (${ordersForDate.length} orders)
                    </td>
                </tr>
            `;

            // Add orders for this date
            ordersForDate.forEach(order => {
                html += `
                    <tr>
                        <td>
                            <input type="checkbox" class="order-checkbox" value="${order.id}" 
                                   onchange="dealerDashboard.toggleOrderSelection('${order.id}')">
                        </td>
                        <td>
                            <div>
                                <strong>${order.id}</strong><br>
                                <small class="text-muted">${order.orderTime}</small>
                            </div>
                        </td>
                        <td>
                            <div>
                                <strong>${order.customer}</strong><br>
                                <small>${order.email}</small>
                            </div>
                        </td>
                        <td>
                            <div>
                                <span>${order.products.length} items</span><br>
                                <small class="text-muted">${order.products.map(p => p.name).join(', ')}</small>
                            </div>
                        </td>
                        <td>${order.products.reduce((sum, product) => sum + product.quantity, 0)}</td>
                        <td>
                            <div>
                                <strong>₹${order.totalAmount}</strong><br>
                                <small class="text-muted">${order.paymentMethod}</small>
                            </div>
                        </td>
                        <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                        <td>
                            <div>
                                <span>${this.formatDate(order.orderDate)}</span><br>
                                <small class="text-muted">${order.orderTime}</small>
                            </div>
                        </td>
                        <td>
                            <button class="btn-action btn-view" onclick="dealerDashboard.viewOrder('${order.id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action btn-edit" onclick="dealerDashboard.updateOrderStatus('${order.id}')" title="Update Status">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        });

        tbody.innerHTML = html;
    }

    groupOrdersByDate(orders) {
        const grouped = {};

        orders.forEach(order => {
            const date = order.orderDate;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(order);
        });

        return grouped;
    }

    formatDateWithDay(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) {
            return `Today - ${date.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}`;
        } else if (isYesterday) {
            return `Yesterday - ${date.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}`;
        } else {
            return date.toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
    }

    filterOrders() {
        const statusFilter = document.getElementById('status-filter').value;
        const dateFilter = document.getElementById('date-filter').value;

        let filteredOrders = this.orders;

        if (statusFilter) {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }

        if (dateFilter) {
            filteredOrders = filteredOrders.filter(order => order.orderDate === dateFilter);
        }

        // Re-render with filtered orders
        const tbody = document.getElementById('orders-tbody');
        tbody.innerHTML = filteredOrders.map(order => `
            <tr>
                <td>
                    <input type="checkbox" class="order-checkbox" value="${order.id}" 
                           onchange="dealerDashboard.toggleOrderSelection('${order.id}')">
                </td>
                <td>${order.id}</td>
                <td>
                    <div>
                        <strong>${order.customer}</strong><br>
                        <small>${order.email}</small>
                    </div>
                </td>
                <td>${order.products.length} items</td>
                <td>${order.products.reduce((sum, product) => sum + product.quantity, 0)}</td>
                <td>₹${order.totalAmount}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${this.formatDate(order.orderDate)}</td>
                <td>
                    <button class="btn-action btn-view" onclick="dealerDashboard.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="dealerDashboard.updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async viewOrder(orderId) {
        try {
            // Try to find order in current list
            let order = this.orders.find(o => o.id === orderId);
            
            // If not found, try to fetch from API (if order has _id format)
            if (!order) {
                try {
                    const data = await ordersAPI.getById(orderId);
                    order = data.data?.order || data.order;
                    if (order) {
                        // Convert API order format to local format
                        order = {
                            id: order._id || orderId,
                            customer: order.customerId?.name || order.shippingAddress?.name || 'Guest',
                            email: order.customerId?.email || order.shippingAddress?.email || '',
                            phone: order.customerId?.phone || order.shippingAddress?.phone || '',
                            status: order.status || 'pending',
                            orderDate: order.createdAt || order.date || new Date(),
                            orderTime: new Date(order.createdAt || order.date || Date.now()).toLocaleTimeString(),
                            paymentMethod: order.paymentMethod || 'COD',
                            shippingAddress: order.shippingAddress ? 
                                `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zipCode || ''}`.trim() : 
                                'Not provided',
                            products: (order.items || []).map(item => ({
                                name: item.name || item.productId?.name || 'Product',
                                quantity: item.quantity || 0,
                                price: item.price || 0,
                                image: item.image || item.productId?.image || 'https://via.placeholder.com/60',
                                category: item.category || item.productId?.category || '',
                                weight: item.weight || item.productId?.weight || ''
                            })),
                            totalAmount: order.total || 0,
                            subtotal: order.subtotal || 0,
                            shipping: order.shipping || 0,
                            tax: order.tax || 0,
                            notes: order.notes || ''
                        };
                    }
                } catch (apiError) {
                    console.error('Error fetching order from API:', apiError);
                }
            }

            if (!order) {
                showNotification('Order not found', 'error');
                return;
            }

            // Show comprehensive order summary
            this.showOrderSummaryModal(order);
        } catch (error) {
            console.error('Error viewing order:', error);
            showNotification('Failed to load order details', 'error');
        }
    }

    showOrderSummaryModal(order) {
        const orderDate = new Date(order.orderDate || order.createdAt || Date.now());
        const products = order.products || order.items || [];
        
        const itemsHtml = products.map(product => {
            const itemTotal = (product.price || 0) * (product.quantity || 0);
            return `
                <div class="order-detail-item" style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #eee; background: #f9f9f9; margin-bottom: 8px; border-radius: 4px;">
                    <img src="${product.image || 'https://via.placeholder.com/60'}" 
                         alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/60'"
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 12px;">
                    <div style="flex: 1;">
                        <strong>${product.name || 'Product'}</strong>
                        ${product.category ? `<br><small style="color: #666;">Category: ${product.category}</small>` : ''}
                        ${product.weight ? `<br><small style="color: #666;">Weight: ${product.weight}</small>` : ''}
                        <br><small style="color: #666;">Quantity: ${product.quantity} × Price: ₹${(product.price || 0).toFixed(2)} = <strong>₹${itemTotal.toFixed(2)}</strong></small>
                    </div>
                </div>
            `;
        }).join('');

        const subtotal = order.subtotal || products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
        const shipping = order.shipping || 0;
        const tax = order.tax || 0;
        const total = order.totalAmount || order.total || (subtotal + shipping + tax);

        const modalContent = `
            <div class="order-details-modal" style="max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                    <h2 style="margin: 0; color: #333;">
                        <i class="fas fa-receipt"></i> Order Summary - #${(order.id || order._id || '').toString().slice(-8)}
                    </h2>
                    <span class="close" style="color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer; line-height: 20px;" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="order-details-section" style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                        <h4 style="margin-top: 0; color: #6875F5; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user"></i> Customer Information
                        </h4>
                        <p style="margin: 8px 0;"><strong>Name:</strong> ${order.customer || 'Guest'}</p>
                        ${order.email ? `<p style="margin: 8px 0;"><strong>Email:</strong> ${order.email}</p>` : ''}
                        ${order.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${order.phone}</p>` : ''}
                    </div>

                    <div class="order-details-section" style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                        <h4 style="margin-top: 0; color: #6875F5; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-map-marker-alt"></i> Shipping Address
                        </h4>
                        <p style="margin: 8px 0;">${order.shippingAddress || 'Not provided'}</p>
                    </div>
                </div>

                <div class="order-details-section" style="margin-bottom: 20px;">
                    <h4 style="color: #6875F5; display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                        <i class="fas fa-box"></i> Order Items (${products.length})
                    </h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${itemsHtml || '<p>No items found</p>'}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="order-details-section" style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #6875F5;">
                        <h4 style="margin-top: 0; color: #6875F5; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-info-circle"></i> Order Information
                        </h4>
                        <p style="margin: 8px 0;"><strong>Order ID:</strong> #${(order.id || order._id || '').toString().slice(-8)}</p>
                        <p style="margin: 8px 0;"><strong>Order Date:</strong> ${orderDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p style="margin: 8px 0;"><strong>Order Time:</strong> ${orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p style="margin: 8px 0;">
                            <strong>Status:</strong> 
                            <span class="badge badge-warning" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                ${order.status || 'pending'}
                            </span>
                        </p>
                        <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${order.paymentMethod || 'COD'}</p>
                    </div>

                    <div class="order-details-section" style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                        <h4 style="margin-top: 0; color: #10b981; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-calculator"></i> Order Summary
                        </h4>
                        <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                            <span>Subtotal:</span>
                            <strong>₹${subtotal.toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                            <span>Shipping:</span>
                            <strong>₹${shipping.toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                            <span>Tax (GST):</span>
                            <strong>₹${tax.toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 12px 0; padding-top: 12px; border-top: 2px solid #10b981; font-size: 18px;">
                            <span><strong>Total Amount:</strong></span>
                            <strong style="color: #10b981;">₹${total.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>

                ${order.notes ? `
                    <div class="order-details-section" style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <h4 style="margin-top: 0; color: #f59e0b; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-sticky-note"></i> Order Notes
                        </h4>
                        <p style="margin: 0;">${order.notes}</p>
                    </div>
                ` : ''}

                <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e0e0e0; text-align: center;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'" style="padding: 10px 20px;">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;

        // Create or update modal
        let modal = document.getElementById('order-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'order-details-modal';
            modal.className = 'modal';
            modal.style.cssText = 'display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);';
            modal.innerHTML = `
                <div class="modal-content" style="background-color: #fefefe; margin: 3% auto; padding: 0; border: none; width: 90%; max-width: 900px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
                    <div id="order-details-content" style="padding: 20px; overflow-y: auto; flex: 1;"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        document.getElementById('order-details-content').innerHTML = modalContent;
        modal.style.display = 'block';
    }

    updateOrderStatus(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        document.getElementById('current-status').value = order.status;
        document.getElementById('new-status').value = order.status;
        document.getElementById('status-notes').value = '';

        // Store current order ID for update
        document.getElementById('status-update-form').dataset.orderId = orderId;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('statusUpdateModal'));
        modal.show();
    }

    async updateOrderStatus() {
        const orderId = document.getElementById('status-update-form').dataset.orderId;
        const newStatus = document.getElementById('new-status').value;
        const notes = document.getElementById('status-notes').value;

        try {
            // Simulate API call
            await this.simulateApiCall();

            // Update local data
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                order.notes = notes;
            }

            // Refresh display
            this.renderOrdersTable();
            this.renderRecentOrders();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('statusUpdateModal'));
            modal.hide();

            this.showAlert('Order status updated successfully', 'success');
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showAlert('Error updating order status', 'error');
        }
    }

    toggleOrderSelection(orderId) {
        if (this.selectedOrders.has(orderId)) {
            this.selectedOrders.delete(orderId);
        } else {
            this.selectedOrders.add(orderId);
        }

        this.updateBulkActions();
    }

    toggleSelectAll(checked) {
        this.selectedOrders.clear();

        if (checked) {
            document.querySelectorAll('.order-checkbox').forEach(checkbox => {
                checkbox.checked = true;
                this.selectedOrders.add(checkbox.value);
            });
        } else {
            document.querySelectorAll('.order-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
        }

        this.updateBulkActions();
    }

    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');

        if (this.selectedOrders.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = this.selectedOrders.size;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    async bulkUpdateStatus(newStatus) {
        if (this.selectedOrders.size === 0) return;

        try {
            // Simulate API call
            await this.simulateApiCall();

            // Update local data
            this.selectedOrders.forEach(orderId => {
                const order = this.orders.find(o => o.id === orderId);
                if (order) {
                    order.status = newStatus;
                }
            });

            // Clear selection
            this.selectedOrders.clear();
            document.querySelectorAll('.order-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            document.getElementById('select-all-orders').checked = false;

            // Refresh display
            this.renderOrdersTable();
            this.renderRecentOrders();
            this.updateBulkActions();

            this.showAlert(`${this.selectedOrders.size} orders updated to ${newStatus}`, 'success');
        } catch (error) {
            console.error('Error updating orders:', error);
            this.showAlert('Error updating orders', 'error');
        }
    }




    async loadAnalytics() {
        // Initialize chart
        const ctx = document.getElementById('sales-chart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Sales',
                        data: [12000, 19000, 15000, 25000, 22000, 30000],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sales Analytics'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    async loadCustomers() {
        // Show loading state
        const customersGrid = document.getElementById('customers-grid');
        customersGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;

        // Simulate API call
        await this.simulateApiCall();

        // Load customers from localStorage or generate sample data
        this.customers = this.loadCustomersFromStorage();
        this.renderCustomersGrid();
    }

    loadCustomersFromStorage() {
        // Try to load from localStorage first
        const storedCustomers = localStorage.getItem('dealerCustomers');
        if (storedCustomers) {
            return JSON.parse(storedCustomers);
        }

        // Return empty array if no customers
        return [];
    }

    saveCustomersToStorage() {
        localStorage.setItem('dealerCustomers', JSON.stringify(this.customers));
    }

    renderCustomersGrid() {
        const customersGrid = document.getElementById('customers-grid');

        if (this.customers.length === 0) {
            customersGrid.innerHTML = `
                <div class="empty-state">
                    <div style="text-align: center; padding: 3rem; color: #666;">
                        <i class="fas fa-users" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                        <h3 style="color: #333; margin-bottom: 1rem;">No Customers Yet</h3>
                        <p style="margin-bottom: 2rem;">You haven't added any customers yet. Click "Add Customer" to get started.</p>
                        <button class="btn btn-primary" onclick="dealerDashboard.showAddCustomerModal()">
                            <i class="fas fa-user-plus me-2"></i>Add Your First Customer
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        customersGrid.innerHTML = this.customers.map(customer => `
            <div class="customer-card">
                <div class="customer-header">
                    <div class="customer-avatar">
                        ${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}
                    </div>
                    <div class="customer-info">
                        <h5>${customer.firstName} ${customer.lastName}</h5>
                        <p>${customer.email}</p>
                    </div>
                </div>
                
                <div class="customer-stats">
                    <div class="stat-item">
                        <span class="stat-value">${customer.orders || 0}</span>
                        <span class="stat-label">Orders</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">₹${customer.totalSpent || 0}</span>
                        <span class="stat-label">Total Spent</span>
                    </div>
                </div>
                
                <div class="customer-actions">
                    <button class="btn btn-view-customer" onclick="dealerDashboard.viewCustomerDetails('${customer.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-edit-customer" onclick="dealerDashboard.editCustomer('${customer.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-delete-customer" onclick="dealerDashboard.deleteCustomer('${customer.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    showAddCustomerModal() {
        // Reset form
        document.getElementById('customer-first-name').value = '';
        document.getElementById('customer-last-name').value = '';
        document.getElementById('customer-email').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('customer-username').value = '';
        document.getElementById('customer-password').value = '';
        document.getElementById('customer-address').value = '';
        document.getElementById('customer-city').value = '';
        document.getElementById('customer-pincode').value = '';
        document.getElementById('customer-notes').value = '';

        // Reset modal title and button
        document.querySelector('#addCustomerModal .modal-title').textContent = 'Add New Customer';
        document.getElementById('confirm-add-customer').textContent = 'Add Customer';

        // Clear any existing customer ID
        document.getElementById('addCustomerModal').dataset.customerId = '';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
        modal.show();
    }

    async addNewCustomer() {
        // Get form data
        const customerData = {
            firstName: document.getElementById('customer-first-name').value,
            lastName: document.getElementById('customer-last-name').value,
            email: document.getElementById('customer-email').value,
            phone: document.getElementById('customer-phone').value,
            username: document.getElementById('customer-username').value,
            password: document.getElementById('customer-password').value,
            address: document.getElementById('customer-address').value,
            city: document.getElementById('customer-city').value,
            pincode: document.getElementById('customer-pincode').value,
            notes: document.getElementById('customer-notes').value
        };

        // Validate required fields
        if (!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phone || !customerData.username || !customerData.password) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        // Validate password strength
        if (customerData.password.length < 6) {
            this.showAlert('Password must be at least 6 characters long', 'error');
            return;
        }

        // Check if email already exists
        const existingCustomerByEmail = this.customers.find(c => c.email === customerData.email);
        if (existingCustomerByEmail) {
            this.showAlert('A customer with this email already exists', 'error');
            return;
        }

        // Check if username already exists
        const existingCustomerByUsername = this.customers.find(c => c.username === customerData.username);
        if (existingCustomerByUsername) {
            this.showAlert('This username is already taken. Please choose a different username.', 'error');
            return;
        }

        try {
            // Create new customer
            const newCustomer = {
                id: 'CUST_' + Date.now(),
                ...customerData,
                orders: 0,
                totalSpent: 0,
                createdAt: new Date().toISOString(),
                status: 'active'
            };

            // Add to customers array
            this.customers.push(newCustomer);

            // Save to localStorage
            this.saveCustomersToStorage();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
            modal.hide();

            // Refresh display
            this.renderCustomersGrid();

            this.showAlert('Customer added successfully!', 'success');
        } catch (error) {
            console.error('Error adding customer:', error);
            this.showAlert('Error adding customer', 'error');
        }
    }

    viewCustomerDetails(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        const modalContent = document.getElementById('customer-details-content');
        modalContent.innerHTML = `
            <div class="customer-details-header">
                <div class="customer-details-avatar">
                    ${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}
                </div>
                <div class="customer-details-info">
                    <h4>${customer.firstName} ${customer.lastName}</h4>
                    <p>${customer.email} • ${customer.phone}</p>
                </div>
            </div>
            
            <div class="customer-details-grid">
                <div class="customer-detail-item">
                    <span class="customer-detail-label">Email Address</span>
                    <p class="customer-detail-value">${customer.email}</p>
                </div>
                <div class="customer-detail-item">
                    <span class="customer-detail-label">Phone Number</span>
                    <p class="customer-detail-value">${customer.phone}</p>
                </div>
                <div class="customer-detail-item">
                    <span class="customer-detail-label">Address</span>
                    <p class="customer-detail-value">${customer.address || 'Not provided'}</p>
                </div>
                <div class="customer-detail-item">
                    <span class="customer-detail-label">City</span>
                    <p class="customer-detail-value">${customer.city || 'Not provided'}</p>
                </div>
                <div class="customer-detail-item">
                    <span class="customer-detail-label">Pincode</span>
                    <p class="customer-detail-value">${customer.pincode || 'Not provided'}</p>
                </div>
                <div class="customer-detail-item">
                    <span class="customer-detail-label">Join Date</span>
                    <p class="customer-detail-value">${this.formatDate(customer.createdAt)}</p>
                </div>
            </div>
            
            ${customer.notes ? `
                <div class="customer-detail-item">
                    <span class="customer-detail-label">Notes</span>
                    <p class="customer-detail-value">${customer.notes}</p>
                </div>
            ` : ''}
            
            <div class="customer-orders-section">
                <h5>Order History</h5>
                ${this.getCustomerOrders(customerId).length > 0 ? 
                    this.getCustomerOrders(customerId).map(order => `
                        <div class="customer-order-item">
                            <div class="customer-order-info">
                                <h6>Order ${order.id}</h6>
                                <p>${this.formatDate(order.orderDate)} • ${order.products.length} items</p>
                            </div>
                            <div class="customer-order-amount">₹${order.totalAmount}</div>
                        </div>
                    `).join('') : 
                    '<p style="color: #666; text-align: center; padding: 1rem;">No orders yet</p>'
                }
            </div>
        `;

        // Store current customer ID for editing
        document.getElementById('customerDetailsModal').dataset.customerId = customerId;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
        modal.show();
    }

    getCustomerOrders(customerId) {
        // Get orders for this customer from all orders
        return this.orders.filter(order => order.customerId === customerId);
    }

    editCustomer(customerId) {
        // Close details modal first
        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('customerDetailsModal'));
        if (detailsModal) detailsModal.hide();

        // Find customer and populate form
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        // Pre-fill the add customer modal
        this.showAddCustomerModal();

        // Wait for modal to be shown, then fill the form
        setTimeout(() => {
            document.getElementById('customer-first-name').value = customer.firstName;
            document.getElementById('customer-last-name').value = customer.lastName;
            document.getElementById('customer-email').value = customer.email;
            document.getElementById('customer-phone').value = customer.phone;
            document.getElementById('customer-username').value = customer.username || '';
            document.getElementById('customer-password').value = ''; // Don't show password
            document.getElementById('customer-address').value = customer.address || '';
            document.getElementById('customer-city').value = customer.city || '';
            document.getElementById('customer-pincode').value = customer.pincode || '';
            document.getElementById('customer-notes').value = customer.notes || '';

            // Change the modal title and button
            document.querySelector('#addCustomerModal .modal-title').textContent = 'Edit Customer';
            document.getElementById('confirm-add-customer').textContent = 'Update Customer';

            // Store the customer ID for update
            document.getElementById('addCustomerModal').dataset.customerId = customerId;
        }, 100);
    }

    async deleteCustomer(customerId) {
        if (!confirm('Are you sure you want to delete this customer?')) {
            return;
        }

        try {
            // Remove customer from array
            this.customers = this.customers.filter(c => c.id !== customerId);

            // Save to localStorage
            this.saveCustomersToStorage();

            // Refresh display
            this.renderCustomersGrid();

            this.showAlert('Customer deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting customer:', error);
            this.showAlert('Error deleting customer', 'error');
        }
    }

    filterCustomers() {
        const searchTerm = document.getElementById('customer-search').value.toLowerCase();

        if (!searchTerm) {
            this.renderCustomersGrid();
            return;
        }

        const filteredCustomers = this.customers.filter(customer =>
            customer.firstName.toLowerCase().includes(searchTerm) ||
            customer.lastName.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm)
        );

        // Temporarily store original customers
        const originalCustomers = this.customers;
        this.customers = filteredCustomers;

        // Re-render with filtered customers
        this.renderCustomersGrid();

        // Restore original customers
        this.customers = originalCustomers;
    }

    sortCustomers() {
        const sortBy = document.getElementById('customer-sort').value;

        this.customers.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                case 'orders':
                    return (b.orders || 0) - (a.orders || 0);
                case 'spent':
                    return (b.totalSpent || 0) - (a.totalSpent || 0);
                case 'date':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return 0;
            }
        });

        this.renderCustomersGrid();
    }

    showCustomerCredentials() {
        const customerId = document.getElementById('customerDetailsModal').dataset.customerId;
        const customer = this.customers.find(c => c.id === customerId);

        if (!customer) return;

        const modalContent = document.getElementById('customer-credentials-content');
        modalContent.innerHTML = `
            <div class="credentials-container">
                <h6 style="color: #333; margin-bottom: 1rem;">
                    <i class="fas fa-key me-2"></i>Login Credentials for ${customer.firstName} ${customer.lastName}
                </h6>
                
                <div class="credentials-item">
                    <div>
                        <p class="credentials-label">Username</p>
                        <span class="credentials-value" id="display-username">${customer.username}</span>
                    </div>
                    <button class="credentials-copy-btn" onclick="dealerDashboard.copyToClipboard('${customer.username}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                
                <div class="credentials-item">
                    <div>
                        <p class="credentials-label">Password</p>
                        <span class="credentials-value" id="display-password">${customer.password}</span>
                    </div>
                    <button class="credentials-copy-btn" onclick="dealerDashboard.copyToClipboard('${customer.password}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                
                <div class="credentials-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Important:</strong> Please provide these credentials to the customer securely. 
                    They will need these to log into the website.
                </div>
            </div>
        `;

        // Store current customer ID for password reset
        document.getElementById('customerCredentialsModal').dataset.customerId = customerId;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('customerCredentialsModal'));
        modal.show();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showAlert('Copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showAlert('Copied to clipboard!', 'success');
        });
    }

    async resetCustomerPassword() {
        const customerId = document.getElementById('customerCredentialsModal').dataset.customerId;
        const customer = this.customers.find(c => c.id === customerId);

        if (!customer) return;

        const newPassword = prompt('Enter new password for ' + customer.firstName + ' ' + customer.lastName + ':');

        if (!newPassword) return;

        if (newPassword.length < 6) {
            this.showAlert('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            // Update password
            customer.password = newPassword;

            // Save to localStorage
            this.saveCustomersToStorage();

            // Update display
            document.getElementById('display-password').textContent = newPassword;

            this.showAlert('Password reset successfully!', 'success');
        } catch (error) {
            console.error('Error resetting password:', error);
            this.showAlert('Error resetting password', 'error');
        }
    }

    checkUsernameAvailability() {
        const username = document.getElementById('customer-username').value;
        const customerId = document.getElementById('addCustomerModal').dataset.customerId;

        if (!username) return;

        // Check if username is taken by other customers
        const existingCustomer = this.customers.find(c => c.username === username && c.id !== customerId);

        const availabilityDiv = document.getElementById('username-availability') || this.createUsernameAvailabilityDiv();

        if (existingCustomer) {
            availabilityDiv.innerHTML = '<i class="fas fa-times-circle"></i> Username is already taken';
            availabilityDiv.className = 'username-availability username-taken';
        } else if (username.length >= 3) {
            availabilityDiv.innerHTML = '<i class="fas fa-check-circle"></i> Username is available';
            availabilityDiv.className = 'username-availability username-available';
        } else {
            availabilityDiv.innerHTML = '<i class="fas fa-info-circle"></i> Username must be at least 3 characters';
            availabilityDiv.className = 'username-availability';
        }
    }

    createUsernameAvailabilityDiv() {
        const div = document.createElement('div');
        div.id = 'username-availability';
        div.className = 'username-availability';
        document.getElementById('customer-username').parentNode.appendChild(div);
        return div;
    }

    checkPasswordStrength() {
        const password = document.getElementById('customer-password').value;

        if (!password) return;

        const strengthDiv = document.getElementById('password-strength') || this.createPasswordStrengthDiv();

        let strength = 'weak';
        let message = 'Weak password';

        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            strength = 'strong';
            message = 'Strong password';
        } else if (password.length >= 6) {
            strength = 'medium';
            message = 'Medium strength password';
        }

        strengthDiv.innerHTML = `<i class="fas fa-shield-alt"></i> ${message}`;
        strengthDiv.className = `password-strength ${strength}`;
    }

    createPasswordStrengthDiv() {
        const div = document.createElement('div');
        div.id = 'password-strength';
        div.className = 'password-strength';
        document.getElementById('customer-password').parentNode.appendChild(div);
        return div;
    }

    simulateApiCall() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'error' : type}`;
        alertDiv.textContent = message;

        // Insert at the top of the main content
        const mainContent = document.querySelector('.dealer-main-content');
        mainContent.insertBefore(alertDiv, mainContent.firstChild);

        // Remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Order Processing Methods
    async loadProcessingOrders() {
        try {
            // Show loading state
            const tbody = document.getElementById('processing-orders-tbody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="loading">
                            <div class="spinner"></div>
                        </div>
                    </td>
                </tr>
            `;

            // Fetch real orders from API
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/api/admin/dealer/orders?status=pending&limit=50`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('dealerToken') || 'demo-token'}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Get previous order count for notification
                const previousOrderCount = this.processingOrders.length;
                const previousOrderIds = new Set(this.processingOrders.map(o => o.id));

                // Transform API data to match frontend format
                this.processingOrders = data.data.orders.map(order => {
                    const orderDate = new Date(order.createdAt);
                    const customerName = order.customerId ?
                        (order.customerId.name || 'Guest Customer') :
                        (order.shippingAddress?.name || 'Guest Customer');
                    const customerEmail = order.customerId?.email || order.shippingAddress?.phone || 'N/A';

                    return {
                        id: order._id,
                        orderNumber: order._id.toString().substring(0, 8).toUpperCase(),
                        customer: customerName,
                        email: customerEmail,
                        phone: order.shippingAddress?.phone || 'N/A',
                        products: order.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            image: item.image || item.productId?.image || '../img/placeholder.jpg'
                        })),
                        totalAmount: order.total,
                        subtotal: order.subtotal,
                        shipping: order.shipping,
                        tax: order.tax,
                        discount: 0,
                        orderDate: orderDate.toISOString(),
                        orderTime: orderDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        status: order.status === 'pending' ? 'pending-approval' : order.status,
                        shippingAddress: order.shippingAddress,
                        paymentMethod: order.paymentMethod || 'COD',
                        paymentStatus: 'pending'
                    };
                });

                // Check for new orders and show notification
                const newOrders = this.processingOrders.filter(o => !previousOrderIds.has(o.id));
                if (newOrders.length > 0) {
                    // Only show notification if we had previous orders (to avoid notification on initial load)
                    // But if there are pending orders on first load, still update the badge
                    if (previousOrderCount > 0) {
                        this.showNewOrderNotification(newOrders.length);
                    }
                }

                // Save to localStorage for offline access
                localStorage.setItem('processingOrders', JSON.stringify(this.processingOrders));
                localStorage.setItem('lastOrderCheck', new Date().toISOString());
            } else {
                throw new Error(data.message || 'Failed to fetch orders');
            }

            this.renderProcessingOrdersTable();
            this.updateProcessingOrderBadge();
        } catch (error) {
            console.error('Error loading processing orders:', error);

            // Fallback to localStorage if API fails
            const existingOrders = JSON.parse(localStorage.getItem('processingOrders') || '[]');
            if (existingOrders.length > 0) {
                this.processingOrders = existingOrders;
                this.renderProcessingOrdersTable();
                this.updateProcessingOrderBadge();
                this.showNotification('Using cached data - API unavailable', 'warning');
            } else {
                this.showNotification('Error loading processing orders: ' + error.message, 'error');
                // Show empty state
                const tbody = document.getElementById('processing-orders-tbody');
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted">
                            <i class="fas fa-exclamation-triangle"></i>
                            No orders available
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Clear all processing orders
    clearAllProcessingOrders() {
        if (this.processingOrders.length === 0) {
            this.showAlert('No orders to clear', 'info');
            return;
        }

        if (confirm(`Are you sure you want to permanently delete all ${this.processingOrders.length} processing orders? This action cannot be undone and will remove orders from the database.`)) {
            // Get the IDs of processing orders to remove from main orders array
            const processingOrderIds = this.processingOrders.map(order => order.id);

            // Remove processing orders from the main orders array permanently
            this.orders = this.orders.filter(order => !processingOrderIds.includes(order.id));

            // Clear the processing orders array
            this.processingOrders = [];

            // Clear selected orders
            this.selectedProcessingOrders.clear();

            // Save updated orders to localStorage (permanent removal)
            localStorage.setItem('dealerOrders', JSON.stringify(this.orders));

            // Clear processing orders from localStorage
            localStorage.removeItem('processingOrders');
            localStorage.removeItem('dealerProcessingOrders');

            // Update the main orders table if it's currently displayed
            this.renderOrdersTable();

            // Update the processing orders table display
            this.renderProcessingOrdersTable();

            // Update bulk actions visibility
            this.updateBulkProcessingActions();

            // Update processing order badge
            this.updateProcessingOrderBadge();

            // Update dashboard stats
            this.updateDashboardStats();

            // Show success message
            this.showAlert(`All ${processingOrderIds.length} processing orders have been permanently deleted from the database!`, 'success');

            console.log(`Permanently deleted ${processingOrderIds.length} processing orders from database`);
        }
    }

    generateProcessingOrders() {
        // Generate fresh orders that need processing
        const today = new Date();
        const orders = [];

        // Generate 3-8 new orders for processing
        const numOrders = Math.floor(Math.random() * 6) + 3;

        for (let i = 0; i < numOrders; i++) {
            const orderDate = new Date(today);
            orderDate.setHours(today.getHours() - Math.floor(Math.random() * 24));
            orderDate.setMinutes(today.getMinutes() - Math.floor(Math.random() * 60));

            const customers = [
                'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Singh', 'Vikram Gupta',
                'Anita Reddy', 'Rohit Verma', 'Kavya Nair', 'Suresh Joshi', 'Meera Iyer'
            ];

            const products = [{
                    name: 'Lays Classic Chips',
                    price: 20,
                    image: '../img/chips2.jpg'
                },
                {
                    name: 'Coca Cola 500ml',
                    price: 30,
                    image: '../img/cold_drinks.jpg'
                },
                {
                    name: 'Britannia Good Day',
                    price: 25,
                    image: '../img/biscuit.jpg'
                },
                {
                    name: 'Amul Dark Chocolate',
                    price: 50,
                    image: '../img/chocolate.jpg'
                },
                {
                    name: 'Haldiram Namkeen Mix',
                    price: 40,
                    image: '../img/namkeen.jpg'
                }
            ];

            // Generate 1-3 products per order
            const numProducts = Math.floor(Math.random() * 3) + 1;
            const selectedProducts = [];
            const usedIndices = new Set();

            for (let j = 0; j < numProducts; j++) {
                let productIndex;
                do {
                    productIndex = Math.floor(Math.random() * products.length);
                } while (usedIndices.has(productIndex));

                usedIndices.add(productIndex);
                const product = products[productIndex];
                const quantity = Math.floor(Math.random() * 3) + 1;

                selectedProducts.push({
                    name: product.name,
                    quantity: quantity,
                    price: product.price,
                    image: product.image
                });
            }

            const totalAmount = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);

            orders.push({
                id: `PROC-${Date.now()}-${i + 1}`,
                customer: customers[Math.floor(Math.random() * customers.length)],
                email: `customer${Math.floor(Math.random() * 1000)}@example.com`,
                phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                products: selectedProducts,
                totalAmount: totalAmount,
                status: 'pending-approval',
                orderDate: orderDate.toISOString().split('T')[0],
                orderTime: orderDate.toTimeString().split(' ')[0].substring(0, 5),
                shippingAddress: this.generateRandomAddress(),
                paymentMethod: ['UPI', 'Card', 'Cash', 'Net Banking'][Math.floor(Math.random() * 4)],
                createdAt: orderDate.toISOString()
            });
        }

        return orders;
    }

    renderProcessingOrdersTable() {
        const tbody = document.getElementById('processing-orders-tbody');

        if (this.processingOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div style="text-align: center; padding: 3rem; color: #666;">
                            <i class="fas fa-tasks" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                            <h3 style="color: #333; margin-bottom: 1rem;">No Orders to Process</h3>
                            <p style="margin-bottom: 2rem;">All orders have been processed. New orders will appear here when customers place them.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.processingOrders.map(order => {
            const orderId = order.id || 'N/A';
            const orderTime = order.orderTime || 'N/A';
            const customer = order.customer || 'Guest Customer';
            const email = order.email || 'N/A';
            const products = order.products || [];
            const productNames = products.map(p => p?.name || 'Unknown').join(', ');
            const totalAmount = order.totalAmount || 0;
            const paymentMethod = order.paymentMethod || 'COD';
            const orderDate = order.orderDate || new Date().toISOString();
            const status = order.status || 'pending';

            return `
            <tr>
                <td>
                    <div>
                        <strong>${orderId}</strong><br>
                        <small class="text-muted">${orderTime}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${customer}</strong><br>
                        <small>${email}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <span>${products.length} items</span><br>
                        <small class="text-muted">${productNames}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>₹${totalAmount.toFixed(2)}</strong><br>
                        <small class="text-muted">${paymentMethod}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <span>${this.formatDate(orderDate)}</span><br>
                        <small class="text-muted">${orderTime}</small>
                    </div>
                </td>
                <td>
                    <span class="processing-status-indicator ${status}">${status.replace('-', ' ')}</span>
                </td>
                <td>
                    <button class="btn-action btn-view" onclick="dealerDashboard.viewProcessingOrder('${orderId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-accept" onclick="dealerDashboard.processOrder('${orderId}', 'accept')" title="Accept Order">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-reject" onclick="dealerDashboard.processOrder('${orderId}', 'reject')" title="Reject Order">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    }

    updateProcessingOrderBadge() {
        const pendingCount = this.processingOrders.filter(order =>
            order.status === 'pending-approval' || order.status === 'pending'
        ).length;
        const badge = document.querySelector('.badge.new-orders');
        if (badge) {
            badge.textContent = pendingCount;
            badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
    }

    filterProcessingOrders() {
        const statusFilter = document.getElementById('processing-status-filter').value;

        let filteredOrders = this.processingOrders;

        if (statusFilter) {
            filteredOrders = this.processingOrders.filter(order => order.status === statusFilter);
        }

        // Temporarily store original orders
        const originalOrders = this.processingOrders;
        this.processingOrders = filteredOrders;

        // Re-render with filtered orders
        this.renderProcessingOrdersTable();

        // Restore original orders
        this.processingOrders = originalOrders;
    }

    viewProcessingOrder(orderId) {
        const order = this.processingOrders.find(o => o.id === orderId);
        if (!order) return;

        const modalContent = document.getElementById('order-processing-content');
        modalContent.innerHTML = `
            <div class="processing-order-card ${order.status}">
                <div class="processing-order-header">
                    <div class="processing-order-id">${order.orderNumber || order.id}</div>
                    <div class="processing-order-date">${order.orderDate}</div>
                </div>
                
                <div class="processing-order-content">
                    <div class="processing-order-details">
                        <div class="processing-customer-info">
                            <div class="processing-customer-avatar">
                                ${order.customer.charAt(0)}
                            </div>
                            <div class="processing-customer-details">
                                <h6>${order.customer}</h6>
                                <p>${order.email} • ${order.phone}</p>
                            </div>
                        </div>
                        
                        <div class="processing-order-items">
                            <h6>Order Items:</h6>
                            ${order.products.map(product => `
                                <div class="processing-order-item">
                                    <div class="processing-item-image">
                                        <img src="${product.image}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                                    </div>
                                    <div class="processing-item-details">
                                        <div class="processing-item-name">${product.name}</div>
                                        <div class="processing-item-quantity">Qty: ${product.quantity} × ₹${product.price}</div>
                                    </div>
                                    <div class="processing-item-price">₹${product.price * product.quantity}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="processing-order-pricing">
                            <div class="pricing-row">
                                <span>Subtotal:</span>
                                <span>₹${order.subtotal || order.totalAmount}</span>
                            </div>
                            ${order.shipping ? `<div class="pricing-row"><span>Shipping:</span><span>₹${order.shipping}</span></div>` : ''}
                            ${order.tax ? `<div class="pricing-row"><span>Tax:</span><span>₹${order.tax}</span></div>` : ''}
                            ${order.discount ? `<div class="pricing-row discount"><span>Discount:</span><span>-₹${order.discount}</span></div>` : ''}
                            <div class="pricing-row total">
                                <span>Total Amount:</span>
                                <span>₹${order.totalAmount}</span>
                            </div>
                        </div>
                        
                        <div class="processing-order-address">
                            <h6>Delivery Address:</h6>
                            <div class="address-details">
                                <p><strong>${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}</strong></p>
                                <p>${order.shippingAddress?.street}</p>
                                <p>${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zipCode}</p>
                                <p>${order.shippingAddress?.country}</p>
                                <p>Phone: ${order.shippingAddress?.phone}</p>
                                ${order.shippingAddress?.landmark ? `<p>Landmark: ${order.shippingAddress.landmark}</p>` : ''}
                                ${order.shippingAddress?.instructions ? `<p>Instructions: ${order.shippingAddress.instructions}</p>` : ''}
                            </div>
                        </div>
                        
                        <div class="processing-order-payment">
                            <h6>Payment Information:</h6>
                            <p><strong>Method:</strong> ${order.paymentMethod?.replace('_', ' ').toUpperCase()}</p>
                            <p><strong>Status:</strong> <span class="status-badge ${order.paymentStatus}">${order.paymentStatus?.toUpperCase()}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Store current order ID for processing
        document.getElementById('orderProcessingModal').dataset.orderId = orderId;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('orderProcessingModal'));
        modal.show();
    }

    processOrder(orderId, action) {
        const order = this.processingOrders.find(o => o.id === orderId);
        if (!order) return;

        if (action === 'accept') {
            this.acceptOrder(orderId);
        } else if (action === 'reject') {
            this.showOrderRejectionModal(orderId);
        }
    }

    async acceptOrder(orderId = null) {
        const currentOrderId = orderId || document.getElementById('orderProcessingModal').dataset.orderId;
        const order = this.processingOrders.find(o => o.id === currentOrderId);

        if (!order) return;

        try {
            // Update order status via API
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/api/admin/dealer/orders/${currentOrderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('dealerToken') || 'demo-token'}`
                },
                body: JSON.stringify({
                    status: 'confirmed',
                    note: 'Order approved by dealer'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Update order status locally
                order.status = 'confirmed';
                order.processedAt = new Date().toISOString();
                order.processedBy = 'Dealer';

                // Move to regular orders
                this.orders.push(order);

                // Remove from processing orders
                this.processingOrders = this.processingOrders.filter(o => o.id !== currentOrderId);

                // Save to localStorage
                localStorage.setItem('processingOrders', JSON.stringify(this.processingOrders));
                localStorage.setItem('orders', JSON.stringify(this.orders));

                // Refresh displays
                this.renderProcessingOrdersTable();
                this.renderOrdersTable();
                this.renderRecentOrders();
                this.updateProcessingOrderBadge();

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('orderProcessingModal'));
                if (modal) modal.hide();

                this.showAlert(`Order ${order.orderNumber} accepted successfully!`, 'success');
            } else {
                throw new Error(data.message || 'Failed to accept order');
            }

        } catch (error) {
            console.error('Error accepting order:', error);
            this.showAlert('Error accepting order: ' + error.message, 'error');
        }
    }

    showOrderRejectionModal(orderId = null) {
        const currentOrderId = orderId || document.getElementById('orderProcessingModal').dataset.orderId;

        // Store current order ID for rejection
        document.getElementById('orderRejectionModal').dataset.orderId = currentOrderId;

        // Reset form
        document.getElementById('rejection-reason').value = '';
        document.getElementById('rejection-notes').value = '';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('orderRejectionModal'));
        modal.show();
    }

    async rejectOrder() {
        const orderId = document.getElementById('orderRejectionModal').dataset.orderId;
        const reason = document.getElementById('rejection-reason').value;
        const notes = document.getElementById('rejection-notes').value;

        if (!reason) {
            this.showAlert('Please select a reason for rejection', 'error');
            return;
        }

        const order = this.processingOrders.find(o => o.id === orderId);
        if (!order) return;

        try {
            // Update order status via API
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/api/admin/dealer/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('dealerToken') || 'demo-token'}`
                },
                body: JSON.stringify({
                    status: 'cancelled',
                    note: `Order rejected: ${reason}. ${notes || ''}`
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Update order status locally
                order.status = 'cancelled';
                order.rejectedAt = new Date().toISOString();
                order.rejectedBy = 'Dealer';
                order.rejectionReason = reason;
                order.rejectionNotes = notes;

                // Remove from processing orders
                this.processingOrders = this.processingOrders.filter(o => o.id !== orderId);

                // Save updated data to localStorage
                localStorage.setItem('processingOrders', JSON.stringify(this.processingOrders));
                localStorage.setItem('dealerOrders', JSON.stringify(this.orders));

                // Refresh displays
                this.renderProcessingOrdersTable();
                this.renderOrdersTable();
                this.updateProcessingOrderBadge();
                this.updateDashboardStats();

                // Close modals
                const rejectionModal = bootstrap.Modal.getInstance(document.getElementById('orderRejectionModal'));
                if (rejectionModal) rejectionModal.hide();

                const processingModal = bootstrap.Modal.getInstance(document.getElementById('orderProcessingModal'));
                if (processingModal) processingModal.hide();

                this.showAlert(`Order ${order.orderNumber} rejected successfully!`, 'success');
            } else {
                throw new Error(data.message || 'Failed to reject order');
            }

        } catch (error) {
            console.error('Error rejecting order:', error);
            this.showAlert('Error rejecting order: ' + error.message, 'error');
        }
    }

    async bulkAcceptOrders() {
        if (this.selectedProcessingOrders.size === 0) return;

        try {
            const orderIds = Array.from(this.selectedProcessingOrders);

            // Update orders via bulk API
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/api/admin/dealer/orders/bulk-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('dealerToken') || 'demo-token'}`
                },
                body: JSON.stringify({
                    orderIds: orderIds,
                    status: 'confirmed',
                    note: 'Orders approved by dealer (bulk action)'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Accept all selected orders locally
                this.selectedProcessingOrders.forEach(orderId => {
                    const order = this.processingOrders.find(o => o.id === orderId);
                    if (order) {
                        order.status = 'confirmed';
                        order.processedAt = new Date().toISOString();
                        order.processedBy = 'Dealer';

                        // Move to regular orders
                        this.orders.push(order);
                    }
                });

                // Remove accepted orders from processing
                this.processingOrders = this.processingOrders.filter(o => !this.selectedProcessingOrders.has(o.id));

                // Save to localStorage
                localStorage.setItem('processingOrders', JSON.stringify(this.processingOrders));
                localStorage.setItem('orders', JSON.stringify(this.orders));

                // Clear selection
                this.selectedProcessingOrders.clear();
                this.updateBulkProcessingActions();

                // Refresh displays
                this.renderProcessingOrdersTable();
                this.renderOrdersTable();
                this.renderRecentOrders();
                this.updateProcessingOrderBadge();

                this.showAlert(`${orderIds.length} orders accepted successfully!`, 'success');
            } else {
                throw new Error(data.message || 'Failed to accept orders');
            }

        } catch (error) {
            console.error('Error accepting orders:', error);
            this.showAlert('Error accepting orders: ' + error.message, 'error');
        }
    }

    async bulkRejectOrders() {
        if (this.selectedProcessingOrders.size === 0) return;

        const selectedCount = this.selectedProcessingOrders.size;
        if (!confirm(`Are you sure you want to reject ${selectedCount} orders? This action will cancel the orders.`)) {
            return;
        }

        try {
            const orderIds = Array.from(this.selectedProcessingOrders);

            // Update orders via bulk API
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/api/admin/dealer/orders/bulk-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('dealerToken') || 'demo-token'}`
                },
                body: JSON.stringify({
                    orderIds: orderIds,
                    status: 'cancelled',
                    note: 'Orders rejected by dealer (bulk action)'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Reject all selected orders locally
                this.selectedProcessingOrders.forEach(orderId => {
                    const order = this.processingOrders.find(o => o.id === orderId);
                    if (order) {
                        order.status = 'cancelled';
                        order.rejectedAt = new Date().toISOString();
                        order.rejectedBy = 'Dealer';
                        order.rejectionReason = 'bulk-rejection';
                        order.rejectionNotes = 'Bulk rejection by dealer';
                    }
                });

                // Remove rejected orders from processing
                this.processingOrders = this.processingOrders.filter(o => !this.selectedProcessingOrders.has(o.id));

                // Save updated data to localStorage
                localStorage.setItem('processingOrders', JSON.stringify(this.processingOrders));
                localStorage.setItem('dealerOrders', JSON.stringify(this.orders));

                // Clear selection
                this.selectedProcessingOrders.clear();
                this.updateBulkProcessingActions();

                // Refresh displays
                this.renderProcessingOrdersTable();
                this.renderOrdersTable();
                this.updateProcessingOrderBadge();
                this.updateDashboardStats();

                this.showAlert(`${orderIds.length} orders rejected successfully!`, 'success');
            } else {
                throw new Error(data.message || 'Failed to reject orders');
            }

        } catch (error) {
            console.error('Error rejecting orders:', error);
            this.showAlert('Error rejecting orders: ' + error.message, 'error');
        }
    }

    updateBulkProcessingActions() {
        const bulkActions = document.getElementById('bulk-processing-actions');
        const selectedCount = document.getElementById('selected-processing-count');

        if (this.selectedProcessingOrders.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = this.selectedProcessingOrders.size;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    // Settings functionality
    setupSettingsEventListeners() {
        // Save all settings
        document.getElementById('save-all-settings').addEventListener('click', () => {
            this.saveAllSettings();
        });

        // Export settings
        document.getElementById('export-settings').addEventListener('click', () => {
            this.exportSettings();
        });

        // Individual section edit buttons
        document.getElementById('edit-profile').addEventListener('click', () => {
            this.toggleSectionEdit('profile');
        });

        document.getElementById('edit-business').addEventListener('click', () => {
            this.toggleSectionEdit('business');
        });

        document.getElementById('edit-company').addEventListener('click', () => {
            this.toggleSectionEdit('company');
        });

        document.getElementById('edit-contact').addEventListener('click', () => {
            this.toggleSectionEdit('contact');
        });

        document.getElementById('edit-banking').addEventListener('click', () => {
            this.toggleSectionEdit('banking');
        });

        document.getElementById('edit-categories').addEventListener('click', () => {
            this.toggleSectionEdit('categories');
        });

        document.getElementById('edit-additional').addEventListener('click', () => {
            this.toggleSectionEdit('additional');
        });

        // Form validation
        this.setupFormValidation();
    }

    setupFormValidation() {
        // GSTIN validation
        document.getElementById('gstin-number').addEventListener('blur', () => {
            this.validateGSTIN();
        });

        // PAN validation
        document.getElementById('pan-number').addEventListener('blur', () => {
            this.validatePAN();
        });

        // Email validation
        document.getElementById('dealer-email').addEventListener('blur', () => {
            this.validateEmail('dealer-email');
        });

        document.getElementById('business-email').addEventListener('blur', () => {
            this.validateEmail('business-email');
        });

        // Phone validation
        document.getElementById('dealer-phone').addEventListener('blur', () => {
            this.validatePhone('dealer-phone');
        });

        document.getElementById('primary-phone').addEventListener('blur', () => {
            this.validatePhone('primary-phone');
        });
    }

    toggleSectionEdit(sectionName) {
        const section = document.querySelector(`#${sectionName}-form`).closest('.settings-section');
        const editBtn = document.getElementById(`edit-${sectionName}`);

        if (section.classList.contains('editing')) {
            // Save changes
            this.saveSectionData(sectionName);
            section.classList.remove('editing');
            section.classList.add('readonly');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        } else {
            // Enter edit mode
            section.classList.remove('readonly');
            section.classList.add('editing');
            editBtn.innerHTML = '<i class="fas fa-save"></i> Save';
        }
    }

    saveSectionData(sectionName) {
        const form = document.getElementById(`${sectionName}-form`);
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Save to localStorage
        const settings = JSON.parse(localStorage.getItem('dealerSettings') || '{}');
        settings[sectionName] = data;
        localStorage.setItem('dealerSettings', JSON.stringify(settings));

        this.showAlert(`${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} settings saved successfully!`, 'success');
    }

    saveAllSettings() {
        const sections = ['profile', 'business', 'company', 'contact', 'banking', 'categories', 'additional'];
        let allData = {};

        sections.forEach(section => {
            const form = document.getElementById(`${section}-form`);
            if (form) {
                const formData = new FormData(form);
                const data = {};

                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }
                allData[section] = data;
            }
        });

        // Save to localStorage
        localStorage.setItem('dealerSettings', JSON.stringify(allData));

        this.showAlert('All settings saved successfully!', 'success');
        this.updateSettingsSummary();
    }

    exportSettings() {
        const settings = JSON.parse(localStorage.getItem('dealerSettings') || '{}');
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], {
            type: 'application/json'
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dealer-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showAlert('Settings exported successfully!', 'success');
    }

    validateGSTIN() {
        const gstinInput = document.getElementById('gstin-number');
        const gstin = gstinInput.value.trim();

        // GSTIN format: 2 digits state code + 10 characters PAN + 1 character entity number + Z + 1 character checksum
        const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (gstin && !gstinPattern.test(gstin)) {
            gstinInput.classList.add('is-invalid');
            gstinInput.classList.remove('is-valid');
            this.showFieldError(gstinInput, 'Invalid GSTIN format');
        } else if (gstin) {
            gstinInput.classList.add('is-valid');
            gstinInput.classList.remove('is-invalid');
            this.clearFieldError(gstinInput);
        }
    }

    validatePAN() {
        const panInput = document.getElementById('pan-number');
        const pan = panInput.value.trim();

        // PAN format: 5 letters + 4 digits + 1 letter
        const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

        if (pan && !panPattern.test(pan)) {
            panInput.classList.add('is-invalid');
            panInput.classList.remove('is-valid');
            this.showFieldError(panInput, 'Invalid PAN format');
        } else if (pan) {
            panInput.classList.add('is-valid');
            panInput.classList.remove('is-invalid');
            this.clearFieldError(panInput);
        }
    }

    validateEmail(fieldId) {
        const emailInput = document.getElementById(fieldId);
        const email = emailInput.value.trim();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email && !emailPattern.test(email)) {
            emailInput.classList.add('is-invalid');
            emailInput.classList.remove('is-valid');
            this.showFieldError(emailInput, 'Invalid email format');
        } else if (email) {
            emailInput.classList.add('is-valid');
            emailInput.classList.remove('is-invalid');
            this.clearFieldError(emailInput);
        }
    }

    validatePhone(fieldId) {
        const phoneInput = document.getElementById(fieldId);
        const phone = phoneInput.value.trim();

        // Indian phone number pattern
        const phonePattern = /^(\+91|91)?[6-9]\d{9}$/;

        if (phone && !phonePattern.test(phone.replace(/\s/g, ''))) {
            phoneInput.classList.add('is-invalid');
            phoneInput.classList.remove('is-valid');
            this.showFieldError(phoneInput, 'Invalid phone number format');
        } else if (phone) {
            phoneInput.classList.add('is-valid');
            phoneInput.classList.remove('is-invalid');
            this.clearFieldError(phoneInput);
        }
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    clearFieldError(input) {
        const existingError = input.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
    }

    updateSettingsSummary() {
        const settings = JSON.parse(localStorage.getItem('dealerSettings') || '{}');

        // Calculate completion percentage
        const sections = ['profile', 'business', 'company', 'contact', 'banking', 'categories', 'additional'];
        let completedSections = 0;

        sections.forEach(section => {
            if (settings[section] && Object.keys(settings[section]).length > 0) {
                completedSections++;
            }
        });

        const completionPercentage = Math.round((completedSections / sections.length) * 100);

        // Update progress bar if it exists
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${completionPercentage}%`;
        }

        // Update progress text if it exists
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${completionPercentage}% Complete (${completedSections}/${sections.length} sections)`;
        }
    }

    loadSettingsData() {
        const settings = JSON.parse(localStorage.getItem('dealerSettings') || '{}');

        // Load data into forms
        Object.keys(settings).forEach(section => {
            const form = document.getElementById(`${section}-form`);
            if (form) {
                Object.keys(settings[section]).forEach(field => {
                    const input = form.querySelector(`[name="${field}"]`) || form.querySelector(`#${field}`);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = settings[section][field] === 'on' || settings[section][field] === true;
                        } else {
                            input.value = settings[section][field];
                        }
                    }
                });
            }
        });

        this.updateSettingsSummary();
    }

    // Inventory Management Methods
    setupInventoryEventListeners() {
        // Add inventory item
        document.getElementById('add-inventory-item').addEventListener('click', () => {
            this.showInventoryItemModal();
        });

        // Save inventory item
        document.getElementById('save-inventory-item').addEventListener('click', () => {
            this.saveInventoryItem();
        });

        // Export inventory
        document.getElementById('export-inventory').addEventListener('click', () => {
            this.exportInventory();
        });

        // Inventory filters
        document.getElementById('inventory-search').addEventListener('input', () => {
            this.filterInventory();
        });

        document.getElementById('category-filter').addEventListener('change', () => {
            this.filterInventory();
        });

        document.getElementById('stock-status-filter').addEventListener('change', () => {
            this.filterInventory();
        });

        document.getElementById('sort-filter').addEventListener('change', () => {
            this.sortInventory();
        });

        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyInventoryFilters();
        });

        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearInventoryFilters();
        });

        // Select all inventory items
        document.getElementById('select-all-inventory').addEventListener('change', (e) => {
            this.toggleSelectAllInventory(e.target.checked);
        });

        // Bulk inventory actions
        document.getElementById('bulk-update-stock').addEventListener('click', () => {
            this.bulkUpdateStock();
        });

        document.getElementById('bulk-export').addEventListener('click', () => {
            this.bulkExportInventory();
        });

        document.getElementById('bulk-adjust').addEventListener('click', () => {
            this.bulkAdjustStock();
        });

        document.getElementById('bulk-delete').addEventListener('click', () => {
            this.bulkDeleteInventory();
        });

        // Stock adjustment
        document.getElementById('confirm-stock-adjustment').addEventListener('click', () => {
            this.confirmStockAdjustment();
        });

        // Inventory details modal
        document.getElementById('edit-inventory-item').addEventListener('click', () => {
            this.editInventoryItem();
        });

        document.getElementById('adjust-stock-btn').addEventListener('click', () => {
            this.showStockAdjustmentModal();
        });
    }

    loadInventory() {
        // Load inventory from localStorage or API
        const savedInventory = localStorage.getItem('dealerInventory');
        if (savedInventory) {
            this.inventory = JSON.parse(savedInventory);
        } else {
            // Sample inventory data
            this.inventory = [{
                    id: 1,
                    name: 'Parle-G Biscuits',
                    sku: 'PAR001',
                    category: 'fmcg',
                    currentStock: 150,
                    minStock: 50,
                    maxStock: 500,
                    unitPrice: 5.00,
                    unit: 'pieces',
                    supplier: 'Parle Products',
                    description: 'Classic glucose biscuits',
                    status: 'in-stock',
                    lastUpdated: new Date().toISOString(),
                    image: 'img/biscuit.jpg'
                },
                {
                    id: 2,
                    name: 'Amul Milk',
                    sku: 'AMU002',
                    category: 'food',
                    currentStock: 25,
                    minStock: 30,
                    maxStock: 100,
                    unitPrice: 25.00,
                    unit: 'liters',
                    supplier: 'Amul',
                    description: 'Fresh cow milk',
                    status: 'low-stock',
                    lastUpdated: new Date().toISOString(),
                    image: 'img/Amul.png'
                },
                {
                    id: 3,
                    name: 'Dabur Honey',
                    sku: 'DAB003',
                    category: 'health',
                    currentStock: 0,
                    minStock: 20,
                    maxStock: 100,
                    unitPrice: 150.00,
                    unit: 'pieces',
                    supplier: 'Dabur',
                    description: 'Pure honey',
                    status: 'out-of-stock',
                    lastUpdated: new Date().toISOString(),
                    image: 'img/dabur.jpeg.jpg'
                }
            ];
            this.saveInventory();
        }

        this.renderInventory();
        this.updateInventoryStats();
    }

    saveInventory() {
        localStorage.setItem('dealerInventory', JSON.stringify(this.inventory));
    }

    renderInventory() {
        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.inventory.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="inventory-checkbox" data-id="${item.id}">
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.image}" alt="${item.name}" class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                        <div>
                            <div class="fw-bold">${item.name}</div>
                            <small class="text-muted">${item.description}</small>
                        </div>
                    </div>
                </td>
                <td>${item.sku}</td>
                <td>
                    <span class="badge bg-secondary">${this.getCategoryName(item.category)}</span>
                </td>
                <td>
                    <div class="stock-level-indicator">
                        <span class="fw-bold">${item.currentStock}</span>
                        <div class="stock-bar">
                            <div class="stock-fill ${this.getStockLevel(item)}" style="width: ${this.getStockPercentage(item)}%"></div>
                        </div>
                    </div>
                </td>
                <td>${item.minStock}</td>
                <td>${item.maxStock || 'N/A'}</td>
                <td>₹${item.unitPrice.toFixed(2)}</td>
                <td>₹${(item.currentStock * item.unitPrice).toFixed(2)}</td>
                <td>
                    <span class="stock-status ${item.status}">${this.getStatusText(item.status)}</span>
                </td>
                <td>${new Date(item.lastUpdated).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-view-inventory" onclick="dealerDashboard.viewInventoryItem(${item.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-edit-inventory" onclick="dealerDashboard.editInventoryItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-adjust-stock" onclick="dealerDashboard.adjustStock(${item.id})">
                        <i class="fas fa-adjust"></i>
                    </button>
                    <button class="btn btn-sm btn-delete-inventory" onclick="dealerDashboard.deleteInventoryItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for checkboxes
        document.querySelectorAll('.inventory-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleInventorySelection(e.target.dataset.id, e.target.checked);
            });
        });
    }

    getCategoryName(category) {
        const categories = {
            'fmcg': 'FMCG',
            'food': 'Food & Beverages',
            'health': 'Health & Wellness',
            'personal': 'Personal Care',
            'household': 'Household',
            'baby': 'Baby Care'
        };
        return categories[category] || category;
    }

    getStockLevel(item) {
        if (item.currentStock === 0) return 'critical';
        if (item.currentStock <= item.minStock) return 'low';
        if (item.maxStock && item.currentStock >= item.maxStock) return 'high';
        return 'medium';
    }

    getStockPercentage(item) {
        if (item.maxStock) {
            return Math.min((item.currentStock / item.maxStock) * 100, 100);
        }
        return Math.min((item.currentStock / (item.minStock * 3)) * 100, 100);
    }

    getStatusText(status) {
        const statuses = {
            'in-stock': 'In Stock',
            'low-stock': 'Low Stock',
            'out-of-stock': 'Out of Stock',
            'overstock': 'Overstock'
        };
        return statuses[status] || status;
    }

    updateInventoryStats() {
        const totalItems = this.inventory.length;
        const lowStockItems = this.inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length;
        const totalValue = this.inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
        const turnoverRate = this.calculateTurnoverRate();

        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('low-stock-items').textContent = lowStockItems;
        document.getElementById('inventory-value').textContent = `₹${totalValue.toLocaleString()}`;
        document.getElementById('turnover-rate').textContent = `${turnoverRate}%`;

        // Update low stock badge
        const lowStockBadge = document.getElementById('low-stock-badge');
        if (lowStockItems > 0) {
            lowStockBadge.textContent = lowStockItems;
            lowStockBadge.style.display = 'inline';
        } else {
            lowStockBadge.style.display = 'none';
        }
    }

    calculateTurnoverRate() {
        // Simple turnover calculation based on stock movements
        // In a real application, this would be calculated from actual sales data
        return Math.floor(Math.random() * 20) + 10; // Random between 10-30%
    }

    showInventoryItemModal(item = null) {
        const modal = new bootstrap.Modal(document.getElementById('inventoryItemModal'));
        const title = document.getElementById('inventory-modal-title');

        if (item) {
            title.textContent = 'Edit Inventory Item';
            this.populateInventoryForm(item);
        } else {
            title.textContent = 'Add Inventory Item';
            this.clearInventoryForm();
        }

        modal.show();
    }

    populateInventoryForm(item) {
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-sku').value = item.sku;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-unit').value = item.unit;
        document.getElementById('current-stock').value = item.currentStock;
        document.getElementById('min-stock').value = item.minStock;
        document.getElementById('max-stock').value = item.maxStock || '';
        document.getElementById('unit-price').value = item.unitPrice;
        document.getElementById('supplier').value = item.supplier || '';
        document.getElementById('item-description').value = item.description || '';
    }

    clearInventoryForm() {
        document.getElementById('inventory-item-form').reset();
    }

    saveInventoryItem() {
        const form = document.getElementById('inventory-item-form');
        const formData = new FormData(form);

        const itemData = {
            name: document.getElementById('item-name').value,
            sku: document.getElementById('item-sku').value,
            category: document.getElementById('item-category').value,
            unit: document.getElementById('item-unit').value,
            currentStock: parseInt(document.getElementById('current-stock').value),
            minStock: parseInt(document.getElementById('min-stock').value),
            maxStock: parseInt(document.getElementById('max-stock').value) || null,
            unitPrice: parseFloat(document.getElementById('unit-price').value),
            supplier: document.getElementById('supplier').value,
            description: document.getElementById('item-description').value,
            lastUpdated: new Date().toISOString()
        };

        // Validate required fields
        if (!itemData.name || !itemData.sku || !itemData.category || !itemData.unit ||
            isNaN(itemData.currentStock) || isNaN(itemData.minStock) || isNaN(itemData.unitPrice)) {
            alert('Please fill in all required fields');
            return;
        }

        // Check for duplicate SKU
        const existingItem = this.inventory.find(item => item.sku === itemData.sku);
        if (existingItem && !document.getElementById('inventory-modal-title').textContent.includes('Edit')) {
            alert('SKU already exists. Please use a different SKU.');
            return;
        }

        // Determine status based on stock levels
        itemData.status = this.determineStockStatus(itemData);
        itemData.id = existingItem ? existingItem.id : Date.now();
        itemData.image = existingItem ? existingItem.image : 'img/default-product.jpg';

        if (document.getElementById('inventory-modal-title').textContent.includes('Edit')) {
            // Update existing item
            const index = this.inventory.findIndex(item => item.id === existingItem.id);
            this.inventory[index] = itemData;
        } else {
            // Add new item
            this.inventory.push(itemData);
        }

        this.saveInventory();
        this.renderInventory();
        this.updateInventoryStats();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('inventoryItemModal'));
        modal.hide();

        this.showNotification('Inventory item saved successfully!', 'success');
    }

    determineStockStatus(item) {
        if (item.currentStock === 0) return 'out-of-stock';
        if (item.currentStock <= item.minStock) return 'low-stock';
        if (item.maxStock && item.currentStock >= item.maxStock) return 'overstock';
        return 'in-stock';
    }

    filterInventory() {
        const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const statusFilter = document.getElementById('stock-status-filter').value;

        let filteredInventory = this.inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                item.sku.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm);

            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            const matchesStatus = !statusFilter || item.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.renderFilteredInventory(filteredInventory);
    }

    renderFilteredInventory(filteredItems) {
        const tbody = document.getElementById('inventory-tbody');
        tbody.innerHTML = '';

        filteredItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="inventory-checkbox" data-id="${item.id}">
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.image}" alt="${item.name}" class="me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                        <div>
                            <div class="fw-bold">${item.name}</div>
                            <small class="text-muted">${item.description}</small>
                        </div>
                    </div>
                </td>
                <td>${item.sku}</td>
                <td>
                    <span class="badge bg-secondary">${this.getCategoryName(item.category)}</span>
                </td>
                <td>
                    <div class="stock-level-indicator">
                        <span class="fw-bold">${item.currentStock}</span>
                        <div class="stock-bar">
                            <div class="stock-fill ${this.getStockLevel(item)}" style="width: ${this.getStockPercentage(item)}%"></div>
                        </div>
                    </div>
                </td>
                <td>${item.minStock}</td>
                <td>${item.maxStock || 'N/A'}</td>
                <td>₹${item.unitPrice.toFixed(2)}</td>
                <td>₹${(item.currentStock * item.unitPrice).toFixed(2)}</td>
                <td>
                    <span class="stock-status ${item.status}">${this.getStatusText(item.status)}</span>
                </td>
                <td>${new Date(item.lastUpdated).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-view-inventory" onclick="dealerDashboard.viewInventoryItem(${item.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-edit-inventory" onclick="dealerDashboard.editInventoryItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-adjust-stock" onclick="dealerDashboard.adjustStock(${item.id})">
                        <i class="fas fa-adjust"></i>
                    </button>
                    <button class="btn btn-sm btn-delete-inventory" onclick="dealerDashboard.deleteInventoryItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for checkboxes
        document.querySelectorAll('.inventory-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleInventorySelection(e.target.dataset.id, e.target.checked);
            });
        });
    }

    sortInventory() {
        const sortBy = document.getElementById('sort-filter').value;

        this.inventory.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'sku':
                    return a.sku.localeCompare(b.sku);
                case 'stock':
                    return b.currentStock - a.currentStock;
                case 'value':
                    return (b.currentStock * b.unitPrice) - (a.currentStock * a.unitPrice);
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'last-updated':
                    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
                default:
                    return 0;
            }
        });

        this.renderInventory();
    }

    applyInventoryFilters() {
        this.filterInventory();
    }

    clearInventoryFilters() {
        document.getElementById('inventory-search').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('stock-status-filter').value = '';
        document.getElementById('sort-filter').value = 'name';
        this.renderInventory();
    }

    toggleSelectAllInventory(checked) {
        document.querySelectorAll('.inventory-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
            this.toggleInventorySelection(checkbox.dataset.id, checked);
        });
    }

    toggleInventorySelection(itemId, selected) {
        if (selected) {
            this.selectedInventoryItems.add(itemId);
        } else {
            this.selectedInventoryItems.delete(itemId);
        }

        this.updateBulkActionsVisibility();
    }

    updateBulkActionsVisibility() {
        const bulkActions = document.getElementById('bulk-inventory-actions');
        const selectedCount = document.getElementById('selected-inventory-count');

        if (this.selectedInventoryItems.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = this.selectedInventoryItems.size;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    viewInventoryItem(itemId) {
        const item = this.inventory.find(i => i.id == itemId);
        if (!item) return;

        const modal = new bootstrap.Modal(document.getElementById('inventoryDetailsModal'));
        const content = document.getElementById('inventory-details-content');

        content.innerHTML = `
            <div class="inventory-details-header">
                <img src="${item.image}" alt="${item.name}" class="inventory-details-image">
                <div class="inventory-details-info">
                    <h4>${item.name}</h4>
                    <p>SKU: ${item.sku} | Category: ${this.getCategoryName(item.category)}</p>
                </div>
            </div>
            
            <div class="inventory-details-grid">
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Current Stock</span>
                    <span class="inventory-detail-value">${item.currentStock} ${item.unit}</span>
                </div>
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Minimum Stock</span>
                    <span class="inventory-detail-value">${item.minStock} ${item.unit}</span>
                </div>
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Maximum Stock</span>
                    <span class="inventory-detail-value">${item.maxStock || 'Not Set'} ${item.unit}</span>
                </div>
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Unit Price</span>
                    <span class="inventory-detail-value">₹${item.unitPrice.toFixed(2)}</span>
                </div>
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Total Value</span>
                    <span class="inventory-detail-value">₹${(item.currentStock * item.unitPrice).toFixed(2)}</span>
                </div>
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Status</span>
                    <span class="inventory-detail-value">
                        <span class="stock-status ${item.status}">${this.getStatusText(item.status)}</span>
                    </span>
                </div>
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Supplier</span>
                    <span class="inventory-detail-value">${item.supplier || 'Not specified'}</span>
                </div>
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Last Updated</span>
                    <span class="inventory-detail-value">${new Date(item.lastUpdated).toLocaleString()}</span>
                </div>
            </div>
            
            ${item.description ? `
                <div class="inventory-detail-item">
                    <span class="inventory-detail-label">Description</span>
                    <span class="inventory-detail-value">${item.description}</span>
                </div>
            ` : ''}
        `;

        modal.show();
    }

    editInventoryItem(itemId) {
        const item = this.inventory.find(i => i.id == itemId);
        if (!item) return;

        this.showInventoryItemModal(item);
    }

    adjustStock(itemId) {
        const item = this.inventory.find(i => i.id == itemId);
        if (!item) return;

        document.getElementById('adjustment-item').value = item.name;
        document.getElementById('current-stock-display').value = `${item.currentStock} ${item.unit}`;

        const modal = new bootstrap.Modal(document.getElementById('stockAdjustmentModal'));
        modal.show();
    }

    showStockAdjustmentModal() {
        const modal = new bootstrap.Modal(document.getElementById('stockAdjustmentModal'));
        modal.show();
    }

    confirmStockAdjustment() {
        const adjustmentType = document.getElementById('adjustment-type').value;
        const quantity = parseInt(document.getElementById('adjustment-quantity').value);
        const reason = document.getElementById('adjustment-reason').value;
        const notes = document.getElementById('adjustment-notes').value;

        if (!adjustmentType || !quantity || !reason) {
            alert('Please fill in all required fields');
            return;
        }

        // Find the item being adjusted (this would be set when opening the modal)
        const itemName = document.getElementById('adjustment-item').value;
        const item = this.inventory.find(i => i.name === itemName);

        if (!item) {
            alert('Item not found');
            return;
        }

        let newStock;
        switch (adjustmentType) {
            case 'add':
                newStock = item.currentStock + quantity;
                break;
            case 'remove':
                newStock = Math.max(0, item.currentStock - quantity);
                break;
            case 'set':
                newStock = quantity;
                break;
        }

        // Update item
        item.currentStock = newStock;
        item.status = this.determineStockStatus(item);
        item.lastUpdated = new Date().toISOString();

        this.saveInventory();
        this.renderInventory();
        this.updateInventoryStats();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('stockAdjustmentModal'));
        modal.hide();

        this.showNotification('Stock adjustment applied successfully!', 'success');
    }

    deleteInventoryItem(itemId) {
        if (confirm('Are you sure you want to delete this inventory item?')) {
            this.inventory = this.inventory.filter(item => item.id != itemId);
            this.saveInventory();
            this.renderInventory();
            this.updateInventoryStats();
            this.showNotification('Inventory item deleted successfully!', 'success');
        }
    }

    bulkUpdateStock() {
        if (this.selectedInventoryItems.size === 0) {
            alert('Please select items to update');
            return;
        }

        const newStock = prompt('Enter new stock quantity:');
        if (newStock === null || isNaN(newStock)) return;

        this.selectedInventoryItems.forEach(itemId => {
            const item = this.inventory.find(i => i.id == itemId);
            if (item) {
                item.currentStock = parseInt(newStock);
                item.status = this.determineStockStatus(item);
                item.lastUpdated = new Date().toISOString();
            }
        });

        this.saveInventory();
        this.renderInventory();
        this.updateInventoryStats();
        this.showNotification('Stock updated for selected items!', 'success');
    }

    bulkExportInventory() {
        if (this.selectedInventoryItems.size === 0) {
            alert('Please select items to export');
            return;
        }

        const selectedItems = this.inventory.filter(item =>
            this.selectedInventoryItems.has(item.id.toString())
        );

        this.exportInventoryData(selectedItems);
    }

    bulkAdjustStock() {
        if (this.selectedInventoryItems.size === 0) {
            alert('Please select items to adjust');
            return;
        }

        const adjustment = prompt('Enter stock adjustment (+/- quantity):');
        if (adjustment === null) return;

        const quantity = parseInt(adjustment);
        if (isNaN(quantity)) {
            alert('Invalid quantity');
            return;
        }

        this.selectedInventoryItems.forEach(itemId => {
            const item = this.inventory.find(i => i.id == itemId);
            if (item) {
                item.currentStock = Math.max(0, item.currentStock + quantity);
                item.status = this.determineStockStatus(item);
                item.lastUpdated = new Date().toISOString();
            }
        });

        this.saveInventory();
        this.renderInventory();
        this.updateInventoryStats();
        this.showNotification('Stock adjusted for selected items!', 'success');
    }

    bulkDeleteInventory() {
        if (this.selectedInventoryItems.size === 0) {
            alert('Please select items to delete');
            return;
        }

        if (confirm(`Are you sure you want to delete ${this.selectedInventoryItems.size} selected items?`)) {
            this.inventory = this.inventory.filter(item =>
                !this.selectedInventoryItems.has(item.id.toString())
            );

            this.selectedInventoryItems.clear();
            this.saveInventory();
            this.renderInventory();
            this.updateInventoryStats();
            this.showNotification('Selected items deleted successfully!', 'success');
        }
    }

    exportInventory() {
        this.exportInventoryData(this.inventory);
    }

    exportInventoryData(items) {
        const csvContent = this.generateInventoryCSV(items);
        const blob = new Blob([csvContent], {
            type: 'text/csv'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    generateInventoryCSV(items) {
        const headers = ['Name', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Max Stock', 'Unit Price', 'Total Value', 'Status', 'Supplier', 'Last Updated'];
        const rows = items.map(item => [
            item.name,
            item.sku,
            this.getCategoryName(item.category),
            item.currentStock,
            item.minStock,
            item.maxStock || '',
            item.unitPrice,
            (item.currentStock * item.unitPrice).toFixed(2),
            this.getStatusText(item.status),
            item.supplier || '',
            new Date(item.lastUpdated).toLocaleString()
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showNewOrderNotification(count) {
        const message = count === 1 ?
            `🎉 New order received! Check the Order Processing menu.` :
            `🎉 ${count} new orders received! Check the Order Processing menu.`;

        this.showNotification(message, 'success');

        // Also update the badge with animation
        const badge = document.querySelector('.badge.new-orders');
        if (badge) {
            badge.style.animation = 'badgePulse 0.5s ease-in-out 3';
        }

        // Play notification sound if available (optional)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZUhAMT6Tj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQYxh9Hz04IzBh5uwO/jmVIQDE+k4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore errors if audio fails
        } catch (e) {
            // Ignore audio errors
        }
    }

    startOrderPolling() {
        // Poll for new orders every 30 seconds
        this.orderPollInterval = setInterval(() => {
            this.loadProcessingOrders();
        }, 30000); // 30 seconds

        // Also poll when the page becomes visible (user switches back to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadProcessingOrders();
            }
        });
    }

    stopOrderPolling() {
        if (this.orderPollInterval) {
            clearInterval(this.orderPollInterval);
            this.orderPollInterval = null;
        }
    }

    // Bookkeeping Management Methods
    setupBookkeepingEventListeners() {
        // Add transaction
        document.getElementById('add-transaction').addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Save transaction
        document.getElementById('save-transaction').addEventListener('click', () => {
            this.saveTransaction();
        });

        // Export financials
        document.getElementById('export-financials').addEventListener('click', () => {
            this.exportFinancials();
        });

        // Import financials
        document.getElementById('import-financials').addEventListener('click', () => {
            this.showImportModal();
        });

        // Transaction filters
        document.getElementById('transaction-search').addEventListener('input', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-type-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('category-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('date-range-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('apply-financial-filters').addEventListener('click', () => {
            this.applyFinancialFilters();
        });

        document.getElementById('clear-financial-filters').addEventListener('click', () => {
            this.clearFinancialFilters();
        });

        // Select all transactions
        document.getElementById('select-all-transactions').addEventListener('change', (e) => {
            this.toggleSelectAllTransactions(e.target.checked);
        });

        // Bulk financial actions
        document.getElementById('bulk-export-selected').addEventListener('click', () => {
            this.bulkExportSelected();
        });

        document.getElementById('bulk-categorize').addEventListener('click', () => {
            this.showBulkCategorizeModal();
        });

        document.getElementById('bulk-delete-transactions').addEventListener('click', () => {
            this.bulkDeleteTransactions();
        });

        // Transaction details modal
        document.getElementById('edit-transaction').addEventListener('click', () => {
            this.editTransaction();
        });

        // Import Excel
        document.getElementById('process-excel-import').addEventListener('click', () => {
            this.processExcelImport();
        });

        // Bulk categorize
        document.getElementById('confirm-bulk-categorize').addEventListener('click', () => {
            this.confirmBulkCategorize();
        });
    }

    loadTransactions() {
        // Load transactions from localStorage or API
        const savedTransactions = localStorage.getItem('dealerTransactions');
        if (savedTransactions) {
            this.transactions = JSON.parse(savedTransactions);
        } else {
            // Sample transaction data
            this.transactions = [{
                    id: 1,
                    date: '2024-01-15',
                    description: 'Sales Revenue - Product Sales',
                    type: 'income',
                    category: 'sales',
                    amount: 15000.00,
                    paymentMethod: 'bank_transfer',
                    reference: 'TXN001',
                    status: 'completed',
                    notes: 'Monthly sales revenue',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    date: '2024-01-14',
                    description: 'Office Rent Payment',
                    type: 'expense',
                    category: 'rent',
                    amount: 5000.00,
                    paymentMethod: 'bank_transfer',
                    reference: 'RENT001',
                    status: 'completed',
                    notes: 'Monthly office rent',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    date: '2024-01-13',
                    description: 'Inventory Purchase',
                    type: 'expense',
                    category: 'purchases',
                    amount: 8000.00,
                    paymentMethod: 'credit_card',
                    reference: 'PUR001',
                    status: 'completed',
                    notes: 'Stock replenishment',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 4,
                    date: '2024-01-12',
                    description: 'Marketing Campaign',
                    type: 'expense',
                    category: 'marketing',
                    amount: 2000.00,
                    paymentMethod: 'upi',
                    reference: 'MKT001',
                    status: 'completed',
                    notes: 'Digital marketing campaign',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 5,
                    date: '2024-01-11',
                    description: 'Utility Bills',
                    type: 'expense',
                    category: 'utilities',
                    amount: 1500.00,
                    paymentMethod: 'bank_transfer',
                    reference: 'UTIL001',
                    status: 'completed',
                    notes: 'Electricity and water bills',
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveTransactions();
        }

        this.renderTransactions();
        this.updateFinancialStats();
    }

    saveTransactions() {
        localStorage.setItem('dealerTransactions', JSON.stringify(this.transactions));
    }

    renderTransactions() {
        const tbody = document.getElementById('financial-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="transaction-checkbox" data-id="${transaction.id}">
                </td>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>
                    <div class="fw-bold">${transaction.description}</div>
                    ${transaction.notes ? `<small class="text-muted">${transaction.notes}</small>` : ''}
                </td>
                <td>
                    <span class="transaction-type ${transaction.type}">${this.getTransactionTypeText(transaction.type)}</span>
                </td>
                <td>
                    <span class="badge bg-secondary">${this.getCategoryText(transaction.category)}</span>
                </td>
                <td>
                    <span class="${this.getAmountClass(transaction.type)}">
                        ${transaction.type === 'expense' ? '-' : '+'}₹${transaction.amount.toFixed(2)}
                    </span>
                </td>
                <td>
                    <span class="payment-method">
                        <i class="fas ${this.getPaymentMethodIcon(transaction.paymentMethod)}"></i>
                        ${this.getPaymentMethodText(transaction.paymentMethod)}
                    </span>
                </td>
                <td>${transaction.reference || 'N/A'}</td>
                <td>
                    <span class="transaction-status ${transaction.status}">${this.getStatusText(transaction.status)}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-view-transaction" onclick="dealerDashboard.viewTransaction(${transaction.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-edit-transaction" onclick="dealerDashboard.editTransaction(${transaction.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete-transaction" onclick="dealerDashboard.deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for checkboxes
        document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTransactionSelection(e.target.dataset.id, e.target.checked);
            });
        });
    }

    getTransactionTypeText(type) {
        const types = {
            'income': 'Income',
            'expense': 'Expense',
            'transfer': 'Transfer'
        };
        return types[type] || type;
    }

    getCategoryText(category) {
        const categories = {
            'sales': 'Sales Revenue',
            'purchases': 'Purchases',
            'rent': 'Rent',
            'utilities': 'Utilities',
            'transport': 'Transport',
            'marketing': 'Marketing',
            'other': 'Other'
        };
        return categories[category] || category;
    }

    getAmountClass(type) {
        switch (type) {
            case 'income':
                return 'amount-positive';
            case 'expense':
                return 'amount-negative';
            case 'transfer':
                return 'amount-neutral';
            default:
                return 'amount-neutral';
        }
    }

    getPaymentMethodIcon(method) {
        const icons = {
            'cash': 'fa-money-bill',
            'bank_transfer': 'fa-university',
            'credit_card': 'fa-credit-card',
            'debit_card': 'fa-credit-card',
            'upi': 'fa-mobile-alt',
            'cheque': 'fa-file-invoice',
            'other': 'fa-question'
        };
        return icons[method] || 'fa-question';
    }

    getPaymentMethodText(method) {
        const methods = {
            'cash': 'Cash',
            'bank_transfer': 'Bank Transfer',
            'credit_card': 'Credit Card',
            'debit_card': 'Debit Card',
            'upi': 'UPI',
            'cheque': 'Cheque',
            'other': 'Other'
        };
        return methods[method] || method;
    }

    getStatusText(status) {
        const statuses = {
            'completed': 'Completed',
            'pending': 'Pending',
            'failed': 'Failed'
        };
        return statuses[status] || status;
    }

    updateFinancialStats() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const netProfit = totalIncome - totalExpenses;
        const cashFlow = netProfit; // Simplified cash flow calculation

        document.getElementById('total-income').textContent = `₹${totalIncome.toLocaleString()}`;
        document.getElementById('total-expenses').textContent = `₹${totalExpenses.toLocaleString()}`;
        document.getElementById('net-profit').textContent = `₹${netProfit.toLocaleString()}`;
        document.getElementById('cash-flow').textContent = `₹${cashFlow.toLocaleString()}`;

        // Update period summaries
        this.updatePeriodSummaries();
    }

    updatePeriodSummaries() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentQuarter = Math.floor(currentMonth / 3);

        // Monthly summary
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear;
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyProfit = monthlyIncome - monthlyExpenses;

        document.getElementById('monthly-income').textContent = `₹${monthlyIncome.toLocaleString()}`;
        document.getElementById('monthly-expenses').textContent = `₹${monthlyExpenses.toLocaleString()}`;
        document.getElementById('monthly-profit').textContent = `₹${monthlyProfit.toLocaleString()}`;

        // Quarterly summary
        const quarterlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const transactionQuarter = Math.floor(transactionDate.getMonth() / 3);
            return transactionQuarter === currentQuarter &&
                transactionDate.getFullYear() === currentYear;
        });

        const quarterlyIncome = quarterlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const quarterlyExpenses = quarterlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const quarterlyProfit = quarterlyIncome - quarterlyExpenses;

        document.getElementById('quarterly-income').textContent = `₹${quarterlyIncome.toLocaleString()}`;
        document.getElementById('quarterly-expenses').textContent = `₹${quarterlyExpenses.toLocaleString()}`;
        document.getElementById('quarterly-profit').textContent = `₹${quarterlyProfit.toLocaleString()}`;

        // Yearly summary
        const yearlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === currentYear;
        });

        const yearlyIncome = yearlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const yearlyExpenses = yearlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const yearlyProfit = yearlyIncome - yearlyExpenses;

        document.getElementById('yearly-income').textContent = `₹${yearlyIncome.toLocaleString()}`;
        document.getElementById('yearly-expenses').textContent = `₹${yearlyExpenses.toLocaleString()}`;
        document.getElementById('yearly-profit').textContent = `₹${yearlyProfit.toLocaleString()}`;
    }

    showTransactionModal(transaction = null) {
        const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
        const title = document.getElementById('transaction-modal-title');

        if (transaction) {
            title.textContent = 'Edit Transaction';
            this.populateTransactionForm(transaction);
        } else {
            title.textContent = 'Add Transaction';
            this.clearTransactionForm();
        }

        modal.show();
    }

    populateTransactionForm(transaction) {
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-type').value = transaction.type;
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-category').value = transaction.category;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('payment-method').value = transaction.paymentMethod;
        document.getElementById('transaction-reference').value = transaction.reference || '';
        document.getElementById('transaction-notes').value = transaction.notes || '';
    }

    clearTransactionForm() {
        document.getElementById('transaction-form').reset();
        // Set default date to today
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    }

    saveTransaction() {
        const form = document.getElementById('transaction-form');

        const transactionData = {
            date: document.getElementById('transaction-date').value,
            type: document.getElementById('transaction-type').value,
            description: document.getElementById('transaction-description').value,
            category: document.getElementById('transaction-category').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            paymentMethod: document.getElementById('payment-method').value,
            reference: document.getElementById('transaction-reference').value,
            notes: document.getElementById('transaction-notes').value,
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        // Validate required fields
        if (!transactionData.date || !transactionData.type || !transactionData.description ||
            !transactionData.category || isNaN(transactionData.amount) || !transactionData.paymentMethod) {
            alert('Please fill in all required fields');
            return;
        }

        if (document.getElementById('transaction-modal-title').textContent.includes('Edit')) {
            // Update existing transaction
            const transactionId = this.currentEditingTransactionId;
            const index = this.transactions.findIndex(t => t.id === transactionId);
            if (index !== -1) {
                transactionData.id = transactionId;
                this.transactions[index] = transactionData;
            }
        } else {
            // Add new transaction
            transactionData.id = Date.now();
            this.transactions.push(transactionData);
        }

        this.saveTransactions();
        this.renderTransactions();
        this.updateFinancialStats();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('transactionModal'));
        modal.hide();

        this.showNotification('Transaction saved successfully!', 'success');
    }

    filterTransactions() {
        const searchTerm = document.getElementById('transaction-search').value.toLowerCase();
        const typeFilter = document.getElementById('transaction-type-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        const dateRangeFilter = document.getElementById('date-range-filter').value;

        let filteredTransactions = this.transactions.filter(transaction => {
            const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
                transaction.notes.toLowerCase().includes(searchTerm) ||
                transaction.amount.toString().includes(searchTerm);

            const matchesType = !typeFilter || transaction.type === typeFilter;
            const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
            const matchesDateRange = this.matchesDateRange(transaction.date, dateRangeFilter);

            return matchesSearch && matchesType && matchesCategory && matchesDateRange;
        });

        this.renderFilteredTransactions(filteredTransactions);
    }

    matchesDateRange(transactionDate, dateRange) {
        if (!dateRange) return true;

        const date = new Date(transactionDate);
        const now = new Date();

        switch (dateRange) {
            case 'today':
                return date.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= weekAgo;
            case 'month':
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            case 'quarter':
                const currentQuarter = Math.floor(now.getMonth() / 3);
                const transactionQuarter = Math.floor(date.getMonth() / 3);
                return transactionQuarter === currentQuarter && date.getFullYear() === now.getFullYear();
            case 'year':
                return date.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    }

    renderFilteredTransactions(filteredTransactions) {
        const tbody = document.getElementById('financial-tbody');
        tbody.innerHTML = '';

        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="transaction-checkbox" data-id="${transaction.id}">
                </td>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>
                    <div class="fw-bold">${transaction.description}</div>
                    ${transaction.notes ? `<small class="text-muted">${transaction.notes}</small>` : ''}
                </td>
                <td>
                    <span class="transaction-type ${transaction.type}">${this.getTransactionTypeText(transaction.type)}</span>
                </td>
                <td>
                    <span class="badge bg-secondary">${this.getCategoryText(transaction.category)}</span>
                </td>
                <td>
                    <span class="${this.getAmountClass(transaction.type)}">
                        ${transaction.type === 'expense' ? '-' : '+'}₹${transaction.amount.toFixed(2)}
                    </span>
                </td>
                <td>
                    <span class="payment-method">
                        <i class="fas ${this.getPaymentMethodIcon(transaction.paymentMethod)}"></i>
                        ${this.getPaymentMethodText(transaction.paymentMethod)}
                    </span>
                </td>
                <td>${transaction.reference || 'N/A'}</td>
                <td>
                    <span class="transaction-status ${transaction.status}">${this.getStatusText(transaction.status)}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-view-transaction" onclick="dealerDashboard.viewTransaction(${transaction.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-edit-transaction" onclick="dealerDashboard.editTransaction(${transaction.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete-transaction" onclick="dealerDashboard.deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for checkboxes
        document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTransactionSelection(e.target.dataset.id, e.target.checked);
            });
        });
    }

    applyFinancialFilters() {
        this.filterTransactions();
    }

    clearFinancialFilters() {
        document.getElementById('transaction-search').value = '';
        document.getElementById('transaction-type-filter').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('date-range-filter').value = '';
        this.renderTransactions();
    }

    toggleSelectAllTransactions(checked) {
        document.querySelectorAll('.transaction-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
            this.toggleTransactionSelection(checkbox.dataset.id, checked);
        });
    }

    toggleTransactionSelection(transactionId, selected) {
        if (selected) {
            this.selectedTransactions.add(transactionId);
        } else {
            this.selectedTransactions.delete(transactionId);
        }

        this.updateBulkFinancialActionsVisibility();
    }

    updateBulkFinancialActionsVisibility() {
        const bulkActions = document.getElementById('bulk-financial-actions');
        const selectedCount = document.getElementById('selected-transactions-count');

        if (this.selectedTransactions.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = this.selectedTransactions.size;
        } else {
            bulkActions.style.display = 'none';
        }
    }

    viewTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id == transactionId);
        if (!transaction) return;

        const modal = new bootstrap.Modal(document.getElementById('transactionDetailsModal'));
        const content = document.getElementById('transaction-details-content');

        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Date</label>
                        <p>${new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Type</label>
                        <p><span class="transaction-type ${transaction.type}">${this.getTransactionTypeText(transaction.type)}</span></p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Category</label>
                        <p><span class="badge bg-secondary">${this.getCategoryText(transaction.category)}</span></p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Amount</label>
                        <p class="${this.getAmountClass(transaction.type)} fs-4">
                            ${transaction.type === 'expense' ? '-' : '+'}₹${transaction.amount.toFixed(2)}
                        </p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Payment Method</label>
                        <p>
                            <span class="payment-method">
                                <i class="fas ${this.getPaymentMethodIcon(transaction.paymentMethod)}"></i>
                                ${this.getPaymentMethodText(transaction.paymentMethod)}
                            </span>
                        </p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Reference</label>
                        <p>${transaction.reference || 'N/A'}</p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Status</label>
                        <p><span class="transaction-status ${transaction.status}">${this.getStatusText(transaction.status)}</span></p>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Created</label>
                        <p>${new Date(transaction.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Description</label>
                        <p>${transaction.description}</p>
                    </div>
                    ${transaction.notes ? `
                        <div class="mb-3">
                            <label class="form-label fw-bold">Notes</label>
                            <p>${transaction.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        modal.show();
    }

    editTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id == transactionId);
        if (!transaction) return;

        this.currentEditingTransactionId = transactionId;
        this.showTransactionModal(transaction);
    }

    deleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id != transactionId);
            this.saveTransactions();
            this.renderTransactions();
            this.updateFinancialStats();
            this.showNotification('Transaction deleted successfully!', 'success');
        }
    }

    bulkExportSelected() {
        if (this.selectedTransactions.size === 0) {
            alert('Please select transactions to export');
            return;
        }

        const selectedTransactions = this.transactions.filter(t =>
            this.selectedTransactions.has(t.id.toString())
        );

        this.exportFinancialData(selectedTransactions);
    }

    exportFinancials() {
        this.exportFinancialData(this.transactions);
    }

    exportFinancialData(transactions) {
        const csvContent = this.generateFinancialCSV(transactions);
        const blob = new Blob([csvContent], {
            type: 'text/csv'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    generateFinancialCSV(transactions) {
        const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Payment Method', 'Reference', 'Status', 'Notes'];
        const rows = transactions.map(transaction => [
            transaction.date,
            transaction.description,
            this.getTransactionTypeText(transaction.type),
            this.getCategoryText(transaction.category),
            transaction.amount,
            this.getPaymentMethodText(transaction.paymentMethod),
            transaction.reference || '',
            this.getStatusText(transaction.status),
            transaction.notes || ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    showImportModal() {
        const modal = new bootstrap.Modal(document.getElementById('importExcelModal'));
        modal.show();
    }

    processExcelImport() {
        const fileInput = document.getElementById('excel-file');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file to import');
            return;
        }

        // In a real application, you would use a library like SheetJS to parse Excel files
        // For now, we'll show a success message
        this.showNotification('Excel import functionality would be implemented with SheetJS library', 'info');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('importExcelModal'));
        modal.hide();
    }

    showBulkCategorizeModal() {
        if (this.selectedTransactions.size === 0) {
            alert('Please select transactions to categorize');
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('bulkCategorizeModal'));
        modal.show();
    }

    confirmBulkCategorize() {
        const newCategory = document.getElementById('bulk-category').value;

        if (!newCategory) {
            alert('Please select a category');
            return;
        }

        this.selectedTransactions.forEach(transactionId => {
            const transaction = this.transactions.find(t => t.id == transactionId);
            if (transaction) {
                transaction.category = newCategory;
            }
        });

        this.saveTransactions();
        this.renderTransactions();
        this.updateFinancialStats();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkCategorizeModal'));
        modal.hide();

        this.showNotification('Categories updated successfully!', 'success');
    }

    bulkDeleteTransactions() {
        if (this.selectedTransactions.size === 0) {
            alert('Please select transactions to delete');
            return;
        }

        if (confirm(`Are you sure you want to delete ${this.selectedTransactions.size} selected transactions?`)) {
            this.transactions = this.transactions.filter(t =>
                !this.selectedTransactions.has(t.id.toString())
            );

            this.selectedTransactions.clear();
            this.saveTransactions();
            this.renderTransactions();
            this.updateFinancialStats();
            this.showNotification('Selected transactions deleted successfully!', 'success');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.dealerDashboard = new DealerDashboard();
    } catch (error) {
        console.error('Error initializing DealerDashboard:', error);
        // Show error message to user
        const mainContent = document.querySelector('.dealer-main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-state">
                    <div style="text-align: center; padding: 3rem; color: #666;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                        <h3 style="color: #333; margin-bottom: 1rem;">Error Loading Dashboard</h3>
                        <p style="margin-bottom: 2rem;">There was an error loading the dealer dashboard. Please try refreshing.</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-refresh me-2"></i>Refresh Page
                        </button>
                    </div>
                </div>
            `;
        }
    }
});

// Global error handler for dealer dashboard
window.addEventListener('error', (event) => {
    console.error('Dealer dashboard error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in dealer dashboard:', event.reason);
});