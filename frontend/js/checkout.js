document.addEventListener('DOMContentLoaded', () => {
    const shippingForm = document.getElementById('shipping-form');
    const paymentForm = document.getElementById('payment-form');
    const shippingInputs = shippingForm ? shippingForm.querySelectorAll('input') : [];
    const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
    const cardDetails = document.getElementById('card-details');
    const bankDetails = document.getElementById('bank-details');
    const codDetails = document.getElementById('cod-details');
    const placeOrderBtn = document.querySelector('.place-order-btn');

    if (!shippingInputs.length || !paymentForm || !placeOrderBtn || !cardDetails || !bankDetails || !codDetails) {
        console.warn('Checkout form elements are missing from the DOM.');
        return;
    }

    const isShippingFormComplete = () => Array.from(shippingInputs).every(input => input.value.trim() !== '');

    const togglePaymentDetails = () => {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');

        cardDetails.classList.remove('active');
        bankDetails.classList.remove('active');
        codDetails.classList.remove('active');

        if (!selectedMethod) {
            return;
        }

        if (selectedMethod.value === 'card') {
            cardDetails.classList.add('active');
        } else if (selectedMethod.value === 'bank') {
            bankDetails.classList.add('active');
        } else if (selectedMethod.value === 'cod') {
            codDetails.classList.add('active');
        }
    };

    const validatePaymentForm = () => {
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked');

        if (!selectedMethod) {
            alert('Please select a payment method.');
            return false;
        }

        if (selectedMethod.value === 'card') {
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

    shippingInputs.forEach((input) => {
        input.addEventListener('input', () => {
            if (isShippingFormComplete()) {
                togglePaymentDetails();
            }
        });
    });

    paymentMethodRadios.forEach((radio) => {
        radio.addEventListener('change', togglePaymentDetails);
    });

    placeOrderBtn.addEventListener('click', (event) => {
        event.preventDefault();

        if (!isShippingFormComplete()) {
            alert('Please complete your shipping information before placing the order.');
            return;
        }

        if (!validatePaymentForm()) {
            return;
        }

        placeOrderBtn.disabled = true;
        placeOrderBtn.style.opacity = '0.8';
        placeOrderBtn.style.cursor = 'not-allowed';
        placeOrderBtn.innerHTML = 'Processing... <i class="fas fa-spinner fa-spin"></i>';

        setTimeout(() => {
            alert('Order successfully placed! Thank you for shopping at Ms Electronics Hub.');
            placeOrderBtn.innerHTML = 'Order Confirmed <i class="fas fa-check"></i>';
            placeOrderBtn.style.background = '#0d9488';
            placeOrderBtn.style.opacity = '1';

            setTimeout(() => {
                window.location.href = './orderconfirmation.html';
            }, 500);
        }, 1500);
    });

    togglePaymentDetails();
});