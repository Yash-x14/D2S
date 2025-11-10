// Analytics Page Management - Connected to Bookkeeping
class AnalyticsPage {
    constructor() {
        this.charts = {};
        this.bookkeepingData = [];
        this.products = [];
        this.currentPeriod = 'monthly';
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Period selection
        const periodSelect = document.getElementById('analytics-period-select');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.loadAnalytics();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-analytics-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalytics();
            });
        }
    }

    async loadAnalytics() {
        try {
            // Load bookkeeping data (orders)
            const ordersData = await ordersAPI.getAll();
            const orders = ordersData.data?.orders || ordersData.orders || [];
            
            // Load products for stock margin calculation
            const productsData = await productsAPI.getAll();
            this.products = productsData.data?.products || productsData.products || [];

            // Convert orders to bookkeeping format
            this.bookkeepingData = orders.map(order => ({
                id: order._id,
                date: new Date(order.createdAt),
                description: `Order #${order._id.toString().slice(-8)}`,
                type: 'income',
                category: 'sales',
                amount: order.total || 0,
                status: order.status,
                orderData: order,
                items: order.items || []
            }));

            // Process and display analytics
            this.processAnalyticsData();
            this.updateMetricsCards();
            this.initAllCharts();
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics data');
        }
    }

    processAnalyticsData() {
        // Filter data based on current period
        const filteredData = this.filterDataByPeriod(this.bookkeepingData, this.currentPeriod);
        this.filteredData = filteredData;
    }

    filterDataByPeriod(data, period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'weekly':
                const dayOfWeek = now.getDay();
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return data.filter(item => item.date >= startDate);
    }

    getRevenueDataByPeriod(period) {
        const data = this.filterDataByPeriod(this.bookkeepingData, period);
        const grouped = this.groupDataByPeriod(data, period);

        return Object.keys(grouped).sort().map(key => ({
            label: key,
            revenue: grouped[key].reduce((sum, item) => sum + item.amount, 0)
        }));
    }

    groupDataByPeriod(data, period) {
        const grouped = {};

        data.forEach(item => {
            let key;
            const date = new Date(item.date);

            switch (period) {
                case 'daily':
                    key = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = `Week ${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
                    break;
                case 'monthly':
                    key = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
                    break;
                case 'yearly':
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = date.toLocaleDateString('en-GB');
            }

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
        });

        return grouped;
    }

    getProductRevenueData() {
        const productRevenue = {};
        
        this.filteredData.forEach(transaction => {
            if (transaction.items && transaction.items.length > 0) {
                transaction.items.forEach(item => {
                    const productName = item.name || item.productId?.name || 'Unknown';
                    const revenue = (item.quantity || 0) * (item.price || 0);
                    
                    if (!productRevenue[productName]) {
                        productRevenue[productName] = 0;
                    }
                    productRevenue[productName] += revenue;
                });
            }
        });

        return Object.entries(productRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, revenue]) => ({ name, revenue }));
    }

    calculateStockMargin() {
        // Calculate stock margin: (Revenue - Cost) / Revenue * 100
        let totalRevenue = 0;
        let totalCost = 0;

        this.filteredData.forEach(transaction => {
            totalRevenue += transaction.amount || 0;
            
            // Estimate cost (assuming 60% cost, 40% margin for simplicity)
            // In real scenario, you'd use actual product costs
            totalCost += (transaction.amount || 0) * 0.6;
        });

        const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
        return { margin, revenue: totalRevenue, cost: totalCost };
    }

    getProfitLossData() {
        const grouped = this.groupDataByPeriod(this.filteredData, this.currentPeriod);
        const profitLossData = [];

        Object.keys(grouped).sort().forEach(key => {
            const items = grouped[key];
            const revenue = items.reduce((sum, item) => sum + (item.amount || 0), 0);
            const cost = revenue * 0.6; // Estimated cost
            const profit = revenue - cost;
            const loss = profit < 0 ? Math.abs(profit) : 0;

            profitLossData.push({
                label: key,
                revenue,
                profit: profit > 0 ? profit : 0,
                loss: profit < 0 ? loss : 0
            });
        });

        return profitLossData;
    }

    getStockMarginProgress() {
        const grouped = this.groupDataByPeriod(this.filteredData, this.currentPeriod);
        const marginData = [];

        Object.keys(grouped).sort().forEach(key => {
            const items = grouped[key];
            const revenue = items.reduce((sum, item) => sum + (item.amount || 0), 0);
            const cost = revenue * 0.6;
            const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

            marginData.push({
                label: key,
                margin: Math.max(0, margin)
            });
        });

        return marginData;
    }

    getDailyProgressData() {
        // Get last 30 days of data
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentData = this.bookkeepingData.filter(item => item.date >= thirtyDaysAgo);

        const dailyData = {};
        recentData.forEach(item => {
            const dateKey = item.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { revenue: 0, profit: 0, margin: 0 };
            }
            dailyData[dateKey].revenue += item.amount || 0;
        });

        // Calculate profit and margin for each day
        Object.keys(dailyData).forEach(key => {
            const revenue = dailyData[key].revenue;
            const cost = revenue * 0.6;
            dailyData[key].profit = revenue - cost;
            dailyData[key].margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
        });

        return Object.keys(dailyData).sort().map(key => ({
            label: key,
            ...dailyData[key]
        }));
    }

    updateMetricsCards() {
        const revenue = this.filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
        const { margin, cost } = this.calculateStockMargin();
        const profit = revenue - cost;
        const losses = profit < 0 ? Math.abs(profit) : 0;

        // Update revenue
        const revenueEl = document.getElementById('total-revenue-stat');
        if (revenueEl) revenueEl.textContent = `₹${revenue.toFixed(2)}`;

        // Update profit
        const profitEl = document.getElementById('net-profit-stat');
        if (profitEl) {
            profitEl.textContent = `₹${Math.max(0, profit).toFixed(2)}`;
            profitEl.style.color = profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        }

        // Update stock margin
        const marginEl = document.getElementById('stock-margin-stat');
        if (marginEl) marginEl.textContent = `${margin.toFixed(2)}%`;

        // Update losses
        const lossesEl = document.getElementById('total-losses-stat');
        if (lossesEl) lossesEl.textContent = `₹${losses.toFixed(2)}`;
    }

    initAllCharts() {
        this.initProductRevenueChart();
        this.initRevenueChart();
        this.initProfitLossChart();
        this.initStockMarginChart();
        this.initDailyProgressChart();
        this.initProductsChart();
    }

    initProductRevenueChart() {
        const ctx = document.getElementById('product-revenue-chart');
        if (!ctx) return;

        if (this.charts.productRevenue) {
            this.charts.productRevenue.destroy();
        }

        const revenueData = this.getRevenueDataByPeriod(this.currentPeriod);
        const labels = revenueData.map(d => d.label);
        const data = revenueData.map(d => d.revenue);

        this.charts.productRevenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Product Revenue',
                    data: data,
                    backgroundColor: 'rgba(104, 117, 245, 0.2)',
                    borderColor: '#6875F5',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Revenue: ₹${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initRevenueChart() {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        const revenueData = this.getRevenueDataByPeriod(this.currentPeriod);
        const labels = revenueData.map(d => d.label);
        const data = revenueData.map(d => d.revenue);

        this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: data,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Revenue: ₹${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initProfitLossChart() {
        const ctx = document.getElementById('profit-loss-chart');
        if (!ctx) return;

        if (this.charts.profitLoss) {
            this.charts.profitLoss.destroy();
        }

        const profitLossData = this.getProfitLossData();
        const labels = profitLossData.map(d => d.label);
        const profits = profitLossData.map(d => d.profit);
        const losses = profitLossData.map(d => d.loss);

        this.charts.profitLoss = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Profit',
                        data: profits,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: '#10b981',
                        borderWidth: 2
                    },
                    {
                        label: 'Loss',
                        data: losses,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: '#ef4444',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initStockMarginChart() {
        const ctx = document.getElementById('stock-margin-chart');
        if (!ctx) return;

        if (this.charts.stockMargin) {
            this.charts.stockMargin.destroy();
        }

        const marginData = this.getStockMarginProgress();
        const labels = marginData.map(d => d.label);
        const margins = marginData.map(d => d.margin);

        this.charts.stockMargin = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stock Margin %',
                    data: margins,
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderColor: '#f59e0b',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Margin: ${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initDailyProgressChart() {
        const ctx = document.getElementById('daily-progress-chart');
        if (!ctx) return;

        if (this.charts.dailyProgress) {
            this.charts.dailyProgress.destroy();
        }

        const dailyData = this.getDailyProgressData();
        const labels = dailyData.map(d => d.label);
        const revenues = dailyData.map(d => d.revenue);
        const profits = dailyData.map(d => d.profit);
        const margins = dailyData.map(d => d.margin);

        this.charts.dailyProgress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: revenues,
                        backgroundColor: 'rgba(104, 117, 245, 0.2)',
                        borderColor: '#6875F5',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Profit',
                        data: profits,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: '#10b981',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Margin %',
                        data: margins,
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    initProductsChart() {
        const ctx = document.getElementById('products-chart');
        if (!ctx) return;

        if (this.charts.products) {
            this.charts.products.destroy();
        }

        const productData = this.getProductRevenueData();
        const labels = productData.map(p => p.name);
        const revenues = productData.map(p => p.revenue);

        this.charts.products = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenues,
                    backgroundColor: [
                        'rgba(104, 117, 245, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(168, 85, 247, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Revenue: ₹${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    showError(message) {
        console.error(message);
        // You can add toast notification here
    }
}

// Initialize analytics page
window.analyticsPage = new AnalyticsPage();
