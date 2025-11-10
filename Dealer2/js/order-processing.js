// Order Processing Page Management
class OrderProcessingPage {
    constructor() {
        this.pendingOrders = [];
        this.socket = null;
        this.init();
    }

    init() {
        // Initialize Socket.IO for real-time order updates
        this.initSocketIO();
        // Set up auto-refresh every 30 seconds
        setInterval(() => {
            if (document.getElementById('order-processing') && 
                !document.getElementById('order-processing').classList.contains('hidden')) {
                this.loadPendingOrders();
            }
        }, 30000);
    }

    initSocketIO() {
        try {
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
            const socketUrl = API_BASE_URL.replace(/^http/, 'ws');
            
            // Use Socket.IO client library if available
            if (typeof io !== 'undefined') {
                this.socket = io(API_BASE_URL);
                
                // Listen for new orders
                this.socket.on('newOrder', (order) => {
                    console.log('📦 New order received via Socket.IO:', order);
                    // Check if order contains dealer's products
                    this.handleNewOrder(order);
                });

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

    handleNewOrder(order) {
        // Check if order is pending and contains dealer's products
        if (order.status === 'pending' || order.status === 'processing') {
            // Reload orders to get filtered list (only dealer's orders)
            this.loadPendingOrders();
            // Show notification
            if (window.showNotification) {
                showNotification(`🎉 New order received! Order #${order._id.toString().slice(-8)}`, 'success');
            }
        }
    }

    handleOrderUpdate(order) {
        // Update order if it's in the current list
        const existingOrderIndex = this.pendingOrders.findIndex(o => o._id === order._id);
        if (existingOrderIndex !== -1) {
            this.pendingOrders[existingOrderIndex] = order;
            // Re-render if order status changed from pending
            if (order.status !== 'pending' && order.status !== 'processing') {
                this.pendingOrders = this.pendingOrders.filter(o => 
                    o.status === 'pending' || o.status === 'processing'
                );
            }
            this.renderPendingOrders();
        }
    }

    async loadPendingOrders() {
        const container = document.getElementById('pending-orders-body');
        if (!container) return;

        container.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div>Loading pending orders...</td></tr>';

        try {
            // Fetch pending orders specifically
            const data = await ordersAPI.getAll();
            const allOrders = data.data?.orders || data.orders || [];
            this.pendingOrders = allOrders.filter(order =>
                order.status === 'pending' || order.status === 'processing'
            );
            
            // Sort by creation date (newest first)
            this.pendingOrders.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.date || 0);
                const dateB = new Date(b.createdAt || b.date || 0);
                return dateB - dateA;
            });

            console.log(`📦 Loaded ${this.pendingOrders.length} pending orders`);
            this.renderPendingOrders();
        } catch (error) {
            console.error('Error loading pending orders:', error);
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load orders</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="orderProcessingPage.loadPendingOrders()" style="margin-top: 12px;">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    renderPendingOrders() {
        const container = document.getElementById('pending-orders-body');
        if (!container) return;

        if (this.pendingOrders.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <h3>No Pending Orders</h3>
                        <p>All orders have been processed!</p>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = this.pendingOrders.map(order => {
            const customerName = order.customerId?.name || order.shippingAddress?.name || 'Guest';
            const customerEmail = order.customerId?.email || '';
            const shippingAddress = order.shippingAddress || {};
            const address = `${shippingAddress.address || ''}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`.trim();
            const phone = shippingAddress.phone || '';
            const orderDate = new Date(order.createdAt || order.date || Date.now());
            const itemsList = (order.items || []).map(item => 
                `${item.name} (Qty: ${item.quantity}) - ₹${item.price}`
            ).join('<br>');

            return `
                <tr data-id="${order._id}" class="order-row">
                    <td>
                        <strong>#${order._id.toString().slice(-8)}</strong>
                        <br><small class="text-muted">${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}</small>
                    </td>
                    <td>
                        <strong>${customerName}</strong>
                        ${customerEmail ? `<br><small class="text-muted">${customerEmail}</small>` : ''}
                        ${phone ? `<br><small class="text-muted"><i class="fas fa-phone"></i> ${phone}</small>` : ''}
                    </td>
                    <td>
                        <div class="order-items-preview">
                            ${(order.items || []).slice(0, 2).map(item => `
                                <div class="order-item-preview">
                                    <img src="${item.image || 'https://via.placeholder.com/40'}" 
                                         alt="${item.name}" 
                                         onerror="this.src='https://via.placeholder.com/40'"
                                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 8px;">
                                    <div>
                                        <strong>${item.name}</strong>
                                        <br><small>Qty: ${item.quantity} × ₹${item.price}</small>
                                    </div>
                                </div>
                            `).join('')}
                            ${(order.items || []).length > 2 ? `<small class="text-muted">+${(order.items || []).length - 2} more items</small>` : ''}
                        </div>
                        <button class="btn btn-sm btn-link mt-2" onclick="orderProcessingPage.viewOrderDetails('${order._id}')">
                            <i class="fas fa-eye"></i> View All Items
                        </button>
                    </td>
                    <td>
                        <div class="shipping-info">
                            <small><strong>Address:</strong></small>
                            <br><small>${address || 'Not provided'}</small>
                        </div>
                    </td>
                    <td>
                        <div class="order-totals">
                            <div><strong>Subtotal:</strong> ₹${(order.subtotal || 0).toFixed(2)}</div>
                            <div><small>Shipping: ₹${(order.shipping || 0).toFixed(2)}</small></div>
                            <div><small>Tax: ₹${(order.tax || 0).toFixed(2)}</small></div>
                            <div class="total-amount"><strong>Total: ₹${(order.total || 0).toFixed(2)}</strong></div>
                        </div>
                    </td>
                    <td>
                        <span class="badge badge-warning">${order.status || 'pending'}</span>
                        <br><small class="text-muted">${order.paymentMethod || 'COD'}</small>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-success" onclick="orderProcessingPage.approveOrder('${order._id}')" title="Approve Order">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="orderProcessingPage.viewOrderDetails('${order._id}')" title="View Details">
                                <i class="fas fa-eye"></i> Details
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="orderProcessingPage.rejectOrder('${order._id}')" title="Reject Order">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async viewOrderDetails(orderId) {
        try {
            // Try to find order in pending orders
            let order = this.pendingOrders.find(o => o._id === orderId);
            
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

    async approveOrder(orderId) {
        try {
            await ordersAPI.update(orderId, {
                status: 'confirmed'
            });
            showNotification('Order approved successfully!');
            this.removeOrder(orderId);
            
            // Refresh orders page if it's loaded
            if (window.ordersPage && typeof window.ordersPage.loadOrders === 'function') {
                window.ordersPage.loadOrders();
            }
        } catch (error) {
            console.error('Error approving order:', error);
            showNotification(error.message || 'Failed to approve order', 'error');
        }
    }

    async rejectOrder(orderId) {
        if (!confirm('Are you sure you want to reject this order?')) {
            return;
        }

        try {
            await ordersAPI.update(orderId, {
                status: 'cancelled'
            });
            showNotification('Order rejected');
            this.removeOrder(orderId);
            
            // Refresh orders page if it's loaded
            if (window.ordersPage && typeof window.ordersPage.loadOrders === 'function') {
                window.ordersPage.loadOrders();
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            showNotification(error.message || 'Failed to reject order', 'error');
        }
    }

    removeOrder(orderId) {
        const container = document.getElementById('pending-orders-body');
        if (!container) return;

        const row = container.querySelector(`tr[data-id="${orderId}"]`);
        if (row) {
            row.style.transition = 'opacity 0.3s';
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();

                if (container.children.length === 0) {
                    container.innerHTML = `
                        <tr>
                            <td colspan="6" class="empty-state">
                                <i class="fas fa-check-circle"></i>
                                <h3>No Pending Orders</h3>
                                <p>All orders have been processed!</p>
                            </td>
                        </tr>
                    `;
                }
            }, 300);
        }
    }
}

// Initialize order processing page
window.orderProcessingPage = new OrderProcessingPage();