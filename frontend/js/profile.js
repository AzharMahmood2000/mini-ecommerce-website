document.addEventListener('DOMContentLoaded', () => {
    const PROFILE_API_URL = 'http://localhost:5000/api/users/profile';
    const DEFAULT_AVATAR = '../assets/images/account.png';

    const navItems = document.querySelectorAll('.nav-item');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('resetProfileBtn');
    const closeBtn = document.getElementById('closeProfileBtn');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const pickImageBtn = document.getElementById('pickImageBtn');
    const imageInput = document.getElementById('profileImageFile');
    const statusBanner = document.getElementById('profileStatus');
    const selectedFileName = document.getElementById('selectedFileName');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const mobileInput = document.getElementById('mobile');
    const locationInput = document.getElementById('location');
    const profileAvatar = document.getElementById('profileAvatar');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const profileNamePreview = document.getElementById('profileNamePreview');
    const profileEmailPreview = document.getElementById('profileEmailPreview');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');

    let loadedProfile = null;
    let previewObjectUrl = null;

    const getToken = () => localStorage.getItem('authToken');

    const resolveImageUrl = (value) => {
        if (!value) return DEFAULT_AVATAR;
        if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
        if (value.startsWith('/uploads/')) return `http://localhost:5000${value}`;
        if (value.startsWith('uploads/')) return `http://localhost:5000/${value}`;
        return value;
    };

    const setBanner = (type, message) => {
        if (!statusBanner) return;

        statusBanner.classList.remove('success', 'error', 'info', 'is-visible');

        if (!message) {
            statusBanner.textContent = '';
            statusBanner.style.display = 'none';
            return;
        }

        statusBanner.textContent = message;
        statusBanner.classList.add(type || 'info', 'is-visible');
        statusBanner.style.display = 'block';
    };

    const setSavingState = (isSaving) => {
        if (!saveBtn) return;

        saveBtn.disabled = isSaving;
        saveBtn.textContent = isSaving ? 'Saving...' : 'Save Changes';
        saveBtn.style.opacity = isSaving ? '0.8' : '1';
    };

    const syncDisplayedProfile = (profile) => {
        const displayName = profile?.name || profile?.username || 'Your name';
        const displayEmail = profile?.email || 'yourname@gmail.com';
        const imageUrl = resolveImageUrl(profile?.profileImage || profile?.avatarUrl);

        if (nameInput) nameInput.value = profile?.name || '';
        if (emailInput) emailInput.value = profile?.email || '';
        if (mobileInput) mobileInput.value = profile?.mobile || '';
        if (locationInput) locationInput.value = profile?.location || '';
        if (profileAvatar) profileAvatar.src = imageUrl;
        if (sidebarAvatar) sidebarAvatar.src = imageUrl;
        if (profileNamePreview) profileNamePreview.textContent = displayName;
        if (profileEmailPreview) profileEmailPreview.textContent = displayEmail;
        if (sidebarName) sidebarName.textContent = displayName;
        if (sidebarEmail) sidebarEmail.textContent = displayEmail;
    };

    const fetchProfileFrom = async () => {
        const token = getToken();
        const apiUrl = PROFILE_API_URL;

        console.log('API URL:', apiUrl);

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get('content-type') || '';
            const data = contentType.includes('application/json')
                ? await response.json()
                : { success: false, message: await response.text() };

            return { response, data };
        } catch (error) {
            return {
                response: {
                    ok: false,
                    status: 0,
                },
                data: {
                    success: false,
                    message: error.message || 'Network error while calling profile API.',
                },
            };
        }
    };

    const loadProfile = async () => {
        const token = getToken();

        if (!token) {
            setBanner('error', 'Please sign in to view your profile.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1400);
            return;
        }

        setBanner('info', 'Loading your profile...');
        setSavingState(true);

        try {
            const result = await fetchProfileFrom('/profile');

            console.log('Profile response status:', result.response.status, result.data);

            if (result.response.status === 0) {
                throw new Error(result.data.message || 'Backend is not reachable.');
            }

            if (!result.response.ok || !result.data.success) {
                throw new Error(result.data.message || 'Failed to load profile');
            }

            loadedProfile = result.data.user || {};
            syncDisplayedProfile(loadedProfile);
            setBanner('', '');
        } catch (error) {
            console.error('[PROFILE] Load error:', error);
            setBanner('error', error.message || 'Unable to load your profile right now.');
        } finally {
            setSavingState(false);
        }
    };

    const updatePreviewFromFile = (file) => {
        if (!file) {
            if (selectedFileName) selectedFileName.textContent = 'No image selected';
            if (previewObjectUrl) {
                URL.revokeObjectURL(previewObjectUrl);
                previewObjectUrl = null;
            }
            syncDisplayedProfile(loadedProfile || {});
            return;
        }

        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
        }

        previewObjectUrl = URL.createObjectURL(file);
        if (profileAvatar) profileAvatar.src = previewObjectUrl;
        if (sidebarAvatar) sidebarAvatar.src = previewObjectUrl;
        if (selectedFileName) selectedFileName.textContent = file.name;
    };

    const submitProfile = async (event) => {
        event.preventDefault();

        const token = getToken();
        if (!token) {
            setBanner('error', 'Please sign in again to update your profile.');
            return;
        }

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const mobile = mobileInput ? mobileInput.value.trim() : '';
        const location = locationInput ? locationInput.value.trim() : '';
        const file = imageInput && imageInput.files ? imageInput.files[0] : null;

        if (!name || !email) {
            setBanner('error', 'Name and email are required.');
            return;
        }

        const payload = new FormData();
        payload.append('name', name);
        payload.append('username', name);
        payload.append('email', email);
        payload.append('mobile', mobile);
        payload.append('mobileNumber', mobile);
        payload.append('location', location);

        if (file) {
            payload.append('profileImage', file);
        }

        setBanner('info', 'Saving profile changes...');
        setSavingState(true);

        try {
            console.log('API URL:', PROFILE_API_URL);

            const response = await fetch(PROFILE_API_URL, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: payload,
            });

            const contentType = response.headers.get('content-type') || '';
            const data = contentType.includes('application/json')
                ? await response.json()
                : { success: false, message: await response.text() };

            console.log('Profile update response status:', response.status, data);

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to update profile');
            }

            loadedProfile = data.user || loadedProfile;
            syncDisplayedProfile(loadedProfile);
            if (imageInput) imageInput.value = '';
            if (selectedFileName) selectedFileName.textContent = 'No image selected';
            setBanner('success', data.message || 'Profile updated successfully.');
        } catch (error) {
            console.error('[PROFILE] Update error:', error);
            setBanner('error', error.message || 'Unable to update profile right now.');
        } finally {
            setSavingState(false);
        }
    };

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

    if (changePhotoBtn && imageInput) {
        changePhotoBtn.addEventListener('click', (event) => {
            event.preventDefault();
            imageInput.click();
        });
    }

    [nameInput, emailInput, mobileInput, locationInput].forEach((input) => {
        if (!input) return;
    });

    if (profileAvatar && imageInput) {
        profileAvatar.addEventListener('click', () => imageInput.click());
        profileAvatar.style.cursor = 'pointer';
    }

    if (sidebarAvatar && imageInput) {
        sidebarAvatar.addEventListener('click', () => imageInput.click());
        sidebarAvatar.style.cursor = 'pointer';
    }

    if (imageInput) {
        imageInput.addEventListener('change', () => {
            const file = imageInput.files ? imageInput.files[0] : null;
            updatePreviewFromFile(file);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const profile = loadedProfile;
            if (!profile) return;
            if (previewObjectUrl) {
                URL.revokeObjectURL(previewObjectUrl);
                previewObjectUrl = null;
            }
            if (imageInput) imageInput.value = '';
            if (selectedFileName) selectedFileName.textContent = 'No image selected';
            syncDisplayedProfile(profile);
            setBanner('', '');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }

    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', submitProfile);
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    loadProfile();
});