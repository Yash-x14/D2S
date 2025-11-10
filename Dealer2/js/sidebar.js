// Sidebar Navigation
class SidebarNavigation {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupMenuListeners();
        this.setupMenuToggle();
        this.loadInitialPage();
    }

    setupMenuListeners() {
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');

                // Handle external links
                if (href && (href.startsWith('/') || href.startsWith('http'))) {
                    window.location.href = href;
                    return;
                }

                // Handle hash-based navigation
                const pageId = href.substring(1);
                this.switchPage(pageId);
            });
        });
    }

    setupMenuToggle() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    }

    switchPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;

            // Update active menu item
            this.updateActiveMenu(pageId);

            // Trigger page-specific initialization
            this.initializePage(pageId);
        } else {
            console.warn(`Page "${pageId}" not found`);
        }
    }

    updateActiveMenu(pageId) {
        document.querySelectorAll('.menu-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${pageId}`) {
                link.classList.add('active');
            }
        });
    }

    initializePage(pageId) {
        // Initialize page-specific functionality
        switch (pageId) {
            case 'products':
                if (window.productsPage) {
                    window.productsPage.loadProducts();
                }
                break;
            case 'orders':
                if (window.ordersPage) {
                    window.ordersPage.loadOrders();
                }
                break;
            case 'order-processing':
                if (window.orderProcessingPage) {
                    window.orderProcessingPage.loadPendingOrders();
                }
                break;
            case 'inventory':
                if (window.inventoryPage) {
                    window.inventoryPage.loadInventory();
                }
                break;
            case 'bookkeeping':
                if (window.bookkeepingPage) {
                    window.bookkeepingPage.loadTransactions();
                }
                break;
            case 'analytics':
                if (window.analyticsPage) {
                    window.analyticsPage.loadAnalytics();
                }
                break;
            case 'customers':
                if (window.customersPage) {
                    window.customersPage.loadCustomers();
                }
                break;
            case 'dashboard':
                if (window.dashboardPage) {
                    window.dashboardPage.loadDashboardData();
                }
                break;
        }
    }

    loadInitialPage() {
        // Load dashboard by default
        this.switchPage('dashboard');
    }
}

// Initialize sidebar navigation
window.sidebarNav = new SidebarNavigation();