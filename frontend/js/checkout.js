document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    const shippingForm = document.getElementById('shipping-form');
    const paymentForm = document.getElementById('payment-form');
    const shippingInputs = shippingForm ? shippingForm.querySelectorAll('input') : [];
    const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
    const cardDetails = document.getElementById('card-details');
    const bankDetails = document.getElementById('bank-details');
    const codDetails = document.getElementById('cod-details');
    const placeOrderBtn = document.querySelector('.place-order-btn');
    const summaryItemsEl = document.getElementById('summaryItems');
    const summaryItemCountEl = document.getElementById('summaryItemCount');
    const summarySubtotalEl = document.getElementById('summarySubtotal');
    const summaryShippingEl = document.getElementById('summaryShipping');
    const summaryTotalEl = document.getElementById('summaryTotal');

    if (!shippingInputs.length || !paymentForm || !placeOrderBtn || !cardDetails || !bankDetails || !codDetails || !summaryItemsEl) {
        console.warn('Checkout form elements are missing from the DOM.');
        return;
    }

    const formatCurrency = (value) => `Rs.${Number(value || 0).toLocaleString()}`;

    const getCartId = () => localStorage.getItem('cartId');
    const getCheckoutMode = () => localStorage.getItem('checkoutMode') || 'cart';

    const getCheckoutItem = () => {
        try {
            const raw = localStorage.getItem('checkoutItem');
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    };

    const setSummaryEmpty = (message) => {
        summaryItemsEl.innerHTML = `<p class="summary-empty">${message}</p>`;
        if (summaryItemCountEl) summaryItemCountEl.textContent = '(0 items)';
        if (summarySubtotalEl) summarySubtotalEl.textContent = formatCurrency(0);
        if (summaryTotalEl) summaryTotalEl.textContent = formatCurrency(0);
        if (summaryShippingEl) summaryShippingEl.textContent = 'FREE';
        placeOrderBtn.disabled = true;
        placeOrderBtn.style.opacity = '0.6';
        placeOrderBtn.style.cursor = 'not-allowed';
    };

    const enablePlaceOrder = () => {
        placeOrderBtn.disabled = false;
        placeOrderBtn.style.opacity = '1';
        placeOrderBtn.style.cursor = 'pointer';
    };

    const renderSummary = async () => {
        const mode = getCheckoutMode();

        if (mode === 'buyNow') {
            const item = getCheckoutItem();
            if (!item || !item.productId) {
                setSummaryEmpty('No selected item found for checkout.');
                return [];
            }

            const quantity = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const subtotal = quantity * price;

            summaryItemsEl.innerHTML = `
                <div class="summary-item">
                    <div class="item-thumb">
                        <img src="${item.image || '../assets/images/Home/1.png'}" alt="${item.name || 'Product'}">
                    </div>
                    <div class="item-info">
                        <h4>${item.name || 'Product'}</h4>
                        <p class="qty">QTY: ${quantity}</p>
                        <span class="price">${formatCurrency(subtotal)}</span>
                    </div>
                </div>
            `;

            if (summaryItemCountEl) summaryItemCountEl.textContent = '(1 item)';
            if (summarySubtotalEl) summarySubtotalEl.textContent = formatCurrency(subtotal);
            if (summaryShippingEl) summaryShippingEl.textContent = 'FREE';
            if (summaryTotalEl) summaryTotalEl.textContent = formatCurrency(subtotal);

            enablePlaceOrder();
            return [item];
        }

        const cartId = getCartId();

        if (!cartId) {
            setSummaryEmpty('Your cart is empty. Add products before checkout.');
            return [];
        }

        try {
            const res = await fetch(`${API_BASE_URL}/cart?cartId=${encodeURIComponent(cartId)}`);
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || 'Unable to load cart');
            }

            const items = Array.isArray(json.cart?.items) ? json.cart.items : [];
            if (!items.length) {
                setSummaryEmpty('Your cart is empty.');
                return [];
            }

            const subtotal = items.reduce((sum, item) => {
                const quantity = Number(item.quantity) || 1;
                const price = Number(String(item.price || 0).replace(/[^0-9.-]+/g, '')) || 0;
                return sum + (quantity * price);
            }, 0);

            summaryItemsEl.innerHTML = items.map((item) => {
                const quantity = Number(item.quantity) || 1;
                const price = Number(String(item.price || 0).replace(/[^0-9.-]+/g, '')) || 0;
                const total = quantity * price;
                return `
                    <div class="summary-item">
                        <div class="item-thumb">
                            <img src="${item.image || '../assets/images/Home/1.png'}" alt="${item.name || 'Product'}">
                        </div>
                        <div class="item-info">
                            <h4>${item.name || 'Product'}</h4>
                            <p class="qty">QTY: ${quantity}</p>
                            <span class="price">${formatCurrency(total)}</span>
                        </div>
                    </div>
                `;
            }).join('');

            if (summaryItemCountEl) summaryItemCountEl.textContent = `(${items.length} item${items.length === 1 ? '' : 's'})`;
            if (summarySubtotalEl) summarySubtotalEl.textContent = formatCurrency(subtotal);
            if (summaryShippingEl) summaryShippingEl.textContent = 'FREE';
            if (summaryTotalEl) summaryTotalEl.textContent = formatCurrency(subtotal);

            enablePlaceOrder();
            return items;
        } catch (error) {
            console.error('Failed to render checkout summary:', error);
            setSummaryEmpty('Unable to load cart items.');
            return [];
        }
    };

    const isShippingFormComplete = () => Array.from(shippingInputs).every(input => input.value.trim() !== '');

    const togglePaymentDetails = () => {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');

        cardDetails.classList.remove('active');
        bankDetails.classList.remove('active');
        codDetails.classList.remove('active');

        if (!selectedMethod) {
            return;
        }

        if (selectedMethod.value === 'card') {
            cardDetails.classList.add('active');
        } else if (selectedMethod.value === 'bank') {
            bankDetails.classList.add('active');
        } else if (selectedMethod.value === 'cod') {
            codDetails.classList.add('active');
        }
    };

    const validatePaymentForm = () => {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');

        if (!selectedMethod) {
            alert('Please select a payment method.');
            return false;
        }

        if (selectedMethod.value === 'card') {
            const cardholderName = cardDetails.querySelector('input[placeholder="JOHN SMITH"]');
            const cardNumber = cardDetails.querySelector('input[placeholder="1234 5678 9012 3456"]');
            const expiryDate = cardDetails.querySelector('input[placeholder="MM/YY"]');
            const cvv = cardDetails.querySelector('input[placeholder="123"]');

            if (!cardholderName.value.trim()) {
                alert('Please enter cardholder name');
                return false;
            }
            if (!cardNumber.value.trim() || cardNumber.value.replace(/\s/g, '').length < 13) {
                alert('Please enter a valid card number');
                return false;
            }
            if (!expiryDate.value.trim()) {
                alert('Please enter expiry date (MM/YY)');
                return false;
            }
            if (!cvv.value.trim() || cvv.value.length < 3) {
                alert('Please enter a valid CVV');
                return false;
            }
        }

        return true;
    };

    shippingInputs.forEach((input) => {
        input.addEventListener('input', () => {
            if (isShippingFormComplete()) {
                togglePaymentDetails();
            }
        });
    });

    paymentMethodRadios.forEach((radio) => {
        radio.addEventListener('change', togglePaymentDetails);
    });

    placeOrderBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        console.log(' [START] Place Order button clicked');

        if (!isShippingFormComplete()) {
            console.warn('  Shipping form is incomplete');
            alert('Please complete your shipping information before placing the order.');
            return;
        }

        if (!validatePaymentForm()) {
            console.warn('  Payment form validation failed');
            return;
        }

        console.log(' All form validations passed');

        placeOrderBtn.disabled = true;
        const originalHtml = placeOrderBtn.innerHTML;
        placeOrderBtn.innerHTML = 'Processing... <i class="fas fa-spinner fa-spin"></i>';

        try {
            const items = await renderSummary();
            if (!items.length) throw new Error('Your cart is empty. Cannot place order.');

            const orderItems = items.map(i => ({
                productId: i.productId || i._id,
                name: i.name || i.title || 'Product',
                quantity: Number(i.quantity) || 1,
                price: Number(String(i.price || 0).replace(/[^0-9.-]+/g, '')) || 0
            }));

            const shippingAddress = {
                fullName: shippingForm.querySelector('input[type="text"]')?.value.trim() || 'Customer',
                email: shippingForm.querySelector('input[type="email"]')?.value.trim() || '',
                address: shippingForm.querySelector('input[placeholder="124 scot mawatha"]')?.value.trim() || '',
                city: shippingForm.querySelector('input[placeholder="colombo"]')?.value.trim() || '',
                state: shippingForm.querySelector('input[placeholder="western"]')?.value.trim() || '',
                country: shippingForm.querySelector('input[placeholder="country"]')?.value.trim() || 'Sri Lanka',
                phone: shippingForm.querySelector('input[placeholder="076-5676789"]')?.value.trim() || ''
            };
            
            console.log(' Shipping address prepared:', shippingAddress);

            const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'card';
            const totalPrice = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const payload = {
                products: orderItems,
                shippingAddress,
                paymentMethod,
                totalAmount: totalPrice,
            };

            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('Please log in to place an order.');
                window.location.href = './login.html';
                return;
            }
            
            const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

            console.log(' [DEBUG] Submitting Order Payload:', JSON.stringify(payload, null, 2));

            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            console.log(" [DEBUG] Status:", response.status);
            console.log(" [DEBUG] OK:", response.ok);
            console.log(" [DEBUG] Data:", data);

            if (!response.ok) {
                throw new Error(data.message || "Order placement failed. Please try again.");
            }

            // determine order id from response (support multiple shapes)
            const orderId = (data && (data.order?._id || data._id || data.orderId || data.id));

            alert('Order created successfully');

            try {
                if (orderId) {
                    localStorage.setItem('lastOrderId', orderId);
                }
                localStorage.removeItem('checkoutMode');
                localStorage.removeItem('checkoutItem');

                placeOrderBtn.innerHTML = 'Order Confirmed <i class="fas fa-check"></i>';
                placeOrderBtn.style.background = '#0d9488';

                // redirect to confirmation page
                setTimeout(() => {
                    if (orderId) {
                        window.location.href = `./orderconfirmation.html?orderId=${encodeURIComponent(orderId)}`;
                    } else {
                        window.location.href = './orderconfirmation.html';
                    }
                }, 400);
            } catch (postSuccessError) {
                console.error('❌ [ERROR] Error after successful order placement:', postSuccessError);
                alert('Order was placed, but there was an issue redirecting you. Please check your order history.');
            }

        } catch (err) {
            console.error('❌ [ERROR] Place order failed:', err);
            alert('Unable to place order: ' + (err.message || String(err)));
            
            placeOrderBtn.disabled = false;
            placeOrderBtn.style.opacity = '1';
            placeOrderBtn.innerHTML = originalHtml;
        }
    });

    togglePaymentDetails();
    renderSummary();
});