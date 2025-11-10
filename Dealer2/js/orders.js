// Orders Page Management
class OrdersPage {
    constructor() {
        this.orders = [];
        this.socket = null;
        this.init();
    }

    init() {
        // Initialize Socket.IO for real-time order updates
        this.initSocketIO();
        // Set up auto-refresh every 30 seconds
        setInterval(() => {
            if (document.getElementById('orders') && 
                !document.getElementById('orders').classList.contains('hidden')) {
                this.loadOrders();
            }
        }, 30000);
    }

    initSocketIO() {
        try {
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            
            // Use Socket.IO client library if available
            if (typeof io !== 'undefined') {
                this.socket = io(API_BASE_URL);
                
                // Listen for order updates
                this.socket.on('orderUpdated', (order) => {
                    console.log('🔄 Order updated via Socket.IO:', order);
                    this.handleOrderUpdate(order);
                });

                console.log('✅ Socket.IO connected for real-time order updates');
            } else {
                console.warn('⚠️ Socket.IO not available, using polling instead');
            }
        } catch (error) {
            console.error('Error initializing Socket.IO:', error);
        }
    }

    handleOrderUpdate(order) {
        // Update order if it's in the current list
        const existingOrderIndex = this.orders.findIndex(o => o._id === order._id);
        if (existingOrderIndex !== -1) {
            this.orders[existingOrderIndex] = order;
        } else {
            this.orders.push(order);
        }
        this.renderOrders();
    }

    async loadOrders() {
        const approvedContainer = document.getElementById('approved-orders-body');
        const rejectedContainer = document.getElementById('rejected-orders-body');
        const completeContainer = document.getElementById('complete-orders-body');

        if (!approvedContainer || !rejectedContainer || !completeContainer) return;

        // Show loading state
        approvedContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Loading approved orders...</div>';
        rejectedContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Loading rejected orders...</div>';
        completeContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Loading all orders...</div>';

        try {
            const data = await ordersAPI.getAll();
            this.orders = data.data?.orders || data.orders || [];
            
            // Sort by creation date (newest first)
            this.orders.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.date || 0);
                const dateB = new Date(b.createdAt || b.date || 0);
                return dateB - dateA;
            });

            console.log(`📦 Loaded ${this.orders.length} orders`);
            this.renderOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
            const errorHtml = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load orders</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="ordersPage.loadOrders()" style="margin-top: 12px;">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
            approvedContainer.innerHTML = errorHtml;
            rejectedContainer.innerHTML = errorHtml;
            completeContainer.innerHTML = errorHtml;
        }
    }

    renderOrders() {
        // Categorize orders
        const approvedOrders = this.orders.filter(order => {
            const status = order.status || 'pending';
            return status === 'confirmed' || status === 'processing' || 
                   status === 'shipped' || status === 'delivered';
        });

        const rejectedOrders = this.orders.filter(order => {
            const status = order.status || 'pending';
            return status === 'cancelled' || status === 'rejected';
        });

        // Update counts
        document.getElementById('approved-count').textContent = approvedOrders.length;
        document.getElementById('rejected-count').textContent = rejectedOrders.length;
        document.getElementById('complete-count').textContent = this.orders.length;

        // Render each column
        this.renderOrderColumn('approved-orders-body', approvedOrders, 'approved');
        this.renderOrderColumn('rejected-orders-body', rejectedOrders, 'rejected');
        this.renderOrderColumn('complete-orders-body', this.orders, 'complete');
    }

    renderOrderColumn(containerId, orders, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-${type === 'approved' ? 'check-circle' : type === 'rejected' ? 'times-circle' : 'list'}"></i>
                    <h3>No ${type === 'approved' ? 'Approved' : type === 'rejected' ? 'Rejected' : ''} Orders</h3>
                    <p>${type === 'approved' ? 'No approved orders yet.' : type === 'rejected' ? 'No rejected orders.' : 'No orders found.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const statusClass = this.getStatusClass(order.status);
            const customerName = order.customerId?.name || order.shippingAddress?.name || 'Guest';
            const customerEmail = order.customerId?.email || '';
            const orderDate = new Date(order.createdAt || order.date || Date.now());
            const itemsCount = (order.items || []).length;

            return `
                <div class="order-card" data-id="${order._id}">
                    <div class="order-card-header">
                        <div class="order-id">
                            <strong>#${order._id.toString().slice(-8)}</strong>
                            <span class="badge ${statusClass}">${order.status || 'pending'}</span>
                        </div>
                        <small class="order-date">${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}</small>
                    </div>
                    <div class="order-card-body">
                        <div class="order-customer">
                            <strong>${customerName}</strong>
                            ${customerEmail ? `<br><small class="text-muted">${customerEmail}</small>` : ''}
                        </div>
                        <div class="order-items-count">
                            <i class="fas fa-box"></i> ${itemsCount} item${itemsCount !== 1 ? 's' : ''}
                        </div>
                        <div class="order-total">
                            <strong>Total: ₹${(order.total || 0).toFixed(2)}</strong>
                        </div>
                        ${order.shippingAddress ? `
                            <div class="order-address">
                                <small><i class="fas fa-map-marker-alt"></i> ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''}</small>
                            </div>
                        ` : ''}
                    </div>
                    <div class="order-card-footer">
                        <button class="btn btn-sm btn-primary" onclick="ordersPage.viewOrderDetails('${order._id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${type === 'approved' ? `
                            <select class="form-select form-select-sm" style="width: auto; display: inline-block; margin-left: 8px;" 
                                    onchange="ordersPage.updateStatus('${order._id}', this.value)">
                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            </select>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async viewOrderDetails(orderId) {
        try {
            // Try to find order in current list
            let order = this.orders.find(o => o._id === orderId);
            
            // If not found, fetch from API
            if (!order) {
                const data = await ordersAPI.getById(orderId);
                order = data.data?.order || data.order;
            }

            if (!order) {
                showNotification('Order not found', 'error');
                return;
            }

            // Show comprehensive order summary
            this.showOrderSummaryModal(order);
        } catch (error) {
            console.error('Error fetching order details:', error);
            showNotification('Failed to load order details', 'error');
        }
    }

    showOrderSummaryModal(order) {
        const customerName = order.customerId?.name || order.shippingAddress?.name || 'Guest';
        const customerEmail = order.customerId?.email || order.shippingAddress?.email || '';
        const customerPhone = order.customerId?.phone || order.shippingAddress?.phone || '';
        const shippingAddress = order.shippingAddress || {};
        const items = order.items || [];
        const orderDate = new Date(order.createdAt || order.date || Date.now());

        // Calculate totals
        const subtotal = order.subtotal || items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
        const shipping = order.shipping || 0;
        const tax = order.tax || 0;
        const total = order.total || (subtotal + shipping + tax);

        const itemsHtml = items.map(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            return `
                <div class="order-detail-item" style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #eee; background: #f9f9f9; margin-bottom: 8px; border-radius: 4px;">
                    <img src="${item.image || item.productId?.image || 'https://via.placeholder.com/60'}" 
                         alt="${item.name}" 
                         onerror="this.src='https://via.placeholder.com/60'"
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 12px;">
                    <div style="flex: 1;">
                        <strong>${item.name || item.productId?.name || 'Product'}</strong>
                        ${item.category || item.productId?.category ? `<br><small style="color: #666;">Category: ${item.category || item.productId?.category}</small>` : ''}
                        ${item.weight || item.productId?.weight ? `<br><small style="color: #666;">Weight: ${item.weight || item.productId?.weight}</small>` : ''}
                        <br><small style="color: #666;">Quantity: ${item.quantity} × Price: ₹${(item.price || 0).toFixed(2)} = <strong>₹${itemTotal.toFixed(2)}</strong></small>
                    </div>
                </div>
            `;
        }).join('');

        const modalContent = `
            <div class="order-details-modal" style="max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                    <h2 style="margin: 0; color: #333;">
                        <i class="fas fa-receipt"></i> Order Summary - #${order._id.toString().slice(-8)}
                    </h2>
                    <span class="close" style="color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer; line-height: 20px;" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="order-details-section" style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                        <h4 style="margin-top: 0; color: #6875F5; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user"></i> Customer Information
                        </h4>
                        <p style="margin: 8px 0;"><strong>Name:</strong> ${customerName}</p>
                        ${customerEmail ? `<p style="margin: 8px 0;"><strong>Email:</strong> ${customerEmail}</p>` : ''}
                        ${customerPhone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${customerPhone}</p>` : ''}
                    </div>

                    <div class="order-details-section" style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                        <h4 style="margin-top: 0; color: #6875F5; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-map-marker-alt"></i> Shipping Address
                        </h4>
                        <p style="margin: 8px 0;">${shippingAddress.address || 'Not provided'}</p>
                        <p style="margin: 8px 0;">${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}</p>
                        ${shippingAddress.country ? `<p style="margin: 8px 0;">${shippingAddress.country}</p>` : ''}
                    </div>
                </div>

                <div class="order-details-section" style="margin-bottom: 20px;">
                    <h4 style="color: #6875F5; display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                        <i class="fas fa-box"></i> Order Items (${items.length})
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
                        <p style="margin: 8px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
                        <p style="margin: 8px 0;"><strong>Order Date:</strong> ${orderDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p style="margin: 8px 0;"><strong>Order Time:</strong> ${orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p style="margin: 8px 0;">
                            <strong>Status:</strong> 
                            <span class="badge ${this.getStatusClass(order.status)}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">
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

    getStatusClass(status) {
        const statusMap = {
            'pending': 'badge-warning',
            'confirmed': 'badge-success',
            'processing': 'badge-info',
            'shipped': 'badge-info',
            'delivered': 'badge-success',
            'cancelled': 'badge-danger',
            'rejected': 'badge-danger'
        };
        return statusMap[status] || 'badge-info';
    }

    async updateStatus(orderId, newStatus) {
        try {
            const data = await ordersAPI.update(orderId, {
                status: newStatus
            });
            showNotification('Order status updated successfully!');
            
            // Reload orders to update all columns
            this.loadOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            showNotification(error.message || 'Failed to update order status', 'error');
        }
    }
}

// Initialize orders page
window.ordersPage = new OrdersPage();