// Download Bills page (download-bills.html) specific functionality
document.addEventListener('DOMContentLoaded', function() {
            // Load bills from localStorage
            function loadBills() {
                const bills = JSON.parse(localStorage.getItem('bills')) || [];
                const billsContainer = document.querySelector('.bills-container');

                if (!billsContainer) return;

                if (bills.length === 0) {
                    billsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <h3>No bills available</h3>
                    <p>You haven't placed any orders yet.</p>
                </div>
            `;
                    return;
                }

                billsContainer.innerHTML = bills.map(bill => `
            <div class="bill-item">
                <div class="bill-info">
                    <h4>Bill ${bill.id}</h4>
                    <p>Order ID: ${bill.orderId}</p>
                    <p>Date: ${new Date(bill.date).toLocaleDateString()}</p>
                    <p>Total: ₹${bill.total.toFixed(2)}</p>
                </div>
                <button class="download-btn" onclick="downloadBill('${bill.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `).join('');
            }

            window.downloadBill = function(billId) {
                    const bills = JSON.parse(localStorage.getItem('bills')) || [];
                    const bill = bills.find(b => b.id === billId);

                    if (!bill) {
                        alert('Bill not found!');
                        return;
                    }

                    // Create a simple text bill
                    const billText = `
BILL - ${bill.id}
Order ID: ${bill.orderId}
Date: ${new Date(bill.date).toLocaleDateString()}

Items:
${bill.items.map(item => `${item.name} x${item.quantity} - ₹${item.total.toFixed(2)}`).join('\n')}

Subtotal: ₹${bill.subtotal.toFixed(2)}
Tax: ₹${bill.tax.toFixed(2)}
Delivery: ₹${bill.delivery.toFixed(2)}
Total: ₹${bill.total.toFixed(2)}

Payment Method: ${bill.paymentMethod}
        `;
        
        // Create download link
        const blob = new Blob([billText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill-${bill.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Bill downloaded successfully!', 'success');
    };
    
    loadBills();
});