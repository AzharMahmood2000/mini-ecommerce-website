document.addEventListener('DOMContentLoaded', () => {
    // ==================== CONFIG ====================
    const API_BASE_URL = 'http://localhost:5000/api';

    // ==================== DOM ELEMENTS ====================
    const modal = document.getElementById('addProductModal');
    const addBtn = document.querySelector('.add-btn');
    const modalCloseBtn = document.querySelector('.modal-close');
    const cancelBtn = document.querySelector('.btn-cancel');
    const form = document.getElementById('addProductForm');
    const notification = document.getElementById('notificationAlert');
    const navItems = document.querySelectorAll('.sidebar-nav li');
    const logoutLink = document.querySelector('.logout');
    const categoryFilterTrigger = document.getElementById('category-filter-trigger');
    const categoryFilterLabel = document.getElementById('category-filter-label');
    const categoryFilterMenu = document.getElementById('category-filter-menu');
    const stockFilterTrigger = document.getElementById('stock-filter-trigger');
    const stockFilterLabel = document.getElementById('stock-filter-label');
    const stockFilterMenu = document.getElementById('stock-filter-menu');
    let activeActionsMenu = null;
    let activeFilterMenu = null;
    let allAdminProducts = [];
    let selectedCategoryFilter = 'all';
    let selectedStockFilter = 'all';

    // ==================== UTILITY FUNCTIONS ====================
    const getToken = () => {
        return localStorage.getItem('authToken');
    };

    const showNotification = (message, type = 'success') => {
        const icon = notification.querySelector('.notification-icon');
        const messageSpan = notification.querySelector('.notification-message');

        notification.classList.remove('hidden', 'success', 'error', 'warning');
        notification.classList.add(type);
        messageSpan.textContent = message;

        if (type === 'success') {
            icon.className = 'notification-icon fa-solid fa-check-circle';
        } else if (type === 'error') {
            icon.className = 'notification-icon fa-solid fa-exclamation-circle';
        } else {
            icon.className = 'notification-icon fa-solid fa-info-circle';
        }

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 4000);
    };

    const isAuthenticated = () => {
        const token = getToken();
        if (!token) {
            showNotification('Please login to access admin panel', 'error');
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1500);
            return false;
        }
        return true;
    };

    // ==================== MODAL FUNCTIONS ====================
    const closeActiveActionsMenu = () => {
        if (activeActionsMenu) {
            activeActionsMenu.classList.add('hidden');
            activeActionsMenu = null;
        }
    };

    const openModal = () => {
        if (!isAuthenticated()) return;
        closeActiveActionsMenu();
        modal.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        form.reset();
        delete modal.dataset.editId;
        modal.querySelector('.modal-header h2').textContent = 'Add New Product';
        modal.querySelector('.btn-submit').textContent = 'Add Product';
    };

    const openModalOverlay = () => {
        const overlay = document.querySelector('.modal-overlay');
        overlay.addEventListener('click', closeModal);
    };

    // ==================== FORM SUBMISSION ====================
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const token = getToken();
        if (!token) {
            showNotification('Authentication token missing. Please login again.', 'error');
            return;
        }

        // Get form values
        const productData = {
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            discountPrice: document.getElementById('productDiscountPrice').value 
                ? parseFloat(document.getElementById('productDiscountPrice').value) 
                : undefined,
            category: document.getElementById('productCategory').value.trim(),
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value.trim(),
            imageUrl: document.getElementById('productImageUrl').value.trim(),
            brand: document.getElementById('productBrand').value.trim(),
            sku: document.getElementById('productSku').value.trim() || undefined,
        };

        // Validate required fields
        if (!productData.name || !productData.price || !productData.category || productData.stock === undefined) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }

        try {
            console.log('[ADMIN FORM] Submitting product:', productData);
            // If modal has editId, perform update (PUT), else create (POST)
            const editId = modal.dataset.editId;
            let response;

            if (editId) {
                // Prepare only allowed fields for update
                const updatePayload = {};
                ['name','price','description','category','stock','imageUrl','brand','discountPrice'].forEach(field => {
                    if (productData[field] !== undefined && productData[field] !== '') {
                        updatePayload[field] = productData[field];
                    }
                });

                response = await fetch(`${API_BASE_URL}/products/${editId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatePayload),
                });
            } else {
                response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(productData),
                });
            }

            const data = await response.json();
            console.log('[ADMIN FORM] Response:', data);

            if (!response.ok) {
                showNotification(data.message || (editId ? 'Failed to update product' : 'Failed to add product'), 'error');
                return;
            }

            showNotification(editId ? 'Product updated successfully!' : 'Product added successfully!', 'success');
            form.reset();
            closeModal();

            // Reset modal edit state
            delete modal.dataset.editId;
            modal.querySelector('.modal-header h2').textContent = 'Add New Product';
            modal.querySelector('.btn-submit').textContent = 'Add Product';

            // notify other pages (product listing) to refresh
            localStorage.setItem('productsUpdated', Date.now().toString());

            // Reload products list
            setTimeout(() => {
                loadAllProducts();
            }, 500);
        } catch (error) {
            console.error('[ADMIN FORM] Error:', error);
            showNotification('Error: ' + error.message, 'error');
        }
    };

    // ==================== PRODUCT LISTING ====================
    const loadAllProducts = async () => {
        try {
            console.log('[PRODUCTS] Fetching all products...');

            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            console.log('[PRODUCTS] Fetched:', data);

            if (!response.ok || !data.success) {
                console.error('[PRODUCTS] Error:', data.message);
                return;
            }

            allAdminProducts = Array.isArray(data.products) ? data.products : [];
            renderFilteredAdminProducts();
        } catch (error) {
            console.error('[PRODUCTS] Error:', error);
        }
    };

    const getStockStatus = (stockValue) => {
        const stock = Number(stockValue) || 0;

        if (stock === 0) return 'out_of_stock';
        if (stock > 10) return 'in_stock';
        return 'low_stock';
    };

    const applyAdminFilters = (products) => {
        return products.filter((product) => {
            const categoryMatches = selectedCategoryFilter === 'all' || product.category === selectedCategoryFilter;
            const stockMatches = selectedStockFilter === 'all' || getStockStatus(product.stock) === selectedStockFilter;
            return categoryMatches && stockMatches;
        });
    };

    const renderFilteredAdminProducts = () => {
        displayProductsInTable(applyAdminFilters(allAdminProducts));
    };

    const displayProductsInTable = (products) => {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        // Clear existing rows
        tbody.innerHTML = '';

        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No products found</td></tr>';
            const footer = document.querySelector('.table-footer span');
            if (footer) {
                footer.textContent = 'Showing 0 of 0 products';
            }
            return;
        }

        // Display first 5 products
        products.slice(0, 5).forEach(product => {
            const row = document.createElement('tr');
            row.dataset.productId = product._id;
            row.innerHTML = `
                <td>#${product._id.substring(0, 8).toUpperCase()}</td>
                <td>
                    ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" class="p-icon" onerror="this.src='../assets/images/Home/1.png'">` : '<img src="../assets/images/Home/1.png" alt="placeholder" class="p-icon">'}
                    ${product.name}
                </td>
                <td><span class="badge">${product.category}</span></td>
                <td><strong>Rs ${product.price.toLocaleString()}</strong></td>
                <td>${product.stock} units</td>
                <td class="actions-cell">
                    <div class="row-actions">
                        <button class="ellipsis-btn" aria-label="Actions"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        <div class="actions-menu hidden">
                            <button class="action-edit">Edit</button>
                            <button class="action-delete">Delete</button>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update table footer
        const footer = document.querySelector('.table-footer span');
        if (footer) {
            footer.textContent = `Showing ${Math.min(5, products.length)} of ${products.length} products`;
        }
    };

    const closeActiveFilterMenu = () => {
        if (activeFilterMenu) {
            activeFilterMenu.classList.add('hidden');
            const activeDropdown = activeFilterMenu.closest('.filter-dropdown');
            if (activeDropdown) {
                activeDropdown.classList.remove('open');
                const trigger = activeDropdown.querySelector('.filter-trigger');
                if (trigger) {
                    trigger.setAttribute('aria-expanded', 'false');
                }
            }
            activeFilterMenu = null;
        }
    };

    const setFilterSelection = (filterType, value, label) => {
        if (filterType === 'category') {
            selectedCategoryFilter = value;
            categoryFilterLabel.textContent = label;
            categoryFilterMenu.querySelectorAll('li').forEach((item) => item.classList.toggle('active', item.dataset.value === value));
        }

        if (filterType === 'stock') {
            selectedStockFilter = value;
            stockFilterLabel.textContent = value === 'all' ? 'Stock Status' : label;
            stockFilterMenu.querySelectorAll('li').forEach((item) => item.classList.toggle('active', item.dataset.value === value));
        }

        renderFilteredAdminProducts();
    };

    const toggleFilterMenu = (menuElement) => {
        if (!menuElement) return;

        if (activeFilterMenu && activeFilterMenu !== menuElement) {
            closeActiveFilterMenu();
        }

        const dropdown = menuElement.closest('.filter-dropdown');
        const trigger = dropdown ? dropdown.querySelector('.filter-trigger') : null;
        const isOpen = !menuElement.classList.contains('hidden');

        if (isOpen) {
            menuElement.classList.add('hidden');
            dropdown && dropdown.classList.remove('open');
            trigger && trigger.setAttribute('aria-expanded', 'false');
            activeFilterMenu = null;
            return;
        }

        menuElement.classList.remove('hidden');
        dropdown && dropdown.classList.add('open');
        trigger && trigger.setAttribute('aria-expanded', 'true');
        activeFilterMenu = menuElement;
    };

    if (categoryFilterTrigger && categoryFilterMenu) {
        categoryFilterTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleFilterMenu(categoryFilterMenu);
        });

        categoryFilterMenu.querySelectorAll('li').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                setFilterSelection('category', item.dataset.value, item.textContent.trim());
                closeActiveFilterMenu();
            });
        });
    }

    if (stockFilterTrigger && stockFilterMenu) {
        stockFilterTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleFilterMenu(stockFilterMenu);
        });

        stockFilterMenu.querySelectorAll('li').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                setFilterSelection('stock', item.dataset.value, item.textContent.trim());
                closeActiveFilterMenu();
            });
        });
    }

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.filter-dropdown')) {
            closeActiveFilterMenu();
        }
    });

    // ==================== ROW ACTIONS (EDIT / DELETE) ====================
    const openEditModal = (product) => {
        // Populate form fields with product data
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productDiscountPrice').value = product.discountPrice || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productImageUrl').value = product.imageUrl || '';
        document.getElementById('productBrand').value = product.brand || '';
        document.getElementById('productSku').value = product.sku || '';

        // Set modal to edit mode
        modal.dataset.editId = product._id;
        modal.querySelector('.modal-header h2').textContent = 'Edit Product';
        modal.querySelector('.btn-submit').textContent = 'Save Changes';

        openModal();
    };

    const handleDeleteProduct = async (productId, rowElement) => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        const token = getToken();
        if (!token) {
            showNotification('Authentication token missing. Please login again.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                showNotification(data.message || 'Failed to delete product', 'error');
                return;
            }

            if (rowElement && rowElement.parentNode) {
                rowElement.remove();
            }

            showNotification('Product deleted successfully', 'success');

            // notify other pages (product listing) to refresh
            localStorage.setItem('productsUpdated', Date.now().toString());

            // reload list
            setTimeout(() => loadAllProducts(), 300);
        } catch (error) {
            console.error('[DELETE PRODUCT] Error:', error);
            showNotification('Error deleting product: ' + error.message, 'error');
        }
    };

    // Handle clicks in table for actions (delegation)
    const tableBody = document.querySelector('tbody');
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const ellipsis = e.target.closest('.ellipsis-btn');
            if (ellipsis) {
                const actionsMenu = ellipsis.parentElement.querySelector('.actions-menu');
                if (activeActionsMenu && activeActionsMenu !== actionsMenu) {
                    activeActionsMenu.classList.add('hidden');
                }
                actionsMenu.classList.toggle('hidden');
                activeActionsMenu = actionsMenu.classList.contains('hidden') ? null : actionsMenu;
                return;
            }

            const editBtn = e.target.closest('.action-edit');
            if (editBtn) {
                closeActiveActionsMenu();
                const row = editBtn.closest('tr');
                const productId = row.dataset.productId;

                // Fetch single product details
                try {
                    const resp = await fetch(`${API_BASE_URL}/products/${productId}`);
                    const json = await resp.json();
                    if (!resp.ok) {
                        showNotification(json.message || 'Failed to fetch product details', 'error');
                        return;
                    }
                    openEditModal(json.product);
                } catch (err) {
                    console.error('[FETCH PRODUCT] Error:', err);
                    showNotification('Error fetching product details', 'error');
                }
                return;
            }

            const deleteBtn = e.target.closest('.action-delete');
            if (deleteBtn) {
                closeActiveActionsMenu();
                const row = deleteBtn.closest('tr');
                const productId = row.dataset.productId;
                handleDeleteProduct(productId, row);
                return;
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.row-actions')) {
            closeActiveActionsMenu();
        }
    });

    // ==================== LOGOUT FUNCTION ====================
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        window.location.href = './login.html';
    };

    // ==================== EVENT LISTENERS ====================
    addBtn.addEventListener('click', openModal);
    modalCloseBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    openModalOverlay();
    form.addEventListener('submit', handleFormSubmit);
    logoutLink.addEventListener('click', handleLogout);

    // Sidebar nav click handler
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Close notification
    const notificationClose = document.querySelector('.notification-close');
    if (notificationClose) {
        notificationClose.addEventListener('click', () => {
            notification.classList.add('hidden');
        });
    }

    // ==================== INITIALIZATION ====================
    if (isAuthenticated()) {
        loadAllProducts();
    }
});
