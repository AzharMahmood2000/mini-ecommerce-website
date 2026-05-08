document.addEventListener('DOMContentLoaded', () => {
    // Handle Sidebar Active State
    const navItems = document.querySelectorAll('.sidebar-nav li');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Add Product Button Interaction
    const addBtn = document.querySelector('.add-btn');
    addBtn.addEventListener('click', () => {
        alert('Opening "Add Product" module...');
    });

    // Simple Table Row interaction
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = '#f9fafb';
        });
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = 'transparent';
        });
    });
});