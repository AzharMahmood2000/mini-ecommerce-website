document.addEventListener('DOMContentLoaded', () => {
  // Simple analytics charts using mock data; will use backend when endpoints are available
  const mockDates = [];
  const mockValues = [];
  for (let i=29;i>=0;i--) { const d = new Date(Date.now()-i*86400000); mockDates.push(d.toISOString().split('T')[0]); mockValues.push(Math.floor(Math.random()*20000)+2000); }

  const ctx1 = document.getElementById('salesTrend').getContext('2d');
  new Chart(ctx1, { type: 'line', data: { labels: mockDates, datasets: [{ label: 'Revenue', data: mockValues, borderColor: '#2f80ed', backgroundColor: 'rgba(47,128,237,0.08)', fill:true }] }, options: { responsive:true } });

  const topProductsCtx = document.getElementById('topProducts').getContext('2d');
  new Chart(topProductsCtx, { type:'bar', data: { labels:['Pro-X1','Aura-H1','Spectra 4K','GamerPad'], datasets:[{ label:'Units sold', data:[842,512,311,210], backgroundColor:['#2f80ed','#f2994a','#27ae60','#9b51e0'] }] }, options:{ responsive:true } });

  const catCtx = document.getElementById('categoryPerf').getContext('2d');
  new Chart(catCtx, { type:'doughnut', data:{ labels:['Mobile Devices','Audio Systems','Information Systems','Gaming'], datasets:[{ data:[45,25,20,10], backgroundColor:['#2f80ed','#56ccf2','#6fcf97','#f2c94c'] }] }, options:{ responsive:true } });
});
