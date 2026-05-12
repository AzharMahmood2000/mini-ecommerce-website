document.addEventListener('DOMContentLoaded', () => {
    let currentProduct = null;

    const selectedProduct = localStorage.getItem('selectedProduct');

    if (selectedProduct) {
        currentProduct = JSON.parse(selectedProduct);

        const productImage = document.querySelector('.product-image-box img');
        if (productImage) {
            productImage.src = currentProduct.image;
            productImage.alt = currentProduct.name;
        }

        const productTitle = document.getElementById('detail-title');
        if (productTitle) {
            productTitle.textContent = currentProduct.name.toUpperCase();
        }

        const productDesc = document.getElementById('detail-desc');
        if (productDesc && currentProduct.description) {
            productDesc.textContent = currentProduct.description;
        }

        const productPrice = document.getElementById('detail-price');
        if (productPrice) {
            productPrice.textContent = 'PRICE: ' + currentProduct.price;
        }
    } else {
        const productImage = document.querySelector('.product-image-box img');
        const productTitle = document.getElementById('detail-title');
        const productDesc = document.getElementById('detail-desc');
        const productPrice = document.getElementById('detail-price');

        if (productImage && productTitle && productDesc && productPrice) {
            const pageProduct = {
                id: productTitle.textContent.trim().toLowerCase(),
                name: productTitle.textContent.trim(),
                price: productPrice.textContent.replace('PRICE:', '').trim(),
                image: productImage.src,
                description: productDesc.textContent.trim(),
            };

            currentProduct = pageProduct;
        }
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
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if (!currentProduct) {
                alert('Product information not available');
                return;
            }

            const quantity = parseInt(quantityInput.value, 10);
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            const existingItem = cartItems.find(item => item.id === currentProduct.id);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cartItems.push({
                    id: currentProduct.id,
                    name: currentProduct.name,
                    price: currentProduct.price,
                    image: currentProduct.image,
                    quantity: quantity
                });
            }

            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            alert(`Added ${quantity} item(s) to cart!`);
            window.location.href = 'cart.html';
        });
    }

    const buyNowBtn = document.querySelector('.btn-buy-now');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            if (!currentProduct) {
                alert('Product information not available');
                return;
            }

            const quantity = parseInt(quantityInput.value, 10);
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            const existingItem = cartItems.find(item => item.id === currentProduct.id);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cartItems.push({
                    id: currentProduct.id,
                    name: currentProduct.name,
                    price: currentProduct.price,
                    image: currentProduct.image,
                    quantity: quantity
                });
            }

            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            window.location.href = 'checkout.html';
        });
    }
});