document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
        item.addEventListener('click', (event) => {
            const href = item.getAttribute('href');

            if (href && href !== '#') {
                return;
            }

            event.preventDefault();
            navItems.forEach((navItem) => navItem.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.arrow-icon').forEach((chevron) => chevron.remove());

            const chevron = document.createElement('i');
            chevron.setAttribute('data-lucide', 'chevron-right');
            chevron.classList.add('arrow-icon');
            item.appendChild(chevron);

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    });

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const originalText = saveBtn.innerText;
            saveBtn.innerText = 'Saving...';
            saveBtn.style.opacity = '0.7';
            saveBtn.disabled = true;

            setTimeout(() => {
                saveBtn.innerText = 'Saved!';
                saveBtn.style.backgroundColor = '#10b981';
                saveBtn.style.opacity = '1';

                setTimeout(() => {
                    saveBtn.innerText = originalText;
                    saveBtn.style.backgroundColor = '';
                    saveBtn.disabled = false;
                }, 2000);
            }, 1200);
        });
    }

    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (confirm('Discard changes?')) {
                console.log('Form closed');
            }
        });
    }

    const editAvatarBtn = document.querySelector('.edit-btn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', () => {
            alert('Image upload functionality would go here.');
        });
    }
});