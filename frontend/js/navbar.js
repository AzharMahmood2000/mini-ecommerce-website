// Shared navbar functionality for all pages
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
});

function isInPagesDirectory() {
    return window.location.pathname.replace(/\\/g, '/').includes('/pages/');
}

function getPagePath(fileName) {
    if (fileName === 'index.html') {
        return isInPagesDirectory() ? '../index.html' : 'index.html';
    }

    return isInPagesDirectory() ? fileName : `pages/${fileName}`;
}

function getAuthNavLinks() {
    return document.querySelectorAll(
        '.nav-links a[href="login.html"], ' +
        '.nav-links a[href="../login.html"], ' +
        '.nav-links a[href="pages/login.html"], ' +
        '.nav-links a.profile-link, ' +
        '.nav-links a[href="profile.html"], ' +
        '.nav-links a[href="../profile.html"], ' +
        '.nav-links a[href="pages/profile.html"], ' +
        '.nav-links a[href="#"]'
    );
}

function updateNavbar() {
    const authLinks = getAuthNavLinks();
    const userRaw = localStorage.getItem('currentUser');

    if (!authLinks.length) {
        return;
    }

    let userData = null;
    if (userRaw) {
        try {
            userData = JSON.parse(userRaw);

            // session expiry: treat very old stored users as logged out
            if (userData && userData.loginTime) {
                const loginTs = Date.parse(userData.loginTime);
                if (!isNaN(loginTs)) {
                    const ageMs = Date.now() - loginTs;
                    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
                    if (ageMs > maxAgeMs) {
                        // expired
                        localStorage.removeItem('currentUser');
                        userData = null;
                    }
                }
            }
        } catch (error) {
            localStorage.removeItem('currentUser');
        }
    }

    authLinks.forEach(link => {
        if (userData) {
            link.innerHTML = '<i class="fas fa-user-circle profile-icon"></i>';
            link.classList.add('profile-link');
            // make profile icon open a small menu with Profile / Logout
            link.href = 'javascript:void(0)';
            link.title = `Profile: ${userData.username || 'User'}`;
            // attach menu toggle
            link.removeEventListener('click', onProfileClick);
            link.addEventListener('click', onProfileClick);
        } else {
            link.textContent = 'Login';
            link.classList.remove('profile-link');
            link.href = getPagePath('login.html');
            link.title = '';
            link.removeEventListener('click', onProfileClick);
        }
    });
}

async function renderFooterCategories() {
    const footers = document.querySelectorAll('footer.footer');
    if (!footers.length) return;

    try {
        const response = await fetch('http://localhost:5000/api/categories');
        const data = await response.json();

        if (!response.ok || !data.success) {
            return;
        }

        const categories = Array.isArray(data.categories) ? data.categories : [];
        const productPagePath = getPagePath('product.html');

        footers.forEach((footer) => {
            const productColumn = Array.from(footer.querySelectorAll('.footer-col')).find((column) => {
                const heading = column.querySelector('h4');
                return heading && heading.textContent.trim().toUpperCase() === 'PRODUCT';
            });

            if (!productColumn) return;

            const list = productColumn.querySelector('.footer-links');
            if (!list) return;

            if (!categories.length) {
                list.innerHTML = '<li><span class="footer-empty">No categories available</span></li>';
                return;
            }

            list.innerHTML = categories.map((category) => `
                <li><a href="${productPagePath}?category=${encodeURIComponent(category)}" data-category="${category}">${category}</a></li>
            `).join('');

            list.querySelectorAll('a[data-category]').forEach((link) => {
                link.addEventListener('click', (event) => {
                    if (!window.location.pathname.replace(/\\/g, '/').includes('/pages/product.html')) {
                        return;
                    }

                    if (typeof window.filterProductsByCategory === 'function') {
                        event.preventDefault();
                        window.filterProductsByCategory(link.dataset.category);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Failed to render footer categories:', error);
    }
}

// Profile menu handling
function onProfileClick(e) {
    e.preventDefault();
    const trigger = e.currentTarget;
    toggleProfileMenu(trigger);
}

let _profileMenuEl = null;
function toggleProfileMenu(trigger) {
    closeProfileMenu();

    const menu = document.createElement('div');
    menu.className = 'profile-menu';
    menu.style.position = 'absolute';
    menu.style.zIndex = 10000;
    menu.style.minWidth = '140px';
    menu.style.background = '#fff';
    menu.style.border = '1px solid rgba(0,0,0,0.08)';
    menu.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
    menu.style.borderRadius = '6px';
    menu.style.padding = '6px 0';

    const profileItem = document.createElement('div');
    profileItem.textContent = 'Profile';
    profileItem.style.padding = '8px 12px';
    profileItem.style.cursor = 'pointer';
    profileItem.addEventListener('click', () => {
        closeProfileMenu();
        window.location.href = getPagePath('profile.html');
    });

    const logoutItem = document.createElement('div');
    logoutItem.textContent = 'Logout';
    logoutItem.style.padding = '8px 12px';
    logoutItem.style.cursor = 'pointer';
    logoutItem.style.color = '#c0392b';
    logoutItem.addEventListener('click', () => {
        closeProfileMenu();
        logout();
    });

    menu.appendChild(profileItem);
    menu.appendChild(logoutItem);

    document.body.appendChild(menu);
    _profileMenuEl = menu;

    // position
    const rect = trigger.getBoundingClientRect();
    menu.style.top = (window.scrollY + rect.bottom + 8) + 'px';
    menu.style.left = (window.scrollX + rect.left) + 'px';

    // close on outside click
    setTimeout(() => {
        document.addEventListener('click', closeProfileMenuOnDoc);
    }, 0);
}

function closeProfileMenuOnDoc(e) {
    if (!_profileMenuEl) return;
    if (e.target.closest('.profile-menu')) return;
    if (e.target.closest('.profile-link')) return;
    closeProfileMenu();
}

function closeProfileMenu() {
    if (_profileMenuEl && _profileMenuEl.parentNode) {
        _profileMenuEl.parentNode.removeChild(_profileMenuEl);
    }
    _profileMenuEl = null;
    document.removeEventListener('click', closeProfileMenuOnDoc);
}

function goToProfile() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        window.location.href = getPagePath('profile.html');
    } else {
        window.location.href = getPagePath('login.html');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    updateNavbar();
    alert('Logged out successfully!');
    window.location.href = getPagePath('index.html');
}

window.updateNavbar = updateNavbar;
window.goToProfile = goToProfile;
window.logout = logout;

document.addEventListener('DOMContentLoaded', () => {
    renderFooterCategories();
});

