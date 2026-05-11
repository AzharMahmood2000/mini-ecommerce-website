document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.querySelector('.cart-items-section');
    const subtotalEl = document.getElementById('subtotal');
    const grandTotalEl = document.getElementById('grand-total');

    function formatCurrency(amount) {
        return 'Rs. ' + amount.toLocaleString();
    }

    function extractPrice(priceString) {
        // Extract numeric value from price string like "Rs. 300,000"
        return parseInt(priceString.replace(/[^\d]/g, ''));
    }

    // Use static HTML elements for frontend development instead of overwriting them
    function initStaticCart() {
        const cartItems = document.querySelectorAll('.cart-item');
        
        cartItems.forEach((itemElement) => {
            const minusBtn = itemElement.querySelector('.minus');
            const plusBtn = itemElement.querySelector('.plus');
            const removeBtn = itemElement.querySelector('.remove-btn');
            const qtySpan = itemElement.querySelector('.qty-val');
            const priceSpan = itemElement.querySelector('.price-val');
            const basePrice = parseInt(itemElement.getAttribute('data-price'));

            if (minusBtn) {
                minusBtn.addEventListener('click', () => {
                    let qty = parseInt(qtySpan.textContent);
                    if (qty > 1) {
                        qty--;
                        qtySpan.textContent = qty;
                        priceSpan.textContent = (basePrice * qty).toLocaleString();
                        updateSummary();
                    }
                });
            }

            if (plusBtn) {
                plusBtn.addEventListener('click', () => {
                    let qty = parseInt(qtySpan.textContent);
                    qty++;
                    qtySpan.textContent = qty;
                    priceSpan.textContent = (basePrice * qty).toLocaleString();
                    updateSummary();
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to remove this item?')) {
                        itemElement.style.opacity = '0';
                        itemElement.style.transform = 'translateX(-20px)';
                        itemElement.style.transition = 'all 0.3s ease';
                        setTimeout(() => {
                            itemElement.remove();
                            updateSummary();
                            
                            // Show empty message if all items are removed
                            if (document.querySelectorAll('.cart-item').length === 0) {
                                cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #777;">Your cart is empty</p>';
                            }
                        }, 300);
                    }
                });
            }
        });

        updateSummary();
    }

    function updateSummary() {
        const cartItems = document.querySelectorAll('.cart-item');
        let total = 0;
        
        cartItems.forEach(item => {
            const price = parseInt(item.getAttribute('data-price'));
            const qty = parseInt(item.querySelector('.qty-val').textContent);
            const itemTotal = price * qty;
            
            item.querySelector('.price-val').textContent = (itemTotal).toLocaleString();
            total += itemTotal;
        });

        subtotalEl.textContent = formatCurrency(total);
        grandTotalEl.textContent = formatCurrency(total);
    }

    // Initial render using static HTML items
    initStaticCart();

    // Checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = './checkout.html';
        });
    }
});