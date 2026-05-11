<<<<<<< HEAD
=======
<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
    // Simple Tab Toggle Logic
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add to clicked
            button.classList.add('active');
            
            // Here you would typically filter data or make an API call
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
=======
>>>>>>> cf625dc (Resolve merge conflicts: keep HEAD versions)
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
<<<<<<< HEAD
=======
>>>>>>> efb9029 (updated e-commerce styles)
>>>>>>> cf625dc (Resolve merge conflicts: keep HEAD versions)
});