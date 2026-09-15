export type TranslationKey =
  | 'app.tagline'
  | 'app.role'
  | 'app.version'
  | 'common.loading'
  | 'common.retry'
  | 'common.back'
  | 'common.cancel'
  | 'common.save'
  | 'common.submit'
  | 'common.confirm'
  | 'common.skip'
  | 'common.next'
  | 'common.status'
  | 'common.active'
  | 'common.past'
  | 'common.amount'
  | 'common.today'
  | 'common.empty'
  | 'common.view'
  | 'login.title'
  | 'login.welcome'
  | 'login.phone'
  | 'login.phonePlaceholder'
  | 'login.password'
  | 'login.passwordPlaceholder'
  | 'login.otp'
  | 'login.otpHint'
  | 'login.tabPassword'
  | 'login.tabOtp'
  | 'login.login'
  | 'login.sendOtp'
  | 'login.demo'
  | 'login.demoHint'
  | 'login.registerCta'
  | 'login.register'
  | 'login.invalidCredentials'
  | 'onboard.title'
  | 'onboard.subtitle'
  | 'onboard.step1Title'
  | 'onboard.step1Desc'
  | 'onboard.step2Title'
  | 'onboard.step2Desc'
  | 'onboard.step3Title'
  | 'onboard.step3Desc'
  | 'onboard.step5Title'
  | 'onboard.step5Desc'
  | 'onboard.step7Title'
  | 'onboard.step7Desc'
  | 'onboard.firstName'
  | 'onboard.lastName'
  | 'onboard.email'
  | 'onboard.model'
  | 'onboard.vehicleNumber'
  | 'onboard.vehicleColor'
  | 'onboard.selectSegment'
  | 'onboard.selectSlot'
  | 'onboard.saved'
  | 'pending.title'
  | 'pending.description'
  | 'pending.check'
  | 'pending.refresh'
  | 'main.title'
  | 'main.goOnline'
  | 'main.goOffline'
  | 'main.earnedToday'
  | 'main.tripsToday'
  | 'main.rating'
  | 'main.completeSteps'
  | 'main.completeStepsDesc'
  | 'main.preferences'
  | 'main.voiceAlert'
  | 'main.autoAccept'
  | 'main.radius'
  | 'main.locationNote'
  | 'main.onlineSince'
  | 'main.waiting'
  | 'main.offlineNote'
  | 'main.tools'
  | 'request.title'
  | 'request.newRequest'
  | 'request.pickup'
  | 'request.drop'
  | 'request.user'
  | 'request.amount'
  | 'request.accept'
  | 'request.reject'
  | 'request.distance'
  | 'request.eta'
  | 'trip.title'
  | 'trip.toPickup'
  | 'trip.arriveAtPickup'
  | 'trip.arrived'
  | 'trip.startTrip'
  | 'trip.picked'
  | 'trip.pickup'
  | 'trip.drop'
  | 'trip.customer'
  | 'trip.otp'
  | 'trip.navigate'
  | 'trip.end'
  | 'trip.payment'
  | 'trip.cash'
  | 'trip.confirmPayment'
  | 'trip.complete'
  | 'trip.completed'
  | 'trip.backOnline'
  | 'trip.rideOtp'
  | 'jobs.title'
  | 'jobs.empty'
  | 'jobs.viewDetails'
  | 'jobs.booking'
  | 'offline.title'
  | 'offline.description'
  | 'offline.retry'
  | 'documents.title'
  | 'documents.empty'
  | 'documents.add'
  | 'documents.personal'
  | 'documents.vehicle'
  | 'documents.segment'
  | 'documents.upload'
  | 'documents.select'
  | 'documents.docName'
  | 'documents.number'
  | 'documents.expired'
  | 'documents.docTypeLicence'
  | 'documents.docTypeId'
  | 'documents.docTypePhoto'
  | 'documents.vehicleSelect'
  | 'documents.segmentSelect'
  | 'documents.submitting'
  | 'documents.uploaded'
  | 'documents.approved'
  | 'documents.pending'
  | 'documents.rejected'
  | 'vehicles.title'
  | 'vehicles.empty'
  | 'vehicles.add'
  | 'vehicles.active'
  | 'vehicles.makeActive'
  | 'vehicles.inReview'
  | 'vehicles.pending'
  | 'vehicles.attach'
  | 'vehicles.attachHint'
  | 'vehicles.shareCode'
  | 'vehicles.attachBtn'
  | 'vehicles.type'
  | 'vehicles.make'
  | 'vehicles.model'
  | 'vehicles.number'
  | 'vehicles.color'
  | 'vehicles.seats'
  | 'vehicles.submit'
  | 'vehicles.otp'
  | 'vehicles.otpHint'
  | 'vehicles.verify'
  | 'vehicles.invalidOtp'
  | 'vehicles.added'
  | 'vehicles.attached'
  | 'segments.title'
  | 'segments.enrolled'
  | 'segments.notEnrolled'
  | 'segments.services'
  | 'segments.slots'
  | 'segments.gallery'
  | 'segments.save'
  | 'segments.saved'
  | 'segments.price'
  | 'segments.priceType'
  | 'segments.addPhoto'
  | 'segments.deletePhoto'
  | 'segments.chooseSlot'
  | 'segments.none'
  | 'earnings.title'
  | 'earnings.totalEarnings'
  | 'earnings.inWallet'
  | 'earnings.receivedCash'
  | 'earnings.wallet'
  | 'earnings.addMoney'
  | 'earnings.withdraw'
  | 'earnings.amount'
  | 'earnings.amountPlaceholder'
  | 'earnings.walletNote'
  | 'earnings.credit'
  | 'earnings.debit'
  | 'earnings.transactions'
  | 'earnings.empty'
  | 'earnings.gross'
  | 'earnings.commission'
  | 'earnings.net'
  | 'earnings.trips'
  | 'earnings.dayEarning'
  | 'earnings.cashout'
  | 'earnings.cashoutHint'
  | 'earnings.cashoutHistory'
  | 'earnings.cashoutPending'
  | 'earnings.cashoutDone'
  | 'earnings.done'
  | 'earnings.date'
  | 'subscriptions.title'
  | 'subscriptions.available'
  | 'subscriptions.history'
  | 'subscriptions.active'
  | 'subscriptions.activate'
  | 'subscriptions.maxTrips'
  | 'subscriptions.tripsWord'
  | 'subscriptions.duration'
  | 'subscriptions.used'
  | 'subscriptions.left'
  | 'subscriptions.empty'
  | 'subscriptions.noActive'
  | 'subscriptions.current'
  | 'subscriptions.plans'
  | 'subscriptions.carryForwarded'
  | 'subscriptions.maxTrip'
  | 'subscriptions.expires'
  | 'subscriptions.confirm'
  | 'subscriptions.payment'
  | 'subscriptions.pay'
  | 'subscriptions.walletOnly'
  | 'subscriptions.failed';

const DICTIONARY: Record<TranslationKey, string> = {
  'app.role': 'Driver',
  'app.tagline': 'Drive, serve and earn on your schedule',
  'app.version': 'Fixcycle Driver v1.0.0',
  'common.active': 'Active',
  'common.amount': 'Amount',
  'common.back': 'Back',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.empty': 'Nothing here yet',
  'common.loading': 'Loading',
  'common.next': 'Continue',
  'common.past': 'Past',
  'common.retry': 'Try again',
  'common.save': 'Save',
  'common.skip': 'Skip for now',
  'common.status': 'Status',
  'common.submit': 'Submit',
  'common.today': 'Today',
  'common.view': 'View',
  'login.demo': 'Try demo account',
  'login.demoHint': 'Instantly jump into the driver flow with a pre-approved profile',
  'login.invalidCredentials': 'Check your phone number and try again',
  'login.login': 'Sign in',
  'login.otp': 'Verification code',
  'login.otpHint': 'Enter the code sent to your phone',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'Enter your password',
  'login.phone': 'Phone number',
  'login.phonePlaceholder': 'e.g. +91 98765 43210',
  'login.register': 'Register as a driver',
  'login.registerCta': 'New to Fixcycle?',
  'login.sendOtp': 'Send code',
  'login.tabOtp': 'One-time code',
  'login.tabPassword': 'Password',
  'login.title': 'Fixcycle Driver',
  'login.welcome': 'Welcome back, driver',
  'main.autoAccept': 'Auto-accept requests',
  'main.completeSteps': 'Complete your sign-up',
  'main.completeStepsDesc': 'Finish a few quick steps before you can go online.',
  'main.earnedToday': 'Earned today',
  'main.goOffline': 'Go offline',
  'main.goOnline': 'Go online',
  'main.locationNote': 'Location is shared while you are online and driving',
  'main.offlineNote': 'You are offline. Go online to receive new requests.',
  'main.tools': 'Driver tools',
  'main.onlineSince': 'Online since',
  'main.preferences': 'Request preferences',
  'main.radius': 'Accept radius',
  'main.rating': 'Rating',
  'main.title': 'Fixcycle Driver',
  'main.tripsToday': 'Trips today',
  'main.voiceAlert': 'Voice alerts',
  'main.waiting': 'Waiting for a new request',
  'onboard.email': 'Email (optional)',
  'onboard.firstName': 'First name',
  'onboard.lastName': 'Last name',
  'onboard.model': 'Vehicle model',
  'onboard.saved': 'Saved',
  'onboard.selectSegment': 'Choose the services you want to provide',
  'onboard.selectSlot': 'Pick your availability slots',
  'onboard.step1Desc': 'Tell us who you are',
  'onboard.step1Title': 'Personal details',
  'onboard.step2Desc': 'Upload a valid ID and licence',
  'onboard.step2Title': 'Personal documents',
  'onboard.step3Desc': 'Add the vehicle you will drive',
  'onboard.step3Title': 'Vehicle details',
  'onboard.step5Desc': 'Pick the segments you serve',
  'onboard.step5Title': 'Your services',
  'onboard.step7Desc': 'Set when you are available',
  'onboard.step7Title': 'Availability',
  'onboard.subtitle': 'A few quick steps to start earning',
  'onboard.title': 'Driver sign-up',
  'onboard.vehicleColor': 'Vehicle colour',
  'onboard.vehicleNumber': 'Registration number',
  'offline.description': 'Fixcycle Driver needs a connection to receive requests.',
  'offline.retry': 'Retry',
  'offline.title': 'You are offline',
  'pending.check': 'We are reviewing your documents.',
  'pending.description': 'You will be able to go online as soon as your profile is approved.',
  'pending.refresh': 'Refresh status',
  'pending.title': 'Profile pending approval',
  'request.distance': 'Distance',
  'request.accept': 'Accept',
  'request.amount': 'Fare',
  'request.drop': 'Drop-off',
  'request.eta': 'ETA',
  'request.newRequest': 'New request',
  'request.pickup': 'Pick-up',
  'request.reject': 'Decline',
  'request.title': 'Incoming request',
  'request.user': 'Customer',
  'trip.arriveAtPickup': 'Arrive at pick-up',
  'trip.arrived': 'Arrived',
  'trip.backOnline': 'Back to dashboard',
  'trip.cash': 'Cash',
  'trip.complete': 'Complete trip',
  'trip.completed': 'Trip completed',
  'trip.confirmPayment': 'Confirm payment',
  'trip.customer': 'Customer',
  'trip.drop': 'Drop-off',
  'trip.end': 'End trip',
  'trip.navigate': 'Navigate',
  'trip.otp': 'OTP',
  'trip.payment': 'Payment',
  'trip.picked': 'Picked up',
  'trip.pickup': 'Pick-up',
  'trip.rideOtp': 'Trip code',
  'trip.startTrip': 'Start trip',
  'trip.title': 'Active trip',
  'trip.toPickup': 'Head to pick-up',
  'jobs.booking': 'Booking',
  'jobs.empty': 'No trips yet',
  'jobs.title': 'My trips',
  'jobs.viewDetails': 'View details',
  'documents.add': 'Add',
  'documents.approved': 'Approved',
  'documents.docName': 'Name',
  'documents.docTypeId': 'Identity card',
  'documents.docTypeLicence': 'Driving licence',
  'documents.docTypePhoto': 'Profile photo',
  'documents.empty': 'No documents uploaded yet',
  'documents.expired': 'Documents need attention',
  'documents.number': 'Number',
  'documents.pending': 'Pending',
  'documents.personal': 'Personal documents',
  'documents.rejected': 'Rejected',
  'documents.segment': 'Segment documents',
  'documents.segmentSelect': 'Segment',
  'documents.select': 'Choose a document',
  'documents.submitting': 'Uploading',
  'documents.title': 'Documents',
  'documents.upload': 'Upload',
  'documents.uploaded': 'Document submitted for review',
  'documents.vehicle': 'Vehicle documents',
  'documents.vehicleSelect': 'Vehicle',
  'vehicles.active': 'Active',
  'vehicles.add': 'Add vehicle',
  'vehicles.added': 'Vehicle submitted for approval',
  'vehicles.attach': 'Attach a vehicle',
  'vehicles.attachBtn': 'Attach',
  'vehicles.attachHint': 'Enter the share code from another driver',
  'vehicles.attached': 'Vehicle attached',
  'vehicles.color': 'Colour',
  'vehicles.empty': 'No vehicles added yet',
  'vehicles.inReview': 'Under review',
  'vehicles.invalidOtp': 'Wrong code, try again',
  'vehicles.make': 'Make',
  'vehicles.makeActive': 'Use this vehicle',
  'vehicles.model': 'Model',
  'vehicles.number': 'Registration number',
  'vehicles.otp': 'Verification code',
  'vehicles.otpHint': 'Enter the 4-digit code',
  'vehicles.pending': 'Pending approval',
  'vehicles.seats': 'Seats',
  'vehicles.shareCode': 'Share code',
  'vehicles.submit': 'Submit for review',
  'vehicles.title': 'Vehicles',
  'vehicles.type': 'Vehicle type',
  'vehicles.verify': 'Verify',
  'segments.addPhoto': 'Add photo',
  'segments.chooseSlot': 'Pick time slots',
  'segments.deletePhoto': 'Remove',
  'segments.enrolled': 'Enrolled',
  'segments.gallery': 'Gallery',
  'segments.none': 'No segments found',
  'segments.notEnrolled': 'Available',
  'segments.price': 'Price',
  'segments.priceType': 'Type',
  'segments.save': 'Save',
  'segments.saved': 'Saved',
  'segments.services': 'Services & pricing',
  'segments.slots': 'Availability',
  'segments.title': 'Services & segments',
  'earnings.addMoney': 'Add money',
  'earnings.amount': 'Amount',
  'earnings.amountPlaceholder': 'e.g. 100',
  'earnings.cashout': 'Cashout',
  'earnings.cashoutDone': 'Completed',
  'earnings.cashoutHint': 'Move wallet money to your bank account',
  'earnings.cashoutHistory': 'Cashout history',
  'earnings.cashoutPending': 'Pending',
  'earnings.commission': 'Commission',
  'earnings.credit': 'Credit',
  'earnings.dayEarning': 'Day earning',
  'earnings.debit': 'Debit',
  'earnings.done': 'Done',
  'earnings.empty': 'No transactions yet',
  'earnings.gross': 'Billed to customers',
  'earnings.inWallet': 'In wallet',
  'earnings.net': 'Net earnings',
  'earnings.receivedCash': 'Received cash',
  'earnings.title': 'Earnings',
  'earnings.totalEarnings': 'Total earnings',
  'earnings.transactions': 'Recent transactions',
  'earnings.trips': 'Trips',
  'earnings.wallet': 'Wallet balance',
  'earnings.walletNote': 'Add cash received in hand to your wallet',
  'earnings.withdraw': 'Withdraw',
  'earnings.date': 'Ref',
  'subscriptions.active': 'Active',
  'subscriptions.activate': 'Activate',
  'subscriptions.available': 'Available',
  'subscriptions.carryForwarded': 'Carry forwarded trips',
  'subscriptions.confirm': 'Confirm purchase',
  'subscriptions.current': 'Current package',
  'subscriptions.duration': 'Duration',
  'subscriptions.empty': 'No packages available',
  'subscriptions.expires': 'Expires',
  'subscriptions.failed': 'Activation failed, retry later',
  'subscriptions.history': 'History',
  'subscriptions.left': 'left',
  'subscriptions.maxTrip': 'Max trips',
  'subscriptions.maxTrips': 'Up to',
  'subscriptions.noActive': 'No active package',
  'subscriptions.pay': 'Pay',
  'subscriptions.payment': 'Payment method',
  'subscriptions.plans': 'Available packages',
  'subscriptions.title': 'Subscription packages',
  'subscriptions.tripsWord': 'trips',
  'subscriptions.used': 'used',
  'subscriptions.walletOnly': 'Wallet balance will be used at checkout.',
};

export function t(key: TranslationKey, locale = 'en'): string {
  // Only English is bundled in Phase 13. Non-English locales fall back to
  // English until the getString translation API is wired in a later phase.
  void locale;
  return DICTIONARY[key];
}