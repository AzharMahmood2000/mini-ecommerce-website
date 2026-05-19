(function () {
    const ADMIN_PAGES = new Set([
        'adminpanel.html',
        'inventory.html',
        'sales.html',
        'customers.html',
        'analytics.html',
        'orders.html',
    ]);

    const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
    if (!ADMIN_PAGES.has(currentPage)) {
        return;
    }

    const GENERIC_DENIED_MESSAGE = 'Access Denied';
    const LOGIN_PAGE = 'login.html';
    const HOME_PAGE = '../index.html';

    // Hide page content until admin verification completes.
    document.documentElement.style.visibility = 'hidden';

    const redirectTo = (path) => {
        window.location.replace(path);
    };

    const getStoredUser = () => {
        try {
            const raw = localStorage.getItem('currentUser');
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    };

    const ensureAdminAccess = async () => {
        const token = localStorage.getItem('authToken');

        if (!token) {
            redirectTo(LOGIN_PAGE);
            return;
        }

        const storedUser = getStoredUser();
        if (storedUser && storedUser.role && storedUser.role !== 'admin') {
            alert(GENERIC_DENIED_MESSAGE);
            redirectTo(HOME_PAGE);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/users/profile', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : {};

            if (!response.ok || !payload.success || !payload.user) {
                if (response.status === 401) {
                    redirectTo(LOGIN_PAGE);
                    return;
                }

                alert(GENERIC_DENIED_MESSAGE);
                redirectTo(HOME_PAGE);
                return;
            }

            if (payload.user.role !== 'admin') {
                alert(GENERIC_DENIED_MESSAGE);
                redirectTo(HOME_PAGE);
                return;
            }

            // Keep role in sync with trusted backend response.
            const updatedUser = {
                ...(storedUser || {}),
                role: payload.user.role,
                username: payload.user.username || storedUser?.username,
                email: payload.user.email || storedUser?.email,
                id: payload.user.id || storedUser?.id,
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            document.documentElement.style.visibility = 'visible';
        } catch (error) {
            alert(GENERIC_DENIED_MESSAGE);
            redirectTo(LOGIN_PAGE);
        }
    };

    ensureAdminAccess();
})();