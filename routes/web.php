<?php

use App\Http\Controllers\Corporate\DepartmentController;

Route::get('data',function(){
    return json_encode([
        "date" => "2024-10-01",
        "from_time"=> "10:00:00",
        "to_time"=>"14:00:00"
    ]);
});

Route::get('connect-card/{publishableKey}/{connectAccountId}/{currency}/{is_update_card}', ['uses' => 'StripeConnect\StripeController@showConnectCardForm'])->name('connect.card.form');
Route::get('stripe-connect-card-success',function(){
return "success.";
})->name('stripe.connect.card.success');
Route::post('save-card-token', ['uses' => 'StripeConnect\StripeController@saveCardToken'])->name('save.card.token');


Route::get('driver/locaion', ['as' => 'driverTrack', 'uses' => 'Merchant\DriverController@driver_location']);
Route::get('share/ride/{type}/{locale}/{code}', ['as' => 'ride.share', 'uses' => 'Merchant\RideShareController@index']);
Route::get('return-dpo', 'Merchant\DashBoardController@returndpo');
Route::get('migrateData', 'ImportController@test');
Route::get('redirectPeach', 'PaymentMethods\RandomPaymentController@redirectPeach')->name('redirectPeach');

Route::get('/send-test-invoice','Merchant\emailTemplateController@SendTestOtpInvoice');
Route::get('user-otp','Merchant\emailTemplateController@dummy');  //check dummy url
Route::get('subscription','CronJob\PerMinuteCronController@dummy');  //check dummy url
Route::get('Subscribe_product_place','CronJob\PerMinuteCronController@Subscribe_product_place');  //check dummy url

/*Cron Job start */
Route::get('/per-minute-functionalities', 'CronJob\CronController@perMinuteCron');
Route::get('/every-day-functionalities', 'CronJob\CronController@perDayCron');
Route::get('/give-permission-super-admin', 'Merchant\DashBoardController@givePermissionToSuperAdmin');

/*Cron Job end */


/* Twilio Whatsapp */
Route::post('whatsapp-message', 'Merchant\WhatsappController@newMessage');
Route::post('message-status', 'Merchant\WhatsappController@messageStatus');


Route::get('mercado-webpage', 'Merchant\DashBoardController@mercadoPage');

// Paypay payment Yamini
Route::any('/paypay-callback', 'PaymentMethods\PayPay\PaypayController@PaymentCallBack')->name('paypay-callback');

Route::get('paymentfail', function () {
    return 'failed';
});
Route::get('paymentcomplate', function () {
    return 'done';
})->name("paymentcomplate");

/* Clear cache of laravel manually*/
Route::get('/clear-cache', function () {
    Artisan::call('cache:clear');
    Artisan::call('route:clear');
    Artisan::call('view:clear');
    return "Cache is cleared";
});

Route::get('/queue-start', function () {
    Artisan::call('queue:listen');
    return "Queue started";
});

Route::get('/queue-restart', function () {
    Artisan::call('queue:restart');
    return "Queue now restarted";
});

Route::get('/', function () {
    return view('welcome');
});
Route::get('/home', function () {
    return view('welcome');
});
Route::get('/404', function () {
    //return view('apporio');
    return view('404');
})->name('404');


// User delete Account from playstore
Route::get('user/{alias_name}/login', 'Auth\UserLoginController@showLoginForm')->name('user.login');
Route::post('/user/login/', 'Auth\UserLoginController@login')->name('user.login.submit');

Route::group(['middleware' => ['auth:user']], function () {
    Route::get('user/details', 'Merchant\UserController@showDetails')->name('user.details');
    Route::post('/user/delete/', 'Merchant\UserController@userDelete')->name('user.delete');
    Route::get('/user/logout', ['as' => 'user.logout', 'uses' => 'Auth\UserLoginController@logout']);
});

// Driver delete Account from playstore
Route::get('driver/{alias_name}/login', 'Auth\DriverLoginController@showLoginForm')->name('driver.login');
Route::post('/driver/login/', 'Auth\DriverLoginController@login')->name('driver.login.submit');

Route::group(['middleware' => ['auth:driver']], function () {
    Route::get('driver/details', 'Merchant\DriverController@showDetails')->name('driver.details');
    Route::post('/driver/delete/', 'Merchant\DriverController@driverDelete')->name('driver.delete');
    Route::get('/driver/logout', ['as' => 'driver.logout', 'uses' => 'Auth\DriverLoginController@logout']);
});

// Business Segment delete Account for playstore
Route::get('business-segment/user/{alias_name}/login', 'Auth\BusinessSegmentLoginController@showUserLoginForm')->name('business-segment.user.login');
Route::post('/business-segment/user/login/', 'Auth\BusinessSegmentLoginController@UserLogin')->name('business-segment.user.login.submit');

Route::group(['middleware' => ['auth:business-segment-user']], function () {
    Route::get('business-segment/user/details', 'Merchant\BusinessSegmentController@showBusinessSegmentDetails')->name('business-segment.user.details');
    Route::post('/business-segment/user/delete/', 'Merchant\BusinessSegmentController@businessSegmentDelete')->name('business-segment.user.delete');
    Route::get('/business-segmen/user/logout', ['as' => 'business-segment.user.logout', 'uses' => 'Auth\BusinessSegmentLoginController@UserLogout']);
});

Route::prefix('merchant/admin')->group(function () {
    Route::group(['middleware' => ['guest:merchant']], function () {
        Route::get('{alias_name}/login', 'Auth\MerchantLoginController@showLoginForm')->name('merchant.login');
        Route::post('/login/{alias_name}', 'Auth\MerchantLoginController@login')->name('merchant.login.submit');

//        Route::post('reset_password_without_token', 'Auth\MerchantLoginController@validatePasswordRequest')->name('password.request');
//        Route::post('reset_password_with_token', 'Auth\MerchantLoginController@resetPassword')->name('forgot.password.update');
//
//        Route::get('password/forgot', 'Auth\MerchantLoginController@forgotPassword')->name('forgot.password');
//        Route::get('password/reset/{token}', 'Auth\MerchantLoginController@resetPasswordForm')->name('reset.password');
        Route::get('{alias_name}/password/reset', ['as' => 'merchant.forget.password.form', 'uses' => 'Auth\ForgotPasswordController@showLinkRequestForm']);
        Route::post('password/email/{alias_name}', ['as' => 'password.email', 'uses' => 'Auth\ForgotPasswordController@sendEmail']);
        Route::get('{alias_name}/password/reset/{token?}', 'Auth\ResetPasswordController@showResetForm')->name('password.reset');
        Route::post('password/reset/{alias_name}', 'Auth\ResetPasswordController@reset')->name('password.update');
    });


    // Route::get('app-string-translation','Merchant\ApplicatonStringController@appStringCorrection');

    Route::group(['middleware' => ['auth:merchant', 'isactiveuser', 'admin_language']], function () {

        Route::get('toll-test', ['as' =>'merchant.test-toll','uses' =>  'Merchant\DashBoardController@testToll']);
        Route::get('/get-merchant-key', ['as' => 'merchant.get-key', 'uses' => 'DashBoardController@getKeys']);
        // logs of system
//        Route::get('logs', '\Rap2hpoutre\LaravelLogViewer\LogViewerController@index');
        Route::get('/test-referral', 'Helper\ReferralController@testReferralSystem');

        // reward points routes
        Route::post('reward-system/store', 'Merchant\RewardController@SaveRewardSystem')->name('merchant.rewardSystem.store');
        Route::post('reward-system/{id}/update', 'Merchant\RewardController@UpdateRewardSystem')->name('merchant.rewardSystem.update');
        Route::delete('reward-system/{id}/delete', 'Merchant\RewardController@destroy')->name('merchant.rewardSystem.delete');
        Route::get('reward-system/{id}/edit', 'Merchant\RewardController@edit')->name('merchant.rewardSystem.edit');
        Route::resource('reward-points', 'Merchant\RewardController');

        //reward gift
        Route::get('reward-gifts', 'Merchant\RewardGiftController@index')->name('reward-gifts.index');
        Route::get('reward-gifts/create', 'Merchant\RewardGiftController@create')->name('reward-gifts.create');
        Route::get('reward-gifts/{id}/edit', 'Merchant\RewardGiftController@edit')->name('reward-gifts.edit');
        Route::post('reward-gifts/store', 'Merchant\RewardGiftController@store')->name('reward-gifts.store');
        Route::post('reward-gifts/{id}/update', 'Merchant\RewardGiftController@update')->name('reward-gifts.update');
        Route::delete('reward-gifts/{id}/delete', 'Merchant\RewardGiftController@delete')->name('reward-gifts.delete');

        // tutu - cancel rate
        Route::get('cancelrate', 'Merchant\CancelRateController@index')->name('merchant.cancelrate');
        Route::get('cancelrate/create', 'Merchant\CancelRateController@create')->name('merchant.cancelrate.create');
        Route::get('cancelrate/{id}/edit', 'Merchant\CancelRateController@edit')->name('merchant.cancelrate.edit');
        Route::post('cancelrate/store', 'Merchant\CancelRateController@store')->name('merchant.cancelrate.store');
        Route::put('cancelrate/{id}/update', 'Merchant\CancelRateController@update')->name('merchant.cancelrate.update');
        Route::post('cancelrate/{id}/destroy', 'Merchant\CancelRateController@destroy')->name('merchant.cancelrate.destroy');


        //end

        Route::get('/sendinvoice/{id}', ['as' => 'admin.sendinvoice', 'uses' => 'Merchant\BookingController@bookingInvoiceSend']);
        Route::get('/brevo/sendinvoice/{id}', ['as' => 'admin.sendinvoice.brevo', 'uses' => 'Merchant\BookingController@bookingInvoiceSendBrevo']);
        Route::get('taxicompany/statusupdate/{id}', 'Merchant\TaxiCompanyController@statusupdate')->name('taxicompany.status');

        //        Route::resource('taxicompany', 'Merchant\TaxiCompanyController');
        Route::get('taxi-company', ['as' => 'merchant.taxi-company', 'uses' => 'Merchant\TaxiCompanyController@index']);
        Route::get('taxi-company/add/{id?}', ['as' => 'merchant.taxi-company.add', 'uses' => 'Merchant\TaxiCompanyController@add']);
        Route::post('taxi-company/save/{id?}', ['as' => 'merchant.taxi-company.save', 'uses' => 'Merchant\TaxiCompanyController@save']);

        Route::get('agents', ['as' =>'merchant.agents','uses' =>  'Merchant\AgentController@index']);
        Route::get('agent/add/{id?}', ['as' => 'merchant.agent.add','uses' => 'Merchant\AgentController@add']);
        Route::post('agent/save/{id?}', ['as' => 'merchant.agent.save','uses' => 'Merchant\AgentController@save']);
        Route::get('agent/status/{id}', ['as' => 'merchant.agent.status', 'uses' => 'Merchant\AgentController@StatusUpdate']);

        Route::post('/taxicompany/AddMoney', ['as' => 'taxicompany.AddMoney', 'uses' => 'Merchant\TaxiCompanyController@AddMoney']);
        Route::get('/taxicompany/wallet/{id}', ['as' => 'merchant.taxicompany.wallet.show', 'uses' => 'Merchant\TaxiCompanyController@Wallet']);
        Route::get('/taxicompany/transactions/{id}', ['as' => 'merchant.taxicompany.transactions', 'uses' => 'Merchant\TransactionController@TaxiCompanyTransaction']);
        Route::post('/taxicompany/transactions/{id}', ['as' => 'merchant.taxicompany.transactions.search', 'uses' => 'Merchant\TransactionController@TaxiCompanySearch']);

//        Route::resource('/busBooking', 'Merchant\BusController');
        Route::resource('/website-user-home-headings', 'Merchant\WebsiteUserHomeController', ['only' => ['index', 'edit', 'store']]);
        Route::resource('/website-driver-home-headings', 'Merchant\WebsiteDriverHomeController', ['only' => ['index', 'edit', 'store']]);
        //        Route::resource('/weightunit', 'Merchant\WeightUnitController');
        Route::get('weight-unit', ['as' => 'weightunit.index', 'uses' => 'Merchant\WeightUnitController@index']);
        Route::get('weight-unit/add/{id?}', ['as' => 'weightunit.add', 'uses' => 'Merchant\WeightUnitController@add']);
        Route::post('weight-unit/save/{id?}', ['as' => 'weightunit.save', 'uses' => 'Merchant\WeightUnitController@save']);
        Route::post('weight-unit/delete/{id?}', ['as' => 'weightunit.destroy', 'uses' => 'Merchant\WeightUnitController@save']);
        Route::get('weight-unit/bulk-import', ['as' => 'weightunit.bulk-import', 'uses' => 'Merchant\WeightUnitController@bulkImport']);
        Route::post('weight-unit/bulk-import', ['as' => 'weightunit.bulk-import.preview', 'uses' => 'Merchant\WeightUnitController@bulkImportPreview']);
        Route::post('weight-unit/bulk-import/submit', ['as' => 'weightunit.bulk-import.submit', 'uses' => 'Merchant\WeightUnitController@bulkImportSubmit']);

         // Delivery Package
         Route::get('delivery-package', ['as' => 'merchant.delivery_package', 'uses' => 'Merchant\VehicleDeliveryPackageController@index']);
         Route::get('delivery-package/add/{id?}', ['as' => 'merchant.delivery-package.add', 'uses' => 'Merchant\VehicleDeliveryPackageController@add']);
         Route::post('delivery-package/save/{id?}', ['as' => 'merchant.delivery-package.save', 'uses' => 'Merchant\VehicleDeliveryPackageController@update']);


        //        Route::resource('subscription', 'Merchant\SubscriptionController');
        //        Route::get('/subscription/', 'Merchant\SubscriptionController@index');
        Route::get('/subscription/add/{id?}', 'Merchant\SubscriptionController@add');
        Route::post('/subscription/save/{id?}', 'Merchant\SubscriptionController@save');
        Route::resource('subscription', 'Merchant\SubscriptionController');
        Route::get('/renewable/subscription/', ['as' => 'merchant.renewable.subscription', 'uses' => 'Merchant\SubscriptionController@getRenewableSubscriptionList']);
        Route::get('/renewable/subscription/add/{id?}', ['as' => 'merchant.renewable.subscription.add', 'uses' => 'Merchant\SubscriptionController@addRenewableSubscription']);
        Route::post('/renewable/subscription/{id?}', ['as' => 'merchant.renewable.subscription.store', 'uses' => 'Merchant\SubscriptionController@storeRenewableSubscription']);
        Route::get('/subscription-report', ['as' => 'merchant.subscription.report', 'uses' => 'Merchant\SubscriptionController@SubscriptionReport']);



        Route::get('/subscription/change_status/{id}/{status}', 'Merchant\SubscriptionController@Change_Status')->name('subscription.changepackstatus');
        Route::post('/web-playerid-subscription', 'Merchant\DashBoardController@webPlayerIdSubscription')->name('merchant-playerid.onesignal');
        //        Route::post('/remove-playerid', 'Merchant\DashBoardController@removeWebPlayerId')->name('merchant-remove-playerid.onesignal');
        Route::resource('/duration', 'Merchant\DurationController', ['only' => ['index', 'edit', 'update']]);
        Route::get('/duration/add/{id?}', 'Merchant\DurationController@add');
        Route::post('/duration/save/{id?}', 'Merchant\DurationController@save');
        Route::resource('/driver-commission-choices', 'Merchant\DriverCommissionChoiceController', ['only' => ['index', 'edit', 'update']]);

        Route::get('/paymentMethod', ['as' => 'merchant.paymentMethod.index', 'uses' => 'Merchant\PaymentMethodController@index']);
        Route::get('/paymentMethod/{id}', ['as' => 'merchant.paymentMethod.edit', 'uses' => 'Merchant\PaymentMethodController@edit']);
        Route::put('/paymentMethod/{id}', ['as' => 'merchant.paymentMethod.update', 'uses' => 'Merchant\PaymentMethodController@update']);

        Route::get('/serviceType', ['as' => 'merchant.serviceType.index', 'uses' => 'Merchant\ServiceTypeController@index']);
        Route::get('/serviceType/{segment_id}/{id?}', ['as' => 'merchant.serviceType.edit', 'uses' => 'Merchant\ServiceTypeController@add']);
        Route::get('/serviceTypeRemoveImage/{id}', ['as' => 'merchant.serviceType.image.remove', 'uses' => 'Merchant\ServiceTypeController@serviceImageDelete']);
        Route::put('/serviceType/{id?}', ['as' => 'merchant.serviceType.update', 'uses' => 'Merchant\ServiceTypeController@update']);
        Route::get('/serviceType/change_status/{id?}/{status?}', ['as' => 'merchant.serviceType.changestatus', 'uses' => 'Merchant\ServiceTypeController@changeStatus']);
        Route::post('/serviceType/assignToStore', ['as' => 'merchant.serviceType.assign-to-store', 'uses' => 'Merchant\ServiceTypeController@assignToStore']);

        Route::post("/save-segment-group-icon", ['as' => 'merchant.segment_group_icon', 'uses' => 'Merchant\ServiceTypeController@saveSegemtGroupIcon']);
        //for checking merchant configuration
        Route::get('/checkConfiguration', ['as' => 'merchant.checkConfiguration.index', 'uses' => 'Merchant\CheckConfigurationController@index']);

        //bons bank to bank qr payment gateway
        Route::post('/checkConfiguration/{id?}', ['as' => 'merchant.saveBonsBankQr', 'uses' => 'Merchant\CheckConfigurationController@saveBonsBankQr']);

        //ajax route
        Route::post('/getAllPriceCard', ['as' => 'getAllPriceCard', 'uses' => 'Helper\AjaxController@GetPriceCard']);
        Route::post('/ajax/area', ['as' => 'ajax.area', 'uses' => 'Helper\AjaxController@AreaList']);
        Route::post('/ajax/area-lat-lng', ['as' => 'ajax.area.lat_lng', 'uses' => 'Helper\AjaxController@AreaLatLng']);
        Route::post('/ajax/vehiclemodel', ['as' => 'ajax.vehiclemodel', 'uses' => 'Helper\AjaxController@VehicleModel']);
        Route::post('/ajax/services', ['as' => 'ajax.services', 'uses' => 'Helper\AjaxController@VehicleServices']);
        Route::post('/getRideConfig', ['as' => 'merchant.getRideConfig', 'uses' => 'Helper\AjaxController@VehicleConfig']);
        Route::post('/price-card-service-config', ['as' => 'merchant.price.card.service.config', 'uses' => 'Helper\AjaxController@ServiceConfig']);
        Route::post('/getServices', ['as' => 'merchant.area.services', 'uses' => 'Helper\AjaxController@ServiceType']);
        Route::post('/getServicescashback', ['as' => 'merchant.area.servicescashback', 'uses' => 'Helper\AjaxController@ServiceTypeCashBack']);
        Route::post('/getVehicletypescashback', ['as' => 'merchant.area.vehicletypescashback', 'uses' => 'Helper\AjaxController@VehicleTypeCashBack']);
        Route::get('/cashback/change_status/{id}/{status}', 'Merchant\CashbackController@Change_Status')->name('cashback.changestatus');
        Route::resource('cashback', 'Merchant\CashbackController');
        Route::post('/checkPool', ['as' => 'merchant.area.checkPool', 'uses' => 'Helper\AjaxController@CheckPool']);
        Route::post('/getVehicle', ['as' => 'get.area.vehicles', 'uses' => 'Helper\AjaxController@VehicleType']);
        Route::post('/getVehicleSegment', ['as' => 'get.area.vehicle.segment', 'uses' => 'Helper\AjaxController@VehicleSegment']);
        Route::post('/get-area-segment', ['as' => 'get.area.segment', 'uses' => 'Helper\AjaxController@countryAreaSegment']);
        Route::post('/checkPriceCard', ['as' => 'merchant.checkPriceCard', 'uses' => 'Helper\AjaxController@PriceCard']);
        Route::get('/ajax/vehicle-type-details/{id}', 'Helper\AjaxController@getVehicleTypeDetails')->name("ajax.services.vehicleTypeDetails");
        Route::get('/ajax/vehicle-types/{countryAreaID}/{engineType}', 'Helper\AjaxController@getVehicleTypes')->name("ajax.services.vehicleTypes");
        Route::get('/ajax/dvla-details/{registration_number}/{merchant_id}', 'Helper\AjaxController@dvla_details')->name('ajax.services.dvla');
        Route::get('/ajax/get-driver-moving-status', 'Helper\AjaxController@getDriverMovingStatus')->name('ajax.services.getDriverMovingStatus');
        Route::get('/get-business-segment/list','Helper\AjaxController@getMerchantBusinessSegmentList')->name('merchant.business-segment.list');

        ////excel route START
        Route::get('/excel/user/{id}', ['as' => 'excel.users', 'uses' => 'ExcelController@UserDetailExport']);
        Route::get('/excel/user', ['as' => 'excel.user', 'uses' => 'ExcelController@UserExport']);
        Route::get('/excel/user-wallet-trans/{id}', ['as' => 'excel.userwallettrans', 'uses' => 'ExcelController@userWalletTransaction']);
        Route::get('/excel/user-Rides/{id}', ['as' => 'excel.userRides', 'uses' => 'ExcelController@userRides']);
        Route::get('/excel/driver', ['as' => 'excel.driver', 'uses' => 'ExcelController@DriverExport']);
        Route::get('/excel/basic-signup-driver', ['as' => 'excel.basicsignupdriver', 'uses' => 'ExcelController@basicSignupDriver']);
        Route::get('/excel/pending-drivers', ['as' => 'excel.pendingdrivers', 'uses' => 'ExcelController@pendingDrivers']);
        Route::get('/excel/rejected-driver', ['as' => 'excel.rejecteddriver', 'uses' => 'ExcelController@rejectedDriver']);
        Route::get('/excel/blocked-drivers', ['as' => 'excel.blockeddrivers', 'uses' => 'ExcelController@blockedDrivers']);
        Route::get('/excel/pending-vehicles', ['as' => 'excel.pendingvehicles', 'uses' => 'ExcelController@pendingVehicles']);
        Route::get('/excel/ride-now', ['as' => 'excel.ridenow', 'uses' => 'ExcelController@RideNow']);
        Route::get('/excel/ride-later', ['as' => 'excel.ridelater', 'uses' => 'ExcelController@RideLater']);
        Route::get('/excel/ride-complete', ['as' => 'excel.complete', 'uses' => 'ExcelController@RideComplete']);
        Route::get('/excel/ride-cancel', ['as' => 'excel.ridecancel', 'uses' => 'ExcelController@CancelledRide']);
        Route::get('/excel/ride-failed', ['as' => 'excel.ridefailed', 'uses' => 'ExcelController@FailedRide']);
        Route::get('/excel/auto-cancel-rides', ['as' => 'excel.autocancelrides', 'uses' => 'ExcelController@autocancelrides']);
        Route::get('/excel/all-rides', ['as' => 'excel.allrides', 'uses' => 'ExcelController@allRides']);
        Route::get('/excel/sub-admin', ['as' => 'excel.subadmin', 'uses' => 'ExcelController@SubAdmin']);
        Route::get('/excel/transactions', ['as' => 'excel.transactions', 'uses' => 'ExcelController@Transactions']);
        Route::get('/excel/sos/requests', ['as' => 'excel.sosrequests', 'uses' => 'ExcelController@SosRequests']);
        Route::get('/excel/ratings', ['as' => 'excel.ratings', 'uses' => 'ExcelController@Ratings']);
        Route::get('/excel/customer_support', ['as' => 'excel.customersupports', 'uses' => 'ExcelController@CustomerSupports']);
        Route::get('/excel/promotion-notifications', ['as' => 'excel.promotionnotifications', 'uses' => 'ExcelController@PromotionNotifications']);
        Route::get('/excel/countries-export', ['as' => 'excel.countriesexport', 'uses' => 'ExcelController@countriesExport']);
        Route::get('/excel/booking-report', ['as' => 'excel.bookingreport', 'uses' => 'ExcelController@BookingReport']);
        Route::get('/excel/booking-variance-report', ['as' => 'excel.bookingvariancereport', 'uses' => 'ExcelController@BookingVarianceReport']);
        Route::get('/excel/user-wallet-report', ['as' => 'excel.userwalletreport', 'uses' => 'ExcelController@UserWalletReport']);
        Route::get('/excel/driver-wallet-report', ['as' => 'excel.driverwalletreport', 'uses' => 'ExcelController@DriverWalletReport']);
        Route::get('/excel/driver-acceptance-report', ['as' => 'excel.driveracceptancereport', 'uses' => 'ExcelController@DriverAcceptanceReport']);
        Route::get('/excel/driver-online-time-report', ['as' => 'excel.driveronlinetimereport', 'uses' => 'ExcelController@DriverOnlineTimeReport']);
        Route::get('/excel/driver-accounts', ['as' => 'excel.driveraccounts', 'uses' => 'ExcelController@DriverAccounts']);
        Route::get('/excel/driver-bills/{id}', ['as' => 'excel.driverbills', 'uses' => 'ExcelController@DriverBills']);
        Route::get('/excel/promo-code', ['as' => 'excel.promocode', 'uses' => 'ExcelController@PromoCode']);
        Route::get('/excel/price-card', ['as' => 'excel.pricecard', 'uses' => 'ExcelController@PriceCard']);
        Route::get('/excel/service-area-management', ['as' => 'excel.serviceareamanagement', 'uses' => 'ExcelController@ServiceAreaManagement']);
        Route::get('/excel/user-cashout-management', ['as' => 'excel.usercashoutmanagement', 'uses' => 'ExcelController@UserCashoutManagement']);
        Route::get('/excel/vehicle-types', 'ExcelController@vehicleTypes')->name('excel.vehicle-types');
        Route::get('/excel/refer', ['as' => 'excel.refer', 'uses' => 'ExcelController@Referral']);
        Route::get('excel/driver-without-refer', ['as' => 'excel.driver.without.refer', 'uses' => 'ExcelController@DriversWithoutReferral']);
        Route::get('/excel/earning', ['as' => 'excel.earning', 'uses' => 'ExcelController@earningExport']);
        Route::get('/excel/cashout', ['as' => 'excel.cashout', 'uses' => 'ExcelController@cashoutExport']);
        Route::get('/excel/cashout', ['as' => 'driver.excel.cashout', 'uses' => 'ExcelController@driverCashoutExport']);
        Route::get('/excel/vehiclemake', ['as' => 'excel.vehicle.make', 'uses' => 'ExcelController@VehicleMake']);
        Route::get('/excel/vehiclemodel', ['as' => 'excel.vehicle.model', 'uses' => 'ExcelController@VehicleModel']);
        Route::get('/excel/merchant-orders', ['as' => 'excel.merchant.orders', 'uses' => 'ExcelController@OrderManagement']);
        Route::get('/excel/payment/transactions', ['as' => 'excel.payment.transactions', 'uses' => 'ExcelController@PaymentTransactions']);
        Route::get('/excel/wallet-balance-report', ['as' => 'excel.wallet-balance.report', 'uses' => 'ExcelController@WalletBalanceReportExport']);
        Route::get('/excel/driver-status-report', ['as' => 'excel.driver-status', 'uses' => 'ExcelController@DriverStatusExport']);
        Route::get('/excel/document-near-expiry', ['as' => 'excel.doc-near-expiry', 'uses' => 'Merchant\ExpireDocumentController@DocumentNearExpiryExport']);
        Route::get('/excel/downloads', ['as' => 'excel.downloads', 'uses' => 'ExcelController@Downloads']);
        //excel Routes END

        //User Vehicles Routes
        Route::get('/user/allvehicles/', ['as' => 'merchant.uservehicles.allvehicles', 'uses' => 'Merchant\UserVehicleController@AllVehicle']);
        Route::get('/user/vehicles/rejected/', ['as' => 'merchant.uservehicles.rejected', 'uses' => 'Merchant\UserVehicleController@RejectedVehicle']);
        Route::get('/user/pending/vehicles/', ['as' => 'merchant.uservehicles.pending.vehicles', 'uses' => 'Merchant\UserVehicleController@PendingVehicle']);
        Route::get('/user/pending/deleted/', ['as' => 'merchant.uservehicles.deleted', 'uses' => 'Merchant\UserVehicleController@DeletedVehicle']);
        Route::get('user/vehicle/details/{id}', ['as' => 'merchant.uservehicles-vehicledetails', 'uses' => 'Merchant\UserVehicleController@VehiclesDetail']);
        Route::get('user/vehicle/verify/{id}/{status}', ['as' => 'merchant.uservehicles-vehicle-verify', 'uses' => 'Merchant\UserController@verifyUserVehicle']);
        Route::get('user/uservehicel', ['as' => 'merchant.user.uservehicles', 'uses' => 'Merchant\UserVehicleController@UserVehicle']);
        Route::get('/driver_configuration', ['as' => 'merchant.driver_configuration', 'uses' => 'Merchant\ConfigurationController@DriverConfiguration']);
        Route::post('/driver_configuration', ['as' => 'merchant.driver_configuration.store', 'uses' => 'Merchant\ConfigurationController@StoreDriverConfiguration']);

        //reports
        //        Route::get('/report/booking', ['as' => 'report.booking', 'uses' => 'Merchant\ReportController@index']);
        //        Route::get('/report/booking/search', ['as' => 'report.booking.search', 'uses' => 'Merchant\ReportController@SearchBooking']);
        //
        //        Route::get('/report/bookingVariance', ['as' => 'report.bookingVariance', 'uses' => 'Merchant\ReportController@BookingVariance']);
        //        Route::get('/report/bookingVariance/search', ['as' => 'report.bookingVariance.search', 'uses' => 'Merchant\ReportController@SearchBookingVariance']);
        //        Route::get('/report/companyReferral', ['as' => 'report.company.referral', 'uses' => 'Merchant\ReportController@CompanyReferral']);
        //        Route::get('/report/areaReport', ['as' => 'report.area', 'uses' => 'Merchant\ReportController@AreaReport']);
        //        Route::get('/report/areaReport/search', ['as' => 'report.area.search', 'uses' => 'Merchant\ReportController@AreaReportSearch']);
        //        Route::get('/report/areaReport/ajax', ['as' => 'report.area.ajax', 'uses' => 'Merchant\ReportController@AreaReportData']);

        //Mansu
        //        Route::get('/report/company_income', ['as' => 'report.company_income', 'uses' => 'Merchant\ReportController@CompanyIncome']);
        //        Route::any('/report/company_income/search', ['as' => 'report.company_income.search', 'uses' => 'Merchant\ReportController@CompanyIncomeSearch']);
        //        Route::get('/report/user/wallet', ['as' => 'report.user.wallet', 'uses' => 'Merchant\ReportController@UserWallet']);
        //        Route::get('/report/user/wallet/search', ['as' => 'report.user.wallet.search', 'uses' => 'Merchant\ReportController@SearchUserWallet']);
        //        Route::get('/report/driver/wallet', ['as' => 'report.driver.wallet', 'uses' => 'Merchant\ReportController@DriverWallet']);
        //        Route::get('/report/driver/wallet/search', ['as' => 'report.driver.wallet.search', 'uses' => 'Merchant\ReportController@SerachDriverWallet']);
        //        Route::get('/report/driver/acceptance', ['as' => 'report.driver.acceptance', 'uses' => 'Merchant\ReportController@DriverAcceptance']);
        //        Route::get('/report/driver/acceptance/search', ['as' => 'report.driver.acceptance.search', 'uses' => 'Merchant\ReportController@SearchDriverAcceptance']);
        //        Route::get('/report/promocode', ['as' => 'report.promocode', 'uses' => 'Merchant\ReportController@PromoCodeReport']);
        //        Route::get('/report/promocode/details/{id}', ['as' => 'report.promocode.details', 'uses' => 'Merchant\ReportController@PromoCodeDetails']);
        //        Route::get('/charts/driver', ['as' => 'charts.driver', 'uses' => 'Merchant\ReportController@DriverCharts']);
        Route::get('/logout', ['as' => 'merchant.logout', 'uses' => 'Auth\MerchantLoginController@logout']);

        //third party wrappers
        Route::post('/search/places',  ['as' => 'search-places', 'uses' => 'Helper\AjaxController@searchPlaces']);
        Route::post('/reverse-google-geocode/location',  ['as' => 'reverse-geocode-google-location', 'uses' => 'Helper\AjaxController@getGoogleReverseLocation']);
        Route::post('/google-direction-data',  ['as' => 'google-direction-data', 'uses' => 'Helper\AjaxController@getGoogleDirectionData']);
        Route::post('/google-distance-matrix-data',  ['as' => 'google-distance-matrix-data', 'uses' => 'Helper\AjaxController@getGoogleDistanceMatrixData']);

        //manual dispatch
        Route::get('/manual-dispatch', ['as' => 'merchant.test.manualdispach', 'uses' => 'Merchant\ManualDispatchController@index']);
        Route::get('/corporate-manual-dispatch', ['as' => 'merchant.corporate.manualdispach', 'uses' => 'Merchant\ManualDispatchController@index']);
        Route::post('/checkArea', ['as' => 'manualDispatch.checkArea', 'uses' => 'Merchant\ManualDispatchController@checkArea']);
        Route::get('/manualdispach', ['as' => 'merchant.manualdispach', 'uses' => 'Merchant\ManualDispatchController@index']);
        Route::post('/manualdispach', ['as' => 'merchant.book.manual.dispach', 'uses' => 'Merchant\ManualDispatchController@BookingDispatch'])->middleware('throttle:manualdispatch'); // 1 requ30t per 5 seconds;
        Route::post('/SearchUser', ['as' => 'merchant.SearchUser', 'uses' => 'Merchant\ManualDispatchController@SearchUser']);
        Route::post('/SearchCorporateUsers', ['as' => 'merchant.corporateUsers', 'uses' => 'Merchant\ManualDispatchController@getCorporateUsers']);
        Route::post('/getPromoCode', ['as' => 'merchant.getPromoCode', 'uses' => 'Merchant\ManualDispatchController@PromoCode']);
        Route::post('/getPromoCodeEta', ['as' => 'merchant.getPromoCodeEta', 'uses' => 'Merchant\ManualDispatchController@PromoCodeEta']);
        Route::get('/application', ['as' => 'merchant.application', 'uses' => 'Merchant\ApplicationController@index']);
        Route::post('/application', ['as' => 'merchant.application.store', 'uses' => 'Merchant\ApplicationController@store']);
        Route::get('/profile', ['as' => 'merchant.profile', 'uses' => 'Merchant\DashBoardController@profile']);
        Route::post('/profile', ['as' => 'merchant.profile.update', 'uses' => 'Merchant\DashBoardController@ProfileUpdate']);

        Route::post('/packageVehicles', ['as' => 'merchant.packageVehicles', 'uses' => 'Merchant\ManualDispatchController@PackageVehicles']);
        Route::get('/estimatePrice', ['as' => 'merchant.estimatePrice', 'uses' => 'Merchant\ManualDispatchController@EstimatePrice']);
        Route::post('/checkDriver', ['as' => 'merchant.checkDriver', 'uses' => 'Merchant\ManualDispatchController@CheckDriver']);
        Route::post('/getFavouriteDriver', ['as' => 'merchant.getFavouriteDriver', 'uses' => 'Merchant\ManualDispatchController@FavouriteDriver']);
        Route::post('/getallDriverForManual', ['as' => 'merchant.getallDriver', 'uses' => 'Merchant\ManualDispatchController@AllDriver']);
        Route::get('/onesignal', ['as' => 'merchant.onesignal', 'uses' => 'Merchant\DashBoardController@OneSignal']);
        Route::post('/onesignal', ['as' => 'merchant.onesignal.submit', 'uses' => 'Merchant\DashBoardController@UpdateOneSignal']);

        Route::get('/packagewise-onesignal', ['as' => 'merchant.packagewise.onesignal', 'uses' => 'Merchant\DashBoardController@packageWiseOneSignal']);
        Route::get('/packagewise-onesignal/add/{id?}', ['as' => 'merchant.packagewise.onesignal.add', 'uses' => 'Merchant\DashBoardController@addPackageWiseOneSignal']);
        Route::post('/packagewise-onesignal/{id?}', ['as' => 'merchant.packagewise.onesignal.submit', 'uses' => 'Merchant\DashBoardController@savePacekageWiseOneSignal']);

        //        Route::get('/common-strings', ['as' => 'merchant.common-strings', 'uses' => 'Merchant\DashBoardController@commonLanguageStrings']);
        //        Route::post('/common-strings', ['as' => 'merchant.common-string.submit', 'uses' => 'Merchant\DashBoardController@submitCommonLanguageStrings']);

        //        Route::get('/module-strings', ['as' => 'merchant.module-strings', 'uses' => 'Merchant\DashBoardController@moduleLanguageStrings']);
        //        Route::post('/module-strings', ['as' => 'merchant.module-string.submit', 'uses' => 'Merchant\DashBoardController@submitModuleLanguageStrings']);
        Route::get('/payment-option', ['as' => 'merchant.payment-option', 'uses' => 'Merchant\PaymentOptionController@index']);
        Route::get('/payment-option/{id}', ['as' => 'merchant.payment-option.edit', 'uses' => 'Merchant\PaymentOptionController@edit']);
        Route::post('/payment-option/{id}', ['as' => 'merchant.payment-option.update', 'uses' => 'Merchant\PaymentOptionController@update']);

        //bons payment gateway bank to bank approval or rejected
        Route::get('/bons-payment-gateway-approval-request', ['as' => 'merchant.bons_payment_gateway_approval_request', 'uses' => 'Merchant\PaymentOptionController@BonsPaymentGatewayApprovalRequest']);
        Route::post('/bons-payment-gateway-approval-request/{id}', ['as' => 'merchant.bons_payment_gateway_approval_request.approveOrReject', 'uses' => 'Merchant\PaymentOptionController@BonsPaymentGatewayApproveOrReject']);
        Route::get('/approve-request/{transid}', ['as' => 'merchant.bons_approval', 'uses' => 'Merchant\PaymentOptionController@BonsApproval']);
        Route::post('/bons-reject', ['as' => 'merchant.bons_rejected', 'uses' => 'Merchant\PaymentOptionController@BonsRejectRequest']);

        Route::get('/module-strings', ['as' => 'merchant.module-strings', 'uses' => 'Merchant\ApplicatonStringController@moduleLanguageStrings']);
        Route::post('/module-strings', ['as' => 'merchant.module-string.submit', 'uses' => 'Merchant\ApplicatonStringController@submitModuleLanguageStrings']);

        Route::get('/map-searches', ['as' => 'merchant.map-searches', 'uses' => 'Merchant\DashBoardController@getMapSearches']);
        Route::get('/api-usages', ['as' => 'merchant.view.api.usages', 'uses' => 'Merchant\DashBoardController@apiUsage']);
        Route::get('/api-request-logs/{usertype}', ['as' => 'merchant.view.api.request.logs', 'uses' => 'Merchant\DashBoardController@apiRequestLogs']);
        Route::get('/clear-api-request-logs/{key}', ['as' => 'merchant.clear.api.request.logs', 'uses' => 'Merchant\DashBoardController@clearApiRequestLogs']);

        Route::get('/languagestring', ['as' => 'merchant.languagestring', 'uses' => 'Merchant\DashBoardController@LanguageStrings']);
        Route::post('/languagestring', ['as' => 'merchant.languagestring.submit', 'uses' => 'Merchant\DashBoardController@UpdateLanguageString']);

        Route::get('/website-strings', ['as' => 'merchant.website-strings', 'uses' => 'Merchant\WebsiteStringController@add']);
        Route::post('/website-strings', ['as' => 'merchant.website-string.submit', 'uses' => 'Merchant\WebsiteStringController@store']);

        Route::get('/applicationtheme', ['as' => 'merchant.applicationtheme', 'uses' => 'Merchant\ConfigurationController@Applicationtheme']);
        Route::post('/applicationtheme', ['as' => 'merchant.applicationtheme.submit', 'uses' => 'Merchant\ConfigurationController@UpdateApplicationtheme']);

        Route::get('/setup', ['as' => 'merchant.setup', 'uses' => 'Merchant\SetupController@index']);
        Route::get('/images', ['as' => 'merchant.setup', 'uses' => 'Merchant\SetupController@uploadImagesToS3']);
        Route::get('/dashboard', ['as' => 'merchant.dashboard', 'uses' => 'Merchant\DashBoardController@index']);
        Route::get('/ratings', ['as' => 'merchant.ratings', 'uses' => 'Merchant\DashBoardController@Ratings']);
        Route::get('/ratings/search', ['as' => 'merchant.ratings.search', 'uses' => 'Merchant\DashBoardController@SearchRating']);

         Route::get('/utility-transactions', ['as' => 'merchant.utility-transaction', 'uses' => 'Merchant\UtilityTransactionController@UtilityTransactionList']);
         //Membership Plan
         Route::get('/membership-plan', ['as' => 'merchant.membershipPlan.index', 'uses' => 'Merchant\MembershipPlanController@index']);
         Route::get('/membership-plan/create', ['as' => 'merchant.membershipPlan.create', 'uses' => 'Merchant\MembershipPlanController@create']);
         Route::post('/membership-plan/store', ['as' => 'merchant.membershipPlan.store', 'uses' => 'Merchant\MembershipPlanController@store']);
         Route::get('/membership-plan/edit/{id}', ['as' => 'merchant.membershipPlan.edit', 'uses' => 'Merchant\MembershipPlanController@edit']);
         Route::put('/membership-plan/update/{id}', ['as' => 'merchant.membershipPlan.update', 'uses' => 'Merchant\MembershipPlanController@update']);
         Route::get('/membership-plan/delete/{id}', ['as' => 'merchant.membershipPlan.delete', 'uses' => 'Merchant\MembershipPlanController@delete']);

        // Old URL's
        //        Route::get('/refer', ['as' => 'merchant.refer.index', 'uses' => 'Merchant\DashBoardController@ReferShow']);
        //        Route::get('/refer/create', ['as' => 'merchant.refer.create', 'uses' => 'Merchant\DashBoardController@ReferCreateShow']);
        //        Route::post('/refer/create', ['as' => 'merchant.refer.store', 'uses' => 'Merchant\DashBoardController@ReferStore']);
        //        Route::get('/refer/edit/{id}', ['as' => 'merchant.refer.edit', 'uses' => 'Merchant\DashBoardController@Referedit']);
        //        Route::get('/refer/active/deactive/{id}/{status}', ['as' => 'merchant.refer.active-deactive', 'uses' => 'Merchant\DashBoardController@ChangeStatus']);
        //Mansu
        //        Route::get('/refer/driver_ref', ['as' => 'merchant.refer.driver_view', 'uses' => 'Merchant\DashBoardController@Driver_ReferShow_view']);
        //        Route::get('/refer/driver', ['as' => 'merchant.refer.driver', 'uses' => 'Merchant\DashBoardController@Driver_ReferCreateShow']);
        //        Route::post('/refer/driver/create', ['as' => 'merchant.refer.driver.store', 'uses' => 'Merchant\DashBoardController@Driver_ReferStore']);
        //        Route::get('/refer/driver/edit/{id}', ['as' => 'merchant.refer.driver.edit', 'uses' => 'Merchant\DashBoardController@Driver_Referedit']);
        //        Route::post('/refer/driver/update/{id}', ['as' => 'merchant.refer.driver.update', 'uses' => 'Merchant\DashBoardController@Driver_ReferUpdate']);
        //        Route::get('/refer/driver/active/deactive/{id}/{status}', ['as' => 'merchant.refer.driver.active-deactive', 'uses' => 'Merchant\DashBoardController@Driver_ChangeStatus']);

        //Referral System
        //        Route::resource('/referral-system', 'Merchant\ReferralSystemController');
        Route::get('/referral-system', ['as' => 'referral-system', 'uses' => 'Merchant\ReferralSystemController@index']);
        Route::get('/referral-system/add/{id?}', ['as' => 'referral-system.create', 'uses' => 'Merchant\ReferralSystemController@create']);
        Route::post('/referral-system/save/{id?}', ['as' => 'referral-system.store', 'uses' => 'Merchant\ReferralSystemController@store']);
        Route::get('/referral-system/changeStatus/{id}/{status}', ['as' => 'referral-system.change-status', 'uses' => 'Merchant\ReferralSystemController@ChangeStatus']);
        Route::post('/referral-system/delete', ['as' => 'referral-system.delete', 'uses' => 'Merchant\ReferralSystemController@deleteReferral']);
        Route::get('/check/referral-system', ['as' => 'referral-system.check-referral', 'uses' => 'Merchant\ReferralSystemController@checkReferralSystem']);

        //        Route::post('/refer/add/default', ['as' => 'merchant.add.default.refer', 'uses' => 'Merchant\ReferralSystemController@defaultReferral']);
        //        Route::get('/get-country-area',['merchant.country.area', 'uses' => 'Merchant\ReferralSystemController@getCountryArea']);


        // routes for driver commission fare table
        Route::get('/driver-commission-fare', 'Merchant\ReferController@index')->name('merchant.driver.commission.fare');
        Route::get('/driver-commission-fare/create/{id?}', 'Merchant\ReferController@create')->name('merchant.driver.commissionfare.create');
        Route::post('/driver-commissionfare/store/{id?}', 'Merchant\ReferController@store')->name('merchant.driver.commissionfare.store');
        Route::post('/driver-commission-fare/{id}/delete', 'Merchant\ReferController@destroy')->name('merchant.driver.commissionfare.destroy');


        Route::post('/refer/update/{id}', ['as' => 'merchant.refer.update', 'uses' => 'Merchant\DashBoardController@ReferUpdate']);
        // @Bhuvanesh
        // This route currently not in use
        // Route::resource('category', 'Merchant\CategoryController');
        Route::get('/users/wallet/{id}', ['as' => 'merchant.user.wallet', 'uses' => 'Merchant\UserController@Wallet']);
        Route::post('/user/addmoney', ['as' => 'merchant.user.add.wallet', 'uses' => 'Merchant\UserController@AddWalletMoney']);
        Route::get('/users/favourite/location/{id}', ['as' => 'merchant.user.favourite-location', 'uses' => 'Merchant\UserController@FavouriteLocation']);
        Route::get('/users/favourite/Driver/{id}', ['as' => 'merchant.user.favourite-driver', 'uses' => 'Merchant\UserController@FavouriteDriver']);
        Route::get('/users/active/deactive/{id}/{status}', ['as' => 'merchant.user.active-deactive', 'uses' => 'Merchant\UserController@ChangeStatus']);
        Route::get('users/serach', ['as' => 'merchant.user.search', 'uses' => 'Merchant\UserController@Serach']);
        Route::get('users/refer/{id}', ['as' => 'merchant.user.refer', 'uses' => 'Merchant\UserController@UserRefer']);
        Route::get('users/delete/{id?}/{type?}', ['as' => 'merchant.user.delete', 'uses' => 'Merchant\UserController@destroy']);

        // code by subhamoy user vehicle
        Route::get('/user-vehicle/{id}', ['as' => 'merchant.user.vehicle_list', 'uses' => 'Merchant\UserVehicleController@vehicleList']);
        Route::get('/user-vehicle-add/{id}', ['as' => 'merchant.user.vehicle_add', 'uses' => 'Merchant\UserVehicleController@vehicleAdd']);
        Route::post('/user-vehicle/save/{id}', ['as' => 'merchant.user.vehicle.save', 'uses' => 'Merchant\UserVehicleController@saveVehicle']);
        Route::post('/user-vehicle/find', ['as' => 'merchant.user.get-area-vehicle-type', 'uses' => 'Merchant\UserVehicleController@vehicleType']);
        Route::post('/user-vehicle/model/find', ['as' => 'merchant.user.get-vehicle-model', 'uses' => 'Merchant\UserVehicleController@VehicleModel']);
        Route::get('/user-vehicle/edit/{id}', ['as' => 'merchant.user.vehicle.edit', 'uses' => 'Merchant\UserVehicleController@EditVehicle']);
        Route::post('/user-vehicle/update/{id}', ['as' => 'merchant.user.vehicle.update', 'uses' => 'Merchant\UserVehicleController@UpdateVehicle']);
        Route::get('/user/job/{job_type}/{id}', ['as' => 'merchant.user.jobs', 'uses' => 'Merchant\UserController@userJobs']);
        // user address
        Route::get('/user-address/{id}', ['as' => 'merchant.user.address', 'uses' => 'Merchant\UserController@UserAddress']);

        Route::resource('users', 'Merchant\UserController');
        Route::get('/deleted-users', ['as' => 'merchant.deleted.user', 'uses' => 'Merchant\UserController@deletedUsers']);
        Route::post('/change-users-account-status', ['as' => 'merchant.change.user.account', 'uses' => 'Merchant\UserController@userAccountStatus']);
        Route::get('/user-device-details', ['as' => 'user.device.details', 'uses' => 'Merchant\UserController@getDeviceDetails']);

        Route::get('/allvehicles/', ['as' => 'merchant.driver.allvehicles', 'uses' => 'Merchant\DriverController@AllVehicle']);
        //        Route::get('/allvehicles/document/edit/{id}', ['as' => 'merchant.driver.allvehicles.edit', 'uses' => 'Merchant\DriverController@EditVehicleDocument']);
        //        Route::post('/allvehicles/document/edit/{id}', ['as' => 'merchant.driver.allvehicles.update', 'uses' => 'Merchant\DriverController@UpdateVehicleDocument']);
        //        Route::get('/allvehicles/search', ['as' => 'merchant.driver.allvehicles.search', 'uses' => 'Merchant\DriverController@AllVehicleSearch']);

        // Upload user document
        Route::get('user/upload/document/{id}', ['as' => "user.upload.document", 'uses' => "Merchant\UserController@uploadDocument"]);
        Route::post('user/save/document/{id}', ['as' => "user.save.document", 'uses' => "Merchant\UserController@saveDocument"]);

        Route::get('user/pending/vehicle', ['as' => "merchant.user.pending.vehicle.list", 'uses' => "Merchant\UserController@pendingVehicleUser"]);
        Route::get('user/vehicle/verify/{id}/{vehicle_id}', ['as' => 'merchant.user-vehicle-verify', 'uses' => 'Merchant\UserController@verifyUserVehicle']); // status 1 : approve vehicle & 2: document approve
        Route::get('user/vehicle/document', ['as' => 'merchant.user-vehicle-document', 'uses' => 'Merchant\UserController@userVehicleDocument']); // status 1 : approve vehicle & 2: document approve
        Route::post('user/vehicle/reject/', ['as' => 'merchant.user-vehicle-reject', 'uses' => 'Merchant\UserController@rejectUserVehicle']);
        Route::get('user/vehicle/rejected/', ['as' => 'merchant.user.vehicle.rejected', 'uses' => 'Merchant\UserController@RejectedVehicle']);


        //        Route::any('getexpirepersonaldocument/', ['as' => 'merchant.docs.getexpirepersonaldocument', 'uses' => 'Merchant\ExpireDocumentController@ShowPersonalDocs']);
        //        Route::any('getexpirevehicledocument/', ['as' => 'merchant.docs.getexpirevehicledocument', 'uses' => 'Merchant\ExpireDocumentController@ShowVehicleDocs']);
        Route::get('driver/expired-documents/', ['as' => 'merchant.driver.expiredocuments', 'uses' => 'Merchant\ExpireDocumentController@index']);
        Route::get('driver/expired-documents-export/', ['as' => 'merchant.driver.expiredocuments.export', 'uses' => 'Merchant\ExpireDocumentController@export']);

        //Document Expire module
        Route::get('driver/going_to_expire_document/', ['as' => 'merchant.driver.goingtoexpiredocuments', 'uses' => 'Merchant\ExpireDocumentController@GoingToExpireDocs']);
        Route::get('driver/goingToExpireDocument/sendNotification/{id}', ['as' => 'goingToExpireDocuments.sendNotification', 'uses' => 'Merchant\ExpireDocumentController@SendNotification']);
        Route::post('driver/send-notification-to-all-drivers/', ['as' => 'merchant.driver.sendNotificationToAll', 'uses' => 'Merchant\ExpireDocumentController@sendNotificationToAll']);
        Route::post('driver/uploadVehicleExpireDocs/', ['as' => 'merchant.driver.uploadVehicleExpireDocs', 'uses' => 'Merchant\ExpireDocumentController@UploadVehicleDocs']);
        //        Route::post('driver/upload-handyman-document/', ['as' => 'merchant.driver.handyman-document-upload', 'uses' => 'Merchant\ExpireDocumentController@uploadHandymanDocs']);
        Route::post('driver/uploadDriverExpireDocs/', ['as' => 'merchant.driver.uploadDriverExpireDocs', 'uses' => 'Merchant\ExpireDocumentController@UploadDriverDocs']);


        //        Route::get('driver/expirepersonaldocs/', ['as' => 'merchant.driver.expirepersonaldocs', 'uses' => 'Merchant\ExpireDocumentController@Check_PersonalDocumnet']);
        //        Route::get('driver/expirevehicledocs/', ['as' => 'merchant.driver.expirevehicledocs', 'uses' => 'Merchant\ExpireDocumentController@Check_VehicleDocumnet']);
        Route::get('/drivers/block/', ['as' => 'merchant.driver.cronblock', 'uses' => 'Merchant\DriverController@Cronjob_DriverBlock']);
        Route::post('/drivers/delete', ['as' => 'driverDelete', 'uses' => 'Merchant\DriverController@destroy']);
        Route::get('/driver/editDocument/{id}', ['as' => 'driver.editDocument', 'uses' => 'Merchant\DriverController@EditDocument']);
        Route::post('/driver/editDocument/{id}', ['as' => 'driver.store.editDocument', 'uses' => 'Merchant\DriverController@StoreEdit']);
        Route::get('/driver/delete/pending-vehicle/{id?}', ['as' => 'driver.delete.pendingvehicle', 'uses' => 'Merchant\DriverController@DeletePendingVehicle']);
        Route::get('/driver/locationNotUpdate', 'Merchant\DriverController@FindDriverLocationNotUpdate')->name('driver.locationNotUpdate');
        Route::get('/driver/search/locationNotUpdate', 'Merchant\DriverController@SearchDriverLocationNotUpdate')->name('driver.search.locationNotUpdate');

        /** driver module start **/
        // get drivers
//        Route::get('/driver', ['as' => 'driver.index', 'uses' => 'Merchant\DriverController@index']);
        Route::get('/drivers', ['as' => 'driver.index', 'uses' => 'Merchant\DriverController@index']);
        Route::get('/alldrivers', ['as' => 'driver.all_index', 'uses' => 'Merchant\DriverController@all_index']);
        Route::get('/driver-status', ['as' => 'driver.status', 'uses' => 'Merchant\DriverController@driverStatus']);
        Route::get('/drivers/vehicle-based', ['as' => 'driver.vehicle-based', 'uses' => 'Merchant\DriverController@driverForVehicleBased']);
        Route::get('/drivers/helper-based', ['as' => 'driver.helper-based', 'uses' => 'Merchant\DriverController@driverForHelperBased']);
        Route::get('/drivers/bus-booking-based', ['as' => 'driver.bus-booking-based', 'uses' => 'Merchant\DriverController@driverForBusBookingBased']);
        Route::get('/driver-device-details', ['as' => 'driver.device.details', 'uses' => 'Merchant\DriverController@getDeviceDetails']);
//        Route::get('/driver/search', ['as' => 'merchant.driver.search', 'uses' => 'Merchant\DriverController@index']);
        // add driver
        Route::get('/driver/add/{id?}', ['as' => 'driver.add', 'uses' => 'Merchant\DriverController@add']);
        // get driver
        Route::post('/driver/personal-document', ['as' => 'merchant.driver.country-area-document', 'uses' => 'Merchant\DriverController@getPersonalDocument']);
        // save driver
        Route::post('/driver/save/{id?}', ['as' => 'driver.save', 'uses' => 'Merchant\DriverController@save']);
        // view driver
        Route::get('/driver/profile/{id}', ['as' => 'driver.show', 'uses' => 'Merchant\DriverController@show']);
        Route::get('/driver/update-details-drivers/{id}', ['as' => 'driver.show.update', 'uses' => 'Merchant\DriverController@updatePendingDetailsOfDrivers']);
        Route::get('/detach-vehicle/{vehicle_id}/{driver_id}', ['as'=> 'vehicles.detach', 'uses'=> 'Merchant\DriverController@detachVehicle']);
        // get driver's personal document
        //        Route::get('/driver/personal-document/{id}', ['as' => 'merchant.driver.personal.document.show', 'uses' => 'Merchant\DriverController@addPersonalDocument']);
        // save driver's personal document
        //        Route::post('/driver/personal-document/{id}', ['as' => 'merchant.driver.personal.document.save', 'uses' => 'Merchant\DriverController@savePersonalDocument']);


        // get driver's handyman segment and document
        Route::get('/driver/handyman-segment/{id}', ['as' => 'merchant.driver.handyman.segment', 'uses' => 'Merchant\DriverController@addHandymanSegment']);
        // save driver's handyman segment and document
        Route::post('/driver/handyman-segment/{id}', ['as' => 'merchant.driver.handyman.segment.save', 'uses' => 'Merchant\DriverController@saveHandymanSegment']);

        // get driver's bus booking segment
        Route::get('/driver/bus-booking-segment/{id}', ['as' => 'merchant.driver.bus-booking.segment', 'uses' => 'Merchant\DriverController@addBusBookingSegment']);
        // save driver's bus booking segment
        Route::post('/driver/bus-booking-segment/{id}', ['as' => 'merchant.driver.bus-booking.segment.save', 'uses' => 'Merchant\DriverController@saveBusBookingSegment']);


        // get time slots of driver's handyman segment's
        Route::get('/driver/segment/time-slot/{id}', ['as' => 'merchant.driver.segment.time-slot', 'uses' => 'Merchant\DriverController@addSegmentTimeSlot']);

        // save time slots of driver's handyman segment
        Route::post('/driver/segment/time-slot/{id}', ['as' => 'merchant.driver.segment.time-slot.save', 'uses' => 'Merchant\DriverController@saveSegmentTimeSlot']);

        // add driver vehicle
        //        Route::get('/driver/add-vehicle/{id}/{vehicle_id?}/{calling_from?}', ['as' => 'merchant.driver.vehicle.create', 'uses' => 'Merchant\DriverController@addVehicle']);
        Route::get('/driver/add-vehicle/{id}/{vehicle_id?}', ['as' => 'merchant.driver.vehicle.create', 'uses' => 'Merchant\DriverController@addVehicle']);
        // save driver vehicle
        Route::post('/driver/save-vehicle/{id}', ['as' => 'merchant.driver.vehicle.store', 'uses' => 'Merchant\DriverController@saveVehicle']);
        /** driver module end **/


        //        Route::resource('driver', 'Merchant\DriverController');
        //        Route::get('/drivers/pending/edit/{id}', ['as' => 'merchant.driver.pending.edit', 'uses' => 'Merchant\DriverController@PendingDriverEdit']);
        Route::get('/driver/activated-subscription-pack/{id}', ['as' => 'driver.activated_subscription', 'uses' => 'Merchant\DriverController@activatedSubscriptionPackages']);//Activated_Subscription
        Route::get('/driver/activate-subscription-pack/{id}', ['as' => 'driver.add-subscription-pack', 'uses' => 'Merchant\DriverController@ShowSubscriptionPacks']);
//        Route::post('/driver/activate-subscription-pack-cash/{id}', ['as' => 'driver.subscription-cash-buy', 'uses' => 'Merchant\DriverController@Activate_Subscription_Cash']);
        Route::post('/driver/activate-subscription-pack/{id}', ['as' => 'driver.assign-subscription-package', 'uses' => 'Merchant\DriverController@AssignSubscriptionPackage']);
        Route::post('/driver/subscription-assign/{id}', ['as' => 'driver.subscription-assign', 'uses' => 'Merchant\DriverController@AssignFreeSubscription']);
        //        Route::get('/drivers/search/', ['as' => 'merchant.driver.search', 'uses' => 'Merchant\DriverController@Serach']);


        Route::post('/Driver_Delete', ['as' => 'Driver_Delete', 'uses' => 'Merchant\DriverController@delete']);
        Route::get('/deleted-drivers', ['as' => 'merchant.driver.deleted', 'uses' => 'Merchant\DriverController@deletedDrivers']);
        Route::post('/change-driver-account-status', ['as' => 'merchant.change.driver.account', 'uses' => 'Merchant\DriverController@driverAccountStatus']);
        Route::get('/driver/job/{job_type}/{id}', ['as' => 'merchant.driver.jobs', 'uses' => 'Merchant\DriverController@driverJobs']);
        Route::get('/drivers/pending/', ['as' => 'merchant.driver.pending.show', 'uses' => 'Merchant\DriverController@pendingDriver']);
        Route::get('/drivers/training/', ['as' => 'merchant.driver.training.show', 'uses' => 'Merchant\DriverController@trainingDriver']);
        Route::get('/drivers/training/profile/{id}', ['as' => 'driver.training.profile', 'uses' => 'Merchant\DriverController@showProfile']);
        Route::post('/drivers/training/profile/{id}', ['as' => 'driver.training.profile.update', 'uses' => 'Merchant\DriverController@updateDriverTrainingProfile']);
        Route::get('/drivers/training/profile/reject/{id}', ['as'=> 'driver.training.profile.reject', 'uses' => 'Merchant\DriverController@rejectDriverTrainingProfile']);


        Route::get('/drivers/temp/doc/pending/', ['as' => 'merchant.driver.temp-doc-pending.show', 'uses' => 'Merchant\DriverController@tempDocApprovalPending']);

        //        Route::get('/drivers/pending/search/', ['as' => 'merchant.driver.pending.search', 'uses' => 'Merchant\DriverController@PendingSerach']);
        //        Route::get('/drivers/basic/', ['as' => 'merchant.driver.basic', 'uses' => 'Merchant\DriverController@NewDriver']);
        Route::get('/drivers/basic-signup/', ['as' => 'merchant.driver.basic', 'uses' => 'Merchant\DriverController@basicSignupDriver']);
        Route::post('/drivers/basic-signup/notification', ['as' => 'merchant.driver.basic.notify.all', 'uses' => 'Merchant\DriverController@notificationTobasicSignupDriver']);
        //        Route::get('/drivers/basic/search', ['as' => 'merchant.driver.basic.search', 'uses' => 'Merchant\DriverController@NewDriverSearch']);
        Route::get('/pending/vehicles/', ['as' => 'merchant.driver.pending.vehicles', 'uses' => 'Merchant\DriverController@PendingVehicle']);
        //        Route::get('/pending/vehicles/search', ['as' => 'merchant.driver.pending.vehicles.search', 'uses' => 'Merchant\DriverController@PendingVehicleSearch']);

        // Route::get('/driver/document/{id}', ['as' => 'merchant.driver.document.show', 'uses' => 'Merchant\DriverController@addPersonalDocument']);
        Route::get('/driver/wallet/{id}', ['as' => 'merchant.driver.wallet.show', 'uses' => 'Merchant\DriverController@Wallet']);
        Route::get('/driver/active/deactive/{id}/{status}', ['as' => 'merchant.driver.active.deactive', 'uses' => 'Merchant\DriverController@ChangeStatus']);
        Route::get('/driver/logout/{id}', ['as' => 'merchant.driver.logout', 'uses' => 'Merchant\DriverController@Logout']);
        Route::post('/driver/document/{id}', ['as' => 'merchant.driver.document.store', 'uses' => 'Merchant\DriverController@StoreDocument']);


        Route::get('/driver/personal/expire', ['as' => 'merchant.driver.personal.expire', 'uses' => 'Merchant\DriverController@PersonalDocExpire']);
        Route::get('/driver/vehicle/expire', ['as' => 'merchant.driver.vehicle.expire', 'uses' => 'Merchant\DriverController@VehicleDocExpire']);
        Route::get('/vehicle/rejected/', ['as' => 'merchant.vehicle.rejected', 'uses' => 'Merchant\DriverController@RejectedVehicle']);
        Route::get('/driver/rejected/', ['as' => 'merchant.driver.rejected', 'uses' => 'Merchant\DriverController@rejectedDriver']);
        Route::get('/driver/pending_details_approval/', ['as' => 'merchant.driver.pending.details', 'uses' => 'Merchant\DriverController@pendingDriverDetailaApproval']);
        Route::post('/driver/reject_details_approval/', ['as' => 'merchant.driver.reject.details', 'uses' => 'Merchant\DriverController@RejectDriverDetailaApproval']);
        Route::get('/driver/rejected/temporary', ['as' => 'merchant.driver.rejected.temporary', 'uses' => 'Merchant\DriverController@rejectedDriverTemporary']);
        Route::get('/driver/pending_details_approval/detail', ['as' => 'merchant.driver.approval.details', 'uses' => 'Merchant\DriverController@pendingDriverDeta']);
        //        Route::get('/pending/rejected/search', ['as' => 'merchant.driver.rejected.search', 'uses' => 'Merchant\DriverController@RejectedSearch']);
        Route::post('/move-to/pending', ['as' => 'merchant.driver.move-to-pending', 'uses' => 'Merchant\DriverController@MoveToPending']);
        //        Route::get('/driver/reject_driver/{id}', ['as' => 'merchant.driver-reject', 'uses' => 'Merchant\DriverController@DisapproveDriver']);
        Route::get('/driver/approve_driver/{id}', ['as' => 'merchant.driver-approve', 'uses' => 'Merchant\DriverController@ApproveDriver']);
        Route::get('/driver/referral/earning/{id}', ['as' => 'merchant.driver.referral.earning.show', 'uses' => 'Merchant\DriverController@referralEarning']);

        Route::get('driver/refer/{id}', ['as' => 'merchant.driver.refer', 'uses' => 'Merchant\DriverController@DriverRefer']);

        Route::post('/driver/remarks', ['as' => 'merchant.driver.remark.store', 'uses' => 'Merchant\DriverController@storeDriverRemarks']);
        Route::get('/driver/remarks-history/{id}', ['as' => 'merchant.driver.remarks.history', 'uses' => 'Merchant\DriverController@driverRemarksHistory']);


        Route::get('pricecard/surgecharge', 'Merchant\PriceCardController@SurgeCharge')->name('pricecard.surgecharge');
        Route::get('/pricecard/active/deactive/{id}/{status}', ['as' => 'merchant.pricecard.active-deactive', 'uses' => 'Merchant\PriceCardController@ChangeStatus']);
        Route::post('pricecard/surgechargeupdate/{id}', 'Merchant\PriceCardController@SurgeChargeUpdate')->name('pricecard.surgecharge.update');
        Route::post('pricecard/surgechargevalupdate', 'Merchant\PriceCardController@SurgeChargeValUpdate')->name('pricecard.surgecharge.value.update');


        Route::resource('area-management/country', 'Merchant\CountryController');
        //        Route::get('area-management/search/country', ['as' => 'mearchant.country.search', 'uses' => 'Merchant\CountryController@SearchCountry']);

        Route::post('area-management/countryareas/search', 'Merchant\CountryAreaController@index')->name('countryArea.Search');
        Route::get('area-management/countryareas/add/{id?}', ['as' => 'countryareas.add', 'uses' => 'Merchant\CountryAreaController@add']);
        Route::post('area-management/countryareas/save/{id?}', ['as' => 'countryareas.save', 'uses' => 'Merchant\CountryAreaController@save']);
        Route::get('area-management/countryareas', ['as' => 'countryareas.index', 'uses' => 'Merchant\CountryAreaController@index']);
        Route::get('area-management/show/{id?}', ['as' => 'countryareas.show', 'uses' => 'Merchant\CountryAreaController@show']);

        Route::get('area-management/countryareas/add/step2/{id}', ['as' => 'countryareas.add.step2', 'uses' => 'Merchant\CountryAreaController@addStep2']);
        Route::post('area-management/countryareas/save/step2/{id?}', ['as' => 'countryareas.save.step2', 'uses' => 'Merchant\CountryAreaController@saveStep2']);
        Route::get('area-management/countryareas/change-status/step2/{id}/{vehicle_type_id}/{status}', ['as' => 'countryareas.change-status.step2', 'uses' => 'Merchant\CountryAreaController@activeInactiveStep2']);

        Route::get('area-management/countryareas/add/step3/{id}', ['as' => 'countryareas.add.step3', 'uses' => 'Merchant\CountryAreaController@addStep3']);
        Route::post('area-management/countryareas/save/step3/{id?}', ['as' => 'countryareas.save.step3', 'uses' => 'Merchant\CountryAreaController@saveStep3']);

        Route::get('area-management/countryareas/add/step5/{id}', ['as' => 'countryareas.add.step5', 'uses' => 'Merchant\CountryAreaController@addStep5']);
        Route::post('area-management/countryareas/save/step5/{id?}', ['as' => 'countryareas.save.step5', 'uses' => 'Merchant\CountryAreaController@saveStep5']);

        Route::post('area-management/countryareas/vehicle-type/edit', ['as' => 'merchant.country_area.vehicle-type', 'uses' => 'Merchant\CountryAreaController@vehicleTypeEdit']);
        Route::post('area-management/countryareas/vehicle-type/delete', ['as' => 'merchant.area_vehicle.destroy', 'uses' => 'Merchant\CountryAreaController@deleteStep2']);

        //custom map marker
        Route::get('custom-map-marker', ['as' => 'custom.mapmarker.index', 'uses' => 'Merchant\MapController@IndexCustomMapMarker']);
        Route::get('add-custom-map-marker', ['as' => 'custom.mapmarker.add', 'uses' => 'Merchant\MapController@addCustomMarker']);
        Route::post('add-custom-map-marker', ['as' => 'custom.mapmarker.save', 'uses' => 'Merchant\MapController@saveCustomMarker']);
        
        Route::get('country-areas/vehicle-type/categorization/{id}', ['as' => 'country-area.category.vehicle.type', 'uses' => 'Merchant\CountryAreaController@vehicleCategorization']);
        Route::post('country-areas/vehicle-type/categorization/{id}', ['as' => 'country-area.category.vehicle.type.save', 'uses' => 'Merchant\CountryAreaController@saveVehicleCategorization']);

        Route::resource('area-management/countryareas', 'Merchant\CountryAreaController');

        Route::resource('vehicle-management/vehicletype', 'Merchant\VehicleTypeController');
        Route::get('vehicle-management/vehicletype/{id}/{status}', ['as' => 'merchant.vehicletype.update.status', 'uses' => 'Merchant\VehicleTypeController@updateStatus']);
        Route::post('/vehicle-type/delete', ['as' => 'merchant.vehicletype.delete', 'uses' => 'Merchant\VehicleTypeController@destroy']);
        Route::resource('vehicle-management/vehiclemake', 'Merchant\VehicleMakeController');
        Route::post('/vehicle-make/delete', ['as' => 'merchant.vehiclemake.delete', 'uses' => 'Merchant\VehicleMakeController@destroy']);
        Route::resource('vehicle-management/vehiclemodel', 'Merchant\VehicleModelController');
        Route::post('/vehicle-model/delete', ['as' => 'merchant.vehiclemodel.delete', 'uses' => 'Merchant\VehicleModelController@destroy']);

        Route::get('distance-slab', ['as' => 'distance.slab.index', 'uses' => 'Merchant\DistanceSlabController@index']);
        Route::get('distance-slab/add/{id?}', ['as' => 'distance.slab.create', 'uses' => 'Merchant\DistanceSlabController@add']);
        Route::post('distance-slab/save/{id?}', ['as' => 'distance.slab.store', 'uses' => 'Merchant\DistanceSlabController@save']);


        Route::get('promo-code', ['as' => 'promocode.index', 'uses' => 'Merchant\PromoCodeController@index']);
        Route::get('promo-code/add/{id?}', ['as' => 'promocode.create', 'uses' => 'Merchant\PromoCodeController@add']);
        Route::post('promo-code/save/{id?}', ['as' => 'promocode.store', 'uses' => 'Merchant\PromoCodeController@save']);
        //        Route::resource('promocode', 'Merchant\PromoCodeController');
        Route::resource('walletpromocode', 'Merchant\WalletCouponCodeController');

        Route::get('priceparameter/', ['as' => 'pricingparameter.index', 'uses' => 'Merchant\PricingParameterController@index']);
        Route::get('priceparameter/add/{id?}', ['as' => 'priceparameter.add', 'uses' => 'Merchant\PricingParameterController@add']);
        Route::post('priceparameter/save/{id?}', ['as' => 'priceparameter.save', 'uses' => 'Merchant\PricingParameterController@save']);
        //        Route::resource('pricingparameter', 'Merchant\PricingParameterController');
        Route::get('pricecard', ['as' => 'pricecard.index', 'uses' => 'Merchant\PriceCardController@index']);
        Route::get('pricecard/add/{id?}', ['as' => 'pricecard.add', 'uses' => 'Merchant\PriceCardController@add']);
        Route::post('pricecard/save/{id?}', ['as' => 'pricecard.save', 'uses' => 'Merchant\PriceCardController@save']);
        Route::resource('pricecard', 'Merchant\PriceCardController');

        Route::resource('cancelreason', 'Merchant\CancelReasonController');
        Route::resource('rejectreason', 'Merchant\RejectReasonController');
        Route::get('/promotions/search', ['as' => 'promotions.search', 'uses' => 'Merchant\PromotionNotificationController@Search']);
        Route::resource('promotions', 'Merchant\PromotionNotificationController');
        Route::resource('promotionsms', 'Merchant\PromotionSmsController');
        Route::resource('subadmin', 'Merchant\SubAdminController');
        //        Route::resource('role', 'Merchant\RoleController');
        //        Route::resource('new-role', 'Merchant\RoleController');
        Route::get('role', ['as' => 'new-role.index', 'uses' => 'Merchant\NewRoleController@index']);
        Route::get('role/create/{id?}', ['as' => 'new-role.create', 'uses' => 'Merchant\NewRoleController@create']);
        Route::post('role/store/{id?}', ['as' => 'new-role.store', 'uses' => 'Merchant\NewRoleController@store']);
        Route::resource('accounts', 'Merchant\DriverAccountController');
        Route::resource('newaccounts', 'Merchant\SettlementController');


        //        Route::resource('hotels', 'Merchant\HotelController');
        Route::get('/hotel', ['as' => 'hotels.index', 'uses' => 'Merchant\HotelController@index']);
        Route::get('/hotel/add/{id?}', ['as' => 'hotels.create', 'uses' => 'Merchant\HotelController@add']);
        Route::post('/hotel/save/{id?}', ['as' => 'hotels.store', 'uses' => 'Merchant\HotelController@save']);

        Route::post('/hotel/AddMoney', ['as' => 'hotel.AddMoney', 'uses' => 'Merchant\HotelController@AddMoney']);
        Route::post('/hotel/AddMoney', ['as' => 'hotel.AddMoney', 'uses' => 'Merchant\HotelController@AddMoney']);
        Route::get('/hotel/wallet/{id}', ['as' => 'merchant.hotel.wallet.show', 'uses' => 'Merchant\HotelController@Wallet']);
        Route::get('/hotel/transactions/{id}', ['as' => 'merchant.hotel.transactions', 'uses' => 'Merchant\TransactionController@HotelTransaction']);
        Route::post('/hotel/transactions/{id}', ['as' => 'merchant.hotel.transactions.search', 'uses' => 'Merchant\TransactionController@HotelSearch']);

        Route::resource('questions', 'Merchant\QuestionController');
        Route::resource('search-places-rules', 'Merchant\SearchPlaceRuleController');
        Route::resource('account-types', 'Merchant\AccountTypeController');
        Route::post('/settle/newaccounts', 'Merchant\SettlementController@Settle')->name('newaccounts.changestatus');

        Route::get('/account-types/change_status/{id}/{status}', 'Merchant\AccountTypeController@Change_Status')->name('account-types.changestatus');
        Route::post('walletpromocode/bulk_coupon', ['as' => 'walletpromocode.bulk_code', 'uses' => 'Merchant\WalletCouponCodeController@bulk_code']);

        Route::get('wallet_recharge', ['as' => 'Wallet.recharge', 'uses' => 'Merchant\TransactionController@wallet']);
        Route::get('get-Wallet-reconcile', ['as' => 'Wallet.reconcile', 'uses' => 'Merchant\TransactionController@WalletReconcile']);
        Route::post('wallet-reconcile', ['as' => 'Wallet.reconcile.save', 'uses' => 'Merchant\TransactionController@SaveWalletReconcile']);
        Route::get('wallet-reconcile-sample', ['as' => 'wallet-reconcile-sample', 'uses' => 'Merchant\TransactionController@WalletReconcileSample']);
        Route::post('getDetails', ['as' => 'Wallet.getDetails', 'uses' => 'Merchant\TransactionController@getDetails'])->name('getDetails');
        Route::post('wallet_recharge_details', ['as' => 'Wallet.recharge.details', 'uses' => 'Merchant\TransactionController@walletRecharge']);
        Route::get('getReceiver', ['as' => 'wallet.getReceivers', 'uses' => 'Merchant\TransactionController@getWalletReceiver']);

        Route::get('/search/pricecard', ['as' => 'merchant.pricecard.search', 'uses' => 'Merchant\PriceCardController@index']);
        Route::get('/account/search/', ['as' => 'merchant.accounts.search', 'uses' => 'Merchant\DriverAccountController@Serach']);
        Route::get('/reject/active/deactive/{id}/{status}', ['as' => 'merchant.reject.active-deactive', 'uses' => 'Merchant\RejectReasonController@ChangeStatus']);
        Route::get('/promocode/delete/{id}', ['as' => 'merchant.promocode.delete', 'uses' => 'Merchant\PromoCodeController@destroy']);
        Route::get('/promocode/active/deactive/{id}/{status}', ['as' => 'merchant.promocode.active-deactive', 'uses' => 'Merchant\PromoCodeController@ChangeStatus']);
        Route::get('/country/areaList', ['as' => 'merchant.country.arealist', 'uses' => 'Merchant\CountryAreaController@AreaList']);

        Route::get('/country/config', ['as' => 'merchant.country.config', 'uses' => 'Merchant\CountryAreaController@CountryConfig']);

        Route::get('/cancelreason/active/deactive/{id}/{status}', ['as' => 'merchant.cancelreason.active-deactive', 'uses' => 'Merchant\CancelReasonController@ChangeStatus']);
        Route::get('/hotels/active/deactive/{id}/{status}', ['as' => 'merchant.hotel.active-deactive', 'uses' => 'Merchant\HotelController@ChangeStatus']);
        Route::resource('franchisee', 'Merchant\FranchiseController');
        Route::get('/franchisee/active/deactive/{id}/{status}', ['as' => 'merchant.franchisee.active-deactive', 'uses' => 'Merchant\FranchiseController@ChangeStatus']);
        Route::get('/promotionsms/userdriver', ['as' => 'merchant.promotionsms.userdriver', 'uses' => 'Merchant\PromotionSmsController@UserDriver']);
        Route::post('/promotionsms/storeUserDriver', ['as' => 'merchant.promotionsms.storeUserDriver', 'uses' => 'Merchant\PromotionSmsController@storeUserDriver']);
        Route::get('/promotionsms/delete/{id}', ['as' => 'promotionsms.delete', 'uses' => 'Merchant\PromotionSmsController@destroy']);
        Route::get('/country/active/deactive/{id}/{status}', ['as' => 'merchant.country.active-deactive', 'uses' => 'Merchant\CountryController@ChangeStatus']);

        Route::get('/subadmin/active/deactive/{id}/{status}', ['as' => 'merchant.subadmin.active-deactive', 'uses' => 'Merchant\SubAdminController@ChangeStatus']);
        Route::post('/promocode/search', ['as' => 'promocode.search', 'uses' => 'Merchant\PromoCodeController@Search']);
        Route::post('/cancelreason/search', ['as' => 'cancelreason.search', 'uses' => 'Merchant\CancelReasonController@Search']);
        Route::get('/promotions/delete/{id}', ['as' => 'promotions.delete', 'uses' => 'Merchant\PromotionNotificationController@destroy']);
        Route::post('/promotions/send/driver', ['as' => 'merchant.sendsingle-driver', 'uses' => 'Merchant\PromotionNotificationController@SendNotificationDriver']);
        Route::post('/promotions/send/areawise', ['as' => 'merchant.areawise-notification', 'uses' => 'Merchant\PromotionNotificationController@SendNotificationAreaWise']);
        Route::post('/promotions/send/expired-location-drivers', ['as' => 'merchant.expired-location-drivers', 'uses' => 'Merchant\PromotionNotificationController@SendNotificationToExpiredLocDrivers']);
        Route::post('/promotions/send/user', ['as' => 'merchant.sendsingle-user', 'uses' => 'Merchant\PromotionNotificationController@SendNotificationUser']);
        Route::resource('rental/packages', 'Merchant\ServicePackageController');
        Route::get('/rental/packages/active/deactive/{id}/{status}', ['as' => 'merchant.rental.packages.active-deactive', 'uses' => 'Merchant\ServicePackageController@ChangeStatus']);
        Route::resource('transferpackage', 'Merchant\TransferPackageController');
        Route::resource('outstationpackage', 'Merchant\OutstationPackageController');
        Route::get('/outstationpackage/active/deactive/{id}/{status}', ['as' => 'merchant.outstationpackage.active-deactive', 'uses' => 'Merchant\OutstationPackageController@ChangeStatus']);
        Route::resource('sos', 'Merchant\SosController');
        Route::resource('cms', 'Merchant\CmsPagesController');
        Route::post('/cms/search', ['as' => 'merchant.cms.search', 'uses' => 'Merchant\CmsPagesController@Search']);
        Route::get('page-type', ['as' => 'merchant.page.index', 'uses' => 'Merchant\CmsPagesController@Page']);
        Route::get('page-type/edit/{id}', ['as' => 'merchant.page.edit', 'uses' => 'Merchant\CmsPagesController@EditPage']);
        Route::post('page-type/update/{id}', ['as' => 'merchant.page.update', 'uses' => 'Merchant\CmsPagesController@UpdatePage']);
        Route::resource('child-terms-conditions', 'Merchant\ChildTermsController');
        //        Route::resource('terms', 'Merchant\TermsController');
        //        Route::post('/terms/search', ['as' => 'merchant.terms.search', 'uses' => 'Merchant\TermsController@Search']);
        Route::get('/sos-requests', ['as' => 'merchant.sos.requests', 'uses' => 'Merchant\SosController@SosRequest']);
        Route::get('/sos-requests/sreach', ['as' => 'merchant.sos.sreach', 'uses' => 'Merchant\SosController@SercahSosRequest']);
        Route::post('/sos/search', ['as' => 'merchant.sos.search', 'uses' => 'Merchant\SosController@SearchSos']);
        Route::get('/sos/active/deactive/{id}/{status}', ['as' => 'merchant.sos.active-deactive', 'uses' => 'Merchant\SosController@ChangeStatus']);
        Route::get('/sos/delete/{id}', ['as' => 'merchant.sos.delete', 'uses' => 'Merchant\SosController@destroy']);
        Route::post('/driver/AddMoney', ['as' => 'merchant.AddMoney', 'uses' => 'Merchant\DriverController@AddMoney']);
        Route::post('/driver/remove-call-button/', 'Merchant\DriverController@removeCallButton')->name('driver.removeCallButton');
        Route::post('/driver/freeze-tracking-screen/', 'Merchant\DriverController@freezeTrackingScreen')->name('driver.freezeTrackingScreen');
        Route::post('/getDriverOnMap', ['as' => 'getDriverOnMap', 'uses' => 'Merchant\ManualDispatchController@getDriverOnMap']);
        Route::post('/getBookingsOnHeatMap', ['as' => 'getBookingsOnHeatMap', 'uses' => 'Merchant\ManualDispatchController@getBookingsOnHeatMap']);
        Route::post('/getfield', ['as' => 'admin.pricing.parameter', 'uses' => 'Merchant\PriceCardController@getPricingParameter']);
        Route::get('/heatmap', ['as' => 'merchant.heatmap', 'uses' => 'Merchant\MapController@HeatMap']);
        Route::get('/drivermap', ['as' => 'merchant.drivermap', 'uses' => 'Merchant\MapController@DriverMap']);
        Route::get('realtime-driver', ['as' => 'realtime-driver-map', 'uses' => 'Merchant\MapController@realTimeDriver']);
        //Route::get('countryareas/services/vehicle/{id}',['as'=>'merchant.service_vechicle','uses'=>'Merchant\CountryAreaController@SeriveVehicle']);
        Route::resource('documents', 'Merchant\DocumentController');
        Route::get('/document/add/{id?}', 'Merchant\DocumentController@add');
        Route::post('document/save/{id?}', 'Merchant\DocumentController@save');


        // get lat long from node server
        Route::post('/get-lat-long', ['as' => 'merchant.get-lat-long', 'uses' => 'Merchant\DriverController@getLatLongFromNode']);

        Route::post('document/update', ['as' => 'doc.update', 'uses' => 'Merchant\DocumentController@update']);
        Route::get('/document/active/deactive/{id}/{status}', ['as' => 'merchant.document.active-deactive', 'uses' => 'Merchant\DocumentController@ChangeStatus']);
        Route::get('/service', ['as' => 'merchant.service', 'uses' => 'Merchant\DashBoardController@ServiceType']);
        Route::get('/verifyDocument/{id}/{status}', ['as' => 'merchant.verifyDocument', 'uses' => 'Merchant\DriverController@VerifyDocument']);

        Route::post('/reject', ['as' => 'merchant.reject', 'uses' => 'Merchant\DriverController@Reject']);
        Route::get('/driver/vehicle/{id}', ['as' => 'merchant.driver-vehicle', 'uses' => 'Merchant\DriverController@Vehicles']);
        Route::get('/driver/vehicle/edit/{id}', ['as' => 'merchant.driver-vehicle.edit', 'uses' => 'Merchant\DriverController@EditVehicle']);
        Route::post('/driver/vehicle/update/{id}', ['as' => 'merchant.driver-vehicle.update', 'uses' => 'Merchant\DriverController@UpdateVehicle']);

        Route::get('/tempDoc/verify/{id}/{status}', ['as' => 'merchant.driverTempDocVerify', 'uses' => 'Merchant\DriverController@TempDocumentVerify']);
        Route::post('/tempDoc/reject/', ['as' => 'merchant.driverTempDocReject', 'uses' => 'Merchant\DriverController@rejectTempDoc']);

        Route::get('/vehicle/verify/{id}/{status}', ['as' => 'merchant.driver-vehicle-verify', 'uses' => 'Merchant\DriverController@verifyDriver']); // status 1 : approve vehicle & 2: document approve
        Route::post('/vehicle/reject/', ['as' => 'merchant.driver-vehicle-reject', 'uses' => 'Merchant\DriverController@rejectDriver']);
        //        Route::get('/vehicle/details/{id}', ['as' => 'merchant.driver-vehicledetails', 'uses' => 'Merchant\DriverController@VehiclesDocument']);
        Route::get('/vehicle/details/{id}', ['as' => 'merchant.driver-vehicledetails', 'uses' => 'Merchant\DriverController@VehiclesDetail']);

        Route::get('/vehicle/document/{id}/{status}', ['as' => 'merchant.driver-vehicledocument', 'uses' => 'Merchant\DriverController@VehiclesDocumentVerify']);
        Route::post('/vehicle/rejectdocument', ['as' => 'merchant.driver-vehiclereject', 'uses' => 'Merchant\DriverController@VehiclesDocumentReject']);
        Route::get('/booking/track/{id}', ['as' => 'merchant.activeride.track', 'uses' => 'Merchant\BookingController@ActiveBookingTrack']);
        Route::get('/booking/{slug}/activeride', ['as' => 'merchant.activeride', 'uses' => 'Merchant\BookingController@index']);
        Route::post('/booking/{slug}/activeride', ['as' => 'merchant.activeride.serach', 'uses' => 'Merchant\BookingController@SearchForActiveRide']);
        
        //upcoming ride
        Route::get('/booking/{slug}/upcomingride', ['as' => 'merchant.upcomingride', 'uses' => 'Merchant\BookingController@upcomingRide']);
        Route::post('/booking/{slug}/upcomingride', ['as' => 'merchant.upcomingride.serach', 'uses' => 'Merchant\BookingController@SearchForUpcomingRide']);
        Route::get('/booking/upcomingride/manual-assign/{id}', ['as' => 'merchant.ride-later.manual-assign', 'uses' => 'Merchant\BookingController@RideLaterManualAssign']);
        Route::post('/booking/upcomingride/manual-assign', ['as' => 'merchant.booking.order-assign-to-driver', 'uses' => 'Merchant\BookingController@bookingAssignToDriverManually']);

        Route::post('/booking/endride', ['as' => 'merchant.endride', 'uses' => 'Merchant\BookingController@endRide']);
        Route::get('/booking/{slug}/autocancel', ['as' => 'merchant.autocancel', 'uses' => 'Merchant\BookingController@AutoCancel']);
        Route::get('/booking/{slug}/autocancel/search', ['as' => 'merchant.autocancel.serach', 'uses' => 'Merchant\BookingController@SearchForAutoCancel']);
        Route::get('/booking/{slug}/all', ['as' => 'merchant.all.ride', 'uses' => 'Merchant\BookingController@AllRides']);
        Route::get('/booking/{slug}/all/search', ['as' => 'merchant.all.serach', 'uses' => 'Merchant\BookingController@SearchForAllRides']);
        Route::get('/booking/{slug}/activeride/search', ['as' => 'merchant.activeride.later', 'uses' => 'Merchant\BookingController@SearchForActiveLaterRide']);
        Route::post('/booking/{slug}/activeride/search', ['as' => 'merchant.activeride.later.serach', 'uses' => 'Merchant\BookingController@SearchForActiveLaterRide']);
        Route::get('/booking/{slug}/cancel', ['as' => 'merchant.cancelride', 'uses' => 'Merchant\BookingController@CancelBooking']);
        Route::get('/booking/{slug}/cancel/search', ['as' => 'merchant.cancelride.search', 'uses' => 'Merchant\BookingController@SearchCancelBooking']);
        Route::get('/booking/{slug}/complete', ['as' => 'merchant.completeride', 'uses' => 'Merchant\BookingController@CompleteBooking']);
        Route::get('/booking/{slug}/complete/search', ['as' => 'merchant.completeride.search', 'uses' => 'Merchant\BookingController@SerachCompleteBooking']);
        Route::get('/booking/{slug}/failride', ['as' => 'merchant.failride', 'uses' => 'Merchant\BookingController@FailedBooking']);
        Route::get('/booking/{slug}/failride/search', ['as' => 'merchant.failride.search', 'uses' => 'Merchant\BookingController@SearchFailedBooking']);
        Route::post('/booking/cancelbooking', ['as' => 'merchant.cancelbooking', 'uses' => 'Merchant\BookingController@CancelBookingAdmin']);
        Route::post('/booking/completebooking', ['as' => 'merchant.completebooking', 'uses' => 'Merchant\BookingController@CompleteBookingAdmin']);
        Route::get('/booking/{id}', ['as' => 'merchant.booking.details', 'uses' => 'Merchant\BookingController@BookingDetails']);
        Route::get('/booking/invoice/{id}', ['as' => 'merchant.booking.invoice', 'uses' => 'Merchant\BookingController@Invoice']);
        Route::get('/ride/request/{id}', ['as' => 'merchant.ride-requests', 'uses' => 'Merchant\BookingController@DriverRequest']);
        Route::get('/ride/requestRides/{id}', ['as' => 'merchant.requestRides', 'uses' => 'Merchant\BookingController@requestRides']);
        Route::any('/findNearDriver', ['as' => 'BookingStatusWaiting', 'uses' => 'Merchant\BookingController@checkBookingStatusWaiting']);
        Route::get('/transactions', ['as' => 'merchant.transactions', 'uses' => 'Merchant\TransactionController@index']);
        Route::get('/transactions/search', ['as' => 'merchant.transactions.search', 'uses' => 'Merchant\TransactionController@Search']);
        Route::get('/transactions/billdetails', ['as' => 'merchant.billdetails.search', 'uses' => 'Merchant\TransactionController@GetBillDetails']);
        Route::get('/customer-support', ['as' => 'merchant.customer_support', 'uses' => 'Merchant\DashBoardController@Customer_Support']);
        Route::post('/customer-support', ['as' => 'merchant.customer_support.search', 'uses' => 'Merchant\DashBoardController@Customer_Support_Search']);
        Route::post('/AddManualUser', ['as' => 'merchant.AddManualUser', 'uses' => 'Merchant\ManualDispatchController@AddManualUser']);
        Route::get('/change-language/{locale}', ['as' => 'merchant.language', 'uses' => 'Merchant\DashBoardController@SetLangauge']);
        Route::post('/booking/rating', ['as' => 'merchant.booking.rating', 'uses' => 'Merchant\BookingController@rateBooking']);

        // master invoice
        Route::get('/booking/master/invoice', ['as' => 'merchant.master-invoice', 'uses' => 'Merchant\BookingController@masterInvoice']);
        Route::get('/booking/multiple/invoice', ['as' => 'merchant.multiple-invoice', 'uses' => 'Merchant\BookingController@multipleInvoice']);

        ////email
        Route::get('/emailconfiguration', ['as' => 'merchant.emailconfiguration', 'uses' => 'Merchant\emailTemplateController@emailconfiguration']);
        Route::post('/saveemailconfiguration', ['as' => 'merchant.emailconfiguration.store', 'uses' => 'Merchant\emailTemplateController@storeemailconfiguration']);
        Route::get('/emailtemplate', ['as' => 'merchant.emailtemplate', 'uses' => 'Merchant\emailTemplateController@emailTemplate']);
        Route::post('/saveemailtemplate', ['as' => 'merchant.emailtemplate.store', 'uses' => 'Merchant\emailTemplateController@storeemailTemplate']);
        //        Route::post('/saveemailconfig', ['as' => 'merchant.emailconfig.store', 'uses' => 'Merchant\emailTemplateController@configstore']);


        //whatsapp templates
        Route::get('/whatsapp-templates', ['as' => 'merchant.whatsappTemplate', 'uses' => 'Merchant\whatsappTemplateController@whatsappTemplate']);
        Route::post('/whatsapp-template-store', ['as' => 'merchant.whatsappTemplate.store', 'uses' => 'Merchant\whatsappTemplateController@store']);

        //config

        Route::get('/general_configuration', ['as' => 'merchant.general_configuration', 'uses' => 'Merchant\ConfigurationController@GeneralConfiguration']);
        Route::post('/general_configuration', ['as' => 'merchant.general_configuration.store', 'uses' => 'Merchant\ConfigurationController@StoreGeneralConfiguration']);

        Route::get('/payment-configuration', ['as' => 'merchant.payment-configuration', 'uses' => 'Merchant\ConfigurationController@paymentConfiguration']);
        Route::post('/payment-configuration', ['as' => 'merchant.payment-configuration.store', 'uses' => 'Merchant\ConfigurationController@paymentConfigurationStore']);


        Route::get('/booking_configuration', ['as' => 'merchant.booking_configuration', 'uses' => 'Merchant\ConfigurationController@BookingConfiguration']);
        Route::post('/booking_configuration', ['as' => 'merchant.booking_configuration.store', 'uses' => 'Merchant\ConfigurationController@StoreBookingConfiguration']);

        Route::get('/app_configuration', ['as' => 'merchant.application_configuration', 'uses' => 'Merchant\ConfigurationController@ApplicationConfiguration']);
        Route::post('/app_configuration', ['as' => 'merchant.application_configuration.store', 'uses' => 'Merchant\ConfigurationController@StoreApplicationConfiguration']);
        //        Route::get('/driverinfo/{id}', ['as' => 'merchant.driverinfo', 'uses' => 'Merchant\DriverController@DriverProfile']);
        Route::resource('navigation-drawer', 'Merchant\NavigationController', ['only' => ['index', 'edit', 'update']]);
        Route::get('/navigation/active/deactive/{id}/{status}', ['as' => 'merchant.navigations.active-deactive', 'uses' => 'Merchant\NavigationController@ChangeStatus']);
        Route::resource('navigation-drawer-config', 'Merchant\NavigationDrawerConfigController', ['only' => ['index', 'store']]);


        Route::get('/user/Alldocument', 'Merchant\UserController@AlldocumentStatus')->name('merchant.user.AlldocumentStatus');
        Route::get('/user/document/status', 'Merchant\UserController@ChangeDocumentStatus')->name('merchant.user.documentStatus');
        Route::get('/user/{id}/documents', 'Merchant\UserController@showDocuments')->name('merchant.user.documents');
        Route::get('/report/driver/online/time', ['as' => 'report.driver.online.time', 'uses' => 'Merchant\ReportController@DriverOnlineTime']);

        Route::get('/viewDriverInvoice/{id}', ['as' => 'merchant.viewDriverInvoice', 'uses' => 'Merchant\DriverAccountController@viewDriverInvoice']);
        Route::post('/BillDriverEmail', ['as' => 'merchant.billDriverEmail', 'uses' => 'Merchant\DriverAccountController@DriverBillEmail']);
        Route::post('/Driver_unblock', ['as' => 'Driver_unblock', 'uses' => 'Merchant\DriverController@driver_unblock']);
        Route::get('/DriverBill/{id}', ['as' => 'merchant.DriverBill', 'uses' => 'Merchant\DriverAccountController@DriverBill']);

        Route::get('/block/drivers/', ['as' => 'merchant.driver.block', 'uses' => 'Merchant\DriverController@BlockDrivers']);
        Route::post('/Driver_unblock', ['as' => 'Driver_unblock', 'uses' => 'Merchant\DriverController@driver_unblock']);
        Route::get('/pending_rider_approval', ['as' => 'pending_rider_approval', 'uses' => 'Merchant\UserController@PendingRiderList']);
        Route::post('/pending_search_approval', ['as' => 'pending_search_approval', 'uses' => 'Merchant\UserController@PendingSearch']);


        //        Route::post('/get-vehicle-types', ['as' => 'merchant.get-vehicle-types', 'uses' => 'Helper\AjaxController@getVehicleTypesByDelivery']);
        //        Route::post('/get-delivery-types', ['as' => 'merchant.get-delivery-types', 'uses' => 'Helper\AjaxController@getDeliveryTypes']);


        Route::resource('applicationstring', 'Merchant\ApplicatonStringController');
        Route::get('customEdit', 'Merchant\ApplicatonStringController@customEdit')->name('customEdit');
        Route::post('customSave', 'Merchant\ApplicatonStringController@customSave')->name('customSave');
        Route::get('customstring', 'Merchant\ApplicatonStringController@custom')->name('customstring');
        Route::get('get-string-val', ['as' => 'admin-app-string', 'uses' => 'Merchant\ApplicatonStringController@getStringVal']);
        Route::post('exportString', 'Merchant\ApplicatonStringController@ExportString')->name('exportString');


        // Localization Management v1 @ayush
        Route::prefix('localization')->group(function () {
            Route::get('/', 'Merchant\LocalizationManagementController@index')->name('merchant.localization.index');
            Route::get('/edit', 'Merchant\LocalizationManagementController@edit')->name('merchant.localization.edit');
            Route::post('/update', 'Merchant\LocalizationManagementController@update')->name('merchant.localization.update');
            Route::get('/import', 'Merchant\LocalizationManagementController@import')->name('merchant.localization.import');
            Route::post('/import/process', 'Merchant\LocalizationManagementController@processImport')->name('merchant.localization.import.process');
            Route::post('/export', 'Merchant\LocalizationManagementController@export')->name('merchant.localization.export');
            Route::get('/get-screens', 'Merchant\LocalizationManagementController@getScreens')->name('merchant.localization.get-screens');
        });

        // Create @Bhuvanesh - For edit driver vehicle document
        Route::get('/driver/editVehicleDocument/{id}/{vehicle}', ['as' => 'driver.edit.driver-vehicle-document', 'uses' => 'Merchant\DriverController@editDriverVehicleDocument']);
        Route::post('/driver/editVehicleDocument/{id}/{vehicle}', ['as' => 'driver.store.driver-vehicle-document', 'uses' => 'Merchant\DriverController@storeDriverVehicleDocument']);

        //        Route::resource('corporate', 'Merchant\CorporateController');

        Route::get('/corporate', ['as' => 'corporate.index', 'uses' => 'Merchant\CorporateController@index']);
        Route::get('/corporate/add/{id?}', ['as' => 'corporate.create', 'uses' => 'Merchant\CorporateController@add']);
        Route::post('/corporate/save/{id?}', ['as' => 'corporate.store', 'uses' => 'Merchant\CorporateController@save']);

        Route::get('/corporate/status/{id}/{status}', ['as' => 'merchant.corporate.status', 'uses' => 'Merchant\CorporateController@ChangeStatus']);
        Route::post('/corporate/add-money', ['as' => 'corporate.AddMoney', 'uses' => 'Merchant\CorporateController@AddMoney']);
        Route::get('/corporate/wallet/{id}', ['as' => 'corporate.wallet.show', 'uses' => 'Merchant\CorporateController@Wallet']);

        Route::get('/corporate/invoices/{id}', ['as' => 'merchant.corporate.invoice', 'uses' => 'Merchant\CorporateController@corporateInvoices']);
        Route::post('/corporate/invoices/details', ['as' => 'merchant.corporate.invoice.details', 'uses' => 'Merchant\CorporateController@corporateInvoicesDetails']);
        Route::post('/corporate/invoices/settle', ['as' => 'merchant.corporate.invoices.settle', 'uses' => 'Merchant\CorporateController@settleInvoice']);

        Route::get('/excel-export-logs/', ['as' => 'merchant.driver.export.logs', 'uses' => 'Merchant\ExcelExportController@index']);
        Route::get('download-file/{id}', ['as' => 'merchant.driver.export.download', 'uses' => 'Merchant\ExcelExportController@download']);
        Route::get('delete-export-file/{id}', ['as' => 'merchant.driver.export.delete', 'uses' => 'Merchant\ExcelExportController@delete']);

        Route::resource('signupwalletrecharge', 'Merchant\SignUpWalletRechargeController');

        // Create @Bhuvanesh - For Advertisement Banner
        Route::get('/advertisement/banner', 'Merchant\AdvertisementBannerController@index')->name('advertisement.index');
        Route::get('/advertisement/banner/create/{id?}', 'Merchant\AdvertisementBannerController@create')->name('advertisement.create');
        Route::post('/advertisement/banner/store/{id?}', 'Merchant\AdvertisementBannerController@store')->name('advertisement.store');
        Route::get('/advertisement/active/deactive/{id}/{status}', ['as' => 'advertisement.active.deactive', 'uses' => 'Merchant\AdvertisementBannerController@ChangeStatus']);
        Route::get('/advertisement/delete', ['as' => 'advertisement.delete', 'uses' => 'Merchant\AdvertisementBannerController@Delete']);
        Route::get('/segment/get-business-segment', ['as' => 'segment.get.business-segment', 'uses' => 'Merchant\BusinessSegmentController@getBusinessSegment']);

        // for demo
        Route::get('/driver-list', ['as' => 'driver.detail-list', 'uses' => 'Merchant\DriverController@DetailList']);
        Route::post('/verify-otp', ['as' => 'driver.otp-verification', 'uses' => 'Merchant\DriverController@verfiyOtp']);

        // for demo user
        Route::get('/user-list', ['as' => 'user.detail-list', 'uses' => 'Merchant\UserController@UserList']);
        Route::post('/user-verify-otp', ['as' => 'user.otp-verification', 'uses' => 'Merchant\UserController@verfiyOtp']);


        // for geofence
        Route::get('geofence/restrict', ['as' => 'geofence.restrict.index', 'uses' => 'Merchant\GeofenceRestrictedAreaController@RestrictedArea']);
        Route::get('geofence/restrict/edit/{id}', ['as' => 'geofence.restrict.edit', 'uses' => 'Merchant\GeofenceRestrictedAreaController@EditRestrictedArea']);
        Route::post('geofence/restrict/save/{id}', ['as' => 'geofence.restrict.save', 'uses' => 'Merchant\GeofenceRestrictedAreaController@SaveRestrictedArea']);
        Route::get('geofence/view/{id}', ['as' => 'geofence.restrict.viewgeofencequeue', 'uses' => 'Merchant\GeofenceRestrictedAreaController@ViewGeofenceQueue']);
        Route::post('geofence/view/search/{id}', ['as' => 'geofence.restrict.viewgeofencequeue.search', 'uses' => 'Merchant\GeofenceRestrictedAreaController@SearchViewGeofenceQueue']);

        Route::post('checkOutstationDropArea', ['as' => 'merchant.manual.checkArea', 'uses' => 'Merchant\ManualDispatchController@checkOutstationDropArea']);

        // Stripe Connect
        Route::get('/stripe_connect_configuration', ['as' => 'merchant.stripe_connect_configuration', 'uses' => 'Merchant\ConfigurationController@stripeConnectConfiguration']);
        Route::post('/stripe_connect_configuration', ['as' => 'merchant.stripe_connect_configuration.store', 'uses' => 'Merchant\ConfigurationController@stripeConnectConfigurationStore']);

        // Stripe Connect
        Route::get('driver/stripe-connect/{id}', ['as' => 'merchant.driver.stripe_connect', 'uses' => 'Merchant\DriverController@driverStripeConnect']);
        Route::post('driver/stripe-connect/{id}', ['as' => 'merchant.driver.stripe_connect.store', 'uses' => 'Merchant\DriverController@driverStripeConnectStore']);
        Route::get('driver/stripe-connect/sync/{id}', ['as' => 'merchant.driver.stripe_connect.sync', 'uses' => 'Merchant\DriverController@driverStripeConnectSync']);
        Route::get('driver/stripe-connect/delete/{id}', ['as' => 'merchant.driver.stripe_connect.delete', 'uses' => 'Merchant\DriverController@driverStripeConnectDelete']);


        /* Business Segment*/

        Route::get('business-segment/add/{slug}/{id?}', ['as' => 'merchant.business-segment/add', 'uses' => 'Merchant\BusinessSegmentController@add']);
        Route::post('business-segment/save/{slug}/{id?}', ['as' => 'merchant.business-segment.save', 'uses' => 'Merchant\BusinessSegmentController@save']);
        Route::get('business-segment/deleted/{slug}', ['as' => 'merchant.business-segment.deleted', 'uses' => 'Merchant\BusinessSegmentController@DeletedBusinessSegment']);
        Route::post('business-segment/restore/{slug}', ['as' => 'merchant.business-segment.account.restore', 'uses' => 'Merchant\BusinessSegmentController@RestoreBusinessSegment']);
        Route::get('business-segment/open-close/{slug}/{id}/{is_open}', ['as' => 'merchant.business-segment.open.close', 'uses' => 'Merchant\BusinessSegmentController@OpenOrCloseBusinessSegment']);

        Route::get('business-segment/{slug}', ['as' => 'merchant.business-segment', 'uses' => 'Merchant\BusinessSegmentController@index']);

        Route::get('business-segment/{slug}/pending-details', ['as' => 'merchant.business-segment.pending-details', 'uses' => 'Merchant\BusinessSegmentController@indexPendingDetails']);
        Route::get('business-segment/{slug}/pending-details/{id?}', ['as' => 'merchant.business-segment/add-pending-details', 'uses' => 'Merchant\BusinessSegmentController@addPendingDetails']);
        Route::post('business-segment/save/{slug}/pending-details/{id?}', ['as' => 'merchant.business-segment.save-pending-details', 'uses' => 'Merchant\BusinessSegmentController@savePendingDetails']);


        Route::get('business-segment/aync-all-stripe-connect/{id?}', ['as' => 'merchant.business-segment/sync-all-stripe-connect', 'uses' => 'Merchant\BusinessSegmentController@SyncAllStripeConnect']);
        Route::get('business-segment/stripe-connect/{id?}', ['as' => 'merchant.business-segment/stripe-connect', 'uses' => 'Merchant\BusinessSegmentController@stripeConnect']);
         Route::post('business-segment/stripe-connect/{id?}', ['as' => 'merchant.business-segment.stripe_connect.store', 'uses' => 'Merchant\BusinessSegmentController@StripeConnectStore']);
        // Route::get('business-segment/stripe-connect-Sync/{id?}', ['as' => 'merchant.business-segment/stripe-connect-sync', 'uses' => 'Merchant\BusinessSegmentController@SyncStripeConnect']);
        Route::get('business-segment/stripe-connect-Sync/{id?}', ['as' => 'merchant.business-segment/stripe-connect-sync', 'uses' => 'Merchant\BusinessSegmentController@SyncStripeConnect']);
        Route::get('business-segment/stripe-connect-Delete/{id?}', ['as' => 'merchant.business-segment/stripe-connect-delete', 'uses' => 'Merchant\BusinessSegmentController@DeleteStripeConnect']);

        Route::get('business-segment/statistics/{slug}/{b_id?}', ['as' => 'merchant.business-segment.statistics', 'uses' => 'Merchant\BusinessSegmentController@statistics']);
        Route::get('business-segment/orders/{slug}/{id?}', ['as' => 'merchant.business-segment.orders', 'uses' => 'Merchant\BusinessSegmentController@orders']);
        Route::post('business-segment/productcopy', ['as' => 'merchant.business-segment.productcopy', 'uses' => 'Merchant\BusinessSegmentController@copyProduct']);
        Route::post('/business-segment/AddMoney', ['as' => 'merchant.business-segment.AddMoney', 'uses' => 'Merchant\BusinessSegmentController@AddMoney']);
        /* Style Management*/
        Route::get('style-management', ['as' => 'merchant.style-management', 'uses' => 'Merchant\StyleManagementController@index']);
        Route::get('style-management-add/{id?}', ['as' => 'merchant.style-management.add', 'uses' => 'Merchant\StyleManagementController@add']);
        Route::post('style-management-save/{id?}', ['as' => 'merchant.style-management.save', 'uses' => 'Merchant\StyleManagementController@save']);
        Route::post('style-management-delete/', ['as' => 'merchant.style-management.destroy', 'uses' => 'Merchant\StyleManagementController@destroy']);

        /* Product Management Category*/
        Route::get('/category', ['as' => 'merchant.category', 'uses' => 'Merchant\CategoryController@index']);
        Route::get('/category-add/{id?}', ['as' => 'business-segment.category.add', 'uses' => 'Merchant\CategoryController@add']);
        Route::post('/category-save/{id?}', ['as' => 'business-segment.category.save', 'uses' => 'Merchant\CategoryController@save']);
        Route::post('/category-delete/', ['as' => 'business-segment.category.destroy', 'uses' => 'Merchant\CategoryController@destroy']);
        Route::get('/category/update/status/{id}/{status}', ['as' => 'business-segment.category.update.status', 'uses' => 'Merchant\CategoryController@updateStatus']);
        Route::get('/category-export/', ['as' => 'merchant.category.export', 'uses' => 'ExcelController@categories']);
        Route::post('/category-import', ['as' => 'merchant-category-import', 'uses' => 'Merchant\CategoryController@importCategories']);

        /* Brand Management*/
        Route::get('/brands', ['as' => 'merchant.brands', 'uses' => 'Merchant\BrandController@index']);
        Route::get('/brand-add/{id?}', ['as' => 'merchant.brand.add', 'uses' => 'Merchant\BrandController@add']);
        Route::post('/brand-save/{id?}', ['as' => 'merchant.brand.save', 'uses' => 'Merchant\BrandController@save']);
        Route::post('/brand-delete/', ['as' => 'merchant.brand.destroy', 'uses' => 'Merchant\BrandController@destroy']);
        Route::get('/brand/update/status/{id}/{status}', ['as' => 'merchant.brand.update.status', 'uses' => 'Merchant\BrandController@updateStatus']);

        /* Event Management*/ // Module not in use
        //        Route::get('/events',['as'=>'merchant.events','uses'=>'Merchant\EventController@index']);
        //        Route::get('/event-add/{id?}',['as'=>'merchant.event.add','uses'=>'Merchant\EventController@add']);
        //        Route::post('/event-save/{id?}',['as'=>'merchant.event.save','uses'=>'Merchant\EventController@save']);
        //        Route::post('/event-delete/',['as'=>'merchant.event.destroy','uses'=>'Merchant\EventController@destroy']);
        //        Route::get('/event/update/status/{id}/{status}', ['as' => 'merchant.event.update.status','uses' =>'Merchant\EventController@updateStatus']);

        /* HomeScreenDesign Config*/
        Route::get('/home-screen/design-config', ['as' => 'merchant.home-screen.design-config', 'uses' => 'Merchant\HomeScreenDesignConfigController@index']);
        Route::post('/home-screen/design-config', ['as' => 'merchant.home-screen.design-config.save', 'uses' => 'Merchant\HomeScreenDesignConfigController@save']);

        /* Product order*/
        Route::get('/order', ['as' => 'order.index', 'uses' => 'BusinessSegment\OrderController@index']);
        Route::get('/order/search', ['as' => 'order.search', 'uses' => 'BusinessSegment\OrderController@index']);
        Route::get('/excel/order', ['as' => 'excel.order', 'uses' => 'ExcelController@PriceCard']);

        /*Segment update*/
        Route::get('/segment', ['as' => 'merchant.segment.add', 'uses' => 'Merchant\ServiceTypeController@addSegment']);
        Route::post('/segment', ['as' => 'merchant.segment.save', 'uses' => 'Merchant\ServiceTypeController@saveSegment']);

        Route::get('/segment/edit/{id?}', ['as' => 'merchant.segment.edit', 'uses' => 'Merchant\ServiceTypeController@editSegment']);
        Route::post('/segment/update/{id?}', ['as' => 'merchant.segment.update', 'uses' => 'Merchant\ServiceTypeController@updateSegment']);

        /**HandyMan Segment PriceCard */
        Route::get('/segment/price-cards', ['as' => 'merchant.segment.price_card', 'uses' => 'Segment\SegmentPriceCardController@index']);
        Route::get('/segment/price-card/add/{id?}', ['as' => 'segment.price_card.add', 'uses' => 'Segment\SegmentPriceCardController@add']);
        Route::post('/segment/price-card/save/{id?}', ['as' => 'segment.price_card.save', 'uses' => 'Segment\SegmentPriceCardController@save']);
        Route::post('/segment/price-card/services', ['as' => 'segment.price_card.services', 'uses' => 'Segment\SegmentPriceCardController@getSegmentPriceCardServices']);

        /**HandyMan Segment Service Time slot */
        Route::get('/segment/service-time-slot', ['as' => 'segment.service-time-slot', 'uses' => 'Segment\ServiceTimeSlotController@index']);
        Route::get('/segment/service-time-slot/add', ['as' => 'segment.service-time-slot.add', 'uses' => 'Segment\ServiceTimeSlotController@add']);
        Route::post('/segment/service-time-slot/save', ['as' => 'segment.service-time-slot.save', 'uses' => 'Segment\ServiceTimeSlotController@save']);
        Route::get('/segment/service-time-slot/edit/{id}', ['as' => 'segment.service-time-slot.edit', 'uses' => 'Segment\ServiceTimeSlotController@edit']);
        Route::post('/segment/service-time-slot/update/{id}', ['as' => 'segment.service-time-slot.update', 'uses' => 'Segment\ServiceTimeSlotController@update']);
        Route::get('/segment/service-time-slot/detail/add/{id}', ['as' => 'service-time-slot.detail', 'uses' => 'Segment\ServiceTimeSlotController@getSlotDetail']);
        Route::post('/segment/service-time-slot/detail/save/', ['as' => 'service-time-slot.detail.save', 'uses' => 'Segment\ServiceTimeSlotController@saveSlotDetail']);

        /**HandyMan Segment Service Time slot */
        Route::get('/segment/handyman-charge-type', ['as' => 'segment.handyman-charge-type', 'uses' => 'Segment\HandymanChargeTypeController@index']);
        Route::get('/segment/handyman-charge-type/add/{id?}', ['as' => 'segment.handyman-charge-type.add', 'uses' => 'Segment\HandymanChargeTypeController@add']);
        Route::post('/segment/handyman-charge-type/save/{id?}', ['as' => 'segment.handyman-charge-type.save', 'uses' => 'Segment\HandymanChargeTypeController@save']);

        /**HandyMan Segment Categories */
        Route::get('/segment/handyman-category', ['as' => 'segment.handyman-category', 'uses' => 'Segment\HandymanCategoryController@index']);
        Route::get('/segment/handyman-category/add/{id?}', ['as' => 'segment.handyman-category.add', 'uses' => 'Segment\HandymanCategoryController@add']);
        Route::post('/segment/handyman-category/save/{id?}', ['as' => 'segment.handyman-category.save', 'uses' => 'Segment\HandymanCategoryController@save']);
        Route::post('/segment/arr-services', ['as' => 'segment.services', 'uses' => 'Helper\AjaxController@getMerchantSegmentServices']);
        Route::post('/checkedCustomerSupport', ['as' => 'support.checkbox.update', 'uses' => 'Helper\AjaxController@saveCheckedSupport']);

        /**HandyMan's Segment orders */
        //        Route::get('/handyman/plumber/orders', ['as' => 'handyman.plumber.orders', 'uses' => 'Merchant\HandymanOrderController@plumberOrders']);
        //        Route::get('/handyman/plumber/order/search', ['as' => 'merchant.plumber.order.search', 'uses' => 'Merchant\HandymanOrderController@plumberOrders']);
        //        Route::get('/handyman/electrician/orders', ['as' => 'handyman.electrician.orders', 'uses' => 'Merchant\HandymanOrderController@electricianOrders']);
        //        Route::get('/handyman/electrician/order/search', ['as' => 'handyman.electrician.order.search', 'uses' => 'Merchant\HandymanOrderController@electricianOrders']);

        Route::get('/handyman/orders', ['as' => 'handyman.orders', 'uses' => 'Merchant\HandymanOrderController@orders']);
        Route::get('/handyman/order/detail/{id}', ['as' => 'merchant.handyman.order.detail', 'uses' => 'Merchant\HandymanOrderController@orderDetail']);
        Route::get('/handyman/bidding', ['as' => 'handyman.bidding', 'uses' => 'Merchant\HandymanOrderController@bidding']);
        Route::post('/handyman/bidding/update/driver-quoted-price/', ['as' => 'handyman.bidding.update.quoted.price', 'uses' => 'Merchant\HandymanOrderController@updateDriverQuotedPrice']);
        Route::get("/handyman/bidding/manual-assign/{id}", ['as' => 'handyman.bidding.manual.assign', 'uses' => 'Merchant\HandymanOrderController@biddingManualAssign'] );
        Route::post("/handyman/bidding/get-nearest-provider", ['as' => 'handyman.get.nearest.provider', 'uses' => 'Merchant\HandymanOrderController@getNearestProvider']);
        Route::post('/handyman/bidding/order/assign/', ['as' => 'handyman-store.order.assign-to-driver', 'uses' => 'Merchant\HandymanOrderController@biddingOrderAssignToDriver']);
        Route::post('/handyman/orders/mark-as-complete', ['as' => 'handyman.order.mark-as-complete', 'uses' => 'Merchant\HandymanOrderController@markAsComplete']);

        // send handyman booking invoice
        Route::get('/send-invoice/{id}', ['as' => 'admin.send-invoice', 'uses' => 'Merchant\HandymanOrderController@sendInvoice']);


        Route::get('/handyman/flutterwavePaymentRequest', ['as' => 'merchant.handyman.flutterwavePaymentRequest', 'uses' => 'Merchant\HandymanOrderController@flutterwayPaymentRequest']);

        Route::get('/handyman/verifyFlutterwaveTransaction', ['as' => 'merchant.handyman.verifyFlutterwaveTransaction', 'uses' => 'Merchant\HandymanOrderController@verifyFlutterwaveTransaction']);

        /*Delivery Product*/

        Route::resource('delivery_product', 'Merchant\DeliveryProductController');
        Route::get('delivery_product/change-status/{id}/{status}/{type}', 'Merchant\DeliveryProductController@ChangeStatus')->name('delivery_product.change_status');
        Route::get('delivery-product/category', 'Merchant\DeliveryProductController@DeliveryProductType')->name('delivery_product.type.index');
        Route::post('delivery-product/category/store', 'Merchant\DeliveryProductController@StoreDeliveryProductType')->name('delivery_product.type.store');
        Route::any('delivery-product/category/update/{id}', 'Merchant\DeliveryProductController@updateDeliveryProductType')->name('delivery_product.type.update');

        // driver order details
        Route::get('/driver/order/detail/{id}', ['as' => 'driver.order.detail', 'uses' => 'Merchant\DriverController@orderDetail']);

        /**HandyMan Segment PriceCard */
        Route::get('/food-grocery/pricecard/{price_card_for}', ['as' => 'food-grocery.price_card', 'uses' => 'Merchant\PriceCardController@indexFoodGrocery']);
        Route::get('/food-grocery/price-card/add/{price_card_for}/{id?}', ['as' => 'food-grocery.price_card.add', 'uses' => 'Merchant\PriceCardController@addFoodGrocery']);
        Route::post('/food-grocery/price-card/save/{id?}', ['as' => 'food-grocery.price_card.save', 'uses' => 'Merchant\PriceCardController@saveFoodGrocery']);

        //for taxi company cashout
        Route::get('taxi-company/cashout/request', ['as' => 'merchant.taxi-company.cashout_request', 'uses' => 'Merchant\TaxiCompanyController@cashoutRequest']);
        Route::get('taxi-company/cashout/status/{id}', ['as' => 'merchant.taxi-company.cashout_status', 'uses' => 'Merchant\TaxiCompanyController@cashoutChangeStatus']);
        Route::post('taxi-company/cashout/status/{id}', ['as' => 'merchant.taxi-company.cashout_status_update', 'uses' => 'Merchant\TaxiCompanyController@cashoutChangeStatusUpdate']);

        // for Driver Cashout
        Route::get('drivers/cashout/request', ['as' => 'merchant.driver.cashout_request', 'uses' => 'Merchant\DriverCashoutController@index']);
        Route::get('drivers/cashout/request/search', ['as' => 'merchant.driver.cashout_request.search', 'uses' => 'Merchant\DriverCashoutController@search']);
        Route::get('drivers/cashout/status/{id}', ['as' => 'merchant.driver.cashout_status', 'uses' => 'Merchant\DriverCashoutController@changeStatus']);
        Route::post('drivers/cashout/status/{id}', ['as' => 'merchant.driver.cashout_status_update', 'uses' => 'Merchant\DriverCashoutController@changeStatusUpdate']);

        // for Business segment Cashout
        Route::get('business-segment/cashout/request', ['as' => 'merchant.business-segment.cashout_request', 'uses' => 'Merchant\BusinessSegmentController@cashoutRequest']);
        Route::get('business-segment/cashout/status/{id}', ['as' => 'merchant.business-segment.cashout_status', 'uses' => 'Merchant\BusinessSegmentController@cashoutChangeStatus']);
        Route::post('business-segment/cashout/status/{id}', ['as' => 'merchant.business-segment.cashout_status_update', 'uses' => 'Merchant\BusinessSegmentController@cashoutChangeStatusUpdate']);
        // for Business segment Order Details
        Route::get('/business-segment/order/detail/{id}', ['as' => 'merchant.business-segment.order.detail', 'uses' => 'Merchant\BusinessSegmentController@orderDetail']);

        /* carPool Segment */

        Route::get('carpool-payment-configuration', ['as' => 'merchant.carpooling.payment_configuration', 'uses' => 'Merchant\CarPoolingConfigurationController@index']);
        Route::post('carpool-payment-configuration/save', ['as' => 'merchant.carpooling.payment_configuration.save', 'uses' => 'Merchant\CarPoolingConfigurationController@save']);
        Route::get('taken-rides', ['as' => 'merchant.taken.rides', 'uses' => 'Merchant\CarpoolingOfferRideController@takenRideList']);
        Route::get('offer-rides', ['as' => 'merchant.offer.rides', 'uses' => 'Merchant\CarpoolingOfferRideController@offerRideList']);
        Route::get('/offer-rides/search', ['as' => 'merchant.carpooling.offer.rides.search', 'uses' => 'Merchant\CarpoolingOfferRideController@offerRideSearch']);
        Route::get('offer-rides/details/{id}', ['as' => 'merchant.offer.rides.details', 'uses' => 'Merchant\CarpoolingOfferRideController@offerRideDetails']);
        Route::get('/user/ride/details{id}', ['as' => 'merchant.offer.rides.user.details', 'uses' => 'Merchant\CarpoolingOfferRideController@UserOfferRideDetails']);

        /* carPool Ride Earning */
        Route::get('carpooling/earning', ['as' => 'merchant.carpooling.earning', 'uses' => 'Merchant\CarpoolingOfferRideController@earningReport']);
        Route::get('carpooling/earning/search/{type?}', ['as' => 'merchant.carpooling.earning.search', 'uses' => 'Merchant\CarpoolingOfferRideController@Search']);

        /* carPool Ride Management */
        Route::get('upcoming-rides', ['as' => 'merchant.carpool.up_coming.rides', 'uses' => 'Merchant\CarpoolingRideController@upComingRideList']);
        Route::get('upcoming-rides/search', ['as' => 'merchant.carpool.up_coming.rides.search', 'uses' => 'Merchant\CarpoolingRideController@upComingRideSearch']);
        Route::get('active-rides', ['as' => 'merchant.active.rides', 'uses' => 'Merchant\CarpoolingRideController@activeRideList']);
        Route::get('active-rides/search', ['as' => 'merchant.carpool.active.rides.search', 'uses' => 'Merchant\CarpoolingRideController@ActiveRideSearch']);
        Route::get('cancel-rides', ['as' => 'merchant.cancel.rides', 'uses' => 'Merchant\CarpoolingRideController@cancelRideList']);
        Route::get('cancel-rides/search', ['as' => 'merchant.carpool.cancel.rides.search', 'uses' => 'Merchant\CarpoolingRideController@CancelRideSearch']);
        Route::get('complete-rides', ['as' => 'merchant.complete.rides', 'uses' => 'Merchant\CarpoolingRideController@completeRideList']);
        Route::get('complete-rides/search', ['as' => 'merchant.carpool.complete.rides.search', 'uses' => 'Merchant\CarpoolingRideController@CompleteRideSearch']);
        Route::get('failed-rides', ['as' => 'merchant.failed.rides', 'uses' => 'Merchant\CarpoolingRideController@failedRideList']);
        Route::get('failed-rides/search', ['as' => 'merchant.carpool.failed.rides.search', 'uses' => 'Merchant\CarpoolingRideController@FailedRideSearch']);
        Route::get('auto-cancel-rides', ['as' => 'merchant.auto-cancel.rides', 'uses' => 'Merchant\CarpoolingRideController@autoCanceRideList']);
        Route::get('auto-cancel/search', ['as' => 'merchant.carpool.auto-cancel.rides.search', 'uses' => 'Merchant\CarpoolingRideController@AutoCancelRideSearch']);
        Route::get('all-rides', ['as' => 'merchant.all.rides', 'uses' => 'Merchant\CarpoolingRideController@allRideList']);
        Route::get('all-rides/search', ['as' => 'merchant.carpool.all.rides.search', 'uses' => 'Merchant\CarpoolingRideController@AllRideSearch']);

        /* carPool offer Ride Management */
        Route::get('offer/upcoming-rides', ['as' => 'merchant.carpool.offer_up_coming.rides', 'uses' => 'Merchant\CarpoolingRideController@offerUpComingRideList']);
        Route::get('offer/upcoming-rides/search', ['as' => 'merchant.carpool.offer_up_coming.rides.search', 'uses' => 'Merchant\CarpoolingRideController@offerUpComingRideSearch']);
        Route::get('offer/active-rides', ['as' => 'merchant.offer_active.rides', 'uses' => 'Merchant\CarpoolingRideController@offerActiveRideList']);
        Route::get('offer/active-rides/search', ['as' => 'merchant.carpool.offer_active.rides.search', 'uses' => 'Merchant\CarpoolingRideController@offerActiveRideSearch']);
        Route::get('offer/cancel-rides', ['as' => 'merchant.offer_cancel.rides', 'uses' => 'Merchant\CarpoolingRideController@OfferCancelRideList']);
        Route::get('offer/cancel-rides/search', ['as' => 'merchant.carpool.offer_cancel.rides.search', 'uses' => 'Merchant\CarpoolingRideController@offerCancelRideSearch']);
        Route::get('offer/complete-rides', ['as' => 'merchant.offer_complete.rides', 'uses' => 'Merchant\CarpoolingRideController@offerCompleteRideList']);
        Route::get('offer/complete-rides/search', ['as' => 'merchant.carpool.offer_complete.rides.search', 'uses' => 'Merchant\CarpoolingRideController@offerCompleteRideSearch']);
        Route::get('offer/failed-rides', ['as' => 'merchant.offer_failed.rides', 'uses' => 'Merchant\CarpoolingRideController@offerFailedRideList']);
        Route::get('offer/failed-rides/search', ['as' => 'merchant.offer_carpool.failed.rides.search', 'uses' => 'Merchant\CarpoolingRideController@offerFailedRideSearch']);
        Route::get('offer/auto-cancel-rides', ['as' => 'merchant.offer_auto-cancel.rides', 'uses' => 'Merchant\CarpoolingRideController@offerAutoCanceRideList']);
        Route::get('offer/auto-cancel/search', ['as' => 'merchant.offer_carpool.auto-cancel.rides.search', 'uses' => 'Merchant\CarpoolingRideController@offerAutoCancelRideSearch']);
        Route::get('offer/all-rides', ['as' => 'merchant.all.rides', 'uses' => 'Merchant\CarpoolingRideController@allRideList']);
        Route::get('offer/all-rides/search', ['as' => 'merchant.carpool.all.rides.search', 'uses' => 'Merchant\CarpoolingRideController@AllRideSearch']);
        Route::get('/offer/active/deactive/{id}/{status}', ['as' => 'merchant.carpool.all.active-deactive', 'uses' => 'Merchant\CarpoolingRideController@ChangeStatus']);
        Route::get('offer/user/ride/details/{id}', ['as' => 'merchant.offer.user.details', 'uses' => 'Merchant\CarpoolingOfferRideController@offerRideDetails']);
        /** carpooling Transaction */
        Route::get('carpooling/user-cashout', ['as' => 'merchant.carpool.user.transaction', 'uses' => 'Merchant\CarpoolingTransactionController@index']);
        Route::get('carpooling/user-cashout/edit/{id}', ['as' => 'merchant.carpool.user.transaction.edit', 'uses' => 'Merchant\CarpoolingTransactionController@edit']);
        Route::post('carpooling/user-cashout/update/{id}', ['as' => 'merchant.carpool.user.transaction.update', 'uses' => 'Merchant\CarpoolingTransactionController@update']);
        /** Carpooling Config */
        Route::get('/carpooling-config', ['as' => 'merchant.carpooling.config', 'uses' => 'Merchant\CarPoolingConfigurationController@countryConfig']);
        Route::get('/country-wise-carpooling-config', ['as' => 'merchant.carpooling.config.country.id', 'uses' => 'Merchant\CarPoolingConfigurationController@CountryConfigCreate']);
        Route::post('/country-wise-carpooling-config-store', ['as' => 'merchant.carpooling.config.country.store', 'uses' => 'Merchant\CarPoolingConfigurationController@StoreCountryCarpoolingConfig']);
        /* paymentgateway configuration */
        Route::get('/gateway/paypal', ['as' => 'merchant.gateway.paypal', 'uses' => 'Merchant\GatewayController@paypal']);
        Route::post('/gateway/paypal', ['as' => 'merchant.gateway.paypal.store', 'uses' => 'Merchant\GatewayController@paypal_store']);
        Route::get('/gateway/stripe', ['as' => 'merchant.gateway.stripe', 'uses' => 'Merchant\GatewayController@stripe']);
        Route::post('/gateway/stripe', ['as' => 'merchant.gateway.stripe.store', 'uses' => 'Merchant\GatewayController@stripe_store']);
        Route::get('/gateway/monetbil', ['as' => 'merchant.gateway.monetbil', 'uses' => 'Merchant\GatewayController@monetbil']);
        Route::post('/gateway/monetbil', ['as' => 'merchant.gateway.monetbil.store', 'uses' => 'Merchant\GatewayController@monetbil_store']);
        Route::get('/gateway/intouch/operator', ['as' => 'merchant.gateway.intouch.operator', 'uses' => 'Merchant\GatewayController@intouchOperator']);
        Route::get('/gateway/intouch/operator/create', ['as' => 'merchant.gateway.intouch.operator.add', 'uses' => 'Merchant\GatewayController@intouchOperatorAdd']);
        Route::post('/gateway/intouch/operator/store', ['as' => 'merchant.gateway.intouch.operator.store', 'uses' => 'Merchant\GatewayController@intouchOperatorStore']);
        Route::get('/gateway/intouch/operator/delete/{id}', ['as' => 'merchant.gateway.intouch.operator.delete', 'uses' => 'Merchant\GatewayController@intouchOperatorDelete']);
        Route::get('/gateway/intouch/index', ['as' => 'merchant.gateway.intouch', 'uses' => 'Merchant\GatewayController@intouch']);
        Route::get('/gateway/intouch/create', ['as' => 'merchant.gateway.intouch.create', 'uses' => 'Merchant\GatewayController@intouch_create']);
        Route::post('/gateway/intouch/store', ['as' => 'merchant.gateway.intouch.store', 'uses' => 'Merchant\GatewayController@intouch_store']);
        Route::get('/gateway/intouch/edit/{id}', ['as' => 'merchant.gateway.intouch.edit', 'uses' => 'Merchant\GatewayController@intouch_edit']);
        Route::any('/gateway/intouch/update/{id}', ['as' => 'merchant.gateway.intouch.update', 'uses' => 'Merchant\GatewayController@intouch_update']);
        Route::get('/gateway/intouch/delete/{id}', ['as' => 'merchant.gateway.intouch.delete', 'uses' => 'Merchant\GatewayController@intouch_delete']);
        Route::get('/gateway/sms/twilio', ['as' => 'merchant.gateway.twilio', 'uses' => 'Merchant\GatewayController@twilio']);
        Route::post('/gateway/sms/twilio', ['as' => 'merchant.gateway.twilio.store', 'uses' => 'Merchant\GatewayController@twilio_store']);

        /**Carpooling Segment PriceCard */
        Route::get('/carpooling/pricecard', ['as' => 'carpooling.price_card', 'uses' => 'Merchant\PriceCardController@indexCarpooling']);
        Route::get('/carpooling/price-card/add/{id?}', ['as' => 'carpooling.price_card.add', 'uses' => 'Merchant\PriceCardController@addCarpooling']);
        Route::post('/carpooling/price-card/save/{id?}', ['as' => 'carpooling.price_card.save', 'uses' => 'Merchant\PriceCardController@saveCarpooling']);
        Route::get('/carpooling/price-card/delete/{id}', ['as' => 'carpooling.price_card.delete', 'uses' => 'Merchant\PriceCardController@deleteCarpooling']);

        /**HandyMan Segment Commission */
        Route::get('/segment/commissions', ['as' => 'merchant.segment.commission', 'uses' => 'Segment\HandymanCommissionController@index']);
        Route::get('/segment/commission/add/{id?}', ['as' => 'segment.commission.add', 'uses' => 'Segment\HandymanCommissionController@add']);
        Route::post('/segment/commission/save/{id?}', ['as' => 'segment.commission.save', 'uses' => 'Segment\HandymanCommissionController@save']);
        Route::post('/segment/commission/services', ['as' => 'segment.commission.services', 'uses' => 'Segment\HandymanCommissionController@getSegmentCommissionServices']);

        /*Option*/
        Route::get('/option-type', ['as' => 'merchant.option-type.index', 'uses' => 'Merchant\OptionTypeController@index']);
        Route::get('/option-type/add/{id?}', ['as' => 'merchant.option-type.add', 'uses' => 'Merchant\OptionTypeController@add']);
        Route::get('/option-type/active/deactive/{id}/{status}', ['as' => 'merchant.option-type.active-deactive', 'uses' => 'Merchant\OptionTypeController@ChangeStatus']);
        Route::post('/option-type/save/{id?}', ['as' => 'merchant.option-type.save', 'uses' => 'Merchant\OptionTypeController@save']);
        Route::get('/option-type/delete/{id}', ['as' => 'merchant.option-type.delete', 'uses' => 'Merchant\OptionTypeController@destroy']);

        // merchant's reports
        Route::get('/taxi-services/reports', ['as' => 'merchant.taxi-services-report', 'uses' => 'Merchant\BookingController@taxiServicesEarning']);
        Route::get('/taxi-earning/export', ['as' => 'merchant.taxi.earning.export', 'uses' => 'ExcelController@taxiServicesEarningExport']);
        Route::get('/handyman-services/reports', ['as' => 'merchant.handyman-services-report', 'uses' => 'Merchant\HandymanOrderController@handymanServicesEarning']);
        Route::get('/delivery-services/reports', ['as' => 'merchant.delivery-services-report', 'uses' => 'BusinessSegment\OrderController@orderEarningSummary']);
        Route::get('/delivery-services/export', ['as' => 'merchant.delivery-services-report.export', 'uses' => 'ExcelController@orderEarningSummary']);
        Route::get('/handyman-earning/export', ['as' => 'merchant.handyman-service.earning.export', 'uses' => 'ExcelController@handymanServicesEarningExport']);
        Route::get('/report/referral', ['as' => 'report.referral', 'uses' => 'Merchant\ReferralSystemController@referralReport']);
        Route::get('/report/referral/receiver-details', ['as' => 'report.referral.receiver-details', 'uses' => 'Merchant\ReferralSystemController@getReferralReceiverDetails']);
        Route::get('/report/mis-report', ['as' => 'mis.report', 'uses' => 'Merchant\DashBoardController@misReport']);
        Route::get('/report/subscription-earning', ['as' => 'merchant.order.subscription.earning', 'uses' => 'Merchant\OrderController@MembershipOrderSubscriptionReport']);


        // driver's report
        Route::get('/driver-earning', ['as' => 'merchant.driver.earning', 'uses' => 'Merchant\DriverController@earningSummary']);
        Route::get('/driver-taxi-services/reports', ['as' => 'merchant.driver-taxi-services-report', 'uses' => 'Merchant\DriverController@driverRideEarning']);
        Route::get('/driver-delivery-services/reports', ['as' => 'merchant.driver-delivery-services-report', 'uses' => 'Merchant\DriverController@driverOrderEarning']);
        Route::get('/driver-handyman-services/reports', ['as' => 'merchant.driver-handyman-services-report', 'uses' => 'Merchant\DriverController@driverHandymanServicesEarning']);

        // Wallet Report
        Route::get("/transaction/wallet-recharge/{slug}", ['as' => 'transaction.wallet-report', 'uses' => 'Merchant\TransactionController@walletReport']);
        Route::get("/transaction/wallet-recharge-report", ['as' => 'transaction.wallet-report.export', 'uses' => 'Merchant\TransactionController@walletReportExport']);
        Route::get("/transaction/wallet-balance-report/{slug}", ['as' => 'transaction.wallet-report.balance', 'uses' => 'Merchant\TransactionController@walletBalanceReport']);

        /** Place order from admin panel **/
        Route::get('/place-order/step-one', ['as' => 'merchant.place-order.step-one', 'uses' => 'Merchant\OrderController@stepOne']);

        // Payment Gateway Transactions
        Route::get('/payment_gateway/transactions', ['as' => 'payment.gateway.transactions', 'uses' => 'Merchant\TransactionController@PaymentGatewayTransactions']);
        Route::post('/get/card-details', ['as' => 'merchant.get_card_details', 'uses' => 'Merchant\TransactionController@GetCardDetails']);

        Route::get('/payment-outstanding', ['as' => 'merchant.outstandings', 'uses' => 'Merchant\BookingController@paymentOutstanding']);

        // Driver Agency module
        Route::get('driver-agency', ['as' => 'merchant.driver-agency', 'uses' => 'Merchant\DriverAgencyController@index']);
        Route::get('driver-agency/add/{id?}', ['as' => 'merchant.driver-agency.add', 'uses' => 'Merchant\DriverAgencyController@add']);
        Route::post('driver-agency/save/{id?}', ['as' => 'merchant.driver-agency.save', 'uses' => 'Merchant\DriverAgencyController@save']);
        Route::get('driver-agency/status-update/{id}', 'Merchant\DriverAgencyController@statusUpdate')->name('driver-agency.status');
        Route::post('/driver-agency/add-money', ['as' => 'driver-agency.add-wallet', 'uses' => 'Merchant\DriverAgencyController@AddMoney']);

        Route::get('/driver-agency/wallet/{id}', ['as' => 'merchant.driver-agency.wallet.show', 'uses' => 'Merchant\DriverAgencyController@Wallet']);
        Route::get('/driver-agency/transactions/{id}', ['as' => 'merchant.driver-agency.transactions', 'uses' => 'Merchant\TransactionController@DriverAgencyTransaction']);
        Route::post('/driver-agency/transactions/{id}', ['as' => 'merchant.driver-agency.transactions.search', 'uses' => 'Merchant\TransactionController@TaxiCompanySearch']);

        // drivers of driver-agency
        Route::get('/driver-agency/drivers', ['as' => 'merchant.driver-agency.drivers', 'uses' => 'Merchant\DriverController@getDriverAgencyDrivers']);

        // handyman booking export
        Route::get('/handyman-booking-export', ['as' => 'merchant.handyman-booking-export', 'uses' => 'ExcelController@exportHandymanBookings']);
        Route::get('/handyman-booking-export-xml', ['as' => 'merchant.handyman-booking-export-xml', 'uses' => 'ExcelController@exportHandymanBookingsXml']);
        Route::get('/handyman-booking-export-public-key', ['as' => 'merchant.handyman-booking-export-public-key', 'uses' => 'ExcelController@exportHandymanBookingsPublicKey']);
        Route::get('/handyman-booking-export-private-key', ['as' => 'merchant.handyman-booking-export-private-key', 'uses' => 'ExcelController@exportHandymanBookingsPrivateKey']);

        /*******  BUS BOOKING MODULE ROUTES  ***********/
        /* Bus Booking Segment */
        /**
         * Bus Pickup And Drop Points
         */
        Route::get('/bus-booking/services', ['as' => 'bus_booking.services', 'uses' => 'Merchant\BusServiceController@index']);
        Route::get('/bus-booking/service/add/{id?}', ['as' => 'bus_booking.add_service', 'uses' => 'Merchant\BusServiceController@add']);
        Route::post('/bus-booking/service/save/{id?}', ['as' => 'bus_booking.save_service', 'uses' => 'Merchant\BusServiceController@save']);


        Route::get('/bus-booking/traveller', ['as' => 'bus_booking.traveller', 'uses' => 'Merchant\BusTravellerController@index']);
        Route::get('/bus-booking/traveller/add/{id?}', ['as' => 'bus_booking.add_traveller', 'uses' => 'Merchant\BusTravellerController@add']);
        Route::post('/bus-booking/traveller/save/{id?}', ['as' => 'bus_booking.save_traveller', 'uses' => 'Merchant\BusTravellerController@save']);

        Route::get('/bus-booking/chat-support', ['as' => 'bus_booking.chat-support', 'uses' => 'Merchant\BusChatSupportController@index']);
        Route::get('/bus-booking/chat-support/add/{id?}', ['as' => 'bus_booking.chat-support.add', 'uses' => 'Merchant\BusChatSupportController@add']);
        Route::get('/bus-booking/chat-support/delete/{id}', ['as' => 'bus_booking.delete-chat-support', 'uses' => 'Merchant\BusChatSupportController@destroy']);
        Route::post('/bus-booking/chat-support/save/{id?}', ['as' => 'bus_booking.save_chat-support', 'uses' => 'Merchant\BusChatSupportController@save']);

        /**
         * Bus Pickup And Drop Points
         */
        Route::get('/bus-booking/bus-pickup-drop-points', ['as' => 'bus_booking.bus_pickup_drop_points', 'uses' => 'Merchant\BusPickupDropPointController@index']);
        Route::get('/bus-booking/bus-pickup-drop-point/add/{id?}', ['as' => 'bus_booking.add_bus_pickup_drop_points', 'uses' => 'Merchant\BusPickupDropPointController@add']);
        Route::post('/bus-booking/bus-pickup-drop-point/save/{id?}', ['as' => 'bus_booking.save_bus_pickup_drop_points', 'uses' => 'Merchant\BusPickupDropPointController@save']);

        /**
         * Bus Stops
         */
        Route::get('/bus-booking/stops', ['as' => 'bus_booking.bus_stops', 'uses' => 'Merchant\BusStopController@index']);
        Route::get('/bus-booking/stops/add', ['as' => 'bus_booking.add_bus_stops', 'uses' => 'Merchant\BusStopController@add']);
        Route::post('/bus-booking/stops/save', ['as' => 'bus_booking.save_bus_stops', 'uses' => 'Merchant\BusStopController@save']);
        Route::get('/bus-booking/stops/edit/{id}', ['as' => 'bus_booking.edit_bus_stops', 'uses' => 'Merchant\BusStopController@edit']);
        Route::post('/bus-booking/stops/update/{id}', ['as' => 'bus_booking.update_bus_stops', 'uses' => 'Merchant\BusStopController@update']);

        /**
         * Bus Routes
         */
        Route::get('/bus-booking/bus-routes', ['as' => 'bus_booking.bus_routes', 'uses' => 'Merchant\BusRouteController@index']);
        Route::get('/bus-booking/bus-routes/add/{id?}', ['as' => 'bus_booking.add_bus_routes', 'uses' => 'Merchant\BusRouteController@add']);
        Route::post('/bus-booking/bus-routes/save/{id?}', ['as' => 'bus_booking.save_bus_routes', 'uses' => 'Merchant\BusRouteController@save']);
        Route::get('/bus-booking/bus-route-config/add/{id}', ['as' => 'bus_booking.add_bus_route_config', 'uses' => 'Merchant\BusRouteController@addConfig']);
        Route::post('/bus-booking/bus-route-config/save/{id}', ['as' => 'bus_booking.save_bus_route_config', 'uses' => 'Merchant\BusRouteController@saveConfig']);

        Route::get('/bus-booking/get-stops', ['as' => 'bus_booking.get_bus_stops', 'uses' => 'Merchant\BusStopController@getStops']);

        Route::post('/area/bus-routes/', ['as' => 'get.area.bus_routes', 'uses' => 'Merchant\BusRouteController@getBusRouteByArea']);
        Route::post('/route/bus-stops/', ['as' => 'get.config.bus_stops', 'uses' => 'Merchant\BusRouteController@getBusStopsByRoute']);

        /**
         * Price Card with Route Config
         */
        Route::get('/bus-booking/price-card', ['as' => 'bus_booking.price_card', 'uses' => 'Merchant\BusPriceCardController@index']);
        Route::get('/bus-booking/price-card/add/{id?}', ['as' => 'bus_booking.add_price_card', 'uses' => 'Merchant\BusPriceCardController@add']);
        Route::post('/bus-booking/price-card/save/{id?}', ['as' => 'bus_booking.save_price_card', 'uses' => 'Merchant\BusPriceCardController@save']);

        /**
         * Buses Creation
         */
        Route::get('/bus-booking/buses', ['as' => 'merchant.bus_booking.bus.index', 'uses' => 'Merchant\BusController@index']);
        Route::get('/bus-booking/bus/add/{id?}', ['as' => 'merchant.bus_booking.bus.create', 'uses' => 'Merchant\BusController@add']);
        Route::post('/bus-booking/bus/save/{id?}', ['as' => 'merchant.bus-booking.bus.store', 'uses' => 'Merchant\BusController@save']);
        // vehicle type for bus
        Route::post('/bus-booking/bus/doc-segment', ['as' => 'bus.doc.segment', 'uses' => 'Merchant\BusController@busDocServiceSegment']);
        // vehicle type for bus
        Route::post('/bus-booking/bus/vehicle-type', ['as' => 'bus.vehicle_type', 'uses' => 'Merchant\BusController@VehicleType']);
        Route::get('/bus-booking/bus/show/{id}', ['as' => 'merchant.bus-booking.bus.show', 'uses' => 'Merchant\BusController@show']);
        Route::post('/bus-booking/bus/save-bus-policy', ['as' => 'bus.policy_save', 'uses' => 'Merchant\BusController@busPolicySave']);

        Route::get('/bus-booking/bus/seat-config/{id}', ['as' => 'merchant.bus_booking.bus.seat_config', 'uses' => 'Merchant\BusController@seatConfig']);
        Route::post('/bus-booking/bus/seat-config/{id}', ['as' => 'merchant.bus_booking.bus.seat_config', 'uses' => 'Merchant\BusController@seatConfigSave']);

        /**
         * Buses Route Mapping Creation
         */
        Route::get('/bus-booking/bus-route-mapping', ['as' => 'bus_booking.bus_route_mapping', 'uses' => 'Merchant\BusRouteMappingController@index']);
        Route::get('/bus-booking/bus-route-mapping/add/{bus_route_id?}/{bus_id?}', ['as' => 'bus_booking.bus_route_mapping.create', 'uses' => 'Merchant\BusRouteMappingController@add']);
        Route::post('/bus-booking/bus-route-mapping/save/{bus_route_id?}/{bus_id?}', ['as' => 'bus_booking.bus_route_mapping.save', 'uses' => 'Merchant\BusRouteMappingController@save']);
        Route::post('/bus-booking/route/buses', ['as' => 'get.route.buses', 'uses' => 'Merchant\BusRouteMappingController@routeBuses']);

        /**
         * Driver Bus Mapping Creation
         */
        Route::get('/bus-booking/bus-driver-mapping', ['as' => 'bus_booking.bus_driver_mapping', 'uses' => 'Merchant\BusDriverMappingController@index']);
        Route::get('/bus-booking/bus-driver-mapping/add/{bus_route_id?}/{bus_id?}/{driver_id?}', ['as' => 'bus_booking.bus_driver_mapping.create', 'uses' => 'Merchant\BusDriverMappingController@add']);
        Route::post('/bus-booking/bus-driver-mapping/save/{bus_route_id?}/{bus_id?}', ['as' => 'bus_booking.bus_driver_mapping.save', 'uses' => 'Merchant\BusDriverMappingController@save']);
        Route::post('/bus-booking/get-drivers', ['as' => 'get.bus_booking.drivers', 'uses' => 'Merchant\BusDriverMappingController@getDrivers']);
        Route::post('/bus-booking/get-bus-route-bus-timeslot', ['as' => 'get.bus_route_bus_timeslot', 'uses' => 'Merchant\BusDriverMappingController@getBusRouteBusTimeSlot']);
        Route::post('/bus-booking/bus-driver-mapping/delete', ['as' => 'bus_booking.bus_driver_mapping.delete', 'uses' => 'Merchant\BusDriverMappingController@delete']);

        /**
         * Master Bus Bookings
         */
        Route::get("/bus-booking/master-bus-bookings", ['as'=>'bus_booking_master', 'uses' => 'Merchant\BusBookingController@getMasterBookings']);
        Route::get("/bus-booking/master-bus-bookings/{id}", ['as'=>'bus_booking_booking', 'uses' => 'Merchant\BusBookingController@getBusBooking']);


        Route::get('/bus-booking/active', ['as' => 'merchant.bus_booking.active.index', 'uses' => 'Merchant\BusBookingController@index']);
        Route::get('/bus-booking/detail/{id}', ['as' => 'merchant.bus_booking.detail', 'uses' => 'Merchant\BusBookingController@details']);
        Route::get('/bus-booking/active/auto-assign', ['as' => 'merchant.bus_booking.active.auto-assign', 'uses' => 'Merchant\BusBookingController@autoAssign']);
        Route::post('/bus-booking/active/manual-assign', ['as' => 'merchant.bus_booking.active.manual-assign', 'uses' => 'Merchant\BusBookingController@manualAssign']);
        Route::post('/bus-booking/active/cancel-booking', ['as' => 'merchant.bus_booking.active.cancel-booking', 'uses' => 'Merchant\BusBookingController@cancelBooking']);
        Route::get('/bus-booking/past', ['as' => 'merchant.bus_booking.past.index', 'uses' => 'Merchant\BusBookingController@pastBookings']);

        Route::get('/bus-booking/configuration', ['as' => 'merchant.bus_booking.configuration', 'uses' => 'Merchant\BusConfigController@index']);
        Route::post('/bus-booking/configuration', ['as' => 'merchant.bus_booking.configuration', 'uses' => 'Merchant\BusConfigController@save']);

        //customer Rating module
        Route::get('/bus-booking/rating', ['as' =>'merchant.bus_booking.rating.index','uses' =>  'Merchant\BusBookingController@bookingRatings']);
        Route::post('/bus-booking/add_provider_comment', ['as' =>'merchant.bus_booking.add_provider_comment','uses' =>  'Merchant\BusBookingController@addProviderComment']);

        //FAQ Module
        Route::get('/merchant/faq_types', ['as' => 'merchant.faq_types', 'uses' => 'Merchant\FaqTypeController@index']);
        Route::get('/merchant/faq_type/add/{id?}', ['as' => 'merchant.faq_type.create', 'uses' => 'Merchant\FaqTypeController@create']);
        Route::post('/merchant/faq_type/save/{id?}', ['as' => 'merchant.faq_type.save', 'uses' => 'Merchant\FaqTypeController@save']);
        Route::get('merchant/faq_type/change-status/{id}/{status}','Merchant\FaqTypeController@ChangeStatus')->name('merchant.faq_type.change_status');

        Route::get('/merchant/faq', ['as' => 'merchant.faq', 'uses' => 'Merchant\FaqController@index']);
        Route::get('/merchant/faq/add/{id?}', ['as' => 'merchant.faq.create', 'uses' => 'Merchant\FaqController@create']);
        Route::post('/merchant/faq/save/{id?}', ['as' => 'merchant.faq.save', 'uses' => 'Merchant\FaqController@save']);
        Route::get('merchant/faq/change-status/{id}/{status}','Merchant\FaqController@ChangeStatus')->name('merchant.faq.change_status');

        /**
         * Route Configuration with area & vehicle type
         */
//        Route::get('/bus-booking/route-config', ['as' => 'bus_booking.route_config', 'uses' => 'Merchant\RouteConfigController@index']);
//        Route::get('/bus-booking/route-confgi/add/{id?}', ['as' => 'bus_booking.add_route_config', 'uses' => 'Merchant\RouteConfigController@add']);
//        Route::post('/bus-booking/route-config/save/{id?}', ['as' => 'bus_booking.save_route_config', 'uses' => 'Merchant\RouteConfigController@save']);
//        Route::post('/route/route-config/', ['as' => 'get.route_config_area', 'uses' => 'Merchant\RouteConfigController@getRouteConfigByArea']);

          /**Bus driver module start **/
        // get drivers
//        Route::get('/bus-drivers', ['as' => 'bus.driver.index', 'uses' => 'Merchant\BusDriverController@index']);
        //        Route::get('/driver/search', ['as' => 'merchant.driver.search', 'uses' => 'Merchant\DriverController@index']);
        // add driver
//        Route::get('/bus-driver/add/{id?}', ['as' => 'bus.driver.add', 'uses' => 'Merchant\BusDriverController@add']);
        // // get driver
        // Route::post('/driver/personal-document', ['as' => 'merchant.driver.country-area-document', 'uses' => 'Merchant\DriverController@getPersonalDocument']);
        // // save driver
//        Route::post('/bus-driver/save/{id?}', ['as' => 'bus.driver.save', 'uses' => 'Merchant\BusDriverController@save']);
        // // view driver
//        Route::get('/bus-driver/profile/{id}', ['as' => 'bus.driver.show', 'uses' => 'Merchant\BusDriverController@show']);


        /*******  END - BUS BOOKING MODULE ROUTES  ***********/

        // Pricecard Slabs
        Route::get('/price-card/slabs', ['as' => 'merchant.pricecard.slabs', 'uses' => 'Merchant\PriceCardSlabController@index']);
        Route::get('/price-card/slab/add/{id?}', ['as' => 'merchant.pricecard.slab.add', 'uses' => 'Merchant\PriceCardSlabController@add']);
        Route::post('/price-card/slabs/save/{id?}', ['as' => 'merchant.pricecard.slab.save', 'uses' => 'Merchant\PriceCardSlabController@save']);

        /**
         * Job management Module
         */
        Route::get('/jobs', ['as' => 'merchant.jobs.index', 'uses' => 'Merchant\JobVacancyController@index']);
        Route::get('/jobs/add/{id?}', ['as' => 'merchant.jobs.add', 'uses' => 'Merchant\JobVacancyController@add']);
        Route::post('/jobs/save/{id?}', ['as' => 'merchant.jobs.save', 'uses' => 'Merchant\JobVacancyController@save']);
        Route::get('/jobs/delete/{id?}', ['as' => 'merchant.jobs.delete', 'uses' => 'Merchant\JobVacancyController@destroy']);
        Route::get('/applied/jobs', ['as' => 'merchant.applied.jobs', 'uses' => 'Merchant\JobVacancyController@appliedJobs']);

        /**
         * Cancel Policy of Merchant while cancelling service like ride, order and booking by user, driver or business segment or merchant
         * This module is starting with driver config, later will merge user, business segment or merchant policy in this as well
         */
        Route::get('/cancel-policy', ['as' => 'cancel.policies', 'uses' => 'Merchant\CancelPolicyController@index']);
        Route::get('/cancel-policy/add/{id?}', ['as' => 'cancel.policy.create', 'uses' => 'Merchant\CancelPolicyController@create']);
        Route::post('/cancel-policy/save/{id?}', ['as' => 'cancel.policy.store', 'uses' => 'Merchant\CancelPolicyController@store']);
        Route::get('/cancel-policy/changeStatus/{id}/{status}', ['as' => 'cancel.policy.change-status', 'uses' => 'Merchant\CancelPolicyController@changeStatus']);
        Route::post('/cancel-policy/delete', ['as' => 'cancel.policy.delete', 'uses' => 'Merchant\CancelPolicyController@delete']);

        //Map Marker icon routes
        Route::get('/map-markers',['as' => 'merchant.map.marker', 'uses' => 'Merchant\MapController@MapMarker']);
        Route::post('/map-markers/{id?}',['as' => 'merchant.add.map.marker', 'uses' => 'Merchant\MapController@SaveMapMarker']);

        //handyman( dispute request, service providers with low balence)
        Route::post('/handyman/order/action/dispute', ['as' => 'order.dispute.action', 'uses' => 'Merchant\HandymanOrderController@disputeOrder']);
        Route::get('/low-balence-service-providers', ['as' => 'service-provider.low-balence', 'uses' => 'Merchant\HandymanOrderController@lowBalenceServiceProviders']);

        // wallet recharge request by user or driver
        Route::get('/wallet-recharge-requests', ['as' => 'wallet.recharge.requests', 'uses' => 'Merchant\DashBoardController@walleRechargeRequests']);

        //sos request version 2
        Route::get('/all-sos-requests', ['as' => 'merchant.sos.requests.v2', 'uses' => 'Merchant\SosController@SosRequestV2']);
        Route::get('/sos/change/status/{id}/{status}', ['as' => 'merchant.sos.v2.status', 'uses' => 'Merchant\SosController@ChangeRequestStatus']);
        Route::get('/all-sos-requests/search', ['as' => 'merchant.all.sos.search', 'uses' => 'Merchant\SosController@SercahSosRequestV2']);


    });
});