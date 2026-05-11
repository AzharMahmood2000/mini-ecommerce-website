# Mini E-Commerce Frontend

This project is organized so only `index.html` and `README.md` stay at the root.

```text
frontend/
├── index.html
├── README.md
├── product.json
├── assets/
│   ├── images/   # shared image assets used by the app
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

Login button: When no user is signed in the navbar shows a Login button that opens the login page; after a successful sign-in the app stores a `currentUser` object in localStorage and shows a profile icon with a small menu (Profile / Logout). Clicking Logout clears `currentUser`, returns the navbar to show Login, and redirects to the landing page.
when  click a profile button profile page will open.