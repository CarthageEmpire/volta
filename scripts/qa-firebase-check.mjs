import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

const app = initializeApp({
  apiKey: 'demo-api-key',
  authDomain: 'demo-volta-local.firebaseapp.com',
  projectId: 'demo-volta-local',
  storageBucket: 'demo-volta-local.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:demo-volta-local',
});

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

const createCheckoutIntent = httpsCallable(functions, 'createCheckoutIntent');
const confirmPayment = httpsCallable(functions, 'confirmPayment');
const submitDriverVerification = httpsCallable(functions, 'submitDriverVerification');
const reviewDriverVerification = httpsCallable(functions, 'reviewDriverVerification');
const createRide = httpsCallable(functions, 'createRide');
const toggleDriverLiveSharing = httpsCallable(functions, 'toggleDriverLiveSharing');
const cancelPassengerBooking = httpsCallable(functions, 'cancelPassengerBooking');
const cancelDriverRide = httpsCallable(functions, 'cancelDriverRide');
const markRideAwaitingConfirmation = httpsCallable(functions, 'markRideAwaitingConfirmation');
const confirmRideCompletion = httpsCallable(functions, 'confirmRideCompletion');
const reportNoShow = httpsCallable(functions, 'reportNoShow');
const bootstrapUserProfile = httpsCallable(functions, 'bootstrapUserProfile');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function getBookingById(id) {
  const snap = await getDoc(doc(db, 'bookings', id));
  return snap.data();
}

async function getPaymentById(id) {
  const snap = await getDoc(doc(db, 'payments', id));
  return snap.data();
}

async function getRideById(id) {
  const snap = await getDoc(doc(db, 'rides', id));
  return snap.data();
}

async function main() {
  console.log('STEP passenger-login');
  await signInWithEmailAndPassword(auth, 'imen@volta.tn', 'volta123');

  console.log('STEP line-checkout');
  const lineCheckout = (
    await createCheckoutIntent({ kind: 'line_ticket', lineId: 'metro-m1' })
  ).data;
  assert(lineCheckout.kind === 'line_ticket', 'Line checkout should be created.');

  console.log('STEP line-payment');
  const linePayment = (
    await confirmPayment({ checkout: lineCheckout, provider: 'bank_card' })
  ).data;
  const lineBooking = await getBookingById(linePayment.bookingId);
  assert(lineBooking?.type === 'line_ticket', 'Line booking should be stored.');

  console.log('STEP louage-checkout');
  const rideBefore = (await getDoc(doc(db, 'rides', 'ride-1'))).data();
  const rideCheckout = (
    await createCheckoutIntent({ kind: 'louage_booking', rideId: 'ride-1' })
  ).data;
  console.log('STEP louage-payment');
  const louagePayment = (
    await confirmPayment({ checkout: rideCheckout, provider: 'konnect' })
  ).data;
  const rideAfterBooking = (await getDoc(doc(db, 'rides', 'ride-1'))).data();
  assert(
    Number(rideAfterBooking?.availableSeats) === Number(rideBefore?.availableSeats) - 1,
    'Louage booking should decrement seats.',
  );

  console.log('STEP passenger-cancel');
  await cancelPassengerBooking({ bookingId: louagePayment.bookingId });
  const cancelledBooking = await getBookingById(louagePayment.bookingId);
  const refundedPayment = await getPaymentById(cancelledBooking?.paymentId);
  const rideAfterCancellation = await getRideById('ride-1');
  assert(
    cancelledBooking?.status === 'cancelled_by_passenger',
    'Passenger cancellation should update booking status.',
  );
  assert(refundedPayment?.status === 'refunded', 'Eligible cancellation should refund payment.');
  assert(
    Number(rideAfterCancellation?.availableSeats) === Number(rideBefore?.availableSeats),
    'Ride seats should be restored after cancellation.',
  );
  await signOut(auth);

  console.log('STEP driver-login');
  await signInWithEmailAndPassword(auth, 'hamed@volta.tn', 'volta123');
  console.log('STEP driver-live-sharing');
  await toggleDriverLiveSharing({ enabled: true });
  const liveVehicle = (await getDoc(doc(db, 'liveVehicles', 'live-driver-1'))).data();
  assert(liveVehicle?.sharingEnabled === true, 'Driver live sharing should turn on.');

  console.log('STEP driver-create-ride');
  const departureAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const createdRide = (
    await createRide({
      departureCity: 'Tunis',
      destinationCity: 'Nabeul',
      departureAt,
      availableSeats: 4,
      priceTnd: 17,
      vehicleModel: 'Peugeot Boxer',
      plateNumber: '555 TUN 999',
      vehiclePhotoName: '',
      vehiclePhotoPath: '',
      vehiclePhotoUrl: '',
    })
  ).data;
  assert(createdRide?.status === 'scheduled', 'Driver should be able to create ride.');
  await signOut(auth);

  console.log('STEP passenger-book-driver-ride');
  await signInWithEmailAndPassword(auth, 'imen@volta.tn', 'volta123');
  const createdRideCheckout = (
    await createCheckoutIntent({ kind: 'louage_booking', rideId: createdRide.id })
  ).data;
  const createdRidePayment = (
    await confirmPayment({ checkout: createdRideCheckout, provider: 'flooss' })
  ).data;
  const createdRideBooking = await getBookingById(createdRidePayment.bookingId);
  assert(createdRideBooking?.status === 'confirmed', 'Passenger should be able to book a newly created ride.');
  await signOut(auth);

  console.log('STEP driver-mark-awaiting-confirmation');
  await signInWithEmailAndPassword(auth, 'hamed@volta.tn', 'volta123');
  await markRideAwaitingConfirmation({ bookingId: createdRidePayment.bookingId });
  const awaitingBooking = await getBookingById(createdRidePayment.bookingId);
  assert(
    awaitingBooking?.status === 'awaiting_passenger_confirmation',
    'Driver should be able to mark booking awaiting passenger confirmation.',
  );
  await signOut(auth);

  console.log('STEP passenger-confirm-completion');
  await signInWithEmailAndPassword(auth, 'imen@volta.tn', 'volta123');
  await confirmRideCompletion({ bookingId: createdRidePayment.bookingId });
  const completedBooking = await getBookingById(createdRidePayment.bookingId);
  const releasedPayment = await getPaymentById(completedBooking?.paymentId);
  assert(completedBooking?.status === 'completed', 'Passenger confirmation should complete the booking.');
  assert(
    releasedPayment?.payoutStatus === 'released',
    'Passenger confirmation should release the driver payout.',
  );

  console.log('STEP passenger-book-no-show-case');
  const noShowCheckout = (
    await createCheckoutIntent({ kind: 'louage_booking', rideId: 'ride-2' })
  ).data;
  const noShowPayment = (
    await confirmPayment({ checkout: noShowCheckout, provider: 'sps' })
  ).data;
  await signOut(auth);

  console.log('STEP driver-report-no-show');
  await signInWithEmailAndPassword(auth, 'hamed@volta.tn', 'volta123');
  await reportNoShow({ bookingId: noShowPayment.bookingId });
  const noShowBooking = await getBookingById(noShowPayment.bookingId);
  const noShowPaymentDoc = await getPaymentById(noShowBooking?.paymentId);
  assert(
    noShowBooking?.payoutStatus === 'eligible_with_proof',
    'No-show with live sharing should flag payout as eligible_with_proof.',
  );
  assert(
    noShowPaymentDoc?.payoutStatus === 'eligible_with_proof',
    'No-show payment should reflect eligible_with_proof payout.',
  );

  console.log('STEP driver-create-cancel-ride');
  const cancelRideDeparture = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
  const cancellableRide = (
    await createRide({
      departureCity: 'Tunis',
      destinationCity: 'Bizerte',
      departureAt: cancelRideDeparture,
      availableSeats: 4,
      priceTnd: 19,
      vehicleModel: 'Fiat Ducato',
      plateNumber: '777 TUN 321',
      vehiclePhotoName: '',
      vehiclePhotoPath: '',
      vehiclePhotoUrl: '',
    })
  ).data;
  await signOut(auth);

  console.log('STEP passenger-book-cancelled-ride');
  await signInWithEmailAndPassword(auth, 'imen@volta.tn', 'volta123');
  const cancellableRideCheckout = (
    await createCheckoutIntent({ kind: 'louage_booking', rideId: cancellableRide.id })
  ).data;
  const cancellableRidePayment = (
    await confirmPayment({ checkout: cancellableRideCheckout, provider: 'd17' })
  ).data;
  await signOut(auth);

  console.log('STEP driver-cancel-ride');
  await signInWithEmailAndPassword(auth, 'hamed@volta.tn', 'volta123');
  await cancelDriverRide({ rideId: cancellableRide.id });
  const driverCancelledBooking = await getBookingById(cancellableRidePayment.bookingId);
  const driverCancelledPayment = await getPaymentById(driverCancelledBooking?.paymentId);
  assert(
    driverCancelledBooking?.status === 'cancelled_by_driver',
    'Driver cancellation should update passenger booking status.',
  );
  assert(
    driverCancelledPayment?.status === 'refunded',
    'Driver cancellation should refund the related passenger payment.',
  );
  await signOut(auth);

  console.log('STEP qa-driver-signup');
  const signup = await createUserWithEmailAndPassword(auth, 'qa.driver@volta.tn', 'volta123');
  console.log('STEP qa-driver-bootstrap');
  await bootstrapUserProfile({
    role: 'driver',
    email: 'qa.driver@volta.tn',
    phone: '+21622000000',
    fullName: 'Qa Driver',
    city: 'Tunis',
  });
  await signup.user.getIdToken(true);
  console.log('STEP qa-driver-submit-verification');
  await submitDriverVerification({
    fullName: 'Qa Driver',
    dateOfBirth: '1995-05-12',
    gender: 'homme',
    cityOfResidence: 'Tunis',
    phone: '+21622000000',
    phoneVerified: true,
    documents: [
      {
        type: 'driving_license',
        name: 'permit.pdf',
        uploadedAt: new Date().toISOString(),
        storagePath: 'verificationDocuments/test/permit.pdf',
      },
      {
        type: 'national_id',
        name: 'cin.pdf',
        uploadedAt: new Date().toISOString(),
        storagePath: 'verificationDocuments/test/cin.pdf',
      },
      {
        type: 'vehicle_insurance',
        name: 'insurance.pdf',
        uploadedAt: new Date().toISOString(),
        storagePath: 'verificationDocuments/test/insurance.pdf',
      },
      {
        type: 'vehicle_registration',
        name: 'registration.pdf',
        uploadedAt: new Date().toISOString(),
        storagePath: 'verificationDocuments/test/registration.pdf',
      },
    ],
  });
  await signOut(auth);

  console.log('STEP admin-login');
  await signInWithEmailAndPassword(auth, 'admin@volta.tn', 'admin123');
  console.log('STEP admin-approve-verification');
  await reviewDriverVerification({
    requestId: `verification-${signup.user.uid}`,
    decision: 'approved',
  });
  const approvedUser = (await getDoc(doc(db, 'users', signup.user.uid))).data();
  assert(
    approvedUser?.verificationStatus === 'approved',
    'Admin approval should update driver status.',
  );

  await signOut(auth);
  console.log('QA_EMULATOR_FLOW_OK');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
