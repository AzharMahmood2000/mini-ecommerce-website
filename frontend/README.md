# Mini E-Commerce Frontend

This project keeps the shared image assets in `frontend/assets/images/` and uses the root `index.html` as the landing page.

```text
frontend/
├── index.html
├── README.md
├── product.json
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── css/
│   ├── home-style.css
│   ├── product-style.css
│   └── [other page styles]
├── js/
│   ├── navbar.js
│   ├── home.js
│   ├── product.js
│   └── [other page scripts]
└── pages/
    ├── adminpanel.html
    ├── cart.html
    ├── checkout.html
    ├── login.html
    ├── orderconfirmation.html
    ├── orderhistory.html
    ├── product-detail.html
    ├── product.html
    ├── profile.html
    └── signup.html
```

## Notes

- Open `index.html` to start the app.
- The navbar shows a Login button when no user is signed in.
- After sign-in, the app stores `currentUser` in localStorage and shows a profile icon with a small menu.
- Clicking Logout clears `currentUser`, returns the Login button, and redirects to the landing page.
