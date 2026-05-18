document.addEventListener('DOMContentLoaded', () => {
    let currentProduct = null;

    // Helper to resolve image URL similar to homepage logic
    const resolveImageUrl = (imagePath) => {
        if (!imagePath) return '../assets/images/Home/1.png';
        if (/^(https?:)?\/.\//.test(imagePath) || imagePath.startsWith('data:')) return imagePath;
        if (imagePath.startsWith('/uploads/')) return `http://localhost:5000${imagePath}`;
        if (imagePath.startsWith('uploads/')) return `http://localhost:5000/${imagePath}`;
        if (imagePath.startsWith('../') || imagePath.startsWith('./') || imagePath.startsWith('assets/')) return imagePath;
        return `../assets/${imagePath.replace(/^\/?assets\//, '')}`;
    };

    const formatPrice = (price) => {
        const amount = Number(price);
        if (Number.isNaN(amount)) return 'Rs 0';
        return `Rs ${amount.toLocaleString()}`;
    };

    const urlParams = new URLSearchParams(window.location.search);
    const productIdFromUrl = urlParams.get('id');

    const selectedProduct = localStorage.getItem('selectedProduct');

    // If there's an id in URL, try to fetch fresh product data from API
    const populateFromApi = async (id) => {
        try {
            const resp = await fetch(`http://localhost:5000/api/products/${encodeURIComponent(id)}`);
            const data = await resp.json();
            if (!resp.ok || !data) throw new Error(data?.message || 'Product not found');

            const p = data.product || data;
            currentProduct = {
                id: p._id || p.id,
                name: p.name || '',
                price: formatPrice(p.price),
                image: resolveImageUrl(p.imageUrl || (Array.isArray(p.imageUrls) && p.imageUrls[0]) || ''),
                description: p.description || '',
            };

            applyProductToPage(currentProduct);
            // store for fallback or further actions
            localStorage.setItem('selectedProduct', JSON.stringify(currentProduct));
        } catch (err) {
            console.error('Failed to fetch product by id:', err.message || err);
            // fallback to localStorage or page defaults
            if (selectedProduct) {
                currentProduct = JSON.parse(selectedProduct);
                applyProductToPage(currentProduct);
            }
        }
    };

    const applyProductToPage = (product) => {
        const productImage = document.querySelector('.product-image-box img');
        if (productImage) {
            productImage.src = product.image;
            productImage.alt = product.name;
        }

        const productTitle = document.getElementById('detail-title');
        if (productTitle) {
            productTitle.textContent = (product.name || '').toUpperCase();
        }

        const productDesc = document.getElementById('detail-desc');
        if (productDesc) {
            productDesc.textContent = product.description || '';
        }

        const productPrice = document.getElementById('detail-price');
        if (productPrice) {
            productPrice.textContent = 'PRICE: ' + (product.price || formatPrice(product.price));
        }
    };

    if (productIdFromUrl) {
        populateFromApi(productIdFromUrl);
    } else if (selectedProduct) {
        currentProduct = JSON.parse(selectedProduct);
        applyProductToPage(currentProduct);
    }

    const qtyPlusBtn = document.getElementById('qty-plus');
    const qtyMinusBtn = document.getElementById('qty-minus');
    const quantityInput = document.getElementById('qty-input');

    if (qtyPlusBtn) {
        qtyPlusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value, 10);
            if (currentValue < 10) {
                quantityInput.value = currentValue + 1;
            }
        });
    }

    if (qtyMinusBtn) {
        qtyMinusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value, 10);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
    }

    if (quantityInput) {
        quantityInput.addEventListener('change', () => {
            const value = parseInt(quantityInput.value, 10);
            if (value < 1) {
                quantityInput.value = 1;
            } else if (value > 10) {
                quantityInput.value = 10;
            }
        });
    }

    const addToCartBtn = document.querySelector('.btn-add-cart');
    const apiBase = 'http://localhost:5000/api/cart';

    const addItemToServerCart = async (item) => {
        try {
            const cartId = localStorage.getItem('cartId');
            const resp = await fetch(apiBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartId, item }),
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                // Attach server message when available to help debugging in UI
                const msg = data && data.message ? data.message : (resp.statusText || 'Failed to add to cart');
                throw new Error(msg);
            }

            // persist cartId returned by server
            if (data.cartId) localStorage.setItem('cartId', data.cartId);
            return data.cart;
        } catch (err) {
            console.error('Add to server cart failed:', err.message || err);
            throw err;
        }
    };

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', async () => {
            if (!currentProduct) {
                alert('Product information not available');
                return;
            }

            if (!currentProduct.id) {
                alert('Product identifier is missing. Please open the product details from the product page and try again.');
                return;
            }

            const quantity = parseInt(quantityInput.value, 10) || 1;

            const item = {
                productId: currentProduct.id,
                name: currentProduct.name,
                price: Number(String(currentProduct.price).replace(/[^0-9.-]+/g, '')) || 0,
                image: currentProduct.image,
                quantity,
            };
            try {
                await addItemToServerCart(item);
                alert(`Added ${quantity} item(s) to cart!`);
                window.location.href = 'cart.html';
            } catch (err) {
                // Show server-provided message when possible
                alert(err && err.message ? `Unable to add to cart: ${err.message}` : 'Unable to add to cart. Please try again.');
            }
        });
    }

    const buyNowBtn = document.querySelector('.btn-buy-now');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async () => {
            if (!currentProduct) {
                alert('Product information not available');
                return;
            }

            const quantity = parseInt(quantityInput.value, 10) || 1;
            const item = {
                productId: currentProduct.id,
                name: currentProduct.name,
                price: Number(String(currentProduct.price).replace(/[^0-9.-]+/g, '')) || 0,
                image: currentProduct.image,
                quantity,
            };

            try {
                localStorage.setItem('checkoutMode', 'buyNow');
                localStorage.setItem('checkoutItem', JSON.stringify(item));
                window.location.href = 'checkout.html';
            } catch (err) {
                alert('Unable to proceed to checkout. Please try again.');
            }
        });
    }
});