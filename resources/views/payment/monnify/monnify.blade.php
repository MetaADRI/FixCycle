<!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redirecting to Payment...</title>
    </head>
    <body>
        
        <script type="text/javascript" src="https://sdk.monnify.com/plugin/monnify.js"></script>
        <script>
        
        // Automatically call on page load
        document.addEventListener('DOMContentLoaded', function() {
            payWithMonnify();
        });
        
        function payWithMonnify() {
        	MonnifySDK.initialize({
                amount: "{{ $data['amount'] }}",
                currency: "{{ $data['currency'] }}",
                reference: "{{ $data['paymentReference'] }}",
                customerFullName: "{{ $data['full_name'] }}",
                customerEmail: "{{ $data['email'] }}",
                apiKey: "{{ $data['apiKey'] }}",
                contractCode: "{{ $data['contractCode'] }}",
                paymentDescription: "{{ $data['paymentDescription'] }}",
                metadata: {
                  name: "{{ $data['full_name'] }}",
                },
                onLoadStart: () => {
                  console.log("loading has started");
                },
                onLoadComplete: () => {
                  console.log("SDK is UP");
                },
                onComplete: function (response) {
                  //Implement what happens when the transaction is completed.
                  console.log(response);
                  let reference = response.paymentReference;
                  window.location = "{{$data['success_url']}}"+'?reference=' + reference;
                },
                onClose: function (data) {
                  //Implement what should happen when the modal is closed here
                  console.log(data);
                  let reference = data.paymentReference;
                  window.location = "{{$data['fail_url']}}"+'?reference=' + reference;
                },
            });
        }
        </script>
    </body>
</html>