document.addEventListener('DOMContentLoaded', () => {
    const pdGrid = document.getElementById('pd-grid');
    const categoryList = document.getElementById('category-list');
    const applyPriceFilterBtn = document.getElementById('apply-price-filter');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const minPriceDisplay = document.getElementById('min-price-display');
    const maxPriceDisplay = document.getElementById('max-price-display');
    const paginationContainer = document.querySelector('.pagination');

    if (!pdGrid) return;

    const productsApiUrl = 'http://localhost:5000/api/products';
    const categoriesApiUrl = 'http://localhost:5000/api/categories';
    const productsPerPage = 6;

    let products = [];
    let categories = [];
    let currentPage = 1;
    let totalPages = 1;
    let activeCategory = new URLSearchParams(window.location.search).get('category') || 'all';
    let minPrice = 0;
    let maxPrice = 1000000;
    let activeSort = 'relevant';

    const sortOptions = [
        { value: 'relevant', label: 'Relevant' },
        { value: 'newest', label: 'Newest' },
        { value: 'price_asc', label: 'Price: Low to High' },
        { value: 'price_desc', label: 'Price: High to Low' },
    ];

    const normalizeImagePath = (imagePath) => {
        if (!imagePath) return '../assets/images/Home/1.png';
        if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('data:') || imagePath.startsWith('../')) {
            return imagePath;
        }
        if (imagePath.startsWith('/uploads/')) {
            return `http://localhost:5000${imagePath}`;
        }
        if (imagePath.startsWith('uploads/')) {
            return `http://localhost:5000/${imagePath}`;
        }
        return `../${imagePath.replace(/^\.?\//, '')}`;
    };

    const extractPrice = (price) => {
        if (typeof price === 'number') return price;
        const parsed = parseInt(String(price).replace(/[^\d]/g, ''), 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const getCategoryIcon = (category) => {
        const normalized = String(category || '').toLowerCase();
        if (normalized.includes('electronics')) return 'fas fa-bolt';
        if (normalized.includes('mobile')) return 'fas fa-mobile-alt';
        if (normalized.includes('audio')) return 'fas fa-headphones-alt';
        if (normalized.includes('gaming')) return 'fas fa-gamepad';
        if (normalized.includes('information')) return 'fas fa-laptop';
        return 'fas fa-desktop';
    };

    const mapApiProduct = (product) => {
        const imageFromArray = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
            ? product.imageUrls[0]
            : '';

        return {
            id: product._id || String(product.id || ''),
            name: product.name || 'Unnamed Product',
            price: extractPrice(product.price),
            category: product.category || 'Other',
            stock: typeof product.stock === 'number' ? product.stock : 0,
            image: product.imageUrl || imageFromArray || '',
            description: product.description || '',
        };
    };

    const updateUrlCategory = () => {
        const url = new URL(window.location.href);
        if (activeCategory && activeCategory !== 'all') {
            url.searchParams.set('category', activeCategory);
        } else {
            url.searchParams.delete('category');
        }

        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const setActiveCategory = (category, shouldFetch = true) => {
        activeCategory = category || 'all';
        currentPage = 1;
        updateUrlCategory();
        renderCategoryList();

        if (shouldFetch) {
            fetchProducts(1);
        }
    };

    const renderCategoryList = () => {
        if (!categoryList) return;

        const categoryItems = categories.length > 0 ? categories : [];

        categoryList.innerHTML = [
            `<li class="${activeCategory === 'all' ? 'active' : ''}" data-category="all"><i class="fas fa-desktop"></i> ALL PRODUCTS</li>`,
            ...categoryItems.map((category) => `
                <li class="${activeCategory === category ? 'active' : ''}" data-category="${category}">
                    <i class="${getCategoryIcon(category)}"></i> ${category}
                </li>
            `),
        ].join('');

        categoryList.querySelectorAll('li').forEach((item) => {
            item.addEventListener('click', () => {
                setActiveCategory(item.dataset.category, true);
            });
        });
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(categoriesApiUrl);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to fetch categories.');
            }

            categories = Array.isArray(data.categories) ? data.categories : [];

            if (activeCategory !== 'all' && !categories.includes(activeCategory)) {
                activeCategory = 'all';
            }

            updateUrlCategory();
            renderCategoryList();
        } catch (error) {
            console.error('[PRODUCT PAGE] Category error:', error.message);
            categories = [];
            renderCategoryList();
        }
    };

    const renderProducts = () => {
        if (!products.length) {
            pdGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">No products found.</p>';
            return;
        }

        // Render heading + sort + products
        let html = '';

        // Render intro block (heading section)
        html += `
            <div class="intro-block">
                <h2>Technical Excellence</h2>
                <p>Discover our curated collection of premium electronics and gadgets. Quality products at unbeatable prices.</p>
            </div>
        `;

        // Render sort dropdown section
        html += `
            <div class="pd-sort-card">
                <div class="sort-container">
                    <span class="sort-label">Sort By:</span>
                    <div class="sort-dropdown" id="sort-dropdown">
                        <span class="selected-sort" id="selected-sort-text">Relevant</span>
                        <i class="fas fa-chevron-down"></i>
                        <ul class="sort-options" id="sort-options-list">
                            ${sortOptions.map(option => `
                                <li data-sort="${option.value}" ${option.value === activeSort ? 'class="active"' : ''}>
                                    ${option.label}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Render product cards
        html += products.map((product) => `
            <div class="pd-card" data-product-id="${product.id}">
                <div class="pd-img-container">
                    <img src="${normalizeImagePath(product.image)}" alt="${product.name}">
                </div>
                <div class="pd-info">
                    <h3>${product.name}</h3>
                    <p class="category">${product.category}</p>
                    <p class="price">Rs ${product.price.toLocaleString()}</p>
                    <p class="stock">Stock: ${product.stock}</p>
                    <button class="pd-view-btn">VIEW PRODUCT</button>
                </div>
            </div>
        `).join('');

        pdGrid.innerHTML = html;

        // Attach event listeners for sort dropdown
        setupSortDropdown();
    };

    const renderPagination = () => {
        if (!paginationContainer) return;

        const buttons = [];

        buttons.push(`
            <button class="page-btn" data-page="prev" ${currentPage <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `);

        for (let i = 1; i <= totalPages; i += 1) {
            buttons.push(`
                <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
            `);
        }

        buttons.push(`
            <button class="page-btn" data-page="next" ${currentPage >= totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `);

        paginationContainer.innerHTML = buttons.join('');
    };

    const buildQueryParams = (pageNumber) => {
        const params = new URLSearchParams();
        params.set('page', String(pageNumber));
        params.set('limit', String(productsPerPage));

        if (activeCategory !== 'all') {
            params.set('category', activeCategory);
        }

        params.set('minPrice', String(minPrice));
        params.set('maxPrice', String(maxPrice));

        // Include sort parameter
        if (activeSort && activeSort !== 'relevant') {
            params.set('sort', activeSort);
        }

        return params.toString();
    };

    const buildProductsUrl = (pageNumber) => {
        const query = buildQueryParams(pageNumber);

        if (activeCategory && activeCategory !== 'all') {
            return `http://localhost:5000/api/products/category/${encodeURIComponent(activeCategory)}?${query}`;
        }

        return `${productsApiUrl}?${query}`;
    };

    const setupSortDropdown = () => {
        const sortDropdown = document.getElementById('sort-dropdown');
        const sortOptionsList = document.getElementById('sort-options-list');
        const selectedSortText = document.getElementById('selected-sort-text');

        if (!sortDropdown || !sortOptionsList) return;

        // Toggle dropdown visibility
        sortDropdown.addEventListener('click', () => {
            sortOptionsList.classList.toggle('show');
        });

        // Handle sort option selection
        sortOptionsList.querySelectorAll('li').forEach((option) => {
            option.addEventListener('click', () => {
                const sortValue = option.dataset.sort;
                const sortLabel = option.textContent.trim();

                // Update active sort and UI
                activeSort = sortValue;
                selectedSortText.textContent = sortLabel;

                // Remove active class from all options and add to selected
                sortOptionsList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                option.classList.add('active');

                // Close dropdown
                sortOptionsList.classList.remove('show');

                // Reset to page 1 when sort changes
                currentPage = 1;

                // Fetch products with new sort
                fetchProducts(1);
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!sortDropdown.contains(e.target)) {
                sortOptionsList.classList.remove('show');
            }
        });
    };

    const fetchProducts = async (pageNumber = 1) => {
        try {
            const url = buildProductsUrl(pageNumber);

            console.log('[PRODUCT PAGE] Fetching:', url);
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to fetch products.');
            }

            products = Array.isArray(data.products) ? data.products.map(mapApiProduct) : [];
            currentPage = Number(data.currentPage) || pageNumber;
            totalPages = Number(data.totalPages) || 1;

            renderProducts();
            renderPagination();
        } catch (error) {
            console.error('[PRODUCT PAGE] Error:', error.message);
            pdGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #d00; padding: 40px;">Unable to load products right now. Please try again.</p>';
            if (paginationContainer) paginationContainer.innerHTML = '';
        }
    };

    window.filterProductsByCategory = (category) => {
        setActiveCategory(category || 'all', true);
    };

    if (applyPriceFilterBtn) {
        applyPriceFilterBtn.addEventListener('click', () => {
            minPrice = parseInt(minPriceInput.value, 10) || 0;
            maxPrice = parseInt(maxPriceInput.value, 10) || 1000000;

            minPriceDisplay.textContent = `Rs ${minPrice}`;
            maxPriceDisplay.textContent = `Rs ${maxPrice}+`;

            currentPage = 1;
            fetchProducts(currentPage);
        });
    }

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.page-btn');
            if (!button || button.disabled) return;

            const value = button.dataset.page;
            if (value === 'prev' && currentPage > 1) {
                fetchProducts(currentPage - 1);
                return;
            }

            if (value === 'next' && currentPage < totalPages) {
                fetchProducts(currentPage + 1);
                return;
            }

            const selectedPage = parseInt(value, 10);
            if (!Number.isNaN(selectedPage)) {
                fetchProducts(selectedPage);
            }
        });
    }

    // Listen for updates from admin panel (other tabs) and refresh products
    window.addEventListener('storage', (e) => {
        if (e.key === 'productsUpdated') {
            try {
                // Re-fetch current page to reflect changes
                fetchProducts(currentPage);
            } catch (err) {
                console.error('Error refreshing products after update:', err);
            }
        }
    });

    pdGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('pd-view-btn')) {
            const productCard = e.target.closest('.pd-card');
            if (!productCard) return;
            
            const productId = productCard.dataset.productId;
            const fullProduct = products.find((product) => String(product.id) === String(productId));

            if (fullProduct) {
                const productData = {
                    id: fullProduct.id,
                    name: fullProduct.name,
                    price: fullProduct.price,
                    image: normalizeImagePath(fullProduct.image),
                    description: fullProduct.description,
                };

                localStorage.setItem('selectedProduct', JSON.stringify(productData));
                window.location.href = 'product-detail.html';
            }
        }
    });

    (async () => {
        await fetchCategories();
        updateUrlCategory();
        fetchProducts(1);
    })();
});
