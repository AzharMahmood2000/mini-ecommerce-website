document.addEventListener('DOMContentLoaded', () => {
    
    // Add click event for Track Order button
    const trackBtn = document.querySelector('.btn-primary');
    if (trackBtn) {
        trackBtn.addEventListener('click', () => {
            alert('Redirecting to order tracking page...');
        });
    }

    // Add click event for Continue Shopping button
    const continueBtn = document.querySelector('.btn-secondary');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            alert('Going back to the storefront.');
            // window.location.href = 'products.html'; 
        });
    }

    // Social icons hover effect simulation
    const socialIcons = document.querySelectorAll('.social-icons a');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'translateY(-3px)';
            icon.style.transition = 'transform 0.3s';
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'translateY(0)';
        });
    });

    // Mock functionality: Refresh data if needed
    console.log('Order #MEH-829472 confirmation page loaded successfully.');
});