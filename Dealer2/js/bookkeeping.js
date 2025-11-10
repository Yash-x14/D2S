// Bookkeeping Page Management
class BookkeepingPage {
    constructor() {
        this.transactions = [];
        this.init();
    }

    init() {
        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Period selection dropdown
        const periodSelect = document.getElementById('period-select');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.handlePeriodChange(e.target.value);
            });
        }

        // Download Excel button
        const downloadBtn = document.getElementById('download-excel-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadExcelSheet();
            });
        }
    }

    handlePeriodChange(period) {
        // Update the current view indicator
        const indicator = document.getElementById('current-view-indicator');
        if (indicator) {
            const periodLabels = {
                daily: 'Current Day',
                monthly: 'Current Month',
                quarterly: 'Current Quarter',
                yearly: 'Current Year'
            };
            indicator.textContent = `Showing: ${periodLabels[period] || 'Current Month'}`;
        }

        // Filter transactions based on period
        this.filterTransactionsByPeriod(period);
    }

    filterTransactionsByPeriod(period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Filter transactions
        const filtered = this.transactions.filter(t => t.date >= startDate);
        
        // Re-render with filtered data
        this.renderFilteredTransactions(filtered);
        this.updateFinancialSummaryForPeriod(filtered);
    }

    renderFilteredTransactions(transactions) {
        const container = document.getElementById('transactions-table-body');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <h3>No Transactions Found</h3>
                        <p>No transactions found for the selected period.</p>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => {
            const typeClass = transaction.type === 'income' ? 'badge-success' : 'badge-danger';
            const typeIcon = transaction.type === 'income' ? '+' : '-';

            return `
                <tr data-id="${transaction.id}">
                    <td>${transaction.date.toLocaleDateString()}</td>
                    <td>${transaction.description}</td>
                    <td><span class="badge ${typeClass}">${transaction.type}</span></td>
                    <td>${transaction.category}</td>
                    <td><strong>${typeIcon}₹${transaction.amount.toFixed(2)}</strong></td>
                    <td><span class="badge badge-info">${transaction.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="bookkeepingPage.viewTransactionDetails('${transaction.id}')" title="View Details">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateFinancialSummaryForPeriod(transactions) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const profit = income - expenses;

        const incomeEl = document.getElementById('total-income-stat');
        const expensesEl = document.getElementById('total-expenses-stat');
        const profitEl = document.getElementById('net-profit-stat');

        if (incomeEl) incomeEl.textContent = `₹${income.toFixed(2)}`;
        if (expensesEl) expensesEl.textContent = `₹${expenses.toFixed(2)}`;
        if (profitEl) {
            profitEl.textContent = `₹${profit.toFixed(2)}`;
            profitEl.style.color = profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        }
    }

    downloadExcelSheet() {
        try {
            // Get selected period
            const periodSelect = document.getElementById('period-select');
            const period = periodSelect ? periodSelect.value : 'monthly';

            // Filter transactions based on period
            const now = new Date();
            let startDate;

            switch (period) {
                case 'daily':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'monthly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarterly':
                    const quarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), quarter * 3, 1);
                    break;
                case 'yearly':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const filteredTransactions = this.transactions.filter(t => t.date >= startDate);

            // Create CSV content with product details
            let csvContent = 'Date,Time,Order ID,Product Name,Product Category,Product Weight,Quantity,Unit Price,Total Price,Order Status,Payment Method\n';

            filteredTransactions.forEach(transaction => {
                // Format date in a more readable format (DD/MM/YYYY)
                const date = transaction.date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                // Format time (HH:MM:SS)
                const time = transaction.date.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                
                const orderId = transaction.id.toString().slice(-8);
                const orderStatus = transaction.status || 'N/A';
                const paymentMethod = transaction.orderData?.paymentMethod || 'COD';
                
                // If order has items, create a row for each product
                if (transaction.items && transaction.items.length > 0) {
                    transaction.items.forEach((item, index) => {
                        const productName = item.name || item.productId?.name || 'N/A';
                        const productCategory = item.category || item.productId?.category || 'N/A';
                        const productWeight = item.weight || item.productId?.weight || 'N/A';
                        const quantity = item.quantity || 0;
                        const unitPrice = item.price || 0;
                        const totalPrice = (quantity * unitPrice).toFixed(2);
                        
                        // Escape commas and quotes in product name
                        const safeProductName = `"${(productName || 'N/A').replace(/"/g, '""')}"`;
                        const safeCategory = `"${(productCategory || 'N/A').replace(/"/g, '""')}"`;
                        const safeWeight = `"${(productWeight || 'N/A').replace(/"/g, '""')}"`;
                        
                        csvContent += `${date},${time},${orderId},${safeProductName},${safeCategory},${safeWeight},${quantity},₹${unitPrice.toFixed(2)},₹${totalPrice},${orderStatus},${paymentMethod}\n`;
                    });
                } else {
                    // If no items, still show the order with basic info
                    csvContent += `${date},${time},${orderId},"No Products","N/A","N/A",0,₹0.00,₹${transaction.amount.toFixed(2)},${orderStatus},${paymentMethod}\n`;
                }
            });

            // Add summary section
            const income = filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expenses = filteredTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const profit = income - expenses;

            csvContent += '\n';
            csvContent += 'Summary\n';
            csvContent += `Total Income,₹${income.toFixed(2)}\n`;
            csvContent += `Total Expenses,₹${expenses.toFixed(2)}\n`;
            csvContent += `Net Profit,₹${profit.toFixed(2)}\n`;

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            const periodLabels = {
                daily: 'Daily',
                monthly: 'Monthly',
                quarterly: 'Quarterly',
                yearly: 'Yearly'
            };

            const filename = `Financial_Bookkeeping_${periodLabels[period]}_${new Date().toISOString().split('T')[0]}.csv`;
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success message
            this.showToast('Excel sheet downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error downloading Excel sheet:', error);
            this.showToast('Failed to download Excel sheet. Please try again.', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(toast);
                document.head.removeChild(style);
            }, 300);
        }, 3000);
    }

    async loadTransactions() {
        const container = document.getElementById('transactions-table-body');
        if (!container) return;

        container.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div>Loading transactions...</td></tr>';

        try {
            // Load orders as transactions
            const data = await ordersAPI.getAll();
            const orders = data.data?.orders || data.orders || [];

            // Convert orders to transactions with full order data
            this.transactions = orders.map(order => ({
                id: order._id,
                date: new Date(order.createdAt),
                description: `Order #${order._id.toString().slice(-8)}`,
                type: 'income',
                category: 'sales',
                amount: order.total || 0,
                status: order.status,
                // Store full order data for Excel export
                orderData: order,
                items: order.items || []
            }));

            this.renderTransactions();
            this.updateFinancialSummary();
        } catch (error) {
            console.error('Error loading transactions:', error);
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load transactions</h3>
                        <p>${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }

    renderTransactions() {
        const container = document.getElementById('transactions-table-body');
        if (!container) return;

        if (this.transactions.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <h3>No Transactions Found</h3>
                        <p>Transactions will appear here when orders are placed.</p>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = this.transactions.map(transaction => {
            const typeClass = transaction.type === 'income' ? 'badge-success' : 'badge-danger';
            const typeIcon = transaction.type === 'income' ? '+' : '-';

            return `
                <tr data-id="${transaction.id}">
                    <td>${transaction.date.toLocaleDateString()}</td>
                    <td>${transaction.description}</td>
                    <td><span class="badge ${typeClass}">${transaction.type}</span></td>
                    <td>${transaction.category}</td>
                    <td><strong>${typeIcon}₹${transaction.amount.toFixed(2)}</strong></td>
                    <td><span class="badge badge-info">${transaction.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="bookkeepingPage.viewTransactionDetails('${transaction.id}')" title="View Details">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateFinancialSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const profit = income - expenses;

        const incomeEl = document.getElementById('total-income-stat');
        const expensesEl = document.getElementById('total-expenses-stat');
        const profitEl = document.getElementById('net-profit-stat');

        if (incomeEl) incomeEl.textContent = `₹${income.toFixed(2)}`;
        if (expensesEl) expensesEl.textContent = `₹${expenses.toFixed(2)}`;
        if (profitEl) {
            profitEl.textContent = `₹${profit.toFixed(2)}`;
            profitEl.style.color = profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        }
    }

    async viewTransactionDetails(transactionId) {
        try {
            // Find transaction in current list
            let transaction = this.transactions.find(t => t.id === transactionId);
            
            // If transaction has order data, use it; otherwise fetch from API
            if (transaction && transaction.orderData) {
                // Use orderProcessingPage or ordersPage to show order details
                if (window.orderProcessingPage && typeof window.orderProcessingPage.viewOrderDetails === 'function') {
                    window.orderProcessingPage.viewOrderDetails(transactionId);
                } else if (window.ordersPage && typeof window.ordersPage.viewOrderDetails === 'function') {
                    window.ordersPage.viewOrderDetails(transactionId);
                } else {
                    this.showTransactionSummaryModal(transaction);
                }
            } else {
                // Try to fetch order from API
                try {
                    const data = await ordersAPI.getById(transactionId);
                    const order = data.data?.order || data.order;
                    if (order) {
                        if (window.orderProcessingPage && typeof window.orderProcessingPage.viewOrderDetails === 'function') {
                            window.orderProcessingPage.viewOrderDetails(transactionId);
                        } else if (window.ordersPage && typeof window.ordersPage.viewOrderDetails === 'function') {
                            window.ordersPage.viewOrderDetails(transactionId);
                        } else {
                            // Convert to transaction format and show
                            const convertedTransaction = {
                                id: order._id,
                                date: new Date(order.createdAt || order.date || Date.now()),
                                description: `Order #${order._id.toString().slice(-8)}`,
                                type: 'income',
                                category: 'sales',
                                amount: order.total || 0,
                                status: order.status,
                                orderData: order,
                                items: order.items || []
                            };
                            this.showTransactionSummaryModal(convertedTransaction);
                        }
                    } else {
                        showNotification('Transaction not found', 'error');
                    }
                } catch (apiError) {
                    console.error('Error fetching transaction:', apiError);
                    if (transaction) {
                        this.showTransactionSummaryModal(transaction);
                    } else {
                        showNotification('Failed to load transaction details', 'error');
                    }
                }
            }
        } catch (error) {
            console.error('Error viewing transaction details:', error);
            showNotification('Failed to load transaction details', 'error');
        }
    }

    showTransactionSummaryModal(transaction) {
        const order = transaction.orderData || {};
        const customerName = order.customerId?.name || order.shippingAddress?.name || 'Guest';
        const customerEmail = order.customerId?.email || order.shippingAddress?.email || '';
        const customerPhone = order.customerId?.phone || order.shippingAddress?.phone || '';
        const shippingAddress = order.shippingAddress || {};
        const items = transaction.items || order.items || [];
        const transactionDate = transaction.date || new Date(order.createdAt || Date.now());

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

        const subtotal = order.subtotal || transaction.amount || items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
        const shipping = order.shipping || 0;
        const tax = order.tax || 0;
        const total = order.total || transaction.amount || (subtotal + shipping + tax);

        const modalContent = `
            <div class="order-details-modal" style="max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                    <h2 style="margin: 0; color: #333;">
                        <i class="fas fa-receipt"></i> Transaction Summary - #${(transaction.id || order._id || '').toString().slice(-8)}
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

                ${items.length > 0 ? `
                    <div class="order-details-section" style="margin-bottom: 20px;">
                        <h4 style="color: #6875F5; display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
                            <i class="fas fa-box"></i> Order Items (${items.length})
                        </h4>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${itemsHtml}
                        </div>
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="order-details-section" style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #6875F5;">
                        <h4 style="margin-top: 0; color: #6875F5; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-info-circle"></i> Transaction Information
                        </h4>
                        <p style="margin: 8px 0;"><strong>Transaction ID:</strong> #${(transaction.id || order._id || '').toString().slice(-8)}</p>
                        <p style="margin: 8px 0;"><strong>Date:</strong> ${transactionDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p style="margin: 8px 0;"><strong>Time:</strong> ${transactionDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p style="margin: 8px 0;">
                            <strong>Type:</strong> 
                            <span class="badge ${transaction.type === 'income' ? 'badge-success' : 'badge-danger'}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                ${transaction.type || 'income'}
                            </span>
                        </p>
                        <p style="margin: 8px 0;">
                            <strong>Status:</strong> 
                            <span class="badge badge-info" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                ${transaction.status || order.status || 'completed'}
                            </span>
                        </p>
                        <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${order.paymentMethod || 'COD'}</p>
                    </div>

                    <div class="order-details-section" style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                        <h4 style="margin-top: 0; color: #10b981; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-calculator"></i> Financial Summary
                        </h4>
                        ${items.length > 0 ? `
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
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; margin: 12px 0; padding-top: 12px; border-top: 2px solid #10b981; font-size: 18px;">
                            <span><strong>Total Amount:</strong></span>
                            <strong style="color: #10b981;">₹${total.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>

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
}

// Initialize bookkeeping page
window.bookkeepingPage = new BookkeepingPage();