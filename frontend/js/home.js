document.addEventListener('DOMContentLoaded', () => {
    const featureGrid = document.getElementById('feature-grid');
    const featureModal = document.getElementById('feature-modal');
    const featureModalTitle = document.getElementById('feature-modal-title');
    const featureModalText = document.getElementById('feature-modal-text');
    const featureModalClose = document.getElementById('feature-modal-close');
    const featureModalBackdrop = document.getElementById('feature-modal-backdrop');
    const featureApiUrl = 'http://localhost:5000/api/features';
    const featureOrder = ['safe_payment', 'easy_exchange', 'fast_delivery'];
    const featureCache = new Map();
    const fallbackFeatures = [
        { key: 'safe_payment', title: 'SAFE PAYMENT', message: 'Your payments are 100% secure and encrypted.' },
        { key: 'easy_exchange', title: 'EASY EXCHANGES', message: 'Easy return and replacement within 7 days.' },
        { key: 'fast_delivery', title: 'FAST DELIVERY', message: 'We deliver products within 24–48 hours.' },
    ];

    const openFeatureModal = (feature) => {
        if (!featureModal || !featureModalTitle || !featureModalText) return;

        featureModalTitle.textContent = feature?.title || 'Feature';
        featureModalText.textContent = feature?.description || feature?.message || 'No message available.';
        featureModal.classList.remove('hidden');
        featureModal.setAttribute('aria-hidden', 'false');
    };

    const closeFeatureModal = () => {
        if (!featureModal) return;

        featureModal.classList.add('hidden');
        featureModal.setAttribute('aria-hidden', 'true');
    };

    const setActiveFeature = (key) => {
        if (!featureGrid) return;

        featureGrid.querySelectorAll('.service-feature').forEach((card) => {
            card.classList.toggle('is-active', String(card.dataset.featureKey) === String(key));
        });
    };

    const renderFeatures = (features) => {
        if (!featureGrid) return;

        const orderedFeatures = Array.isArray(features)
            ? featureOrder.map((key) => features.find((feature) => String(feature.key) === key)).filter(Boolean)
            : [];

        if (!orderedFeatures.length) {
            featureGrid.innerHTML = fallbackFeatures.map((feature) => `
                <button type="button" class="service-feature" data-feature-key="${feature.key}" aria-label="${feature.title}">
                    <span class="service-dot" aria-hidden="true"></span>
                    <span class="service-label">${feature.title}</span>
                </button>
            `).join('');
            return;
        }

        featureGrid.innerHTML = orderedFeatures.map((feature) => `
            <button type="button" class="service-feature" data-feature-key="${feature.key}" aria-label="${feature.title || 'Feature'}">
                <span class="service-dot" aria-hidden="true"></span>
                <span class="service-label">${feature.title || 'Untitled Feature'}</span>
            </button>
        `).join('');
    };

    const fetchFeatures = async () => {
        if (!featureGrid) return;

        try {
            const response = await fetch(featureApiUrl);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to load features');
            }

            const features = Array.isArray(data.features) ? data.features : [];
            features.forEach((feature) => {
                const normalizedFeature = {
                    ...feature,
                    description: feature.description || feature.message || '',
                };
                featureCache.set(String(feature.key), normalizedFeature);
            });

            renderFeatures(features);
        } catch (error) {
            console.error('Error loading homepage features:', error.message);
            fallbackFeatures.forEach((feature) => featureCache.set(feature.key, {
                ...feature,
                description: feature.message,
            }));
            renderFeatures(fallbackFeatures);
        }
    };

    // Search functionality
    const searchBtn = document.querySelector('.search-wrapper button');
    const searchInput = document.querySelector('.search-wrapper input');

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            console.log(`Searching for: ${query}`);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Fetch and render products
    const productGrid = document.querySelector('.product-grid');
    let homeProducts = [];

    const resolveImageUrl = (imagePath) => {
        if (!imagePath) return 'assets/images/Home/1.png';
        if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('data:')) return imagePath;
        if (imagePath.startsWith('/uploads/')) return `http://localhost:5000${imagePath}`;
        if (imagePath.startsWith('uploads/')) return `http://localhost:5000/${imagePath}`;
        if (imagePath.startsWith('../') || imagePath.startsWith('./') || imagePath.startsWith('assets/')) return imagePath;
        return `assets/${imagePath.replace(/^\/?assets\//, '')}`;
    };

    const formatPrice = (price) => {
        const amount = Number(price);
        if (Number.isNaN(amount)) return 'Rs 0';
        return `Rs ${amount.toLocaleString()}`;
    };

    const fetchHomeProducts = async () => {
        if (!productGrid) return;

        try {
            const response = await fetch('http://localhost:5000/api/home-products');
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to load home products');
            }

            homeProducts = Array.isArray(data.products) ? data.products : [];
            productGrid.innerHTML = '';

            if (!homeProducts.length) {
                productGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#6b7280;">No featured products available right now.</p>';
                return;
            }

            homeProducts.forEach((product) => {
                const productId = product._id || product.id;
                const imageFromArray = Array.isArray(product.imageUrls) && product.imageUrls.length ? product.imageUrls[0] : '';
                const imageSrc = resolveImageUrl(product.imageUrl || imageFromArray);

                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.dataset.productId = String(productId);

                productCard.innerHTML = `
                    <div class="img-container">
                        <img src="${imageSrc}" alt="${product.name || 'Product'}" onerror="this.src='assets/images/Home/1.png'">
                    </div>
                        <div class="product-info">
                            <h3>${product.name || 'Unnamed Product'}</h3>
                            <p class="price">${formatPrice(product.price)}</p>
                            <button class="view-btn">VIEW DETAILS</button>
                        </div>
                `;

                productGrid.appendChild(productCard);
            });
        } catch (error) {
            console.error('Error loading home products:', error.message);
            productGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#dc2626;">Unable to load featured products right now.</p>';
        }
    };

    if (productGrid) {
        fetchHomeProducts();

        window.addEventListener('storage', (e) => {
            if (e.key === 'productsUpdated') {
                fetchHomeProducts();
            }
        });

        productGrid.addEventListener('click', (e) => {
            if (!e.target.classList.contains('view-btn')) return;

            const productCard = e.target.closest('.product-card');
            if (!productCard) return;

            const productId = String(productCard.dataset.productId || '');
            const fullProduct = homeProducts.find((product) => String(product._id || product.id) === productId);

            if (fullProduct) {
                const imageFromArray = Array.isArray(fullProduct.imageUrls) && fullProduct.imageUrls.length ? fullProduct.imageUrls[0] : '';

                const productData = {
                    id: fullProduct._id || fullProduct.id,
                    name: fullProduct.name,
                    price: formatPrice(fullProduct.price),
                    image: resolveImageUrl(fullProduct.imageUrl || imageFromArray),
                    description: fullProduct.description || '',
                };

                localStorage.setItem('selectedProduct', JSON.stringify(productData));
                // Navigate to product detail and include product id in query for reliable fetching
                window.location.href = `pages/product-detail.html?id=${encodeURIComponent(productData.id)}`;
            }
        });
    }

    if (featureGrid) {
        fallbackFeatures.forEach((feature) => featureCache.set(feature.key, {
            ...feature,
            description: feature.message,
        }));
        renderFeatures(fallbackFeatures);
        fetchFeatures();

        featureGrid.addEventListener('click', async (event) => {
            const card = event.target.closest('.service-feature');
            if (!card) return;

            const featureKey = String(card.dataset.featureKey || '').trim();
            if (!featureKey) return;

            setActiveFeature(featureKey);

            try {
                const response = await fetch(`${featureApiUrl}/${featureKey}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Failed to load feature message');
                }

                const feature = data.feature || featureCache.get(featureKey);
                if (feature) {
                    featureCache.set(featureKey, {
                        ...feature,
                        description: feature.description || feature.message || '',
                    });
                    openFeatureModal(featureCache.get(featureKey));
                }
            } catch (error) {
                console.error('Error loading feature message:', error.message);
                const fallbackFeature = featureCache.get(featureKey);
                if (fallbackFeature) {
                    openFeatureModal(fallbackFeature);
                }
            }
        });

        featureGrid.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            const card = event.target.closest('.service-feature');
            if (!card) return;

            event.preventDefault();
            card.click();
        });

        if (featureModalClose) {
            featureModalClose.addEventListener('click', closeFeatureModal);
        }

        if (featureModalBackdrop) {
            featureModalBackdrop.addEventListener('click', closeFeatureModal);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeFeatureModal();
            }
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'featuresUpdated') {
                fetchFeatures();
            }
        });
    }
});
