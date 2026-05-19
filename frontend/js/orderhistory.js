document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api/orders';
    const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later';
    const tabButtons = document.querySelectorAll('.tab-btn');
    const pageArrows = document.querySelectorAll('.page-arrow');
    const ordersTableBody = document.getElementById('ordersTableBody');
    const ordersStatus = document.getElementById('ordersStatus');
    const ordersSummaryText = document.getElementById('ordersSummaryText');
    const activeOrdersCount = document.getElementById('activeOrdersCount');
    const inTransitOrdersCount = document.getElementById('inTransitOrdersCount');
    const totalPurchasesCount = document.getElementById('totalPurchasesCount');

    const ORDER_STATUS_MAP = {
        pending: { label: 'Pending', className: 'status-pending' },
        processing: { label: 'Processing', className: 'status-processing' },
        shipped: { label: 'Shipped', className: 'status-shipped' },
        delivered: { label: 'Delivered', className: 'status-delivered' },
        cancelled: { label: 'Cancelled', className: 'status-cancelled' },
    };

    const escapeHtml = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

    const formatDate = (value) => {
        if (!value) return 'Not available';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Not available';

        return parsed.toLocaleDateString('en-PK', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const normalizeStatus = (status) => {
        const value = String(status || '').toLowerCase();
        if (['pending', 'processing', 'confirmed'].includes(value)) return 'processing';
        if (['shipped', 'in transit', 'transit'].includes(value)) return 'shipped';
        if (['delivered', 'complete', 'completed'].includes(value)) return 'delivered';
        if (['cancelled', 'canceled', 'cancel'].includes(value)) return 'cancelled';
        return 'pending';
    };

    const getOrderStatusMeta = (status) => {
        const normalized = normalizeStatus(status);
        return ORDER_STATUS_MAP[normalized] || ORDER_STATUS_MAP.pending;
    };

    const getOrderProducts = (order) => Array.isArray(order.products) ? order.products : [];

    const setStatusBanner = (type, message) => {
        if (!ordersStatus) return;

        if (!message) {
            ordersStatus.innerHTML = '';
            return;
        }

        const className = type === 'error'
            ? 'table-state-error'
            : type === 'empty'
                ? 'table-state-empty'
                : 'table-state-loading';

        ordersStatus.innerHTML = `<div class="table-state ${className}">${escapeHtml(message)}</div>`;
    };

    const renderProductsCell = (order) => {
        const products = getOrderProducts(order);

        if (!products.length) {
            return '<div class="product-stack"><span class="product-chip">No products</span></div>';
        }

        const visibleProducts = products.slice(0, 2);
        const extraCount = products.length - visibleProducts.length;

        const chips = visibleProducts.map((product) => {
            const name = escapeHtml(product.name || 'Product');
            const quantity = escapeHtml(String(product.quantity || 1));
            return `<span class="product-chip"><strong>${name}</strong><span class="chip-qty">× ${quantity}</span></span>`;
        }).join('');

        const moreChip = extraCount > 0
            ? `<span class="more-items">+${escapeHtml(String(extraCount))}</span>`
            : '';

        return `<div class="product-stack">${chips}${moreChip}</div>`;
    };

    const renderState = (type, message) => {
        if (!ordersTableBody) return;
        setStatusBanner(type, message);

        const className = type === 'error'
            ? 'table-state-error'
            : type === 'empty'
                ? 'table-state-empty'
                : 'table-state-loading';

        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="table-state ${className}">${escapeHtml(message)}</div>
                </td>
            </tr>
        `;
    };

    const updateStats = (orders) => {
        const activeOrders = orders.filter((order) => {
            const normalized = normalizeStatus(order.deliveryStatus || order.orderStatus || order.status);
            return normalized === 'processing' || normalized === 'shipped';
        }).length;

        const inTransitOrders = orders.filter((order) => normalizeStatus(order.deliveryStatus || order.orderStatus || order.status) === 'shipped').length;

        if (activeOrdersCount) activeOrdersCount.textContent = String(activeOrders);
        if (inTransitOrdersCount) inTransitOrdersCount.textContent = String(inTransitOrders);
        if (totalPurchasesCount) totalPurchasesCount.textContent = String(orders.length);
        if (ordersSummaryText) {
            ordersSummaryText.textContent = orders.length === 0
                ? 'No orders yet'
                : `Showing ${orders.length} of ${orders.length} orders`;
        }
    };

    const renderOrders = (orders) => {
        if (!ordersTableBody) return;

        if (!orders.length) {
            renderState('empty', 'No orders found for this account yet.');
            updateStats([]);
            return;
        }

        setStatusBanner('', '');

        ordersTableBody.innerHTML = orders.map((order) => {
            const orderId = order._id || order.id;
            const statusMeta = getOrderStatusMeta(order.deliveryStatus || order.orderStatus || order.status);

            return `
                <tr>
                    <td class="order-id">#${escapeHtml(orderId)}</td>
                    <td class="order-date">${escapeHtml(formatDate(order.createdAt || order.updatedAt))}</td>
                    <td>${renderProductsCell(order)}</td>
                    <td><span class="badge ${statusMeta.className}">${escapeHtml(statusMeta.label)}</span></td>
                    <td class="order-total">${escapeHtml(formatCurrency(order.totalAmount))}</td>
                    <td class="order-action"><a href="orderconfirmation.html?orderId=${encodeURIComponent(orderId)}">View Details <i class="fas fa-chevron-right"></i></a></td>
                </tr>
            `;
        }).join('');

        updateStats(orders);
    };

    const loadOrders = async () => {
        const token = localStorage.getItem('authToken');

        if (!token) {
            renderState('error', 'Please sign in to view your order history.');
            updateStats([]);
            return;
        }

        renderState('loading', 'Loading your orders...');

        try {
            const response = await fetch(`${API_BASE_URL}/my`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get('content-type') || '';
            const data = contentType.includes('application/json')
                ? await response.json()
                : {};

            if (!response.ok || !data.success) {
                throw new Error(data.message || GENERIC_ERROR_MESSAGE);
            }

            renderOrders(Array.isArray(data.orders) ? data.orders : []);
        } catch (error) {
            console.error('[ORDER HISTORY] Failed to load orders:', error);
            renderState('error', GENERIC_ERROR_MESSAGE);
            updateStats([]);
        }
    };

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            tabButtons.forEach((tabButton) => tabButton.classList.remove('active'));
            button.classList.add('active');
        });
    });

    pageArrows.forEach((arrow) => {
        arrow.addEventListener('click', () => {
            arrow.style.transform = 'scale(0.9)';
            setTimeout(() => {
                arrow.style.transform = 'scale(1)';
            }, 100);
        });
    });

    loadOrders();
});