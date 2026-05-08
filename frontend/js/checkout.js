document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const shippingForm = document.getElementById('shipping-form');
    const paymentForm = document.getElementById('payment-form');
    const shippingInputs = shippingForm.querySelectorAll('input');
    const placeOrderBtn = document.querySelector('.place-order-btn');
    const orderConfirmationUrl = 'orderconfirmation.html';
    
    // Payment method radio buttons
    const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
    
    // Payment detail sections
    const cardDetails = document.getElementById('card-details');
    const bankDetails = document.getElementById('bank-details');
    const codDetails = document.getElementById('cod-details');

    /**
     * Validates if all shipping form inputs are filled
     */
    const isShippingFormComplete = () => {
        return Array.from(shippingInputs).every(input => input.value.trim() !== '');
    };

    /**
     * Handle payment method change - show/hide relevant details
     */
    const handlePaymentMethodChange = () => {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        // Hide all payment details first
        cardDetails.classList.remove('active');
        bankDetails.classList.remove('active');
        codDetails.classList.remove('active');
        
        // Show selected payment method details
        switch(selectedMethod) {
            case 'card':
                cardDetails.classList.add('active');
                break;
            case 'bank':
                bankDetails.classList.add('active');
                break;
            case 'cod':
                codDetails.classList.add('active');
                break;
        }
    };

    /**
     * Validates payment form based on selected payment method
     */
    const validatePaymentForm = () => {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        if (selectedMethod === 'card') {
            const cardholderName = cardDetails.querySelector('input[placeholder="JOHN SMITH"]');
            const cardNumber = cardDetails.querySelector('input[placeholder="1234 5678 9012 3456"]');
            const expiryDate = cardDetails.querySelector('input[placeholder="MM/YY"]');
            const cvv = cardDetails.querySelector('input[placeholder="123"]');
            
            if (!cardholderName.value.trim()) {
                alert('Please enter cardholder name');
                return false;
            }
            if (!cardNumber.value.trim() || cardNumber.value.replace(/\s/g, '').length < 13) {
                alert('Please enter a valid card number');
                return false;
            }
            if (!expiryDate.value.trim()) {
                alert('Please enter expiry date (MM/YY)');
                return false;
            }
            if (!cvv.value.trim() || cvv.value.length < 3) {
                alert('Please enter a valid CVV');
                return false;
            }
        }
        
        return true;
    };

    // Add event listeners to payment method radios
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', handlePaymentMethodChange);
    });

    // Handle shipping form input changes
    shippingInputs.forEach(input => {
        input.addEventListener('input', () => {
            // Optional: Add real-time validation feedback here
        });
    });

    // Handle "Place Order" button click
    placeOrderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Validate shipping form
        if (!isShippingFormComplete()) {
            alert('Please complete your shipping information before placing the order.');
            return;
        }
        
        // Validate payment form
        if (!validatePaymentForm()) {
            return;
        }

        // Disable button to prevent duplicate submissions
        placeOrderBtn.disabled = true;
        placeOrderBtn.style.opacity = '0.8';
        placeOrderBtn.style.cursor = 'not-allowed';
        
        const originalContent = placeOrderBtn.innerHTML;
        placeOrderBtn.innerHTML = 'Processing... <i class="fas fa-spinner fa-spin"></i>';
        
        // Simulate payment processing delay
        setTimeout(() => {
            alert('Order successfully placed! Thank you for shopping at Ms Electronics Hub.');
            placeOrderBtn.innerHTML = 'Order Confirmed <i class="fas fa-check"></i>';
            placeOrderBtn.style.background = '#0d9488';
            placeOrderBtn.style.opacity = '1';
            
            // Redirect to order confirmation page
            setTimeout(() => {
                window.location.href = orderConfirmationUrl;
            }, 1000);
        }, 1500);
    });

    // Initialize with card payment selected
    handlePaymentMethodChange();
});