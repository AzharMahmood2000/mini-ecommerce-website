document.addEventListener('DOMContentLoaded', () => {
    const pdGrid = document.getElementById('pd-grid');
    const categoryList = document.getElementById('category-list');
    const applyPriceFilterBtn = document.getElementById('apply-price-filter');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const minPriceDisplay = document.getElementById('min-price-display');
    const maxPriceDisplay = document.getElementById('max-price-display');

    if (!pdGrid) return;

    const productDataUrl = '../product.json';
    let allProducts = [];
    let activeCategory = 'all';
    let activeSort = 'relevant';
    let minPrice = 0;
    let maxPrice = 1000000;

    const normalizeImagePath = (imagePath) => {
        if (!imagePath) return '';
        if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('../')) {
            return imagePath;
        }
        return `../${imagePath.replace(/^\.?\//, '')}`;
    };

    const extractPrice = (price) => {
        if (typeof price === 'number') return price;
        const parsed = parseInt(String(price).replace(/[^\d]/g, ''), 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const formatCategoryLabel = (category) => {
        return category
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const getCategoryIcon = (category) => {
        const normalized = category.toLowerCase();

        if (normalized.includes('mobile')) return 'fas fa-mobile-alt';
        if (normalized.includes('audio') || normalized.includes('headphone')) return 'fas fa-headphones-alt';
        if (normalized.includes('gaming')) return 'fas fa-gamepad';
        if (normalized.includes('information') || normalized.includes('computer') || normalized.includes('laptop')) return 'fas fa-laptop';
        return 'fas fa-desktop';
    };

    const introHTML = `
        <div class="intro-block">
            <h2>Technical Excellence</h2>
            <p>Browse our curated selection of high-performance consumer electronics. Engineered for precision and reliability.</p>
        </div>
    `;

    const generateSortHTML = () => `
        <div class="pd-sort-card">
            <div class="sort-container">
                <span class="sort-label">SORT BY:</span>
                <div class="sort-dropdown" id="sort-dropdown">
                    <span class="selected-sort" id="current-sort">MOST RELEVANT</span>
                    <i class="fas fa-chevron-down"></i>
                    <ul class="sort-options" id="sort-options">
                        <li data-sort="relevant">Most Relevant</li>
                        <li data-sort="newest">Newest</li>
                        <li data-sort="low">Price: Low to High</li>
                        <li data-sort="high">Price: High to Low</li>
                        <li data-sort="rated">Best Rated</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    const renderCategoryList = () => {
        if (!categoryList) return;

        const productCategories = [...new Set(
            allProducts
                .filter((product) => product.page === 'product')
                .map((product) => product.category)
        )];

        categoryList.innerHTML = [
            `<li class="${activeCategory === 'all' ? 'active' : ''}" data-category="all"><i class="fas fa-desktop"></i> ALL PRODUCTS</li>`,
            ...productCategories.map((category) => `
                <li class="${activeCategory === category ? 'active' : ''}" data-category="${category}">
                    <i class="${getCategoryIcon(category)}"></i> ${formatCategoryLabel(category)}
                </li>
            `),
        ].join('');

        categoryList.querySelectorAll('li').forEach((item) => {
            item.addEventListener('click', () => {
                activeCategory = item.dataset.category;

                categoryList.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
                item.classList.add('active');

                renderProducts();
            });
        });
    };

    const renderProducts = () => {
        let filteredProducts = allProducts.filter((product) => {
            const matchesPage = product.page === 'product';
            const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
            const priceValue = extractPrice(product.price);
            const matchesPrice = priceValue >= minPrice && priceValue <= maxPrice;

            return matchesPage && matchesCategory && matchesPrice;
        });

        if (activeSort === 'low') {
            filteredProducts.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
        } else if (activeSort === 'high') {
            filteredProducts.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
        } else if (activeSort === 'newest') {
            filteredProducts.sort((a, b) => b.id - a.id);
        } else if (activeSort === 'rated') {
            filteredProducts.sort((a, b) => b.id - a.id);
        }

        let cardsHTML = '';

        filteredProducts.forEach((product) => {
            cardsHTML += `
                <div class="pd-card" data-product-id="${product.id}">
                    <div class="pd-img-container">
                        <img src="${normalizeImagePath(product.image)}" alt="${product.name}">
                    </div>
                    <div class="pd-info">
                        <h3>${product.name}</h3>
                        <p class="price">Rs ${product.price}</p>
                        <button class="pd-view-btn">VIEW PRODUCT</button>
                    </div>
                </div>
            `;
        });

        if (filteredProducts.length === 0) {
            cardsHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">No products found for this filter</p>';
        }

        pdGrid.innerHTML = introHTML + generateSortHTML() + cardsHTML;
        setupSortListeners();
    };

    const setupSortListeners = () => {
        const dropdown = document.getElementById('sort-dropdown');
        const optionsMenu = document.getElementById('sort-options');
        const currentSortText = document.getElementById('current-sort');

        if (!dropdown || !optionsMenu || !currentSortText) return;

        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            optionsMenu.classList.remove('show');
        });

        optionsMenu.querySelectorAll('li').forEach((option) => {
            option.addEventListener('click', (e) => {
                activeSort = e.target.dataset.sort;
                currentSortText.textContent = e.target.textContent.toUpperCase();
                optionsMenu.classList.remove('show');
                renderProducts();
            });
        });
    };

    if (applyPriceFilterBtn) {
        applyPriceFilterBtn.addEventListener('click', () => {
            minPrice = parseInt(minPriceInput.value, 10) || 0;
            maxPrice = parseInt(maxPriceInput.value, 10) || 1000000;

            minPriceDisplay.textContent = `Rs ${minPrice}`;
            maxPriceDisplay.textContent = `Rs ${maxPrice}+`;

            renderProducts();
        });
    }

    fetch(productDataUrl)
        .then((response) => response.json())
        .then((data) => {
            allProducts = data;
            renderCategoryList();
            renderProducts();
        })
        .catch((error) => console.error('Error loading products:', error));

    pdGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('pd-view-btn')) {
            const productCard = e.target.closest('.pd-card');
            const productId = parseInt(productCard.dataset.productId, 10);
            const fullProduct = allProducts.find((product) => product.id === productId);

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
});
