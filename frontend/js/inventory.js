document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:5000/api';
  const API_ORIGIN = 'http://localhost:5000';
  const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later';
  const tableBody = document.querySelector('#inventoryTable tbody');
  const filterCategory = document.getElementById('filterCategory');
  const filterStock = document.getElementById('filterStock');
  const globalSearch = document.getElementById('globalSearch');
  const modal = document.getElementById('inventoryModal');
  const form = document.getElementById('inventoryForm');
  const addBtn = document.getElementById('btnAddProduct');
  const modalCloseBtn = modal.querySelector('.modal-close');
  const cancelBtn = modal.querySelector('.btn-cancel');
  const deleteModal = document.getElementById('deleteConfirmModal');
  const deleteMessage = document.getElementById('deleteConfirmMessage');
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');
  const deleteCloseBtn = document.getElementById('deleteConfirmCloseBtn');

  let products = [];
  let editId = null;
  let pendingDelete = null;
  let activeMenu = null;

  const getToken = () => localStorage.getItem('authToken');
  const safeParseResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (parseError) {
        return {};
      }
    }

    return {};
  };

  const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return '../assets/images/Home/1.png';
    if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('/uploads/')) return `${API_ORIGIN}${imageUrl}`;
    if (imageUrl.startsWith('uploads/')) return `${API_ORIGIN}/${imageUrl}`;
    return imageUrl;
  };

  const getStockStatus = (stock) => {
    const value = Number(stock) || 0;
    if (value === 0) return 'Out of stock';
    if (value <= 10) return 'Low stock';
    return 'In stock';
  };

  const populateCategoryFilter = () => {
    const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
    filterCategory.innerHTML = '<option value="all">All Categories</option>' + categories.map((category) => `<option value="${category}">${category}</option>`).join('');
  };

  const closeActiveMenu = () => {
    if (activeMenu) {
      activeMenu.classList.add('hidden');
      activeMenu = null;
    }
  };

  const openModal = (product = null) => {
    editId = product ? product._id : null;
    modal.querySelector('#modalTitle').textContent = product ? 'Edit Product' : 'Add Product';
    document.getElementById('i_name').value = product?.name || '';
    document.getElementById('i_price').value = product?.price || '';
    document.getElementById('i_stock').value = product?.stock ?? '';
    document.getElementById('i_category').value = product?.category || '';
    document.getElementById('i_imageFile').value = '';
    modal.classList.remove('hidden');
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    form.reset();
    editId = null;
  };

  const openDeleteModal = (product) => {
    pendingDelete = product;
    deleteMessage.textContent = `Are you sure you want to delete "${product.name}"? This action cannot be undone.`;
    deleteModal.classList.remove('hidden');
  };

  const closeDeleteModal = () => {
    deleteModal.classList.add('hidden');
    pendingDelete = null;
  };

  const renderTable = (list) => {
    tableBody.innerHTML = '';

    if (!list.length) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px">No products found</td></tr>';
      return;
    }

    list.forEach((product) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="${resolveImageUrl(product.imageUrl)}" class="p-icon" style="width:48px;height:48px;object-fit:cover" alt="${product.name}"></td>
        <td>${product.name || ''}</td>
        <td>${product.category || ''}</td>
        <td>Rs ${Number(product.price || 0).toLocaleString()}</td>
        <td>${product.stock || 0}</td>
        <td>${getStockStatus(product.stock)}</td>
        <td class="actions-cell">
          <div class="row-actions">
            <button type="button" class="ellipsis-btn" aria-label="Actions"><i class="fa-solid fa-ellipsis-vertical"></i></button>
            <div class="actions-menu hidden">
              <button type="button" class="action-edit" data-id="${product._id}">Edit Product</button>
              <button type="button" class="action-delete" data-id="${product._id}">Delete Product</button>
            </div>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  };

  const applyFilters = () => {
    let filtered = [...products];
    const categoryValue = filterCategory.value;
    const stockValue = filterStock.value;
    const query = globalSearch.value.trim().toLowerCase();

    if (categoryValue && categoryValue !== 'all') {
      filtered = filtered.filter((product) => product.category === categoryValue);
    }

    if (stockValue && stockValue !== 'all') {
      filtered = filtered.filter((product) => {
        const stock = Number(product.stock) || 0;
        if (stockValue === 'in_stock') return stock > 10;
        if (stockValue === 'low_stock') return stock > 0 && stock <= 10;
        return stock === 0;
      });
    }

    if (query) {
      filtered = filtered.filter((product) => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        return name.includes(query) || category.includes(query);
      });
    }

    renderTable(filtered);
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await safeParseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || GENERIC_ERROR_MESSAGE);
      }

      products = Array.isArray(data?.products) ? data.products : [];
      populateCategoryFilter();
      applyFilters();
    } catch (error) {
      console.error('Load products error:', error);
      alert(GENERIC_ERROR_MESSAGE);
      products = [];
      renderTable(products);
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('i_imageFile');
    const token = getToken();

    if (!token) {
      alert('Please log in as an admin before uploading products.');
      return;
    }

    const formData = new FormData();
    formData.append('name', document.getElementById('i_name').value.trim());
    formData.append('price', document.getElementById('i_price').value);
    formData.append('stock', document.getElementById('i_stock').value);
    formData.append('category', document.getElementById('i_category').value.trim());

    if (fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      let response;

      const requestOptions = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      };

      if (editId) {
        response = await fetch(`${API_BASE_URL}/products/${editId}`, {
          method: 'PUT',
          ...requestOptions,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          ...requestOptions,
        });
      }

      const result = await safeParseResponse(response);

      if (!response.ok) {
        throw new Error(result.message || GENERIC_ERROR_MESSAGE);
      }

      closeModal();
      await loadProducts();
    } catch (error) {
      alert(GENERIC_ERROR_MESSAGE);
    }
  };

  const deleteProduct = async () => {
    if (!pendingDelete) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/products/${pendingDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await safeParseResponse(response);

      if (!response.ok) {
        throw new Error(result.message || GENERIC_ERROR_MESSAGE);
      }

      closeDeleteModal();
      await loadProducts();
    } catch (error) {
      alert(GENERIC_ERROR_MESSAGE);
    }
  };

  tableBody.addEventListener('click', async (event) => {
    const ellipsis = event.target.closest('.ellipsis-btn');
    const editButton = event.target.closest('.action-edit');
    const deleteButton = event.target.closest('.action-delete');

    if (ellipsis) {
      const menu = ellipsis.parentElement.querySelector('.actions-menu');
      if (activeMenu && activeMenu !== menu) {
        activeMenu.classList.add('hidden');
      }
      menu.classList.toggle('hidden');
      activeMenu = menu.classList.contains('hidden') ? null : menu;
      return;
    }

    if (editButton) {
      const product = products.find((item) => item._id === editButton.dataset.id);
      if (product) openModal(product);
      closeActiveMenu();
      return;
    }

    if (deleteButton) {
      const product = products.find((item) => item._id === deleteButton.dataset.id);
      if (product) openDeleteModal(product);
      closeActiveMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.row-actions')) {
      closeActiveMenu();
    }
  });

  addBtn.addEventListener('click', () => openModal(null));
  modalCloseBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.querySelector('.modal-overlay').addEventListener('click', closeModal);

  deleteConfirmBtn.addEventListener('click', deleteProduct);
  deleteCancelBtn.addEventListener('click', closeDeleteModal);
  deleteCloseBtn.addEventListener('click', closeDeleteModal);
  deleteModal.querySelector('.modal-overlay').addEventListener('click', closeDeleteModal);

  form.addEventListener('submit', submitForm);
  filterCategory.addEventListener('change', applyFilters);
  filterStock.addEventListener('change', applyFilters);
  globalSearch.addEventListener('input', applyFilters);

  loadProducts();
});