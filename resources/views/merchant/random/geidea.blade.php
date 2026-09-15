<!DOCTYPE html>
<html>
<head>
    <title>Geidea Checkout</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            font-family: 'Poppins', sans-serif;
        }

        .pay-btn {
            background: #007bff;
            color: #fff;
            font-size: 18px;
            font-weight: 600;
            padding: 15px 40px;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }

        .pay-btn:hover {
            background: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        }

        .pay-btn:active {
            transform: scale(0.97);
        }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://www.merchant.geidea.net/hpp/geideaCheckout.min.js"></script>
    <script>
        // You will inject this sessionId dynamically from your backend/controller
        const sessionId = "{{ $session_id }}"; // if using Blade or similar templating engine

    // Start payment directly
    function startPayment() {
      if (!sessionId) {
        alert('Error: Session ID not found');
        return;
      }

      // Initialize GeideaCheckout
      const payment = new GeideaCheckout(onSuccess, onError, onCancel);

      // Start the payment
      payment.startPayment(sessionId);
    }

    // Define the onSuccess function
    function onSuccess(data) {
      alert('Success:' + '\n' +
        data.responseCode + '\n' +
        data.responseMessage + '\n' +
        data.detailedResponseCode + '\n' +
        data.detailedResponseMessage + '\n' +
        data.orderId + '\n' +
        data.reference);
    }

    // Define the onError function
    function onError(data) {
      alert('Error:' + '\n' +
        data.responseCode + '\n' +
        data.responseMessage + '\n' +
        data.detailedResponseCode + '\n' +
        data.detailedResponseMessage + '\n' +
        data.orderId + '\n' +
        data.reference);
    }

    // Define the onCancel function
    function onCancel(data) {
      alert('Payment Cancelled:' + '\n' +
        data.responseCode + '\n' +
        data.responseMessage + '\n' +
        data.detailedResponseCode + '\n' +
        data.detailedResponseMessage + '\n' +
        data.orderId + '\n' +
        data.reference);
    }

    window.addEventListener('load', startPayment);
    </script>
</head>
<body>

</body>
</html>
