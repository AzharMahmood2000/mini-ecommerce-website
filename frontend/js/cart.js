document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.querySelector('.cart-items-section');
    const subtotalEl = document.getElementById('subtotal');
    const grandTotalEl = document.getElementById('grand-total');
    const checkoutBtn = document.querySelector('.checkout-btn');

    function formatCurrency(amount) {
        return 'Rs. ' + amount.toLocaleString();
    }

    function extractPrice(priceString) {
        if (typeof priceString === 'number') return priceString;
        if (!priceString) return 0;
        // Extract numeric value from price string like "Rs. 300,000" or "Rs 300000"
        return parseInt(String(priceString).replace(/[^\d]/g, ''), 10) || 0;
    }

    // Fetch cart from backend and render
    const apiBase = 'http://localhost:5000/api/cart';

    function setEmptyCartState(message) {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-state">
                    <p>${message}</p>
                </div>
            `;
        }

        if (subtotalEl) subtotalEl.textContent = formatCurrency(0);
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(0);
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.setAttribute('aria-disabled', 'true');
        }
    }

    function setCartHasItemsState() {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.removeAttribute('aria-disabled');
        }
    }

    function setCartErrorState(message) {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-state empty-cart-error">
                    <p>${message}</p>
                </div>
            `;
        }

        if (subtotalEl) subtotalEl.textContent = formatCurrency(0);
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(0);
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.setAttribute('aria-disabled', 'true');
        }
    }

    async function fetchCartFromServer() {
        const cartId = localStorage.getItem('cartId');
        if (!cartId) {
            setEmptyCartState('your cart is empty. Add some products to continue checkout .');
            return;
        }

        try {
            const resp = await fetch(`${apiBase}?cartId=${encodeURIComponent(cartId)}`);
            const data = await resp.json();
            if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to fetch cart');

            const items = (data.cart && Array.isArray(data.cart.items)) ? data.cart.items : [];

            if (!items.length) {
                setEmptyCartState('your cart is empty. Add some products to continue checkout .');
                return;
            }

            setCartHasItemsState();

            cartItemsContainer.innerHTML = items.map(item => {
                const basePrice = extractPrice(item.price);
                const qty = Number(item.quantity) || 1;
                const itemTotal = basePrice * qty;
                const subtitle = item.subtitle || item.description || '';

                return `
                    <div class="cart-item" data-id="${item.productId}" data-price="${basePrice}">
                        <div class="cart-thumb"><img src="${item.image || '../assets/images/Home/1.png'}" alt="${(item.name || '')}"></div>
                        <div class="cart-body">
                            <h4 class="cart-title">${item.name || ''}</h4>
                            <div class="cart-meta">${subtitle ? `<span>${subtitle}</span>` : ''}</div>
                            <div style="height:8px"></div>
                            <div class="cart-actions" style="display:flex;gap:12px;align-items:center;font-size:13px;margin-top:6px;">
                                <button class="btn-remove remove-btn"><i class="fas fa-trash" style="font-size:12px"></i> REMOVE</button>
                            </div>
                        </div>

                        <div class="item-quantity-price">
                            <div class="quantity-control">
                                <button class="qty-btn minus">-</button>
                                <span class="qty-val">${qty}</span>
                                <button class="qty-btn plus">+</button>
                            </div>
                            <div style="margin-top:8px; text-align:right;">
                                <div class="price-val">Rs. ${itemTotal.toLocaleString()}</div>
                                <div class="unit-price">Rs. ${basePrice.toLocaleString()} each</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            attachCartEventHandlers();
            updateSummaryFromServerItems(items);
        } catch (err) {
            console.error('Failed to load cart from server:', err.message || err);
            setCartErrorState('Unable to load your cart right now. Please try again.');
        }
    }

    function attachCartEventHandlers() {
        cartItemsContainer.querySelectorAll('.cart-item').forEach(itemElement => {
            const minusBtn = itemElement.querySelector('.minus');
            const plusBtn = itemElement.querySelector('.plus');
            const removeBtn = itemElement.querySelector('.remove-btn');
            const qtySpan = itemElement.querySelector('.qty-val');

            const itemId = itemElement.getAttribute('data-id');

            if (minusBtn) {
                minusBtn.addEventListener('click', async () => {
                    let qty = parseInt(qtySpan.textContent, 10);
                    if (qty > 1) {
                        qty--;
                        try {
                            await updateItemOnServer(itemId, qty);
                            await fetchCartFromServer();
                        } catch (err) {
                            console.error(err);
                        }
                    }
                });
            }

            if (plusBtn) {
                plusBtn.addEventListener('click', async () => {
                    let qty = parseInt(qtySpan.textContent, 10) || 0;
                    qty++;
                    try {
                        await updateItemOnServer(itemId, qty);
                        await fetchCartFromServer();
                    } catch (err) {
                        console.error(err);
                    }
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', async () => {
                    // Ask user for permission before removing
                    const ok = confirm('Are you sure you want to remove this item from your cart?');
                    if (!ok) return;

                    try {
                        await updateItemOnServer(itemId, 0);
                        // fully refresh the page to reflect updated cart state
                        window.location.reload();
                    } catch (err) {
                        console.error(err);
                        alert(err && err.message ? `Unable to remove item: ${err.message}` : 'Unable to remove item.');
                    }
                });
            }
        });
    }

    async function updateItemOnServer(productId, quantity) {
        const cartId = localStorage.getItem('cartId');
        if (!cartId) throw new Error('No cartId available');

        const item = { productId, quantity };
        const resp = await fetch(apiBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId, item }),
        });

        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to update item');
        return data.cart;
    }

    function updateSummaryFromServerItems(items) {
        let total = 0;
        items.forEach(i => {
            const price = extractPrice(i.price);
            const qty = Number(i.quantity) || 1;
            total += price * qty;
        });

        subtotalEl.textContent = formatCurrency(total);
        grandTotalEl.textContent = formatCurrency(total);
    }

    // Initial render from server
    fetchCartFromServer();

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (event) => {
            if (checkoutBtn.disabled) {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            localStorage.setItem('checkoutMode', 'cart');
            localStorage.removeItem('checkoutItem');
            window.location.href = './checkout.html';
        });
    }
});