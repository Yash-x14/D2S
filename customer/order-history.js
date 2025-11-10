// Order History page (order-history.html) specific functionality

// Order action functions (must be global for onclick handlers)
function reorderItems(orderId) {
    const orderData = getOrderData(orderId);
    if (!orderData) {
        showToast('Order not found!', 'error');
        return;
    }

    let addedCount = 0;
    orderData.items.forEach(item => {
        if (addToCart(item.name, `Rs. ${item.price}`, item.image, item.weight)) {
            addedCount++;
        }
    });

    if (addedCount > 0) {
        showToast(`Added ${addedCount} items from ${orderId} to your cart!`, 'success');
        updateCartCount();
    } else {
        showToast('Failed to add items to cart', 'error');
    }
}

function trackOrder(orderId) {
    const trackingModal = createTrackingModal(orderId);
    document.body.appendChild(trackingModal);
    setTimeout(() => {
        trackingModal.classList.add('show');
    }, 10);
}

function cancelOrder(orderId) {
    if (confirm(`Are you sure you want to cancel order ${orderId}?`)) {
        updateOrderStatus(orderId, 'cancelled');

        const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderElement) {
            const statusElement = orderElement.querySelector('.order-status');
            statusElement.className = 'order-status cancelled';
            statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Cancelled';

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
    const orderData = getOrderData(orderId);
    if (!orderData) {
        showToast('Order not found!', 'error');
        return;
    }

    const detailsModal = createOrderDetailsModal(orderData);
    document.body.appendChild(detailsModal);

    setTimeout(() => {
        detailsModal.classList.add('show');
    }, 10);
}

function closeModal(button) {
    const modal = button.closest('.modal-overlay');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.remove();
    }, 300);
}

function loadMoreOrders() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (!loadMoreBtn) return;

    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    loadMoreBtn.disabled = true;

    setTimeout(() => {
        addMockOrders();
        loadMoreBtn.innerHTML = originalText;
        loadMoreBtn.disabled = false;
        showToast('More orders loaded successfully!', 'success');
    }, 1500);
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
                            <span>${orderData.payment?.method || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="order-items-section">
                        <h4>Order Items</h4>
                        ${orderData.items.map(item => `
                            <div class="order-item-detail">
                                <img src="${item.image}" alt="${item.name}" class="item-image">
                                <div class="item-info">
                                    <h5>${item.name}</h5>
                                    <p>Weight: ${item.weight || 'N/A'}</p>
                                    <p>Price: Rs. ${item.price}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-summary-section">
                        <h4>Order Summary</h4>
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>Rs. ${(orderData.totals?.subtotal || orderData.total * 0.9).toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Delivery:</span>
                            <span>Rs. ${(orderData.totals?.shipping || 30).toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Tax:</span>
                            <span>Rs. ${(orderData.totals?.tax || orderData.total * 0.1).toFixed(2)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span>Rs. ${orderData.totals?.total || orderData.total}</span>
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
                                <p class="product-quantity">Weight: ${item.weight || 'N/A'}</p>
                                <p class="product-price">Rs. ${item.price}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="order-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>Rs. ${(orderData.totals?.subtotal || orderData.total * 0.9).toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery Charges:</span>
                    <span>Rs. 30.00</span>
                </div>
                <div class="summary-row">
                    <span>Tax (GST):</span>
                    <span>Rs. ${(orderData.totals?.tax || orderData.total * 0.1).toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total Amount:</span>
                    <span>Rs. ${orderData.totals?.total || orderData.total}</span>
                </div>
                <div class="payment-info">
                    <p><i class="fas fa-credit-card"></i> Payment Mode: ${orderData.payment?.method || 'Credit Card'}</p>
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

function addMockOrders() {
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

// Order History Page Functions
function initializeOrderHistoryPage() {
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

                if (statusValue !== 'all' && orderStatus !== statusValue) {
                    showOrder = false;
                }

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

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.order-history-section')) {
        initializeOrderHistoryPage();
    }
});