document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('registrationForm');
    const loginBtn = document.querySelector('.login-toggle-btn');

    if (regForm) {
        regForm.addEventListener('submit', (event) => {
            event.preventDefault();
            alert('Registration Successful!');
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            alert('Redirecting to Login Page...');
        });
    }
});