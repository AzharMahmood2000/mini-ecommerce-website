document.addEventListener('DOMContentLoaded', () => {
  // Attempt to fetch orders from backend; fallback to mock data
  const API_BASE_URL = 'http://localhost:5000/api';
  const totalSalesEl = document.getElementById('totalSales');
  const dailySalesEl = document.getElementById('dailySales');
  const monthlySalesEl = document.getElementById('monthlySales');
  const txBody = document.querySelector('#transactionsTable tbody');

  const mockTx = [];
  // generate 10 mock transactions
  for (let i=0;i<10;i++) {
    mockTx.push({ id: 'ORD'+(1000+i), date: new Date(Date.now()-i*86400000).toISOString().split('T')[0], amount: Math.floor(Math.random()*20000)+500, payment: Math.random()>0.2? 'Paid' : 'Pending' });
  }

  const renderStats = (tx) => {
    const total = tx.reduce((s,t)=>s + (t.amount||0), 0);
    totalSalesEl.textContent = 'Rs ' + total.toLocaleString();
    dailySalesEl.textContent = 'Rs ' + (tx[0]?.amount || 0).toLocaleString();
    monthlySalesEl.textContent = 'Rs ' + Math.round(total/30).toLocaleString();
  };

  const renderTx = (tx) => {
    txBody.innerHTML = '';
    tx.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>#${t.id}</td><td>${t.date}</td><td>Rs ${t.amount.toLocaleString()}</td><td>${t.payment}</td>`;
      txBody.appendChild(tr);
    });
  };

  const renderChart = (tx) => {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const labels = tx.map(t => t.date).reverse();
    const data = tx.map(t => t.amount).reverse();
    new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Revenue', data, borderColor: '#2f80ed', backgroundColor: 'rgba(47,128,237,0.1)', fill: true }] }, options: { responsive:true } });
  };

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      if (!res.ok) throw new Error('no orders endpoint');
      const json = await res.json();
      const tx = Array.isArray(json.orders) ? json.orders.slice(0,10) : mockTx;
      renderStats(tx);
      renderTx(tx);
      renderChart(tx);
    } catch (err) {
      // fallback
      const tx = mockTx;
      renderStats(tx);
      renderTx(tx);
      renderChart(tx);
    }
  };

  load();
});
