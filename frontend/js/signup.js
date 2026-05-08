document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('registrationForm');

    regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Registration Successful!');
    });

    // Clicking 'Login' button (simulating page switch)
    const loginBtn = document.querySelector('.login-toggle-btn');
    loginBtn.addEventListener('click', () => {
        alert('Redirecting to Login Page...');
    });
});