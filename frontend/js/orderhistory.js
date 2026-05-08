document.addEventListener('DOMContentLoaded', () => {
    // Simple Tab Toggle Logic
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add to clicked
            button.classList.add('active');
            
            console.log(`Filtering by: ${button.textContent}`);
        });
    });

    // Pagination feedback
    const pageArrows = document.querySelectorAll('.page-arrow');
    pageArrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            // Logic for next/prev page
            arrow.style.transform = 'scale(0.9)';
            setTimeout(() => arrow.style.transform = 'scale(1)', 100);
        });
    });
});