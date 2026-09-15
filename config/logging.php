<?php

use Monolog\Handler\StreamHandler;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Log Channel
    |--------------------------------------------------------------------------
    |
    | This option defines the default log channel that gets used when writing
    | messages to the logs. The name specified in this option should match
    | one of the channels defined in the "channels" configuration array.
    |
    */

    'default' => env('LOG_CHANNEL', 'daily'),
    'log_max_files' => 5,

    /*
    |--------------------------------------------------------------------------
    | Log Channels
    |--------------------------------------------------------------------------
    |
    | Here you may configure the log channels for your application. Out of
    | the box, Laravel uses the Monolog PHP logging library. This gives
    | you a variety of powerful log handlers / formatters to utilize.
    |
    | Available Drivers: "single", "daily", "slack", "syslog",
    |                    "errorlog", "monolog",
    |                    "custom", "stack"
    |
    */

    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['single'],
        ],

        //        'single' => [
        //            'driver' => 'daily',
        //            'path' => storage_path('logs/laravel.log'),
        //            'level' => 'debug',
        //        ],

        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        //        'slack' => [
        //            'driver' => 'slack',
        //            'url' => env('LOG_SLACK_WEBHOOK_URL'),
        //            'username' => 'Laravel Log',
        //            'emoji' => ':boom:',
        //            'level' => 'critical',
        //        ],
        //        'stderr' => [
        //            'driver' => 'monolog',
        //            'handler' => StreamHandler::class,
        //            'with' => [
        //                'stream' => 'php://stderr',
        //            ],
        //        ],
        //        'syslog' => [
        //            'driver' => 'syslog',
        //            'level' => 'debug',
        //        ],
        'errorlog' => [
            'driver' => 'errorlog',
            'level' => 'debug',
        ],
        //        'expections' => [
        //            'driver' => 'daily',
        //            'path' => storage_path('logs/error.log'),
        //            'level' => 'debug',
        //            'days' => 3,
        //        ],
        'onesignal' => [
            'driver' => 'daily',
            'path' => storage_path('logs/onesignal.log'),
            'level' => 'debug',
            'days' => 3,
        ],
        'booking' => [
            'driver' => 'daily',
            'path' => storage_path('logs/booking.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'google_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/google_api.log'),
            'level' => 'debug',
            // 'days' => 3,
        ],
        'mpessa_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/mpessa_api.log'),
            'level' => 'debug',
        ],
        'paygate_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/paygate_api.log'),
            'level' => 'debug',
        ],
        'payphone_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/payphone_api.log'),
            'level' => 'debug',
        ],
        'aamarpay_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/aamarpay_api.log'),
            'level' => 'debug',
        ],
        'payfast_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/payfast_api.log'),
            'level' => 'debug',
        ],
        'paybox_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/paybox_api.log'),
            'level' => 'debug',
            // 'days' => 15,
        ],
        'payhere_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/payhere_api.log'),
            'level' => 'debug',
        ],
        'mercadocard_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/mercadocard_api.log'),
            'level' => 'debug',
        ],

        'mercadopix_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/mercadopix_api.log'),
            'level' => 'debug',
        ],
        'beyonic' => [
            'driver' => 'daily',
            'path' => storage_path('logs/beyonic.log'),
            'level' => 'debug',
        ],
        'clover_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/clover_api.log'),
            'level' => 'debug',
        ],

        'kushki_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/kushki_api.log'),
            'level' => 'debug',
        ],

        'paygate_global_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/paygate_global_api.log'),
            'level' => 'debug',
        ],
        'dpo_think_payment_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/dpo_think_payment_api.log'),
            'level' => 'debug',
            'days' => 2,
        ],

        'opay_payment_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/opay_payment_api.log'),
            'level' => 'debug',
        ],
        'touch_pay_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/touch_pay_api.log'),
            'level' => 'debug',
        ],

        'gcash_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/gcash_api.log'),
            'level' => 'debug',
        ],

        'flo_payment' => [
            'driver' => 'daily',
            'path' => storage_path('logs/flo_payment.log'),
            'level' => 'debug',
            // 'days' => 15,
        ],
        'maxi_cash' => [
            'driver' => 'daily',
            'path' => storage_path('logs/maxi_cash.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'kbzpay_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/kbzpay_api.log'),
            'level' => 'debug',
            // 'days' => 2,
        ],
        'whatsapp_booking' => [
            'driver' => 'daily',
            'path' => storage_path('logs/whatsapp_booking.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'maillog' => [
            'driver' => 'daily',
            'path' => storage_path('logs/maillog.log'),
            'level' => 'debug',
            'days' => 2,
        ],
        'referral_log' => [
            'driver' => 'daily',
            'path' => storage_path('logs/referral_log.log'),
            'level' => 'debug',
            'days' => 2,
        ],
        'per_day_cron_log' => [
            'driver' => 'daily',
            'path' => storage_path('logs/per_day_cron_log.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'per_minute_cron_log' => [
            'driver' => 'daily',
            'path' => storage_path('logs/per_minute_cron_log.log'),
            'level' => 'debug',
            'days' => 10,
        ],
        'teliberrPay' => [
            'driver' => 'daily',
            'path' => storage_path('logs/teliberrPay.log'),
            'level' => 'debug',
        ],
        'sampay_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/sampay_api.log'),
            'level' => 'debug',
        ],
        'EvMak' => [
            'driver' => 'daily',
            'path' => storage_path('logs/EvMak.log'),
            'level' => 'debug',
        ],
        'paygo_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/paygo_api.log'),
            'level' => 'debug',
        ],
        'kpay_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/kpay_api.log'),
            'level' => 'debug',
        ],
        'MIPS' => [
            'driver' => 'daily',
            'path' => storage_path('logs/MIPS.log'),
            'level' => 'debug',
        ],
        'payriff' => [
            'driver' => 'daily',
            'path' => storage_path('logs/payriff.log'),
            'level' => 'debug',
        ],
        'hubtel' => [
            'driver' => 'daily',
            'path' => storage_path('logs/hubtel.log'),
            'level' => 'debug',
        ],
        'waafi_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/waafi_api.log'),
            'level' => 'debug',
        ],
        'mtrans_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/mtrans_api.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'tingg_checkout' => [
            'driver' => 'daily',
            'path' => storage_path('logs/tingg_checkout.log'),
            'level' => 'debug',
        ],
        'pagadito_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/pagadito_api.log'),
            'level' => 'debug',
        ],
        'viupay_log' => [
            'driver' => 'daily',
            'path' => storage_path('logs/viupay_log.log'),
            'level' => 'debug',
        ],
        'cashpay_log' => [
            'driver' => 'daily',
            'path' => storage_path('logs/cashpay_log.log'),
            'level' => 'debug',
        ],
        'wave_webhook' => [
            'driver' => 'daily',
            'path' => storage_path('logs/wave_webhook.log'),
            'level' => 'debug',
        ],
        'hub2_log' => [
            'driver' => 'daily',
            'path' => storage_path('logs/hub2_log.log'),
            'level' => 'debug',
        ],
        'AzamPay' => [
            'driver' => 'daily',
            'path' => storage_path('logs/AzamPay.log'),
            'level' => 'debug',
        ],
        'paypay_payment_api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/paypay_payment_api.log'),
            'level' => 'debug',
        ],
        'pesepay' => [
            'driver' => 'daily',
            'path' => storage_path('logs/pesepay.log'),
            'level' => 'debug',
        ],
        'Uni5Pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/Uni5Pay.log'),
            'level' => 'debug',
        ],
        'Orangemoney'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/Orangemoney.log'),
            'level' => 'debug',
        ],
        'Tranzak_redirect'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/Tranzak_redirect.log'),
            'level' => 'debug',
        ],
        'momopay_api'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/momopay_api.log'),
            'level' => 'debug',
        ],
        'Airtel_redirect'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/Airtel_redirect.log'),
            'level' => 'debug',
            'days' => 2,
        ],
        'edahab_redirect'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/edahab_redirect.log'),
            'level' => 'debug',
        ],
        'Payaw'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/Payaw.log'),
            'level' => 'debug',
        ],
        'cxpay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/cxpay.log'),
            'level' => 'debug',
        ],
        'bog_pay' => [
            'driver' => 'daily',
            'path' => storage_path('logs/bog_pay.log'),
            'level' => 'debug',
        ],
        'pay_now' => [
            'driver' => 'daily',
            'path' => storage_path('logs/pay_now.log'),
            'level' => 'debug',
        ],
        'fasthub' => [
            'driver' => 'daily',
            'path' => storage_path('logs/fasthub.log'),
            'level' => 'debug',
        ],
        'cacpay' => [
            'driver' => 'daily',
            'path' => storage_path('logs/cacpay.log'),
            'level' => 'debug',
        ],
        'whatsapp_notification_log' => [
            'driver' => 'daily',
            'path' => storage_path('logs/whatsapp_notification_log.log'),
            'level' => 'debug',
        ],
        'peach_pay' => [
            'driver' => 'daily',
            'path' => storage_path('logs/peach_pay.log'),
            'level' => 'debug',
        ],
        'dibsy_pay' => [
            'driver' => 'daily',
            'path' => storage_path('logs/dibsy_pay.log'),
            'level' => 'debug',
        ],
        'dibsy_pay1' => [
            'driver' => 'daily',
            'path' => storage_path('logs/dibsy_pay1.log'),
            'level' => 'debug',
        ],
        'debugger' => [
            'driver' => 'daily',
            'path' => storage_path('logs/debugger.log'),
            'level' => 'debug',
        ],
        'debugger_v1' => [
            'driver' => 'daily',
            'path' => storage_path('logs/debugger_v1.log'),
            'level' => 'debug',
            ],
        'driver_location' => [
            'driver' => 'daily',
            'path' => storage_path('logs/driver_location.log'),
            'level' => 'debug',
        ],
        'orangemoneycore_api'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/orangemoneycore_api.log'),
            'level' => 'debug',
        ],
        'teliberrPayNew'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/teliberrPayNew.log'),
            'level' => 'debug',
        ],
        'places_api'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/places_api.log'),
            'level' => 'debug',
        ],
        'tap_pay_api'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/tap_pay_api.log'),
            'level' => 'debug',
        ],
        'location_queue'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/location_queue.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'orangemoney_b2b'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/orangemoney_b2b.log'),
            'level' => 'debug',
        ],
        'pawapay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/pawapay.log'),
            'level' => 'debug',
        ],
        'whatsapp_booking' => [
            'driver' => 'daily',
            'path' => storage_path('logs/whatsapp_booking.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'pay_suite' => [
            'driver' => 'daily',
           'path' => storage_path('logs/pay_suite.log'),
           'level' => 'debug',
           'days' => 1,
        ],
        'flutterwave_standard' => [
            'driver' => 'daily',
            'path' => storage_path('logs/flutterwave_standard.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'khalti' => [
            'driver' => 'daily',
            'path' => storage_path('logs/khalti.log'),
        ],
        'BudPay' => [
            'driver' => 'daily',
            'path' => storage_path('logs/bud_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'ligidcash' => [
            'driver' => 'daily',
            'path' => storage_path('logs/ligidcash.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'revolt_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/revolt_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'ub_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/ub_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'cash_plus'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/cash_plus.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'net_cash'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/net_cash.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'razor_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/razor_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'imbank_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/imbank_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'esewa_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/esewa_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'flex_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/flex_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'aub_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/aub_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'easy_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/easy_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'MpesaB2C_callback'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/MpesaB2C_callback.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'direction_data'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/direction_data.log'),
            'level' => 'debug',
            'days' => 10,
        ],
        "map_box_api_log"=>[
            'driver' => 'daily',
            'path' => storage_path('logs/map_box_api_log.log'),
            'level' => 'debug',
//            'days' => 1,
        ],
        'xendit_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/xendit_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'sasa_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/sasa_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'iq_retail'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/iq_retail.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'palm_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/palm_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'genie_biz'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/genie_biz_pay.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'paychangu'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/paychangu.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'distance_calculation'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/distance_calculation.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'serdi_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/serdi_pay.log'),
            'level' => 'debug',
            'days' => 10,
        ],
        'world_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/world_pay.log'),
            'level' => 'debug',
            'days' => 10,
        ],
        'ualabis_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/ualabis_pay.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        's3p_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/s3p_pay.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'booking_request_driver'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/booking_request_driver.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'ride_end_api_request'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/ride_end_api_request.log'),
            'level' => 'debug',
            'days' => 15,
        ],
        'selcom_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/selcom_pay.log'),
            'level' => 'debug',
            'days' => 15,
        ],
        'ikhokha_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/ikhokha_pay.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'orangemoney_push'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/orangemoney_push.log'),
            'level' => 'debug',
            'days' => 1,
        ],
        'lenco_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/lenco_pay.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'modempay_api'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/modem_pay.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'stripe_connect'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/stripe_connect.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'geidea'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/geidea.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'ip88_api'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/ip88_api.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'firebase_notification'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/firebase_notification.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'n8n'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/n8n.log'),
            'level' => 'debug',
            'days' => 5,
        ],
        'integration_logger'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/integration_logger.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'monnify_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/monnify_pay.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'apiaryfdi_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/apiaryfdi_pay.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'addpay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/addpay.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'app_string_v1'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/app_string_v1.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'utility_ooze'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/utility.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'clickpesa_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/clickpesa_pay.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'mysafari_pay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/mysafari_pay.log'),
            'level' => 'debug',
            'days' => 7,
        ],
        'yaspay'=> [
            'driver' => 'daily',
            'path' => storage_path('logs/yaspay.log'),
            'level' => 'debug',
            'days' => 7,
        ],
    ],
];
