<<<<<<< HEAD
=======
<<<<<<< HEAD
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
        // In a real app, you would use: window.location.href = "login.html";
    });
=======
>>>>>>> cf625dc (Resolve merge conflicts: keep HEAD versions)
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
<<<<<<< HEAD
=======
>>>>>>> efb9029 (updated e-commerce styles)
>>>>>>> cf625dc (Resolve merge conflicts: keep HEAD versions)
});