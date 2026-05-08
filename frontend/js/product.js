document.addEventListener('DOMContentLoaded', () => {
    const pdGrid = document.getElementById('pd-grid');
    let allProducts = []; // Store all products for reference
    const productDataUrl = '../product.json';

    const normalizeImagePath = (imagePath) => {
        if (!imagePath) return '';
        if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('../')) {
            return imagePath;
        }
        return `../${imagePath.replace(/^\.?\//, '')}`;
    };
    
    if (pdGrid) {
        // Define reusable HTML templates
        const introHTML = `
            <div class="intro-block">
                <h2>Technical Excellence</h2>
                <p>Browse our curated selection of high-performance consumer electronics. Engineered for precision and reliability.</p>
            </div>
        `;
        
        // Function to generate sort HTML with dynamic label
        const generateSortHTML = (label = 'MOST RELEVANT') => `
            <div class="pd-sort-card">
                <div class="sort-container">
                    <span class="sort-label">SORT BY:</span>
                    <div class="sort-dropdown" id="sort-dropdown">
                        <span class="selected-sort" id="current-sort">${label}</span>
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
        
        fetch(productDataUrl)
            .then(response => response.json())
            .then(data =>  {
                allProducts = data; // Store all products
                
                function renderGrid(products) {
                    let cardsHTML = '';
                    // Render only products marked for the 'product' page
                    products.filter(p => p.page === 'product').forEach(product => {
                        cardsHTML += `
                            <div class="pd-card" data-product-id="${product.id}">
                                <div class="pd-img-container">
                                    <img src="${normalizeImagePath(product.image)}" alt="${product.name}">
                                </div>
                                <div class="pd-info">
                                    <h3>${product.name}</h3>
                                    <p class="price">${product.price}</p>
                                    <button class="pd-view-btn">VIEW PRODUCT</button>
                                </div>
                            </div>
                        `;
                    });
                    pdGrid.innerHTML = introHTML + generateSortHTML() + cardsHTML;
                    setupSortListeners(products);
                }

                function setupSortListeners(products) {
                    const dropdown = document.getElementById('sort-dropdown');
                    const optionsMenu = document.getElementById('sort-options');
                    const currentSortText = document.getElementById('current-sort');

                    dropdown.addEventListener('click', (e) => {
                        e.stopPropagation();
                        optionsMenu.classList.toggle('show');
                    });

                    document.addEventListener('click', () => {
                        optionsMenu.classList.remove('show');
                    });

                    optionsMenu.querySelectorAll('li').forEach(option => {
                        option.addEventListener('click', (e) => {
                            const sortType = e.target.dataset.sort;
                            const sortLabel = e.target.textContent.toUpperCase();
                            
                            let sortedProducts = [...products];
                            
                            if (sortType === 'low') {
                                sortedProducts.sort((a, b) => {
                                    const priceA = parseInt(a.price.replace(/[^\d]/g, ''));
                                    const priceB = parseInt(b.price.replace(/[^\d]/g, ''));
                                    return priceA - priceB;
                                });
                            } else if (sortType === 'high') {
                                sortedProducts.sort((a, b) => {
                                    const priceA = parseInt(a.price.replace(/[^\d]/g, ''));
                                    const priceB = parseInt(b.price.replace(/[^\d]/g, ''));
                                    return priceB - priceA;
                                });
                            } else if (sortType === 'newest') {
                                sortedProducts.reverse(); 
                            } else if (sortType === 'rated') {
                                sortedProducts.sort((a, b) => b.id - a.id);
                            }
                            
                            let cardsHTML = '';
                            sortedProducts.filter(p => p.page === 'product').forEach(product => {
                                cardsHTML += `
                                    <div class="pd-card" data-product-id="${product.id}">
                                        <div class="pd-img-container">
                                            <img src="${normalizeImagePath(product.image)}" alt="${product.name}">
                                        </div>
                                        <div class="pd-info">
                                            <h3>${product.name}</h3>
                                            <p class="price">${product.price}</p>
                                            <button class="pd-view-btn">VIEW PRODUCT</button>
                                        </div>
                                    </div>
                                `;
                            });
                            
                            pdGrid.innerHTML = introHTML + generateSortHTML(sortLabel) + cardsHTML;
                            setupSortListeners(products);
                        });
                    });
                }

                renderGrid(data);
            })
            .catch(error => console.error('Error loading products:', error));
        
        // Price range filter functionality
        const applyPriceFilterBtn = document.getElementById('apply-price-filter');
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        const minPriceDisplay = document.getElementById('min-price-display');
        const maxPriceDisplay = document.getElementById('max-price-display');
        
        if (applyPriceFilterBtn) {
            applyPriceFilterBtn.addEventListener('click', () => {
                fetch(productDataUrl)
                    .then(response => response.json())
                    .then(data => {
                        const minPrice = parseInt(minPriceInput.value) || 0;
                        const maxPrice = parseInt(maxPriceInput.value) || 500000;
                        
                        // Update display values
                        minPriceDisplay.textContent = `Rs ${minPrice}`;
                        maxPriceDisplay.textContent = `Rs ${maxPrice}+`;
                        
                        // Filter products by price range
                        let filteredProducts = data.filter(p => {
                            const priceText = p.price.replace(/[^\d]/g, '');
                            const price = parseInt(priceText);
                            return price >= minPrice && price <= maxPrice && p.page === 'product';
                        });
                        
                        // Render filtered products
                        let cardsHTML = '';
                        filteredProducts.forEach(product => {
                            cardsHTML += `
                                <div class="pd-card" data-product-id="${product.id}">
                                    <div class="pd-img-container">
                                        <img src="${normalizeImagePath(product.image)}" alt="${product.name}">
                                    </div>
                                    <div class="pd-info">
                                        <h3>${product.name}</h3>
                                        <p class="price">${product.price}</p>
                                        <button class="pd-view-btn">VIEW PRODUCT</button>
                                    </div>
                                </div>
                            `;
                        });
                        
                        // Show message if no products found
                        if (filteredProducts.length === 0) {
                            cardsHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">No products found in this price range</p>';
                        }
                        
                        pdGrid.innerHTML = introHTML + generateSortHTML() + cardsHTML;
                    });
            });
        }
            
        // Event delegation for dynamically created "VIEW PRODUCT" buttons
        pdGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('pd-view-btn')) {
                const productCard = e.target.closest('.pd-card');
                const productId = parseInt(productCard.dataset.productId);
                
                // Find the full product data by ID
                const fullProduct = allProducts.find(p => p.id === productId);
                
                if (fullProduct) {
                    // Store complete product data in localStorage
                    const productData = {
                        id: fullProduct.id,
                        name: fullProduct.name,
                        price: fullProduct.price,
                        image: normalizeImagePath(fullProduct.image),
                        description: fullProduct.description
                    };
                    localStorage.setItem('selectedProduct', JSON.stringify(productData));
                    
                    // Redirect to product detail page
                    window.location.href = 'product-detail.html';
                }
            }
        });
    }
});
