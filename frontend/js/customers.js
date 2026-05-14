document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://localhost:5000/api';
  const tbody = document.querySelector('#customersTable tbody');
  const mockUsers = [
    { name: 'Alice Park', email: 'alice@example.com', phone: '9991112222', joined: '2024-12-01', orders: 3, status: 'Active' },
    { name: 'Bob Singh', email: 'bob@example.com', phone: '8883334444', joined: '2025-01-12', orders: 1, status: 'Active' },
    { name: 'Carol Lee', email: 'carol@example.com', phone: '', joined: '2025-02-05', orders: 0, status: 'Inactive' },
  ];

  const render = (list) => {
    tbody.innerHTML = '';
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">No customers found</td></tr>';
      return;
    }
    list.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td>${u.phone||'-'}</td><td>${u.joined}</td><td>${u.orders}</td><td>${u.status}</td>`;
      tbody.appendChild(tr);
    });
  };

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      const json = await res.json();
      if (res.ok && Array.isArray(json.users)) {
        render(json.users.map(u=>({ name: u.name||u.email, email: u.email, phone: u.phone||'', joined: (u.createdAt||'').split('T')[0]||'', orders: u.orderCount||0, status: u.isActive? 'Active':'Inactive' })));
        return;
      }
    } catch (err) {
      // fallback
    }
    render(mockUsers);
  };

  load();
});
