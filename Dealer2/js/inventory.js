// Inventory Page Management
class InventoryPage {
    constructor() {
        this.inventory = [];
        this.init();
    }

    init() {
        // Event listeners can be added here if needed
    }

    async loadInventory() {
        const container = document.getElementById('inventory-table-body');
        if (!container) return;

        container.innerHTML = '<tr><td colspan="5" class="loading"><div class="spinner"></div>Loading inventory...</td></tr>';

        try {
            // Load products as inventory items
            const data = await productsAPI.getAll();
            const products = data.data?.products || data.products || [];
            this.inventory = products.map(p => ({
                id: p._id,
                name: p.name,
                category: p.category,
                currentStock: p.stock?.quantity || 0,
                minStock: p.stock?.lowStockThreshold || 10,
                price: p.price
            }));
            this.renderInventory();
            this.updateInventoryStats();
            
            // Set default filter to "all"
            const filterAllBtn = document.getElementById('filter-all');
            if (filterAllBtn) {
                filterAllBtn.classList.remove('btn-outline');
                filterAllBtn.classList.add('btn-primary');
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load inventory</h3>
                        <p>${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }

    renderInventory() {
        const container = document.getElementById('inventory-table-body');
        if (!container) return;

        if (this.inventory.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-warehouse"></i>
                        <h3>No Inventory Items</h3>
                        <p>Add products to see inventory levels.</p>
                        <button class="btn btn-primary" onclick="inventoryPage.openManageInventoryModal()" style="margin-top: 16px;">
                            <i class="fas fa-plus"></i> Add Your First Product
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by low stock first, then by name
        const sortedInventory = [...this.inventory].sort((a, b) => {
            const aLowStock = a.currentStock < a.minStock;
            const bLowStock = b.currentStock < b.minStock;
            if (aLowStock && !bLowStock) return -1;
            if (!aLowStock && bLowStock) return 1;
            return a.name.localeCompare(b.name);
        });

        container.innerHTML = sortedInventory.map(item => {
            const isLowStock = item.currentStock < item.minStock;
            const stockClass = isLowStock ? 'badge-danger' : 'badge-success';
            const itemValue = (item.currentStock * item.price).toFixed(2);
            const stockPercentage = item.minStock > 0 ? ((item.currentStock / item.minStock) * 100).toFixed(0) : 0;

            return `
                <tr data-id="${item.id}" style="${isLowStock ? 'background-color: #fef2f2;' : ''}">
                    <td>
                        <strong>${item.name}</strong>
                        ${isLowStock ? '<br><small style="color: var(--danger-color);"><i class="fas fa-exclamation-triangle"></i> Low Stock Alert</small>' : ''}
                    </td>
                    <td><span class="badge badge-info">${item.category || 'General'}</span></td>
                    <td>
                        <span class="badge ${stockClass}">${item.currentStock}</span>
                        <br><small style="color: var(--text-secondary); font-size: 0.85em;">${stockPercentage}% of min</small>
                    </td>
                    <td>${item.minStock}</td>
                    <td>
                        <strong style="color: var(--primary-color);">₹${itemValue}</strong>
                        <br><small style="color: var(--text-secondary); font-size: 0.85em;">₹${item.price.toFixed(2)} per unit</small>
                    </td>
                    <td>
                        <input type="number" 
                               class="form-input" 
                               style="width: 100px; display: inline-block;" 
                               value="${item.currentStock}"
                               min="0"
                               onchange="inventoryPage.updateStock('${item.id}', this.value)">
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateInventoryStats() {
        const totalItems = this.inventory.length;
        const lowStockItems = this.inventory.filter(item => item.currentStock < item.minStock).length;
        const totalValue = this.inventory.reduce((sum, item) => sum + item.price, 0);
        const averageStock = totalItems > 0 
            ? (this.inventory.reduce((sum, item) => sum + item.currentStock, 0) / totalItems).toFixed(1)
            : 0;
        const outOfStockItems = this.inventory.filter(item => item.currentStock === 0).length;

        const totalItemsEl = document.getElementById('total-items-stat');
        const lowStockEl = document.getElementById('low-stock-stat');
        const totalValueEl = document.getElementById('total-value-stat');
        const inventoryCountDisplay = document.getElementById('inventory-count-display');

        if (totalItemsEl) totalItemsEl.textContent = totalItems;
        if (lowStockEl) {
            lowStockEl.textContent = lowStockItems;
            // Add warning indicator if there are low stock items
            if (lowStockItems > 0) {
                lowStockEl.parentElement.style.borderLeft = '4px solid var(--danger-color)';
            } else {
                lowStockEl.parentElement.style.borderLeft = 'none';
            }
        }
        if (totalValueEl) totalValueEl.textContent = `₹${totalValue.toFixed(2)}`;
        if (inventoryCountDisplay) inventoryCountDisplay.textContent = totalItems;

        // Update stat cards with additional info
        if (totalItemsEl && totalItems > 0) {
            const statCard = totalItemsEl.closest('.stat-card');
            if (statCard) {
                const existingSubtext = statCard.querySelector('.stat-subtext');
                if (existingSubtext) existingSubtext.remove();
                const subtext = document.createElement('div');
                subtext.className = 'stat-subtext';
                subtext.style.cssText = 'font-size: 0.75em; color: var(--text-secondary); margin-top: 4px;';
                subtext.textContent = `Avg: ${averageStock} units`;
                totalItemsEl.parentElement.appendChild(subtext);
            }
        }

        if (lowStockEl && lowStockItems > 0) {
            const statCard = lowStockEl.closest('.stat-card');
            if (statCard) {
                const existingSubtext = statCard.querySelector('.stat-subtext');
                if (existingSubtext) existingSubtext.remove();
                const subtext = document.createElement('div');
                subtext.className = 'stat-subtext';
                subtext.style.cssText = 'font-size: 0.75em; color: var(--danger-color); margin-top: 4px;';
                subtext.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${outOfStockItems > 0 ? `${outOfStockItems} out of stock` : 'Action needed'}`;
                lowStockEl.parentElement.appendChild(subtext);
            }
        }
    }

    filterInventory(filterType) {
        // Update filter buttons
        document.querySelectorAll('#filter-all, #filter-low').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline');
        });
        
        const activeBtn = document.getElementById(`filter-${filterType}`);
        if (activeBtn) {
            activeBtn.classList.remove('btn-outline');
            activeBtn.classList.add('btn-primary');
        }

        // Filter and re-render
        let filteredInventory = [...this.inventory];
        
        if (filterType === 'low') {
            filteredInventory = filteredInventory.filter(item => item.currentStock < item.minStock);
        }

        // Update count display
        const countDisplay = document.getElementById('inventory-count-display');
        if (countDisplay) {
            countDisplay.textContent = filteredInventory.length;
        }

        // Temporarily store filtered inventory for rendering
        const originalInventory = this.inventory;
        this.inventory = filteredInventory;
        this.renderInventory();
        this.inventory = originalInventory; // Restore original
    }

    sortInventory(sortType) {
        if (sortType === 'value') {
            const sorted = [...this.inventory].sort((a, b) => {
                const aValue = a.currentStock * a.price;
                const bValue = b.currentStock * b.price;
                return bValue - aValue; // Descending order
            });
            this.inventory = sorted;
            this.renderInventory();
            this.updateInventoryStats();
        }
    }

    async updateStock(productId, newStock) {
        try {
            const stock = parseInt(newStock);
            if (isNaN(stock) || stock < 0) {
                showNotification('Invalid stock quantity', 'error');
                return;
            }

            // Get product first
            const productData = await productsAPI.getById(productId);
            const product = productData.data?.product || productData.product;

            // Update product stock
            await productsAPI.update(productId, {
                ...product,
                stock: {
                    quantity: stock,
                    lowStockThreshold: product.stock?.lowStockThreshold || 10
                }
            });

            // Update in UI
            const row = document.querySelector(`tr[data-id="${productId}"]`);
            if (row) {
                const item = this.inventory.find(i => i.id === productId);
                if (item) {
                    item.currentStock = stock;
                    const isLowStock = stock < item.minStock;
                    const stockBadge = row.querySelector('.badge');
                    if (stockBadge) {
                        stockBadge.className = `badge ${isLowStock ? 'badge-danger' : 'badge-success'}`;
                        stockBadge.textContent = stock;
                    }
                }
            }

            this.updateInventoryStats();
            showNotification('Stock updated successfully!');
        } catch (error) {
            console.error('Error updating stock:', error);
            showNotification(error.message || 'Failed to update stock', 'error');
        }
    }

    openManageInventoryModal() {
        // Create or get modal
        let modal = document.getElementById('manage-inventory-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'manage-inventory-modal';
            modal.className = 'modal';
            modal.style.cssText = 'display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);';
            modal.innerHTML = `
                <div class="modal-content" style="background-color: #fefefe; margin: 3% auto; padding: 20px; border: 1px solid #888; width: 90%; max-width: 1000px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-height: 90vh; overflow-y: auto;">
                    <span class="close" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; line-height: 20px;" onclick="document.getElementById('manage-inventory-modal').style.display='none'">&times;</span>
                    <h2 style="margin-top: 0;"><i class="fas fa-warehouse"></i> Manage Inventory & Stocks</h2>
                    <div id="manage-inventory-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                        <button class="inventory-tab-btn active" onclick="inventoryPage.switchInventoryTab('manage')" id="tab-manage">
                            <i class="fas fa-edit"></i> Manage Stocks
                        </button>
                        <button class="inventory-tab-btn" onclick="inventoryPage.switchInventoryTab('add')" id="tab-add">
                            <i class="fas fa-plus-circle"></i> Add Product
                        </button>
                    </div>
                    <div id="manage-inventory-content"></div>
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

        // Show manage stocks tab by default
        this.switchInventoryTab('manage');
        modal.style.display = 'block';
    }

    switchInventoryTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.inventory-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const tabBtn = document.getElementById(`tab-${tab}`);
        if (tabBtn) tabBtn.classList.add('active');

        const content = document.getElementById('manage-inventory-content');
        if (!content) return;

        if (tab === 'add') {
            this.renderAddProductForm(content);
        } else {
            this.renderManageStocks(content);
        }
    }

    renderManageStocks(container) {
        if (this.inventory.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <i class="fas fa-box" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                    <h3>No Products Found</h3>
                    <p>Add products first to manage inventory.</p>
                    <button class="btn btn-primary" onclick="inventoryPage.switchInventoryTab('add')" style="margin-top: 16px;">
                        <i class="fas fa-plus"></i> Add Your First Product
                    </button>
                </div>
            `;
            return;
        }

        // Create inventory management form
        const inventoryForm = this.inventory.map(item => {
            const isLowStock = item.currentStock < item.minStock;
            return `
                <div class="inventory-manage-item" style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; background: ${isLowStock ? '#fef2f2' : '#f9fafb'};">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
                        <div style="font-size: 0.85em; color: #6b7280;">
                            Category: ${item.category || 'General'} | 
                            Current: <strong style="color: ${isLowStock ? '#ef4444' : '#10b981'};">${item.currentStock}</strong> | 
                            Min: ${item.minStock}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <label style="font-size: 0.9em; color: #6b7280;">New Stock:</label>
                        <input type="number" 
                               class="form-input" 
                               id="stock-${item.id}"
                               value="${item.currentStock}"
                               min="0"
                               style="width: 120px;"
                               data-product-id="${item.id}">
                        <button class="btn btn-sm btn-primary" onclick="inventoryPage.updateStockFromModal('${item.id}')">
                            <i class="fas fa-save"></i> Update
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <p style="color: #6b7280; margin-bottom: 16px;">Update stock quantities for your products. Low stock items are highlighted in red.</p>
                <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
                    <button class="btn btn-success" onclick="inventoryPage.bulkUpdateStock('add')">
                        <i class="fas fa-plus"></i> Add Stock to All
                    </button>
                    <button class="btn btn-warning" onclick="inventoryPage.bulkUpdateStock('set')">
                        <i class="fas fa-edit"></i> Set Minimum Stock
                    </button>
                    <button class="btn btn-info" onclick="inventoryPage.exportInventory()">
                        <i class="fas fa-download"></i> Export Inventory
                    </button>
                </div>
            </div>
            <div style="max-height: 500px; overflow-y: auto;">
                ${inventoryForm}
            </div>
        `;
    }

    renderAddProductForm(container) {
        container.innerHTML = `
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                <h3 style="margin-top: 0; margin-bottom: 16px;"><i class="fas fa-plus-circle"></i> Add New Product to Inventory</h3>
                <form id="add-product-inventory-form" onsubmit="inventoryPage.handleAddProduct(event)">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label class="form-label">Product Name *</label>
                            <input type="text" id="new-product-name" name="name" class="form-input" required placeholder="Enter product name">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Price (₹) *</label>
                            <input type="number" id="new-product-price" name="price" class="form-input" step="0.01" min="0" required placeholder="0.00">
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Description *</label>
                        <textarea id="new-product-description" name="description" class="form-textarea" required placeholder="Enter product description" rows="3"></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label class="form-label">Category *</label>
                            <select id="new-product-category" name="category" class="form-select" required>
                                <option value="">Select Category</option>
                                <option value="snacks">Snacks</option>
                                <option value="beverages">Beverages</option>
                                <option value="dairy">Dairy</option>
                                <option value="health">Health</option>
                                <option value="organic">Organic</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Image URL *</label>
                            <input type="url" id="new-product-image" name="image" class="form-input" required placeholder="https://example.com/image.jpg">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Stock Quantity *</label>
                            <input type="number" id="new-product-stock" name="stock" class="form-input" min="0" required placeholder="0">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div class="form-group">
                            <label class="form-label">Weight (Optional)</label>
                            <select id="new-product-weight" name="weight" class="form-select">
                                <option value="">Select Weight</option>
                                <option value="100 Gms">100 Gms</option>
                                <option value="200 Gms" selected>200 Gms</option>
                                <option value="250 Gms">250 Gms</option>
                                <option value="500 Gms">500 Gms</option>
                                <option value="1 Kg">1 Kg</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Minimum Stock Threshold</label>
                            <input type="number" id="new-product-min-stock" name="minStock" class="form-input" min="0" value="10" placeholder="10">
                            <small style="color: #6b7280; font-size: 12px;">Alert when stock falls below this number</small>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button type="button" class="btn btn-outline" onclick="inventoryPage.switchInventoryTab('manage')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Add Product
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    async handleAddProduct(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById('new-product-name').value.trim(),
            description: document.getElementById('new-product-description').value.trim(),
            price: parseFloat(document.getElementById('new-product-price').value),
            category: document.getElementById('new-product-category').value,
            image: document.getElementById('new-product-image').value.trim(),
            imageURL: document.getElementById('new-product-image').value.trim(),
            primaryImage: document.getElementById('new-product-image').value.trim(),
            weight: document.getElementById('new-product-weight').value || '200 Gms',
            stock: {
                quantity: parseInt(document.getElementById('new-product-stock').value),
                lowStockThreshold: parseInt(document.getElementById('new-product-min-stock').value) || 10
            },
            isActive: true
        };

        // Validate required fields
        if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.image) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate price
        if (isNaN(formData.price) || formData.price < 0) {
            showNotification('Please enter a valid price', 'error');
            return;
        }

        // Validate stock
        if (isNaN(formData.stock.quantity) || formData.stock.quantity < 0) {
            showNotification('Please enter a valid stock quantity', 'error');
            return;
        }

        try {
            showNotification('Adding product...', 'info');
            
            const response = await productsAPI.create(formData);
            
            if (response.success || response.data) {
                showNotification('Product added successfully!', 'success');
                
                // Clear form
                document.getElementById('add-product-inventory-form').reset();
                
                // Reload inventory
                await this.loadInventory();
                
                // Switch back to manage tab
                this.switchInventoryTab('manage');
            } else {
                throw new Error(response.error || 'Failed to add product');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            showNotification(error.message || 'Failed to add product', 'error');
        }
    }

    async updateStockFromModal(productId) {
        const input = document.getElementById(`stock-${productId}`);
        if (!input) return;

        const newStock = parseInt(input.value);
        if (isNaN(newStock) || newStock < 0) {
            showNotification('Invalid stock quantity', 'error');
            return;
        }

        await this.updateStock(productId, newStock);
        
        // Reload inventory to refresh the modal
        await this.loadInventory();
        this.switchInventoryTab('manage');
    }

    async bulkUpdateStock(action) {
        const promptText = action === 'add' 
            ? 'Enter the quantity to add to all products:'
            : 'Enter the minimum stock level to set for all products:';
        
        const quantity = prompt(promptText);
        if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
            return;
        }

        const qty = parseInt(quantity);
        let updated = 0;
        let failed = 0;

        showNotification('Updating stocks...', 'info');

        for (const item of this.inventory) {
            try {
                const productData = await productsAPI.getById(item.id);
                const product = productData.data?.product || productData.product;
                
                let newStock;
                if (action === 'add') {
                    newStock = item.currentStock + qty;
                } else {
                    newStock = Math.max(item.currentStock, qty);
                }

                await productsAPI.update(item.id, {
                    ...product,
                    stock: {
                        quantity: newStock,
                        lowStockThreshold: product.stock?.lowStockThreshold || 10
                    }
                });
                updated++;
            } catch (error) {
                console.error(`Error updating stock for ${item.name}:`, error);
                failed++;
            }
        }

        showNotification(`Updated ${updated} products${failed > 0 ? `, ${failed} failed` : ''}`, updated > 0 ? 'success' : 'error');
        
        // Reload inventory
        await this.loadInventory();
        this.switchInventoryTab('manage');
    }

    exportInventory() {
        // Create CSV content
        const headers = ['Product Name', 'Category', 'Current Stock', 'Min Stock', 'Price', 'Status'];
        const rows = this.inventory.map(item => [
            item.name,
            item.category || 'General',
            item.currentStock,
            item.minStock,
            item.price,
            item.currentStock < item.minStock ? 'Low Stock' : 'In Stock'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Inventory exported successfully!', 'success');
    }
}

// Initialize inventory page
window.inventoryPage = new InventoryPage();