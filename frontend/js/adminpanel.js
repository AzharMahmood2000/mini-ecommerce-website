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
    const featureTableBody = document.getElementById('featuresTableBody');
    let activeActionsMenu = null;
    let activeFilterMenu = null;
    let allAdminProducts = [];
    let allFeatures = [];
    const featureOrder = ['safe_payment', 'easy_exchange', 'fast_delivery'];
    const fallbackFeatures = [
        { key: 'safe_payment', title: 'SAFE PAYMENT', message: 'Your payments are 100% secure and encrypted.' },
        { key: 'easy_exchange', title: 'EASY EXCHANGES', message: 'Easy return and replacement within 7 days.' },
        { key: 'fast_delivery', title: 'FAST DELIVERY', message: 'We deliver products within 24–48 hours.' },
    ];
    let selectedCategoryFilter = 'all';
    let selectedStockFilter = 'all';
    let currentPage = 1;
    let totalPages = 1;
    let totalProducts = 0;
    const productsPerPage = 5;
    const paginationControls = document.querySelector('.table-footer .pagination');

    // ==================== UTILITY FUNCTIONS ====================
    const getToken = () => {
        return localStorage.getItem('authToken');
    };

    const resolveImageUrl = (imageUrl) => {
        if (!imageUrl) return '../assets/images/Home/1.png';
        if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith('data:') || imageUrl.startsWith('../')) {
            return imageUrl;
        }
        if (imageUrl.startsWith('/uploads/')) return `http://localhost:5000${imageUrl}`;
        if (imageUrl.startsWith('uploads/')) return `http://localhost:5000/${imageUrl}`;
        return imageUrl;
    };

    const normalizeBoolean = (value) => {
        if (typeof value === 'boolean') return value;
        if (value === undefined || value === null || value === '') return false;
        return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
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

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString();
    };

    const resetFeatureForm = () => {
        if (!featureTableBody) return;

        featureTableBody.querySelectorAll('.feature-message-input').forEach((input) => {
            input.dataset.dirty = 'false';
            input.readOnly = true;
            const row = input.closest('tr');
            if (row) {
                row.classList.remove('is-editing');
                const saveBtn = row.querySelector('.feature-save-btn');
                if (saveBtn) saveBtn.disabled = true;
            }
        });
    };

    const renderFeaturesTable = () => {
        if (!featureTableBody) return;

        featureTableBody.innerHTML = '';

        const sourceFeatures = allFeatures.length ? allFeatures : fallbackFeatures;

        const orderedFeatures = featureOrder
            .map((key) => sourceFeatures.find((feature) => String(feature.key) === key))
            .filter(Boolean);

        if (!orderedFeatures.length) {
            featureTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Unable to load features</td></tr>';
            return;
        }

        orderedFeatures.forEach((feature) => {
            const row = document.createElement('tr');
            row.dataset.featureKey = feature.key;
            row.innerHTML = `
                <td><span class="badge">${feature.key || '-'}</span></td>
                <td><strong>${feature.title || 'Untitled Feature'}</strong></td>
                <td>
                    <textarea class="feature-message-input" rows="3" placeholder="Enter feature message" readonly>${feature.message || feature.description || ''}</textarea>
                </td>
                <td class="actions-cell">
                    <button class="feature-edit-btn" type="button">Edit</button>
                    <button class="feature-save-btn" type="button" disabled>Save</button>
                </td>
            `;
            featureTableBody.appendChild(row);
        });
    };

    const loadFeatures = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/features`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to load features');
            }

            const fetchedFeatures = Array.isArray(data.features) ? data.features : [];
            allFeatures = featureOrder.map((key) => fetchedFeatures.find((feature) => String(feature.key) === key) || fallbackFeatures.find((feature) => feature.key === key));
            renderFeaturesTable();
        } catch (error) {
            console.error('[FEATURES] Error:', error);
            allFeatures = [...fallbackFeatures];
            renderFeaturesTable();
        }
    };

    const saveFeatureMessage = async (featureKey, message) => {
        const token = getToken();
        if (!token) {
            showNotification('Authentication token missing. Please login again.', 'error');
            return;
        }

        if (!message) {
            showNotification('Feature message is required', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/features/${featureKey}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                showNotification(data.message || 'Failed to save feature', 'error');
                return;
            }

            showNotification('Feature updated successfully', 'success');
            resetFeatureForm();
            localStorage.setItem('featuresUpdated', Date.now().toString());
            await loadFeatures();
        } catch (error) {
            console.error('[FEATURES] Submit error:', error);
            showNotification('Error saving feature: ' + error.message, 'error');
        }
    };

    const toggleFeatureEditing = (row, isEditing) => {
        if (!row) return;

        const messageInput = row.querySelector('.feature-message-input');
        const saveBtn = row.querySelector('.feature-save-btn');

        if (messageInput) {
            messageInput.readOnly = !isEditing;
            messageInput.dataset.dirty = isEditing ? 'true' : 'false';
            if (isEditing) {
                messageInput.focus();
            }
        }

        if (saveBtn) {
            saveBtn.disabled = !isEditing;
        }

        row.classList.toggle('is-editing', isEditing);
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
        const showOnHomeCheckbox = document.getElementById('productShowOnHome');
        if (showOnHomeCheckbox) showOnHomeCheckbox.checked = false;
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
            showOnHome: document.getElementById('productShowOnHome').checked,
        };
        const productImageFile = document.getElementById('productImageFile').files[0];

        // Validate required fields
        if (!productData.name || Number.isNaN(productData.price) || !productData.category || Number.isNaN(productData.stock)) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }

        try {
            console.log('[ADMIN FORM] Submitting product:', productData);
            // If modal has editId, perform update (PUT), else create (POST)
            const editId = modal.dataset.editId;
            let response;
            const payload = new FormData();

            ['name', 'price', 'description', 'category', 'stock', 'imageUrl', 'brand', 'discountPrice', 'sku'].forEach((field) => {
                if (productData[field] !== undefined && productData[field] !== '') {
                    payload.append(field, String(productData[field]));
                }
            });
            payload.append('showOnHome', String(productData.showOnHome));

            if (productImageFile) {
                payload.append('image', productImageFile);
            }

            if (editId) {
                response = await fetch(`${API_BASE_URL}/products/${editId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: payload,
                });
            } else {
                response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: payload,
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

            // Reload products list from first page so new product is visible
            setTimeout(() => {
                currentPage = 1;
                loadAllProducts(currentPage);
            }, 500);
        } catch (error) {
            console.error('[ADMIN FORM] Error:', error);
            showNotification('Error: ' + error.message, 'error');
        }
    };

    // ==================== PRODUCT LISTING ====================
    const loadAllProducts = async (page = currentPage) => {
        try {
            console.log('[PRODUCTS] Fetching paginated products...', { page, productsPerPage });

            const token = getToken();
            if (!token) {
                showNotification('Authentication token missing. Please login again.', 'error');
                return;
            }

            const params = new URLSearchParams({
                page: String(page),
                limit: String(productsPerPage),
            });

            if (selectedCategoryFilter !== 'all') {
                params.set('category', selectedCategoryFilter);
            }

            if (selectedStockFilter !== 'all') {
                params.set('stockStatus', selectedStockFilter);
            }

            const response = await fetch(`${API_BASE_URL}/admin/products?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log('[PRODUCTS] Fetched:', data);

            if (!response.ok || !data.success) {
                console.error('[PRODUCTS] Error:', data.message);
                return;
            }

            allAdminProducts = Array.isArray(data.products) ? data.products : [];
            currentPage = Number(data.currentPage) || page;
            totalPages = Number(data.totalPages) || 1;
            totalProducts = Number(data.totalProducts) || 0;

            displayProductsInTable(allAdminProducts);
            updatePaginationControls();
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

    const displayProductsInTable = (products) => {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        // Clear existing rows
        tbody.innerHTML = '';

        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No products found</td></tr>';
            const footer = document.querySelector('.table-footer span');
            if (footer) {
                footer.textContent = `Showing 0 of ${totalProducts} products`;
            }
            return;
        }

        products.forEach(product => {
            const isShownOnHome = normalizeBoolean(product.showOnHome);
            const row = document.createElement('tr');
            row.dataset.productId = product._id;
            row.innerHTML = `
                <td>#${product._id.substring(0, 8).toUpperCase()}</td>
                <td>
                    ${product.imageUrl ? `<img src="${resolveImageUrl(product.imageUrl)}" alt="${product.name}" class="p-icon" onerror="this.src='../assets/images/Home/1.png'">` : '<img src="../assets/images/Home/1.png" alt="placeholder" class="p-icon">'}
                    ${product.name}
                </td>
                <td><span class="badge">${product.category}</span></td>
                <td><strong>Rs ${product.price.toLocaleString()}</strong></td>
                <td>${product.stock} units</td>
                <td>
                    <button class="home-toggle-btn ${isShownOnHome ? 'enabled' : 'disabled'}" data-show-on-home="${isShownOnHome}">
                        ${isShownOnHome ? 'ON' : 'OFF'}
                    </button>
                </td>
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
            const start = totalProducts === 0 ? 0 : ((currentPage - 1) * productsPerPage) + 1;
            const end = Math.min(currentPage * productsPerPage, totalProducts);
            footer.textContent = `Showing ${start}-${end} of ${totalProducts} products`;
        }
    };

    const updatePaginationControls = () => {
        if (!paginationControls) return;

        const buttons = paginationControls.querySelectorAll('button');
        if (buttons.length < 2) return;

        const prevBtn = buttons[0];
        const nextBtn = buttons[1];

        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;

        prevBtn.textContent = `Previous (Page ${currentPage}/${totalPages})`;
        nextBtn.textContent = 'Next';
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

        currentPage = 1;
        loadAllProducts(currentPage);
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
        document.getElementById('productShowOnHome').checked = normalizeBoolean(product.showOnHome);

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
            setTimeout(() => loadAllProducts(currentPage), 300);
        } catch (error) {
            console.error('[DELETE PRODUCT] Error:', error);
            showNotification('Error deleting product: ' + error.message, 'error');
        }
    };

    const handleToggleHomeProduct = async (productId, currentState) => {
        const token = getToken();
        if (!token) {
            showNotification('Authentication token missing. Please login again.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}/toggle-home`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                showNotification(data.message || 'Failed to update home visibility', 'error');
                return;
            }

            showNotification(!currentState ? 'Product added to home page' : 'Product removed from home page', 'success');
            localStorage.setItem('productsUpdated', Date.now().toString());
            await loadAllProducts(currentPage);
        } catch (error) {
            console.error('[TOGGLE HOME] Error:', error);
            showNotification('Error updating home visibility: ' + error.message, 'error');
        }
    };

    // Handle clicks in table for actions (delegation)
    const tableBody = document.querySelector('tbody');
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const ellipsisBtn = e.target.closest('.ellipsis-btn');
            if (ellipsisBtn) {
                const menu = ellipsisBtn.closest('.row-actions')?.querySelector('.actions-menu');
                if (!menu) return;

                if (activeActionsMenu && activeActionsMenu !== menu) {
                    activeActionsMenu.classList.add('hidden');
                }

                menu.classList.toggle('hidden');
                activeActionsMenu = menu.classList.contains('hidden') ? null : menu;
                return;
            }

            const homeToggleBtn = e.target.closest('.home-toggle-btn');
            if (homeToggleBtn) {
                const row = homeToggleBtn.closest('tr');
                const productId = row?.dataset.productId;
                const currentState = normalizeBoolean(homeToggleBtn.dataset.showOnHome);
                if (productId) {
                    await handleToggleHomeProduct(productId, currentState);
                }
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

    if (featureTableBody) {
        featureTableBody.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.feature-edit-btn');
            if (editBtn) {
                const row = editBtn.closest('tr');
                toggleFeatureEditing(row, true);
                return;
            }

            const saveBtn = e.target.closest('.feature-save-btn');
            if (saveBtn) {
                const row = saveBtn.closest('tr');
                const featureKey = row?.dataset.featureKey;
                const messageInput = row?.querySelector('.feature-message-input');
                const message = messageInput ? messageInput.value.trim() : '';

                if (featureKey) {
                    await saveFeatureMessage(featureKey, message);
                    toggleFeatureEditing(row, false);
                }
                return;
            }
        });
    }

    if (paginationControls) {
        paginationControls.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || button.disabled) return;

            const text = button.textContent.toLowerCase();
            if (text.includes('previous') && currentPage > 1) {
                loadAllProducts(currentPage - 1);
                return;
            }

            if (text.includes('next') && currentPage < totalPages) {
                loadAllProducts(currentPage + 1);
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
    if (addBtn) {
        addBtn.addEventListener('click', openModal);
    }
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
        loadAllProducts(currentPage);
    }

    loadFeatures();

    window.addEventListener('storage', (e) => {
        if (e.key === 'featuresUpdated') {
            loadFeatures();
        }
    });
});
