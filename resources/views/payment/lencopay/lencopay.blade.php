<!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirecting to Payment...</title>
    </head>
    <body>

        <script src="{{$url}}"></script>
        <script>
        
        // Automatically call on page load
        document.addEventListener('DOMContentLoaded', function() {
            getPaidWithLenco();
        });
        
        function getPaidWithLenco() {
        	LencoPay.getPaid({
        		key: "{{$data['public_key']}}", // your Lenco public key
        		reference: "{{$data['reference']}}", // unique reference
        		email: "{{$data['email']}}",
        		amount: "{{$data['amount']}}",
        		label: 'Lenco Api',
        		currency: "{{$data['currency']}}",
        		channels: ["card", "mobile-money"],
        		customer: {
        			firstName: "{{$data['first_name']}}",
        			lastName: "{{$data['last_name']}}",
        			phone: "{{$data['phone']}}",
        		},
        		onSuccess: function (response) {
        			const reference = response.reference;
        			window.location = "{{$data['success_url']}}"+'?reference=' + response.reference;
        		},
        		onClose: function () {
        			window.location = "{{$data['fail_url']}}"+'?reference=' + "{{$data['reference']}}";
        		},
        		onConfirmationPending: function () {
        			alert('Your purchase will be completed when the payment is confirmed');
        		},
        	});
        }
        </script>
    </body>
</html>
