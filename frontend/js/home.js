document.addEventListener('DOMContentLoaded', () => {
    // Feature modal content data
    const featureData = {
        'safe-payment': {
            title: 'Safe Payment',
            icon: 'fa-lock',
            message: 'Your payments are secured with industry-leading encryption and security protocols. We accept multiple payment methods including Visa, MasterCard, and Cash on Delivery. All transactions are protected by secure SSL certificates to ensure your financial information remains confidential and safe.'
        },
        'easy-exchange': {
            title: 'Easy Exchanges',
            icon: 'fa-exchange-alt',
            message: 'Not satisfied with your purchase? We offer hassle-free exchange policy within 7 days of delivery. Simply contact our customer support team, and we\'ll help you exchange your product for a different model or variant. No questions asked, quick processing!'
        },
        'fast-delivery': {
            title: 'Fast Delivery',
            icon: 'fa-truck',
            message: 'We guarantee fast and reliable delivery across the entire country. Most orders are delivered within 2-5 business days. Track your order in real-time and receive updates at every step. Our logistics partner ensures your products arrive in perfect condition.'
        }
    };

    // Modal elements
    const featureModal = document.getElementById('feature-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalIcon = document.querySelector('.modal-icon');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const modalCloseIcon = document.querySelector('.modal-close');

    // Feature button click handler
    const featureButtons = document.querySelectorAll('.feature-btn');
    featureButtons.forEach(button => {
        button.addEventListener('click', () => {
            const feature = button.dataset.feature;
            const data = featureData[feature];
            
            if (data) {
                // Update modal content
                modalTitle.textContent = data.title;
                modalMessage.textContent = data.message;
                modalIcon.className = `modal-icon fas ${data.icon}`;
                
                // Show modal
                featureModal.classList.add('active');
            }
        });
    });

    // Close modal function
    const closeModal = () => {
        featureModal.classList.remove('active');
    };

    // Close button handlers
    modalCloseBtn.addEventListener('click', closeModal);
    modalCloseIcon.addEventListener('click', closeModal);

    // Close modal when clicking outside
    featureModal.addEventListener('click', (e) => {
        if (e.target === featureModal) {
            closeModal();
        }
    });

    // Search functionality
    const searchBtn = document.querySelector('.search-wrapper button');
    const searchInput = document.querySelector('.search-wrapper input');

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            console.log(`Searching for: ${query}`);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Fetch and render products
    const productGrid = document.querySelector('.product-grid');
    let allProducts = []; // Store all products for reference
    
    if (productGrid) {
        fetch('product.json')
            .then(response => response.json())
            .then(data => {
                allProducts = data; // Store all products
                
                // Filter to show only first 8 products (those marked with "page": "home")
                const homeProducts = data.filter(product => product.page === 'home');
                
                homeProducts.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.dataset.productId = product.id;
                    
                    productCard.innerHTML = `
                        <div class="img-container">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            <p class="price">${product.price}</p>
                            <button class="view-btn">VIEW DETAILS</button>
                        </div>
                    `;
                    
                    productGrid.appendChild(productCard);
                });
            })
            .catch(error => console.error('Error loading products:', error));
            
        productGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-btn')) {
                const productCard = e.target.closest('.product-card');
                const productId = parseInt(productCard.dataset.productId);
                
                // Find the full product data by ID
                const fullProduct = allProducts.find(p => p.id === productId);
                
                if (fullProduct) {
                    // Store complete product data in localStorage
                    const productData = {
                        id: fullProduct.id,
                        name: fullProduct.name,
                        price: fullProduct.price,
                        image: fullProduct.image,
                        description: fullProduct.description
                    };
                    localStorage.setItem('selectedProduct', JSON.stringify(productData));
                    
                    // Redirect to product detail page
                    window.location.href = 'product-detail.html';
                }
            }
        });
    }
});
