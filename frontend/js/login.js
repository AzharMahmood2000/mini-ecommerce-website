// Function to switch to signup page
function switchToSignup() {
    const loginPage = document.getElementById('loginPage');
    const signupPage = document.getElementById('signupPage');
    
    loginPage.classList.remove('active');
    setTimeout(() => {
        signupPage.classList.add('active');
    }, 100);
}

// Function to switch to login page
function switchToLogin() {
    const loginPage = document.getElementById('loginPage');
    const signupPage = document.getElementById('signupPage');
    
    signupPage.classList.remove('active');
    setTimeout(() => {
        loginPage.classList.add('active');
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    const safeParseResponse = async (response) => {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                return await response.json();
            } catch (parseError) {
                return {};
            }
        }

        return {};
    };

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Fetch values
            const emailOrUsername = loginForm.querySelector('input[type="text"]').value.trim();
            const password = loginForm.querySelector('input[type="password"]').value;

            if (!emailOrUsername || !password) {
                alert('Please enter your email/username and password.');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        emailOrUsername,
                        password,
                    }),
                });

                const data = await safeParseResponse(response);

                if (!response.ok) {
                    alert('Invalid email or password');
                    return;
                }

                const userData = {
                    id: data.user.id,
                    username: data.user.username,
                    email: data.user.email,
                    role: data.user.role,
                    loginTime: new Date().toISOString(),
                };

                localStorage.setItem('currentUser', JSON.stringify(userData));
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }
                alert(data.message || 'Login successful.');

                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 500);
            } catch (error) {
                console.error('Login request failed:', error);
                alert('Something went wrong. Please try again later');
            }
        });
    }

    // Handle registration form submission
    const regForm = document.getElementById('registrationForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = regForm.querySelector('input[type="text"]');
            const emailInput = regForm.querySelector('input[type="email"]');
            const passwordInput = regForm.querySelector('input[type="password"]');

            const username = usernameInput ? usernameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (!username || !email || !password) {
                alert('Please fill in username, email, and password.');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                    }),
                });

                const data = await safeParseResponse(response);

                if (!response.ok) {
                    alert(data.message || 'Something went wrong. Please try again later');
                    return;
                }

                alert(data.message || 'Registration successful! Please login with your credentials.');
                regForm.reset();
                switchToLogin();
            } catch (error) {
                console.error('Registration request failed:', error);
                alert('Something went wrong. Please try again later');
            }
        });
    }
});