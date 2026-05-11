document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            tabButtons.forEach((tabButton) => tabButton.classList.remove('active'));
            button.classList.add('active');
            console.log(`Filtering by: ${button.textContent}`);
        });
    });

    const pageArrows = document.querySelectorAll('.page-arrow');
    pageArrows.forEach((arrow) => {
        arrow.addEventListener('click', () => {
            arrow.style.transform = 'scale(0.9)';
            setTimeout(() => {
                arrow.style.transform = 'scale(1)';
            }, 100);
        });
    });
});