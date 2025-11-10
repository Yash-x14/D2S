// Customers Page Management
class CustomersPage {
    constructor() {
        this.customers = [];
        this.init();
    }

    init() {
        // Event listeners can be added here if needed
    }

    async loadCustomers() {
        const container = document.getElementById('customers-container');
        if (!container) return;

        container.innerHTML = `
            <div class="loading" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: #666;">Loading customers...</p>
            </div>
        `;

        try {
            const data = await customersAPI.getAll();
            this.customers = data.data?.customers || data.customers || [];
            this.renderCustomers();
        } catch (error) {
            console.error('Error loading customers:', error);
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 16px;"></i>
                    <h3 style="margin: 0 0 8px 0; color: #333;">Failed to load customers</h3>
                    <p style="color: #666; margin: 0;">${error.message}</p>
                </div>
            `;
        }
    }

    renderCustomers() {
        const container = document.getElementById('customers-container');
        if (!container) return;

        if (this.customers.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
                    <i class="fas fa-users" style="font-size: 48px; color: #6875F5; margin-bottom: 16px;"></i>
                    <h3 style="margin: 0 0 8px 0; color: #333;">No Customers Found</h3>
                    <p style="color: #666; margin: 0;">Customers will appear here when they register.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.customers.map(customer => {
            const initial = customer.name?.charAt(0).toUpperCase() || 'C';
            const phone = customer.phone || 'N/A';
            
            return `
                <div class="card" data-id="${customer._id}" style="display: flex; flex-direction: column; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;" 
                     onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                        <div class="dealer-avatar" style="width: 60px; height: 60px; font-size: 24px; font-weight: 600; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #6875F5 0%, #8B5CF6 100%); color: white; border-radius: 50%; margin-right: 16px; flex-shrink: 0;">
                            ${initial}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${customer.name || 'N/A'}
                            </h3>
                            <p style="margin: 0; font-size: 14px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <i class="fas fa-envelope" style="margin-right: 6px; color: #999;"></i>${customer.email || 'N/A'}
                            </p>
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: #f9f9f9; border-radius: 8px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; color: #666; font-size: 14px;">
                            <i class="fas fa-phone" style="margin-right: 8px; color: #999; width: 16px;"></i>
                            <span>${phone}</span>
                        </div>
                    </div>
                    
                    <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid #eee;">
                        <button class="btn btn-primary" onclick="customersPage.viewCustomer('${customer._id}')" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async viewCustomer(customerId) {
        const customer = this.customers.find(c => c._id === customerId);
        if (!customer) {
            showNotification('Customer not found', 'error');
            return;
        }

        // Fetch customer feedback
        let feedback = [];
        try {
            const feedbackData = await customersAPI.getFeedback(customerId);
            feedback = feedbackData.data?.feedback || [];
        } catch (error) {
            console.error('Error fetching customer feedback:', error);
        }

        const feedbackHtml = feedback.length > 0 ? feedback.map(fb => {
            const feedbackDate = new Date(fb.createdAt || fb.date || Date.now());
            const statusBadge = fb.status === 'new' ? 'badge-warning' : fb.status === 'read' ? 'badge-info' : 'badge-success';
            const statusText = fb.status === 'new' ? 'New' : fb.status === 'read' ? 'Read' : 'Replied';
            
            return `
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <span class="badge ${statusBadge}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">
                                ${statusText}
                            </span>
                            <span style="color: #6b7280; font-size: 14px;">
                                ${feedbackDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })} at ${feedbackDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap;">${fb.message || 'No message'}</p>
                    ${fb.phone ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;"><i class="fas fa-phone" style="margin-right: 6px;"></i>${fb.phone}</p>` : ''}
                </div>
            `;
        }).join('') : `
            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                <i class="fas fa-comment-slash" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 16px;">No feedback submitted yet</p>
            </div>
        `;

        const modalContent = `
            <div class="order-details-modal" style="max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                    <h2 style="margin: 0; color: #333; display: flex; align-items: center; gap: 12px;">
                        <div class="dealer-avatar" style="width: 50px; height: 50px; font-size: 20px; font-weight: 600; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #6875F5 0%, #8B5CF6 100%); color: white; border-radius: 50%;">
                            ${customer.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        Customer Details
                    </h2>
                    <span class="close" style="color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer; line-height: 20px;" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="order-details-section" style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
                        <h4 style="margin-top: 0; color: #6875F5; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user"></i> Personal Information
                        </h4>
                        <p style="margin: 12px 0;"><strong>Name:</strong> ${customer.name || 'N/A'}</p>
                        <p style="margin: 12px 0;"><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                        <p style="margin: 12px 0;"><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
                        ${customer.address ? `<p style="margin: 12px 0;"><strong>Address:</strong> ${customer.address}</p>` : ''}
                    </div>

                    <div class="order-details-section" style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #6875F5;">
                        <h4 style="margin-top: 0; color: #6875F5; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-info-circle"></i> Account Information
                        </h4>
                        <p style="margin: 12px 0;"><strong>Customer ID:</strong> #${customer._id.toString().slice(-8)}</p>
                        ${customer.createdAt ? `<p style="margin: 12px 0;"><strong>Registered:</strong> ${new Date(customer.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                        ${customer.updatedAt ? `<p style="margin: 12px 0;"><strong>Last Updated:</strong> ${new Date(customer.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                    </div>
                </div>

                <div class="order-details-section" style="background: #fff5f0; padding: 20px; border-radius: 8px; border-left: 4px solid #e67e22; margin-bottom: 20px;">
                    <h4 style="margin-top: 0; color: #e67e22; display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <i class="fas fa-comments"></i> Customer Feedback (${feedback.length})
                    </h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${feedbackHtml}
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
                <div class="modal-content" style="background-color: #fefefe; margin: 3% auto; padding: 0; border: none; width: 90%; max-width: 800px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
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

// Initialize customers page
window.customersPage = new CustomersPage();