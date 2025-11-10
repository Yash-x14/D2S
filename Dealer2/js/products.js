// Products Page Management
class ProductsPage {
    constructor() {
        this.products = [];
        this.editingProductId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add product form
        const addProductForm = document.getElementById('add-product-form');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        // Cancel edit button
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.cancelEdit();
            });
        }
    }

    async loadProducts() {
        const container = document.getElementById('products-table-body');
        if (!container) {
            console.warn('⚠️ Products table container not found');
            return;
        }

        console.log('📥 Loading products...');
        container.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div>Loading products...</td></tr>';

        try {
            const data = await productsAPI.getAll();
            console.log('📦 Products API response:', data);
            
            // Handle different response structures
            let products = [];
            if (data.data?.products) {
                products = data.data.products;
            } else if (data.products) {
                products = data.products;
            } else if (Array.isArray(data)) {
                products = data;
            } else if (data.data && Array.isArray(data.data)) {
                products = data.data;
            }

            console.log(`✅ Loaded ${products.length} products`);
            this.products = products;
            this.renderProducts();
        } catch (error) {
            console.error('❌ Error loading products:', error);
            const errorMessage = error.message || 'Failed to load products. Please check your connection.';
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load products</h3>
                        <p>${errorMessage}</p>
                        <button class="btn btn-primary" onclick="productsPage.loadProducts()" style="margin-top: 12px;">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    renderProducts() {
        const container = document.getElementById('products-table-body');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>No Products Found</h3>
                        <p>Add your first product to get started!</p>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = this.products.map(product => {
            const stock = product.stock?.quantity || 0;
            const minStock = product.stock?.lowStockThreshold || 10;
            const isLowStock = stock < minStock;
            const stockBadgeClass = isLowStock ? 'badge-danger' : (stock === 0 ? 'badge-warning' : 'badge-success');
            
            return `
            <tr data-id="${product._id}" style="${isLowStock ? 'background-color: #fef2f2;' : ''}">
                <td>
                    <img src="${product.image || product.primaryImage || 'https://via.placeholder.com/50'}" 
                         alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"
                         onerror="this.src='https://via.placeholder.com/50'">
                </td>
                <td>
                    <strong>${product.name}</strong>
                    ${product.isFeatured ? '<br><small style="color: var(--primary-color);"><i class="fas fa-star"></i> Featured</small>' : ''}
                    ${!product.isActive ? '<br><small style="color: var(--danger-color);"><i class="fas fa-eye-slash"></i> Inactive</small>' : ''}
                </td>
                <td>₹${product.price || 0}</td>
                <td><span class="badge badge-info">${product.category || 'General'}</span></td>
                <td>
                    <span class="badge ${stockBadgeClass}">${stock}</span>
                    ${isLowStock ? '<br><small style="color: var(--danger-color); font-size: 0.85em;"><i class="fas fa-exclamation-triangle"></i> Low Stock</small>' : ''}
                </td>
                <td>
                    <small style="color: var(--text-secondary);">Min: ${minStock}</small>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-success" onclick="productsPage.editProduct('${product._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="productsPage.deleteProduct('${product._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    }

    async saveProduct() {
        const form = document.getElementById('add-product-form');
        if (!form) {
            console.error('❌ Product form not found');
            return;
        }

        const formData = new FormData(form);
        const tagsInput = formData.get('tags');
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
        
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            category: formData.get('category'),
            image: formData.get('image'),
            primaryImage: formData.get('image'),
            imageURL: formData.get('image'),
            weight: formData.get('weight') || '200 Gms',
            sku: formData.get('sku') || undefined,
            stock: {
                quantity: parseInt(formData.get('stock')),
                lowStockThreshold: parseInt(formData.get('minStock')) || 10
            },
            isFeatured: formData.get('featured') === 'on',
            isActive: formData.get('active') === 'on',
            tags: tags.length > 0 ? tags : undefined
        };

        // Validate required fields
        if (!productData.name || !productData.description || !productData.price || !productData.category || !productData.image) {
            showNotification('Please fill in all required fields (name, description, price, category, image, stock)', 'error');
            return;
        }

        // Validate price
        if (isNaN(productData.price) || productData.price < 0) {
            showNotification('Please enter a valid price (must be a positive number)', 'error');
            return;
        }

        // Validate stock
        if (isNaN(productData.stock.quantity) || productData.stock.quantity < 0) {
            showNotification('Please enter a valid stock quantity (must be a non-negative number)', 'error');
            return;
        }

        // Validate minimum stock threshold
        if (isNaN(productData.stock.lowStockThreshold) || productData.stock.lowStockThreshold < 0) {
            showNotification('Please enter a valid minimum stock threshold (must be a non-negative number)', 'error');
            return;
        }

        console.log('📦 Saving product:', {
            name: productData.name,
            price: productData.price,
            category: productData.category,
            isEdit: !!this.editingProductId
        });

        try {
            let response;
            if (this.editingProductId) {
                console.log('🔄 Updating product:', this.editingProductId);
                response = await productsAPI.update(this.editingProductId, productData);
                console.log('✅ Product updated successfully');
                showNotification('Product updated successfully!');
            } else {
                console.log('➕ Creating new product...');
                response = await productsAPI.create(productData);
                console.log('✅ Product created successfully');
                console.log('📦 Product response:', response);
                showNotification('Product added successfully!');
            }

            // Extract product from response
            const savedProduct = response.data?.product || response.product || response;
            console.log('💾 Saved product data:', savedProduct);

            if (!savedProduct || !savedProduct._id) {
                console.error('❌ Invalid product response:', response);
                // Reload products list as fallback
                await this.loadProducts();
                return;
            }

            // Update or insert in table
            this.updateOrInsertProduct(savedProduct);

            // Also reload products to ensure sync
            await this.loadProducts();

            // Reset form
            form.reset();
            this.editingProductId = null;
            const formTitle = document.getElementById('form-title');
            if (formTitle) formTitle.textContent = 'Add New Product';
            const cancelBtn = document.getElementById('cancel-edit-btn');
            if (cancelBtn) cancelBtn.style.display = 'none';

            console.log('✅ Product saved and displayed successfully');
        } catch (error) {
            console.error('❌ Error saving product:', error);
            
            // Extract error message - apiCall throws Error objects with message
            const errorMessage = error.message || 'Failed to save product. Please try again.';
            showNotification(errorMessage, 'error');
            
            // Try to reload products anyway
            try {
                await this.loadProducts();
            } catch (reloadError) {
                console.error('❌ Error reloading products:', reloadError);
            }
        }
    }

    async editProduct(productId) {
        try {
            const data = await productsAPI.getById(productId);
            const product = data.data?.product || data.product;

            this.editingProductId = productId;

            // Fill form
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-price').value = product.price || '';
            document.getElementById('product-category').value = product.category || '';
            document.getElementById('product-image').value = product.image || product.primaryImage || '';
            document.getElementById('product-stock').value = product.stock?.quantity || 0;
            document.getElementById('product-min-stock').value = product.stock?.lowStockThreshold || 10;
            document.getElementById('product-weight').value = product.weight || '200 Gms';
            document.getElementById('product-sku').value = product.sku || '';
            document.getElementById('product-featured').checked = product.isFeatured || false;
            document.getElementById('product-active').checked = product.isActive !== false; // Default to true
            document.getElementById('product-tags').value = product.tags ? product.tags.join(', ') : '';

            // Update form title
            document.getElementById('form-title').textContent = 'Edit Product';
            const cancelBtn = document.getElementById('cancel-edit-btn');
            if (cancelBtn) cancelBtn.style.display = 'block';

            // Scroll to form
            document.getElementById('product-form-section').scrollIntoView({
                behavior: 'smooth'
            });
        } catch (error) {
            console.error('Error loading product:', error);
            showNotification('Failed to load product', 'error');
        }
    }

    cancelEdit() {
        document.getElementById('add-product-form').reset();
        this.editingProductId = null;
        document.getElementById('form-title').textContent = 'Add New Product';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            await productsAPI.delete(productId);
            showNotification('Product deleted successfully!');
            this.removeProduct(productId);
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification(error.message || 'Failed to delete product', 'error');
        }
    }

    updateOrInsertProduct(product) {
        const container = document.getElementById('products-table-body');
        if (!container) {
            console.warn('⚠️ Products table container not found for update');
            return;
        }

        if (!product || !product._id) {
            console.error('❌ Invalid product data:', product);
            return;
        }

        console.log('🔄 Updating/inserting product:', product._id, product.name);

        const existingRow = container.querySelector(`tr[data-id="${product._id}"]`);

        const stock = product.stock?.quantity || 0;
        const minStock = product.stock?.lowStockThreshold || 10;
        const isLowStock = stock < minStock;
        const stockBadgeClass = isLowStock ? 'badge-danger' : (stock === 0 ? 'badge-warning' : 'badge-success');
        
        const productRowHTML = `
            <td>
                <img src="${product.image || product.primaryImage || 'https://via.placeholder.com/50'}" 
                     alt="${product.name || 'Product'}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"
                     onerror="this.src='https://via.placeholder.com/50'">
            </td>
            <td>
                <strong>${product.name || 'Unnamed Product'}</strong>
                ${product.isFeatured ? '<br><small style="color: var(--primary-color);"><i class="fas fa-star"></i> Featured</small>' : ''}
                ${!product.isActive ? '<br><small style="color: var(--danger-color);"><i class="fas fa-eye-slash"></i> Inactive</small>' : ''}
            </td>
            <td>₹${product.price || 0}</td>
            <td><span class="badge badge-info">${product.category || 'General'}</span></td>
            <td>
                <span class="badge ${stockBadgeClass}">${stock}</span>
                ${isLowStock ? '<br><small style="color: var(--danger-color); font-size: 0.85em;"><i class="fas fa-exclamation-triangle"></i> Low Stock</small>' : ''}
            </td>
            <td>
                <small style="color: var(--text-secondary);">Min: ${minStock}</small>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-success" onclick="productsPage.editProduct('${product._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productsPage.deleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;

        if (existingRow) {
            // Update existing row
            console.log('✏️ Updating existing product row');
            existingRow.innerHTML = productRowHTML;
        } else {
            // Add new row
            console.log('➕ Adding new product row');
            
            // Remove loading or empty state
            const loadingState = container.querySelector('.loading');
            const emptyState = container.querySelector('.empty-state');
            if (loadingState) loadingState.remove();
            if (emptyState) emptyState.remove();

            const newRow = document.createElement('tr');
            newRow.setAttribute('data-id', product._id);
            newRow.innerHTML = productRowHTML;
            newRow.style.opacity = '0';
            container.appendChild(newRow);
            
            // Fade in animation
            setTimeout(() => {
                newRow.style.transition = 'opacity 0.3s ease';
                newRow.style.opacity = '1';
            }, 10);
            
            console.log('✅ Product row added successfully');
        }
    }

    removeProduct(productId) {
        const container = document.getElementById('products-table-body');
        if (!container) return;

        const row = container.querySelector(`tr[data-id="${productId}"]`);
        if (row) {
            row.style.transition = 'opacity 0.3s';
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();

                // Show empty state if no products left
                if (container.children.length === 0) {
                    container.innerHTML = `
                        <tr>
                            <td colspan="7" class="empty-state">
                                <i class="fas fa-box-open"></i>
                                <h3>No Products Found</h3>
                                <p>Add your first product to get started!</p>
                            </td>
                        </tr>
                    `;
                }
            }, 300);
        }
    }
}

// Initialize products page
window.productsPage = new ProductsPage();