document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Handle Sidebar Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            
            // Allow navigation for Order History
            if (href && href !== '#') {
                return; // Allow default navigation
            }
            
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Remove chevron from others and add to current
            const chevrons = document.querySelectorAll('.arrow-icon');
            chevrons.forEach(c => c.remove());
            
            const chevron = document.createElement('i');
            chevron.setAttribute('data-lucide', 'chevron-right');
            chevron.classList.add('arrow-icon');
            item.appendChild(chevron);
            lucide.createIcons();
        });
    });

    // Handle Save Button
    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', () => {
        const originalText = saveBtn.innerText;
        saveBtn.innerText = 'Saving...';
        saveBtn.style.opacity = '0.7';
        saveBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            saveBtn.innerText = 'Saved!';
            saveBtn.style.backgroundColor = '#10b981'; // Green
            saveBtn.style.opacity = '1';
            
            setTimeout(() => {
                saveBtn.innerText = originalText;
                saveBtn.style.backgroundColor = ''; // Revert to primary
                saveBtn.disabled = false;
            }, 2000);
        }, 1200);
    });

    // Handle Close Button (Visual Feedback)
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        if (confirm('Discard changes?')) {
            console.log('Form closed');
        }
    });

    // Handle Image Edit (Placeholder)
    const editAvatarBtn = document.querySelector('.edit-btn');
    editAvatarBtn.addEventListener('click', () => {
        alert('Image upload functionality would go here.');
    });
});
