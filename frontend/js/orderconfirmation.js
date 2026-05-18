document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:5000/api/orders';

    const orderNumberEl = document.getElementById('orderNumber');
    const orderDateEl = document.getElementById('orderDate');
    const orderStatusEl = document.getElementById('orderStatus');
    const paymentMethodEl = document.getElementById('paymentMethod');
    const orderedItemsEl = document.getElementById('orderedItems');
    const shippingAddressEl = document.getElementById('shippingAddress');
    const subtotalEl = document.getElementById('subtotal');
    const shippingCostEl = document.getElementById('shippingCost');
    const taxCostEl = document.getElementById('taxCost');
    const totalPriceEl = document.getElementById('totalPrice');

    const trackBtn = document.querySelector('.btn-primary');
    const continueBtn = document.querySelector('.btn-secondary');

    if (trackBtn) trackBtn.addEventListener('click', () => window.location.href = './orderhistory.html');
    if (continueBtn) continueBtn.addEventListener('click', () => window.location.href = '../index.html');

    function formatCurrency(n) {
        return 'Rs. ' + Number(n || 0).toLocaleString();
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('en-PK', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) { return dateStr; }
    }

    function formatStatus(value) {
        const text = String(value || '-').replace(/_/g, ' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function formatItemTotal(item) {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        return price * quantity;
    }

    function renderShippingAddress(order) {
        const address = order.shippingAddress || {};
        const lines = [
            address.fullName || order.customerName || '-',
            address.address || order.address || '-',
            [address.city, address.state, address.country].filter(Boolean).join(', '),
            address.phone || order.phone || '-',
            address.email || order.email || '-',
        ].filter((line) => line && line !== ', ');

        shippingAddressEl.innerHTML = lines.map((line) => `<p>${line}</p>`).join('');
    }

    function renderItems(order) {
        const items = Array.isArray(order.products) ? order.products : [];
        if (!items.length) {
            orderedItemsEl.innerHTML = '<p style="color:#777;">No items found for this order.</p>';
            return 0;
        }

        orderedItemsEl.innerHTML = items.map((it) => `
            <div class="item">
                <img src="${it.imageUrl || '../assets/images/Home/1.png'}" alt="${it.name || 'Product'}" class="item-img">
                <div class="item-info">
                    <h3>${it.name || 'Product'}</h3>
                    <p class="variant">Qty: ${it.quantity || 1}</p>
                </div>
                <div class="item-price-qty">
                    <span class="price">${formatCurrency(formatItemTotal(it))}</span>
                    <span class="qty">Qty: ${it.quantity || 1}</span>
                </div>
            </div>
        `).join('');

        return items.reduce((sum, item) => sum + formatItemTotal(item), 0);
    }

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId') || localStorage.getItem('lastOrderId');

    if (!orderId) {
        orderNumberEl && (orderNumberEl.textContent = 'Not available');
        return;
    }

    async function loadOrder() {
        const token = localStorage.getItem('authToken');
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};

        try {
            const resp = await fetch(`${API_BASE}/${encodeURIComponent(orderId)}`, { headers });
            const json = await resp.json();
            if (!resp.ok || !json.success) throw new Error(json.message || 'Unable to fetch order');

            const order = json.order;
            console.log('[ORDER CONFIRMATION] Loaded order:', order);

            if (orderNumberEl) orderNumberEl.textContent = `#${order._id || order.id}`;
            if (orderDateEl) orderDateEl.textContent = formatDate(order.createdAt || order.paidAt || order.updatedAt);
            if (orderStatusEl) orderStatusEl.textContent = formatStatus(order.deliveryStatus || order.orderStatus || order.status);
            if (paymentMethodEl) paymentMethodEl.textContent = order.paymentMethod || '-';

            // Items
            if (orderedItemsEl) {
                const subtotal = renderItems(order);
                if (subtotalEl && subtotal > 0) {
                    subtotalEl.textContent = formatCurrency(subtotal);
                }
            }

            // Shipping address
            if (shippingAddressEl) {
                renderShippingAddress(order);
            }

            // Payment summary
            const computedSubtotal = Array.isArray(order.products)
                ? order.products.reduce((sum, item) => sum + formatItemTotal(item), 0)
                : 0;
            const finalSubtotal = computedSubtotal || Number(order.totalAmount || 0);

            if (subtotalEl) subtotalEl.textContent = formatCurrency(finalSubtotal);
            if (shippingCostEl) shippingCostEl.textContent = 'Free';
            if (taxCostEl) taxCostEl.textContent = formatCurrency(0);
            if (totalPriceEl) totalPriceEl.textContent = formatCurrency(order.totalAmount || finalSubtotal);

            // remember for fallback
            try { localStorage.setItem('lastOrderId', order._id || order.id); } catch (e) {}

            // clear local cart since order completed
            try { localStorage.removeItem('cartId'); } catch (e) {}

        } catch (err) {
            console.error('Failed to load order:', err);
            if (orderNumberEl) orderNumberEl.textContent = 'Unable to load order';
        }
    }

    loadOrder();
});