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
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Fetch values
            const username = loginForm.querySelector('input[type="text"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            if(username && password) {
                // Save user data to localStorage
                const userData = {
                    username: username,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                alert('Logging in with: ' + username);
                
                // Redirect to home page after login
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 500);
            }
        });
    }

    // Handle registration form submission
    const regForm = document.getElementById('registrationForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values
            const regUsername = regForm.querySelector('input[type="text"]').value;
            const regPassword = regForm.querySelector('input[type="password"]').value;
            
            if(regUsername && regPassword) {
                alert('Registration Successful! Please login with your credentials.');
                switchToLogin();
            }
        });
    }
});