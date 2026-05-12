document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('registrationForm');
    const loginBtn = document.querySelector('.login-toggle-btn');

    if (regForm) {
        regForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

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

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message || 'Registration failed.');
                    return;
                }

                alert(data.message || 'Registration successful!');
                regForm.reset();
            } catch (error) {
                console.error('Registration request failed:', error);
                alert('Could not connect to the server. Please try again.');
            }
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            alert('Redirecting to Login Page...');
        });
    }
});