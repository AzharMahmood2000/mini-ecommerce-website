document.addEventListener('DOMContentLoaded', () => {
  // Get the current page filename from the URL
  const currentPage = location.pathname.split('/').pop() || 'adminpanel.html';
  
  // Set active state on matching sidebar link
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const li = link.closest('li');
    if (!li) return;
    
    // Get the href and extract just the filename
    const href = link.getAttribute('href');
    const hrefPage = href.split('#')[0]; // Remove hash if present
    
    // Compare current page with link href
    if (hrefPage === currentPage) {
      li.classList.add('active');
    } else {
      li.classList.remove('active');
    }
  });
});
