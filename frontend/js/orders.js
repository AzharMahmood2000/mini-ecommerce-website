document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:5000/api';
  const tbody = document.querySelector('#ordersTable tbody');
  const orderDetailsModal = document.querySelector('#orderDetailsModal');
  const orderDetailsBody = document.querySelector('#orderDetailsBody');
  const orderDetailsTitle = document.querySelector('#orderDetailsTitle');
  const orderDetailsClose = document.querySelector('#orderDetailsClose');
  const ORDER_STATUS_OPTIONS = [
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  let ordersState = [];
  let activeOrder = null;
  let lockedScrollY = 0;

  const normalizeStatus = (status) => {
    const value = String(status || '').toLowerCase();
    if (['pending', 'processing', 'confirmed'].includes(value)) return 'processing';
    if (['shipped', 'in transit', 'transit'].includes(value)) return 'shipped';
    if (['delivered', 'complete', 'completed'].includes(value)) return 'delivered';
    if (['cancelled', 'canceled', 'cancel'].includes(value)) return 'cancelled';
    return 'processing';
  };

  const getStatusClass = (status) => {
    return `status-${normalizeStatus(status)}`;
  };

  const getStatusLabel = (status) => {
    const match = ORDER_STATUS_OPTIONS.find((option) => option.value === normalizeStatus(status));
    return match ? match.label : 'Pending';
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

  const formatDate = (value) => {
    if (!value) return 'Not available';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Not available';
    return parsed.toLocaleString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderProducts = (order) => {
    if (Array.isArray(order.products) && order.products.length) {
      return order.products.map((product) => ({
        name: product.name || product.title || 'Product',
        qty: Number(product.qty || product.quantity || 1),
        price: Number(product.price || product.subtotal || 0),
      }));
    }

    return [];
  };

  const hydrateOrder = (order) => {
    const products = Array.isArray(order.products) ? order.products : [];
    const shippingAddress = order.shippingAddress || {};

    return {
      id: order._id || order.id,
      customerName: order.customerName || shippingAddress.fullName || order.userId?.username || 'Unknown customer',
      email: order.email || shippingAddress.email || order.userId?.email || 'Not available',
      phone: order.phone || shippingAddress.phone || shippingAddress.mobileNumber || 'Not available',
      address: order.address || shippingAddress.address || 'Not available',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      country: shippingAddress.country || '',
      items: products.length,
      totalAmount: Number(order.totalAmount || 0),
      paymentStatus: order.paymentStatus || 'pending',
      deliveryStatus: normalizeStatus(order.deliveryStatus || order.orderStatus),
      paymentMethod: order.paymentMethod || 'COD',
      orderedAt: order.createdAt || order.updatedAt || null,
      note: order.note || order.message || '',
      products,
    };
  };

  const closeOrderDetails = () => {
    if (!orderDetailsModal) return;
    orderDetailsModal.classList.add('hidden');
    orderDetailsModal.setAttribute('aria-hidden', 'true');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
    activeOrder = null;
  };

  const openOrderDetails = (orderId) => {
    const order = ordersState.find((item) => String(item.id) === String(orderId));
    if (!order || !orderDetailsModal || !orderDetailsBody || !orderDetailsTitle) return;

    activeOrder = order;
    const products = getOrderProducts(order);
    const primaryItem = products[0];

    orderDetailsTitle.textContent = `Order ${order.id}`;
    orderDetailsBody.innerHTML = `
      <div class="order-hero">
        <div>
          <span class="order-id-pill">#${escapeHtml(order.id)}</span>
          <h3>${escapeHtml(order.customerName)}</h3>
          <p>Placed on ${escapeHtml(formatDate(order.orderedAt))}</p>
        </div>
        <span class="order-status-badge ${getStatusClass(order.deliveryStatus)}">${escapeHtml(getStatusLabel(order.deliveryStatus))}</span>
      </div>

      <div class="order-summary-cards">
        <article class="summary-card">
          <span>Items</span>
          <strong>${escapeHtml(String(order.items || products.length || 0))}</strong>
        </article>
        <article class="summary-card">
          <span>Total</span>
          <strong>${escapeHtml(formatCurrency(order.totalAmount))}</strong>
        </article>
        <article class="summary-card">
          <span>Payment Status</span>
          <strong>${escapeHtml(order.paymentStatus)}</strong>
        </article>
        <article class="summary-card">
          <span>Delivery Status</span>
          <strong>${escapeHtml(order.deliveryStatus)}</strong>
        </article>
      </div>

      <div class="order-details-grid">
        <section class="detail-panel">
          <div class="detail-panel-header">
            <h4>Customer</h4>
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="detail-list">
            <div><span>Name</span><strong>${escapeHtml(order.customerName)}</strong></div>
            <div><span>Email</span><strong>${escapeHtml(order.email || 'Not available')}</strong></div>
            <div><span>Phone</span><strong>${escapeHtml(order.phone || 'Not available')}</strong></div>
            <div><span>Address</span><strong>${escapeHtml(order.address || 'Not available')}</strong></div>
          </div>
        </section>

        <section class="detail-panel">
          <div class="detail-panel-header">
            <h4>Payment & Delivery</h4>
            <i class="fa-solid fa-truck-fast"></i>
          </div>
          <div class="detail-list">
            <div><span>Payment method</span><strong>${escapeHtml(order.paymentMethod || 'Not available')}</strong></div>
            <div><span>Payment status</span><strong>${escapeHtml(order.paymentStatus || 'pending')}</strong></div>
            <div><span>Delivery status</span><strong>${escapeHtml(order.deliveryStatus || 'processing')}</strong></div>
            <div><span>Order date</span><strong>${escapeHtml(formatDate(order.orderedAt))}</strong></div>
          </div>
        </section>
      </div>

      <section class="detail-panel detail-panel-wide">
        <div class="detail-panel-header">
          <h4>Items in this order</h4>
          <span>${escapeHtml(String(products.length))} product${products.length === 1 ? '' : 's'}</span>
        </div>
        <div class="items-list">
          ${products.map((product, index) => `
            <div class="item-row">
              <div class="item-index">${escapeHtml(String(index + 1))}</div>
              <div class="item-main">
                <strong>${escapeHtml(product.name)}</strong>
                <span>Qty ${escapeHtml(String(product.qty))}</span>
              </div>
              <div class="item-price">${escapeHtml(formatCurrency(product.price))}</div>
            </div>
          `).join('')}
        </div>
        ${order.note ? `
          <div class="order-note">
            <span>Admin note</span>
            <p>${escapeHtml(order.note)}</p>
          </div>
        ` : ''}
        <div class="order-total-bar">
          <div>
            <span>Primary item</span>
            <strong>${escapeHtml(primaryItem ? primaryItem.name : 'Not available')}</strong>
          </div>
          <div>
            <span>Grand total</span>
            <strong>${escapeHtml(formatCurrency(order.totalAmount))}</strong>
          </div>
        </div>
      </section>
    `;

    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    orderDetailsModal.classList.remove('hidden');
    orderDetailsModal.setAttribute('aria-hidden', 'false');
  };

  // no local mock or storage: admin orders come from server

  const render = (list) => {
    tbody.innerHTML = '';
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px">No orders found</td></tr>'; return; }
    list.forEach(o => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${o.id}</td>
        <td>${escapeHtml(o.customerName)}</td>
        <td>${o.items}</td>
        <td>${escapeHtml(formatCurrency(o.totalAmount))}</td>
        <td>
          <select class="order-status-select ${getStatusClass(o.deliveryStatus)}" data-id="${o.id}">
            ${ORDER_STATUS_OPTIONS.map((option) => `<option value="${option.value}" ${normalizeStatus(o.deliveryStatus) === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
          </select>
        </td>
        <td>${escapeHtml(o.paymentStatus)}</td>
        <td>${escapeHtml(o.deliveryStatus)}</td>
        <td>
          <button class="btn-view" data-id="${o.id}" type="button">
            <i class="fa-solid fa-eye"></i>
            <span>View</span>
          </button>
        </td>
      `;
      tbody.appendChild(tr);

      const statusSelect = tr.querySelector('.order-status-select');
      if (statusSelect) {
        statusSelect.className = `order-status-select ${getStatusClass(o.deliveryStatus)}`;
      }
    });
  };

  const renderOrders = () => {
    render(ordersState);
  };

  const syncStatusById = (orderId, newStatus) => {
    ordersState = ordersState.map((order) => {
      if (String(order.id) !== String(orderId)) return order;
      return {
        ...order,
        deliveryStatus: normalizeStatus(newStatus),
        orderStatus: normalizeStatus(newStatus),
      };
    });
    renderOrders();
  };

  const load = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      const res = await fetch(`${API_BASE_URL}/admin/orders`, { headers });
      const json = await res.json();
      console.log('[ADMIN ORDERS] API response:', json);
      if (res.ok && Array.isArray(json.orders)) {
        ordersState = json.orders.map((order) => hydrateOrder(order));
        renderOrders();
        return;
      }
    } catch (err) {
      console.error('[ADMIN ORDERS] Failed to load orders from API:', err);
    }

    ordersState = [];
    renderOrders();
  };

  tbody.addEventListener('click', (e) => {
    const view = e.target.closest('.btn-view');
    if (view) openOrderDetails(view.dataset.id);
  });

  tbody.addEventListener('change', async (e) => {
    const statusSelect = e.target.closest('.order-status-select');
    if (!statusSelect) return;
    const orderId = statusSelect.dataset.id;
    const newStatus = statusSelect.value;

    // send update to server (admin)
    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const resp = await fetch(`${API_BASE_URL}/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.message || 'Failed to update status');

      syncStatusById(orderId, newStatus);
    } catch (err) {
      alert('Unable to update order status: ' + (err.message || err));
      // revert select to previous value from local state
      const local = ordersState.find(o => String(o.id) === String(orderId));
      if (local) statusSelect.value = local.deliveryStatus || 'processing';
    }
  });

  orderDetailsClose?.addEventListener('click', closeOrderDetails);
  orderDetailsModal?.querySelector('.modal-overlay')?.addEventListener('click', closeOrderDetails);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !orderDetailsModal?.classList.contains('hidden')) {
      closeOrderDetails();
    }
  });

  load();
});
