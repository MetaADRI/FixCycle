<!DOCTYPE html>
<html lang="en">
<head>
    <title>Redirecting to Payment...</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .loading-box {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #ccc;
            border-top: 4px solid #28a745;
            border-radius: 50%;
            margin: 0 auto 15px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading-box">
        <div class="spinner"></div>
        <p>Redirecting to secure payment gateway...</p>
    </div>
        <form id="autoPaymentForm" method="post" action="{{$baseUrl}}">
            @foreach($data as $key=>$field)
                <input type="hidden" name="{{ $key }}" value="{{ $field }}">
            @endforeach
        </form>
        
        <script>
        
        window.onload = function() {
            setTimeout(() => {
                document.getElementById('autoPaymentForm').submit();
            }, 1000);
        };
        </script>
    </div>
   
</body>
</html>