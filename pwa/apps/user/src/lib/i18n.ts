export type TranslationKey =
  | 'app.tagline'
  | 'common.loading'
  | 'common.retry'
  | 'common.back'
  | 'common.menu'
  | 'common.seconds'
  | 'splash.fallbackTitle'
  | 'splash.offline'
  | 'install.title'
  | 'install.cta'
  | 'install.installed'
  | 'install.android'
  | 'install.ios'
  | 'install.iosSteps'
  | 'install.dismiss'
  | 'offline.title'
  | 'offline.message'
  | 'offline.reload'
  | 'devStatus.title'
  | 'devStatus.lastChecked'
  | 'devStatus.endpoint'
  | 'devStatus.environment'
  | 'devStatus.capabilities'
  | 'devStatus.runtime'
  | 'login.title'
  | 'login.phone'
  | 'login.continue'
  | 'login.phaseNote'
  | 'onboard.welcome'
  | 'onboard.subtitle'
  | 'onboard.language'
  | 'onboard.createAccount'
  | 'onboard.skip'
  | 'onboard.next'
  | 'onboard.done'
  | 'onboard.slide1Title'
  | 'onboard.slide1Body'
  | 'onboard.slide2Title'
  | 'onboard.slide2Body'
  | 'onboard.slide3Title'
  | 'onboard.slide3Body'
  | 'auth.loading'
  | 'auth.phone'
  | 'auth.phoneCode'
  | 'auth.searchCountry'
  | 'auth.email'
  | 'auth.password'
  | 'auth.confirmPassword'
  | 'auth.firstName'
  | 'auth.lastName'
  | 'auth.gender'
  | 'auth.male'
  | 'auth.female'
  | 'auth.smoker'
  | 'auth.smokerYes'
  | 'auth.smokerNo'
  | 'auth.referralCode'
  | 'auth.networkCode'
  | 'auth.cpf'
  | 'auth.otp'
  | 'auth.otpHint'
  | 'auth.resendCode'
  | 'auth.changeNumber'
  | 'auth.loginTitle'
  | 'auth.loginSubtitle'
  | 'auth.signupTitle'
  | 'auth.signupSubtitle'
  | 'auth.forgotTitle'
  | 'auth.forgotSubtitle'
  | 'auth.continue'
  | 'auth.signIn'
  | 'auth.signUp'
  | 'auth.sendCode'
  | 'auth.register'
  | 'auth.verify'
  | 'auth.forgotLink'
  | 'auth.newHere'
  | 'auth.haveAccount'
  | 'auth.alreadyHaveAccount'
  | 'auth.backToLogin'
  | 'auth.firstNameRequired'
  | 'auth.smokerRequired'
  | 'auth.cpfRequired'
  | 'auth.networkCodeRequired'
  | 'auth.referralCodeRequired'
  | 'auth.orContinueWith'
  | 'auth.socialGoogle'
  | 'auth.socialFacebook'
  | 'auth.guest'
  | 'auth.sessionExpired'
  | 'auth.phoneRequired'
  | 'auth.phoneInvalid'
  | 'auth.otpRequired'
  | 'auth.passwordTooShort'
  | 'auth.passwordMismatch'
  | 'auth.somethingWentWrong'
  | 'auth.invalidEmail'
  | 'home.welcome'
  | 'home.guest'
  | 'home.signedInAs'
  | 'home.wallet'
  | 'home.services'
  | 'home.logout'
  | 'home.signIn'
  | 'cms.title'
  | 'cms.notFound'
  | 'cms.loadFailed'
  | 'signup.subtitle'
  | 'signup.firstName'
  | 'signup.lastName'
  | 'signup.gender'
  | 'signup.genderMale'
  | 'signup.genderFemale'
  | 'signup.smoker'
  | 'signup.nonSmoker'
  | 'signup.confirmPassword'
  | 'signup.optional'
  | 'forgot.title'
  | 'forgot.subtitle'
  | 'forgot.newPassword'
  | 'forgot.confirmPassword'
  | 'forgot.resetButton'
  | 'home.title'
  | 'home.noContact'
  | 'home.location'
  | 'home.detectLocation'
  | 'home.searchPlaceholder'
  | 'home.searchPlaces'
  | 'home.chooseArea'
  | 'home.currentLocation'
  | 'home.useCurrentLocation'
  | 'home.locationDenied'
  | 'home.locationUnavailable'
  | 'home.selectCity'
  | 'home.noResults'
  | 'home.allServices'
  | 'home.viewAll'
  | 'home.comingSoon'
  | 'home.addMoney'
  | 'home.addMoneyCta'
  | 'home.recommended'
  | 'home.popularStores'
  | 'home.popularRestaurants'
  | 'home.popularPharmacies'
  | 'home.popularLaundries'
  | 'home.banners'
  | 'home.open'
  | 'home.closed'
  | 'home.km'
  | 'home.min'
  | 'home.favourite'
  | 'home.notifications'
  | 'home.empty'
  | 'home.emptyMessage'
  | 'home.noServiceTitle'
  | 'home.noServiceMessage'
  | 'home.noServiceAction'
  | 'home.loadFailed'
  | 'home.pullToRefresh'
  | 'home.offlineCache'
  | 'home.drawer'
  | 'home.drawerHeader'
  | 'home.drawerItems'
  | 'home.logout'
  | 'notifications.title'
  | 'notifications.empty'
  | 'drawer.close'
  | 'drawer.logout'
  | 'drawer.logoutConfirm'
  | 'wallet.title'
  | 'wallet.balance'
  | 'wallet.unavailable'
| 'store.title'
| 'store.placeholder'
| 'store.bannerPlaceholder'
| 'ride.title'
| 'ride.back'
| 'ride.pickup'
| 'ride.drop'
| 'ride.dropOff'
| 'ride.whereTo'
| 'ride.selectDrop'
| 'ride.searchPlaceholder'
| 'ride.currentLocation'
| 'ride.vehicles'
| 'ride.selectVehicle'
| 'ride.driver'
| 'ride.nearbyDrivers'
| 'ride.driversOnMap'
| 'ride.estimateFare'
| 'ride.eta'
| 'ride.chooseRide'
| 'ride.continue'
| 'ride.confirm'
| 'ride.requestRide'
| 'ride.checkout'
| 'ride.fareSummary'
| 'ride.payment'
| 'ride.paymentMethod'
| 'ride.cash'
| 'ride.wallet'
| 'ride.card'
| 'ride.promo'
| 'ride.applyPromo'
| 'ride.promoPlaceholder'
| 'ride.removePromo'
| 'ride.addNotes'
| 'ride.notesPlaceholder'
| 'ride.babySeat'
| 'ride.wheelChair'
| 'ride.genderMatch'
| 'ride.noSeatCheck'
| 'ride.searching'
| 'ride.searchingForDriver'
| 'ride.cancelSearch'
| 'ride.driverAssigned'
| 'ride.driverArriving'
| 'ride.tripStarted'
| 'ride.tripInProgress'
| 'ride.driverEnRoute'
| 'ride.otp'
| 'ride.otpReady'
| 'ride.otpHint'
| 'ride.call'
| 'ride.chat'
| 'ride.sos'
| 'ride.sosTitle'
| 'ride.share'
| 'ride.cancel'
| 'ride.cancelRide'
| 'ride.cancelReasons'
| 'ride.selectReason'
| 'ride.cancelCharges'
| 'ride.changeDrop'
| 'ride.showOtp'
| 'ride.enRoute'
| 'ride.arriving'
| 'ride.confirmOtp'
| 'ride.rideComplete'
| 'ride.receipt'
| 'ride.paymentReceived'
| 'ride.rateDriver'
| 'ride.rateTitle'
| 'ride.rateSubtitle'
| 'ride.addComment'
| 'ride.commentPlaceholder'
| 'ride.submit'
| 'ride.tip'
| 'ride.tipDriver'
| 'ride.tipAmount'
| 'ride.thanks'
| 'ride.errSignedIn'
| 'ride.errNetwork'
| 'ride.errPickupDrop'
| 'ride.errCheckout'
| 'ride.errPayment'
| 'ride.errPromo'
| 'ride.errConfirm'
| 'ride.errCancel'
| 'ride.errRate'
| 'ride.errTip'
| 'ride.loading'
| 'ride.retry'
| 'ride.stops'
| 'ride.addStop'
| 'ride.otpRequired'
  | 'ride.noVehicles'
  | 'ride.noDrivers'
  | 'ride.rideNow'
  | 'ride.scheduleLater'
  | 'ride.laterDate'
  | 'ride.laterTime'
  | 'ride.chooseDate'
  | 'ride.chooseTime'
  | 'ride.scheduledTitle'
  | 'ride.scheduledConfirmation'
  | 'ride.scheduledFor'
  | 'ride.pendingRides'
  | 'ride.noPendingRides'
  | 'ride.scheduleAnother'
  | 'ride.done'
  | 'ride.errLaterFields'
  | 'ride.variantTaxi'
  | 'ride.variantRental'
  | 'ride.rentalHeading'
  | 'ride.rentalSubtitle'
  | 'ride.rentalChoosePackage'
  | 'ride.rentalSelect'
  | 'ride.errRentalVehicle'
  | 'ride.errRentalPackage'
  | 'ride.variantOutstation'
  | 'ride.outstationHeading'
  | 'ride.outstationSubtitle'
  | 'ride.outstationOneWay'
  | 'ride.outstationRoundTrip'
  | 'ride.outstationContinue'
  | 'ride.errOutstationVehicle'
  | 'ride.errOutstationReturn'
  | 'ride.rentalContinue'
  | 'ride.variantTransfer'
  | 'ride.transferHeading'
  | 'ride.transferSubtitle'
  | 'ride.transferChoosePackage'
  | 'ride.transferContinue'
  | 'ride.errTransferVehicle'
  | 'ride.errTransferPackage'
  | 'ride.variantPool'
  | 'ride.poolHeading'
  | 'ride.poolSubtitle'
  | 'ride.poolSeats'
  | 'ride.poolRiders'
  | 'ride.poolContinue'
  | 'ride.errPoolVehicle'
  | 'ride.errPoolSeats'
  | 'delivery.title'
  | 'delivery.back'
  | 'delivery.subtitle'
  | 'delivery.choosePackage'
  | 'delivery.packageWeight'
  | 'delivery.packageSize'
  | 'delivery.selectPackage'
  | 'delivery.chooseCategory'
  | 'delivery.chooseProduct'
  | 'delivery.productPrice'
  | 'delivery.chooseVehicle'
  | 'delivery.vehicleCapacity'
  | 'delivery.selectVehicle'
  | 'delivery.pickup'
  | 'delivery.pickupPlaceholder'
  | 'delivery.dropPoints'
  | 'delivery.dropLocation'
  | 'delivery.contactName'
  | 'delivery.contactPhone'
  | 'delivery.instruction'
  | 'delivery.addStop'
  | 'delivery.removeStop'
  | 'delivery.continue'
  | 'delivery.estimateFare'
  | 'delivery.fareSummary'
  | 'delivery.payment'
  | 'delivery.cash'
  | 'delivery.wallet'
  | 'delivery.confirm'
  | 'delivery.confirmedTitle'
  | 'delivery.successMessage'
  | 'delivery.done'
  | 'delivery.errNetwork'
  | 'delivery.errCheckout'
  | 'delivery.errConfirm'
  | 'delivery.loading'
  | 'delivery.errPackage'
  | 'delivery.errProduct'
  | 'delivery.errVehicle'
  | 'delivery.errDrop'
  | 'delivery.exploreServices'
  | 'food.title'
  | 'food.subtitle'
  | 'food.popularRestaurants'
  | 'food.allRestaurants'
  | 'food.open'
  | 'food.closed'
  | 'food.min'
  | 'food.km'
  | 'food.minimumOrder'
  | 'food.deliveryFee'
  | 'food.free'
  | 'food.menu'
  | 'food.categories'
  | 'food.popularItems'
  | 'food.add'
  | 'food.added'
  | 'food.customise'
  | 'food.variant'
  | 'food.options'
  | 'food.quantity'
  | 'food.cart'
  | 'food.cartEmpty'
  | 'food.cartEmptyMessage'
  | 'food.checkout'
  | 'food.subtotal'
  | 'food.delivery'
  | 'food.tax'
  | 'food.discount'
  | 'food.promoPlaceholder'
  | 'food.apply'
  | 'food.promoApplied'
  | 'food.promoInvalid'
  | 'food.payment'
  | 'food.cash'
  | 'food.wallet'
  | 'food.deliveryMode'
  | 'food.deliverHome'
  | 'food.selfPickup'
  | 'food.address'
  | 'food.addressPlaceholder'
  | 'food.placeOrder'
  | 'food.orderPlaced'
  | 'food.orderPlacedMessage'
  | 'food.trackOrder'
  | 'food.placed'
  | 'food.inProcess'
  | 'food.driverAccepted'
  | 'food.outForDelivery'
  | 'food.delivered'
  | 'food.estimatedArrival'
  | 'food.arrivingIn'
  | 'food.cancelOrder'
  | 'food.cancelled'
  | 'food.myOrders'
  | 'food.active'
  | 'food.past'
  | 'food.orderNumber'
  | 'food.reorder'
  | 'food.rate'
  | 'food.rateTitle'
  | 'food.ratePlaceholder'
  | 'food.submitRating'
  | 'food.chat'
  | 'food.chatPlaceholder'
  | 'food.send'
  | 'food.chatTitle'
  | 'food.noOrders'
  | 'food.noOrdersMessage'
  | 'food.browseRestaurants'
  | 'food.loading'
  | 'food.errStore'
  | 'food.errMenu'
  | 'food.errCart'
  | 'food.errCheckout'
  | 'food.star'
  | 'food.stars'
  | 'food.veg'
  | 'food.nonVeg'
  | 'food.todayClosed'
  | 'food.closedMessage'
  | 'store.title'
  | 'store.subtitle'
  | 'store.stores'
  | 'store.open'
  | 'store.closed'
  | 'store.min'
  | 'store.deliveryFee'
  | 'store.free'
  | 'store.minimumOrder'
  | 'store.categories'
  | 'store.aisles'
  | 'store.search'
  | 'store.searchPlaceholder'
  | 'store.noResults'
  | 'store.add'
  | 'store.added'
  | 'store.customise'
  | 'store.variant'
  | 'store.options'
  | 'store.quantity'
  | 'store.weight'
  | 'store.cart'
  | 'store.cartEmpty'
  | 'store.cartEmptyMessage'
  | 'store.browseStores'
  | 'store.checkout'
  | 'store.subtotal'
  | 'store.delivery'
  | 'store.tax'
  | 'store.discount'
  | 'store.promoPlaceholder'
  | 'store.apply'
  | 'store.promoApplied'
  | 'store.promoInvalid'
  | 'store.payment'
  | 'store.cash'
  | 'store.wallet'
  | 'store.deliveryMode'
  | 'store.deliverHome'
  | 'store.selfPickup'
  | 'store.address'
  | 'store.addressPlaceholder'
  | 'store.timeSlot'
  | 'store.timeSlotHint'
  | 'store.noSlots'
  | 'store.prescription'
  | 'store.prescriptionHint'
  | 'store.upload'
  | 'store.uploaded'
  | 'store.prescriptionRequired'
  | 'store.placeOrder'
  | 'store.orderPlaced'
  | 'store.trackOrder'
  | 'store.placed'
  | 'store.inProcess'
  | 'store.driverAccepted'
  | 'store.outForDelivery'
  | 'store.delivered'
  | 'store.cancelOrder'
  | 'store.cancelled'
  | 'store.myOrders'
  | 'store.active'
  | 'store.past'
  | 'store.orderNumber'
  | 'store.reorder'
  | 'store.rate'
  | 'store.rateTitle'
  | 'store.ratePlaceholder'
  | 'store.submitRating'
  | 'store.chat'
  | 'store.chatTitle'
  | 'store.chatPlaceholder'
  | 'store.send'
  | 'store.noOrders'
  | 'store.noOrdersMessage'
  | 'store.items'
  | 'store.loading'
  | 'store.errStore'
  | 'store.errMenu'
  | 'store.errCart'
  | 'store.errCheckout'
  | 'store.todayClosed'
  | 'store.closedMessage'
  | 'handyman.home'
  | 'handyman.available'
  | 'handyman.bookNow'
  | 'handyman.findHandymen'
  | 'handyman.selectProvider'
  | 'handyman.bookHim'
  | 'handyman.cart'
  | 'handyman.cartEmpty'
  | 'handyman.cartEmptyMsg'
  | 'handyman.checkout'
  | 'handyman.confirmBooking'
  | 'handyman.myBookings'
  | 'handyman.trackOrder'
  | 'handyman.rateProvider'
  | 'handyman.rateProviderTitle'
  | 'handyman.workRequests'
  | 'handyman.postRequest'
  | 'handyman.cancelRequest'
  | 'handyman.deleteRequest'
  | 'handyman.fromPrice'
  | 'handyman.bids'
  | 'handyman.accept'
  | 'handyman.counter'
  | 'handyman.address'
  | 'laundry.home'
  | 'laundry.popular'
  | 'laundry.outlets'
  | 'laundry.viewOutlet'
  | 'laundry.services'
  | 'laundry.add'
  | 'laundry.subtract'
  | 'laundry.cart'
  | 'laundry.cartEmpty'
  | 'laundry.cartEmptyMsg'
  | 'laundry.pickup'
  | 'laundry.homeDelivery'
  | 'laundry.selfPickup'
  | 'laundry.dropLocation'
  | 'laundry.selectSlot'
  | 'laundry.checkout'
  | 'laundry.promoCode'
  | 'laundry.applyPromo'
  | 'laundry.placeOrder'
  | 'laundry.myOrders'
  | 'laundry.ongoing'
  | 'laundry.past'
  | 'laundry.trackOrder'
  | 'laundry.otpTitle'
  | 'laundry.otpHint'
  | 'laundry.verifyOtp'
  | 'laundry.cancelOrder'
  | 'laundry.rateOutlet'
  | 'laundry.deliveryCharges'
  | 'laundry.tax'
  | 'laundry.discount'
  | 'laundry.toPay'
  | 'laundry.itemsCount'
  | 'laundry.estimateDelivery'
  | 'bus.home'
  | 'bus.searchTitle'
  | 'bus.fromLocation'
  | 'bus.toLocation'
  | 'bus.search'
  | 'bus.searching'
  | 'bus.routeResults'
  | 'bus.noRoutes'
  | 'bus.selectRoute'
  | 'bus.selectBoard'
  | 'bus.selectDrop'
  | 'bus.board'
  | 'bus.drop'
  | 'bus.availableBuses'
  | 'bus.noBuses'
  | 'bus.seatMap'
  | 'bus.selectSeats'
  | 'bus.available'
  | 'bus.booked'
  | 'bus.selected'
  | 'bus.checkout'
  | 'bus.paymentMethod'
  | 'bus.confirmBooking'
  | 'bus.bookingConfirmed'
  | 'bus.myBookings'
  | 'bus.upcoming'
  | 'bus.past'
  | 'bus.noBookings'
  | 'bus.bookingDetail'
  | 'bus.seatNumbers'
  | 'bus.seatCount'
  | 'bus.cancelBooking'
  | 'bus.totalSeats'
  | 'bus.departure'
  | 'bus.arrival'
  | 'bus.price'
  | 'bus.seatsSelected'
  | 'bus.routes'
  | 'bus.perSeat'
  | 'carpool.home'
  | 'carpool.searchTitle'
  | 'carpool.search'
  | 'carpool.searching'
  | 'carpool.noRides'
  | 'carpool.availableRides'
  | 'carpool.offerRide'
  | 'carpool.offer'
  | 'carpool.bookRide'
  | 'carpool.book'
  | 'carpool.seats'
  | 'carpool.perSeat'
  | 'carpool.driver'
  | 'carpool.vehicle'
  | 'carpool.myRides'
  | 'carpool.offeredRides'
  | 'carpool.takenRides'
  | 'carpool.noOffered'
  | 'carpool.noTaken'
  | 'carpool.rideDetail'
  | 'carpool.cancelRide'
  | 'carpool.cancelOffer'
  | 'carpool.rideDate'
  | 'carpool.totalAmount'
  | 'carpool.availableSeats'
  | 'carpool.selectSeats'
  | 'carpool.confirmBooking'
  | 'carpool.bookingConfirmed'
  | 'carpool.vehicleMake'
  | 'carpool.vehicleModel'
  | 'carpool.vehicleColor'
  | 'carpool.vehicleNumber'
  | 'carpool.routePoints'
  | 'carpool.dropNo'
  | 'carpool.distance'
  | 'carpool.finalCharges'
  | 'carpool.passenger'
  | 'carpool.paymentAction'
  | 'carpool.paymentAction1'
  | 'carpool.paymentAction2'
  | 'carpool.paymentAction3'
  | 'carpool.dashboard'
  | 'carpool.offerTitle'
  | 'carpool.offerSubtitle'
  | 'carpool.offerVehicle'
  | 'carpool.offerSeats'
  | 'carpool.offerDateTime'
  | 'carpool.offerStart'
  | 'carpool.offerEnd'
  | 'carpool.addRoutePoint'
  | 'carpool.submitOffer'
  | 'carpool.offerSuccess'
  | 'account.title'
  | 'account.editProfile'
  | 'account.profileSaved'
  | 'account.firstName'
  | 'account.lastName'
  | 'account.email'
  | 'account.phone'
  | 'account.gender'
  | 'account.save'
  | 'account.changePassword'
  | 'account.currentPassword'
  | 'account.newPassword'
  | 'account.confirmNewPassword'
  | 'account.passwordChanged'
  | 'account.passwordMismatch'
  | 'account.documents'
  | 'account.documentsEmpty'
  | 'account.documentNumber'
  | 'account.expiryDate'
  | 'account.documentStatusApproved'
  | 'account.documentStatusPending'
  | 'account.addDocument'
  | 'account.deleteAccount'
  | 'account.deleteAccountConfirm'
  | 'account.reason'
  | 'account.delete'
  | 'account.cancel'
  | 'account.accountDeleted'
  | 'account.referralCode'
  | 'account.memberSince'
  | 'account.edit'
  | 'account.phoneCode'
  | 'account.required'
  | 'wallet.title'
  | 'wallet.balance'
  | 'wallet.unavailable'
  | 'wallet.transactions'
  | 'wallet.credit'
  | 'wallet.debit'
  | 'wallet.cashback'
  | 'wallet.transferred'
  | 'wallet.addMoney'
  | 'wallet.amount'
  | 'wallet.paymentOption'
  | 'wallet.cash'
  | 'wallet.moneyAdded'
  | 'wallet.addMoneyNote'
  | 'wallet.transfer'
  | 'wallet.transferTo'
  | 'wallet.searchUser'
  | 'wallet.searchUserPlaceholder'
  | 'wallet.userNotFound'
  | 'wallet.userFound'
  | 'wallet.amountToTransfer'
  | 'wallet.transferSuccess'
  | 'wallet.insufficientBalance'
  | 'wallet.cashout'
  | 'wallet.cashoutRequest'
  | 'wallet.cashoutHistory'
  | 'wallet.cashoutMethod'
  | 'wallet.accountNumber'
  | 'wallet.cashoutSuccess'
  | 'wallet.cashoutEmpty'
  | 'wallet.empty'
  | 'wallet.noTransactions'
  | 'history.title'
  | 'history.active'
  | 'history.past'
  | 'history.all'
  | 'history.ride'
  | 'history.delivery'
  | 'history.empty'
  | 'history.bookingDetails'
  | 'history.status'
  | 'history.driverName'
  | 'history.vehicle'
  | 'history.pickup'
  | 'history.drop'
  | 'history.date'
  | 'history.amount'
  | 'history.cancelled'
  | 'history.completed'
  | 'history.ongoing'
  | 'sos.title'
  | 'sos.contacts'
  | 'sos.addContact'
  | 'sos.name'
  | 'sos.number'
  | 'sos.add'
  | 'sos.contactAdded'
  | 'sos.contactDeleted'
  | 'sos.confirmDelete'
  | 'sos.empty'
  | 'sos.emergency'
  | 'sos.family'
  | 'sos.request'
  | 'sos.requestConfirm'
  | 'sos.requestSent'
  | 'sos.sent'
  | 'favourites.title'
  | 'favourites.drivers'
  | 'favourites.locations'
  | 'favourites.stores'
  | 'favourites.empty'
  | 'favourites.noDrivers'
  | 'favourites.noLocations'
  | 'favourites.remove'
  | 'favourites.added'
  | 'favourites.removed'
  | 'favourites.locationName'
  | 'favourites.address'
  | 'favourites.save'
  | 'favourites.locationAdded'
  | 'favourites.locationDeleted'
  | 'family.title'
  | 'family.addMember'
  | 'family.name'
  | 'family.phone'
  | 'family.relationship'
  | 'family.memberAdded'
  | 'family.memberDeleted'
  | 'family.empty'
  | 'family.confirmDelete'
  | 'referral.title'
  | 'referral.heading'
  | 'referral.explanation'
  | 'referral.yourCode'
  | 'referral.share'
  | 'referral.copy'
  | 'referral.codeCopied'
  | 'referral.shareText'
  | 'referral.inactive'
  | 'rewards.title'
  | 'rewards.points'
  | 'rewards.home'
  | 'rewards.redeem'
  | 'rewards.redeemPoints'
  | 'rewards.pointsToRedeem'
  | 'rewards.redeemed'
  | 'rewards.gifts'
  | 'rewards.giftRedeemed'
  | 'rewards.history'
  | 'rewards.empty'
  | 'rewards.notEnough'
  | 'subscriptions.title'
  | 'subscriptions.packages'
  | 'subscriptions.active'
  | 'subscriptions.price'
  | 'subscriptions.duration'
  | 'subscriptions.activate'
  | 'subscriptions.activated'
  | 'subscriptions.history'
  | 'subscriptions.empty'
  | 'subscriptions.noActive'
  | 'chat.title'
  | 'chat.placeholder'
  | 'chat.send'
  | 'chat.empty'
  | 'chat.you'
  | 'support.title'
  | 'support.name'
  | 'support.email'
  | 'support.phone'
  | 'support.message'
  | 'support.subject'
  | 'support.send'
  | 'support.sent'
  | 'support.channels'
  | 'cards.title'
  | 'cards.empty'
  | 'cards.addCard'
  | 'cards.deleteConfirm'
  | 'cards.deleted'
  | 'cards.default'
  | 'cards.displayOnly'
  | 'pricecard.title'
  | 'pricecard.selectArea'
  | 'pricecard.selectSegment'
  | 'pricecard.area'
  | 'pricecard.segment'
  | 'pricecard.view'
  | 'pricecard.empty'
  | 'pricecard.baseFare'
  | 'promotions.title'
  | 'promotions.empty'
  | 'promotions.validUntil'
  | 'settings.title'
  | 'settings.language'
  | 'settings.theme'
  | 'settings.light'
  | 'settings.dark'
  | 'settings.autoplay'
  | 'settings.on'
  | 'settings.off'
  | 'settings.about'
  | 'settings.version'
  | 'settings.help'
  | 'common.active'
  | 'history.recent'
  | 'history.arrived'
  | 'history.accepted'
  | 'history.booked'
  | 'referral.validFrom'
  | 'referral.validTo'
  | 'rewards.usable'
  | 'rewards.unavailable'
  | 'rewards.noHistory'
  | 'subscriptions.noHistory'
  | 'family.add';

const DICTIONARY: Record<TranslationKey, string> = {
  'app.tagline': 'Fast, reliable on-demand services',
  'common.loading': 'Loading',
  'common.retry': 'Try again',
  'common.back': 'Back',
  'common.menu': 'Menu',
  'common.seconds': 's',
  'splash.fallbackTitle': 'Get fixed, fast',
  'splash.offline': 'You are offline',
  'install.title': 'Install the app',
  'install.cta': 'Install app',
  'install.installed': 'Running as an app',
  'install.android': 'Use the install button to add Fixcycle to your home screen.',
  'install.ios': 'On iPhone or iPad:',
  'install.iosSteps': 'Tap the Share button, then "Add to Home Screen".',
  'install.dismiss': 'Maybe later',
  'offline.title': 'No connection',
  'offline.message': 'Fixcycle needs the internet to load available services. Check your connection and try again.',
  'offline.reload': 'Try again',
  'devStatus.title': 'Developer status',
  'devStatus.lastChecked': 'Last API response',
  'devStatus.endpoint': 'API',
  'devStatus.environment': 'Environment',
  'devStatus.capabilities': 'Device capabilities',
  'devStatus.runtime': 'Runtime configuration',
  'login.title': 'Sign in',
  'login.phone': 'Phone number',
  'login.continue': 'Continue',
  'login.phaseNote': 'Login is scheduled for Phase 2. Authentication endpoints are already laid out.',
  'onboard.welcome': 'Welcome to',
  'onboard.subtitle': 'Book trusted services near you in seconds',
  'onboard.language': 'Language',
  'onboard.createAccount': 'Create an account',
  'onboard.skip': 'Skip',
  'onboard.next': 'Next',
  'onboard.done': 'Get started',
  'onboard.slide1Title': 'Trusted professionals',
  'onboard.slide1Body': 'Booking a home service is easy. We connect you with vetted experts nearby.',
  'onboard.slide2Title': 'Experts, verified',
  'onboard.slide2Body': 'Every professional is background-checked, reviewed and rated by real customers.',
  'onboard.slide3Title': 'Book in seconds',
  'onboard.slide3Body': 'Find, compare and book the right service fast — then relax, we handle the rest.',
  'auth.loading': 'Just a moment',
  'auth.phone': 'Phone number',
  'auth.phoneCode': 'Code',
  'auth.searchCountry': 'Search country or code',
  'auth.email': 'Email address',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm password',
  'auth.firstName': 'First name',
  'auth.lastName': 'Last name',
  'auth.gender': 'Gender',
  'auth.male': 'Male',
  'auth.female': 'Female',
  'auth.smoker': 'Smoking preference',
  'auth.smokerYes': 'Smoker',
  'auth.smokerNo': 'Non-smoker',
  'auth.referralCode': 'Referral code (optional)',
  'auth.networkCode': 'Network code',
  'auth.cpf': 'CPF number',
  'auth.otp': 'Verification code',
  'auth.otpHint': 'Enter the code we sent you',
  'auth.resendCode': 'Resend code',
  'auth.changeNumber': 'Use a different number',
  'auth.loginTitle': 'Sign in',
  'auth.loginSubtitle': 'Enter your phone number to continue',
  'auth.signupTitle': 'Create an account',
  'auth.signupSubtitle': 'Tell us who you are',
  'auth.forgotTitle': 'Reset password',
  'auth.forgotSubtitle': 'Enter your phone number to reset your password',
  'auth.continue': 'Continue',
  'auth.signIn': 'Sign in',
  'auth.signUp': 'Create account',
  'auth.sendCode': 'Send code',
  'auth.register': 'Register',
  'auth.verify': 'Verify',
  'auth.forgotLink': 'Forgot password?',
  'auth.newHere': 'New to Fixcycle?',
  'auth.haveAccount': 'Already have an account?',
  'auth.alreadyHaveAccount': 'Already have an account?',
  'auth.backToLogin': 'Back to sign in',
  'auth.firstNameRequired': 'Enter your first name.',
  'auth.smokerRequired': 'Select a smoking preference.',
  'auth.cpfRequired': 'Enter your CPF number.',
  'auth.networkCodeRequired': 'Enter the network code.',
  'auth.referralCodeRequired': 'Enter the referral code.',
  'auth.orContinueWith': 'or continue with',
  'auth.socialGoogle': 'Google',
  'auth.socialFacebook': 'Facebook',
  'auth.guest': 'Continue as guest',
  'auth.sessionExpired': 'Your session has ended. Please sign in again.',
  'auth.phoneRequired': 'Enter your phone number.',
  'auth.phoneInvalid': 'Enter a valid phone number for the selected country.',
  'auth.otpRequired': 'Enter the verification code.',
  'auth.passwordTooShort': 'Password must be at least 6 characters.',
  'auth.passwordMismatch': 'Passwords do not match.',
  'auth.somethingWentWrong': 'Something went wrong. Please try again.',
  'auth.invalidEmail': 'Enter a valid email address.',
  'home.welcome': 'Welcome',
  'home.guest': 'Guest',
  'home.signedInAs': 'Signed in as',
  'home.wallet': 'Wallet',
  'home.services': 'Services',
  'home.logout': 'Sign out',
  'home.signIn': 'Sign in',
  'cms.title': 'Page',
  'cms.notFound': 'This page does not exist.',
  'cms.loadFailed': 'Could not load this page right now.',
  'signup.subtitle': 'Create a free account to book trusted services near you',
  'signup.firstName': 'First name',
  'signup.lastName': 'Last name',
  'signup.gender': 'Gender',
  'signup.genderMale': 'Male',
  'signup.genderFemale': 'Female',
  'signup.confirmPassword': 'Confirm password',
  'signup.optional': 'optional',
  'signup.smoker': 'Smoker',
  'signup.nonSmoker': 'Non-smoker',
  'forgot.title': 'Reset password',
  'forgot.subtitle': 'Enter your number to receive a reset code',
  'forgot.newPassword': 'New password',
  'forgot.confirmPassword': 'Confirm new password',
  'forgot.resetButton': 'Reset password',
  'home.title': 'Fixcycle',
  'home.noContact': 'No contact on file',
  'home.location': 'Select location',
  'home.detectLocation': 'Detect my location',
  'home.searchPlaceholder': 'Search for a place',
  'home.searchPlaces': 'Search places',
  'home.chooseArea': 'Choose your area',
  'home.currentLocation': 'Current location',
  'home.useCurrentLocation': 'Use my current location',
  'home.locationDenied': 'Location permission is blocked. You can pick a city or area manually.',
  'home.locationUnavailable': 'Could not determine your location. Pick a city or area manually.',
  'home.selectCity': 'Select a city',
  'home.noResults': 'No results found',
  'home.allServices': 'All services',
  'home.viewAll': 'View all',
  'home.comingSoon': 'Coming soon',
  'home.addMoney': 'Add money',
  'home.addMoneyCta': 'Add money',
  'home.recommended': 'Recommended for you',
  'home.popularStores': 'Popular stores',
  'home.popularRestaurants': 'Popular restaurants',
  'home.popularPharmacies': 'Popular pharmacies',
  'home.popularLaundries': 'Popular laundries',
  'home.banners': 'Offers',
  'home.open': 'Open',
  'home.closed': 'Closed',
  'home.km': 'km',
  'home.min': 'min',
  'home.favourite': 'Favourite',
  'home.notifications': 'Notifications',
  'home.empty': 'Nothing here yet',
  'home.emptyMessage': 'No services are available in your area yet.',
  'home.noServiceTitle': 'Services unavailable',
  'home.noServiceMessage': 'We currently do not provide services in your selected area.',
  'home.noServiceAction': 'Change location',
  'home.loadFailed': 'Could not load the home screen.',
  'home.pullToRefresh': 'Pull to refresh',
  'home.offlineCache': 'Showing the last saved home screen. You are offline.',
  'home.drawer': 'Menu',
  'home.drawerHeader': 'Account',
  'home.drawerItems': 'Menu',
  'notifications.title': 'Notifications',
  'notifications.empty': 'No notifications yet.',
  'drawer.close': 'Close menu',
  'drawer.logout': 'Sign out',
  'drawer.logoutConfirm': 'Are you sure you want to sign out?',
  'wallet.title': 'Wallet',
  'wallet.balance': 'Balance',
  'wallet.unavailable': 'Wallet top-up uses cash or card for now. LencoPay arrives in a later release.',
  'store.title': 'Store',
  'store.placeholder': 'Store details are coming soon.',
  'store.bannerPlaceholder': 'This offer will open soon.',
  'ride.title': 'Ride',
  'ride.back': 'Back',
  'ride.pickup': 'Pickup',
  'ride.drop': 'Drop-off',
  'ride.dropOff': 'Drop-off',
  'ride.whereTo': 'Where to?',
  'ride.selectDrop': 'Select drop-off location',
  'ride.searchPlaceholder': 'Search for a destination',
  'ride.currentLocation': 'Use my current location',
  'ride.vehicles': 'Choose a vehicle',
  'ride.selectVehicle': 'Select a vehicle',
  'ride.driver': 'Driver',
  'ride.nearbyDrivers': 'Nearby drivers',
  'ride.driversOnMap': 'Available drivers nearby',
  'ride.estimateFare': 'Estimated fare',
  'ride.eta': 'Estimated time',
  'ride.chooseRide': 'Choose a ride',
  'ride.continue': 'Continue',
  'ride.confirm': 'Confirm',
  'ride.requestRide': 'Request ride',
  'ride.checkout': 'Checkout',
  'ride.fareSummary': 'Fare summary',
  'ride.payment': 'Payment',
  'ride.paymentMethod': 'Select payment method',
  'ride.cash': 'Cash',
  'ride.wallet': 'Wallet',
  'ride.card': 'Card',
  'ride.promo': 'Promo code',
  'ride.applyPromo': 'Apply',
  'ride.promoPlaceholder': 'Enter promo code',
  'ride.removePromo': 'Remove',
  'ride.addNotes': 'Add notes',
  'ride.notesPlaceholder': 'e.g. meet me at the main gate',
  'ride.babySeat': 'Baby seat',
  'ride.wheelChair': 'Wheelchair accessible',
  'ride.genderMatch': 'Driver gender match',
  'ride.noSeatCheck': 'No seat check',
  'ride.searching': 'Searching for driver',
  'ride.searchingForDriver': 'Finding the nearest available driver…',
  'ride.cancelSearch': 'Cancel ride request',
  'ride.driverAssigned': 'Driver is on the way',
  'ride.driverArriving': 'Driver has arrived',
  'ride.tripStarted': 'Trip has started',
  'ride.tripInProgress': 'Trip in progress',
  'ride.driverEnRoute': 'Driver is coming to your pickup',
  'ride.otp': 'Ride OTP',
  'ride.otpReady': 'Your ride is ready',
  'ride.otpHint': 'Share this code with your driver to start the trip.',
  'ride.call': 'Call',
  'ride.chat': 'Chat',
  'ride.sos': 'SOS',
  'ride.sosTitle': 'Emergency help',
  'ride.share': 'Share trip',
  'ride.cancel': 'Cancel',
  'ride.cancelRide': 'Cancel ride',
  'ride.cancelReasons': 'Why are you cancelling?',
  'ride.selectReason': 'Select a reason',
  'ride.cancelCharges': 'A cancellation charge may apply.',
  'ride.changeDrop': 'Change drop-off',
  'ride.showOtp': 'Show OTP',
  'ride.enRoute': 'En route',
  'ride.arriving': 'Arriving',
  'ride.confirmOtp': 'Confirm and start trip',
  'ride.rideComplete': 'Ride completed',
  'ride.receipt': 'Receipt',
  'ride.paymentReceived': 'Payment received',
  'ride.rateDriver': 'Rate driver',
  'ride.rateTitle': 'How was your ride?',
  'ride.rateSubtitle': 'Tap a star to rate your driver',
  'ride.addComment': 'Add a comment',
  'ride.commentPlaceholder': 'Share a few words about your trip',
  'ride.submit': 'Submit',
  'ride.tip': 'Tip',
  'ride.tipDriver': 'Tip your driver',
  'ride.tipAmount': 'Tip amount',
  'ride.thanks': 'Thank you for riding with us!',
  'ride.errSignedIn': 'Please sign in to book a ride.',
  'ride.errNetwork': 'Network error. Please try again.',
  'ride.errPickupDrop': 'Choose both a pickup and drop-off location.',
  'ride.errCheckout': 'Could not prepare your ride. Please try again.',
  'ride.errPayment': 'Could not update payment method.',
  'ride.errPromo': 'Could not apply that promo code.',
  'ride.errConfirm': 'Could not confirm your ride. Please try again.',
  'ride.errCancel': 'Could not cancel the ride.',
  'ride.errRate': 'Could not submit your rating.',
  'ride.errTip': 'Could not add the tip.',
  'ride.loading': 'Loading…',
  'ride.retry': 'Try again',
  'ride.stops': 'Stops',
  'ride.addStop': 'Add stop',
  'ride.otpRequired': 'Enter the OTP to start your trip',
'ride.noVehicles': 'No vehicles available right now.',
'ride.noDrivers': 'No drivers available nearby.',
'ride.rideNow': 'Ride now',
'ride.scheduleLater': 'Schedule for later',
'ride.laterDate': 'Date',
'ride.laterTime': 'Time',
'ride.chooseDate': 'Choose a date',
'ride.chooseTime': 'Choose a time',
'ride.scheduledTitle': 'Ride scheduled',
'ride.scheduledConfirmation': 'Your ride has been scheduled.',
'ride.scheduledFor': 'Scheduled for',
'ride.pendingRides': 'Scheduled rides',
'ride.noPendingRides': 'No scheduled rides yet.',
'ride.scheduleAnother': 'Schedule another ride',
'ride.done': 'Done',
'ride.errLaterFields': 'Please choose a date and time for your scheduled ride.',
'ride.variantTaxi': 'Taxi',
'ride.variantRental': 'Rental',
'ride.rentalHeading': 'Choose a rental car',
'ride.rentalSubtitle': 'Pick a vehicle and an hourly package.',
'ride.rentalChoosePackage': 'Choose a package',
'ride.rentalSelect': 'Select',
'ride.errRentalVehicle': 'Please select a rental vehicle.',
'ride.errRentalPackage': 'Please select a rental package.',
  'ride.variantOutstation': 'Outstation',
  'ride.outstationHeading': 'Choose your outstation ride',
  'ride.outstationSubtitle': 'Pick a car and a trip type.',
  'ride.outstationOneWay': 'One way',
  'ride.outstationRoundTrip': 'Round trip',
  'ride.outstationContinue': 'Continue',
  'ride.errOutstationVehicle': 'Please select an outstation vehicle.',
  'ride.errOutstationReturn': 'Please choose a return date and time.',
  'ride.rentalContinue': 'Continue',
  'ride.variantTransfer': 'Transfer',
  'ride.transferHeading': 'Choose your airport transfer',
  'ride.transferSubtitle': 'Pick a car and an hourly package.',
  'ride.transferChoosePackage': 'Choose package',
  'ride.transferContinue': 'Continue',
  'ride.errTransferVehicle': 'Please select a transfer vehicle.',
  'ride.errTransferPackage': 'Please choose an hourly package.',
  'ride.variantPool': 'Pool',
  'ride.poolHeading': 'Share your ride',
  'ride.poolSubtitle': 'Choose a vehicle and select seats.',
  'ride.poolSeats': 'seats available',
  'ride.poolRiders': 'Riders',
  'ride.poolContinue': 'Continue',
  'ride.errPoolVehicle': 'Please select a pool vehicle.',
  'ride.errPoolSeats': 'Please select at least 1 seat.',
  'delivery.title': 'Parcel Delivery',
  'delivery.back': 'Back',
  'delivery.subtitle': 'Send a parcel anywhere — choose a package size, pick a vehicle, and confirm.',
  'delivery.choosePackage': 'Choose a package',
  'delivery.packageWeight': 'Weight',
  'delivery.packageSize': 'Size',
  'delivery.selectPackage': 'Select',
  'delivery.chooseCategory': 'What are you sending?',
  'delivery.chooseProduct': 'Choose a product',
  'delivery.productPrice': 'Price',
  'delivery.chooseVehicle': 'Choose a delivery vehicle',
  'delivery.vehicleCapacity': 'Capacity',
  'delivery.selectVehicle': 'Select',
  'delivery.pickup': 'Pickup location',
  'delivery.pickupPlaceholder': 'Where are you sending from?',
  'delivery.dropPoints': 'Drop-off points',
  'delivery.dropLocation': 'Drop-off location',
  'delivery.contactName': 'Recipient name',
  'delivery.contactPhone': 'Recipient phone',
  'delivery.instruction': 'Delivery instruction (optional)',
  'delivery.addStop': 'Add stop',
  'delivery.removeStop': 'Remove',
  'delivery.continue': 'Continue',
  'delivery.estimateFare': 'Estimated fare',
  'delivery.fareSummary': 'Fare summary',
  'delivery.payment': 'Payment',
  'delivery.cash': 'Cash',
  'delivery.wallet': 'Wallet',
  'delivery.confirm': 'Confirm delivery',
  'delivery.confirmedTitle': 'Delivery booked',
  'delivery.successMessage': 'Your parcel is scheduled. A courier will reach out shortly.',
  'delivery.done': 'Done',
  'delivery.errNetwork': 'Network error. Please try again.',
  'delivery.errCheckout': 'Could not prepare your delivery. Please try again.',
  'delivery.errConfirm': 'Could not confirm your delivery. Please try again.',
  'delivery.loading': 'Loading…',
  'delivery.errPackage': 'Please select a package size.',
  'delivery.errProduct': 'Please choose a product.',
  'delivery.errVehicle': 'Please select a delivery vehicle.',
  'delivery.errDrop': 'Please enter at least one drop-off location.',
  'delivery.exploreServices': 'Explore more services',
  'food.title': 'Food Delivery',
  'food.subtitle': 'Fresh food from your favourite neighbourhood restaurants, delivered to your door.',
  'food.popularRestaurants': 'Popular restaurants',
  'food.allRestaurants': 'All restaurants',
  'food.open': 'Open',
  'food.closed': 'Closed',
  'food.min': 'min',
  'food.km': 'km',
  'food.minimumOrder': 'Minimum order',
  'food.deliveryFee': 'Delivery',
  'food.free': 'Free',
  'food.menu': 'Menu',
  'food.categories': 'Categories',
  'food.popularItems': 'Popular items',
  'food.add': 'Add',
  'food.added': 'Added',
  'food.customise': 'Customise item',
  'food.variant': 'Variant',
  'food.options': 'Options',
  'food.quantity': 'Quantity',
  'food.cart': 'Cart',
  'food.cartEmpty': 'Your cart is empty',
  'food.cartEmptyMessage': 'Add some dishes from a restaurant to get started.',
  'food.checkout': 'Checkout',
  'food.subtotal': 'Subtotal',
  'food.delivery': 'Delivery fee',
  'food.tax': 'Tax (GST)',
  'food.discount': 'Discount',
  'food.promoPlaceholder': 'Enter promo code',
  'food.apply': 'Apply',
  'food.promoApplied': 'Promo applied',
  'food.promoInvalid': 'Invalid promo code',
  'food.payment': 'Payment method',
  'food.cash': 'Cash',
  'food.wallet': 'Wallet',
  'food.deliveryMode': 'Delivery mode',
  'food.deliverHome': 'Deliver to home',
  'food.selfPickup': 'Self pickup',
  'food.address': 'Delivery address',
  'food.addressPlaceholder': 'Enter your delivery address',
  'food.placeOrder': 'Place order',
  'food.orderPlaced': 'Order placed',
  'food.orderPlacedMessage': 'Your order is on its way. Track it live below.',
  'food.trackOrder': 'Track order',
  'food.placed': 'Order placed',
  'food.inProcess': 'Being prepared',
  'food.driverAccepted': 'Driver on the way',
  'food.outForDelivery': 'Out for delivery',
  'food.delivered': 'Delivered',
  'food.estimatedArrival': 'Estimated arrival',
  'food.arrivingIn': 'arriving in',
  'food.cancelOrder': 'Cancel order',
  'food.cancelled': 'Cancelled',
  'food.myOrders': 'My orders',
  'food.active': 'Active',
  'food.past': 'Past',
  'food.orderNumber': 'Order',
  'food.reorder': 'Reorder',
  'food.rate': 'Rate',
  'food.rateTitle': 'Rate your order',
  'food.ratePlaceholder': 'Tell us how the food was (optional)',
  'food.submitRating': 'Submit rating',
  'food.chat': 'Chat with store',
  'food.chatPlaceholder': 'Type a message…',
  'food.send': 'Send',
  'food.chatTitle': 'Chat',
  'food.noOrders': 'No orders yet',
  'food.noOrdersMessage': 'Explore restaurants and place your first order.',
  'food.browseRestaurants': 'Browse restaurants',
  'food.loading': 'Loading…',
  'food.errStore': 'Could not load restaurants.',
  'food.errMenu': 'Could not load the menu.',
  'food.errCart': 'Could not load your cart.',
  'food.errCheckout': 'Could not prepare checkout.',
  'food.star': 'star',
  'food.stars': 'stars',
  'food.veg': 'Veg',
  'food.nonVeg': 'Non-veg',
  'food.todayClosed': 'Closed today',
  'food.closedMessage': 'This restaurant is currently closed.',
  'store.subtitle': 'Everything you need delivered to your door.',
  'store.stores': 'Stores',
  'store.open': 'Open',
  'store.closed': 'Closed',
  'store.min': 'min',
  'store.deliveryFee': 'Delivery',
  'store.free': 'Free',
  'store.minimumOrder': 'Minimum order',
  'store.categories': 'Categories',
  'store.aisles': 'Aisles',
  'store.search': 'Search',
  'store.searchPlaceholder': 'Search products',
  'store.noResults': 'No products found',
  'store.add': 'Add',
  'store.added': 'Added',
  'store.customise': 'Customise',
  'store.variant': 'Variant',
  'store.options': 'Options',
  'store.quantity': 'Quantity',
  'store.weight': 'Weight',
  'store.cart': 'Cart',
  'store.cartEmpty': 'Your cart is empty',
  'store.cartEmptyMessage': 'Add items from a store to get started.',
  'store.browseStores': 'Browse stores',
  'store.checkout': 'Checkout',
  'store.subtotal': 'Subtotal',
  'store.delivery': 'Delivery',
  'store.tax': 'Tax',
  'store.discount': 'Discount',
  'store.promoPlaceholder': 'Promo code',
  'store.apply': 'Apply',
  'store.promoApplied': 'Promo applied',
  'store.promoInvalid': 'Invalid promo code',
  'store.payment': 'Payment',
  'store.cash': 'Cash',
  'store.wallet': 'Wallet',
  'store.deliveryMode': 'Delivery mode',
  'store.deliverHome': 'Deliver home',
  'store.selfPickup': 'Self pickup',
  'store.address': 'Delivery address',
  'store.addressPlaceholder': 'Enter your delivery address',
  'store.timeSlot': 'Delivery slot',
  'store.timeSlotHint': 'Choose when you want this delivered',
  'store.noSlots': 'No slots available',
  'store.prescription': 'Upload prescription',
  'store.prescriptionHint': 'Pharmacy orders require a valid prescription.',
  'store.upload': 'Upload',
  'store.uploaded': 'Uploaded',
  'store.prescriptionRequired': 'Please upload a prescription',
  'store.placeOrder': 'Place order',
  'store.orderPlaced': 'Order placed',
  'store.trackOrder': 'Track order',
  'store.placed': 'Placed',
  'store.inProcess': 'In process',
  'store.driverAccepted': 'Driver accepted',
  'store.outForDelivery': 'Out for delivery',
  'store.delivered': 'Delivered',
  'store.cancelOrder': 'Cancel order',
  'store.cancelled': 'Cancelled',
  'store.myOrders': 'My orders',
  'store.active': 'Active',
  'store.past': 'Past',
  'store.orderNumber': 'Order',
  'store.reorder': 'Reorder',
  'store.rate': 'Rate',
  'store.rateTitle': 'Rate your order',
  'store.ratePlaceholder': 'Share your feedback',
  'store.submitRating': 'Submit',
  'store.chat': 'Chat',
  'store.chatTitle': 'Chat with store',
  'store.chatPlaceholder': 'Type a message',
  'store.send': 'Send',
  'store.noOrders': 'No orders yet',
  'store.noOrdersMessage': 'Your store orders will appear here.',
  'store.items': 'items',
  'store.loading': 'Loading',
  'store.errStore': 'Failed to load stores',
  'store.errMenu': 'Failed to load store',
  'store.errCart': 'Failed to update cart',
  'store.errCheckout': 'Checkout failed',
  'store.todayClosed': 'Closed today',
  'store.closedMessage': 'This store is currently closed.',
  'handyman.home': 'Handyman',
  'handyman.available': 'Available',
  'handyman.bookNow': 'Book Now',
  'handyman.findHandymen': 'Find Handymen',
  'handyman.selectProvider': 'Select',
  'handyman.bookHim': 'Book Now',
  'handyman.cart': 'Booking Cart',
  'handyman.cartEmpty': 'No services added yet',
  'handyman.cartEmptyMsg': 'Add a service to get started.',
  'handyman.checkout': 'Checkout',
  'handyman.confirmBooking': 'Confirm Booking',
  'handyman.myBookings': 'My Bookings',
  'handyman.trackOrder': 'Track',
  'handyman.rateProvider': 'Rate',
  'handyman.rateProviderTitle': 'Rate your experience',
  'handyman.workRequests': 'Work Requests',
  'handyman.postRequest': 'Post a Work Request',
  'handyman.cancelRequest': 'Cancel request',
  'handyman.deleteRequest': 'Delete',
  'handyman.fromPrice': 'From',
  'handyman.bids': 'bids',
  'handyman.accept': 'Accept',
  'handyman.counter': 'Counter',
  'handyman.address': 'Drop location',
  'laundry.home': 'Laundry',
  'laundry.popular': 'Popular Laundry',
  'laundry.outlets': 'Laundry Outlets',
  'laundry.viewOutlet': 'View Outlet',
  'laundry.services': 'Garment Care',
  'laundry.add': 'Add',
  'laundry.subtract': 'Subtract',
  'laundry.cart': 'Laundry Cart',
  'laundry.cartEmpty': 'No services added yet',
  'laundry.cartEmptyMsg': 'Add garments to start your order.',
  'laundry.pickup': 'Pickup Details',
  'laundry.homeDelivery': 'Home Delivery',
  'laundry.selfPickup': 'Self Pickup',
  'laundry.dropLocation': 'Drop location',
  'laundry.selectSlot': 'Select pickup slot',
  'laundry.checkout': 'Checkout',
  'laundry.promoCode': 'Promo code',
  'laundry.applyPromo': 'Apply',
  'laundry.placeOrder': 'Place Order',
  'laundry.myOrders': 'My Laundry Orders',
  'laundry.ongoing': 'Ongoing',
  'laundry.past': 'Past',
  'laundry.trackOrder': 'Track',
  'laundry.otpTitle': 'Verify OTP',
  'laundry.otpHint': 'Share this OTP at the counter to pick up your order',
  'laundry.verifyOtp': 'Verify',
  'laundry.cancelOrder': 'Cancel Order',
  'laundry.rateOutlet': 'Rate',
  'laundry.deliveryCharges': 'Delivery charges',
  'laundry.tax': 'Tax',
  'laundry.discount': 'Discount',
  'laundry.toPay': 'To Pay',
  'laundry.itemsCount': 'items',
  'laundry.estimateDelivery': 'Estimated delivery',
  'bus.home': 'Bus Booking',
  'bus.searchTitle': 'Search Bus Routes',
  'bus.fromLocation': 'From location',
  'bus.toLocation': 'To location',
  'bus.search': 'Search',
  'bus.searching': 'Searching...',
  'bus.routeResults': 'Routes Found',
  'bus.noRoutes': 'No routes found',
  'bus.selectRoute': 'Select Route',
  'bus.selectBoard': 'Select boarding',
  'bus.selectDrop': 'Select dropping',
  'bus.board': 'Boarding',
  'bus.drop': 'Dropping',
  'bus.availableBuses': 'Available Buses',
  'bus.noBuses': 'No buses found',
  'bus.seatMap': 'Seat Map',
  'bus.selectSeats': 'Select seats',
  'bus.available': 'Available',
  'bus.booked': 'Booked',
  'bus.selected': 'Selected',
  'bus.checkout': 'Checkout',
  'bus.paymentMethod': 'Payment method',
  'bus.confirmBooking': 'Confirm Booking',
  'bus.bookingConfirmed': 'Booking Confirmed',
  'bus.myBookings': 'My Bookings',
  'bus.upcoming': 'Upcoming',
  'bus.past': 'Past',
  'bus.noBookings': 'No bookings found',
  'bus.bookingDetail': 'Booking Detail',
  'bus.seatNumbers': 'Seats',
  'bus.seatCount': 'Seats',
  'bus.cancelBooking': 'Cancel Booking',
  'bus.totalSeats': 'Total seats',
  'bus.departure': 'Departure',
  'bus.arrival': 'Arrival',
  'bus.price': 'Price',
  'bus.seatsSelected': 'seats selected',
  'bus.routes': 'Routes',
  'bus.perSeat': '/ seat',
  'carpool.home': 'Carpooling',
  'carpool.searchTitle': 'Search Rides',
  'carpool.search': 'Search',
  'carpool.searching': 'Searching...',
  'carpool.noRides': 'No rides found',
  'carpool.availableRides': 'Available Rides',
  'carpool.offerRide': 'Offer a Ride',
  'carpool.offer': 'Offer',
  'carpool.bookRide': 'Book Ride',
  'carpool.book': 'Book',
  'carpool.seats': 'Seats',
  'carpool.perSeat': '/ seat',
  'carpool.driver': 'Driver',
  'carpool.vehicle': 'Vehicle',
  'carpool.myRides': 'My Rides',
  'carpool.offeredRides': 'Offered',
  'carpool.takenRides': 'Booked',
  'carpool.noOffered': 'No offered rides',
  'carpool.noTaken': 'No booked rides',
  'carpool.rideDetail': 'Ride Detail',
  'carpool.cancelRide': 'Cancel Ride',
  'carpool.cancelOffer': 'Cancel Offer',
  'carpool.rideDate': 'Ride date',
  'carpool.totalAmount': 'Total',
  'carpool.availableSeats': 'Available seats',
  'carpool.selectSeats': 'Select seats',
  'carpool.confirmBooking': 'Confirm Booking',
  'carpool.bookingConfirmed': 'Booking Confirmed',
  'carpool.vehicleMake': 'Make',
  'carpool.vehicleModel': 'Model',
  'carpool.vehicleColor': 'Color',
  'carpool.vehicleNumber': 'Number',
  'carpool.routePoints': 'Route',
  'carpool.dropNo': 'Stop',
  'carpool.distance': 'Distance',
  'carpool.finalCharges': 'Fare',
  'carpool.passenger': 'Passenger',
  'carpool.paymentAction': 'Payment',
  'carpool.paymentAction1': 'Pay Now',
  'carpool.paymentAction2': 'Pay to Driver',
  'carpool.paymentAction3': 'Pay After',
  'carpool.dashboard': 'Carpooling',
  'carpool.offerTitle': 'Offer a Ride',
  'carpool.offerSubtitle': 'Share your ride, earn extra',
  'carpool.offerVehicle': 'Select vehicle',
  'carpool.offerSeats': 'Available seats',
  'carpool.offerDateTime': 'Date & Time',
  'carpool.offerStart': 'Start location',
  'carpool.offerEnd': 'End location',
  'carpool.addRoutePoint': 'Add route point',
  'carpool.submitOffer': 'Submit Offer',
  'carpool.offerSuccess': 'Ride offered successfully',
  'account.title': 'Profile',
  'account.editProfile': 'Edit Profile',
  'account.profileSaved': 'Profile updated',
  'account.firstName': 'First name',
  'account.lastName': 'Last name',
  'account.email': 'Email',
  'account.phone': 'Phone',
  'account.gender': 'Gender',
  'account.save': 'Save',
  'account.changePassword': 'Change Password',
  'account.currentPassword': 'Current password',
  'account.newPassword': 'New password',
  'account.confirmNewPassword': 'Confirm new password',
  'account.passwordChanged': 'Password changed',
  'account.passwordMismatch': 'Passwords do not match',
  'account.documents': 'Documents',
  'account.documentsEmpty': 'No documents saved yet',
  'account.documentNumber': 'Document number',
  'account.expiryDate': 'Expiry date',
  'account.documentStatusApproved': 'Approved',
  'account.documentStatusPending': 'Pending',
  'account.addDocument': 'Add document',
  'account.deleteAccount': 'Delete Account',
  'account.deleteAccountConfirm': 'Are you sure you want to delete your account? This action cannot be undone.',
  'account.reason': 'Reason (optional)',
  'account.delete': 'Delete',
  'account.cancel': 'Cancel',
  'account.accountDeleted': 'Your account has been deleted',
  'account.referralCode': 'Referral code',
  'account.memberSince': 'Member since',
  'account.edit': 'Edit',
  'account.phoneCode': '+',
  'account.required': 'Required',
  'wallet.transactions': 'Transactions',
  'wallet.credit': 'Credit',
  'wallet.debit': 'Debit',
  'wallet.cashback': 'Cashback',
  'wallet.transferred': 'Transferred',
  'wallet.addMoney': 'Add Money',
  'wallet.amount': 'Amount',
  'wallet.paymentOption': 'Payment option',
  'wallet.cash': 'Cash',
  'wallet.moneyAdded': 'Money added to wallet',
  'wallet.addMoneyNote': 'Top-up is cash/test only for now. LencoPay arrives in a later release.',
  'wallet.transfer': 'Transfer',
  'wallet.transferTo': 'Transfer to',
  'wallet.searchUser': 'Search by phone or email',
  'wallet.searchUserPlaceholder': 'Phone or email',
  'wallet.userNotFound': 'No user found',
  'wallet.userFound': 'User found',
  'wallet.amountToTransfer': 'Amount to transfer',
  'wallet.transferSuccess': 'Amount transferred',
  'wallet.insufficientBalance': 'Insufficient balance',
  'wallet.cashout': 'Cashout',
  'wallet.cashoutRequest': 'Request cashout',
  'wallet.cashoutHistory': 'Cashout history',
  'wallet.cashoutMethod': 'Cashout method',
  'wallet.accountNumber': 'Account number',
  'wallet.cashoutSuccess': 'Cashout requested',
  'wallet.cashoutEmpty': 'No cashout history yet',
  'wallet.empty': 'Your wallet is empty',
  'wallet.noTransactions': 'No transactions yet',
  'history.title': 'My History',
  'history.active': 'Active',
  'history.past': 'Past',
  'history.all': 'All',
  'history.ride': 'Rides',
  'history.delivery': 'Delivery',
  'history.empty': 'No bookings found',
  'history.bookingDetails': 'Booking details',
  'history.status': 'Status',
  'history.driverName': 'Driver',
  'history.vehicle': 'Vehicle',
  'history.pickup': 'Pickup',
  'history.drop': 'Drop',
  'history.date': 'Date',
  'history.amount': 'Amount',
  'history.cancelled': 'Cancelled',
  'history.completed': 'Completed',
  'history.ongoing': 'Ongoing',
  'sos.title': 'SOS',
  'sos.contacts': 'Contacts',
  'sos.addContact': 'Add contact',
  'sos.name': 'Name',
  'sos.number': 'Number',
  'sos.add': 'Add',
  'sos.contactAdded': 'Contact added',
  'sos.contactDeleted': 'Contact deleted',
  'sos.confirmDelete': 'Delete this contact?',
  'sos.empty': 'No SOS contacts yet',
  'sos.emergency': 'Emergency',
  'sos.family': 'Family',
  'sos.request': 'Send SOS',
  'sos.requestConfirm': 'Send an SOS request with your current location?',
  'sos.requestSent': 'SOS request sent',
  'sos.sent': 'Sent',
  'favourites.title': 'Favourites',
  'favourites.drivers': 'Drivers',
  'favourites.locations': 'Locations',
  'favourites.stores': 'Stores',
  'favourites.empty': 'Nothing saved yet',
  'favourites.noDrivers': 'No favourite drivers',
  'favourites.noLocations': 'No favourite locations',
  'favourites.remove': 'Remove',
  'favourites.added': 'Added to favourites',
  'favourites.removed': 'Removed from favourites',
  'favourites.locationName': 'Location name',
  'favourites.address': 'Address',
  'favourites.save': 'Save',
  'favourites.locationAdded': 'Location saved',
  'favourites.locationDeleted': 'Location deleted',
  'family.title': 'Family',
  'family.addMember': 'Add member',
  'family.name': 'Name',
  'family.phone': 'Phone',
  'family.relationship': 'Relationship',
  'family.memberAdded': 'Member added',
  'family.memberDeleted': 'Member deleted',
  'family.empty': 'No family members yet',
  'family.confirmDelete': 'Remove this family member?',
  'referral.title': 'Refer & Earn',
  'referral.heading': 'Refer a friend',
  'referral.explanation': 'Share your referral code and both of you earn rewards.',
  'referral.yourCode': 'Your code',
  'referral.share': 'Share',
  'referral.copy': 'Copy',
  'referral.codeCopied': 'Code copied',
  'referral.shareText': 'Use my referral code',
  'referral.inactive': 'Referral program is unavailable right now',
  'rewards.title': 'Rewards',
  'rewards.points': 'Points',
  'rewards.home': 'Available',
  'rewards.redeem': 'Redeem',
  'rewards.redeemPoints': 'Redeem points',
  'rewards.pointsToRedeem': 'Points to redeem',
  'rewards.redeemed': 'Redeemed successfully',
  'rewards.gifts': 'Gifts',
  'rewards.giftRedeemed': 'Gift redeemed',
  'rewards.history': 'History',
  'rewards.empty': 'No rewards yet',
  'rewards.notEnough': 'Not enough points',
  'subscriptions.title': 'Subscriptions',
  'subscriptions.packages': 'Packages',
  'subscriptions.active': 'Active',
  'subscriptions.price': 'Price',
  'subscriptions.duration': 'Duration',
  'subscriptions.activate': 'Activate',
  'subscriptions.activated': 'Subscription activated',
  'subscriptions.history': 'History',
  'subscriptions.empty': 'No subscriptions available',
  'subscriptions.noActive': 'No active subscription',
  'chat.title': 'Live Chat',
  'chat.placeholder': 'Type a message…',
  'chat.send': 'Send',
  'chat.empty': 'No messages yet',
  'chat.you': 'You',
  'support.title': 'Support',
  'support.name': 'Name',
  'support.email': 'Email',
  'support.phone': 'Phone',
  'support.message': 'Message',
  'support.subject': 'Subject',
  'support.send': 'Send',
  'support.sent': 'Message sent',
  'support.channels': 'Contact us',
  'cards.title': 'My Cards',
  'cards.empty': 'No saved cards',
  'cards.addCard': 'Add card',
  'cards.deleteConfirm': 'Delete this card?',
  'cards.deleted': 'Card deleted',
  'cards.default': 'Default',
  'cards.displayOnly': 'Card management is display-only until LencoPay is enabled.',
  'pricecard.title': 'Price Card',
  'pricecard.selectArea': 'Select area',
  'pricecard.selectSegment': 'Select service',
  'pricecard.area': 'Area',
  'pricecard.segment': 'Service',
  'pricecard.view': 'View prices',
  'pricecard.empty': 'No pricing available',
  'pricecard.baseFare': 'Base Fare',
  'promotions.title': 'Promotions',
  'promotions.empty': 'No promotions right now',
  'promotions.validUntil': 'Valid until',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.light': 'Light',
  'settings.dark': 'Dark',
  'settings.autoplay': 'Auto-play videos',
  'settings.on': 'On',
  'settings.off': 'Off',
  'settings.about': 'About Fixcycle',
  'settings.version': 'Version',
  'settings.help': 'Help & Support',
  'common.active': 'Active',
  'history.recent': 'Recent',
  'history.arrived': 'Arrived',
  'history.accepted': 'Accepted',
  'history.booked': 'Booked',
  'referral.validFrom': 'Valid from',
  'referral.validTo': 'Valid to',
  'rewards.usable': 'Usable',
  'rewards.unavailable': 'Unavailable',
  'rewards.noHistory': 'No reward activity yet',
  'subscriptions.noHistory': 'No subscription history yet',
  'family.add': 'Add member',
};

export function t(key: TranslationKey, locale = 'en'): string {
  // Only English is bundled in Phase 1. Non-English locales fall back to English
  // until the getString translation API is wired in a later phase.
  void locale;
  return DICTIONARY[key];
}