import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createInitialState } from '../../src/constants';

const args = new Set(process.argv.slice(2));
const isProductionSeed = args.has('--production');
const hasForceFlag = args.has('--force');

if (isProductionSeed) {
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
} else {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
}

const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  (isProductionSeed ? '' : 'demo-volta-local');

if (!projectId) {
  throw new Error(
    'Missing project id. Set GCLOUD_PROJECT or FIREBASE_PROJECT_ID before running a production seed.',
  );
}

if (isProductionSeed && !hasForceFlag) {
  throw new Error(
    'Production seed requires --force because it clears and rewrites Firestore collections.',
  );
}

initializeApp({
  projectId,
});

const auth = getAuth();
const db = getFirestore();

async function upsertUser(params: {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  role: 'passenger' | 'driver' | 'admin';
}) {
  try {
    await auth.getUser(params.uid);
    await auth.updateUser(params.uid, {
      email: params.email,
      password: params.password,
      displayName: params.displayName,
    });
  } catch {
    await auth.createUser({
      uid: params.uid,
      email: params.email,
      password: params.password,
      displayName: params.displayName,
    });
  }

  await auth.setCustomUserClaims(params.uid, { role: params.role });
}

async function clearCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((document) => {
    batch.delete(document.ref);
  });
  await batch.commit();
}

async function seed() {
  console.log(
    `Starting ${isProductionSeed ? 'production' : 'emulator'} seed for Firebase project "${projectId}".`,
  );

  const initial = createInitialState();
  const credentials = [
    {
      uid: 'admin-1',
      email: 'admin@volta.tn',
      password: 'admin123',
      displayName: 'Equipe Admin Volta',
      role: 'admin' as const,
    },
    {
      uid: 'passenger-1',
      email: 'imen@volta.tn',
      password: 'volta123',
      displayName: 'Imen Gharbi',
      role: 'passenger' as const,
    },
    {
      uid: 'driver-1',
      email: 'hamed@volta.tn',
      password: 'volta123',
      displayName: 'Hamed Trabelsi',
      role: 'driver' as const,
    },
    {
      uid: 'driver-2',
      email: 'salma.driver@volta.tn',
      password: 'volta123',
      displayName: 'Salma Ben Ali',
      role: 'driver' as const,
    },
    {
      uid: 'driver-3',
      email: 'mourad.driver@volta.tn',
      password: 'volta123',
      displayName: 'Mourad Jlassi',
      role: 'driver' as const,
    },
  ];

  for (const credential of credentials) {
    await upsertUser(credential);
  }

  for (const collectionName of [
    'users',
    'verificationRequests',
    'lines',
    'liveVehicles',
    'rides',
    'bookings',
    'tickets',
    'payments',
    'favorites',
    'nearbyTransport',
  ]) {
    await clearCollection(collectionName);
  }

  for (const user of initial.users) {
    await db.collection('users').doc(user.id).set({
      ...user,
      phone: user.phone ?? '',
      dateOfBirth: user.dateOfBirth ?? '',
      gender: user.gender ?? '',
      driverLineId: user.driverLineId ?? '',
      avatarColor: user.avatarColor ?? '#0040a1',
      rating: (user as { rating?: number }).rating ?? 4.7,
      completedTrips: (user as { completedTrips?: number }).completedTrips ?? 0,
      penaltyCount: (user as { penaltyCount?: number }).penaltyCount ?? 0,
    });
  }

  for (const request of initial.verificationRequests) {
    await db.collection('verificationRequests').doc(request.id).set({
      ...request,
      reviewedAt: request.reviewedAt ?? '',
      reviewedBy: request.reviewedBy ?? '',
      rejectionReason: request.rejectionReason ?? '',
      applicantName: request.applicantName ?? '',
      applicantEmail: request.applicantEmail ?? '',
      applicantPhone: request.applicantPhone ?? '',
    });
  }

  for (const line of initial.lines) {
    await db.collection('lines').doc(line.id).set(line);
  }

  for (const vehicle of initial.liveVehicles) {
    await db.collection('liveVehicles').doc(vehicle.id).set({
      ...vehicle,
      operatorUserId: vehicle.operatorUserId ?? '',
      updatedAt: new Date().toISOString(),
    });
  }

  for (const ride of initial.louageRides) {
    const driver = initial.users.find((user) => user.id === ride.driverUserId);
    await db.collection('rides').doc(ride.id).set({
      ...ride,
      driverName: driver?.fullName ?? '',
      vehiclePhotoPath: '',
      vehiclePhotoUrl: '',
      createdAt: new Date().toISOString(),
    });
  }

  for (const booking of initial.bookings) {
    await db.collection('bookings').doc(booking.id).set({
      ...booking,
      driverUserId: booking.driverUserId ?? '',
      lineId: booking.lineId ?? '',
      rideId: booking.rideId ?? '',
      paymentId: booking.paymentId ?? '',
      ticketId: booking.ticketId ?? '',
      refundStatus: booking.refundStatus ?? '',
      penaltyPercent: booking.penaltyPercent ?? 0,
      note: booking.note ?? '',
    });
  }

  for (const ticket of initial.tickets) {
    await db.collection('tickets').doc(ticket.id).set(ticket);
  }

  for (const payment of initial.payments) {
    await db.collection('payments').doc(payment.id).set({
      ...payment,
      driverUserId: payment.driverUserId ?? '',
    });
  }

  for (const favorite of initial.favorites) {
    await db.collection('favorites').doc(favorite.id).set(favorite);
  }

  for (const nearby of initial.nearbyTransport) {
    await db.collection('nearbyTransport').doc(nearby.id).set(nearby);
  }

  console.log(
    `Firebase seed complete for "${projectId}" (${initial.lines.length} lines, ${initial.louageRides.length} rides).`,
  );
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
