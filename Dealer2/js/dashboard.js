// Dashboard Page Management
class DashboardPage {
    constructor() {
        this.orders = [];
        this.products = [];
        this.customers = [];
        this.socket = null;
        this.init();
    }

    init() {
        // Initialize Socket.IO for real-time updates
        this.initSocketIO();
        // Auto-refresh every 30 seconds
        setInterval(() => {
            if (document.getElementById('dashboard') && 
                !document.getElementById('dashboard').classList.contains('hidden')) {
                this.loadDashboardData();
            }
        }, 30000);
    }

    initSocketIO() {
        try {
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            
            if (typeof io !== 'undefined') {
                this.socket = io(API_BASE_URL);
                
                this.socket.on('newOrder', (order) => {
                    console.log('📦 New order received:', order);
                    this.loadDashboardData();
                });

                this.socket.on('orderUpdated', (order) => {
                    console.log('🔄 Order updated:', order);
                    this.loadDashboardData();
                });

                this.socket.on('productAdded', (product) => {
                    console.log('➕ Product added:', product);
                    this.loadDashboardData();
                });

                this.socket.on('productUpdated', (product) => {
                    console.log('🔄 Product updated:', product);
                    this.loadDashboardData();
                });

                console.log('✅ Socket.IO connected for real-time dashboard updates');
            }
        } catch (error) {
            console.error('Error initializing Socket.IO:', error);
        }
    }

    async loadDashboardData() {
        try {
            // Load all data in parallel
            const [ordersData, productsData, customersData, analyticsData] = await Promise.all([
                ordersAPI.getAll().catch(() => ({ data: { orders: [] } })),
                productsAPI.getAll().catch(() => ({ data: { products: [] } })),
                customersAPI.getAll().catch(() => ({ data: { customers: [] } })),
                analyticsAPI.getSales().catch(() => ({ data: {} }))
            ]);

            this.orders = ordersData.data?.orders || ordersData.orders || [];
            this.products = productsData.data?.products || productsData.products || [];
            this.customers = customersData.data?.customers || customersData.customers || [];

            // Analyze and update all dashboard sections
            this.updateStats(this.orders, this.products);
            this.renderRecentOrders(this.orders);
            this.analyzeActivity(this.orders, this.products);
            this.renderActivityFeed(this.orders, this.products);
            this.renderPerformanceMetrics(this.orders, this.products);
            this.renderTopProducts(this.orders, this.products);
            this.renderOrderTrends(this.orders);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateStats(orders, products) {
        // Filter approved orders (confirmed, processing, shipped, delivered)
        const approvedOrders = orders.filter(order => {
            const status = order.status || 'pending';
            return status === 'confirmed' || status === 'processing' || 
                   status === 'shipped' || status === 'delivered';
        });

        const totalOrders = approvedOrders.length; // Show only approved orders
        const totalRevenue = approvedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.isActive !== false).length;
        const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
        const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

        // Calculate growth (comparing last 7 days vs previous 7 days) - using approved orders only
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const recentOrders = approvedOrders.filter(o => new Date(o.createdAt || o.date || 0) >= lastWeek);
        const previousOrders = approvedOrders.filter(o => {
            const date = new Date(o.createdAt || o.date || 0);
            return date >= twoWeeksAgo && date < lastWeek;
        });

        const orderGrowth = previousOrders.length > 0 
            ? ((recentOrders.length - previousOrders.length) / previousOrders.length * 100).toFixed(1)
            : recentOrders.length > 0 ? '100' : '0';

        const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const revenueGrowth = previousRevenue > 0 
            ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
            : recentRevenue > 0 ? '100' : '0';

        // Update stat cards
        const totalOrdersEl = document.getElementById('total-orders-stat');
        const totalRevenueEl = document.getElementById('total-revenue-stat');
        const pendingOrdersEl = document.getElementById('pending-orders-stat');
        const totalProductsEl = document.getElementById('total-products-stat');
        const orderGrowthEl = document.getElementById('order-growth');
        const revenueGrowthEl = document.getElementById('revenue-growth');

        if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalRevenue.toFixed(2)}`;
        if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
        if (totalProductsEl) totalProductsEl.textContent = `${activeProducts}/${totalProducts}`;
        
        if (orderGrowthEl) {
            orderGrowthEl.textContent = `${orderGrowth >= 0 ? '+' : ''}${orderGrowth}% from last week`;
            orderGrowthEl.className = `stat-change ${orderGrowth >= 0 ? 'positive' : 'negative'}`;
        }
        if (revenueGrowthEl) {
            revenueGrowthEl.textContent = `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% from last week`;
            revenueGrowthEl.className = `stat-change ${revenueGrowth >= 0 ? 'positive' : 'negative'}`;
        }
    }

    analyzeActivity(orders, products) {
        const container = document.getElementById('activity-analysis');
        if (!container) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Today's activity
        const todayOrders = orders.filter(o => {
            const date = new Date(o.createdAt || o.date || 0);
            return date >= today;
        });
        const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // This week's activity
        const weekOrders = orders.filter(o => {
            const date = new Date(o.createdAt || o.date || 0);
            return date >= thisWeek;
        });
        const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // This month's activity
        const monthOrders = orders.filter(o => {
            const date = new Date(o.createdAt || o.date || 0);
            return date >= thisMonth;
        });
        const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // Status breakdown
        const statusBreakdown = {
            pending: orders.filter(o => o.status === 'pending').length,
            confirmed: orders.filter(o => o.status === 'confirmed').length,
            processing: orders.filter(o => o.status === 'processing').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length
        };

        // Product activity
        const lowStockProducts = products.filter(p => 
            p.stock?.quantity < (p.stock?.lowStockThreshold || 10)
        ).length;

        const inactiveProducts = products.filter(p => p.isActive === false).length;

        container.innerHTML = `
            <div class="activity-summary-grid">
                <div class="activity-card">
                    <h4><i class="fas fa-calendar-day"></i> Today</h4>
                    <div class="activity-stats">
                        <div><strong>${todayOrders.length}</strong> orders</div>
                        <div>₹${todayRevenue.toFixed(2)} revenue</div>
                    </div>
                </div>
                <div class="activity-card">
                    <h4><i class="fas fa-calendar-week"></i> This Week</h4>
                    <div class="activity-stats">
                        <div><strong>${weekOrders.length}</strong> orders</div>
                        <div>₹${weekRevenue.toFixed(2)} revenue</div>
                    </div>
                </div>
                <div class="activity-card">
                    <h4><i class="fas fa-calendar-alt"></i> This Month</h4>
                    <div class="activity-stats">
                        <div><strong>${monthOrders.length}</strong> orders</div>
                        <div>₹${monthRevenue.toFixed(2)} revenue</div>
                    </div>
                </div>
                <div class="activity-card">
                    <h4><i class="fas fa-chart-pie"></i> Order Status</h4>
                    <div class="activity-stats">
                        <div>Pending: <strong>${statusBreakdown.pending}</strong></div>
                        <div>Delivered: <strong>${statusBreakdown.delivered}</strong></div>
                        <div>Cancelled: <strong>${statusBreakdown.cancelled}</strong></div>
                    </div>
                </div>
                <div class="activity-card">
                    <h4><i class="fas fa-box"></i> Products</h4>
                    <div class="activity-stats">
                        <div>Low Stock: <strong class="text-warning">${lowStockProducts}</strong></div>
                        <div>Inactive: <strong>${inactiveProducts}</strong></div>
                        <div>Active: <strong class="text-success">${products.length - inactiveProducts}</strong></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderActivityFeed(orders, products) {
        const container = document.getElementById('activity-feed');
        if (!container) return;

        // Combine all activities
        const activities = [];

        // Recent orders
        orders.slice(0, 10).forEach(order => {
            const date = new Date(order.createdAt || order.date || Date.now());
            activities.push({
                type: 'order',
                icon: 'shopping-bag',
                color: 'primary',
                title: `New order #${order._id.toString().slice(-8)}`,
                description: `Customer: ${order.customerId?.name || order.shippingAddress?.name || 'Guest'} - ₹${(order.total || 0).toFixed(2)}`,
                status: order.status,
                date: date
            });
        });

        // Recent product updates (if available)
        products.slice(0, 5).forEach(product => {
            const date = new Date(product.updatedAt || product.createdAt || Date.now());
            activities.push({
                type: 'product',
                icon: 'box',
                color: 'success',
                title: `Product: ${product.name}`,
                description: `Price: ₹${(product.price || 0).toFixed(2)} - Stock: ${product.stock?.quantity || 0}`,
                date: date
            });
        });

        // Sort by date (newest first)
        activities.sort((a, b) => b.date - a.date);

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No Recent Activity</h3>
                    <p>Activity will appear here as orders and products are updated.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.slice(0, 15).map(activity => {
            const timeAgo = this.getTimeAgo(activity.date);
            const statusClass = this.getStatusClass(activity.status || '');

            return `
                <div class="activity-item">
                    <div class="activity-icon ${activity.color}">
                        <i class="fas fa-${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        ${activity.status ? `<span class="badge ${statusClass}">${activity.status}</span>` : ''}
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPerformanceMetrics(orders, products) {
        const container = document.getElementById('performance-metrics');
        if (!container) return;

        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        const conversionRate = orders.length > 0 ? ((orders.filter(o => o.status !== 'cancelled').length / orders.length) * 100).toFixed(1) : 0;
        const avgDeliveryTime = this.calculateAvgDeliveryTime(orders);

        container.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon success">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-label">Average Order Value</div>
                        <div class="metric-value">₹${avgOrderValue.toFixed(2)}</div>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon primary">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-label">Conversion Rate</div>
                        <div class="metric-value">${conversionRate}%</div>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon warning">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-label">Avg Delivery Time</div>
                        <div class="metric-value">${avgDeliveryTime} days</div>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon info">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metric-content">
                        <div class="metric-label">Total Customers</div>
                        <div class="metric-value">${new Set(orders.map(o => o.customerId || 'guest')).size}</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTopProducts(orders, products) {
        const container = document.getElementById('top-products');
        if (!container) return;

        // Calculate product sales
        const productSales = {};
        orders.forEach(order => {
            (order.items || []).forEach(item => {
                const productId = item.productId?._id || item.productId;
                if (productId) {
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            name: item.name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[productId].quantity += item.quantity || 0;
                    productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
                }
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        if (topProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box"></i>
                    <h3>No Product Sales Yet</h3>
                    <p>Top selling products will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = topProducts.map((product, index) => `
            <div class="top-product-item">
                <div class="product-rank">#${index + 1}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-stats">
                        <span><i class="fas fa-shopping-cart"></i> ${product.quantity} sold</span>
                        <span><i class="fas fa-rupee-sign"></i> ₹${product.revenue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderOrderTrends(orders) {
        const container = document.getElementById('order-trends');
        if (!container) return;

        // Group orders by day for last 7 days
        const now = new Date();
        const trends = {};
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            trends[dateKey] = {
                orders: 0,
                revenue: 0
            };
        }

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt || order.date || Date.now());
            const dateKey = orderDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            if (trends[dateKey]) {
                trends[dateKey].orders++;
                trends[dateKey].revenue += order.total || 0;
            }
        });

        const maxOrders = Math.max(...Object.values(trends).map(t => t.orders), 1);

        container.innerHTML = Object.entries(trends).map(([date, data]) => {
            const height = (data.orders / maxOrders) * 100;
            return `
                <div class="trend-item">
                    <div class="trend-bar-container">
                        <div class="trend-bar" style="height: ${height}%"></div>
                    </div>
                    <div class="trend-label">${date}</div>
                    <div class="trend-value">${data.orders}</div>
                </div>
            `;
        }).join('');
    }

    calculateAvgDeliveryTime(orders) {
        const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.createdAt && o.updatedAt);
        if (deliveredOrders.length === 0) return 'N/A';

        const totalDays = deliveredOrders.reduce((sum, order) => {
            const created = new Date(order.createdAt);
            const updated = new Date(order.updatedAt);
            const days = (updated - created) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);

        return (totalDays / deliveredOrders.length).toFixed(1);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    renderRecentOrders(orders) {
        const container = document.getElementById('recent-orders-body');
        if (!container) return;

        const recentOrders = orders.slice(0, 5).sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });

        if (recentOrders.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>No Recent Orders</h3>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = recentOrders.map(order => {
            const customerName = order.customerId?.name || order.shippingAddress?.name || 'Guest';
            const statusClass = this.getStatusClass(order.status);

            return `
                <tr>
                    <td><strong>#${order._id.toString().slice(-8)}</strong></td>
                    <td>${customerName}</td>
                    <td>₹${(order.total || 0).toFixed(2)}</td>
                    <td><span class="badge ${statusClass}">${order.status || 'pending'}</span></td>
                </tr>
            `;
        }).join('');
    }

    getStatusClass(status) {
        const statusMap = {
            'pending': 'badge-warning',
            'confirmed': 'badge-success',
            'processing': 'badge-info',
            'shipped': 'badge-info',
            'delivered': 'badge-success',
            'cancelled': 'badge-danger'
        };
        return statusMap[status] || 'badge-info';
    }
}

// Initialize dashboard page
window.dashboardPage = new DashboardPage();