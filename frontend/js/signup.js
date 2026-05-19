document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('registrationForm');
    const loginBtn = document.querySelector('.login-toggle-btn');

    // EMAIL VALIDATION FUNCTION
    function isValidEmail(email) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }

    if (regForm) {
        regForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            const username = usernameInput ? usernameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            // 1. EMPTY CHECK
            if (!username || !email || !password) {
                alert('Please fill in username, email, and password.');
                return;
            }

            // 2. EMAIL FORMAT CHECK
            if (!isValidEmail(email)) {
                alert('Please enter a valid email address (example@gmail.com).');
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

                const data = await response.json();

                // 3. SERVER ERROR HANDLING
                if (!response.ok) {
                    alert(data.message || 'Registration failed.');
                    return;
                }

                alert(data.message || 'Registration successful!');
                regForm.reset();

            } catch (error) {
                console.error('Registration request failed:', error);
                alert('Could not connect to the server. Please try again later.');
            }
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            alert('Redirecting to Login Page...');
            // window.location.href = '/login.html'; (optional)
        });
    }
});