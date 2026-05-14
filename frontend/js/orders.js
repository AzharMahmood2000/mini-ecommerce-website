document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:5000/api';
  const tbody = document.querySelector('#ordersTable tbody');
  const orderDetailsModal = document.querySelector('#orderDetailsModal');
  const orderDetailsBody = document.querySelector('#orderDetailsBody');
  const orderDetailsTitle = document.querySelector('#orderDetailsTitle');
  const orderDetailsClose = document.querySelector('#orderDetailsClose');
  const ORDER_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  const STORAGE_KEY = 'adminOrdersState';

  const mock = [];
  for (let i = 1; i <= 8; i++) {
    mock.push({
      id: 'ORD' + (2000 + i),
      customer: 'Customer ' + i,
      email: `customer${i}@mail.com`,
      phone: `+92 300 12345${i}`,
      address: `${i} Main Road, Karachi`,
      items: Math.ceil(Math.random() * 4),
      products: [
        { name: 'Wireless Headphones', qty: 1, price: 6499 },
        { name: 'Charging Cable', qty: 2, price: 899 },
      ].slice(0, Math.ceil(Math.random() * 2) + 1),
      total: Math.floor(Math.random() * 20000) + 500,
      orderStatus: ORDER_STATUS_OPTIONS[Math.floor(Math.random() * ORDER_STATUS_OPTIONS.length)].value,
      payment: Math.random() > 0.2 ? 'Paid' : 'Pending',
      paymentMethod: ['Card', 'Cash on Delivery', 'Bank Transfer'][Math.floor(Math.random() * 3)],
      delivery: ['Not dispatched', 'In transit', 'Delivered'][Math.floor(Math.random() * 3)],
      orderedAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      note: i % 2 === 0 ? 'Call before delivery.' : 'Handle with care.'
    });
  }

  let ordersState = [];
  let activeOrder = null;
  let lockedScrollY = 0;

  const normalizeStatus = (status) => {
    const value = String(status || '').toLowerCase();
    if (['pending', 'processing', 'confirmed'].includes(value)) return 'pending';
    if (['shipped', 'in transit', 'transit'].includes(value)) return 'shipped';
    if (['delivered', 'complete', 'completed'].includes(value)) return 'delivered';
    if (['cancelled', 'canceled', 'cancel'].includes(value)) return 'cancelled';
    return 'pending';
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

    const fallbackCount = Math.max(Number(order.items) || 1, 1);
    return Array.from({ length: fallbackCount }, (_, index) => ({
      name: `Item ${index + 1}`,
      qty: 1,
      price: fallbackCount > 1 ? Math.round(Number(order.total || 0) / fallbackCount) : Number(order.total || 0),
    }));
  };

  const hydrateOrder = (order, index = 0) => {
    const customerName = order.customer || order.userName || `Customer ${index + 1}`;
    const emailSeed = String(customerName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
    const products = Array.isArray(order.products) ? order.products : [];

    return {
      id: order.id || order._id || `ORD${2001 + index}`,
      customer: customerName,
      email: order.email || order.customerEmail || `${emailSeed || 'customer'}@mail.com`,
      phone: order.phone || order.customerPhone || `+92 300 1234${(index + 1).toString().padStart(1, '0')}`,
      address: order.address || order.shippingAddress || `${index + 1} Main Road, Karachi`,
      items: Number(order.items || products.length || 1),
      total: Number(order.total || order.amount || 0),
      orderStatus: normalizeStatus(order.orderStatus || order.status),
      payment: order.payment || 'Paid',
      paymentMethod: order.paymentMethod || order.paymentType || 'Cash on Delivery',
      delivery: order.delivery || 'Not dispatched',
      orderedAt: order.orderedAt || order.createdAt || order.updatedAt || new Date(Date.now() - ((index + 1) * 86400000)).toISOString(),
      note: order.note || order.message || 'Customer requested careful handling.',
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
          <h3>${escapeHtml(order.customer)}</h3>
          <p>Placed on ${escapeHtml(formatDate(order.orderedAt))}</p>
        </div>
        <span class="order-status-badge ${getStatusClass(order.orderStatus)}">${escapeHtml(getStatusLabel(order.orderStatus))}</span>
      </div>

      <div class="order-summary-cards">
        <article class="summary-card">
          <span>Items</span>
          <strong>${escapeHtml(String(order.items || products.length || 0))}</strong>
        </article>
        <article class="summary-card">
          <span>Total</span>
          <strong>${escapeHtml(formatCurrency(order.total))}</strong>
        </article>
        <article class="summary-card">
          <span>Payment</span>
          <strong>${escapeHtml(order.payment || 'Pending')}</strong>
        </article>
        <article class="summary-card">
          <span>Delivery</span>
          <strong>${escapeHtml(order.delivery || 'Not dispatched')}</strong>
        </article>
      </div>

      <div class="order-details-grid">
        <section class="detail-panel">
          <div class="detail-panel-header">
            <h4>Customer</h4>
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="detail-list">
            <div><span>Name</span><strong>${escapeHtml(order.customer)}</strong></div>
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
            <div><span>Payment status</span><strong>${escapeHtml(order.payment || 'Pending')}</strong></div>
            <div><span>Delivery status</span><strong>${escapeHtml(order.delivery || 'Not dispatched')}</strong></div>
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
            <strong>${escapeHtml(formatCurrency(order.total))}</strong>
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

  const loadStoredOrders = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  };

  const saveStoredOrders = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordersState));
  };

  const render = (list) => {
    tbody.innerHTML = '';
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px">No orders found</td></tr>'; return; }
    list.forEach(o => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${o.id}</td>
        <td>${o.customer}</td>
        <td>${o.items}</td>
        <td>Rs ${Number(o.total || 0).toLocaleString()}</td>
        <td>
          <select class="order-status-select ${getStatusClass(o.orderStatus)}" data-id="${o.id}">
            ${ORDER_STATUS_OPTIONS.map((option) => `<option value="${option.value}" ${normalizeStatus(o.orderStatus) === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
          </select>
        </td>
        <td>${o.payment}</td>
        <td>${o.delivery}</td>
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
        statusSelect.className = `order-status-select ${getStatusClass(o.orderStatus)}`;
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
        orderStatus: normalizeStatus(newStatus),
      };
    });
    saveStoredOrders();
    renderOrders();
  };

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      const json = await res.json();
      if (res.ok && Array.isArray(json.orders) && json.orders.length) {
        ordersState = json.orders.map((order, index) => ({
          ...hydrateOrder(order, index),
          products: Array.isArray(order.products)
            ? order.products.map((product) => ({
                name: product.name || product.title || 'Product',
                qty: Number(product.qty || product.quantity || 1),
                price: Number(product.price || product.subtotal || 0),
              }))
            : [],
        }));
        saveStoredOrders();
        renderOrders();
        return;
      }
    } catch (err) {}

    const stored = loadStoredOrders();
    ordersState = stored && stored.length ? stored.map((order, index) => hydrateOrder(order, index)) : mock.map((order, index) => hydrateOrder(order, index));
    saveStoredOrders();
    renderOrders();
  };

  tbody.addEventListener('click', (e) => {
    const view = e.target.closest('.btn-view');
    if (view) openOrderDetails(view.dataset.id);
  });

  tbody.addEventListener('change', (e) => {
    const statusSelect = e.target.closest('.order-status-select');
    if (!statusSelect) return;
    syncStatusById(statusSelect.dataset.id, statusSelect.value);
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
